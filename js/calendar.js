/* ============================================================
 * BULK MODE — Calendar (3.7)
 * ============================================================
 * تقويم شهري يربط جدول البرنامج (PROGRAM_DATA) بسجل الجلسات (workouts):
 *  - كل خلية = يوم
 *  - شارة نوع اليوم من PROGRAM_DATA حسب dayOfWeek
 *  - لون الحالة:
 *      • أخضر  = مُنجز (workout مُسجّل في اليوم)
 *      • ذهبي  = اليوم (مجدول، لم يُكمل بعد)
 *      • أحمر  = مجدول وفات (لم يُسجّل وكان قبل اليوم)
 *      • رمادي = يوم راحة
 *      • أزرق  = إضافي (تمرّن في يوم مش مجدول له تمرين)
 *
 * تحديث تلقائي عند فتح التبويب أو بعد إنهاء جلسة.
 * ============================================================ */

const CAL_WEEKDAYS=['أحد','اثن','ثلا','أرب','خمي','جمع','سبت']; // index 0..6 = dayOfWeek

let _calCursor=null; // {year, month} حيث month: 0..11

function _calToday(){const d=new Date();d.setHours(0,0,0,0);return d}
function _calIsSameDay(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()}
function _calISODay(d){return d.toISOString().split('T')[0]}

// جدول البرنامج الفعّال — يحترم التخصيصات لو موجودة
function _calEffectiveDays(){
  if(typeof EFFECTIVE_PROGRAM!=='undefined' && EFFECTIVE_PROGRAM && EFFECTIVE_PROGRAM.days) return EFFECTIVE_PROGRAM.days;
  if(typeof PROGRAM_DATA!=='undefined' && PROGRAM_DATA.days) return PROGRAM_DATA.days;
  return [];
}

// إيجاد يوم البرنامج لـ weekday (0..6, sun=0)
function _calProgramDayFor(weekday){
  const days=_calEffectiveDays();
  return days.find(d=>d.dayOfWeek===weekday);
}

// شهرَّى عربية مختصرة
const CAL_AR_MONTHS=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function calendarPrevMonth(){
  if(!_calCursor) calendarToday();
  let m=_calCursor.month-1, y=_calCursor.year;
  if(m<0){m=11;y--}
  _calCursor={year:y,month:m};
  refreshCalendar();
}

function calendarNextMonth(){
  if(!_calCursor) calendarToday();
  let m=_calCursor.month+1, y=_calCursor.year;
  if(m>11){m=0;y++}
  _calCursor={year:y,month:m};
  refreshCalendar();
}

function calendarToday(){
  const t=_calToday();
  _calCursor={year:t.getFullYear(),month:t.getMonth()};
  refreshCalendar();
}

