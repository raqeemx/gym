// ============ INJECT TRACKING INPUTS (async) ============
// حقن خانات الإدخال داخل كل تمرين، مع جلب آخر سيت من IndexedDB
async function injectTrackingInputs(){
  const steps=document.querySelectorAll('.step:not(.rest):not(.warmup):not(.done)');

  // V7 (#13) — احسب: lastSessionBest (أفضل سيت من آخر جلسة) + allTimeBest (أعلى وزن في الكل)
  const allSets=await db.getAll('sets');
  const statsByName=computeLastBestByExercise(allSets);

  steps.forEach(step=>{
    const exName=getExerciseName(step);
    if(!exName) return;
    if(step.querySelector('.track-input')) return;

    const inputDiv=document.createElement('div');
    inputDiv.className='track-input';

    const exKey=exName.replace(/\s+/g,'_');
    const stats=statsByName[exName];
    const placeholderW=stats?stats.lastSessionBest.weight:'';
    const placeholderR=stats?stats.lastSessionBest.reps:'';

    inputDiv.innerHTML=`
      <label>كجم</label>
      <input type="number" inputmode="decimal" step="0.5" min="0" class="weight-input" data-ex="${exKey}" data-name="${exName}" placeholder="${placeholderW}">
      <label>تكرار</label>
      <input type="number" inputmode="numeric" step="1" min="0" class="reps-input" data-ex="${exKey}" placeholder="${placeholderR}">
      <span class="rpe-wrap" title="RPE اختياري — صعوبة السيت من 6 إلى 10">
        <select class="rpe-input">
          <option value="">RPE</option>
          <option value="6">6 (سهل)</option>
          <option value="7">7 (متوسط)</option>
          <option value="8">8 (صعب — 2 تكرار احتياط)</option>
          <option value="9">9 (صعب جداً — 1 تكرار احتياط)</option>
          <option value="10">10 (الفشل)</option>
        </select>
      </span>
      <span class="last" onclick="toggleLastBestView(this);event.stopPropagation()" title="اضغط للتبديل بين آخر جلسة وأفضل أداء">${renderLastBestText(stats)}</span>
      <button class="set-note-btn" onclick="promptSetNote(this);event.stopPropagation()" title="ملاحظة على السيت (اختياري)">📝</button>
      <button class="save-btn" onclick="saveSet(this);event.stopPropagation()">حفظ</button>
    `;
    step.querySelector('.step-body').appendChild(inputDiv);

    // V7 (#16) — اقتراح وزن السيت التالي بناءً على آخر أداء + نطاق التكرار
    // V7.3 — يمرّر RPE آخر سيت لاستخدام المنطق الجديد القائم على RPE
    if(stats && stats.lastSessionBest){
      const range=parseRepRange(step);
      const lastRpe=stats.lastSessionBest.rpe!=null?stats.lastSessionBest.rpe:null;
      const suggestion=computeProgression(stats.lastSessionBest,range,lastRpe);
      if(suggestion) injectProgressionHint(inputDiv,step,suggestion);
    }
  });
}

// V7 (#13) — يحسب من كل السيتات: أفضل سيت في آخر جلسة + أعلى وزن في الكل
// V7.3 — السيت يُحفظ كاملاً (بما فيه حقل rpe)، فـ lastSessionBest.rpe يصبح متاحاً للـ computeProgression
function computeLastBestByExercise(allSets){
  const byEx={};
  for(const s of allSets){
    if(!byEx[s.exerciseName]) byEx[s.exerciseName]={byWorkout:{}};
    const e=byEx[s.exerciseName];
    if(!e.byWorkout[s.workoutId]) e.byWorkout[s.workoutId]=[];
    e.byWorkout[s.workoutId].push(s);
  }
  const out={};
  for(const [exName,info] of Object.entries(byEx)){
    // أحدث جلسة عبر هذا التمرين
    let recentWid=null, recentTime=0;
    for(const [wid,sets] of Object.entries(info.byWorkout)){
      const t=Math.max(...sets.map(s=>new Date(s.timestamp).getTime()));
      if(t>recentTime){recentTime=t;recentWid=wid}
    }
    if(!recentWid) continue;
    const lastSessionSets=info.byWorkout[recentWid];
    // أفضل سيت في آخر جلسة (أعلى وزن، التكرار يفصل التعادل)
    // الـ object الكامل يُمرَّر — يشمل rpe و note و timestamp
    const lastSessionBest=lastSessionSets.reduce((best,s)=>{
      if(!best) return s;
      if(s.weight>best.weight) return s;
      if(s.weight===best.weight && s.reps>best.reps) return s;
      return best;
    },null);
    // أفضل سيت في كل التاريخ
    const all=Object.values(info.byWorkout).flat();
    const allTimeBest=all.reduce((best,s)=>{
      if(!best) return s;
      if(s.weight>best.weight) return s;
      if(s.weight===best.weight && s.reps>best.reps) return s;
      return best;
    },null);
    out[exName]={lastSessionBest,allTimeBest,lastSessionDate:lastSessionBest.date};
  }
  return out;
}

// V7 (#16) — تحويل الأرقام العربية إلى لاتينية
function arabicToLatinDigits(str){
  if(!str) return '';
  return str.replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
}

// V7 (#21) — توحيد الأرقام: عناصر البيانات (سيتات/تكرار/كجم/دقائق/جولات) بالأرقام اللاتينية
// النصوص الطبيعية (شرح، نصائح) تبقى بالعربية
function normalizeDataDigits(){
  // المُحدّدات التي تحوي بيانات قياسية يجب أن تكون لاتينية
  const dataSelectors=[
    '.ds-num',                  // أرقام day-summary
    '.ds-lbl',                  // labels في day-summary
    '.df',                      // وصف اليوم (e.g. "٢٢ سيت · ~٥٥ دقيقة")
    '.pmeta',                   // "4 جولات" في phase-bar
    '.step-info',               // "٨-١٠ تكرار · ١٠ كجم"
    '.dn',                      // اسم اليوم + شارة اليوم
    '.wt'                       // weekday-type tile labels
  ];
  document.querySelectorAll(dataSelectors.join(',')).forEach(el=>{
    // حافظ على عناصر child (مثل <span> أو <small>)
    const walk=(node)=>{
      if(node.nodeType===3){ // text node
        const t=node.nodeValue;
        if(/[٠-٩]/.test(t)) node.nodeValue=arabicToLatinDigits(t);
      }else if(node.nodeType===1){
        // تخطّى أي عنصر يحوي نص طبيعي طويل (وصف، نصائح)
        if(node.classList && (node.classList.contains('today-badge'))) return;
        for(const c of Array.from(node.childNodes)) walk(c);
      }
    };
    walk(el);
  });
}

