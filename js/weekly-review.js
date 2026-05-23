/* ============================================================
 * BULK MODE V9.0 — Weekly Review (P6)
 * ============================================================
 * Modal أسبوعي يلخّص نشاط آخر ٧ أيام:
 *  • الجلسات + السيتات + الحجم + PRs
 *  • مقارنة % مع الأسبوع السابق
 *  • أفضل تمرين (أعلى حجم)
 *  • التزام التغذية (٧ أيام)
 *  • Streak الحالي
 *  • اقتراح أسبوع قادم (لو deload مطلوب)
 *
 * Triggers:
 *  - تلقائياً يوم السبت إذا فيه ٢+ جلسات هذا الأسبوع ولم تُعرض من قبل
 *  - زر "📊 ملخص الأسبوع" في Dashboard
 * ============================================================ */

(function(){
  const E=(typeof escHTML==='function')?escHTML:(x=>String(x==null?'':x));
  const WR_FLAG_KEY='app:weekly_review_shown_for'; // قيمة = ISO week (YYYY-Www)

  function _isoWeek(d){
    d=new Date(d||Date.now());
    const date=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
    const day=date.getUTCDay()||7;
    date.setUTCDate(date.getUTCDate()+4-day);
    const yearStart=new Date(Date.UTC(date.getUTCFullYear(),0,1));
    const week=Math.ceil((((date-yearStart)/86400000)+1)/7);
    return date.getUTCFullYear()+'-W'+String(week).padStart(2,'0');
  }

  function _statsForRange(sets,workouts,startMs,endMs){
    const inSets=sets.filter(s=>!s.isWarmup && new Date(s.timestamp).getTime()>=startMs && new Date(s.timestamp).getTime()<endMs);
    const inW=workouts.filter(w=>{const t=new Date(w.startTime).getTime();return t>=startMs && t<endMs});
    return {
      sets:inSets.length,
      volume:Math.round(inSets.reduce((a,s)=>a+s.weight*s.reps,0)),
      sessions:inW.length,
      prs:inSets.filter(s=>s.isPR).length,
      duration:inW.reduce((a,w)=>a+(w.duration||0),0),
      avgRpe:(()=>{const r=inSets.filter(s=>s.rpe!=null).map(s=>s.rpe);return r.length?Math.round(r.reduce((a,b)=>a+b,0)/r.length*10)/10:null})()
    };
  }

  function _pct(now,prev){
    if(!prev) return {txt:now>0?'+جديد':'—',cls:now>0?'up':'flat'};
    if(now===prev) return {txt:'0%',cls:'flat'};
    const d=Math.round(((now-prev)/prev)*100);
    return {txt:(d>0?'+':'')+d+'%',cls:d>0?'up':'down'};
  }

  function _topExercise(sets,startMs,endMs){
    const byEx={};
    sets.filter(s=>!s.isWarmup && new Date(s.timestamp).getTime()>=startMs && new Date(s.timestamp).getTime()<endMs)
      .forEach(s=>{
        const k=s.exerciseName;
        if(!byEx[k]) byEx[k]={vol:0,sets:0,maxW:0};
        byEx[k].vol+=s.weight*s.reps;
        byEx[k].sets++;
        if(s.weight>byEx[k].maxW) byEx[k].maxW=s.weight;
      });
    const entries=Object.entries(byEx).sort((a,b)=>b[1].vol-a[1].vol);
    return entries[0]||null;
  }

  function _dailyAvg(dailyLogs,startMs,endMs){
    const inLogs=dailyLogs.filter(d=>{
      const t=new Date(d.date+'T00:00:00').getTime();
      return t>=startMs && t<endMs;
    });
    if(!inLogs.length) return null;
    const avg=(key,def=0)=>Math.round(inLogs.reduce((a,d)=>a+(d[key]||def),0)/inLogs.length*10)/10;
    const mealsAvg=Math.round(inLogs.reduce((a,d)=>a+(Array.isArray(d.meals)?d.meals.filter(Boolean).length:0),0)/inLogs.length*10)/10;
    return {
      days:inLogs.length,
      water:avg('water'),
      sleep:avg('sleep'),
      protein:avg('protein'),
      meals:mealsAvg
    };
  }

  async function computeReview(){
    const [workouts,sets,dailyLogs]=await Promise.all([
      db.getAll('workouts').catch(()=>[]),
      db.getAll('sets').catch(()=>[]),
      db.getAll('dailyLog').catch(()=>[])
    ]);

    const now=Date.now();
    const weekMs=7*86400000;
    const thisStart=now-weekMs;
    const lastStart=now-2*weekMs;

    const thisWeek=_statsForRange(sets,workouts,thisStart,now);
    const lastWeek=_statsForRange(sets,workouts,lastStart,thisStart);

    return {
      thisWeek,
      lastWeek,
      deltas:{
        sessions:_pct(thisWeek.sessions,lastWeek.sessions),
        volume:_pct(thisWeek.volume,lastWeek.volume),
        sets:_pct(thisWeek.sets,lastWeek.sets),
        prs:_pct(thisWeek.prs,lastWeek.prs)
      },
      topEx:_topExercise(sets,thisStart,now),
      daily:_dailyAvg(dailyLogs,thisStart,now),
      streak:(typeof computeStreak==='function')?computeStreak(workouts):{current:0,best:0},
      // اقتراح: لو متوسط RPE > 8.5 لـ ٣ جلسات الأخيرة → deload
      suggestDeload:(()=>{
        const last3W=workouts.slice(-3);
        if(last3W.length<3) return false;
        const last3Sets=sets.filter(s=>last3W.some(w=>w.id===s.workoutId) && s.rpe!=null);
        if(!last3Sets.length) return false;
        const avg=last3Sets.reduce((a,s)=>a+s.rpe,0)/last3Sets.length;
        return avg>8.5;
      })()
    };
  }

  function _renderReview(r){
    const dCls=d=>'wr-delta wr-delta-'+(d.cls||'flat');
    const tw=r.thisWeek;
    const minutes=Math.round(tw.duration/60);
    const rpeNote=tw.avgRpe!=null?` · RPE ~${tw.avgRpe}`:'';
    return `
      <div class="wr-head">
        <h2>📊 ملخص أسبوعك</h2>
        <div class="wr-sub">آخر ٧ أيام · مقارنة بالأسبوع الذي قبله</div>
      </div>

      <div class="wr-stats-grid">
        <div class="wr-cell">
          <div class="wr-cell-icon">🏋️</div>
          <div class="wr-cell-body">
            <div class="wr-cell-num">${E(tw.sessions)}</div>
            <div class="wr-cell-lbl">جلسة <span class="${dCls(r.deltas.sessions)}">${E(r.deltas.sessions.txt)}</span></div>
          </div>
        </div>
        <div class="wr-cell">
          <div class="wr-cell-icon">💪</div>
          <div class="wr-cell-body">
            <div class="wr-cell-num">${E(tw.sets)}</div>
            <div class="wr-cell-lbl">سيت <span class="${dCls(r.deltas.sets)}">${E(r.deltas.sets.txt)}</span></div>
          </div>
        </div>
        <div class="wr-cell">
          <div class="wr-cell-icon">⚖️</div>
          <div class="wr-cell-body">
            <div class="wr-cell-num">${E(tw.volume.toLocaleString('en'))}</div>
            <div class="wr-cell-lbl">كجم رفعت <span class="${dCls(r.deltas.volume)}">${E(r.deltas.volume.txt)}</span></div>
          </div>
        </div>
        <div class="wr-cell">
          <div class="wr-cell-icon">🏆</div>
          <div class="wr-cell-body">
            <div class="wr-cell-num">${E(tw.prs)}</div>
            <div class="wr-cell-lbl">PR جديد <span class="${dCls(r.deltas.prs)}">${E(r.deltas.prs.txt)}</span></div>
          </div>
        </div>
      </div>

      <div class="wr-meta">⏱️ ${E(minutes)} دقيقة إجمالاً${rpeNote}</div>

      ${r.topEx?`
      <div class="wr-section">
        <div class="wr-section-head">⭐ أفضل تمرين هذا الأسبوع</div>
        <div class="wr-top-ex">
          <b>${E(r.topEx[0])}</b>
          <small>${E(r.topEx[1].sets)} سيت · ${E(r.topEx[1].vol.toLocaleString('en'))} كجم · أقصى وزن ${E(r.topEx[1].maxW)} كجم</small>
        </div>
      </div>`:''}

      ${r.daily?`
      <div class="wr-section">
        <div class="wr-section-head">🍽️ متوسط الالتزام (${E(r.daily.days)} أيام مسجّلة)</div>
        <div class="wr-daily-grid">
          <div class="wrd-cell"><span>💧</span><b>${E(r.daily.water)}/8</b><small>ماء</small></div>
          <div class="wrd-cell"><span>😴</span><b>${E(r.daily.sleep)}</b><small>س نوم</small></div>
          <div class="wrd-cell"><span>🥩</span><b>${E(r.daily.protein)}g</b><small>بروتين</small></div>
          <div class="wrd-cell"><span>🍽️</span><b>${E(r.daily.meals)}/6</b><small>وجبات</small></div>
        </div>
      </div>`:`
      <div class="wr-section">
        <div class="wr-section-head">🍽️ التغذية</div>
        <div class="wr-empty">لم تُسجّل أي يومية هذا الأسبوع. سجّل من تبويب «📈 تقدمي → 📅 سجل يومي».</div>
      </div>`}

      <div class="wr-section">
        <div class="wr-section-head">🔥 السلسلة</div>
        <div class="wr-streak-line">
          <b>${E(r.streak.current)}</b> يوم متتالي
          <small>الأفضل لك: ${E(r.streak.best)} يوم</small>
        </div>
      </div>

      ${r.suggestDeload?`
      <div class="wr-suggestion wr-suggestion-warn">
        <div class="wrs-icon">🛟</div>
        <div class="wrs-body">
          <b>اقتراح للأسبوع القادم: Deload</b>
          <div>متوسط RPE تجاوز ٨.٥ في آخر جلسات. اضرب الأوزان × ٠.٦ هذا الأسبوع للتعافي.</div>
        </div>
      </div>`:`
      <div class="wr-suggestion wr-suggestion-ok">
        <div class="wrs-icon">✅</div>
        <div class="wrs-body">
          <b>استمر بنفس الإيقاع</b>
          <div>الأرقام صحية. ركّز على التغذية والنوم في الأسبوع القادم.</div>
        </div>
      </div>`}
    `;
  }

  async function openWeeklyReview(){
    let modal=document.getElementById('weeklyReviewModal');
    if(!modal){
      modal=document.createElement('div');
      modal.id='weeklyReviewModal';
      modal.className='stats-modal';
      modal.innerHTML=`
        <div class="stats-content wr-content" style="position:relative">
          <button class="close-modal" onclick="closeWeeklyReview()" aria-label="إغلاق">✕</button>
          <div id="wrBody"><div class="chart-loading">جاري التحضير...</div></div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.addEventListener('click',(e)=>{if(e.target.id==='weeklyReviewModal') closeWeeklyReview()});
    }
    modal.classList.add('open');
    document.body.style.overflow='hidden';
    try{
      const r=await computeReview();
      document.getElementById('wrBody').innerHTML=_renderReview(r);
      // علّم أن المراجعة عُرضت لهذا الأسبوع
      try{await db.put('settings',{key:WR_FLAG_KEY,value:_isoWeek(),at:new Date().toISOString()})}catch(e){}
    }catch(e){
      console.error('Weekly review failed:',e);
      document.getElementById('wrBody').innerHTML='<div class="wr-empty">⚠️ تعذّر تحضير الملخص.</div>';
    }
  }

  function closeWeeklyReview(){
    const m=document.getElementById('weeklyReviewModal');
    if(m) m.classList.remove('open');
    document.body.style.overflow='';
  }

  // Auto-trigger: يوم السبت بعد ٢+ جلسات هذا الأسبوع، مرة واحدة لكل أسبوع
  async function maybeAutoOpenWeeklyReview(){
    try{
      if(new Date().getDay()!==6) return; // السبت فقط (٦)
      const flag=await db.get('settings',WR_FLAG_KEY);
      if(flag && flag.value===_isoWeek()) return; // عُرضت بالفعل
      const workouts=await db.getAll('workouts');
      const weekAgo=Date.now()-7*86400000;
      const thisWeek=workouts.filter(w=>new Date(w.startTime).getTime()>=weekAgo);
      if(thisWeek.length<2) return; // أقل من جلستين — لا قيمة في الملخص
      // علّق لـ ٣ ثوانٍ بعد load حتى لا يقاطع experience initial
      setTimeout(()=>{
        if(typeof showToast==='function'){
          showToast('📊 ملخص أسبوعك جاهز','var(--g1)',8000,{action:{label:'افتح الملخص',handler:openWeeklyReview}});
        }
      },3500);
    }catch(e){console.warn('weeklyReview auto-check failed:',e)}
  }

  // expose
  window.openWeeklyReview=openWeeklyReview;
  window.closeWeeklyReview=closeWeeklyReview;
  window.maybeAutoOpenWeeklyReview=maybeAutoOpenWeeklyReview;
})();