async function refreshCalendar(){
  if(!_calCursor) calendarToday();
  const grid=document.getElementById('calGrid');
  const wdRow=document.getElementById('calWeekdays');
  const title=document.getElementById('calTitle');
  if(!grid||!wdRow||!title) return;
  // عناوين أيام الأسبوع (أحد إلى سبت، RTL يعكسها تلقائياً عبر CSS)
  wdRow.innerHTML=CAL_WEEKDAYS.map(w=>`<div class="cal-wd">${w}</div>`).join('');

  const {year,month}=_calCursor;
  title.textContent=`${CAL_AR_MONTHS[month]} ${year}`;

  // اقرأ سجل الجلسات
  let workouts=[];
  try{
    if(typeof db!=='undefined' && db.getAll) workouts=await db.getAll('workouts');
  }catch(e){console.warn('Calendar: failed to load workouts',e)}
  // جدول ISO→workout للبحث السريع
  const workoutByDate={};
  for(const w of workouts){
    if(!w.startTime) continue;
    const ds=w.startTime.split('T')[0];
    if(!workoutByDate[ds]) workoutByDate[ds]=[];
    workoutByDate[ds].push(w);
  }

  const todayD=_calToday();
  const firstOfMonth=new Date(year,month,1);
  const startWd=firstOfMonth.getDay(); // 0..6 (sun=0)
  const daysInMonth=new Date(year,month+1,0).getDate();

  // ابنِ ٤٢ خلية (٦ أسابيع × ٧ أيام) — ابدأ من الأحد قبل أول الشهر
  const cells=[];
  // أول الشهر يبدأ في عمود startWd → نضع (startWd) خلايا فارغة قبل
  for(let i=0;i<startWd;i++){
    const dt=new Date(year,month,1-(startWd-i));
    cells.push({date:dt,inMonth:false});
  }
  for(let d=1;d<=daysInMonth;d++){
    cells.push({date:new Date(year,month,d),inMonth:true});
  }
  while(cells.length%7!==0){
    const last=cells[cells.length-1].date;
    const nx=new Date(last);nx.setDate(nx.getDate()+1);
    cells.push({date:nx,inMonth:false});
  }
  // امتداد لـ ٦ أسابيع لو ناقص
  while(cells.length<42){
    const last=cells[cells.length-1].date;
    const nx=new Date(last);nx.setDate(nx.getDate()+1);
    cells.push({date:nx,inMonth:false});
  }

  // احصائيات الشهر
  let scheduledCount=0, completedCount=0, restCount=0, missedCount=0, bonusCount=0;

  const cellHtml=cells.map(c=>{
    const dt=c.date;
    const wd=dt.getDay();
    const programDay=_calProgramDayFor(wd);
    const iso=_calISODay(dt);
    const dayWorkouts=workoutByDate[iso]||[];
    const isToday=_calIsSameDay(dt,todayD);
    const isPast=dt<todayD && !isToday;
    const isFuture=dt>todayD;
    const isRest=programDay && (programDay.isRest||programDay.type==='REST');
    let cls='cal-cell';
    let icon='';
    let badge='—';
    let badgeCls='';
    if(programDay){
      badge=programDay.shortName||programDay.tagLabel||'—';
      badgeCls=programDay.colorClass||'';
    }
    if(!c.inMonth){cls+=' cal-cell-out'}
    if(isToday) cls+=' cal-today';

    if(dayWorkouts.length>0){
      if(isRest){
        // تمرّن في يوم راحة → bonus
        cls+=' cal-bonus';icon='🔵';
        if(c.inMonth) bonusCount++;
      }else{
        cls+=' cal-done';icon='✓';
        if(c.inMonth) {completedCount++;scheduledCount++}
      }
    }else if(isRest){
      cls+=' cal-rest';icon='🧘';
      if(c.inMonth) restCount++;
    }else if(programDay){
      // مجدول لكن بدون workout
      if(isPast){
        cls+=' cal-missed';icon='⚠️';
        if(c.inMonth){missedCount++;scheduledCount++}
      }else if(isFuture){
        cls+=' cal-planned';icon='📌';
        if(c.inMonth) scheduledCount++;
      }else{
        // اليوم — مجدول ولم يُكمل بعد
        cls+=' cal-planned cal-today-marker';icon='⭐';
        if(c.inMonth) scheduledCount++;
      }
    }

    const day=dt.getDate();
    const titleAttr=programDay
      ?`${day}/${dt.getMonth()+1} — ${programDay.label||programDay.type||''}`
      :`${day}/${dt.getMonth()+1}`;
    const clickAttr=c.inMonth?`onclick="calendarShowDay('${iso}')"`:'';
    return `<div class="${cls}" data-iso="${iso}" data-weekday="${wd}" title="${escAttrCal(titleAttr)}" ${clickAttr}>
      <div class="cc-day">${day}</div>
      <div class="cc-badge ${badgeCls}">${escAttrCal(badge)}</div>
      <div class="cc-icon">${icon}</div>
    </div>`;
  }).join('');

  grid.innerHTML=cellHtml;

  // الإحصائيات السفلية
  const statsEl=document.getElementById('calStats');
  if(statsEl){
    const totalWorkoutDays=completedCount+bonusCount;
    const rate=scheduledCount?Math.round((completedCount/scheduledCount)*100):0;
    statsEl.innerHTML=`
      <div class="cs-item"><div class="cs-num">${totalWorkoutDays}</div><div class="cs-lbl">يوم تمرين</div></div>
      <div class="cs-item"${completedCount>0?' ':''}><div class="cs-num cs-done">${completedCount}/${scheduledCount}</div><div class="cs-lbl">مُنجز/مجدول</div></div>
      <div class="cs-item"><div class="cs-num cs-rate">${rate}%</div><div class="cs-lbl">معدل الالتزام</div></div>
      <div class="cs-item"><div class="cs-num cs-missed">${missedCount}</div><div class="cs-lbl">فات</div></div>
      <div class="cs-item"><div class="cs-num cs-rest">${restCount}</div><div class="cs-lbl">راحة</div></div>
      ${bonusCount>0?`<div class="cs-item"><div class="cs-num cs-bonus">${bonusCount}</div><div class="cs-lbl">إضافي</div></div>`:''}
    `;
  }

  // أخفِ تفاصيل اليوم لو ظاهرة من شهر سابق
  const detailCard=document.getElementById('calDetailCard');
  if(detailCard) detailCard.style.display='none';
}