// V7 (#16) — استخراج نطاق التكرارات من step-info (مثل "٨-١٠ تكرار" → {min:8,max:10})
// المعامل الثالث rpeHint اختياري — حالياً غير مستخدم في التحليل (لا RPE في step-info)
// لكن وُجد لتوحيد التوقيع مع computeProgression حسب طلب V7.3 RPE-aware
function parseRepRange(stepEl, _rpeHint){
  const info=stepEl.querySelector('.step-info');
  if(!info) return null;
  const txt=arabicToLatinDigits(info.textContent||'');
  const m=txt.match(/(\d+)\s*[-–—]\s*(\d+)\s*تكرار/);
  if(m) return {min:parseInt(m[1]),max:parseInt(m[2])};
  // نطاق مفتوح مثل "١٥-٢٠ تكرار" أو رقم واحد "٢٠ تكرار"
  const single=txt.match(/(\d+)\s*تكرار/);
  if(single){const n=parseInt(single[1]);return {min:n,max:n}}
  return null;
}

// V7.3 — اقتراح وزن السيت التالي مع وعي RPE
// المنطق:
//   • لو RPE موجود (٦-١٠): يستخدم RPE كإشارة أساسية للتقدّم
//     - RPE ≤7 (سهل)   → +٥ كجم
//     - RPE 8 (مثالي)  → +٢.٥ كجم
//     - RPE 9 (قريب من الفشل) → حافظ على نفس الوزن
//     - RPE 10 (الفشل) → -٢.٥ كجم
//   • لو RPE غير موجود: fallback للمنطق القديم بناءً على نطاق التكرار
//     - reps ≥ max → +٢.٥
//     - reps < min → -٢.٥
//     - داخل النطاق → بدون اقتراح
function computeProgression(lastSet, repRange, lastRpe){
  if(!lastSet || !repRange) return null;
  const rpe=(lastRpe!=null && lastRpe>=6 && lastRpe<=10)?lastRpe:null;

  // 🎯 المسار الجديد: RPE-aware
  if(rpe!=null){
    if(rpe<=7){
      return {
        suggestedWeight:Math.round((lastSet.weight+5)*10)/10,
        reason:`RPE ${rpe} (سهل عليك) — جرّب +٥كجم`,
        kind:'increase'
      };
    }
    if(rpe===8){
      return {
        suggestedWeight:Math.round((lastSet.weight+2.5)*10)/10,
        reason:`RPE 8 (مثالي) — جرّب +٢.٥كجم`,
        kind:'increase'
      };
    }
    if(rpe===9){
      return {
        suggestedWeight:lastSet.weight,
        reason:`RPE 9 (قريب من الفشل) — حافظ على نفس الوزن وحاول زيادة تكرار`,
        kind:'maintain'
      };
    }
    // rpe === 10
    return {
      suggestedWeight:Math.max(0,Math.round((lastSet.weight-2.5)*10)/10),
      reason:`RPE 10 (بلغت الفشل) — خفّف ٢.٥كجم للتعافي`,
      kind:'decrease'
    };
  }

  // 🔁 المسار القديم: بدون RPE — يعتمد على نطاق التكرار فقط
  if(lastSet.reps>=repRange.max){
    return {
      suggestedWeight:Math.round((lastSet.weight+2.5)*10)/10,
      reason:`أكملت ${lastSet.reps}/${repRange.max} بنجاح — جرّب +٢.٥كجم`,
      kind:'increase'
    };
  }
  if(lastSet.reps<repRange.min){
    return {
      suggestedWeight:Math.max(0,Math.round((lastSet.weight-2.5)*10)/10),
      reason:`آخر مرة ${lastSet.reps} تكرار فقط (الحد ${repRange.min}) — خفّف ٢.٥كجم`,
      kind:'decrease'
    };
  }
  return null;
}

// V7 (#16) — يحقن hint اقتراح التقدّم داخل track-input
function injectProgressionHint(trackDiv,stepEl,suggestion){
  // امسح أي hint سابق
  const oldHint=trackDiv.querySelector('.prog-hint');
  if(oldHint) oldHint.remove();
  if(!suggestion) return;
  const hint=document.createElement('div');
  hint.className='prog-hint';
  // V7.3 — أيقونة حسب نوع الاقتراح (3 أنواع: increase/decrease/maintain)
  const icon=suggestion.kind==='increase'?'📈'
            :suggestion.kind==='maintain'?'⏸️'
            :'⚠️';
  hint.innerHTML=`<span class="ph-icon">${icon}</span><span>${suggestion.reason} → <b>${suggestion.suggestedWeight}كجم</b></span><button class="ph-apply" onclick="applySuggestion(this,${suggestion.suggestedWeight});event.stopPropagation()">تطبيق</button>`;
  trackDiv.appendChild(hint);
  // اقترح كـ placeholder
  const wInput=trackDiv.querySelector('.weight-input');
  if(wInput){
    wInput.placeholder=suggestion.suggestedWeight;
    wInput.classList.add('suggested');
  }
}

// V7.3 — فتح prompt لإضافة/تعديل ملاحظة على السيت قبل الحفظ
function promptSetNote(btnEl){
  const trackDiv=btnEl.closest('.track-input');
  if(!trackDiv) return;
  const current=trackDiv.dataset.pendingNote||'';
  const note=prompt('ملاحظة على هذا السيت (مثلاً: شعرت بألم خفيف، أو وضع الجسم كان ممتاز):', current);
  if(note===null) return; // المستخدم ألغى
  const trimmed=note.trim();
  if(trimmed){
    trackDiv.dataset.pendingNote=trimmed;
    btnEl.classList.add('has-note');
    btnEl.title='الملاحظة: '+trimmed;
  }else{
    delete trackDiv.dataset.pendingNote;
    btnEl.classList.remove('has-note');
    btnEl.title='ملاحظة على السيت (اختياري)';
  }
}

// V7 (#16) — تطبيق الاقتراح في خانة الوزن
function applySuggestion(btnEl,weight){
  const trackDiv=btnEl.closest('.track-input');
  if(!trackDiv) return;
  const wInput=trackDiv.querySelector('.weight-input');
  if(wInput){
    wInput.value=weight;
    wInput.classList.remove('suggested');
    wInput.focus();
    // ركز خانة التكرار
    setTimeout(()=>{const r=trackDiv.querySelector('.reps-input');if(r) r.focus()},150);
  }
  const hint=trackDiv.querySelector('.prog-hint');
  if(hint) hint.remove();
}

