/* ============================================================
 * BULK MODE — Workout Reminders (V8)
 * ============================================================
 * تذكيرات قبل وقت التمرين المعتاد. ٣ طبقات احتياط:
 *   ١. Service Worker setTimeout (يعمل لو SW حيّ — حتى ١٢ ساعة)
 *   ٢. Local check on page load (دائماً يعمل لكن لما يفتح التطبيق)
 *   ٣. .ics export للتقويم الخارجي (احتياط نهائي مضمون)
 *
 * Prefs schema: {
 *   enabled, workoutTime ("HH:MM"), notifyBeforeMinutes,
 *   missedSessionEnabled, lastScheduledFor (ISO of last fire-at)
 * }
 *
 * ⚠️ iOS Safari لا يدعم Notification API خارج PWA installed.
 *    نعرض حالة الإذن في الـ UI ونعتمد على الـ local check + ICS.
 * ============================================================ */

const REMINDER_DEFAULTS={
  enabled:false,
  workoutTime:'21:30',
  notifyBeforeMinutes:15,
  missedSessionEnabled:true,
  lastScheduledFor:null
};

const REMINDER_NOTIFY_BEFORE_OPTIONS=[
  {value:5,  label:'٥ دقائق'},
  {value:15, label:'١٥ دقيقة'},
  {value:30, label:'٣٠ دقيقة'},
  {value:60, label:'ساعة'}
];

// ============ Storage ============
async function loadReminderPrefs(){
  try{
    const rec=await db.get('settings',KEYS.REMINDER_PREFS);
    if(rec && rec.value) return {...REMINDER_DEFAULTS, ...rec.value};
  }catch(e){}
  return {...REMINDER_DEFAULTS};
}

async function saveReminderPrefs(prefs){
  await db.put('settings',{key:KEYS.REMINDER_PREFS,value:{...prefs}});
}