function escAttrCal(s){return String(s==null?'':s).replace(/"/g,'&quot;').replace(/</g,'&lt;')}

async function calendarShowDay(iso){
  const card=document.getElementById('calDetailCard');
  const title=document.getElementById('calDetailTitle');
  const body=document.getElementById('calDetailBody');
  if(!card||!title||!body) return;
  const dt=new Date(iso+'T00:00:00');
  const wd=dt.getDay();
  const programDay=_calProgramDayFor(wd);
  const dayLabel=dt.toLocaleDateString('ar-SA',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  title.textContent=`📋 ${dayLabel}`;
  // اقرأ الجلسات لهذا اليوم
  let workouts=[];
  let sets=[];
  try{
    if(typeof db!=='undefined' && db.getAll){
      workouts=(await db.getAll('workouts')).filter(w=>w.startTime && w.startTime.split('T')[0]===iso);
      if(workouts.length){
        const ids=new Set(workouts.map(w=>w.id));
        sets=(await db.getAll('sets')).filter(s=>ids.has(s.workoutId));
      }
    }
  }catch(e){console.warn(e)}

  let html='';
  if(programDay){
    if(programDay.isRest||programDay.type==='REST'){
      html+=`<div class="cd-info cd-rest">🧘 <b>${programDay.label||'يوم راحة'}</b> — ${programDay.description||'يوم مخطط للراحة'}</div>`;
    }else{
      html+=`<div class="cd-info">📌 الجدول: <b>${programDay.type||programDay.label||'—'}</b>${programDay.description?` · <small>${programDay.description}</small>`:''}</div>`;
    }
  }
  if(workouts.length===0){
    if(programDay && !(programDay.isRest||programDay.type==='REST')){
      const today=_calToday();
      const isPast=dt<today && !_calIsSameDay(dt,today);
      html+=isPast
        ?`<div class="cd-empty cd-missed">⚠️ لم تُسجّل جلسة في هذا اليوم.</div>`
        :`<div class="cd-empty">لا توجد جلسات بعد.</div>`;
    }else if(!programDay){
      html+=`<div class="cd-empty">لا توجد جلسات.</div>`;
    }
  }else{
    const setsByWid={};
    sets.forEach(s=>{(setsByWid[s.workoutId]=setsByWid[s.workoutId]||[]).push(s)});
    for(const w of workouts){
      const ws=setsByWid[w.id]||[];
      const byEx={};
      ws.forEach(s=>{
        if(!byEx[s.exerciseName]) byEx[s.exerciseName]={sets:[],warmups:0};
        if(s.isWarmup){byEx[s.exerciseName].warmups++}
        else byEx[s.exerciseName].sets.push(`${s.weight}×${s.reps}${s.rpe?'@'+s.rpe:''}${s.isPR?' 🏆':''}`);
      });
      const exHtml=Object.entries(byEx).map(([ex,d])=>{
        const w=d.warmups?` <small class="cd-warmup">+${d.warmups}🔥</small>`:'';
        return `<div class="cd-ex"><b>${ex}</b>${w}<span>${d.sets.join(' · ')}</span></div>`;
      }).join('');
      const dur=typeof fmtDuration==='function'?fmtDuration(w.duration||0):(w.duration||0)+'s';
      html+=`<div class="cd-workout">
        <div class="cd-w-head">⏺ ${w.dayType||'جلسة'} · ⏱ ${dur} · 💪 ${w.setsCount||ws.length} سيت${w.prCount?' · 🏆 '+w.prCount:''}</div>
        ${w.notes?`<div class="cd-w-note">📝 ${escAttrCal(w.notes)}</div>`:''}
        ${exHtml}
      </div>`;
    }
  }
  body.innerHTML=html;
  card.style.display='';
  setTimeout(()=>card.scrollIntoView({behavior:'smooth',block:'nearest'}),50);
}