// V7 (#13) — يولّد HTML لعنصر "آخر مرة" — V7.2 (#39): يعرض RPE لو موجود
function renderLastBestText(stats){
  if(!stats || !stats.lastSessionBest){
    return '<span class="last-view-last">سجّل أول مرة</span>';
  }
  const ls=stats.lastSessionBest;
  const bt=stats.allTimeBest;
  const rel=relativeDate(ls.timestamp||ls.date);
  const lsRpe=ls.rpe?` <span class="rpe-tag">@${ls.rpe}</span>`:'';
  const btRpe=bt && bt.rpe?` <span class="rpe-tag">@${bt.rpe}</span>`:'';
  const lastHtml=`<span class="last-view-last">آخر جلسة: <b>${ls.weight}كجم × ${ls.reps}</b>${lsRpe}<small>${rel}</small></span>`;
  const sameAsBest=bt && bt.weight===ls.weight && bt.reps===ls.reps;
  const bestHtml=sameAsBest
    ?`<span class="last-view-best" style="display:none">🏆 أفضل = آخر جلسة</span>`
    :`<span class="last-view-best" style="display:none">🏆 أفضل: <b>${bt.weight}كجم × ${bt.reps}</b>${btRpe}</span>`;
  return lastHtml+bestHtml+'<span class="flip-hint">⇄</span>';
}

// V7 (#13) — تبديل العرض بين "آخر جلسة" و "أفضل"
function toggleLastBestView(el){
  if(!el) return;
  const last=el.querySelector('.last-view-last');
  const best=el.querySelector('.last-view-best');
  if(!last || !best) return;
  const showingLast=last.style.display!=='none';
  last.style.display=showingLast?'none':'';
  best.style.display=showingLast?'':'none';
  el.classList.toggle('show-best',showingLast);
}

// V7 (#13) — يعيد بناء عنصر "آخر مرة" بعد حفظ سيت جديد
async function refreshLastBestDisplay(trackDiv,exName,newSet){
  const lastEl=trackDiv.querySelector('.last');
  if(!lastEl) return;
  // اجلب سيتات هذا التمرين (تشمل الجديد)
  const sets=await db.getAll('sets','exerciseName',exName);
  const stats=computeLastBestByExercise(sets)[exName];
  lastEl.innerHTML=renderLastBestText(stats);
  // إعادة ضبط حالة العرض للافتراضي (آخر جلسة)
  lastEl.classList.remove('show-best');
  // V7 (#16) — حدّث اقتراح السيت التالي بناءً على هذا السيت الجديد + اقترح في الستيبات الأشقّاء
  const step=trackDiv.closest('.step');
  refreshProgressionHintsForExercise(step,exName,stats);
}

// V7 (#16) — يحدّث اقتراح التقدّم للستيب الحالي + الستيبات التالية لنفس التمرين في نفس اليوم
function refreshProgressionHintsForExercise(currentStep,exName,stats){
  if(!currentStep || !stats || !stats.lastSessionBest) return;
  const dy=currentStep.closest('.dy');
  if(!dy) return;
  // اجمع كل الستيبات في نفس اليوم لنفس التمرين (ابتداءً من الستيب الحالي وما بعده)
  const allSteps=Array.from(dy.querySelectorAll('.step:not(.rest):not(.warmup)'));
  const startIdx=allSteps.indexOf(currentStep);
  if(startIdx<0) return;
  for(let i=startIdx;i<allSteps.length;i++){
    const step=allSteps[i];
    const orig=normalizeExName(step.dataset.original||getExerciseName(step));
    const targetOrig=normalizeExName(currentStep.dataset.original||getExerciseName(currentStep));
    if(orig!==targetOrig) continue;
    const trackDiv=step.querySelector('.track-input');
    if(!trackDiv) continue;
    // لا تغيّر السيت الذي تم حفظه للتو (تم تعطيل الاقتراح فيه)
    if(step.classList.contains('completed')){
      const oldHint=trackDiv.querySelector('.prog-hint');
      if(oldHint) oldHint.remove();
      continue;
    }
    const range=parseRepRange(step);
    // V7.3 — RPE-aware
    const lastRpe=stats.lastSessionBest.rpe!=null?stats.lastSessionBest.rpe:null;
    const suggestion=computeProgression(stats.lastSessionBest,range,lastRpe);
    injectProgressionHint(trackDiv,step,suggestion);
  }
}

// V7 (#13) — تحديث "آخر/أفضل" لاسم تمرين معيّن (للاستبدال/الاستعادة)
async function setLastBestForExName(lastEl,exName){
  if(!lastEl) return;
  const sets=await db.getAll('sets','exerciseName',exName);
  const stats=computeLastBestByExercise(sets)[exName];
  lastEl.innerHTML=renderLastBestText(stats);
  lastEl.classList.remove('show-best');
}

// V7 (#13) — تاريخ نسبي مختصر بالعربية
function relativeDate(iso){
  if(!iso) return '';
  const t=new Date(iso).getTime();
  const days=Math.floor((Date.now()-t)/86400000);
  if(days<=0) return 'اليوم';
  if(days===1) return 'أمس';
  if(days<7) return `قبل ${days} أيام`;
  if(days<30) return `قبل ${Math.floor(days/7)} أسبوع`;
  if(days<365) return `قبل ${Math.floor(days/30)} شهر`;
  return `قبل ${Math.floor(days/365)} سنة`;
}

// ============ INJECT SESSION CONTROLS PER DAY ============
// زر "بدء الجلسة" أعلى كل يوم (داخل المحتوى المطوي)
function injectSessionControls(){
  document.querySelectorAll('.dy').forEach(dy=>{
    const dbi=dy.querySelector('.dbi');
    if(!dbi || dbi.querySelector('.session-ctrl')) return;
    const dn=dy.querySelector('.dn');
    if(!dn) return;
    const dayType=dn.textContent.split('—')[0].trim();
    const ctrl=document.createElement('div');
    ctrl.className='session-ctrl';
    ctrl.innerHTML=`
      <button class="session-start-btn" data-day="${dayType}" onclick="onStartSession('${dayType.replace(/'/g,"\\'")}');event.stopPropagation()">▶ بدء الجلسة</button>
      <span class="session-ctrl-hint">سجّل سيتاتك ضمن جلسة لتُحسب المدة و الـ PRs</span>
    `;
    dbi.insertBefore(ctrl,dbi.firstChild);
  });
}

// ============ SESSION MANAGEMENT ============
// إدارة جلسة التمرين النشطة
let currentSession=null;
let sessionTimerId=null;

async function loadCurrentSession(){
  // V7 (#17) — استعد حالة minimize
  const m=await db.get('settings',KEYS.SESSION_MINIMIZED);
  SESSION_MINIMIZED=!!(m && m.value);
  const s=await db.get('settings',KEYS.CURRENT_SESSION);
  if(s && s.value){
    currentSession=s.value;
    updateSessionUI();
    startSessionTicker();
  }
}

