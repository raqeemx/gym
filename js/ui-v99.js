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
    document.body.classList.toggle('focus-mode',FOCUS_MODE);
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
    if(bar.querySelector('.sb-focus')) return;
    const btn=document.createElement('button');
    btn.className='sb-focus';
    btn.type='button';
    btn.title='Focus Mode';
    btn.textContent='◎';
    btn.onclick=(e)=>{e.stopPropagation();toggleFocusMode()};
    // ضع زر Focus قبل زر إنهاء الجلسة
    const endBtn=bar.querySelector('.sb-end');
    if(endBtn) bar.insertBefore(btn,endBtn);
    else bar.appendChild(btn);
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

    const chip=document.createElement('div');
    chip.className=cls.join(' ');
    chip.innerHTML=`
      <div class="wc-icon">⚖</div>
      <div class="wc-body">
        <div class="wc-label">${E(chipLabel)}</div>
        <div class="wc-val"><b>${chipW!=null?E(chipW):'—'}</b><small>كجم</small></div>
        ${repsText?`<div class="wc-reps">🎯 الهدف: <b>${E(repsText)}</b> تكرار</div>`:''}
      </div>
      ${(chipW!=null && !isFirstTime)?`<button type="button" class="wc-apply">تطبيق</button>`:''}
    `;
    const applyBtn=chip.querySelector('.wc-apply');
    if(applyBtn){
      applyBtn.onclick=(e)=>{
        e.stopPropagation();
        const wInput=trackDiv.querySelector('.weight-input');
        if(wInput){
          wInput.value=chipW;
          wInput.dispatchEvent(new Event('input',{bubbles:true}));
          wInput.focus();
          // اقفز إلى reps
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
    const cells=document.querySelectorAll('.fu2 .wg .wc');
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
    // Week grid
    document.querySelectorAll('.fu2 .wg .wc').forEach(cell=>{
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

  // expose
  window.toggleFocusMode=toggleFocusMode;
  window.injectAllWeightChips=injectAllWeightChips;
  window.buildDayStrip=buildDayStrip;
  window.applyWeekGridStatus=applyWeekGridStatus;
  window.applyHeroCompact=applyHeroCompact;
  window.applyTipsCollapsible=applyTipsCollapsible;
  window.applyDayTypeColors=applyDayTypeColors;
  window.applyBilingualNames=applyBilingualNames;
  window._uiV99={initFocusMode,initGuideCollapsible,initDailyLogSubtabs,applyHeroCompact,applyWeekGridStatus,buildDayStrip,injectAllWeightChips,toggleFocusMode,applyTipsCollapsible,applyDayTypeColors,applyBilingualNames};
})();
