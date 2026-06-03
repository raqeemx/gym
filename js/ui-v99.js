/* ============================================================
 * BULK MODE V9.9 — UI/UX Overhaul (Sprint 1)
 * ============================================================
 * يحوي تنفيذ ٧ تحسينات تصميم:
 *  1. Focus Mode — إخفاء chrome أثناء الجلسة + زر تبديل في sess-bar
 *  2. Weight Chip — chip ذهبي بارز فوق track-input
 *  3. Hero compact — Hero يصير compact بعد ٣+ جلسات
 *  4. Daily Log subtabs — تقسيم النموذج لـ ٣ أقسام (state/meals/stats)
 *  5. Guide collapsible — محتوى V4 خلف <details>
 *  6. Week grid status — done/today/missed/upcoming colors
 *  7. Day strip — شريط أيام أفقي sticky فوق #programContainer
 * ============================================================ */

(function(){
  const E=(typeof escHTML==='function')?escHTML:(x=>String(x==null?'':x));

  // ============================================================
  // 1. FOCUS MODE
  // ============================================================
  // ON بشكل افتراضي للمستخدمين بعد ٣ جلسات. زر التبديل في sess-bar.
  let FOCUS_MODE=false;

  async function _loadFocusPref(){
    try{
      const r=await db.get('settings','focusModePref');
      if(r && typeof r.value==='boolean') return r.value;
    }catch(e){}
    // افتراضي: لو عند المستخدم ٣+ جلسات → ON
    try{
      const ws=await db.getAll('workouts');
      return (ws||[]).length>=3;
    }catch(e){return false}
  }

  async function _saveFocusPref(v){
    try{await db.put('settings',{key:'focusModePref',value:!!v})}catch(e){}
  }

  function _applyFocusClass(){
    // V9.14.17 (#5) — أثناء أي جلسة نشطة فعّل تقليل النصوص تلقائياً (يخفي الشرح/الجداول/التغذية)
    const sessionActive=document.body.classList.contains('sess-active');
    document.body.classList.toggle('focus-mode',FOCUS_MODE||sessionActive);
    const btn=document.querySelector('.sess-bar .sb-focus');
    if(btn){
      btn.classList.toggle('active',FOCUS_MODE);
      btn.title=FOCUS_MODE?'الخروج من Focus Mode':'دخول Focus Mode';
      btn.textContent=FOCUS_MODE?'◉':'◎';
    }
  }

  async function toggleFocusMode(){
    FOCUS_MODE=!FOCUS_MODE;
    await _saveFocusPref(FOCUS_MODE);
    _applyFocusClass();
    if(FOCUS_MODE && typeof showToast==='function'){
      showToast('🎯 Focus Mode — التركيز على جلستك فقط','var(--g2)',2200);
    }
    // أغلق كل الأيام غير اليوم النشط
    if(FOCUS_MODE){
      const active=document.querySelector('#t1 .dy.last-session-day, #t1 .dy.today-day');
      if(active && !active.classList.contains('open')) active.classList.add('open');
    }
  }

  function _ensureFocusButton(){
    const bar=document.getElementById('sessBar');
    if(!bar) return;
    // زر Focus
    if(!bar.querySelector('.sb-focus')){
      const btn=document.createElement('button');
      btn.className='sb-focus';
      btn.type='button';
      btn.title='Focus Mode';
      btn.textContent='◎';
      btn.onclick=(e)=>{e.stopPropagation();toggleFocusMode()};
      const endBtn=bar.querySelector('.sb-end');
      if(endBtn) bar.insertBefore(btn,endBtn);
      else bar.appendChild(btn);
    }
    // V9.13 (#5) — زر Gym Mode
    if(!bar.querySelector('.sb-gym') && typeof toggleGymMode==='function'){
      const gb=document.createElement('button');
      gb.className='sb-gym';
      gb.type='button';
      gb.title='Gym Mode — تمرين واحد في كل مرة';
      gb.textContent='🎯';
      gb.onclick=(e)=>{e.stopPropagation();toggleGymMode()};
      const focusBtn=bar.querySelector('.sb-focus');
      if(focusBtn) bar.insertBefore(gb,focusBtn);
      else {
        const endBtn=bar.querySelector('.sb-end');
        if(endBtn) bar.insertBefore(gb,endBtn);
        else bar.appendChild(gb);
      }
    }
  }

  function _ensureExitHint(){
    if(document.querySelector('.focus-exit-hint')) return;
    const t1=document.getElementById('t1');
    if(!t1) return;
    const hint=document.createElement('div');
    hint.className='focus-exit-hint';
    hint.innerHTML=`<span>🎯 Focus Mode نشط — تركيز كامل على جلستك</span><button type="button">خروج</button>`;
    hint.querySelector('button').onclick=(e)=>{e.stopPropagation();toggleFocusMode()};
    t1.insertBefore(hint,t1.firstChild);
  }

  // علِّم اليوم الذي يحوي الجلسة النشطة بـ class إضافي
  // (للتميُّز عن .today-day الذي يعتمد على التقويم)
  function _markSessionActiveDay(){
    document.querySelectorAll('#t1 .dy.session-active-day').forEach(d=>d.classList.remove('session-active-day'));
    if(typeof currentSession==='undefined' || !currentSession) return;
    const days=document.querySelectorAll('#t1 .dy');
    if(typeof _findDayIdxByType==='function'){
      const idx=_findDayIdxByType(currentSession.dayType,days);
      if(idx>=0 && days[idx]) days[idx].classList.add('session-active-day');
    } else {
      // fallback نصي
      const target=String(currentSession.dayType||'').trim().toUpperCase();
      days.forEach(d=>{
        const dn=d.querySelector('.dn');
        if(dn && dn.textContent.toUpperCase().includes(target)) d.classList.add('session-active-day');
      });
    }
  }

  async function initFocusMode(){
    FOCUS_MODE=await _loadFocusPref();
    _ensureFocusButton();
    _ensureExitHint();
    _markSessionActiveDay();
    _applyFocusClass();
    // عند بدء/إنهاء جلسة، أعد التعليم + تأكد من الزر
    const watcher=setInterval(()=>{
      _ensureFocusButton();
      _markSessionActiveDay();
      _applyFocusClass(); // V9.14.17 — يلتقط بدء/إنهاء الجلسة لتفعيل/إلغاء تقليل النصوص
    },1500);
    // expose stop
    window._uiV99StopWatcher=()=>clearInterval(watcher);
  }

  // ============================================================
  // 2. WEIGHT CHIP — chip ذهبي بارز فوق track-input
  // ============================================================
  // يستخرج آخر وزن وأفضل وزن، يعرضهم في chip + زر تطبيق سريع
  function _extractStepInfo(stepEl){
    const info=stepEl.querySelector('.step-info');
    if(!info) return null;
    const txt=(typeof arabicToLatinDigits==='function')?arabicToLatinDigits(info.textContent):info.textContent;
    // ابحث عن "X-Y تكرار" أو "X تكرار"
    const repMatch=txt.match(/(\d+)\s*-\s*(\d+)\s*تكرار/) || txt.match(/(\d+)\s*تكرار/);
    let repsText='';
    if(repMatch) repsText=repMatch[2]?`${repMatch[1]}-${repMatch[2]}`:repMatch[1];
    // ابحث عن "X كجم"
    const wMatch=txt.match(/(\d+(?:\.\d+)?)\s*كجم/);
    const targetW=wMatch?parseFloat(wMatch[1]):null;
    return {repsText,targetW};
  }

  function injectWeightChip(trackDiv,stepEl,stats,suggestion,deloadActive){
    if(!trackDiv || trackDiv.querySelector('.weight-chip')) return;
    if(trackDiv.classList.contains('warmup-track')) return; // التسخين لا يحتاج chip
    const info=_extractStepInfo(stepEl);
    const repsText=info?info.repsText:'';
    const targetW=info?info.targetW:null;

    let chipW=null, chipKind='last', chipLabel='آخر وزن';
    if(suggestion && suggestion.suggestedWeight!=null){
      chipW=suggestion.suggestedWeight;
      chipKind=suggestion.kind||'maintain';
      chipLabel=chipKind==='increase'?'📈 الوزن المقترح'
               :chipKind==='deload'?'🛟 وزن Deload'
               :chipKind==='maintain'?'⏸ كرر آخر وزن'
               :chipKind==='decrease'?'⚠ خفّف الوزن'
               :'الوزن المقترح';
    } else if(stats && stats.lastSessionBest){
      chipW=stats.lastSessionBest.weight;
      chipLabel='آخر وزن سجّلته';
    } else if(targetW!=null){
      chipW=targetW;
      chipLabel='وزن البداية المقترح';
    }

    const isFirstTime = !stats || !stats.lastSessionBest;
    const cls=['weight-chip'];
    if(deloadActive || chipKind==='deload') cls.push('deload-mode');
    if(isFirstTime && !suggestion) cls.push('first-time');

    // V9.13 (#7) — أضف "آخر مرة" + أزرار +/- لتعديل سريع
    const lastValue = (stats && stats.lastSessionBest)?stats.lastSessionBest.weight:null;
    const lastReps = (stats && stats.lastSessionBest)?stats.lastSessionBest.reps:null;

    const chip=document.createElement('div');
    chip.className=cls.join(' ');
    chip.dataset.weight = (chipW!=null)?chipW:'';
    chip.innerHTML=`
      <div class="wc-icon">⚖</div>
      <div class="wc-body">
        <div class="wc-label">${E(chipLabel)}</div>
        <div class="wc-val-row">
          <button type="button" class="wc-step wc-minus" aria-label="نقص ٢.٥">−</button>
          <div class="wc-val"><b class="wc-num">${chipW!=null?E(chipW):'—'}</b><small>كجم</small></div>
          <button type="button" class="wc-step wc-plus" aria-label="زد ٢.٥">+</button>
        </div>
        ${repsText?`<div class="wc-reps">🎯 الهدف: <b>${E(repsText)}</b> تكرار</div>`:''}
        ${lastValue!=null?`<div class="wc-last">آخر مرة: <b>${E(lastValue)}</b> كجم${lastReps?` × ${E(lastReps)}`:''}</div>`:''}
      </div>
      ${(chipW!=null && !isFirstTime)?`<button type="button" class="wc-apply">تطبيق</button>`:(chipW!=null?`<button type="button" class="wc-apply wc-apply-first">طبّق</button>`:'')}
    `;
    const numEl=chip.querySelector('.wc-num');
    const applyBtn=chip.querySelector('.wc-apply');
    const minus=chip.querySelector('.wc-minus');
    const plus=chip.querySelector('.wc-plus');
    const getCurW=()=>parseFloat(chip.dataset.weight||'0')||0;
    const setCurW=(v)=>{
      const safe=Math.max(0,Math.round(v*2)/2); // step 0.5
      chip.dataset.weight=safe;
      if(numEl) numEl.textContent=safe;
      chip.classList.remove('applied');
      if(applyBtn){applyBtn.disabled=false;applyBtn.textContent='تطبيق'}
    };
    if(minus) minus.onclick=(e)=>{e.stopPropagation();setCurW(getCurW()-2.5)};
    if(plus) plus.onclick=(e)=>{e.stopPropagation();setCurW(getCurW()+2.5)};
    // long-press على ± يقفز ٥ كجم
    [minus,plus].forEach(b=>{
      if(!b) return;
      let lpTimer=null;
      const lpStart=(delta)=>{
        if(lpTimer) clearTimeout(lpTimer);
        lpTimer=setTimeout(()=>setCurW(getCurW()+delta),420);
      };
      b.addEventListener('touchstart',()=>lpStart(b===minus?-5:5),{passive:true});
      b.addEventListener('touchend',()=>{if(lpTimer)clearTimeout(lpTimer)},{passive:true});
    });
    if(applyBtn){
      applyBtn.onclick=(e)=>{
        e.stopPropagation();
        const w=getCurW();
        const wInput=trackDiv.querySelector('.weight-input');
        if(wInput){
          wInput.value=w;
          wInput.dispatchEvent(new Event('input',{bubbles:true}));
          wInput.focus();
          const rInput=trackDiv.querySelector('.reps-input');
          if(rInput) setTimeout(()=>rInput.focus(),150);
        }
        chip.classList.add('applied');
        applyBtn.textContent='✓ مُطبَّق';
        applyBtn.disabled=true;
      };
    }
    // ضع الـ chip قبل الـ track-input
    trackDiv.parentNode.insertBefore(chip,trackDiv);
  }

  // hook في injectTrackingInputs الأصلي
  async function injectAllWeightChips(){
    if(typeof db==='undefined') return;
    const workSteps=document.querySelectorAll('#t1 .step:not(.rest):not(.warmup):not(.done)');
    if(!workSteps.length) return;
    let allSets=[], statsByName={}, deloadActive=false;
    try{ allSets=await db.getAll('sets'); }catch(e){}
    try{
      statsByName=(typeof computeLastBestByExercise==='function')
        ? computeLastBestByExercise(allSets) : {};
    }catch(e){}
    try{
      deloadActive=(typeof isDeloadActive==='function')?await isDeloadActive():false;
    }catch(e){}

    workSteps.forEach(step=>{
      const trackDiv=step.querySelector('.track-input:not(.warmup-track)');
      if(!trackDiv) return;
      if(trackDiv.previousElementSibling && trackDiv.previousElementSibling.classList.contains('weight-chip')) return;
      const exName=(typeof getExerciseName==='function')?getExerciseName(step):null;
      const stats=exName?statsByName[exName]:null;
      let suggestion=null;
      if(stats && stats.lastSessionBest && typeof parseRepRange==='function' && typeof computeProgression==='function'){
        const range=parseRepRange(step);
        const lastRpe=stats.lastSessionBest.rpe!=null?stats.lastSessionBest.rpe:null;
        suggestion=computeProgression(stats.lastSessionBest,range,lastRpe,deloadActive);
      }
      injectWeightChip(trackDiv,step,stats,suggestion,deloadActive);
    });
  }

  // ============================================================
  // 3. HERO COMPACT — Hero يصير compact بعد ٣ جلسات
  // ============================================================
  async function applyHeroCompact(){
    try{
      const ws=await db.getAll('workouts');
      const count=(ws||[]).length;
      if(count<3) return; // مستخدم جديد: يبقى Hero كامل
      const hero=document.querySelector('#dashboardContainer .dash-hero');
      if(!hero) return;
      // إذا Hero من نوع welcome → اتركه
      if(hero.classList.contains('dash-hero-welcome')) return;
      // أنشئ نسخة mini
      if(hero.querySelector('.dh-mini')) return;
      const tag=hero.querySelector('.dh-tag');
      const title=hero.querySelector('.dh-title');
      const sub=hero.querySelector('.dh-sub');
      const mini=document.createElement('div');
      mini.className='dh-mini';
      const titleText=title?title.textContent:'جلسة اليوم';
      const subShort=sub?sub.textContent.split('·')[0].trim():'';
      mini.innerHTML=`
        <span>💪</span>
        <b>${E(titleText)}</b>
        ${subShort?`<span class="dh-mini-dot">·</span><span>${E(subShort)}</span>`:''}
        <span class="dh-mini-badge">${tag?E(tag.textContent):''}</span>
      `;
      hero.appendChild(mini);
      // زر التوسعة
      const expBtn=document.createElement('button');
      expBtn.className='dash-hero-expand-btn';
      expBtn.type='button';
      expBtn.textContent='+';
      expBtn.title='عرض التفاصيل';
      expBtn.onclick=(e)=>{
        e.stopPropagation();
        hero.classList.toggle('compact-mode');
        expBtn.textContent=hero.classList.contains('compact-mode')?'+':'−';
      };
      mini.appendChild(expBtn);
      hero.classList.add('compact-mode');
    }catch(e){console.warn('applyHeroCompact failed:',e)}
  }

  // ============================================================
  // 4. DAILY LOG SUB-TABS
  // ============================================================
  function initDailyLogSubtabs(){
    const dailyPane=document.getElementById('ppDaily');
    if(!dailyPane) return;
    if(dailyPane.querySelector('.dl-subtabs')) return; // مرّة واحدة فقط

    // الأقسام الأصلية في ppDaily:
    //  - bm-hint (وصف)
    //  - dailyLogForm (water/sleep/protein + supplements + meals + save)
    //  - foodLogPanel (الوجبات الفعلية)
    //  - dlStats (إحصائيات)
    //  - bm-history-title + dlHistoryBody (آخر ١٤ يوم)
    const form=document.getElementById('dailyLogForm');
    const foodPanel=document.getElementById('foodLogPanel');
    const stats=document.getElementById('dlStats');
    const histTitle=dailyPane.querySelector('.bm-history-title');
    const histBody=document.getElementById('dlHistoryBody');
    if(!form) return;

    // أنشئ شريط tabs
    const tabsBar=document.createElement('div');
    tabsBar.className='dl-subtabs';
    tabsBar.innerHTML=`
      <button class="dl-subtab a" data-dls="state" type="button">📋 حالة اليوم</button>
      <button class="dl-subtab" data-dls="meals" type="button">🍽️ وجبات اليوم</button>
      <button class="dl-subtab" data-dls="history" type="button">📊 الإحصائيات</button>
    `;
    // أنشئ ٣ subpanes
    const stateSub=document.createElement('div');
    stateSub.className='dl-subpane a';
    stateSub.dataset.dlp='state';
    const mealsSub=document.createElement('div');
    mealsSub.className='dl-subpane';
    mealsSub.dataset.dlp='meals';
    const histSub=document.createElement('div');
    histSub.className='dl-subpane';
    histSub.dataset.dlp='history';

    // أدخل tabs في بداية dailyPane (بعد bm-hint)
    const hint=dailyPane.querySelector('.bm-hint');
    if(hint) hint.after(tabsBar); else dailyPane.insertBefore(tabsBar,dailyPane.firstChild);

    // انقل العناصر إلى subpanes
    // state: form (بدون قسم الوجبات داخله)
    // meals: foodLogPanel + قسم الوجبات من النموذج
    // history: stats + history
    tabsBar.after(stateSub);
    stateSub.after(mealsSub);
    mealsSub.after(histSub);

    // انقل النموذج كاملاً إلى state (يبقى الـ "احفظ يومك" مع water/sleep/protein/supplements/meals)
    stateSub.appendChild(form);
    // foodLogPanel ينتقل إلى meals
    if(foodPanel) mealsSub.appendChild(foodPanel);
    // stats + history إلى history subpane
    if(stats) histSub.appendChild(stats);
    if(histTitle) histSub.appendChild(histTitle);
    if(histBody) histSub.appendChild(histBody);

    // event listener
    tabsBar.querySelectorAll('.dl-subtab').forEach(btn=>{
      btn.onclick=(e)=>{
        e.stopPropagation();
        const target=btn.dataset.dls;
        tabsBar.querySelectorAll('.dl-subtab').forEach(b=>b.classList.remove('a'));
        btn.classList.add('a');
        dailyPane.querySelectorAll('.dl-subpane').forEach(p=>{
          p.classList.toggle('a',p.dataset.dlp===target);
        });
      };
    });
  }

  // ============================================================
  // 5. GUIDE COLLAPSIBLE V4 CONTENT
  // ============================================================
  function initGuideCollapsible(){
    const t5=document.getElementById('t5');
    if(!t5) return;
    // ابحث عن المُقسِّم النصي الذي يفصل hub عن V4 content
    const divider=t5.querySelector('.guide-hub-divider');
    if(!divider) return;
    // إذا فعلتها سابقاً، تخطَّ
    if(t5.querySelector('.guide-v4-collapsible')) return;

    const details=document.createElement('details');
    details.className='guide-v4-collapsible';
    details.innerHTML=`<summary><span>📖 محتوى دليل V4 الكامل</span><small>بدائل · جداول · قياسات · توقيت المكملات</small></summary>`;
    const body=document.createElement('div');
    body.className='guide-v4-body';
    details.appendChild(body);

    // اجمع كل العناصر بعد divider (حتى نهاية t5)
    const toMove=[];
    let cur=divider.nextElementSibling;
    while(cur){
      toMove.push(cur);
      cur=cur.nextElementSibling;
    }
    // ضع details مكان divider واحذف divider
    divider.replaceWith(details);
    // انقل العناصر إلى body
    toMove.forEach(el=>body.appendChild(el));
  }

  // ============================================================
  // 6. WEEK GRID STATUS
  // ============================================================
  // يقرأ workouts الأسبوع الحالي + التقويم لتحديد:
  //   done   = جلسة مسجّلة في هذا اليوم
  //   today  = اليوم في الأسبوع
  //   missed = يوم تدريبي مضى بدون جلسة
  //   upcoming = يوم تدريبي مستقبل
  //   rest   = يوم راحة (يبقى عليه class cr الأصلي)
  async function applyWeekGridStatus(){
    // V9.11 — week grid انتقل إلى .dash-week-card؛ ادعم القديم والجديد
    const cells=document.querySelectorAll('.dash-week-card .wg .wc, .fu2 .wg .wc');
    if(!cells.length) return;
    let workouts=[];
    try{ workouts=await db.getAll('workouts')||[]; }catch(e){}
    const today=new Date();today.setHours(0,0,0,0);
    const dayOfWeek=today.getDay();
    // ابحث عن الأحد كبداية الأسبوع
    const sunday=new Date(today);
    sunday.setDate(sunday.getDate()-dayOfWeek);
    const weekStarts=[];
    for(let i=0;i<7;i++){
      const dt=new Date(sunday);dt.setDate(dt.getDate()+i);
      weekStarts.push(dt);
    }
    // محول لـ ISO date
    const isoOf=(dt)=>dt.toISOString().split('T')[0];
    const workoutDates=new Set(workouts.filter(w=>w.startTime).map(w=>w.startTime.split('T')[0]));

    cells.forEach((cell,idx)=>{
      const dayDate=weekStarts[idx];
      if(!dayDate) return;
      const iso=isoOf(dayDate);
      const isRest=cell.classList.contains('cr');
      let status;
      if(dayDate.getTime()===today.getTime() && !isRest){
        status='today';
      } else if(isRest){
        status='rest'; // لا نضيف data-week-status (تبقى cr الافتراضية)
        cell.removeAttribute('data-week-status');
        return;
      } else if(workoutDates.has(iso)){
        status='done';
      } else if(dayDate<today){
        status='missed';
      } else {
        status='upcoming';
      }
      cell.dataset.weekStatus=status;
      // اضغطة → افتح t1 + قفز لذلك اليوم
      if(!cell.dataset.weekBound){
        cell.dataset.weekBound='1';
        cell.addEventListener('click',()=>{
          const dayIdx=Number(cell.dataset.day);
          if(typeof switchToTab==='function') switchToTab(1);
          setTimeout(()=>_scrollToProgramDay(dayIdx),200);
        });
      }
    });
  }

  // ============================================================
  // 7. DAY STRIP — شريط أيام أفقي sticky في t1
  // ============================================================
  function _scrollToProgramDay(dayIdx){
    const days=document.querySelectorAll('#t1 .dy');
    if(!days[dayIdx]) return;
    const target=days[dayIdx];
    if(!target.classList.contains('open')){
      // اطوِ كل الأيام أولاً، افتح هذا
      days.forEach(d=>d.classList.remove('open'));
      target.classList.add('open');
    }
    // sticky offset
    const offset=120;
    const top=target.getBoundingClientRect().top+window.pageYOffset-offset;
    window.scrollTo({top,behavior:'smooth'});
  }

  function _shortDayName(dayName){
    const m={'الأحد':'أحد','الإثنين':'إثن','الاثنين':'إثن','الثلاثاء':'ثلا','الأربعاء':'أرب','الخميس':'خمي','الجمعة':'جمع','السبت':'سبت'};
    return m[dayName]||dayName;
  }

  function _shortTypeName(typeName){
    // اختصارات للأنواع الطويلة
    return String(typeName||'').replace(/UPPER\s+/g,'U').replace(/BACK\s+&?\s*WINGS?/i,'BACK').replace(/LEGS?\s+مختصر/i,'LEGS').replace(/ARMS\s+/g,'A.').trim();
  }

  async function buildDayStrip(){
    const t1=document.getElementById('t1');
    if(!t1) return;
    const programContainer=document.getElementById('programContainer');
    if(!programContainer) return;
    // إذا الأيام لم تُولَّد بعد، تخطَّ
    const days=programContainer.querySelectorAll('.dy');
    if(!days.length) return;

    // أنشئ strip لو غير موجود
    let strip=t1.querySelector('.day-strip');
    if(!strip){
      strip=document.createElement('div');
      strip.className='day-strip';
      // ضع strip قبل programContainer
      programContainer.parentNode.insertBefore(strip,programContainer);
    }

    // اكتشف اليوم النشط الحالي (التظليل تم في highlightToday)
    const today=document.querySelector('#t1 .dy.today-day, #t1 .dy.last-session-day');
    const todayIdx=today?Array.from(days).indexOf(today):-1;
    const todayKind=today?(today.classList.contains('today-day')?'today':'last-session'):null;

    // ابنِ chips
    strip.innerHTML='';
    days.forEach((day,idx)=>{
      const dn=day.querySelector('.dn');
      const fullText=dn?dn.textContent.trim():`Day ${idx+1}`;
      // افصل اسم اليوم العربي عن النوع — مثال: "الأحد — UPPER A"
      let dayName='', typeName='';
      const dashIdx=fullText.indexOf('—');
      if(dashIdx>=0){
        dayName=fullText.slice(0,dashIdx).trim();
        typeName=fullText.slice(dashIdx+1).trim();
      } else { typeName=fullText; }
      // أزل أي badge عربي من النص
      dayName=dayName.replace(/اليوم|آخر جلسة|الجلسة النشطة/g,'').trim();
      const isRest=day.querySelector('.db.rest')!=null;
      const cls=['ds-chip'];
      if(idx===todayIdx){
        cls.push('a');
        if(todayKind==='today') cls.push('today-chip');
        else cls.push('last-session-chip');
      }
      if(isRest) cls.push('rest-chip');
      const chip=document.createElement('button');
      chip.type='button';
      chip.className=cls.join(' ');
      chip.dataset.dayIdx=idx;
      chip.innerHTML=`<span class="ds-chip-day">${E(_shortDayName(dayName))}</span><span class="ds-chip-type">${E(_shortTypeName(typeName))}</span>`;
      chip.onclick=(e)=>{
        e.stopPropagation();
        strip.querySelectorAll('.ds-chip').forEach(c=>c.classList.remove('a'));
        chip.classList.add('a');
        _scrollToProgramDay(idx);
      };
      strip.appendChild(chip);
    });

    // سكروول chip النشط للوسط
    setTimeout(()=>{
      const active=strip.querySelector('.ds-chip.a');
      if(active && active.scrollIntoView){
        try{active.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'})}catch(e){}
      }
    },100);
  }

  // ============================================================
  // BOOTSTRAP — hooks في الـ lifecycle
  // ============================================================
  // ١. عند DOMContentLoaded → init focus + guide
  document.addEventListener('DOMContentLoaded',()=>{
    initGuideCollapsible();
    // delay لـ init focus (يحتاج DB)
    setTimeout(()=>initFocusMode().catch(()=>{}),500);
    // delay لـ daily log subtabs (يحتاج أن ppDaily موجود)
    setTimeout(()=>initDailyLogSubtabs(),300);
  });

  // ٢. عند تحديث Dashboard → apply hero compact + week grid
  function _wrapDashboardRefresh(){
    if(!window.refreshDashboard || window.refreshDashboard.__v99) return false;
    const _origRefresh=window.refreshDashboard;
    const wrapped=async function(){
      const r=await _origRefresh.apply(this,arguments);
      setTimeout(()=>{applyHeroCompact().catch(()=>{});applyWeekGridStatus().catch(()=>{})},80);
      return r;
    };
    wrapped.__v99=true;
    window.refreshDashboard=wrapped;
    return true;
  }
  if(!_wrapDashboardRefresh()){
    // dashboard.js لم يحمّل بعد — انتظر
    let tries=0;
    const wait=setInterval(()=>{
      if(_wrapDashboardRefresh() || ++tries>30) clearInterval(wait);
    },200);
  }

  // ٣. عند injectTrackingInputs → ضف Weight Chips
  // المُلاحظة: ننتظر MutationObserver على #programContainer
  let _stripBuildScheduled=false;
  function _scheduleStripBuild(){
    if(_stripBuildScheduled) return;
    _stripBuildScheduled=true;
    setTimeout(()=>{
      _stripBuildScheduled=false;
      buildDayStrip().catch(()=>{});
      injectAllWeightChips().catch(()=>{});
      applyWeekGridStatus().catch(()=>{});
    },180);
  }

  document.addEventListener('DOMContentLoaded',()=>{
    const pc=document.getElementById('programContainer');
    if(pc){
      // أول build بعد render
      _scheduleStripBuild();
      // أعد البناء عند تغيّر داخلي (إضافة/حذف track-input أو فتح يوم)
      const ob=new MutationObserver((muts)=>{
        for(const m of muts){
          // ضف Weight Chips عند ظهور track-input جديدة
          for(const node of m.addedNodes){
            if(node.nodeType===1){
              if(node.classList && (node.classList.contains('track-input') || node.querySelector?.('.track-input'))){
                _scheduleStripBuild();
                return;
              }
              if(node.classList && node.classList.contains('dy')){
                _scheduleStripBuild();
                return;
              }
            }
          }
        }
      });
      try{ob.observe(pc,{childList:true,subtree:true})}catch(e){}
    }
    // عند تبديل tabs، أعد بناء الـ strip إذا t1
    const navBtns=document.querySelectorAll('.nb');
    navBtns.forEach(b=>{
      b.addEventListener('click',()=>{
        if(b.dataset.t==='1') setTimeout(()=>buildDayStrip().catch(()=>{}),200);
      });
    });
  });

  // ============================================================
  // V9.10 ADDITIONS — #11 tips collapsible · #14 colors · #15 bilingual
  // ============================================================

  // #11 — tips collapsible
  // أي .tip يحوي نص أطول من ~110 حرف، احقن زر "اقرأ المزيد"
  function applyTipsCollapsible(){
    document.querySelectorAll('.tip:not([data-tip-collapsed])').forEach(tip=>{
      tip.dataset.tipCollapsed='1';
      const tt=tip.querySelector('.tt');
      if(!tt) return;
      // إذا النص قصير، تجاهل
      const len=(tt.textContent||'').length;
      // إذا فيه <br><br> أو طول > 130 → اعتبره طويلاً
      const isLong = len>130 || /<br\s*\/?>\s*<br/i.test(tt.innerHTML);
      if(!isLong) return;
      tip.classList.add('collapsible');
      // أضف زر "اقرأ المزيد" بعد .tt مباشرة
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='tip-more-btn';
      btn.textContent='اقرأ المزيد';
      btn.onclick=(e)=>{
        e.stopPropagation();
        const isExpanded=tip.classList.toggle('expanded');
        btn.textContent=isExpanded?'اطوِ':'اقرأ المزيد';
      };
      tt.parentNode.appendChild(btn);
    });
  }

  // #14 — ضف data-day-type لكل خلية في wg + day strip
  // map من نوع اليوم النصي إلى category
  function _categorizeDayType(typeText){
    const t=String(typeText||'').toUpperCase();
    if(/REST|راحة/.test(t)) return 'rest';
    if(/UPPER|PUSH|CHEST/.test(t)) return 'push';
    if(/BACK|PULL|WINGS/.test(t)) return 'pull';
    if(/LEGS?|أرجل|سمانة/.test(t)) return 'legs';
    if(/ARMS?|BICEP|TRICEP|ذراع/.test(t)) return 'arms';
    return 'push'; // default fallback
  }

  function applyDayTypeColors(){
    // Week grid (V9.11 — يدعم القديم .fu2 والجديد .dash-week-card)
    document.querySelectorAll('.dash-week-card .wg .wc, .fu2 .wg .wc').forEach(cell=>{
      const wt=cell.querySelector('.wt');
      if(!wt) return;
      const cat=_categorizeDayType(wt.textContent);
      cell.dataset.dayType=cat;
    });
    // Day strip chips
    document.querySelectorAll('.day-strip .ds-chip').forEach(chip=>{
      const t=chip.querySelector('.ds-chip-type');
      if(!t) return;
      const cat=_categorizeDayType(t.textContent);
      chip.dataset.dayType=cat;
    });
    // Day cards in t1: .db يحصل push/pull/legs بالفعل من program-render
    // فقط أعد classify .db.pull إلى arms لو dayType فعلاً arms (Arms A/B في البرنامج)
    document.querySelectorAll('#t1 .dy').forEach(day=>{
      const dn=day.querySelector('.dn');
      if(!dn) return;
      const cat=_categorizeDayType(dn.textContent);
      day.dataset.dayType=cat;
    });
  }

  // #15 — Bilingual exercise names (English — Arabic)
  // EXERCISE_FORM_NOTES يحوي title بصيغة "Chest Press — ضغط صدر"
  // نُعدّل .step-name إلى <span class="sn-en">Chest Press</span><span class="sn-ar">ضغط صدر</span>
  function _buildArabicNameMap(){
    const map={};
    if(typeof EXERCISE_FORM_NOTES==='undefined') return map;
    for(const [key,val] of Object.entries(EXERCISE_FORM_NOTES)){
      if(!val || !val.title) continue;
      const t=String(val.title);
      const dashIdx=t.indexOf('—');
      if(dashIdx<0) continue;
      const en=t.slice(0,dashIdx).trim();
      const ar=t.slice(dashIdx+1).trim();
      if(en && ar){
        map[en]=ar;
        // اسم الجهاز بدون parens
        const cleanEn=en.replace(/\s*\([^)]+\)/g,'').trim();
        if(cleanEn!==en) map[cleanEn]=ar;
      }
    }
    return map;
  }
  let _arNameMap=null;

  function applyBilingualNames(){
    if(!_arNameMap) _arNameMap=_buildArabicNameMap();
    if(Object.keys(_arNameMap).length===0) return;
    document.querySelectorAll('#t1 .step:not(.rest) .step-name').forEach(nameEl=>{
      if(nameEl.dataset.bilingual==='1') return;
      // النص الأصلي
      const raw=nameEl.textContent.trim();
      // استخرج اسم الإنجليزي: ابحث عن match في raw
      let enName=null, arName=null;
      // أولاً، حاول بـ normalizeExName (لو متاحة)
      const norm=(typeof normalizeExName==='function')?normalizeExName(raw):raw;
      // بحث مباشر
      for(const [en,ar] of Object.entries(_arNameMap)){
        if(raw.includes(en)){
          enName=en;arName=ar;break;
        }
      }
      // بحث بالـ norm
      if(!enName && norm && _arNameMap[norm]){
        enName=norm;arName=_arNameMap[norm];
      }
      if(!enName || !arName) return;
      // احتفظ بـ children موجودة (مثل زر ℹ️) — لا نلمسهم
      const preserved=Array.from(nameEl.childNodes).filter(n=>n.nodeType!==3);
      // أزل كل text nodes
      Array.from(nameEl.childNodes).forEach(n=>{
        if(n.nodeType===3) nameEl.removeChild(n);
      });
      // أنشئ span للإنجليزي + العربي
      const enSpan=document.createElement('span');
      enSpan.className='sn-en';
      enSpan.textContent=enName;
      const arSpan=document.createElement('span');
      arSpan.className='sn-ar';
      arSpan.textContent=arName;
      // ضع spans قبل children المحفوظة
      nameEl.insertBefore(arSpan,nameEl.firstChild);
      nameEl.insertBefore(enSpan,arSpan);
      nameEl.dataset.bilingual='1';
    });
  }

  // hook in على lifecycle
  function _applyV910Enhancements(){
    try{applyTipsCollapsible()}catch(e){}
    try{applyDayTypeColors()}catch(e){}
    try{applyBilingualNames()}catch(e){}
  }
  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(_applyV910Enhancements,400);
  });
  // أعد التطبيق عند بناء day strip أو تغيير برنامج
  const _origScheduleStripBuild=_scheduleStripBuild;
  // wrap للأمان (override الـ closure)
  // بدلاً من override، أضف observer ثانٍ
  if(typeof window!=='undefined'){
    const ob2=new MutationObserver(()=>{
      _applyV910Enhancements();
    });
    setTimeout(()=>{
      const pc=document.getElementById('programContainer');
      if(pc) try{ob2.observe(pc,{childList:true,subtree:false})}catch(e){}
    },1500);
  }

  // ============================================================
  // V9.12 ADDITIONS — Daily Start Card + Progressive Disclosure + Step Ops Row
  // ============================================================

  // V9.13 (#4) — Plan B داخل كل step
  // يقرأ أول بديل من EXERCISE_ALTERNATIVES ويضع سطر:
  //   📋 الجهاز مشغول؟ استخدم: X [بدّل]
  function injectInlinePlanB(){
    if(typeof EXERCISE_ALTERNATIVES==='undefined') return;
    document.querySelectorAll('#t1 .step:not(.rest):not(.warmup)').forEach(step=>{
      if(step.dataset.planbInjected==='1') return;
      const stepBody=step.querySelector('.step-body');
      if(!stepBody) return;
      const exName=(typeof getExerciseName==='function')?getExerciseName(step):null;
      if(!exName) return;
      const norm=(typeof normalizeExName==='function')?normalizeExName(exName):exName;
      const alts=EXERCISE_ALTERNATIVES[norm];
      if(!alts || !alts.length) {step.dataset.planbInjected='1';return}
      // فلتر حسب الجيم النشط
      let filtered=alts;
      if(typeof getEffectiveAlternativesSync==='function'){
        const f=getEffectiveAlternativesSync(norm);
        if(f && f.length) filtered=f;
      }
      // اختر الأول، أو peakFriendly في ساعة الذروة
      const hour=new Date().getHours();
      const isPeak=hour>=18 && hour<21;
      let best=filtered[0];
      if(isPeak){
        const pa=filtered.find(a=>a.peakFriendly);
        if(pa) best=pa;
      }
      if(!best || !best.name) {step.dataset.planbInjected='1';return}
      const peakIcon=best.peakFriendly?' ⚡':'';
      const stepId=step.id || step.dataset.id || '';
      const row=document.createElement('div');
      row.className='inline-planb';
      row.innerHTML=`
        <span class="ipb-icon">🔄</span>
        <div class="ipb-body">
          <span class="ipb-q">الجهاز مشغول؟ استخدم:</span>
          <b class="ipb-name">${E(best.name)}${peakIcon}</b>
        </div>
        <button type="button" class="ipb-swap" data-step-id="${E(stepId)}" data-sub="${E(best.name)}">بدّل</button>
      `;
      const btn=row.querySelector('.ipb-swap');
      btn.onclick=(e)=>{
        e.stopPropagation();
        if(typeof applySubstitution==='function' && stepId){
          applySubstitution(stepId,best.name);
          // hide row بعد التبديل
          row.style.display='none';
          if(typeof showToast==='function') showToast(`🔄 تم التبديل إلى ${best.name}`,'var(--grn)',2500);
        } else if(typeof showAlternatives==='function'){
          showAlternatives(step);
        }
      };
      // ضع الـ row بعد step-info
      const info=stepBody.querySelector('.step-info');
      if(info) info.after(row);
      else stepBody.appendChild(row);
      step.dataset.planbInjected='1';
    });
  }

  // #1 — Plan B Hint: من Dashboard، يفتح t1 + يضيء أزرار ⇄ + toast
  function openPlanBHint(){
    if(typeof switchToTab==='function') switchToTab(1);
    setTimeout(()=>{
      // افتح اليوم النشط
      const active=document.querySelector('#t1 .dy.last-session-day, #t1 .dy.today-day, #t1 .dy.session-active-day');
      if(active && !active.classList.contains('open')){
        document.querySelectorAll('#t1 .dy.open').forEach(d=>d.classList.remove('open'));
        active.classList.add('open');
        // scroll
        setTimeout(()=>{
          const top=active.getBoundingClientRect().top+window.pageYOffset-100;
          window.scrollTo({top,behavior:'smooth'});
        },120);
      }
      // أبرز كل أزرار البدائل ⇄
      const altBtns=document.querySelectorAll('#t1 .alt-btn');
      altBtns.forEach(b=>b.classList.add('alt-btn-flash'));
      setTimeout(()=>{
        altBtns.forEach(b=>b.classList.remove('alt-btn-flash'));
      },2800);
      if(typeof showToast==='function'){
        showToast('🔄 اضغط زر ⇄ بجانب أي تمرين لإيجاد بديل','var(--blue)',3200);
      }
    },150);
  }

  // #2 — Progressive Disclosure في t1
  // اللف البطاقات الكبيرة (شرح + قائمة أوزان) في <details> مغلقة افتراضياً
  function initT1ProgressiveDisclosure(){
    const t1=document.getElementById('t1');
    if(!t1) return;
    if(t1.dataset.t1Disclosed==='1') return;
    t1.dataset.t1Disclosed='1';
    // اعثر على أول bigعنوانين:
    //  - "منطق ترتيب التمارين الجديد"
    //  - "أوزانك المبدئية — الأسبوع الأول"
    const cards=t1.querySelectorAll(':scope > .card');
    cards.forEach(card=>{
      const head=card.querySelector('.ct');
      if(!head) return;
      const txt=head.textContent.trim();
      if(/منطق ترتيب التمارين|الأوزان|أوزانك المبدئية|الأوزان المبدئية/i.test(txt)){
        _wrapInDetails(card,txt);
      }
    });
  }

  function _wrapInDetails(card,summaryText){
    // أنشئ <details> بنفس مكان البطاقة
    const det=document.createElement('details');
    det.className='t1-disclosure';
    const sum=document.createElement('summary');
    sum.innerHTML=`<span class="t1d-icon">📖</span><span class="t1d-title">${escHTML?escHTML(summaryText):summaryText}</span><small class="t1d-hint">اضغط للعرض</small>`;
    det.appendChild(sum);
    // ضع <details> قبل البطاقة، ثم انقل البطاقة داخلها
    card.parentNode.insertBefore(det,card);
    det.appendChild(card);
    // أزل margin-bottom من البطاقة الداخلية
    card.style.marginBottom='0';
    card.style.marginTop='8px';
  }

  // #3 — Step Ops Row: حقن صف badges عملية في كل step تدريبي
  // [⏱ راحة 60ث] [🏷 zone] — يكتمل مع weight chip (وزن) + alt-btn (بديل)
  function injectStepOpsRow(){
    document.querySelectorAll('#t1 .step:not(.rest):not(.warmup)').forEach(step=>{
      if(step.dataset.opsInjected==='1') return;
      const stepBody=step.querySelector('.step-body');
      if(!stepBody) return;
      // ابحث عن next step.rest في الـ phase
      const nextRest=_findNextRestStep(step);
      const restSec=nextRest?_parseRestSeconds(nextRest):null;
      // zone من الـ banner في الـ phase الأب
      const phase=step.closest('.dy')?step.parentElement:null;
      const banner=step.previousElementSibling && step.previousElementSibling.closest('.dbi')
        ?step.closest('.dbi').querySelector('.pair-banner .zone-tag')
        :null;
      let zoneText=null;
      // ابحث للأعلى عن أقرب pair-banner داخل نفس .dbi
      const dbi=step.closest('.dbi');
      if(dbi){
        // اعثر على أقرب previous pair-banner قبل هذا الـ step
        let cur=step.previousElementSibling;
        while(cur){
          if(cur.classList && cur.classList.contains('pair-banner')){
            const zt=cur.querySelector('.zone-tag');
            if(zt) zoneText=zt.textContent.trim();
            break;
          }
          if(cur.classList && cur.classList.contains('phase-bar')) break; // وصلنا phase جديد
          cur=cur.previousElementSibling;
        }
      }
      // ابن الـ ops row
      const badges=[];
      if(restSec){
        badges.push(`<span class="sor-badge sor-rest" title="مدة الراحة قبل السيت التالي">⏱ <b>${restSec}</b>ث راحة</span>`);
      }
      if(zoneText){
        // اختصر "🟢 ZONE" إلى عرض جميل
        badges.push(`<span class="sor-badge sor-zone" title="منطقة الجهاز في الجيم">🏷 ${escHTML?escHTML(zoneText.replace(/^🟢\s*/,'').replace(/^ZONE/i,'').trim()||zoneText):zoneText}</span>`);
      }
      if(!badges.length) {step.dataset.opsInjected='1';return}
      const row=document.createElement('div');
      row.className='step-ops-row';
      row.innerHTML=badges.join('');
      // ضع الـ row بعد step-info مباشرة
      const info=stepBody.querySelector('.step-info');
      if(info) info.after(row);
      else stepBody.appendChild(row);
      step.dataset.opsInjected='1';
    });
  }

  function _findNextRestStep(step){
    let cur=step.nextElementSibling;
    while(cur){
      if(cur.classList && cur.classList.contains('step')){
        if(cur.classList.contains('rest')) return cur;
        // إذا step غير rest بعد هذا، فلا توجد راحة بينهما
        return null;
      }
      cur=cur.nextElementSibling;
    }
    return null;
  }

  function _parseRestSeconds(restStep){
    if(!restStep) return null;
    const txt=restStep.textContent;
    // ابحث عن "٩٠" أو "60" أو "٦٠ ث"
    const norm=(typeof arabicToLatinDigits==='function')?arabicToLatinDigits(txt):txt;
    const m=norm.match(/(\d{2,3})\s*(?:ث|ثانية|s|sec)?/);
    if(m) return parseInt(m[1],10);
    return null;
  }

  // ============================================================
  // V9.13 (#6) — Bottom Nav (mobile only)
  // ============================================================
  function _initBottomNav(){
    const bn=document.getElementById('bottomNav');
    if(!bn) return;
    if(bn.dataset.bnInit==='1') return;
    bn.dataset.bnInit='1';
    bn.querySelectorAll('.bn:not(.bn-more)').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const t=btn.dataset.bn;
        if(t==null) return;
        if(typeof switchToTab==='function') switchToTab(parseInt(t,10));
        // mark active
        bn.querySelectorAll('.bn').forEach(b=>b.classList.remove('a'));
        btn.classList.add('a');
        closeBnDrawer();
      });
    });
    const moreBtn=document.getElementById('bnMoreBtn');
    if(moreBtn){
      moreBtn.addEventListener('click',()=>{
        openBnDrawer();
        bn.querySelectorAll('.bn').forEach(b=>b.classList.remove('a'));
        moreBtn.classList.add('a');
      });
    }
    // drawer items
    document.querySelectorAll('#bnDrawer .bn-d-item[data-bn]').forEach(it=>{
      it.addEventListener('click',()=>{
        const t=it.dataset.bn;
        if(t==null) return;
        if(typeof switchToTab==='function') switchToTab(parseInt(t,10));
        closeBnDrawer();
      });
    });
    // مزامنة active state عند تبديل tab من أي مكان آخر
    document.addEventListener('click',(e)=>{
      const navBtn=e.target.closest('.nb[data-t]');
      if(navBtn) _syncBottomNavActive(navBtn.dataset.t);
    });
  }

  function _syncBottomNavActive(tabId){
    const bn=document.getElementById('bottomNav');
    if(!bn) return;
    bn.querySelectorAll('.bn').forEach(b=>b.classList.remove('a'));
    const match=bn.querySelector(`.bn[data-bn="${tabId}"]`);
    if(match) match.classList.add('a');
  }

  window.closeBnDrawer=function(){
    const dr=document.getElementById('bnDrawer');
    const bd=document.getElementById('bnDrawerBackdrop');
    if(dr){dr.classList.remove('open');dr.setAttribute('aria-hidden','true')}
    if(bd) bd.classList.remove('open');
  };

  // V9.14.9 — فتح درج "المزيد" (يعمل على الموبايل من الشريط السفلي وعلى سطح المكتب من زر الشريط العلوي)
  window.openBnDrawer=function(){
    const dr=document.getElementById('bnDrawer');
    const bd=document.getElementById('bnDrawerBackdrop');
    if(dr){dr.classList.add('open');dr.setAttribute('aria-hidden','false')}
    if(bd) bd.classList.add('open');
  };

  // ربط lifecycle
  function _applyV912Enhancements(){
    try{initT1ProgressiveDisclosure()}catch(e){}
    try{injectStepOpsRow()}catch(e){}
    try{injectInlinePlanB()}catch(e){}
    try{_initBottomNav()}catch(e){}
  }
  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(_applyV912Enhancements,650);
  });
  if(typeof window!=='undefined'){
    const ob3=new MutationObserver((muts)=>{
      // لو ظهرت .step جديدة، أعد injection
      for(const m of muts){
        for(const node of m.addedNodes){
          if(node.nodeType===1 && (node.classList?.contains('step') || node.querySelector?.('.step'))){
            setTimeout(_applyV912Enhancements,120);
            return;
          }
        }
      }
    });
    setTimeout(()=>{
      const pc=document.getElementById('programContainer');
      if(pc) try{ob3.observe(pc,{childList:true,subtree:true})}catch(e){}
    },1600);
  }

  // expose
  window.toggleFocusMode=toggleFocusMode;
  window.injectAllWeightChips=injectAllWeightChips;
  window.buildDayStrip=buildDayStrip;
  window.applyWeekGridStatus=applyWeekGridStatus;
  window.applyHeroCompact=applyHeroCompact;
  window.applyTipsCollapsible=applyTipsCollapsible;
  window.applyDayTypeColors=applyDayTypeColors;
  window.applyBilingualNames=applyBilingualNames;
  window.openPlanBHint=openPlanBHint;
  window.initT1ProgressiveDisclosure=initT1ProgressiveDisclosure;
  window.injectStepOpsRow=injectStepOpsRow;
  window._uiV99={initFocusMode,initGuideCollapsible,initDailyLogSubtabs,applyHeroCompact,applyWeekGridStatus,buildDayStrip,injectAllWeightChips,toggleFocusMode,applyTipsCollapsible,applyDayTypeColors,applyBilingualNames,openPlanBHint,initT1ProgressiveDisclosure,injectStepOpsRow};
})();