async function onStartSession(dayType){
  if(currentSession){
    if(currentSession.dayType===dayType){
      if(!confirm('الجلسة الحالية بنفس اليوم. هل تريد إنهاءها؟')) return;
      await endSession();
      return;
    }
    if(!confirm(`لديك جلسة نشطة (${currentSession.dayType}). هل تريد إنهاءها وبدء ${dayType}؟`)) return;
    await endSession(true);
  }
  const nowISO=new Date().toISOString();
  currentSession={
    id:'w_'+Date.now(),
    dayType:dayType,
    date:nowISO.split('T')[0],
    startTime:nowISO,
    setsCount:0,totalVolume:0,prCount:0,
    prList:[],notes:''
  };
  await db.put('settings',{key:KEYS.CURRENT_SESSION,value:currentSession});
  // V7 #15 — احفظ تاريخ أول جلسة لو ما محفوظ بعد
  const first=await db.get('settings',KEYS.FIRST_WORKOUT);
  if(!first || !first.value){
    await db.put('settings',{key:KEYS.FIRST_WORKOUT,value:nowISO});
  }
  updateSessionUI();
  startSessionTicker();
  try{navigator.vibrate&&navigator.vibrate(80)}catch(e){}
  showToast('🔥 بدأت جلسة '+dayType);
  // اطلب إذن الإشعارات عند بدء أول جلسة (لمؤقت الراحة)
  requestNotifPermission();
}

function startSessionTicker(){
  if(sessionTimerId) clearInterval(sessionTimerId);
  const tick=()=>{
    if(!currentSession){clearInterval(sessionTimerId);return}
    const el=document.getElementById('sessElapsed');
    if(el){
      const ms=Date.now()-new Date(currentSession.startTime).getTime();
      const secs=Math.floor(ms/1000);
      el.textContent=fmtDuration(secs);
    }
    // V7 (#17) — حدّث الـ pill المصغّر أيضاً
    if(SESSION_MINIMIZED) updateSessionPillUI();
  };
  tick();
  sessionTimerId=setInterval(tick,1000);
  startHeartbeat(); // V7 #36 — heartbeat كل ٣٠ ث
}

// V7 (#36) — Heartbeat: يحفظ lastActiveAt كل ٣٠ ث أثناء الجلسة
// عند الفتح بعد انقطاع، يساعد في تحديد آخر نشاط فعلي
let heartbeatId=null;
function startHeartbeat(){
  stopHeartbeat();
  heartbeatId=setInterval(async()=>{
    if(currentSession){
      try{await db.put('settings',{key:KEYS.LAST_ACTIVE_AT,value:new Date().toISOString()})}catch(e){}
    }
  },30000);
  // إشارة فورية عند البدء
  if(currentSession){
    db.put('settings',{key:KEYS.LAST_ACTIVE_AT,value:new Date().toISOString()}).catch(()=>{});
  }
}
function stopHeartbeat(){
  if(heartbeatId){clearInterval(heartbeatId);heartbeatId=null}
}

// V7 (#36) — فحص جلسة معلّقة (مثلاً الجوال انطفأ في المنتصف)
async function checkSessionRecovery(){
  if(!currentSession) return;
  const last=await db.get('settings',KEYS.LAST_ACTIVE_AT);
  if(!last || !last.value) return;
  const lastTime=new Date(last.value).getTime();
  const diffMs=Date.now()-lastTime;
  const diffH=diffMs/3600000;
  if(diffH<4) return; // أقل من ٤ ساعات: طبيعي
  // أكثر من ٤ ساعات → اقترح إنهاء الجلسة على آخر نشاط
  const hoursTxt=diffH>=24?`${Math.floor(diffH/24)} يوم`:`${Math.floor(diffH)} ساعة`;
  const choice=confirm(`الجلسة (${currentSession.dayType}) معلّقة منذ ${hoursTxt}.\n\nأنهِها على آخر نشاط مسجّل؟\n(إلغاء = استمر في الجلسة)`);
  if(choice){
    // أنهِ الجلسة وضع endTime = lastActiveAt
    const savedEndTime=last.value;
    const duration=Math.round((new Date(savedEndTime)-new Date(currentSession.startTime))/1000);
    const workout={
      id:currentSession.id,
      date:currentSession.date,
      dayType:currentSession.dayType,
      startTime:currentSession.startTime,
      endTime:savedEndTime,duration:duration,
      totalVolume:currentSession.totalVolume,
      setsCount:currentSession.setsCount,
      prCount:currentSession.prCount,
      notes:'مستعادة تلقائياً من heartbeat'
    };
    await db.put('workouts',workout);
    currentSession=null;
    await db.put('settings',{key:KEYS.CURRENT_SESSION,value:null});
    if(sessionTimerId){clearInterval(sessionTimerId);sessionTimerId=null}
    stopHeartbeat();
    updateSessionUI();
    showToast(`✓ تم إنهاء الجلسة على آخر نشاط (مدة: ${fmtDuration(duration)})`,'var(--blue)',5000);
  }
}

function updateSessionUI(){
  const bar=document.getElementById('sessBar');
  const pill=document.getElementById('sessPill');
  const startBtns=document.querySelectorAll('.session-start-btn');
  if(currentSession){
    document.body.classList.add('sess-active');
    if(SESSION_MINIMIZED){
      bar.classList.remove('show');
      if(pill) pill.classList.add('show');
    }else{
      bar.classList.add('show');
      if(pill) pill.classList.remove('show');
    }
    document.getElementById('sessDayType').textContent=currentSession.dayType;
    document.getElementById('sessSetsCount').textContent=currentSession.setsCount;
    document.getElementById('sessPrCount').textContent=currentSession.prCount;
    updateSessionPillUI(); // V7 #17
    updateWeekUI(); // V7 #15 — حدّث شارة الأسبوع/deload
    startBtns.forEach(b=>{
      const dt=b.dataset.day;
      if(dt===currentSession.dayType){
        b.classList.add('active');
        b.textContent='⏺ الجلسة نشطة — إنهاء';
        b.onclick=(e)=>{e.stopPropagation();endSession()};
      }else{
        b.classList.remove('active');
        b.textContent='▶ بدء الجلسة';
        b.onclick=(e)=>{e.stopPropagation();onStartSession(dt)};
      }
    });
  }else{
    document.body.classList.remove('sess-active');
    document.body.classList.remove('sess-minimized'); // V7 #17
    bar.classList.remove('show');
    if(pill) pill.classList.remove('show'); // V7 #17
    startBtns.forEach(b=>{
      b.classList.remove('active');
      b.textContent='▶ بدء الجلسة';
      const dt=b.dataset.day;
      b.onclick=(e)=>{e.stopPropagation();onStartSession(dt)};
    });
    updateWeekUI(); // V7 #15 — أظهر الشارة العائمة بعد انتهاء الجلسة
  }
}

