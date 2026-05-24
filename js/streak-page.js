/* ============================================================
 * BULK MODE V9.2 (C.10) — Streak Page (Duolingo-style)
 * ============================================================
 * Modal بارز يعرض:
 *   • شعلة الـ Streak الحالي بحجم كبير
 *   • Milestones: 3 / 7 / 14 / 30 / 60 / 100 يوم (مفتوحة/مقفلة)
 *   • Calendar ٤٢ يوم (٦ أسابيع) — كل يوم مظلّل لو فيه جلسة
 *   • أفضل streak تاريخياً + كم بقي للوصول له
 *   • نص تحفيزي حسب الحالة
 *
 * يفتح من:
 *   - زر "🔥" على dash-streak في Dashboard
 *   - أو يدوياً عبر openStreakPage()
 * ============================================================ */

(function(){
  const E=(typeof escHTML==='function')?escHTML:(x=>String(x==null?'':x));

  const MILESTONES = [
    {days:3,   icon:'🔥',  label:'٣ أيام',   subtitle:'بداية الشعلة'},
    {days:7,   icon:'⭐',  label:'أسبوع',    subtitle:'الالتزام بدأ'},
    {days:14, icon:'🌟',   label:'أسبوعين',  subtitle:'العادة تتشكّل'},
    {days:30, icon:'🏅',   label:'شهر',     subtitle:'محارب البرنامج'},
    {days:60, icon:'🥇',   label:'شهرين',   subtitle:'منضبط ذهبي'},
    {days:100,icon:'👑',   label:'١٠٠ يوم', subtitle:'أسطورة'}
  ];

  function _isoDay(d){return new Date(d||Date.now()).toISOString().split('T')[0]}
  function _shiftDay(iso,delta){
    const t=new Date(iso+'T00:00:00Z').getTime()+delta*86400000;
    return new Date(t).toISOString().split('T')[0];
  }

  function _renderCalendar(workouts, todayISO){
    // ٤٢ يوم (٦ أسابيع) — يبدأ من قبل ٤١ يوم وينتهي اليوم
    const trainedSet=new Set(workouts.map(w=>w.startTime.split('T')[0]));
    const cells=[];
    for(let i=41;i>=0;i--){
      const day=_shiftDay(todayISO,-i);
      const trained=trainedSet.has(day);
      const isToday=i===0;
      let cls='sp-day';
      if(trained) cls+=' sp-day-trained';
      if(isToday) cls+=' sp-day-today';
      cells.push(`<div class="${cls}" title="${E(day)}${trained?' · تدريب':''}"></div>`);
    }
    return `<div class="sp-cal-grid">${cells.join('')}</div>`;
  }

  function _renderMilestones(currentStreak, bestStreak){
    return `<div class="sp-milestones">
      ${MILESTONES.map(m=>{
        const unlocked = bestStreak>=m.days;
        const isCurrent = currentStreak>=m.days && currentStreak<(MILESTONES.find(x=>x.days>m.days)||{days:9999}).days;
        const cls = 'sp-milestone'
          + (unlocked?' sp-ms-unlocked':'')
          + (isCurrent?' sp-ms-current':'');
        return `<div class="${cls}">
          <div class="sp-ms-icon">${m.icon}</div>
          <div class="sp-ms-days">${E(m.label)}</div>
          <div class="sp-ms-subtitle">${E(m.subtitle)}</div>
          ${unlocked?'<div class="sp-ms-badge">✓ مفتوح</div>':''}
        </div>`;
      }).join('')}
    </div>`;
  }

  function _motivationText(current, best){
    if(current===0){
      return best>0
        ? `كان أفضل streak لك <b>${best}</b> يوم. ابدأ اليوم لتعيد كسر الرقم!`
        : 'سجّل جلسة اليوم لإشعال شعلة الـ Streak الأولى لك! 🔥';
    }
    // ابحث عن أقرب milestone قادم
    const next = MILESTONES.find(m=>m.days>current);
    if(next){
      const remain = next.days-current;
      return `<b>${remain}</b> يوم${remain===1?'':remain<=10?' أيام':''} حتى تفتح <b>${next.label}</b> ${next.icon}`;
    }
    if(best && current>best){
      return `🏆 <b>رقم قياسي جديد!</b> تجاوزت أفضل streak لك (${best}).`;
    }
    return `🔥 أنت في قمة الإنجاز — استمر!`;
  }

  async function openStreakPage(){
    let modal=document.getElementById('streakPageModal');
    if(!modal){
      modal=document.createElement('div');
      modal.id='streakPageModal';
      modal.className='stats-modal';
      modal.innerHTML=`
        <div class="stats-content streak-page-content" style="position:relative">
          <button class="close-modal" onclick="closeStreakPage()" aria-label="إغلاق">✕</button>
          <div id="streakPageBody"><div class="chart-loading">جاري التحضير...</div></div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.addEventListener('click',(e)=>{if(e.target.id==='streakPageModal') closeStreakPage()});
    }
    modal.classList.add('open');
    document.body.style.overflow='hidden';
    try{
      const workouts=await db.getAll('workouts');
      const streak=(typeof computeStreak==='function')?computeStreak(workouts):{current:0,best:0};
      const todayISO=_isoDay();
      const trainedSet=new Set(workouts.map(w=>w.startTime.split('T')[0]));
      const trainedThisMonth=Array.from(trainedSet).filter(d=>d.startsWith(todayISO.slice(0,7))).length;

      // اختر رمز الشعلة حسب الحجم
      const fire = streak.current>=30?'🔥🔥🔥🔥'
                  :streak.current>=14?'🔥🔥🔥'
                  :streak.current>=7?'🔥🔥'
                  :streak.current>=1?'🔥':'💤';

      document.getElementById('streakPageBody').innerHTML=`
        <div class="sp-hero">
          <div class="sp-fire">${fire}</div>
          <div class="sp-current-num">${E(streak.current)}</div>
          <div class="sp-current-lbl">يوم متتالي</div>
          <div class="sp-motivation">${_motivationText(streak.current, streak.best)}</div>
        </div>

        <div class="sp-stats-row">
          <div class="sp-stat-cell">
            <div class="sp-stat-num">${E(streak.best)}</div>
            <div class="sp-stat-lbl">أفضل streak</div>
          </div>
          <div class="sp-stat-cell">
            <div class="sp-stat-num">${E(trainedThisMonth)}</div>
            <div class="sp-stat-lbl">جلسة هذا الشهر</div>
          </div>
          <div class="sp-stat-cell">
            <div class="sp-stat-num">${E(workouts.length)}</div>
            <div class="sp-stat-lbl">إجمالي الجلسات</div>
          </div>
        </div>

        <div class="sp-section">
          <div class="sp-section-head">🏅 الإنجازات</div>
          ${_renderMilestones(streak.current, streak.best)}
        </div>

        <div class="sp-section">
          <div class="sp-section-head">📅 آخر ٦ أسابيع</div>
          ${_renderCalendar(workouts, todayISO)}
          <div class="sp-cal-legend">
            <span class="sp-leg-item"><span class="sp-leg-sw sp-day-trained"></span>يوم تدريب</span>
            <span class="sp-leg-item"><span class="sp-leg-sw"></span>يوم بدون تدريب</span>
            <span class="sp-leg-item"><span class="sp-leg-sw sp-day-today"></span>اليوم</span>
          </div>
        </div>
      `;
    }catch(e){
      console.error('Streak page failed:',e);
      document.getElementById('streakPageBody').innerHTML='<div class="sp-empty">⚠️ تعذّر تحضير الصفحة.</div>';
    }
  }

  function closeStreakPage(){
    const m=document.getElementById('streakPageModal');
    if(m) m.classList.remove('open');
    document.body.style.overflow='';
  }

  // expose
  window.openStreakPage=openStreakPage;
  window.closeStreakPage=closeStreakPage;
})();
