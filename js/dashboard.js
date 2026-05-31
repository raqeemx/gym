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
  // V9.11 — NEW BLOCKS (Homepage Redesign)
  // ============================================================

  // 1. STATUS STRIP — أهم ٣ أرقام في سطر واحد
  // [ أسبوع ٣/١٢ · 🔥 ٥ يوم · ⭐ UPPER B اليوم ]
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
  function _weekGridBlock(){
    const days=(typeof EFFECTIVE_PROGRAM!=='undefined' && EFFECTIVE_PROGRAM && EFFECTIVE_PROGRAM.days)
      ?EFFECTIVE_PROGRAM.days
      :(typeof PROGRAM_DATA!=='undefined'?PROGRAM_DATA.days:[]);
    if(!days || !days.length) return '';
    const arDayNames=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    // رتّب حسب dayOfWeek
    const byWd={};
    days.forEach(d=>{byWd[d.dayOfWeek]=d});
    const cells=[];
    for(let wd=0;wd<7;wd++){
      const d=byWd[wd];
      const isRest=!d || d.isRest || d.type==='REST';
      const typeLbl=isRest?'راحة':(d.type||d.label||'—');
      // class حسب نوع اليوم (للتلوين الموحّد عبر V9.10)
      let cat='push';
      if(isRest) cat='rest';
      else if(/BACK|PULL/i.test(typeLbl)) cat='pull';
      else if(/LEGS?|أرجل/i.test(typeLbl)) cat='legs';
      else if(/ARMS?|بايسبس|ترايسبس|ذراع/i.test(typeLbl)) cat='arms';
      // class قديم (cp/cpl/cl/cr) للتوافق
      const oldCls=isRest?'cr':(cat==='pull'?'cpl':cat==='legs'?'cl':cat==='arms'?'cpl':'cp');
      cells.push(`<div class="wc ${oldCls}" data-day="${wd}" data-day-type="${cat}"><div class="wd">${E(arDayNames[wd])}</div><div class="wt">${E(typeLbl)}</div></div>`);
    }
    return `
      <div class="dash-card dash-week-card">
        <div class="dash-card-head dash-card-head-mini">📅 خطّتك هذا الأسبوع</div>
        <div class="wg">${cells.join('')}</div>
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

  // 7. TODAY NUTRITION — ٣ progress bars: سعرات، بروتين، ماء
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
        <button class="dash-card-more" onclick="switchToTab(7);setTimeout(()=>{const b=document.querySelector('.prog-tab[data-pt=\\'daily\\']');if(b)b.click()},120)">سجّل وجباتك ›</button>
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

      // V9.11 — البنية الجديدة (Status Strip → Hero → Stats → Grid → ...)
      container.innerHTML=`
        ${_statusStrip(wp,streak,todayProg,profileMissing)}
        ${_primaryHero(todayProg,activeSession,missedDay,smartReco,streak)}
        ${_quickStats3(streak,week)}
        ${_weekGridBlock()}
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