// ============ V7 — PROGRAM WEEK TRACKER (#15) ============
// يحسب رقم الأسبوع الحالي من تاريخ أول جلسة + يكشف deload (كل ٤ أسابيع)
async function computeProgramWeek(){
  // ابحث عن firstWorkoutDate في settings أولاً، وإلا احسبه من workouts
  const cached=await db.get('settings',KEYS.FIRST_WORKOUT);
  let firstISO=cached&&cached.value;
  if(!firstISO){
    const workouts=await db.getAll('workouts');
    if(!workouts.length) return null;
    const sorted=workouts.sort((a,b)=>a.startTime.localeCompare(b.startTime));
    firstISO=sorted[0].startTime;
    await db.put('settings',{key:KEYS.FIRST_WORKOUT,value:firstISO});
  }
  const first=new Date(firstISO);
  first.setHours(0,0,0,0);
  const now=new Date();now.setHours(0,0,0,0);
  const days=Math.floor((now-first)/86400000);
  if(days<0) return null;
  const rawWeek=Math.floor(days/7)+1;
  const week=Math.min(rawWeek,12);
  const isDeload=week>=4 && week%4===0;
  const month=Math.ceil(week/4);
  const finished=rawWeek>12;
  return {week,isDeload,month,rawWeek,finished};
}

// V7 (#17) — تصغير/تكبير شريط الجلسة
let SESSION_MINIMIZED=false;

async function toggleSessionMinimize(){
  SESSION_MINIMIZED=!SESSION_MINIMIZED;
  await db.put('settings',{key:KEYS.SESSION_MINIMIZED,value:SESSION_MINIMIZED});
  applySessionMinimizeUI();
}

function applySessionMinimizeUI(){
  const bar=document.getElementById('sessBar');
  const pill=document.getElementById('sessPill');
  if(!bar || !pill) return;
  // فقط لو في جلسة نشطة
  if(!currentSession){
    bar.classList.remove('show');
    pill.classList.remove('show');
    document.body.classList.remove('sess-minimized');
    return;
  }
  if(SESSION_MINIMIZED){
    bar.classList.remove('show');
    pill.classList.add('show');
    document.body.classList.add('sess-minimized');
    updateSessionPillUI();
  }else{
    bar.classList.add('show');
    pill.classList.remove('show');
    document.body.classList.remove('sess-minimized');
  }
}

function updateSessionPillUI(){
  if(!currentSession) return;
  const t=document.getElementById('sessPillTime');
  const s=document.getElementById('sessPillSets');
  if(t){
    const ms=Date.now()-new Date(currentSession.startTime).getTime();
    t.textContent=fmtDuration(Math.floor(ms/1000));
  }
  if(s) s.textContent=`${currentSession.setsCount} سيت`;
}

// V7 (#26) — Light/Dark theme toggle
async function applyTheme(theme){
  const root=document.documentElement;
  if(theme==='light') root.setAttribute('data-theme','light');
  else root.removeAttribute('data-theme');
  // حدّث label الزر
  const btn=document.getElementById('themeToggleBtn');
  if(btn) btn.innerHTML=theme==='light'?'🌑 الوضع المظلم':'🌙 الوضع المضيء';
  // حدّث meta theme-color للـ status bar في PWA
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta) meta.setAttribute('content',theme==='light'?'#A8862D':'#D4A853');
}

async function toggleTheme(){
  const root=document.documentElement;
  const current=root.getAttribute('data-theme')==='light'?'light':'dark';
  const next=current==='light'?'dark':'light';
  await db.put('settings',{key:KEYS.THEME,value:next});
  applyTheme(next);
  showToast(next==='light'?'🌞 تم التبديل للوضع المضيء':'🌙 تم التبديل للوضع المظلم','var(--g2)');
}

async function loadTheme(){
  try{
    const pref=await db.get('settings',KEYS.THEME);
    if(pref && pref.value){
      applyTheme(pref.value);
    }else{
      // قراءة prefers-color-scheme من النظام
      const sysLight=window.matchMedia('(prefers-color-scheme: light)').matches;
      applyTheme(sysLight?'light':'dark');
    }
  }catch(e){}
}

// V7 (#24) — طي الـ Hero بعد أول جلسة (تقليل الضوضاء للمستخدم العائد)
async function setupHeroCollapse(){
  const workouts=await db.getAll('workouts');
  const hero=document.getElementById('heroEl');
  if(!hero) return;
  // لو فيه جلسة واحدة على الأقل → أضف زر الطي
  if(workouts.length>0){
    hero.classList.add('has-data');
    // اقرأ التفضيل من settings
    const pref=await db.get('settings',KEYS.HERO_COLLAPSED);
    const collapsed=pref?pref.value:true; // بشكل افتراضي: مطوي بعد أول جلسة
    if(collapsed) hero.classList.add('collapsed');
    updateHeroCompactWeek();
  }else{
    hero.classList.remove('has-data','collapsed');
  }
}

async function toggleHero(){
  const hero=document.getElementById('heroEl');
  if(!hero) return;
  const nowCollapsed=!hero.classList.contains('collapsed');
  hero.classList.toggle('collapsed',nowCollapsed);
  await db.put('settings',{key:KEYS.HERO_COLLAPSED,value:nowCollapsed});
  if(nowCollapsed) updateHeroCompactWeek();
}

async function updateHeroCompactWeek(){
  const el=document.getElementById('heroCompactWeek');
  if(!el) return;
  const info=await computeProgramWeek();
  if(!info){el.textContent='ابدأ أول جلسة';return}
  el.textContent=info.finished?`🎉 أكملت 12 أسبوع`:`أسبوع ${info.week}/12 · شهر ${info.month}/3${info.isDeload?' · 🛟 deload':''}`;
}

async function updateWeekUI(){
  const info=await computeProgramWeek();
  // session bar pill
  const pill=document.getElementById('sessWeekPill');
  if(pill){
    if(!info){pill.style.display='none'}
    else{
      pill.style.display='inline-flex';
      pill.textContent=info.finished?`أكملت ١٢ أسبوع 🎉`:`أسبوع ${info.week}/12 · شهر ${info.month}/3`;
      pill.classList.toggle('deload',info.isDeload);
    }
  }
  // floating badge (يظهر عند عدم وجود جلسة نشطة)
  const float=document.getElementById('weekFloat');
  if(float){
    if(!info || currentSession){float.classList.remove('show')}
    else{
      float.classList.add('show');
      float.textContent=info.finished?`🎉 أكملت ١٢ أسبوع!`:`أسبوع ${info.week}/12${info.isDeload?' · deload':''}`;
      float.classList.toggle('deload',info.isDeload);
    }
  }
  // deload banner في تبويب تقدمي
  const banner=document.getElementById('deloadBanner');
  if(banner){
    banner.style.display=(info && info.isDeload)?'flex':'none';
  }
}

