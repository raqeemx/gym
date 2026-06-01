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
  // V9.7 (#14) — استخدم getProgramWeekProgress للبرنامج النشط بدل firstWorkoutDate الموحّد
  async function _weekProgress(){
    if(typeof getProgramWeekProgress==='function'){
      const wp=await getProgramWeekProgress();
      if(wp) return wp;
    }
    // fallback: firstWorkoutDate (legacy)
    try{
      const fw=await db.get('settings',KEYS.FIRST_WORKOUT);
      if(fw && fw.value){
        const first=new Date(fw.value);
        const days=Math.floor((Date.now()-first.getTime())/86400000);
        const week=Math.min(12,Math.max(1,Math.floor(days/7)+1));
        const month=Math.min(3,Math.max(1,Math.floor((week-1)/4)+1));
        return {week,month,daysIn:days,pct:Math.min(100,Math.round((week/12)*100))};
      }
    }catch(e){}
    return null;
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
    const mealsArr=Array.isArray(log.meals)?log.meals:[];
    const meals=mealsArr.filter(Boolean).length;
    const supps=log.supplements?Object.values(log.supplements).filter(Boolean).length:0;
    return {
      water:log.water||0,
      sleep:log.sleep||0,
      protein:log.protein||0,
      meals,
      mealsArr, // V9.13 (#8) — array الأصلي لمعرفة أيها مُسجّل
      supps,
      hasAny:!!(log.water||log.sleep||log.protein||meals||supps)
    };
  }

  // V9.1 (A.3) — يقرأ totals الفعلية من foodEntries اليوم (يطغى على protein اليدوي لو موجود)
  async function _todayNutritionTotals(){
    if(typeof getNutritionTotals!=='function') return null;
    try{ return await getNutritionTotals(_todayISO()); }catch(e){return null}
  }

  // V9.6 (#5) — breakdown حسب mealSlot
  async function _todayNutritionBreakdown(){
    if(typeof getNutritionBreakdown!=='function') return null;
    try{ return await getNutritionBreakdown(_todayISO()); }catch(e){return null}
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
  // V9.2 (B.7) — heroBlock يقبل smartReco كاقتراح ذكي بديل/مكمّل
  function _heroBlock(todayProg,activeSession,missedDay,smartReco){
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
    // "يوم حر" — استخدم smart recommendation لو متاح
    if(!todayProg){
      if(smartReco && smartReco.day){
        return `
          <div class="dash-hero dash-hero-smart">
            <div class="dh-tag">${E(dayName)} · اقتراح ذكي</div>
            <div class="dh-title">${E(smartReco.day.type||smartReco.day.label)}</div>
            <div class="dh-sub">${smartReco.reason}</div>
            <button class="dh-cta" onclick="switchToTab(1)">💪 ابدأ ${E(smartReco.day.type||'الجلسة')}</button>
          </div>`;
      }
      return `
        <div class="dash-hero">
          <div class="dh-tag">${E(dayName)}</div>
          <div class="dh-title">يوم حر</div>
          <div class="dh-sub">لا جلسة مجدولة اليوم</div>
          <button class="dh-cta dh-cta-secondary" onclick="switchToTab(1)">عرض كل أيام البرنامج</button>
        </div>`;
    }
    if(todayProg.isRest||todayProg.type==='REST'){
      // أولوية: missed > smart > رسالة راحة عادية
      let extraBlock='';
      if(missedDay){
        extraBlock=`<div class="dh-missed">⚠️ فاتك يوم ${E(missedDay.type)} — يمكنك تعويضه اليوم.</div>`;
      }else if(smartReco && smartReco.day && smartReco.urgency!=='low'){
        extraBlock=`<div class="dh-missed">💡 لو تبي تتمرن: <b>${E(smartReco.day.type||smartReco.day.label)}</b> — ${smartReco.reason}</div>`;
      }
      return `
        <div class="dash-hero dash-hero-rest">
          <div class="dh-tag">${E(dayName)} · 🧘 راحة</div>
          <div class="dh-title">${E(todayProg.label||'يوم راحة نشطة')}</div>
          <div class="dh-sub">جسمك يبني العضل اليوم — لا تفوّت وجباتك ونومك.</div>
          ${extraBlock}
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
    // V9.2 (C.10) — قابل للضغط: يفتح Streak Page التفصيلية
    return `
      <button type="button" class="dash-streak dash-streak-btn" onclick="openStreakPage&&openStreakPage()" aria-label="عرض تفاصيل الـ Streak">
        <div class="ds-icon">${fire}</div>
        <div class="ds-body">
          <div class="ds-current"><b>${cur}</b><span>يوم متتالي</span></div>
          <div class="ds-best">الأفضل: <b>${best}</b> يوم · <small>اضغط للتفاصيل ›</small></div>
        </div>
      </button>`;
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

  // V9.8 (#16) — widget: الإنجاز القادم
  function _nextAchievementBlock(next){
    if(!next) return '';
    const pct=Math.round(next.pct*100);
    const remaining=next.remaining;
    const unit=next.unit||'';
    return `
      <div class="dash-card dash-next-ach">
        <div class="dash-card-head">🏅 إنجاز قادم</div>
        <button type="button" class="dna-row" onclick="switchToTab(7);setTimeout(()=>{const b=document.querySelector('.prog-tab[data-pt=\\'achievements\\']');if(b)b.click()},120)">
          <div class="dna-icon">${E(next.ach.icon)}</div>
          <div class="dna-body">
            <div class="dna-name">${E(next.ach.title)}</div>
            <div class="dna-desc">${E(next.ach.desc)}</div>
            <div class="dna-progress">
              <div class="dna-track"><div class="dna-fill" style="width:${pct}%"></div></div>
              <div class="dna-meta">باقي <b>${E(remaining)}</b>${unit?' '+E(unit):''} · ${E(pct)}%</div>
            </div>
          </div>
        </button>
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

  // V9.1 (A.3) + V9.6 (#5, #8) — بطاقة Nutrition: totals + fiber + breakdown حسب الوجبة
  function _nutritionBlock(nutrition,targets,breakdown){
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

    // V9.6 (#8) — fiber row إذا فيه (>0)
    const fiberRow = nutrition.fiber>0
      ? `<div class="dn-fiber-row">🌾 ألياف: <b>${E(nutrition.fiber)}g</b> <small>(هدف ~٢٥-٣٥g/يوم)</small></div>`
      : '';

    // V9.6 (#5) — breakdown حسب mealSlot (لو فيه على الأقل وجبتين في slots مختلفة)
    let breakdownHtml='';
    if(breakdown){
      const labels=(typeof MEAL_SLOT_LABELS!=='undefined')?MEAL_SLOT_LABELS:{};
      const icons=(typeof MEAL_SLOT_ICONS!=='undefined')?MEAL_SLOT_ICONS:{};
      const order=(typeof MEAL_SLOT_ORDER!=='undefined')?MEAL_SLOT_ORDER:[];
      const active=order.filter(s=>breakdown[s] && breakdown[s].count>0);
      if(active.length>=1){
        breakdownHtml=`
          <div class="dn-breakdown">
            <div class="dn-breakdown-head">⏱ التوزيع على الوجبات</div>
            <div class="dn-breakdown-grid">
              ${active.map(s=>{
                const b=breakdown[s];
                return `<div class="dn-bd-cell">
                  <span class="dn-bd-icon">${icons[s]||'🍽️'}</span>
                  <div class="dn-bd-text">
                    <b>${E(labels[s]||s)}</b>
                    <small>${E(b.kcal)} سعرة · ${E(b.protein)}g بروتين</small>
                  </div>
                </div>`;
              }).join('')}
              ${breakdown.unassigned && breakdown.unassigned.count>0?`
                <div class="dn-bd-cell dn-bd-unassigned">
                  <span class="dn-bd-icon">❓</span>
                  <div class="dn-bd-text">
                    <b>غير محدّد</b>
                    <small>${E(breakdown.unassigned.count)} وجبة · حدّد التوقيت لتحليل أفضل</small>
                  </div>
                </div>`:''}
            </div>
          </div>`;
      }
    }

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
        ${fiberRow}
        ${breakdownHtml}
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

  // ============================================================
  // V9.14 — Homepage Redesign (Hero + Today's Workout + Program Summary)
  // ============================================================

  // ----- خريطة الأهداف العضلية لكل dayType -----
  const DAY_TARGETS={
    'UPPER A':'صدر · ظهر · أكتاف',
    'UPPER B':'صدر · ظهر · أكتاف',
    'BACK & WINGS':'ظهر · كتف خلفي · بايسبس',
    'ARMS A':'بايسبس · ترايسبس',
    'ARMS B':'بايسبس · ترايسبس',
    'LEGS':'أرجل · سمانة · بطن'
  };
  function _muscleTargets(dayType){
    if(!dayType) return null;
    const t=String(dayType).trim().toUpperCase();
    for(const [key,val] of Object.entries(DAY_TARGETS)){
      if(t.includes(key)) return val;
    }
    // fallback ذكي
    if(/UPPER/.test(t)) return 'صدر · ظهر · أكتاف';
    if(/BACK|WING/.test(t)) return 'ظهر · كتف خلفي';
    if(/ARMS?/.test(t)) return 'بايسبس · ترايسبس';
    if(/LEGS?|أرجل/.test(t)) return 'أرجل · سمانة';
    return null;
  }

  // ----- استخراج أول تمرين (بدون warmup) -----
  function _firstExerciseName(day){
    if(!day||!day.phases) return null;
    for(const ph of day.phases){
      if(ph.type==='warmup') continue;
      if(ph.name){
        const en=String(ph.name).split(/[—↔·]/)[0].trim();
        if(en) return en;
      }
      if(ph.steps && ph.steps.length){
        const s=ph.steps.find(x=>x.type!=='rest');
        if(s) return String(s.name).split(/[—↔·]/)[0].trim();
      }
    }
    return null;
  }

  // ----- 1. HERO SECTION (تفسيري، يفهم المستخدم البرنامج في ٣ ثوانٍ) -----
  function _heroSection(workouts){
    // ابدأ compact للمستخدمين النشطين (٥+ جلسات)
    const isActive=(workouts||[]).length>=5;
    return `
      <details class="hero-v14${isActive?'':' open'}" ${isActive?'':'open'}>
        <summary class="hv-summary">
          <div class="hv-brand">💪 BULK MODE</div>
          <div class="hv-tag">برنامج تضخيم ١٢ أسبوع</div>
          <span class="hv-toggle">▾</span>
        </summary>
        <div class="hv-body">
          <h1 class="hv-title">برنامج تضخيم ١٢ أسبوع — اتبع تمرين اليوم فقط</h1>
          <p class="hv-desc">خطة عربية للتضخيم باستخدام أجهزة الجيم، مع أوزان مقترحة، راحة محسوبة، و<b>Plan B</b> إذا كان الجهاز مشغولاً.</p>
          <div class="hv-actions">
            <button type="button" class="hv-cta hv-cta-primary" onclick="switchToTab(1)">💪 ابدأ تمرين اليوم</button>
            <button type="button" class="hv-cta hv-cta-secondary" onclick="switchToTab(8)">📅 شاهد جدول الأسبوع</button>
            <button type="button" class="hv-cta hv-cta-tertiary" onclick="switchToTab(6)">🎯 أول مرة في الجيم؟</button>
          </div>
        </div>
      </details>`;
  }

  // ----- 2. TODAY'S WORKOUT CARD (أهم عنصر في الصفحة) -----
  function _todayWorkoutCard(todayProg,activeSession,workouts,missedDay,smartReco){
    const arDayNames=['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    const todayName=arDayNames[_todayWd()];
    const today=_todayISO();

    // أ. جلسة نشطة → كرت "ارجع للجلسة"
    if(activeSession){
      return `
        <div class="today-card today-active">
          <div class="tc-header">
            <span class="tc-pulse"></span>
            <div class="tc-htext">
              <div class="tc-day">${E(todayName)} · جلسة نشطة الآن</div>
              <div class="tc-title">${E(activeSession.dayType||'تمرين')}</div>
            </div>
          </div>
          <div class="tc-stats">
            <div class="tc-stat"><span class="tcs-lbl">سُجِّل</span><b class="tcs-val">${E(activeSession.setsCount||0)}</b><span class="tcs-unit">سيت</span></div>
            <div class="tc-stat"><span class="tcs-lbl">PR</span><b class="tcs-val">${E(activeSession.prCount||0)}</b><span class="tcs-unit">جديد</span></div>
          </div>
          <button type="button" class="tc-cta tc-cta-active" onclick="switchToTab(1)">↩ ارجع للجلسة</button>
        </div>`;
    }

    // ب. يوم راحة
    if(!todayProg || todayProg.isRest || todayProg.type==='REST'){
      let extraHint='';
      if(missedDay){
        extraHint=`<div class="tc-hint tc-hint-warn">⚠️ فاتك يوم <b>${E(missedDay.type)}</b> — يمكنك تعويضه اليوم.</div>`;
      } else if(smartReco && smartReco.day && smartReco.urgency!=='low'){
        extraHint=`<div class="tc-hint tc-hint-info">💡 لو تبي تتمرن: <b>${E(smartReco.day.type||smartReco.day.label)}</b></div>`;
      }
      return `
        <div class="today-card today-rest">
          <div class="tc-rest-badge">🧘 راحة</div>
          <div class="tc-day-rest">${E(todayName)}</div>
          <div class="tc-title">${E((todayProg&&todayProg.label)||'يوم راحة نشطة')}</div>
          <p class="tc-rest-desc">جسمك يبني العضل اليوم. لا تفوّت وجباتك ونومك.</p>
          ${extraHint}
          <div class="tc-actions">
            <button type="button" class="tc-cta tc-cta-secondary" onclick="switchToTab(1)">شاهد البرنامج</button>
            <button type="button" class="tc-cta tc-cta-tertiary" onclick="switchToTab(7);setTimeout(()=>{const b=document.querySelector('.prog-tab[data-pt=\\'daily\\']');if(b)b.click()},120)">📋 سجّل يومك</button>
          </div>
        </div>`;
    }

    // ج. يوم تدريب — البطاقة الكاملة
    const dayType=todayProg.type||todayProg.label;
    const targets=_muscleTargets(dayType);
    const sets=(todayProg.stats&&todayProg.stats.sets)||'—';
    const exercises=(todayProg.stats&&todayProg.stats.exercises)||'—';
    const mins=(todayProg.stats&&todayProg.stats.minutes)||'—';
    const restRange=todayProg.stats && todayProg.stats.restRange
      ? todayProg.stats.restRange
      : '٦٠–٩٠';
    const firstEx=_firstExerciseName(todayProg);

    // التقدم: لو فيه workout مكتمل اليوم بنفس الـ dayType، أظهر "تم اليوم"
    const todayWorkout=(workouts||[]).find(w=>{
      const d=(w.startTime||'').split('T')[0];
      return d===today && (w.dayType||'').toUpperCase()===String(dayType).toUpperCase();
    });
    let progressLine=`<div class="tc-prog"><span>📊 التقدم:</span><b>0/${E(exercises)}</b><span>تمارين</span></div>`;
    if(todayWorkout){
      progressLine=`<div class="tc-prog tc-prog-done"><span>✓</span><b>اكتمل اليوم</b><span>· ${E(todayWorkout.setsCount||0)} سيت</span></div>`;
    }

    return `
      <div class="today-card today-train">
        <div class="tc-ribbon">⭐ تمرين اليوم</div>
        <div class="tc-grid">
          <div class="tc-info-row tc-info-day">
            <span class="tc-info-lbl">اليوم</span>
            <b class="tc-info-val">${E(todayName)}</b>
          </div>
          <div class="tc-info-row tc-info-session">
            <span class="tc-info-lbl">الجلسة</span>
            <b class="tc-info-val tc-info-session-name">${E(dayType)}</b>
          </div>
          ${targets?`<div class="tc-info-row tc-info-target">
            <span class="tc-info-lbl">الهدف</span>
            <b class="tc-info-val">${E(targets)}</b>
          </div>`:''}
        </div>
        <div class="tc-stats">
          <div class="tc-stat"><span class="tcs-ic">⏱</span><b class="tcs-val">${E(mins)}</b><span class="tcs-unit">دقيقة</span></div>
          <div class="tc-stat"><span class="tcs-ic">🏋</span><b class="tcs-val">${E(exercises)}</b><span class="tcs-unit">تمارين</span></div>
          <div class="tc-stat"><span class="tcs-ic">⏸</span><b class="tcs-val">${E(restRange)}</b><span class="tcs-unit">ث راحة</span></div>
        </div>
        ${progressLine}
        ${firstEx?`<div class="tc-first-ex">
          <span class="tc-fe-lbl">▶ أول تمرين</span>
          <b class="tc-fe-name">${E(firstEx)}</b>
        </div>`:''}
        <div class="tc-actions tc-actions-3">
          <button type="button" class="tc-cta tc-cta-primary" onclick="switchToTab(1)">💪 ابدأ الجلسة</button>
          <button type="button" class="tc-cta tc-cta-secondary" onclick="switchToTab(1)">عرض التمارين</button>
          <button type="button" class="tc-cta tc-cta-tertiary" onclick="openPlanBHint&&openPlanBHint()">🔄 الجهاز مشغول؟</button>
        </div>
      </div>`;
  }

  // ----- 3. PROGRAM QUICK SUMMARY (6 badges صغيرة) -----
  function _programQuickSummary(){
    const items=[
      {ic:'📅', val:'12', lbl:'أسبوع'},
      {ic:'💪', val:'6', lbl:'أيام تمرين'},
      {ic:'⏱', val:'52–57', lbl:'دقيقة للجلسة'},
      {ic:'⏸', val:'60', lbl:'ث راحة'},
      {ic:'🥩', val:'175g', lbl:'بروتين'},
      {ic:'🔄', val:'Plan B', lbl:'لكل تمرين'}
    ];
    return `
      <div class="program-summary-grid">
        ${items.map(it=>`
          <div class="psg-card">
            <div class="psg-ic">${it.ic}</div>
            <div class="psg-val">${E(it.val)}</div>
            <div class="psg-lbl">${E(it.lbl)}</div>
          </div>`).join('')}
      </div>`;
  }

  // (V9.11) — Status Strip القديم يبقى لأن الإيقاف يكسر التحديثات السابقة
  function _statusStrip(wp,streak,todayProg,profileMissing){
    const parts=[];
    if(wp){
      parts.push(`<span class="dss-pill"><b>${E(wp.week)}</b><small>/١٢</small> أسبوع</span>`);
    }
    if(streak && streak.current>0){
      parts.push(`<span class="dss-pill dss-streak">🔥 <b>${E(streak.current)}</b> يوم</span>`);
    }
    if(todayProg){
      const isRest=todayProg.isRest||todayProg.type==='REST';
      const lbl=isRest?'🧘 راحة':(todayProg.type||todayProg.label||'تمرين');
      parts.push(`<span class="dss-pill dss-day ${isRest?'rest':''}">⭐ ${E(lbl)} اليوم</span>`);
    }
    // نقطة "بياناتك" — تشير لو الملف ناقص
    if(profileMissing){
      parts.push(`<button type="button" class="dss-pill dss-profile-missing" onclick="openProfile()" title="أكمل ملفك الشخصي">👤 ${E('أكمل ملفك')}</button>`);
    }
    if(!parts.length) return '';
    return `<div class="dash-status-strip">${parts.join('')}</div>`;
  }

  // 2. PRIMARY ACTION HERO — أكبر عنصر، CTA كبير، سطر تحفيزي
  function _primaryHero(todayProg,activeSession,missedDay,smartReco,streak){
    // أ. جلسة نشطة — عُد إليها
    if(activeSession){
      return `
        <div class="dash-primary dash-primary-active">
          <div class="dpr-tag">⏺ جلسة نشطة الآن</div>
          <div class="dpr-title">${E(activeSession.dayType||'تمرين')}</div>
          <div class="dpr-meta">سجّلت <b>${E(activeSession.setsCount||0)}</b> سيت · <b>${E(activeSession.prCount||0)}</b> PR</div>
          <button class="dpr-cta dpr-cta-active" onclick="switchToTab(1)">↩ ارجع للجلسة</button>
        </div>`;
    }
    // ب. يوم راحة — رسالة هادئة
    if(todayProg && (todayProg.isRest||todayProg.type==='REST')){
      let extra='';
      if(missedDay){
        extra=`<div class="dpr-extra">⚠️ فاتك يوم <b>${E(missedDay.type)}</b> — يمكنك تعويضه اليوم.</div>`;
      } else if(smartReco && smartReco.day && smartReco.urgency!=='low'){
        extra=`<div class="dpr-extra">💡 لو تبي تتمرن: <b>${E(smartReco.day.type||smartReco.day.label)}</b></div>`;
      }
      return `
        <div class="dash-primary dash-primary-rest">
          <div class="dpr-tag">🧘 يوم راحة نشطة</div>
          <div class="dpr-title">${E(todayProg.label||'استرح وتعافَ')}</div>
          <div class="dpr-meta">جسمك يبني العضل اليوم — لا تفوّت وجباتك ونومك</div>
          ${extra}
          <button class="dpr-cta dpr-cta-secondary" onclick="switchToTab(1)">شاهد البرنامج ›</button>
        </div>`;
    }
    // ج. يوم حر بدون برنامج
    if(!todayProg){
      const target = (smartReco && smartReco.day) ? smartReco.day : null;
      if(target){
        return `
          <div class="dash-primary">
            <div class="dpr-tag">اقتراح ذكي</div>
            <div class="dpr-title">${E(target.type||target.label)}</div>
            <div class="dpr-meta">${E(smartReco.reason||'بناءً على آخر جلساتك')}</div>
            <button class="dpr-cta" onclick="switchToTab(1)">💪 ابدأ ${E(target.type||'الجلسة')}</button>
          </div>`;
      }
      return `
        <div class="dash-primary dash-primary-rest">
          <div class="dpr-tag">يوم حر</div>
          <div class="dpr-title">لا جلسة مجدولة اليوم</div>
          <div class="dpr-meta">يمكنك تعويض يوم فات أو الراحة</div>
          <button class="dpr-cta dpr-cta-secondary" onclick="switchToTab(1)">عرض كل الأيام ›</button>
        </div>`;
    }
    // د. يوم تدريب — السيناريو الأساسي
    const dayType=todayProg.type||todayProg.label;
    const sets=(todayProg.stats&&todayProg.stats.sets)||'—';
    const mins=(todayProg.stats&&todayProg.stats.minutes)||'—';
    const exs=(todayProg.stats&&todayProg.stats.exercises)||'—';
    // V9.12 (#1) — أول تمرين فعلي (تخطّ phase الإحماء)
    let firstEx=null;
    if(todayProg.phases && todayProg.phases.length){
      for(const ph of todayProg.phases){
        if(ph.type==='warmup') continue;
        // اسم التمرين الأول — قد يكون phase.name (مثلاً "Chest Press — راحة كاملة" أو "Lat Machine ↔ Shoulder Press")
        if(ph.name){
          // خذ ما قبل أول "—" أو "↔" أو "·"
          firstEx=String(ph.name).split(/[—↔·]/)[0].trim();
          break;
        }
        // fallback: أول step غير rest
        if(ph.steps && ph.steps.length){
          const s=ph.steps.find(x=>x.type!=='rest');
          if(s){firstEx=String(s.name).split(/[—↔·]/)[0].trim();break}
        }
      }
    }
    // سطر تحفيزي ديناميكي
    let motivation='';
    if(streak && streak.current>=3){
      motivation=`🔥 ${streak.current} أيام متتالية — لا تكسر السلسلة!`;
    } else if(streak && streak.current===0){
      motivation=`🌱 ابدأ سلسلة جديدة اليوم`;
    } else {
      motivation=`💪 يوم تدريب — كل سيت يبني عضل`;
    }
    // V9.12 (#1) — زر Plan B ثانوي: يفتح t1 ويرشد لاستخدام ⇄
    const planBBtn=`<button class="dpr-cta-secondary dpr-cta-row" onclick="openPlanBHint&&openPlanBHint()" title="إذا كان الجهاز مشغولاً، اضغط زر ⇄ بجانب أي تمرين">🔄 الجهاز مشغول؟ Plan B</button>`;
    return `
      <div class="dash-primary">
        <div class="dpr-tag">⭐ جلسة اليوم</div>
        <div class="dpr-title">${E(dayType)}</div>
        <div class="dpr-meta">⏱ ~<b>${E(mins)}</b> دقيقة · 💪 <b>${E(sets)}</b> سيت · 🏋 <b>${E(exs)}</b> تمارين</div>
        ${firstEx?`<div class="dpr-first-ex"><span class="dpr-fe-lbl">▶ أول تمرين:</span><b>${E(firstEx)}</b></div>`:''}
        <button class="dpr-cta" onclick="switchToTab(1)">💪 ابدأ تمرين اليوم</button>
        <div class="dpr-actions-row">${planBBtn}</div>
        <div class="dpr-motivation">${motivation}</div>
      </div>`;
  }

  // V9.13 (#9) — Top Progress Card: أسبوع N/6 + آخر PR + الالتزام
  // يظهر بعد Primary Hero مباشرة لإحساس يومي بالتقدم
  function _topProgressCard(workouts,prs,dailyLogs,sets){
    // أ. هذا الأسبوع: عدد أيام التمرين / الهدف (٦)
    const cutoff=Date.now()-7*86400000;
    const recentWorkouts=workouts.filter(w=>new Date(w.startTime||0).getTime()>=cutoff);
    const target=6;
    const sessionsDone=Math.min(recentWorkouts.length,target);
    const sessionsPct=Math.round(sessionsDone/target*100);
    // ب. آخر PR (أحدث)
    let lastPr=null;
    if(prs && prs.length){
      const sorted=[...prs].sort((a,b)=>new Date(b.date)-new Date(a.date));
      lastPr=sorted[0];
    }
    // ج. الالتزام (آخر ٧ أيام: % أيام مع dailyLog فيها بيانات)
    let complianceDays=0;
    const today=new Date();today.setHours(0,0,0,0);
    for(let i=0;i<7;i++){
      const dt=new Date(today);dt.setDate(dt.getDate()-i);
      const iso=dt.toISOString().split('T')[0];
      const log=dailyLogs.find(d=>d.date===iso);
      if(log && (log.water||log.sleep||log.protein||(Array.isArray(log.meals)&&log.meals.some(Boolean)))){
        complianceDays++;
      }
    }
    const compliancePct=Math.round(complianceDays/7*100);
    // PR delta نص جميل
    const prLabel = lastPr ? _prDeltaLabel(lastPr) : null;

    return `
      <div class="dash-top-progress">
        <div class="dtp-row dtp-sessions">
          <div class="dtp-head"><span class="dtp-ic">📅</span><span class="dtp-lbl">هذا الأسبوع</span><b class="dtp-val">${sessionsDone}/${target} تمارين</b></div>
          <div class="dtp-track"><div class="dtp-fill dtp-fill-sessions" style="width:${sessionsPct}%"></div></div>
        </div>
        ${prLabel?`<div class="dtp-row dtp-pr">
          <span class="dtp-ic">🏆</span>
          <span class="dtp-lbl">آخر رقم قياسي:</span>
          <b class="dtp-val">${E(prLabel)}</b>
        </div>`:''}
        <div class="dtp-row dtp-compliance">
          <div class="dtp-head"><span class="dtp-ic">✅</span><span class="dtp-lbl">الالتزام</span><b class="dtp-val">${compliancePct}%</b></div>
          <div class="dtp-track"><div class="dtp-fill dtp-fill-${compliancePct>=70?'good':compliancePct>=40?'ok':'low'}" style="width:${compliancePct}%"></div></div>
        </div>
      </div>`;
  }

  function _prDeltaLabel(pr){
    if(!pr) return '';
    // اعرض شيء مثل: Lat Machine +2.5kg
    const typeAbbr={weight:'كجم',volume:'كجم·حجم','1rm':'1RM','reps':'تكرار','effort':'جهد'};
    const typeUnit=typeAbbr[pr.type]||'';
    let val=pr.value;
    // لو delta متاح
    if(pr.delta!=null && pr.delta!==0){
      const sign=pr.delta>0?'+':'';
      val=`${sign}${pr.delta}${typeUnit}`;
    }
    return `${pr.exerciseName} ${val}`;
  }

  // 3. QUICK STATS — ٣ بطاقات: Streak، Week PRs، Week Volume
  function _quickStats3(streak,week){
    const cur=streak&&streak.current||0;
    const best=streak&&streak.best||0;
    const fire=cur>=7?'🔥🔥🔥':cur>=3?'🔥🔥':cur>=1?'🔥':'•';
    return `
      <div class="dash-quick-stats">
        <button type="button" class="dqs-card dqs-streak" onclick="openStreakPage&&openStreakPage()">
          <div class="dqs-icon">${fire}</div>
          <div class="dqs-num">${E(cur)}</div>
          <div class="dqs-lbl">يوم متتالي</div>
          <div class="dqs-sub">الأفضل: <b>${E(best)}</b></div>
        </button>
        <div class="dqs-card dqs-prs">
          <div class="dqs-icon">🏆</div>
          <div class="dqs-num">${E(week.prs)}</div>
          <div class="dqs-lbl">PR هذا الأسبوع</div>
          <div class="dqs-sub">${E(week.sessions)} جلسة</div>
        </div>
        <div class="dqs-card dqs-volume">
          <div class="dqs-icon">⚖</div>
          <div class="dqs-num">${E(week.volume.toLocaleString('en'))}</div>
          <div class="dqs-lbl">كجم رفعت</div>
          <div class="dqs-sub">${E(week.sets)} سيت</div>
        </div>
      </div>`;
  }

  // 4. WEEK GRID — ٧ خلايا تفاعلية، لون حسب الحالة
  // (يَستخدم الأنواع من program data، يطبَّق applyWeekGridStatus من ui-v99.js لاحقاً)
  // V9.14.2 — جدول الأسبوع كبطاقات أيام بصرية:
  //   اليوم → ذهبي · المكتمل → علامة صح خضراء · الراحة → أزرق هادئ
  function _weekGridBlock(workouts){
    const days=(typeof EFFECTIVE_PROGRAM!=='undefined' && EFFECTIVE_PROGRAM && EFFECTIVE_PROGRAM.days)
      ?EFFECTIVE_PROGRAM.days
      :(typeof PROGRAM_DATA!=='undefined'?PROGRAM_DATA.days:[]);
    if(!days || !days.length) return '';
    const arDayNames=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    const byWd={};
    days.forEach(d=>{byWd[d.dayOfWeek]=d});
    const todayWd=new Date().getDay();
    // بداية الأسبوع (الأحد ٠٠:٠٠) لحساب الأيام المكتملة هذا الأسبوع
    const now=new Date();
    const sow=new Date(now); sow.setHours(0,0,0,0); sow.setDate(now.getDate()-now.getDay());
    const completedWd=new Set();
    (workouts||[]).forEach(w=>{
      if(!w || !w.startTime) return;
      const t=new Date(w.startTime);
      if(t>=sow) completedWd.add(t.getDay());
    });
    const cards=[];
    for(let wd=0;wd<7;wd++){
      const d=byWd[wd];
      const isRest=!d || d.isRest || d.type==='REST';
      const typeLbl=isRest?'راحة':(d.type||d.label||'—');
      let cat='push';
      if(isRest) cat='rest';
      else if(/BACK|PULL/i.test(typeLbl)) cat='pull';
      else if(/LEGS?|أرجل/i.test(typeLbl)) cat='legs';
      else if(/ARMS?|بايسبس|ترايسبس|ذراع/i.test(typeLbl)) cat='arms';
      const isToday=wd===todayWd;
      const isDone=completedWd.has(wd) && !isRest;
      let statusCls,statusLbl;
      if(isRest){ statusCls='rest'; statusLbl='استشفاء'; }
      else if(isToday){ statusCls='today'; statusLbl=isDone?'اليوم · تم':'اليوم'; }
      else if(isDone){ statusCls='done'; statusLbl='تم'; }
      else { statusCls='upcoming'; statusLbl='قادم'; }
      const check=isDone?'<span class="wday-check">✓</span>':'';
      cards.push(`<button type="button" class="wday-card wday-${statusCls} cat-${cat}" data-day="${wd}" onclick="openWorkoutDay(${wd})">
          <span class="wday-name">${E(arDayNames[wd])}</span>
          <span class="wday-type">${E(typeLbl)}</span>
          <span class="wday-status">${check}${E(statusLbl)}</span>
        </button>`);
    }
    return `
      <div class="dash-card dash-week-card">
        <div class="dash-card-head dash-card-head-mini">📅 جدول الأسبوع</div>
        <div class="wday-list">${cards.join('')}</div>
      </div>`;
  }

  // 5. NEXT ACHIEVEMENT — يُعرض فقط لو pct >= 30%
  function _nextAchievementBlockFiltered(next){
    if(!next) return '';
    if(next.pct<0.3) return ''; // < ٣٠٪ → اخفِ (User said "حذف لو pct<30%")
    const pct=Math.round(next.pct*100);
    const remaining=next.remaining;
    const unit=next.unit||'';
    return `
      <div class="dash-card dash-next-ach">
        <div class="dash-card-head dash-card-head-mini">🏅 إنجاز قادم — قريب!</div>
        <button type="button" class="dna-row" onclick="switchToTab(7);setTimeout(()=>{const b=document.querySelector('.prog-tab[data-pt=\\'achievements\\']');if(b)b.click()},120)">
          <div class="dna-icon">${E(next.ach.icon)}</div>
          <div class="dna-body">
            <div class="dna-name">${E(next.ach.title)}</div>
            <div class="dna-progress">
              <div class="dna-track"><div class="dna-fill" style="width:${pct}%"></div></div>
              <div class="dna-meta">باقي <b>${E(remaining)}</b>${unit?' '+E(unit):''} · ${E(pct)}%</div>
            </div>
          </div>
        </button>
      </div>`;
  }

  // 6. RECENT PRs CAROUSEL — ٣ كحد أقصى، أفقي على الموبايل
  function _prsCarousel(prs){
    if(!prs.length) return '';
    const recent=[...prs].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,3);
    const typeLabel={weight:'وزن',volume:'حجم','1rm':'1RM',reps:'تكرار',effort:'جهد أقل'};
    return `
      <div class="dash-card dash-prs-card">
        <div class="dash-card-head dash-card-head-mini">🏆 آخر أرقامك القياسية</div>
        <div class="dash-prs-carousel">
          ${recent.map(p=>{
            const ago=Math.max(0,Math.floor((Date.now()-new Date(p.date).getTime())/86400000));
            const agoTxt=ago===0?'اليوم':ago===1?'أمس':ago+' أيام';
            return `<div class="dprc-card">
              <div class="dprc-type">${E(typeLabel[p.type]||p.type)}</div>
              <div class="dprc-ex">${E(p.exerciseName)}</div>
              <div class="dprc-val">${E(p.value)}</div>
              <div class="dprc-ago">${E(agoTxt)}</div>
            </div>`;
          }).join('')}
        </div>
        <button class="dash-card-more" onclick="switchToTab(7)">شاهد كل الأرقام ›</button>
      </div>`;
  }

  // V9.13 (#8) — احسب الوجبة التالية المتوقّعة حسب الجدول الافتراضي
  // الجدول: ٨ص فطور، ١ظ غداء، ٤ع سناك، ٨م طاقة، ١٠:٣٠م بناء، ١٢ص قبل النوم
  function _nextMealHint(daily){
    const meals=[
      {t:8.0,  name:'الفطور',           slotIdx:0, icon:'🥚'},
      {t:13.0, name:'الغداء',           slotIdx:1, icon:'🍗'},
      {t:16.0, name:'السناك',           slotIdx:2, icon:'🥜'},
      {t:20.0, name:'وجبة الطاقة',     slotIdx:3, icon:'⚡'},
      {t:22.5, name:'وجبة البناء',     slotIdx:4, icon:'🌙'},
      {t:24.0, name:'قبل النوم',       slotIdx:5, icon:'🥛'}
    ];
    const now=new Date();
    const nowHr=now.getHours()+now.getMinutes()/60;
    const loggedMeals = (daily && Array.isArray(daily.mealsArr))
      ? daily.mealsArr
      : null;
    // ابحث عن أول وجبة لم تُسجَّل بعد:
    //   1. لم يأتِ وقتها بعد (t > now)، OR
    //   2. أتى وقتها لكن لم تُسجَّل (slot index غير محدد)
    for(const m of meals){
      const isLogged = loggedMeals?loggedMeals[m.slotIdx]===true:false;
      if(!isLogged) return m;
    }
    return null;
  }

  // 7. TODAY NUTRITION — ٣ progress bars: سعرات، بروتين، ماء + الوجبة التالية
  function _nutritionBars(nutrition,targets,daily){
    const tCals = (targets&&targets.calories) || 2500;
    const tProt = (targets&&targets.protein) || 150;
    const tWater = 8;
    const kcal = (nutrition && nutrition.kcal) || 0;
    const prot = (nutrition && nutrition.protein>0) ? nutrition.protein : (daily?daily.protein:0);
    const water = (daily && daily.water) || 0;
    const bars=[
      {ic:'🔥',lbl:'سعرات',cur:kcal,tgt:tCals,unit:'',pct:Math.round(kcal/tCals*100),color:'kcal'},
      {ic:'🥩',lbl:'بروتين',cur:prot,tgt:tProt,unit:'g',pct:Math.round(prot/tProt*100),color:'protein'},
      {ic:'💧',lbl:'ماء',cur:water,tgt:tWater,unit:'',pct:Math.round(water/tWater*100),color:'water'}
    ];
    // V9.13 (#8) — next meal hint
    const nextMeal=_nextMealHint(daily);
    const nextMealRow = nextMeal
      ? `<div class="dash-next-meal"><span class="dnm-ic">${nextMeal.icon}</span><span>الوجبة التالية: <b>${E(nextMeal.name)}</b></span><button type="button" class="dnm-btn" onclick="openFoodSearch&&openFoodSearch()">+ سجّل</button></div>`
      : `<div class="dash-next-meal dnm-done">✓ سجّلت كل وجباتك اليوم!</div>`;
    return `
      <div class="dash-card dash-nutrition-card">
        <div class="dash-card-head dash-card-head-mini">🥗 تغذية اليوم</div>
        <div class="dash-nut-bars">
          ${bars.map(b=>`
            <div class="dnb-row">
              <div class="dnb-head">
                <span class="dnb-ic">${b.ic}</span>
                <span class="dnb-lbl">${E(b.lbl)}</span>
                <span class="dnb-val"><b>${E(b.cur)}</b>${b.unit?E(b.unit):''}<small>/${E(b.tgt)}${b.unit?E(b.unit):''}</small></span>
              </div>
              <div class="dnb-track"><div class="dnb-fill dnb-${b.color} ${b.pct>=100?'full':b.pct>=70?'ok':'low'}" style="width:${Math.min(100,Math.max(0,b.pct))}%"></div></div>
            </div>`).join('')}
        </div>
        ${nextMealRow}
        <button class="dash-card-more" onclick="switchToTab(3)">قسم التغذية الكامل ›</button>
      </div>`;
  }

  // 8. QUICK ACTIONS — ٣ أزرار: قياسات، صورة، حاسبة بليتات
  function _quickActions3(){
    return `
      <div class="dash-actions dash-actions-3">
        <button class="dash-action" onclick="switchToTab(7);setTimeout(()=>{const b=document.querySelector('.prog-tab[data-pt=\\'metrics\\']');if(b)b.click()},120)"><span>📏</span><b>قياسات</b></button>
        <button class="dash-action" onclick="switchToTab(7);setTimeout(()=>{const b=document.querySelector('.prog-tab[data-pt=\\'photos\\']');if(b)b.click()},120)"><span>📸</span><b>صورة</b></button>
        <button class="dash-action" onclick="openPlateCalc()"><span>🧮</span><b>حاسبة بليتات</b></button>
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
      const wp=await _weekProgress();

      // مستخدم جديد تماماً
      if(!data.workouts.length && !activeSession){
        container.innerHTML=_emptyOnboardBlock();
        return;
      }

      const streak=(typeof computeStreak==='function')?computeStreak(data.workouts):{current:0,best:0};
      const week=_weekStats(data.sets,data.workouts);
      const daily=_todayDaily(data.dailyLogs);
      const proteinTarget=await _proteinTarget();
      const nutrition=await _todayNutritionTotals();
      const nutritionTargets=(typeof getNutritionTargets==='function')?await getNutritionTargets():null;
      const smartReco=(typeof recommendNextWorkout==='function')?await recommendNextWorkout():null;
      const nextAch=(typeof getNextAchievement==='function')?await getNextAchievement():null;

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

      // V9.11 — تحقّق من اكتمال الملف الشخصي
      let profileMissing=false;
      try{
        const r=await db.get('settings',KEYS.USER_PROFILE);
        const p=r&&r.value;
        profileMissing=!p || (!p.age && !p.weight && !p.height);
      }catch(e){}

      // V9.14 — البنية الجديدة:
      //   1. Hero Section (تفسيري)
      //   2. Today's Workout Card (أكبر عنصر)
      //   3. Program Quick Summary (6 badges)
      //   4. Top Progress Card
      //   5. Quick Stats (3)
      //   6. Week Grid
      //   7. Next Achievement
      //   8. PRs Carousel
      //   9. Nutrition + Next Meal
      //   10. Quick Actions
      container.innerHTML=`
        ${_heroSection(data.workouts)}
        ${profileMissing?`<div class="profile-missing-strip" onclick="openProfile()">👤 أكمل ملفك الشخصي لحساب الأهداف بدقة ›</div>`:''}
        ${_todayWorkoutCard(todayProg,activeSession,data.workouts,missedDay,smartReco)}
        ${_programQuickSummary()}
        ${_topProgressCard(data.workouts,data.prs,data.dailyLogs,data.sets)}
        ${_quickStats3(streak,week)}
        ${_weekGridBlock(data.workouts)}
        ${_nextAchievementBlockFiltered(nextAch)}
        ${_prsCarousel(data.prs)}
        ${_nutritionBars(nutrition,nutritionTargets,daily)}
        ${_quickActions3()}
      `;
    }catch(e){
      console.error('Dashboard refresh failed:',e);
      container.innerHTML=`<div class="dash-empty">⚠️ تعذّر تحميل لوحة التحكم. أعد فتح الصفحة.</div>`;
    }
  }

  // expose
  window.refreshDashboard=refreshDashboard;
})();