// ============ Notification permission (UX-friendly) ============
function notificationPermissionState(){
  if(!('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'granted' | 'denied' | 'default'
}

async function requestNotificationPermission(){
  if(!('Notification' in window)) return false;
  if(Notification.permission==='granted') return true;
  if(Notification.permission==='denied') return false; // لا نسأل بعد رفض صريح
  try{
    const r=await Notification.requestPermission();
    return r==='granted';
  }catch(e){return false}
}

// ============ Date helpers ============
// يرجّع الـ Date الذي ستُطلق فيه التذكير (workoutTime - notifyBefore minutes)
// يتخطّى الأربعاء (راحة). يتقدّم لليوم التالي لو اليوم انتهى.
function getNextReminderFireDate(prefs){
  if(!prefs || !prefs.workoutTime) return null;
  const [h,m]=prefs.workoutTime.split(':').map(Number);
  const now=new Date();
  let target=new Date();
  target.setHours(h,m,0,0);
  target.setMinutes(target.getMinutes()-prefs.notifyBeforeMinutes);
  // لو الوقت اليوم انتهى، انتقل للغد
  if(target<=now) target.setDate(target.getDate()+1);
  // تخطّى الأربعاء (يوم الراحة في تقسيمنا)
  let safety=0;
  while(target.getDay()===3 && safety<10){
    target.setDate(target.getDate()+1);
    safety++;
  }
  return target;
}

// اسم اليوم التدريبي حسب الـ dayOfWeek
function getDayLabelByIdx(idx){
  if(typeof WEEKLY_SCHEDULE==='undefined') return '';
  const d=WEEKLY_SCHEDULE[idx];
  return d?d.type:'';
}

// ============ Schedule via Service Worker ============
async function scheduleNextReminder(){
  const prefs=await loadReminderPrefs();
  if(!prefs.enabled) return false;
  if(notificationPermissionState()!=='granted') return false;
  if(!('serviceWorker' in navigator)) return false;

  const reg=await navigator.serviceWorker.ready;
  if(!reg.active) return false;

  const fireAt=getNextReminderFireDate(prefs);
  if(!fireAt) return false;
  const delayMs=fireAt.getTime()-Date.now();
  if(delayMs<=0) return false;
  // SW setTimeout يموت لو الـ SW idle — نحدّ بـ ١٢ ساعة (السلوك العملي)
  if(delayMs>12*3600*1000){
    // الـ schedule القادمة بعيدة — page load في الغد يعيد المحاولة
    return false;
  }

  const dayIdx=fireAt.getDay();
  const dayLabel=getDayLabelByIdx(dayIdx)||'تمرين اليوم';
  const beforeTxt=prefs.notifyBeforeMinutes>=60?'ساعة':`${prefs.notifyBeforeMinutes} دقيقة`;

  reg.active.postMessage({
    type:'SCHEDULE_REMINDER',
    delayMs,
    fireAt:fireAt.getTime(),
    title:'⏰ موعد التمرين قريب',
    body:`جلسة ${dayLabel} بعد ${beforeTxt} — استعدّ!`,
    tag:'workout-reminder'
  });

  // احفظ آخر schedule لتفادي التكرار
  prefs.lastScheduledFor=fireAt.toISOString();
  await saveReminderPrefs(prefs);
  return true;
}

// ============ Local Fallback: فحص جلسة مفوّتة ============
// يُستدعى في init — لو اليوم يوم تدريب ومرّ وقت التمرين + ساعة بدون جلسة
async function checkMissedSession(){
  try{
    const prefs=await loadReminderPrefs();
    if(!prefs.missedSessionEnabled) return;

    const now=new Date();
    const dayIdx=now.getDay();
    if(dayIdx===3) return; // الأربعاء راحة

    const [h,m]=prefs.workoutTime.split(':').map(Number);
    const workoutTime=new Date(now);
    workoutTime.setHours(h,m,0,0);
    const cutoff=new Date(workoutTime);
    cutoff.setHours(cutoff.getHours()+1);
    if(now<cutoff) return; // لسّا ما فات الموعد

    // هل بدأ المستخدم جلسة اليوم؟
    const todayISO=now.toISOString().split('T')[0];
    const workouts=await db.getAll('workouts');
    const trainedToday=workouts.some(w=>w.date===todayISO);
    if(trainedToday) return;

    // هل في جلسة نشطة الآن (currentSession)؟
    const sessionRec=await db.get('settings',KEYS.CURRENT_SESSION);
    if(sessionRec && sessionRec.value) return; // جلسة شغّالة الآن

    // اعرض banner بزر مباشر
    const dayLabel=getDayLabelByIdx(dayIdx)||'اليوم';
    if(typeof showToast==='function'){
      setTimeout(()=>{
        showToast(`⏰ لم تبدأ جلسة ${dayLabel} بعد — افتح التمارين الآن؟`,'var(--org)',10000,{
          action:{label:'افتح',handler:()=>{
            const tab=document.querySelector('.nb[data-t="1"]');
            if(tab) tab.click();
            window.scrollTo({top:0,behavior:'smooth'});
          }}
        });
      },1800);
    }
  }catch(e){console.warn('checkMissedSession failed:',e)}
}

// ============ .ics Export (احتياط نهائي مضمون) ============
async function exportWorkoutICS(){
  const prefs=await loadReminderPrefs();
  const [h,m]=prefs.workoutTime.split(':').map(Number);
  if(typeof WEEKLY_SCHEDULE==='undefined'){
    if(typeof showToast==='function') showToast('⚠️ بيانات البرنامج غير متاحة','var(--red)');
    return;
  }

  // أيام التدريب (نتخطّى الأربعاء)
  const dayCodes=['SU','MO','TU','WE','TH','FR','SA'];
  const trainingDays=WEEKLY_SCHEDULE
    .map((d,i)=>({idx:i, code:dayCodes[i], type:d.type, cls:d.cls}))
    .filter(d=>d.cls!=='rest');

  // ابحث عن أول حدث لكل يوم (أحدث الأقرب في المستقبل)
  const now=new Date();
  const pad=n=>String(n).padStart(2,'0');
  const fmtDT=(d)=>`${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const stamp=fmtDT(new Date()); // DTSTAMP موحّد

  const events=trainingDays.map(d=>{
    const next=new Date(now);
    // اضبط ليكون اليوم المطلوب الأقرب
    const diff=(d.idx - now.getDay() + 7) % 7;
    next.setDate(now.getDate() + (diff===0 ? 0 : diff));
    next.setHours(h,m,0,0);
    // لو اليوم نفسه وانتهى الوقت → الأسبوع التالي
    if(next<=now) next.setDate(next.getDate()+7);
    const end=new Date(next);end.setHours(end.getHours()+1);
    const uid=`bulkmode-${d.code}-${Date.now()}-${d.idx}@bulkmode.local`;
    return `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${stamp}
SUMMARY:💪 BULK MODE — ${d.type}
DTSTART:${fmtDT(next)}
DTEND:${fmtDT(end)}
RRULE:FREQ=WEEKLY;BYDAY=${d.code};COUNT=12
DESCRIPTION:جلسة ${d.type} — افتح تطبيق BULK MODE\\nمدة متوقعة: 55 دقيقة
CATEGORIES:Fitness,Workout
END:VEVENT`;
  });

  const ics=`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BULK MODE//12-Week Program//AR
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:BULK MODE Workouts
${events.join('\n')}
END:VCALENDAR`;

  const blob=new Blob([ics],{type:'text/calendar;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=`bulkmode_calendar_${new Date().toISOString().split('T')[0]}.ics`;
  a.click();
  URL.revokeObjectURL(url);
  if(typeof showToast==='function'){
    showToast('📅 تم تحميل ملف التقويم — افتحه ليُضاف لتقويمك','var(--grn)',6000);
  }
}

// ============ UI Helpers ============
function reminderStatusText(){
  const state=notificationPermissionState();
  if(state==='unsupported') return {text:'⚠️ متصفحك لا يدعم الإشعارات — استخدم تصدير التقويم', cls:'rem-status-warn'};
  if(state==='denied') return {text:'❌ الإشعارات محظورة — فعّلها من إعدادات المتصفح', cls:'rem-status-error'};
  if(state==='granted') return {text:'✓ الإذن ممنوح — التذكيرات ستعمل', cls:'rem-status-ok'};
  return {text:'ℹ️ اضغط "احفظ" لطلب الإذن', cls:'rem-status-info'};
}

function updateReminderStatusDisplay(){
  const el=document.getElementById('remStatus');
  if(!el) return;
  const s=reminderStatusText();
  el.className='rem-status '+s.cls;
  el.textContent=s.text;
}

// ============ Save handler (يُستدعى من زر "احفظ التذكيرات") ============
async function saveReminders(){
  const enabledEl=document.getElementById('remEnabled');
  const timeEl=document.getElementById('remTime');
  const beforeEl=document.getElementById('remBefore');
  const missedEl=document.getElementById('remMissed');
  if(!enabledEl||!timeEl||!beforeEl||!missedEl) return;

  let enabled=enabledEl.checked;
  const workoutTime=timeEl.value||'21:30';
  const notifyBeforeMinutes=parseInt(beforeEl.value)||15;
  const missedSessionEnabled=missedEl.checked;

  // لو المستخدم فعّل التذكيرات، اطلب الإذن (لو ما طُلب من قبل)
  if(enabled){
    const state=notificationPermissionState();
    if(state==='default'){
      const granted=await requestNotificationPermission();
      if(!granted){
        if(typeof showToast==='function') showToast('⚠️ الإذن لم يُمنح — التذكيرات معطّلة (استخدم تصدير التقويم)','var(--org)',6000);
        enabled=false;
        enabledEl.checked=false;
      }
    }else if(state==='denied'){
      if(typeof showToast==='function') showToast('⚠️ الإشعارات محظورة من المتصفح — فعّلها يدوياً','var(--red)',6000);
      enabled=false;
      enabledEl.checked=false;
    }
  }

  const prefs={enabled, workoutTime, notifyBeforeMinutes, missedSessionEnabled, lastScheduledFor:null};
  await saveReminderPrefs(prefs);
  updateReminderStatusDisplay();

  if(enabled){
    const scheduled=await scheduleNextReminder();
    if(scheduled){
      if(typeof showToast==='function') showToast('✓ التذكيرات مُفعَّلة — الموعد القادم مجدول','var(--grn)');
    }else{
      if(typeof showToast==='function') showToast('✓ حُفظ — الموعد القادم بعيد، سيُجدول لاحقاً','var(--blue)');
    }
  }else{
    if(typeof showToast==='function') showToast('✓ تم حفظ إعدادات التذكيرات');
  }
}