async function endSession(silent=false){
  if(!currentSession) return;
  const endTime=new Date().toISOString();
  const duration=Math.round((new Date(endTime)-new Date(currentSession.startTime))/1000);

  // احفظ الجلسة كـ workout كامل
  const workout={
    id:currentSession.id,
    date:currentSession.date,
    dayType:currentSession.dayType,
    startTime:currentSession.startTime,
    endTime:endTime,duration:duration,
    totalVolume:currentSession.totalVolume,
    setsCount:currentSession.setsCount,
    prCount:currentSession.prCount,
    notes:currentSession.notes||''
  };
  await db.put('workouts',workout);

  const finished={...currentSession,duration};
  currentSession=null;
  await db.put('settings',{key:KEYS.CURRENT_SESSION,value:null});
  if(sessionTimerId){clearInterval(sessionTimerId);sessionTimerId=null}
  stopHeartbeat(); // V7 #36
  updateSessionUI();

  // أزل علامات completed من السيتات
  document.querySelectorAll('.step.completed,.step.has-pr').forEach(s=>{
    s.classList.remove('completed','has-pr');
    const btn=s.querySelector('.save-btn');
    if(btn){btn.textContent='حفظ';btn.classList.remove('saved')}
  });

  if(!silent){
    showSessionSummary(finished);
    try{navigator.vibrate&&navigator.vibrate([100,50,200])}catch(e){}
  }
  // V7 (#24) — لو هذه أول جلسة، فعّل طي الـ Hero
  await setupHeroCollapse();
}

// V7.3 — يحتفظ بـ ID آخر workout مغلق لتحديث الملاحظات عند closeSummary
let _lastFinishedWorkoutId=null;

