/* ============================================================
 * BULK MODE V9.0 — Dashboard (Tab 0 / الرئيسية)
 * ============================================================
 * يبني لوحة تحكم ديناميكية تعرض بنظرة واحدة:
 *  • الترحيب + الجلسة المقترحة لليوم
 *  • Streak (حالي + أفضل)
 *  • إحصائيات الأسبوع (سيتات/حجم/PRs/جلسات)
 *  • آخر ٣ PRs
 *  • تقدم الـ ١٢ أسبوع (من firstWorkoutDate)
 *  • التزام اليوم (ماء/نوم/بروتين/وجبات)
 *  • Quick actions
 *
 * يُستدعى refreshDashboard():
 *  - تلقائياً عند فتح tab 0 (من switchToTab في data.js)
 *  - بعد init كاملاً (من app.js)
 *  - بعد endSession (من session.js — اختياري لاحقاً)
 * ============================================================ */

(function(){
  const E=(typeof escHTML==='function')?escHTML:(x=>String(x==null?'':x));

  // ---------- helpers ----------
  function _todayISO(){return new Date().toISOString().split('T')[0]}
  function _todayWd(){return new Date().getDay()}
  function _programDayFor(weekday){
    const days=(typeof EFFECTIVE_PROGRAM!=='undefined' && EFFECTIVE_PROGRAM && EFFECTIVE_PROGRAM.days)
      ?EFFECTIVE_PROGRAM.days
      :(typeof PROGRAM_DATA!=='undefined'?PROGRAM_DATA.days:[]);
    return days.find(d=>d.dayOfWeek===weekday) || null;
  }
  function _safe(fn,def){try{return fn()}catch(e){return def}}

  // ---------- data fetch ----------
  async function _loadData(){
    const [workouts,sets,prs,dailyLogs,firstWorkout]=await Promise.all([
      _safe(()=>db.getAll('workouts'),[]),
      _safe(()=>db.getAll('sets'),[]),
      _safe(()=>db.getAll('prs'),[]),
      _safe(()=>db.getAll('dailyLog'),[]),
      _safe(()=>db.get('settings',KEYS.FIRST_WORKOUT),null)
    ]);
    const workoutsArr=await workouts;
    const setsArr=await sets;
    const prsArr=await prs;
    const dailyArr=await dailyLogs;
    const fwRec=await firstWorkout;
    return {
      workouts:workoutsArr||[],
      sets:setsArr||[],
      prs:prsArr||[],
      dailyLogs:dailyArr||[],
      firstWorkoutDate:fwRec&&fwRec.value||null
    };
  }

  // ---------- compute ----------
  function _weekProgress(firstWorkoutDate){
    if(!firstWorkoutDate) return null;
    const first=new Date(firstWorkoutDate);
    const now=Date.now();
    const days=Math.floor((now-first.getTime())/86400000);
    const week=Math.min(12,Math.max(1,Math.floor(days/7)+1));
    const month=Math.min(3,Math.max(1,Math.floor((week-1)/4)+1));
    return {week,month,daysIn:days,pct:Math.min(100,Math.round((week/12)*100))};
  }

  function _weekStats(sets,workouts){
    const cutoff=Date.now()-7*86400000;
    const inRange=sets.filter(s=>!s.isWarmup && new Date(s.timestamp).getTime()>=cutoff);
    const inRangeW=workouts.filter(w=>new Date(w.startTime).getTime()>=cutoff);
    return {
      sets:inRange.length,
      volume:Math.round(inRange.reduce((a,s)=>a+s.weight*s.reps,0)),
      prs:inRange.filter(s=>s.isPR).length,
      sessions:inRangeW.length
    };
  }

  function _todayDaily(dailyLogs){
    const t=_todayISO();
    const log=dailyLogs.find(d=>d.date===t)||{};
    const meals=Array.isArray(log.meals)?log.meals.filter(Boolean).length:0;
    const supps=log.supplements?Object.values(log.supplements).filter(Boolean).length:0;
    return {
      water:log.water||0,
      sleep:log.sleep||0,
      protein:log.protein||0,
      meals,
      supps,
      hasAny:!!(log.water||log.sleep||log.protein||meals||supps)
    };
  }

  // V9.1 (A.3) — يقرأ totals الفعلية من foodEntries اليوم (يطغى على protein اليدوي لو موجود)
  async function _todayNutritionTotals(){
    if(typeof getNutritionTotals!=='function') return null;
    try{ return await getNutritionTotals(_todayISO()); }catch(e){return null}
  }

  async function _proteinTarget(){
    try{
      const rec=await db.get('settings',KEYS.USER_PROFILE);
      const p=rec&&rec.value;
      if(!p||!p.weight) return null;
      // ~2.2 جم/كجم — متوسط لتضخيم
      return Math.round(p.weight*2.2);
    }catch(e){return null}
  }

  // ---------- render ----------
  function _heroBlock(todayProg,activeSession,missedDay){
    const dayName=['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][_todayWd()];
    if(activeSession){
      return `
        <div class="dash-hero dash-hero-active">
          <div class="dh-tag">جلسة نشطة الآن</div>
          <div class="dh-title">${E(activeSession.dayType||'تمرين')}</div>
          <div class="dh-sub">سجّلت ${E(activeSession.setsCount||0)} سيت · ${E(activeSession.prCount||0)} PR</div>
          <button class="dh-cta" onclick="switchToTab(1)">↩ ارجع للجلسة</button>
        </div>`;
    }
    if(!todayProg){
      return `
        <div class="dash-hero">
          <div class="dh-tag">${E(dayName)}</div>
          <div class="dh-title">يوم حر</div>
          <div class="dh-sub">لا جلسة مجدولة اليوم</div>
          <button class="dh-cta dh-cta-secondary" onclick="switchToTab(1)">عرض كل أيام البرنامج</button>
        </div>`;
    }
    if(todayProg.isRest||todayProg.type==='REST'){
      const missedHint=missedDay?`<div class="dh-missed">⚠️ فاتك يوم ${E(missedDay.type)} — يمكنك تعويضه اليوم.</div>`:'';
      return `
        <div class="dash-hero dash-hero-rest">
          <div class="dh-tag">${E(dayName)} · 🧘 راحة</div>
          <div class="dh-title">${E(todayProg.label||'يوم راحة نشطة')}</div>
          <div class="dh-sub">جسمك يبني العضل اليوم — لا تفوّت وجباتك ونومك.</div>
          ${missedHint}
          <button class="dh-cta dh-cta-secondary" onclick="switchToTab(1)">شاهد البرنامج</button>
        </div>`;
    }
    const sets=todayProg.stats&&todayProg.stats.sets||'—';
    const mins=todayProg.stats&&todayProg.stats.minutes||'—';
    return `
      <div class="dash-hero">
        <div class="dh-tag">${E(dayName)} · جلسة اليوم</div>
        <div class="dh-title">${E(todayProg.type||todayProg.label)}</div>
        <div class="dh-sub">${E(sets)} سيت · ${E(mins)} دقيقة · ${E((todayProg.stats&&todayProg.stats.exercises)||'—')} تمارين</div>
        <button class="dh-cta" onclick="switchToTab(1)">💪 ابدأ جلسة اليوم</button>
      </div>`;
  }

  function _streakBlock(streak){
    const cur=streak&&streak.current||0;
    const best=streak&&streak.best||0;
    const fire=cur>=7?'🔥🔥🔥':cur>=3?'🔥🔥':cur>=1?'🔥':'•';
    return `
      <div class="dash-streak">
        <div class="ds-icon">${fire}</div>
        <div class="ds-body">
          <div class="ds-current"><b>${cur}</b><span>يوم متتالي</span></div>
          <div class="ds-best">الأفضل: <b>${best}</b> يوم</div>
        </div>
      </div>`;
  }

  function _statsBlock(week){
    const items=[
      {n:week.sessions,l:'جلسة'},
      {n:week.sets,l:'سيت'},
      {n:week.volume.toLocaleString('en'),l:'كجم رفعت'},
      {n:week.prs,l:'PR جديد'}
    ];
    return `
      <div class="dash-stats">
        <div class="dash-stats-head">📊 آخر ٧ أيام</div>
        <div class="dash-stats-grid">
          ${items.map(it=>`<div class="dss-cell"><b>${E(it.n)}</b><span>${E(it.l)}</span></div>`).join('')}
        </div>
      </div>`;
  }

  function _prsBlock(prs){
    if(!prs.length){
      return `
        <div class="dash-card">
          <div class="dash-card-head">🏆 آخر الأرقام القياسية</div>
          <div class="dash-empty">لا PRs بعد — سجّل سيتاتك في تبويب التمارين وستبدأ تظهر هنا.</div>
        </div>`;
    }
    const recent=[...prs].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,3);
    const typeLabel={weight:'وزن',volume:'حجم','1rm':'1RM',reps:'تكرار',effort:'جهد أقل'};
    return `
      <div class="dash-card">
        <div class="dash-card-head">🏆 آخر الأرقام القياسية</div>
        <div class="dash-prs">
          ${recent.map(p=>{
            const ago=Math.max(0,Math.floor((Date.now()-new Date(p.date).getTime())/86400000));
            const agoTxt=ago===0?'اليوم':ago===1?'أمس':ago+' أيام';
            return `<div class="dpr-item">
              <div class="dpr-ex">${E(p.exerciseName)}</div>
              <div class="dpr-meta"><span class="dpr-type">${E(typeLabel[p.type]||p.type)}</span> · ${E(p.value)} · ${E(agoTxt)}</div>
            </div>`;
          }).join('')}
        </div>
        <button class="dash-card-more" onclick="switchToTab(7)">شاهد كل الأرقام ›</button>
      </div>`;
  }

  function _programProgressBlock(wp){
    if(!wp){
      return `
        <div class="dash-card">
          <div class="dash-card-head">📅 برنامج الـ ١٢ أسبوع</div>
          <div class="dash-empty">سيبدأ العدّ من أول جلسة تسجّلها.</div>
        </div>`;
    }
    const phase=wp.month===1?'الشهر الأول · التكيّف':wp.month===2?'الشهر الثاني · الزيادة':'الشهر الثالث · الذروة';
    return `
      <div class="dash-card">
        <div class="dash-card-head">📅 الأسبوع ${E(wp.week)} من ١٢</div>
        <div class="dash-progress-bar"><div class="dpb-fill" style="width:${wp.pct}%"></div></div>
        <div class="dash-progress-meta"><span>${E(phase)}</span><span>${E(wp.pct)}%</span></div>
      </div>`;
  }

  function _dailyBlock(daily,proteinTarget,nutrition){
    // V9.1 (A.3) — لو فيه foodEntries، استخدم البروتين الفعلي بدل اليدوي
    const proteinShown = (nutrition && nutrition.count>0) ? nutrition.protein : daily.protein;
    const proteinPct=proteinTarget?Math.round((proteinShown/proteinTarget)*100):null;
    const items=[
      {ic:'💧',lbl:'ماء',v:daily.water+'/8',pct:Math.round(daily.water/8*100)},
      {ic:'😴',lbl:'نوم',v:daily.sleep+'/8 س',pct:Math.round(daily.sleep/8*100)},
      {ic:'🍽️',lbl:'وجبات',v:daily.meals+'/6',pct:Math.round(daily.meals/6*100)},
      {ic:'🥩',lbl:'بروتين',v:proteinTarget?`${proteinShown}/${proteinTarget}g`:`${proteinShown}g`,pct:proteinPct||0}
    ];
    return `
      <div class="dash-card">
        <div class="dash-card-head">📅 التزام اليوم</div>
        <div class="dash-daily">
          ${items.map(it=>`
            <div class="ddl-item">
              <div class="ddl-icon">${it.ic}</div>
              <div class="ddl-body">
                <div class="ddl-row"><span class="ddl-lbl">${E(it.lbl)}</span><b>${E(it.v)}</b></div>
                <div class="ddl-track"><div class="ddl-fill" style="width:${Math.min(100,Math.max(0,it.pct))}%"></div></div>
              </div>
            </div>`).join('')}
        </div>
        <button class="dash-card-more" onclick="switchToTab(7);setTimeout(()=>{const b=document.querySelector('.prog-tab[data-pt=\\'daily\\']');if(b)b.click()},120)">سجّل يومك ›</button>
      </div>`;
  }

  // V9.1 (A.3) — بطاقة Nutrition منفصلة لو فيه food entries اليوم
  function _nutritionBlock(nutrition,targets){
    if(!nutrition || nutrition.count===0) return '';
    const t=targets;
    const items = t ? [
      {lbl:'سعرات', v:`${nutrition.kcal}/${t.calories}`, pct:Math.round(nutrition.kcal/t.calories*100), unit:''},
      {lbl:'بروتين',v:`${nutrition.protein}/${t.protein}`, pct:Math.round(nutrition.protein/t.protein*100), unit:'g'},
      {lbl:'كارب',  v:`${nutrition.carbs}/${t.carb}`,     pct:Math.round(nutrition.carbs/t.carb*100), unit:'g'},
      {lbl:'دهون',  v:`${nutrition.fat}/${t.fat}`,        pct:Math.round(nutrition.fat/t.fat*100), unit:'g'}
    ] : [
      {lbl:'سعرات',v:`${nutrition.kcal}`,pct:null,unit:''},
      {lbl:'بروتين',v:`${nutrition.protein}`,pct:null,unit:'g'},
      {lbl:'كارب',v:`${nutrition.carbs}`,pct:null,unit:'g'},
      {lbl:'دهون',v:`${nutrition.fat}`,pct:null,unit:'g'}
    ];
    return `
      <div class="dash-card">
        <div class="dash-card-head">🥩 التغذية اليوم (${E(nutrition.count)} وجبة)</div>
        <div class="dash-nutrition-grid">
          ${items.map(it=>`
            <div class="dn-cell">
              <div class="dn-cell-lbl">${E(it.lbl)}</div>
              <div class="dn-cell-val"><b>${E(it.v)}</b>${E(it.unit)}</div>
              ${it.pct!=null?`<div class="dn-cell-bar"><div class="dn-cell-fill ${it.pct>110?'over':it.pct>=70?'ok':'low'}" style="width:${Math.min(100,it.pct)}%"></div></div>`:''}
            </div>`).join('')}
        </div>
        <button class="dash-card-more" onclick="openFoodSearch&&openFoodSearch()">+ أضف وجبة جديدة</button>
      </div>`;
  }

  function _quickActionsBlock(){
    return `
      <div class="dash-actions">
        <button class="dash-action" onclick="switchToTab(1)"><span>💪</span><b>ابدأ جلسة</b></button>
        <button class="dash-action" onclick="openWeeklyReview&&openWeeklyReview()"><span>📊</span><b>ملخص الأسبوع</b></button>
        <button class="dash-action" onclick="switchToTab(7);setTimeout(()=>{const b=document.querySelector('.prog-tab[data-pt=\\'metrics\\']');if(b)b.click()},120)"><span>📏</span><b>سجّل قياسات</b></button>
        <button class="dash-action" onclick="openPlateCalc()"><span>🧮</span><b>حاسبة بليتات</b></button>
      </div>`;
  }

  function _emptyOnboardBlock(){
    return `
      <div class="dash-hero dash-hero-welcome">
        <div class="dh-tag">أهلاً بك في BULK MODE 💪</div>
        <div class="dh-title">ابدأ رحلتك الآن</div>
        <div class="dh-sub">برنامج تضخيم ١٢ أسبوع، تتبع احترافي، خصوصية ١٠٠٪.<br>سجّل أول جلسة لتبدأ رحلتك.</div>
        <button class="dh-cta" onclick="switchToTab(1)">💪 ابدأ أول جلسة</button>
        <div class="dh-secondary"><button onclick="openProfile()">✏️ أكمل ملفك الشخصي أولاً</button></div>
      </div>`;
  }

  // ---------- main ----------
  async function refreshDashboard(){
    const container=document.getElementById('dashboardContainer');
    if(!container) return;
    try{
      const data=await _loadData();
      const todayProg=_programDayFor(_todayWd());
      const activeSession=(typeof currentSession!=='undefined')?currentSession:null;
      const wp=_weekProgress(data.firstWorkoutDate);

      // مستخدم جديد تماماً
      if(!data.workouts.length && !activeSession){
        container.innerHTML=_emptyOnboardBlock();
        return;
      }

      const streak=(typeof computeStreak==='function')?computeStreak(data.workouts):{current:0,best:0};
      const week=_weekStats(data.sets,data.workouts);
      const daily=_todayDaily(data.dailyLogs);
      const proteinTarget=await _proteinTarget();
      // V9.1 (A.3) — nutrition totals + targets
      const nutrition=await _todayNutritionTotals();
      const nutritionTargets=(typeof getNutritionTargets==='function')?await getNutritionTargets():null;

      // اكتشف يوم تدريب فات (آخر ٧ أيام)
      let missedDay=null;
      if(todayProg && (todayProg.isRest||todayProg.type==='REST')){
        const today=new Date();today.setHours(0,0,0,0);
        for(let i=1;i<=3;i++){
          const dt=new Date(today);dt.setDate(dt.getDate()-i);
          const pd=_programDayFor(dt.getDay());
          if(!pd||pd.isRest||pd.type==='REST') continue;
          const iso=dt.toISOString().split('T')[0];
          const had=data.workouts.some(w=>w.startTime && w.startTime.split('T')[0]===iso);
          if(!had){missedDay=pd;break}
        }
      }

      container.innerHTML=`
        ${_heroBlock(todayProg,activeSession,missedDay)}
        <div class="dash-grid dash-grid-2">
          ${_streakBlock(streak)}
          ${_statsBlock(week)}
        </div>
        ${_quickActionsBlock()}
        ${_programProgressBlock(wp)}
        ${_prsBlock(data.prs)}
        ${_nutritionBlock(nutrition,nutritionTargets)}
        ${_dailyBlock(daily,proteinTarget,nutrition)}
      `;
    }catch(e){
      console.error('Dashboard refresh failed:',e);
      container.innerHTML=`<div class="dash-empty">⚠️ تعذّر تحميل لوحة التحكم. أعد فتح الصفحة.</div>`;
    }
  }

  // expose
  window.refreshDashboard=refreshDashboard;
})();