function showSessionSummary(s){
  _lastFinishedWorkoutId=s.id; // V7.3
  document.getElementById('summaryDay').textContent=s.dayType;
  const prsHtml=(s.prList&&s.prList.length)?
    `<div class="summary-prs">${s.prList.slice(0,10).map(p=>`<div class="summary-pr-item">🏆 ${p.exerciseName} — ${p.label}: <b>${p.value}</b></div>`).join('')}</div>`
    :'';
  const existingNote=(s.notes||'').replace(/"/g,'&quot;');
  document.getElementById('summaryBody').innerHTML=`
    <div class="summary-grid">
      <div class="summary-stat"><span class="ss-num">${fmtDuration(s.duration)}</span><span class="ss-lbl">مدة الجلسة</span></div>
      <div class="summary-stat"><span class="ss-num">${s.setsCount}</span><span class="ss-lbl">عدد السيتات</span></div>
      <div class="summary-stat"><span class="ss-num">${Math.round(s.totalVolume).toLocaleString('ar-SA')}</span><span class="ss-lbl">إجمالي الحجم</span></div>
      <div class="summary-stat ${s.prCount>0?'gold':''}"><span class="ss-num">${s.prCount}</span><span class="ss-lbl">🏆 أرقام قياسية</span></div>
    </div>
    ${prsHtml}
    <textarea class="session-note-textarea" id="sessionNoteInput" placeholder="📝 ملاحظة عن الجلسة (اختياري) — كيف كان شعورك؟ ألم؟ ملاحظات على الأوزان؟" rows="2">${existingNote}</textarea>
  `;
  document.getElementById('summaryModal').classList.add('open');
  document.body.style.overflow='hidden';
}

// V7.3 — closeSummary صار async ليحفظ الملاحظة في workout.notes
async function closeSummary(){
  const ta=document.getElementById('sessionNoteInput');
  const note=ta?ta.value.trim():'';
  if(_lastFinishedWorkoutId && note){
    try{
      const w=await db.get('workouts',_lastFinishedWorkoutId);
      if(w){
        w.notes=note;
        await db.put('workouts',w);
      }
    }catch(e){console.warn('Failed to save session note:',e)}
  }
  _lastFinishedWorkoutId=null;
  document.getElementById('summaryModal').classList.remove('open');
  document.body.style.overflow='';
}

// ============ PR DETECTION ============
// كشف الأرقام القياسية تلقائياً عند كل سيت محفوظ
const EPLEY=(w,r)=>w*(1+r/30);

async function detectPRs(setRec){
  const all=await db.getAll('sets','exerciseName',setRec.exerciseName);
  const prev=all.filter(s=>s.id!==setRec.id);
  const prs=[];

  // 1. Weight PR — أعلى وزن في التمرين
  const maxW=prev.length?Math.max(...prev.map(s=>s.weight)):0;
  if(setRec.weight>maxW) prs.push({type:'weight',value:setRec.weight,label:`أعلى وزن — ${setRec.weight}كجم`});

  // 2. Volume PR — أعلى حجم في سيت واحد
  const sv=setRec.weight*setRec.reps;
  const maxV=prev.length?Math.max(...prev.map(s=>s.weight*s.reps)):0;
  if(sv>maxV) prs.push({type:'volume',value:sv,label:`حجم سيت — ${sv}`});

  // 3. 1RM PR (معادلة Epley)
  const s1=EPLEY(setRec.weight,setRec.reps);
  const max1=prev.length?Math.max(...prev.map(s=>EPLEY(s.weight,s.reps))):0;
  if(s1>max1) prs.push({type:'1rm',value:Math.round(s1*10)/10,label:`1RM مقدّر — ${(Math.round(s1*10)/10)}كجم`});

  // 4. Rep PR — أعلى تكرار عند نفس الوزن
  const sameW=prev.filter(s=>s.weight===setRec.weight);
  if(sameW.length){
    const maxR=Math.max(...sameW.map(s=>s.reps));
    if(setRec.reps>maxR) prs.push({type:'reps',value:setRec.reps,label:`تكرار عند ${setRec.weight}كجم — ${setRec.reps}`});
  }

  // 5. V7.3 — Effort PR (RPE) — نفس الوزن × نفس التكرار لكن بـ RPE أقل
  // يعكس تحسّن القوة الحقيقية (السيت صار أسهل بنفس الحمل)
  if(setRec.rpe!=null){
    const sameWR=prev.filter(s=>
      s.weight===setRec.weight &&
      s.reps===setRec.reps &&
      s.rpe!=null
    );
    if(sameWR.length){
      const minRpe=Math.min(...sameWR.map(s=>s.rpe));
      if(setRec.rpe<minRpe){
        prs.push({
          type:'effort',
          value:setRec.rpe,
          label:`جهد أقل — ${setRec.weight}كجم × ${setRec.reps} @RPE ${setRec.rpe} (كان ${minRpe})`
        });
      }
    }
  }

  // احفظ كل PR في الـ store
  for(const pr of prs){
    await db.add('prs',{
      exerciseName:setRec.exerciseName,
      type:pr.type,value:pr.value,
      date:setRec.timestamp,setId:setRec.id
    });
  }
  return prs;
}

function celebratePR(prs,exName){
  const overlay=document.createElement('div');
  overlay.className='pr-flash';
  overlay.innerHTML=`
    <div class="pr-flash-inner">
      <div class="pr-flash-icon">🏆</div>
      <div class="pr-flash-title">رقم قياسي جديد!</div>
      <div class="pr-flash-ex">${exName}</div>
      <div class="pr-flash-prs">
        ${prs.map(p=>`<div class="pr-flash-item">${p.label}</div>`).join('')}
      </div>
    </div>
  `;
  overlay.onclick=()=>{overlay.classList.remove('show');setTimeout(()=>overlay.remove(),400)};
  document.body.appendChild(overlay);
  setTimeout(()=>overlay.classList.add('show'),50);
  try{navigator.vibrate&&navigator.vibrate([100,50,100,50,200])}catch(e){}
  setTimeout(()=>{overlay.classList.remove('show');setTimeout(()=>overlay.remove(),400)},3000);
}

// ============ SAVE SET ============
async function saveSet(btn){
  const trackDiv=btn.closest('.track-input');
  const step=btn.closest('.step');
  const weightInput=trackDiv.querySelector('.weight-input');
  const repsInput=trackDiv.querySelector('.reps-input');
  const rpeInput=trackDiv.querySelector('.rpe-input'); // V7.2 #39
  const weight=parseFloat(weightInput.value);
  const reps=parseInt(repsInput.value);
  const rpe=rpeInput && rpeInput.value?parseInt(rpeInput.value):null; // V7.2 #39
  const note=(trackDiv.dataset.pendingNote||'').trim()||null; // V7.3 — ملاحظة السيت
  const exName=weightInput.dataset.name;

  if(isNaN(weight)||isNaN(reps)||reps<=0){
    showToast('⚠️ أدخل وزن وتكرارات صحيحة','var(--red)');
    return;
  }

  const dayType=getDayLabel(step);

  // إذا ما في جلسة نشطة، ابدأ واحدة تلقائياً
  if(!currentSession){
    await onStartSession(dayType);
    if(!currentSession) return; // user cancelled
  }

  try{
    const now=new Date().toISOString();
    const setRec={
      workoutId:currentSession.id,
      exerciseName:exName,
      weight:weight,reps:reps,
      rpe:rpe, // V7.2 #39
      note:note, // V7.3 — ملاحظة اختيارية على السيت
      timestamp:now,
      date:now.split('T')[0],
      isPR:false,prType:null
    };
    const setId=await db.add('sets',setRec);
    setRec.id=setId;

    // حدّث إجماليات الجلسة
    currentSession.setsCount++;
    currentSession.totalVolume+=weight*reps;

    // سجل الاستبدال في التاريخ (لميزة الاقتراح الذكي)
    if(step.dataset.substitute && step.dataset.original){
      await logSubstitutionHistory(step.dataset.original,step.dataset.substitute);
    }

    // كشف الأرقام القياسية
    const prs=await detectPRs(setRec);
    if(prs.length){
      setRec.isPR=true;
      setRec.prType=prs.map(p=>p.type).join(',');
      await db.put('sets',setRec);
      currentSession.prCount+=prs.length;
      if(!currentSession.prList) currentSession.prList=[];
      prs.forEach(p=>currentSession.prList.push({...p,exerciseName:exName}));
    }
    await db.put('settings',{key:KEYS.CURRENT_SESSION,value:currentSession});
    updateSessionUI();

    // Feedback
    btn.textContent='✓ حُفظ';
    btn.classList.add('saved');
    step.classList.add('completed');
    if(prs.length) step.classList.add('has-pr');
    // V7.3 — نظّف الملاحظة المعلّقة بعد الحفظ (السيت التالي يبدأ نظيف)
    delete trackDiv.dataset.pendingNote;
    const noteBtn=trackDiv.querySelector('.set-note-btn');
    if(noteBtn) noteBtn.classList.remove('has-note');
    // V7 (#13) — أعد بناء عرض "آخر/أفضل" بالهيكل القابل للتبديل
    await refreshLastBestDisplay(trackDiv,exName,setRec);

    // V7 (#18) — السياق للـ undo
    const undoCtx={
      setId:setRec.id,
      setRec:{...setRec},
      prCount:prs.length,
      prs:[...prs],
      step,btn,trackDiv,exName
    };

    if(prs.length){
      celebratePR(prs,exName);
    }
    // V7 (#18) — toast مع زر تراجع (٥ ثواني)، حتى مع PR
    const baseMsg=prs.length
      ?`🏆 ${exName}: ${weight}كجم × ${reps} · ${prs.length} رقم قياسي`
      :`✓ ${exName}: ${weight}كجم × ${reps}`;
    showToast(baseMsg,prs.length?'var(--g2)':'var(--grn)',5000,{
      action:{label:'تراجع',handler:()=>undoSetSave(undoCtx)}
    });
    try{navigator.vibrate&&navigator.vibrate(prs.length?[80,40,80]:50)}catch(e){}

    // ابدأ مؤقت الراحة تلقائياً
    const restDur=getRestDuration(step);
    startAutoRest(restDur);

    setTimeout(()=>{btn.textContent='حفظ';btn.classList.remove('saved')},2000);
  }catch(e){
    console.error(e);
    showToast('⚠️ فشل الحفظ: '+e.message,'var(--red)');
  }
}

// V7 (#18) — التراجع عن حفظ سيت (يحذف من DB ويعكس عدّادات الجلسة)
async function undoSetSave(ctx){
  try{
    // ١. احذف السيت
    await db.delete('sets',ctx.setId);
    // ٢. احذف الـ PRs المرتبطة بهذا السيت
    if(ctx.prCount>0){
      const allPrs=await db.getAll('prs');
      for(const pr of allPrs){
        if(pr.setId===ctx.setId) await db.delete('prs',pr.id);
      }
    }
    // ٣. اعكس عدّادات الجلسة
    if(currentSession){
      currentSession.setsCount=Math.max(0,currentSession.setsCount-1);
      currentSession.totalVolume=Math.max(0,currentSession.totalVolume-ctx.setRec.weight*ctx.setRec.reps);
      currentSession.prCount=Math.max(0,currentSession.prCount-ctx.prCount);
      // أزل PRs من قائمة الجلسة (آخر prCount عناصر مضافة لهذا التمرين)
      if(ctx.prCount>0 && currentSession.prList){
        // أزل آخر ctx.prCount عناصر مطابقة لنفس التمرين
        for(let i=0;i<ctx.prCount;i++){
          const idx=currentSession.prList.findIndex(p=>p.exerciseName===ctx.exName);
          if(idx>=0) currentSession.prList.splice(idx,1);
        }
      }
      await db.put('settings',{key:KEYS.CURRENT_SESSION,value:currentSession});
      updateSessionUI();
    }
    // ٤. استعد واجهة الستيب + بيانات الإدخال (V7.3 — يشمل الملاحظة)
    ctx.step.classList.remove('completed','has-pr');
    if(ctx.btn){ctx.btn.textContent='حفظ';ctx.btn.classList.remove('saved')}
    // استعد قيم الإدخال (وزن، تكرار، RPE، ملاحظة) ليقدر المستخدم يعدّل ويعيد الحفظ
    const wIn=ctx.trackDiv.querySelector('.weight-input');
    const rIn=ctx.trackDiv.querySelector('.reps-input');
    const rpeIn=ctx.trackDiv.querySelector('.rpe-input');
    const noteBtn=ctx.trackDiv.querySelector('.set-note-btn');
    if(wIn) wIn.value=ctx.setRec.weight;
    if(rIn) rIn.value=ctx.setRec.reps;
    if(rpeIn && ctx.setRec.rpe) rpeIn.value=ctx.setRec.rpe;
    if(ctx.setRec.note){
      ctx.trackDiv.dataset.pendingNote=ctx.setRec.note;
      if(noteBtn){noteBtn.classList.add('has-note');noteBtn.title='الملاحظة: '+ctx.setRec.note}
    }
    // ٥. حدّث "آخر/أفضل"
    await refreshLastBestDisplay(ctx.trackDiv,ctx.exName,null);
    // ٦. أوقف مؤقت الراحة لو شغّال
    if(typeof skipT==='function' && REST && REST.active){skipT()}
    showToast('↩ تم التراجع — البيانات في الإدخال','var(--blue)',2500);
    try{navigator.vibrate&&navigator.vibrate([20,40,20])}catch(e){}
  }catch(e){
    console.error('Undo failed:',e);
    showToast('⚠️ فشل التراجع','var(--red)');
  }
}

// ============ REST DURATION DETECTION ============
function getRestDuration(step){
  // ابحث عن الـ "step.rest" التالي وحاول استخراج عدد الثواني من نصه
  let next=step.nextElementSibling;
  let hops=0;
  while(next && hops<3){
    if(next.classList && next.classList.contains('rest')){
      const info=(next.querySelector('.step-info')||next.querySelector('.step-name')||{}).textContent||'';
      const m=info.match(/(\d+)\s*ث/);
      if(m) return parseInt(m[1]);
      break;
    }
    next=next.nextElementSibling;
    hops++;
  }
  // افتراضي: SOLO = 90, paired = 60
  return step.classList.contains('solo-set')?90:60;
}

// ============ ENHANCED REST TIMER ============
// مؤقت يعمل بالـ timestamps (لا يتأثر بخمول التاب) + إشعارات + اهتزاز
const tDel=()=>document.getElementById('tD');
const tFl=()=>document.getElementById('tF');
const tTr=()=>document.getElementById('tTrig');
const tSb=()=>document.getElementById('tS');

const REST={
  active:false,
  endTime:0,
  defaultDur:90,
  intervalId:null,
  audioCtx:null
};

function showT(){tFl().classList.add('show');tTr().classList.add('hid')}
function hideT(){tFl().classList.remove('show');tTr().classList.remove('hid')}

function setT(s){
  REST.defaultDur=s;
  if(REST.active){
    // إعادة ضبط الوقت أثناء التشغيل
    REST.endTime=Date.now()+s*1000;
  }else{
    tDel().textContent=s;
    tDel().classList.remove('warn');
    tSb().textContent='▶';
  }
  document.querySelectorAll('.tpr').forEach(p=>{
    const pv=parseInt(p.textContent);
    p.classList.toggle('a',!isNaN(pv) && pv===s);
  });
}

function startT(){
  if(REST.active){
    // إيقاف
    if(REST.intervalId) clearInterval(REST.intervalId);
    REST.active=false;
    tSb().textContent='▶';
    return;
  }
  startAutoRest(REST.defaultDur);
}

function startAutoRest(seconds){
  if(REST.intervalId) clearInterval(REST.intervalId);
  REST.defaultDur=seconds;
  REST.active=true;
  REST.endTime=Date.now()+seconds*1000;
  showT();
  tTr().classList.add('active');
  tSb().textContent='⏸';
  tickRest();
  REST.intervalId=setInterval(tickRest,250);
}

function tickRest(){
  if(!REST.active) return;
  const remaining=Math.max(0,Math.ceil((REST.endTime-Date.now())/1000));
  tDel().textContent=remaining;
  if(remaining<=5 && remaining>0) tDel().classList.add('warn');
  else tDel().classList.remove('warn');
  if(remaining<=0){
    onRestComplete();
  }
}

function onRestComplete(){
  if(REST.intervalId) clearInterval(REST.intervalId);
  REST.active=false;
  tDel().textContent='✓';
  tDel().classList.remove('warn');
  tSb().textContent='▶';
  tTr().classList.remove('active');
  try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}
  playBeep();
  notifyRest();
  setTimeout(()=>{
    if(!REST.active){tDel().textContent=REST.defaultDur}
  },3000);
}

function resetT(){
  if(REST.intervalId) clearInterval(REST.intervalId);
  REST.active=false;
  tDel().textContent=REST.defaultDur;
  tDel().classList.remove('warn');
  tSb().textContent='▶';
  tTr().classList.remove('active');
  hideT();
}

function skipT(){
  if(!REST.active){hideT();return}
  REST.endTime=Date.now();
  tickRest();
}

function extendT(s){
  if(REST.active){
    REST.endTime+=s*1000;
    tickRest();
    showToast(`+${s}s`);
  }else{
    setT(REST.defaultDur+s);
  }
}

function playBeep(){
  try{
    if(!REST.audioCtx) REST.audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    const ctx=REST.audioCtx;
    if(ctx.state==='suspended') ctx.resume();
    // ثلاث نقرات قصيرة
    [0,0.18,0.36].forEach(t=>{
      const osc=ctx.createOscillator();
      const gain=ctx.createGain();
      osc.connect(gain);gain.connect(ctx.destination);
      osc.frequency.value=t===0.36?1100:880;
      gain.gain.setValueAtTime(0.001,ctx.currentTime+t);
      gain.gain.exponentialRampToValueAtTime(0.35,ctx.currentTime+t+0.02);
      gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+t+0.16);
      osc.start(ctx.currentTime+t);
      osc.stop(ctx.currentTime+t+0.18);
    });
  }catch(e){}
}

async function requestNotifPermission(){
  if(!('Notification' in window)) return;
  if(Notification.permission==='default'){
    try{await Notification.requestPermission()}catch(e){}
  }
}

function notifyRest(){
  if(!('Notification' in window)) return;
  if(Notification.permission!=='granted') return;
  try{
    new Notification('⏱ انتهت الراحة',{
      body:'جاهز للسيت التالي 💪',
      icon:'icons/icon-192.png',
      tag:'rest-done',silent:false
    });
  }catch(e){}
}

// Page Visibility — لمّا يرجع للتاب نحدّث العداد
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden && REST.active) tickRest();
});
