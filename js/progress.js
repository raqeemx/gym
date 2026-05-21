// ============ STATS MODAL (enhanced V2) ============
// أدوات مساعدة للإحصائيات (تستخدم تواريخ ISO UTC للاتساق مع التخزين)
function _isoDay(d){return new Date(d||Date.now()).toISOString().split('T')[0]}
function _isoDayShift(isoDay,deltaDays){
  const t=new Date(isoDay+'T00:00:00Z').getTime()+deltaDays*86400000;
  return new Date(t).toISOString().split('T')[0];
}
function _daysAgo(n){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-n);return d}
function _msInDay(){return 86400000}

// يحسب سلسلة الأيام المتتالية (Streak): يحسب الأيام التي تمرّنت بها بدون انقطاع
function computeStreak(workouts){
  if(!workouts.length) return {current:0,best:0};
  const daysSet=new Set(workouts.map(w=>w.startTime.split('T')[0]));
  const days=[...daysSet].sort();
  const today=_isoDay();
  const yest=_isoDayShift(today,-1);
  // current streak — يبدأ من اليوم لو تمرّنت، وإلا من أمس
  let cur=0;
  let cursor=daysSet.has(today)?today:(daysSet.has(yest)?yest:null);
  while(cursor && daysSet.has(cursor)){
    cur++;
    cursor=_isoDayShift(cursor,-1);
  }
  // best streak ever
  let best=0,run=0,prev=null;
  days.forEach(ds=>{
    if(prev && _isoDayShift(prev,1)===ds) run++;
    else run=1;
    if(run>best) best=run;
    prev=ds;
  });
  return {current:cur,best};
}

// يحسب الإحصائيات لنطاق زمني (n days back from now)
function statsForRange(sets,workouts,daysBack){
  const cutoff=_daysAgo(daysBack).getTime();
  const inRangeSets=sets.filter(s=>new Date(s.timestamp).getTime()>=cutoff);
  const inRangeW=workouts.filter(w=>new Date(w.startTime).getTime()>=cutoff);
  const volume=inRangeSets.reduce((a,s)=>a+s.weight*s.reps,0);
  const prCount=inRangeSets.filter(s=>s.isPR).length;
  return {
    sets:inRangeSets.length,
    volume:Math.round(volume),
    sessions:inRangeW.length,
    prs:prCount,
    duration:inRangeW.reduce((a,w)=>a+(w.duration||0),0)
  };
}

// مقارنة نسبية: +12% أو -5%
function pctDelta(now,prev){
  if(!prev) return now>0?{txt:'+جديد',cls:'up'}:{txt:'—',cls:'flat'};
  const d=Math.round(((now-prev)/prev)*100);
  if(d===0) return {txt:'0%',cls:'flat'};
  return {txt:(d>0?'+':'')+d+'%',cls:d>0?'up':'down'};
}

// تقسيم الحجم حسب المجموعة العضلية لنطاق ٢٨ يوم الأخيرة
function volumeByMuscle(sets,daysBack=28){
  const cutoff=_daysAgo(daysBack).getTime();
  const buckets={};
  let unknown=0;
  sets.forEach(s=>{
    if(new Date(s.timestamp).getTime()<cutoff) return;
    const mg=getMuscleGroup(s.exerciseName);
    if(!mg){unknown+=s.weight*s.reps;return}
    if(!buckets[mg.group]) buckets[mg.group]={vol:0,region:mg.region};
    buckets[mg.group].vol+=s.weight*s.reps;
  });
  return {buckets,unknown:Math.round(unknown)};
}

// تكرار نوع اليوم
function dayTypeCounts(workouts){
  const c={};
  workouts.forEach(w=>{const k=w.dayType||'غير محدد';c[k]=(c[k]||0)+1});
  return Object.entries(c).sort((a,b)=>b[1]-a[1]);
}

// أعلى ٥ أوزان رفعتها في حياتك
function topLifts(sets,limit=5){
  const byEx={};
  sets.forEach(s=>{
    if(!byEx[s.exerciseName] || s.weight>byEx[s.exerciseName].weight){
      byEx[s.exerciseName]={weight:s.weight,reps:s.reps,date:s.date};
    }
  });
  return Object.entries(byEx)
    .map(([ex,d])=>({ex,...d}))
    .sort((a,b)=>b.weight-a.weight)
    .slice(0,limit);
}

// تقويم حراري آخر ٣٠ يوم — يرجّع مصفوفة [{date,intensity}]
function calendarHeatmap(workouts,days=30){
  const today=_isoDay();
  const map={};
  workouts.forEach(w=>{
    const k=w.startTime.split('T')[0];
    const vol=w.totalVolume||0;
    if(!map[k] || vol>map[k]) map[k]=vol;
  });
  const result=[];
  const max=Math.max(1,...Object.values(map));
  for(let i=days-1;i>=0;i--){
    const ds=_isoDayShift(today,-i);
    const v=map[ds]||0;
    const intensity=v>0?Math.min(4,Math.ceil((v/max)*4)):0;
    result.push({date:ds,intensity,volume:v});
  }
  return result;
}

async function openStats(){
  document.body.style.overflow='hidden';
  const sb=document.getElementById('statsBody');
  const hb=document.getElementById('historyBody');
  sb.innerHTML='<div class="chart-loading">جاري التحميل...</div>';
  hb.innerHTML='';

  const sets=await db.getAll('sets');
  const workouts=await db.getAll('workouts');

  if(!sets.length && !workouts.length){
    sb.innerHTML=`<div class="empty-state"><div class="es-icon">📊</div><div class="es-text">لم تُسجّل أي بيانات بعد.<br><b>ابدأ أول جلسة من تبويب التمارين!</b></div></div>`;
    document.getElementById('statsModal').classList.add('open');
    return;
  }

  // إحصائيات إجمالية
  const total=sets.length;
  const uniqueExercises=new Set(sets.map(s=>s.exerciseName)).size;
  const totalVolume=sets.reduce((a,s)=>a+s.weight*s.reps,0);
  const sessions=workouts.length;
  const totalDuration=workouts.reduce((a,w)=>a+(w.duration||0),0);
  const totalHours=Math.round(totalDuration/360)/10;

  // streak
  const streak=computeStreak(workouts);

  // مقارنة هذا الأسبوع vs السابق
  const week=statsForRange(sets,workouts,7);
  const prevWeek=statsForRange(
    sets.filter(s=>new Date(s.timestamp).getTime()<_daysAgo(7).getTime()),
    workouts.filter(w=>new Date(w.startTime).getTime()<_daysAgo(7).getTime()),
    7
  );

  // تقسيم العضلات (٢٨ يوم)
  const muscle=volumeByMuscle(sets,28);
  const muscleEntries=Object.entries(muscle.buckets).sort((a,b)=>b[1].vol-a[1].vol);
  const muscleTotal=muscleEntries.reduce((a,[_,v])=>a+v.vol,0);
  const upperVol=muscleEntries.filter(([_,v])=>v.region==='upper').reduce((a,[_,v])=>a+v.vol,0);
  const lowerVol=muscleEntries.filter(([_,v])=>v.region==='lower').reduce((a,[_,v])=>a+v.vol,0);
  const coreVol=muscleEntries.filter(([_,v])=>v.region==='core').reduce((a,[_,v])=>a+v.vol,0);
  const upperPct=muscleTotal?Math.round((upperVol/muscleTotal)*100):0;
  const lowerPct=muscleTotal?Math.round((lowerVol/muscleTotal)*100):0;
  const corePct=muscleTotal?100-upperPct-lowerPct:0;

  // تكرار نوع الجلسة
  const dayTypes=dayTypeCounts(workouts);

  // أعلى ٥ أوزان
  const tops=topLifts(sets,5);

  // التقويم الحراري
  const heat=calendarHeatmap(workouts,30);
  const trainedDays30=heat.filter(h=>h.intensity>0).length;

  // مقارنات نسبية
  const dSets=pctDelta(week.sets,prevWeek.sets);
  const dVol=pctDelta(week.volume,prevWeek.volume);
  const dPRs=pctDelta(week.prs,prevWeek.prs);

  // ======= بناء الـ HTML =======
  sb.innerHTML=`
    <!-- HERO STATS -->
    <div class="stats-hero">
      <div class="sh-item">
        <div class="sh-val">${sessions}</div>
        <div class="sh-lbl">جلسة</div>
      </div>
      <div class="sh-item">
        <div class="sh-val">${Math.round(totalVolume).toLocaleString('ar-SA')}</div>
        <div class="sh-lbl">حجم كلي (كجم)</div>
      </div>
      <div class="sh-item ${streak.current>=3?'sh-fire':''}">
        <div class="sh-val">${streak.current}${streak.current>=3?' 🔥':''}</div>
        <div class="sh-lbl">سلسلة حالية (أفضل: ${streak.best})</div>
      </div>
      <div class="sh-item">
        <div class="sh-val">${totalHours}س</div>
        <div class="sh-lbl">إجمالي وقت التدريب</div>
      </div>
    </div>

    <!-- WEEKLY COMPARE -->
    <div class="stats-section">
      <div class="ss-title">📅 هذا الأسبوع <span class="ss-sub">vs الأسبوع الماضي</span></div>
      <div class="week-compare">
        <div class="wcm">
          <div class="wcm-val">${week.sessions}</div>
          <div class="wcm-lbl">جلسات</div>
        </div>
        <div class="wcm">
          <div class="wcm-val">${week.sets} <span class="wcm-d ${dSets.cls}">${dSets.txt}</span></div>
          <div class="wcm-lbl">سيتات</div>
        </div>
        <div class="wcm">
          <div class="wcm-val">${week.volume.toLocaleString('ar-SA')} <span class="wcm-d ${dVol.cls}">${dVol.txt}</span></div>
          <div class="wcm-lbl">حجم (كجم)</div>
        </div>
        <div class="wcm">
          <div class="wcm-val">${week.prs} <span class="wcm-d ${dPRs.cls}">${dPRs.txt}</span></div>
          <div class="wcm-lbl">🏆 أرقام جديدة</div>
        </div>
      </div>
    </div>

    <!-- UPPER vs LOWER PRIORITY CHECK -->
    <div class="stats-section">
      <div class="ss-title">⚡ توزيع التركيز <span class="ss-sub">(آخر ٢٨ يوم)</span></div>
      ${muscleTotal===0?'<div class="ss-empty">لا توجد بيانات كافية بعد</div>':`
      <div class="ul-bar">
        <div class="ul-seg upper" style="flex:${upperPct}">${upperPct>10?upperPct+'% علوي':''}</div>
        <div class="ul-seg lower" style="flex:${lowerPct}">${lowerPct>10?lowerPct+'% سفلي':''}</div>
        <div class="ul-seg core" style="flex:${corePct}">${corePct>10?corePct+'% كور':''}</div>
      </div>
      <div class="ul-hint">
        ${upperPct>=70?'✅ <b>ممتاز</b> — تركيزك على العلوي يطابق هدف "ضخم وقوي"':
          upperPct>=55?'⚠️ تركيزك متوازن — لو هدفك العلوي، خفّف أيام الأرجل':
          '❌ تركيزك ضعيف على العلوي — راجع البرنامج'}
      </div>`}
    </div>

    <!-- MUSCLE GROUP BREAKDOWN -->
    ${muscleEntries.length?`
    <div class="stats-section">
      <div class="ss-title">💪 الحجم حسب العضلة <span class="ss-sub">(آخر ٢٨ يوم)</span></div>
      <div class="mg-list">
        ${muscleEntries.map(([name,v])=>{
          const pct=Math.round((v.vol/muscleTotal)*100);
          const color=MUSCLE_COLORS[name]||'#D4A853';
          return `<div class="mg-row">
            <div class="mg-head"><span class="mg-name" style="color:${color}">${name}</span><span class="mg-val">${Math.round(v.vol).toLocaleString('ar-SA')} <small>(${pct}%)</small></span></div>
            <div class="mg-bar-bg"><div class="mg-bar-fill" style="width:${pct}%;background:${color}"></div></div>
          </div>`;
        }).join('')}
      </div>
    </div>`:''}

    <!-- 30-DAY HEATMAP -->
    <div class="stats-section">
      <div class="ss-title">🗓️ آخر ٣٠ يوم <span class="ss-sub">${trainedDays30}/30 يوم تدريب</span></div>
      <div class="heatmap">
        ${heat.map(h=>{
          const dayNum=parseInt(h.date.split('-')[2]);
          const tip=h.intensity?`${fmtDate(h.date)} · ${Math.round(h.volume).toLocaleString('ar-SA')} كجم`:fmtDate(h.date)+' · راحة';
          return `<div class="hm-cell hm-${h.intensity}" title="${tip}"><span class="hm-d">${dayNum}</span></div>`;
        }).join('')}
      </div>
      <div class="hm-legend">
        <span>أقل</span>
        <div class="hm-cell hm-0"></div>
        <div class="hm-cell hm-1"></div>
        <div class="hm-cell hm-2"></div>
        <div class="hm-cell hm-3"></div>
        <div class="hm-cell hm-4"></div>
        <span>أكثر</span>
      </div>
    </div>

    <!-- TOP LIFTS -->
    ${tops.length?`
    <div class="stats-section">
      <div class="ss-title">🥇 أعلى ٥ أوزان <span class="ss-sub">رفعتها في حياتك</span></div>
      <div class="top-lifts">
        ${tops.map((t,i)=>`
          <div class="tl-row">
            <div class="tl-rank">${['🥇','🥈','🥉','4','5'][i]}</div>
            <div class="tl-body">
              <div class="tl-name">${t.ex}</div>
              <div class="tl-date">${fmtDate(t.date)}</div>
            </div>
            <div class="tl-w">${t.weight}<small>كجم × ${t.reps}</small></div>
          </div>
        `).join('')}
      </div>
    </div>`:''}

    <!-- DAY TYPE FREQUENCY -->
    ${dayTypes.length?`
    <div class="stats-section">
      <div class="ss-title">📊 تكرار نوع الجلسة</div>
      <div class="dt-list">
        ${dayTypes.map(([name,count])=>`
          <div class="dt-row"><span>${name}</span><b>${count}×</b></div>
        `).join('')}
      </div>
    </div>`:''}

    <!-- OVERALL STATS -->
    <div class="stats-section">
      <div class="ss-title">📈 إحصائيات شاملة</div>
      <div class="stats-row"><span>إجمالي السيتات</span><b>${total}</b></div>
      <div class="stats-row"><span>التمارين المختلفة</span><b>${uniqueExercises}</b></div>
      <div class="stats-row"><span>متوسط سيتات/جلسة</span><b>${sessions?Math.round(total/sessions):0}</b></div>
      <div class="stats-row"><span>متوسط مدة الجلسة</span><b>${sessions?fmtDuration(Math.round(totalDuration/sessions)):'—'}</b></div>
    </div>
  `;

  // آخر ١٠ جلسات
  const recent=workouts.sort((a,b)=>new Date(b.startTime)-new Date(a.startTime)).slice(0,10);
  if(!recent.length){
    hb.innerHTML='<div style="text-align:center;color:var(--tx3);padding:20px">لم تُسجّل أي تمارين بعد</div>';
  }else{
    const setsByWorkout={};
    for(const w of recent){
      const ws=await db.getAll('sets','workoutId',w.id);
      setsByWorkout[w.id]=ws;
    }
    hb.innerHTML=recent.map(w=>{
      const ws=setsByWorkout[w.id]||[];
      const byEx={};
      ws.forEach(s=>{
        if(!byEx[s.exerciseName]) byEx[s.exerciseName]=[];
        const noteMark=s.note?` <span class="set-note-mark" title="${(s.note||'').replace(/"/g,'&quot;')}">📝</span>`:'';
        byEx[s.exerciseName].push(`${s.weight}×${s.reps}${s.rpe?'@'+s.rpe:''}${s.isPR?' 🏆':''}${noteMark}`);
      });
      const exHtml=Object.entries(byEx).map(([ex,arr])=>
        `<div class="h-ex"><b>${ex}</b><span>${arr.join(' · ')}</span></div>`
      ).join('');
      const vol=Math.round(w.totalVolume||0).toLocaleString('ar-SA');
      const noteHtml=w.notes?`<div class="history-note">📝 ${escHTML(w.notes)}</div>`:'';
      return `<div class="history-day">
        <div class="h-date">${fmtDate(w.startTime)} · ${w.dayType} · ⏱ ${fmtDuration(w.duration||0)} · 💪 ${w.setsCount||0} · 📊 ${vol}${w.prCount?' · 🏆 '+w.prCount:''}</div>
        ${noteHtml}
        ${exHtml}
      </div>`;
    }).join('');
  }
  document.getElementById('statsModal').classList.add('open');
}

function closeStats(){
  document.getElementById('statsModal').classList.remove('open');
  document.body.style.overflow='';
}

// ============ EXPORT / IMPORT ============
async function exportData(){
  const dump={
    version:'v7.2',
    exportedAt:new Date().toISOString(),
    workouts:await db.getAll('workouts'),
    sets:await db.getAll('sets'),
    exercises:await db.getAll('exercises'),
    bodyMetrics:await db.getAll('bodyMetrics'),
    dailyLog:await db.getAll('dailyLog'), // V7.2 #38
    prs:await db.getAll('prs'),
    settings:await db.getAll('settings')
  };
  const blob=new Blob([JSON.stringify(dump,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=`bulkmode_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  await db.put('settings',{key:KEYS.LAST_EXPORT,value:new Date().toISOString()});
  // V8 — تنبيه عن الصور (لا تُضمّن في JSON بسبب الحجم)
  try{
    const photosCount=(await db.getAll('progressPhotos')).length;
    if(photosCount>0){
      showToast(`💾 تم التصدير · ⚠️ ${photosCount} صورة لم تُضمّن (احفظها يدوياً من تبويب 📸)`,'var(--org)',7000);
    }else{
      showToast('💾 تم تصدير النسخة الاحتياطية');
    }
  }catch(e){
    showToast('💾 تم تصدير النسخة الاحتياطية');
  }
}

// تذكير دائم بالتصدير الأسبوعي — لو مرّ ٧ أيام بدون تصدير
async function checkExportReminder(){
  try{
    const onb=await db.get('settings',KEYS.ONBOARDED);
    if(!onb || !onb.value) return; // قبل الـ onboarding لا نزعجه
    const sets=await db.getAll('sets');
    if(sets.length<5) return; // ما يستحق تذكير قبل ٥ سيتات على الأقل
    const last=await db.get('settings',KEYS.LAST_EXPORT);
    const days=last?Math.floor((Date.now()-new Date(last.value).getTime())/86400000):999;
    if(days>=7){
      setTimeout(()=>{
        showToast(`🔔 مرّ ${days===999?'وقت طويل':days+' أيام'} بدون تصدير — احفظ نسخة احتياطية`,'var(--org)',6000);
      },1500);
    }
  }catch(e){}
}

async function importData(event){
  const file=event.target.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=async(e)=>{
    try{
      const imp=JSON.parse(e.target.result);
      // دعم النسخة القديمة (logs + lastWeights)
      if(imp.logs && imp.lastWeights){
        if(!confirm(`استيراد ${imp.logs.length} سجل من نسخة قديمة؟`)) return;
        localStorage.setItem('bulkmode_tracker_v1',JSON.stringify(imp));
        // أعد الترحيل بإجبار
        await db.delete('settings',KEYS.MIGRATION_LS_V1);
        await migrateFromLS();
        showToast('✓ تم استيراد البيانات القديمة');
        setTimeout(()=>location.reload(),1000);
        return;
      }
      if(!imp.version || !imp.sets){
        throw new Error('بنية ملف غير معروفة');
      }
      const setsCount=(imp.sets||[]).length;
      if(!confirm(`استيراد ${setsCount} سيت + ${(imp.workouts||[]).length} جلسة؟ سيُمسح ما هو موجود.`)) return;
      // امسح كل المتجرات (عدا settings)
      for(const st of ['workouts','sets','exercises','bodyMetrics','dailyLog','prs','progressPhotos']){
        try{await db.clear(st)}catch(e){console.warn('clear failed:',st,e)}
      }
      for(const w of (imp.workouts||[])) await db.put('workouts',w);
      for(const s of (imp.sets||[])){const c={...s};delete c.id;await db.add('sets',c)}
      for(const ex of (imp.exercises||[])) await db.put('exercises',ex);
      for(const bm of (imp.bodyMetrics||[])) await db.put('bodyMetrics',bm);
      for(const dl of (imp.dailyLog||[])) await db.put('dailyLog',dl); // V7.2 #38
      for(const pr of (imp.prs||[])){const c={...pr};delete c.id;await db.add('prs',c)}
      showToast('✓ تم استيراد البيانات بنجاح');
      setTimeout(()=>location.reload(),1000);
    }catch(err){
      showToast('⚠️ ملف غير صالح: '+err.message,'var(--red)');
    }
  };
  reader.readAsText(file);
  event.target.value='';
}

async function clearAllData(){
  if(!confirm('⚠️ هل أنت متأكد من مسح كل بيانات التتبع؟ لا يمكن التراجع.')) return;
  if(!confirm('🚨 تأكيد نهائي — كل البيانات ستُمسح. متأكد؟')) return;
  for(const st of STORES){await db.clear(st)}
  localStorage.removeItem('bulkmode_tracker_v1');
  showToast('🗑 تم مسح كل البيانات','var(--red)');
  setTimeout(()=>location.reload(),1000);
}

// ============ PROGRESS TAB (PRs / Charts / History) ============
document.querySelectorAll('.prog-tab').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('.prog-tab').forEach(x=>x.classList.remove('a'));
    document.querySelectorAll('.prog-pane').forEach(x=>x.classList.remove('a'));
    b.classList.add('a');
    const pane=document.getElementById('pp'+b.dataset.pt[0].toUpperCase()+b.dataset.pt.slice(1));
    if(pane) pane.classList.add('a');
    if(b.dataset.pt==='charts') renderCharts();
    if(b.dataset.pt==='history') renderHistory();
    if(b.dataset.pt==='prs') renderPRs();
    if(b.dataset.pt==='metrics') renderBodyMetrics();
    if(b.dataset.pt==='daily') renderDailyLog();
    if(b.dataset.pt==='achievements') renderAchievements(); // V8
    if(b.dataset.pt==='photos') renderProgressPhotos(); // V8 — progress photos
    if(b.dataset.pt==='recovery') renderRecovery(); // V8 — smart deload
  });
});

async function refreshProgressTab(){
  const active=document.querySelector('.prog-tab.a');
  if(!active) return;
  const pt=active.dataset.pt;
  if(pt==='prs') renderPRs();
  else if(pt==='charts') renderCharts();
  else if(pt==='history') renderHistory();
  else if(pt==='metrics') renderBodyMetrics();
  else if(pt==='daily') renderDailyLog();
  else if(pt==='achievements') renderAchievements(); // V8
  else if(pt==='photos') renderProgressPhotos(); // V8
  else if(pt==='recovery') renderRecovery(); // V8
}

// ============ V8 — Recovery / Smart Deload tab ============
async function renderRecovery(){
  const body=document.getElementById('recoveryBody');
  if(!body) return;
  body.innerHTML='<div class="chart-loading">جاري التحميل...</div>';

  const deloadRec=await db.get('settings',KEYS.MANUAL_DELOAD_ACTIVE);
  const isActive=!!(deloadRec && deloadRec.value && deloadRec.value.active);
  const detection=await detectDeloadNeed();

  // ===== حالة الـ deload الحالية =====
  let stateHtml='';
  if(isActive){
    const startedISO=deloadRec.value.startedAt;
    const startedDate=new Date(startedISO);
    const sd=new Date(startedDate);sd.setHours(0,0,0,0);
    const day=sd.getDay();
    const daysToAdd=day===0?7:(7-day);
    const endBoundary=new Date(sd);endBoundary.setDate(endBoundary.getDate()+daysToAdd);
    const daysLeft=Math.max(0,Math.ceil((endBoundary-Date.now())/86400000));
    stateHtml=`<div class="recovery-card recovery-active">
      <div class="recovery-state-icon">🛟</div>
      <div class="recovery-state-title">وضع Deload نشط</div>
      <div class="recovery-state-sub">بدأ ${fmtDate(startedISO)} · ينتهي تلقائياً بعد ${daysLeft} يوم (الأحد)</div>
      <div class="recovery-state-effect">📉 كل اقتراحات الأوزان مضروبة <b>×0.6</b> للتعافي</div>
      <button class="recovery-btn recovery-stop" onclick="endManualDeload().then(()=>renderRecovery())">⏹ إيقاف الـ Deload</button>
    </div>`;
  }else if(detection.needed){
    const urgencyClass=detection.urgency==='high'?'recovery-need-high':'recovery-need-low';
    const urgencyIcon=detection.urgency==='high'?'🚨':'💡';
    stateHtml=`<div class="recovery-card ${urgencyClass}">
      <div class="recovery-state-icon">${urgencyIcon}</div>
      <div class="recovery-state-title">${detection.urgency==='high'?'يبدو أنك تحتاج Deload':'اقتراح: ربما تحتاج Deload'}</div>
      <div class="recovery-state-sub">${detection.reason}</div>
      <button class="recovery-btn recovery-start" onclick="startManualDeload('user-via-recovery').then(()=>renderRecovery())">🛟 ابدأ Deload الآن</button>
    </div>`;
  }else{
    stateHtml=`<div class="recovery-card recovery-ok">
      <div class="recovery-state-icon">✅</div>
      <div class="recovery-state-title">لا حاجة لـ Deload الآن</div>
      <div class="recovery-state-sub">${detection.reason}</div>
      <button class="recovery-btn recovery-manual" onclick="if(confirm('تفعيل deload يدوياً رغم عدم الحاجة؟')) startManualDeload('manual-override').then(()=>renderRecovery())">تفعيل يدوي</button>
    </div>`;
  }

  // ===== المعايير المُفحوصة =====
  let criteriaHtml='';
  if(detection.criteria && detection.criteria.length){
    criteriaHtml=`<div class="recovery-section-title">🔍 المعايير المُفحوصة</div>
      <div class="recovery-criteria">
        ${detection.criteria.map(c=>{
          const statusIcon=c.skipped?'➖':(c.passed?'⚠️':'✓');
          const cls=c.skipped?'crit-skipped':(c.passed?'crit-fail':'crit-pass');
          const note=c.note?`<div class="crit-note">${c.note}</div>`:'';
          return `<div class="crit-row ${cls}">
            <div class="crit-icon">${statusIcon}</div>
            <div class="crit-body">
              <div class="crit-label">${c.label}</div>
              <div class="crit-detail">القيمة: <b>${c.value}</b> · العتبة: ${c.threshold}</div>
              ${note}
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }

  // ===== شرح =====
  const explainHtml=`<div class="recovery-section-title">📚 ما هو الـ Deload؟</div>
    <div class="recovery-explain">
      <p><b>Deload</b> = أسبوع راحة نشطة بأوزان مخفّضة (×0.6) لإعادة التعافي بعد فترة تدريب مكثّفة.</p>
      <ul class="recovery-list">
        <li>تقلّل الإصابات وتجنّب الـ overtraining</li>
        <li>تسمح للجهاز العصبي والمفاصل بالتعافي</li>
        <li>تعود بعدها بأوزان أعلى وأداء أفضل</li>
      </ul>
      <div class="recovery-note">📅 افتراضياً ينتهي الـ deload يوم الأحد (بداية الأسبوع التالي). يمكنك إيقافه يدوياً في أي وقت.</div>
    </div>`;

  body.innerHTML=stateHtml+criteriaHtml+explainHtml;
}

// ============ V8 — Achievements page ============
async function renderAchievements(){
  const body=document.getElementById('achBody');
  if(!body) return;
  body.innerHTML='<div class="chart-loading">جاري التحميل...</div>';

  // اقرأ الحالة + احسب التقدّم نحو الإنجازات غير المفتوحة
  const rec=await db.get('settings',KEYS.ACHIEVEMENTS);
  const unlocked=(rec&&rec.value)||{};
  const stats=(typeof computeAchievementStats==='function')?await computeAchievementStats():null;

  const total=ACHIEVEMENTS.length;
  const unlockedCount=ACHIEVEMENTS.filter(a=>unlocked[a.id]).length;
  const pct=Math.round((unlockedCount/total)*100);

  // فصل المفتوحة عن المقفلة (المفتوحة أولاً، الأحدث في الأعلى)
  const opened=ACHIEVEMENTS
    .filter(a=>unlocked[a.id])
    .sort((a,b)=>new Date(unlocked[b.id].unlockedAt)-new Date(unlocked[a.id].unlockedAt));
  const locked=ACHIEVEMENTS.filter(a=>!unlocked[a.id]);

  const cardHtml=(ach,isUnlocked)=>{
    if(isUnlocked){
      const u=unlocked[ach.id];
      return `<div class="ach-card ach-unlocked">
        <div class="ach-icon">${ach.icon}</div>
        <div class="ach-title">${ach.title}</div>
        <div class="ach-desc">${ach.desc}</div>
        <div class="ach-date">✓ ${fmtDate(u.unlockedAt)}</div>
      </div>`;
    }
    return `<div class="ach-card ach-locked">
      <div class="ach-icon">🔒</div>
      <div class="ach-title">${ach.title}</div>
      <div class="ach-desc">${ach.desc}</div>
      <div class="ach-date">— لم يُفتح بعد —</div>
    </div>`;
  };

  body.innerHTML=`
    <div class="ach-progress-bar">
      <div class="ach-progress-head">
        <span class="ach-progress-num">${unlockedCount}</span>
        <span class="ach-progress-sep">/</span>
        <span class="ach-progress-total">${total}</span>
        <span class="ach-progress-lbl">إنجاز</span>
      </div>
      <div class="ach-progress-track"><div class="ach-progress-fill" style="width:${pct}%"></div></div>
    </div>
    ${opened.length?`<div class="ach-section-title">✨ مفتوحة (${opened.length})</div>
      <div class="ach-grid">${opened.map(a=>cardHtml(a,true)).join('')}</div>`:''}
    ${locked.length?`<div class="ach-section-title">🔒 مقفلة (${locked.length})</div>
      <div class="ach-grid">${locked.map(a=>cardHtml(a,false)).join('')}</div>`:''}
  `;
}

// ============ V7.2 — DAILY LOG (#38, #41) ============
let _dlState={water:0,sleep:0,supplements:{},meals:[]};

async function renderDailyLog(){
  const dateInput=document.getElementById('dlDate');
  if(dateInput && !dateInput.value) dateInput.value=new Date().toISOString().split('T')[0];

  // اقرأ السجل لهذا اليوم
  await loadDailyLogForDate(dateInput.value);

  // أعد ربط onchange على التاريخ
  if(!dateInput.dataset.bound){
    dateInput.addEventListener('change',()=>loadDailyLogForDate(dateInput.value));
    dateInput.dataset.bound='1';
  }

  // اعرض السجل
  const all=(await db.getAll('dailyLog')).sort((a,b)=>b.date.localeCompare(a.date));
  renderDailyLogHistory(all.slice(0,14));
  renderDailyLogStats(all);
}

async function loadDailyLogForDate(date){
  const rec=await db.get('dailyLog',date);
  _dlState={
    water:rec?(rec.water||0):0,
    sleep:rec?(rec.sleep||0):0,
    supplements:rec?(rec.supplements||{}):{},
    meals:rec?(rec.meals||[false,false,false,false,false,false]):[false,false,false,false,false,false]
  };
  document.getElementById('dlWaterVal').textContent=_dlState.water;
  document.getElementById('dlSleepVal').textContent=_dlState.sleep;
  document.querySelectorAll('#dlSupplements input').forEach(cb=>{
    cb.checked=!!_dlState.supplements[cb.dataset.supp];
  });
  document.querySelectorAll('#dlMeals input').forEach(cb=>{
    cb.checked=!!_dlState.meals[parseInt(cb.dataset.meal)];
  });
}

function dlAdjust(field,delta){
  _dlState[field]=Math.max(0,Math.round((_dlState[field]+delta)*10)/10);
  document.getElementById(field==='water'?'dlWaterVal':'dlSleepVal').textContent=_dlState[field];
}

async function saveDailyLog(){
  const date=document.getElementById('dlDate').value;
  if(!date){showToast('⚠️ أدخل التاريخ','var(--red)');return}
  // اقرأ المكملات والوجبات من الـ DOM
  const supplements={};
  document.querySelectorAll('#dlSupplements input').forEach(cb=>{
    supplements[cb.dataset.supp]=cb.checked;
  });
  const meals=[false,false,false,false,false,false];
  document.querySelectorAll('#dlMeals input').forEach(cb=>{
    meals[parseInt(cb.dataset.meal)]=cb.checked;
  });
  const rec={
    date,
    water:_dlState.water,
    sleep:_dlState.sleep,
    supplements,
    meals,
    timestamp:new Date().toISOString()
  };
  await db.put('dailyLog',rec);
  showToast('✓ تم حفظ سجل اليوم','var(--grn)');
  try{navigator.vibrate&&navigator.vibrate(30)}catch(e){}
  renderDailyLog();
}

function renderDailyLogHistory(records){
  const body=document.getElementById('dlHistoryBody');
  if(!body) return;
  if(!records.length){
    body.innerHTML=`<div class="empty-state"><div class="es-icon">📅</div><div class="es-text">لم تسجّل أي يوم بعد.<br><b>ابدأ من النموذج فوق!</b></div></div>`;
    return;
  }
  body.innerHTML=`<div class="bm-table-wrap"><table class="bm-table dl-table">
    <thead><tr>
      <th>التاريخ</th><th>💧</th><th>😴</th><th>💊</th><th>🍽️</th>
    </tr></thead>
    <tbody>
      ${records.map(r=>{
        const suppCount=Object.values(r.supplements||{}).filter(v=>v).length;
        const mealCount=(r.meals||[]).filter(v=>v).length;
        const waterClass=r.water>=8?'dl-good':(r.water>=5?'dl-mid':'dl-low');
        const sleepClass=r.sleep>=7?'dl-good':(r.sleep>=5?'dl-mid':'dl-low');
        const mealClass=mealCount>=6?'dl-good':(mealCount>=4?'dl-mid':'dl-low');
        return `<tr>
          <td class="bm-date">${fmtDate(r.date)}</td>
          <td class="${waterClass}">${r.water||0}</td>
          <td class="${sleepClass}">${r.sleep||0}س</td>
          <td>${suppCount}/5</td>
          <td class="${mealClass}">${mealCount}/6</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table></div>`;
}

function renderDailyLogStats(allRecords){
  const wrap=document.getElementById('dlStats');
  if(!wrap) return;
  // آخر ٧ أيام
  const today=new Date().toISOString().split('T')[0];
  const sevenDaysAgo=new Date(Date.now()-7*86400000).toISOString().split('T')[0];
  const last7=allRecords.filter(r=>r.date>=sevenDaysAgo && r.date<=today);
  if(!last7.length){wrap.innerHTML='';return}
  const avgWater=Math.round(last7.reduce((a,r)=>a+(r.water||0),0)/last7.length*10)/10;
  const avgSleep=Math.round(last7.reduce((a,r)=>a+(r.sleep||0),0)/last7.length*10)/10;
  // التزام الوجبات (%)
  const totalMeals=last7.reduce((a,r)=>a+((r.meals||[]).filter(m=>m).length),0);
  const mealCompliance=Math.round((totalMeals/(last7.length*6))*100);
  // التزام المكملات (%)
  const suppKeys=['creatine','protein','multi','vitd','omega3'];
  const totalSupp=last7.reduce((a,r)=>a+suppKeys.filter(k=>r.supplements&&r.supplements[k]).length,0);
  const suppCompliance=Math.round((totalSupp/(last7.length*5))*100);
  wrap.innerHTML=`<div class="dl-stats-row">
    <div class="dl-stat"><div class="dl-stat-val">${avgWater}</div><div class="dl-stat-lbl">💧 معدل الماء/يوم</div></div>
    <div class="dl-stat"><div class="dl-stat-val">${avgSleep}س</div><div class="dl-stat-lbl">😴 معدل النوم</div></div>
    <div class="dl-stat"><div class="dl-stat-val">${mealCompliance}%</div><div class="dl-stat-lbl">🍽️ التزام الوجبات</div></div>
    <div class="dl-stat"><div class="dl-stat-val">${suppCompliance}%</div><div class="dl-stat-lbl">💊 التزام المكملات</div></div>
  </div>`;
}

// ============ V7 — BODY METRICS (#14) ============
async function renderBodyMetrics(){
  // ضع تاريخ اليوم كقيمة افتراضية
  const dateInput=document.getElementById('bmDate');
  if(dateInput && !dateInput.value) dateInput.value=new Date().toISOString().split('T')[0];

  // اجلب آخر قياسات لملء placeholders (اقتراح للقيم)
  const all=(await db.getAll('bodyMetrics')).sort((a,b)=>b.date.localeCompare(a.date));
  if(all.length){
    const last=all[0];
    const fields=['Arm','Chest','Shoulder','Thigh','Waist','Weight'];
    const keys=['arm','chest','shoulder','thigh','waist','bodyWeight'];
    fields.forEach((f,i)=>{
      const el=document.getElementById('bm'+f);
      if(el && last[keys[i]]) el.placeholder=last[keys[i]];
    });
  }

  // عرض الجدول
  renderBodyMetricsHistory(all);
}

function renderBodyMetricsHistory(records){
  const body=document.getElementById('bmHistoryBody');
  if(!body) return;
  if(!records.length){
    body.innerHTML=`<div class="empty-state"><div class="es-icon">📏</div><div class="es-text">لم تُسجّل أي قياسات بعد.<br><b>سجّل قياساتك الأولى من النموذج فوق!</b></div></div>`;
    return;
  }
  // الأحدث أولاً
  const rows=records;
  // اجمع التغيّر بالنسبة للسجل السابق (الأقدم)
  const reversed=[...rows].reverse(); // الأقدم → الأحدث للحساب
  const deltaMap={};
  const fieldKeys=['arm','chest','shoulder','thigh','waist','bodyWeight'];
  reversed.forEach((r,i)=>{
    if(i===0){deltaMap[r.date]={};return}
    const prev=reversed[i-1];
    const d={};
    fieldKeys.forEach(k=>{
      if(r[k]!=null && prev[k]!=null){
        const diff=Math.round((r[k]-prev[k])*10)/10;
        d[k]=diff;
      }
    });
    deltaMap[r.date]=d;
  });

  const renderCell=(val,delta,invertGood=false)=>{
    if(val==null) return '<td>—</td>';
    let cls='flat';
    if(delta!=null && delta!==0){
      // invertGood: للخصر (نقص = جيد)
      const isUp=delta>0;
      cls=isUp?(invertGood?'down':'up'):(invertGood?'up':'down');
    }
    const dTxt=delta!=null && delta!==0?`<span class="bm-delta ${cls}">${delta>0?'+':''}${delta}</span>`:'';
    return `<td>${val}${dTxt}</td>`;
  };

  body.innerHTML=`<div class="bm-table-wrap"><table class="bm-table">
    <thead><tr>
      <th>التاريخ</th>
      <th>الذراع</th>
      <th>الصدر</th>
      <th>الكتف</th>
      <th>الفخذ</th>
      <th>الخصر</th>
      <th>الوزن</th>
      <th></th>
    </tr></thead>
    <tbody>
      ${rows.map(r=>{
        const d=deltaMap[r.date]||{};
        return `<tr>
          <td class="bm-date">${fmtDate(r.date)}</td>
          ${renderCell(r.arm,d.arm)}
          ${renderCell(r.chest,d.chest)}
          ${renderCell(r.shoulder,d.shoulder)}
          ${renderCell(r.thigh,d.thigh)}
          ${renderCell(r.waist,d.waist,true)}
          ${renderCell(r.bodyWeight,d.bodyWeight)}
          <td class="bm-row-actions"><button class="bm-del-btn" onclick="deleteBodyMetric('${r.date}')" title="حذف">🗑</button></td>
        </tr>`;
      }).join('')}
    </tbody>
  </table></div>`;
}

// V7.3 — حدود التحقق لكل حقل قياس (نطاقات منطقية للجسم البشري البالغ)
// تعديل هذه القيم سهل — كلها constants في مكان واحد
const METRIC_LIMITS={
  arm:       {min:15, max:60,  softDelta:5,  label:'الذراع',  unit:'سم'},
  chest:     {min:60, max:180, softDelta:10, label:'الصدر',   unit:'سم'},
  shoulder:  {min:80, max:200, softDelta:10, label:'الكتف',   unit:'سم'},
  thigh:     {min:30, max:100, softDelta:5,  label:'الفخذ',   unit:'سم'},
  waist:     {min:50, max:200, softDelta:5,  label:'الخصر',   unit:'سم'},
  bodyWeight:{min:30, max:300, softDelta:5,  label:'الوزن',   unit:'كجم'}
};

// V7.3 — يتحقّق من قيمة قياس واحد ضد الحدود الصلبة والتغيّر النسبي
// يُرجع {ok, hard?, soft?}:
//   - hard: رسالة خطأ، الحفظ يُرفَض
//   - soft: رسالة تحذير، تحتاج تأكيد
function validateMetric(field, value, lastValue){
  const L=METRIC_LIMITS[field];
  if(!L) return {ok:true};
  if(value==null) return {ok:true}; // الحقل فاضي، نتجاوز
  // Hard limit: خارج النطاق المعقول
  if(value<L.min || value>L.max){
    return {ok:false, hard:`⚠️ قياس ${L.label} يجب أن يكون بين ${L.min} و ${L.max} ${L.unit}`};
  }
  // Soft warning: تغيّر مفاجئ عن آخر قياس
  if(lastValue!=null){
    const delta=Math.abs(value-lastValue);
    if(delta>L.softDelta){
      return {ok:true, soft:`قياس ${L.label} تغيّر من ${lastValue} إلى ${value} ${L.unit} (فرق ${Math.round(delta*10)/10}). هل أنت متأكد؟`};
    }
  }
  return {ok:true};
}

async function saveBodyMetrics(){
  const date=document.getElementById('bmDate').value;
  if(!date){showToast('⚠️ أدخل التاريخ','var(--red)');return}
  const val=id=>{
    const v=document.getElementById(id).value.trim();
    return v===''?null:parseFloat(v);
  };
  const rec={
    date,
    arm:val('bmArm'),
    chest:val('bmChest'),
    shoulder:val('bmShoulder'),
    thigh:val('bmThigh'),
    waist:val('bmWaist'),
    bodyWeight:val('bmWeight'),
    timestamp:new Date().toISOString()
  };
  // تحقّق من وجود قيمة واحدة على الأقل
  const fields=['arm','chest','shoulder','thigh','waist','bodyWeight'];
  const hasAny=fields.some(k=>rec[k]!=null);
  if(!hasAny){showToast('⚠️ أدخل قياساً واحداً على الأقل','var(--red)');return}

  // V7.3 — اجلب آخر قياس قبل هذا التاريخ (للمقارنة في soft warnings)
  const all=(await db.getAll('bodyMetrics')).sort((a,b)=>b.date.localeCompare(a.date));
  const last=all.find(r=>r.date<date)||null;

  // ١. تحقّق صلب على كل حقل — أي خرق يوقف الحفظ فوراً
  for(const f of fields){
    if(rec[f]==null) continue;
    const isNum=typeof rec[f]==='number' && !isNaN(rec[f]) && isFinite(rec[f]);
    if(!isNum){
      showToast(`⚠️ قيمة ${METRIC_LIMITS[f].label} غير صالحة`,'var(--red)');
      return;
    }
    const lastV=last?last[f]:null;
    const v=validateMetric(f,rec[f],lastV);
    if(v.hard){showToast(v.hard,'var(--red)',4000);return}
  }

  // ٢. اجمع كل التحذيرات الناعمة
  const softWarnings=[];
  for(const f of fields){
    if(rec[f]==null) continue;
    const lastV=last?last[f]:null;
    const v=validateMetric(f,rec[f],lastV);
    if(v.soft) softWarnings.push({field:f,msg:v.soft});
  }

  // ٣. كشف الشذوذ الجماعي (احتمال خطأ في الوحدات: سم vs بوصة، كجم vs رطل)
  // لو ٣ حقول أو أكثر قفزت دفعة واحدة → اسأل عن الوحدات
  if(softWarnings.length>=3){
    const ok=confirm(`⚠️ ${softWarnings.length} قياسات تغيّرت بشكل كبير دفعة واحدة.\n\nاحتمال خطأ في الوحدات — تأكّد أنك تستخدم:\n• السنتيمتر (وليس البوصة)\n• الكيلوغرام (وليس الرطل)\n\nاضغط "موافق" للمتابعة، أو "إلغاء" للرجوع وتعديل القيم.`);
    if(!ok) return;
  }else{
    // ٤. لو القفزات أقل من ٣، اطلب تأكيد لكل واحدة على حدة
    for(const w of softWarnings){
      if(!confirm(w.msg)) return;
    }
  }

  // ٥. الحفظ
  await db.put('bodyMetrics',rec);
  showToast('✓ تم حفظ القياسات','var(--grn)');
  try{navigator.vibrate&&navigator.vibrate(30)}catch(e){}
  // امسح حقول الإدخال
  ['bmArm','bmChest','bmShoulder','bmThigh','bmWaist','bmWeight'].forEach(id=>{
    document.getElementById(id).value='';
  });
  renderBodyMetrics();
  // حدّث رسم وزن الجسم لو فاتح
  if(document.getElementById('ppCharts').classList.contains('a')) renderBodyWeightChart();
}

async function deleteBodyMetric(date){
  if(!confirm(`حذف قياسات ${fmtDate(date)}؟`)) return;
  await db.delete('bodyMetrics',date);
  showToast('🗑 تم الحذف','var(--red)');
  renderBodyMetrics();
}

async function renderPRs(){
  const body=document.getElementById('prsBody');
  body.innerHTML='<div class="chart-loading">جاري التحميل...</div>';
  const prs=await db.getAll('prs');
  if(!prs.length){
    body.innerHTML=`<div class="empty-state"><div class="es-icon">🏆</div><div class="es-text">لم تحطّم أي رقم قياسي بعد.<br><b>ابدأ جلسة وسجّل سيتك الأول!</b></div></div>`;
    return;
  }
  // group by exercise, then by type → keep best
  // V7.3 — للـ effort (RPE)، الأقل = الأفضل. لباقي الأنواع، الأعلى = الأفضل.
  const byEx={};
  prs.forEach(p=>{
    if(!byEx[p.exerciseName]) byEx[p.exerciseName]={};
    const cur=byEx[p.exerciseName][p.type];
    const isBetter=!cur || (p.type==='effort'?p.value<cur.value:p.value>cur.value);
    if(isBetter) byEx[p.exerciseName][p.type]=p;
  });
  // V7.3 — أضيف نوع 'effort' (Effort PR: نفس الوزن×التكرار بـ RPE أقل)
  const typeLbl={weight:'وزن',volume:'حجم',reps:'تكرار','1rm':'1RM',effort:'جهد @RPE'};
  const items=Object.entries(byEx).sort((a,b)=>a[0].localeCompare(b[0],'ar')).map(([ex,types])=>{
    const lastDate=Math.max(...Object.values(types).map(t=>new Date(t.date).getTime()));
    const typesHtml=Object.entries(types).map(([t,p])=>{
      // عرض القيمة حسب النوع
      const suffix=t==='weight'||t==='1rm'?'كجم':'';
      return `<span>${typeLbl[t]||t}: <b>${p.value}${suffix}</b></span>`;
    }).join('');
    return `<div class="pr-item">
      <div class="pr-icon">🏆</div>
      <div class="pr-body">
        <div class="pr-name">${ex}</div>
        <div class="pr-types">${typesHtml}</div>
      </div>
      <div class="pr-date">${fmtDate(new Date(lastDate).toISOString())}</div>
    </div>`;
  });
  body.innerHTML=`<div class="pr-list">${items.join('')}</div>`;
}

async function renderHistory(){
  const body=document.getElementById('historyBody2');
  body.innerHTML='<div class="chart-loading">جاري التحميل...</div>';
  const workouts=(await db.getAll('workouts')).sort((a,b)=>new Date(b.startTime)-new Date(a.startTime));
  if(!workouts.length){
    body.innerHTML=`<div class="empty-state"><div class="es-icon">📜</div><div class="es-text">لا توجد جلسات بعد.<br><b>ابدأ أول جلسة من تبويب التمارين</b></div></div>`;
    return;
  }
  const items=[];
  for(const w of workouts.slice(0,30)){
    const ws=await db.getAll('sets','workoutId',w.id);
    const byEx={};
    ws.forEach(s=>{
      if(!byEx[s.exerciseName]) byEx[s.exerciseName]=[];
      const noteMark=s.note?` <span class="set-note-mark" title="${(s.note||'').replace(/"/g,'&quot;')}">📝</span>`:'';
      byEx[s.exerciseName].push(`${s.weight}×${s.reps}${s.rpe?'@'+s.rpe:''}${s.isPR?' 🏆':''}${noteMark}`);
    });
    const exHtml=Object.entries(byEx).map(([ex,arr])=>
      `<div class="h-ex"><b>${ex}</b><span>${arr.join(' · ')}</span></div>`
    ).join('');
    // V7.3 — اعرض ملاحظة الجلسة لو موجودة
    const noteHtml=w.notes?`<div class="history-note">📝 ${escHTML(w.notes)}</div>`:'';
    items.push(`<div class="history-day">
      <div class="h-date">${fmtDate(w.startTime)} · ${w.dayType} · ⏱ ${fmtDuration(w.duration||0)} · 💪 ${w.setsCount||0} سيت · 📊 ${Math.round(w.totalVolume||0)}${w.prCount?' · 🏆 '+w.prCount:''}</div>
      ${noteHtml}
      ${exHtml}
    </div>`);
  }
  body.innerHTML=items.join('');
}

// V7.3 — escape HTML للملاحظات (يمنع XSS من نص المستخدم)
function escHTML(str){
  if(!str) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}

// ============ CHART.JS (LAZY) ============
// V7 (#31) — نسخة محلية بدل CDN (أمان: لا CDN compromise، يعمل offline من أول مرة)
let _chartLoaded=false;
async function loadChart(){
  if(_chartLoaded) return window.Chart;
  if(window.Chart){_chartLoaded=true;return window.Chart}
  return new Promise((res,rej)=>{
    const s=document.createElement('script');
    s.src='vendor/chart.umd.min.js';
    s.onload=()=>{_chartLoaded=true;res(window.Chart)};
    s.onerror=()=>rej(new Error('فشل تحميل Chart.js المحلي'));
    document.head.appendChild(s);
  });
}

const CHART_BASE_OPTS={
  responsive:true,maintainAspectRatio:true,
  plugins:{legend:{labels:{color:'#DEE0E6',font:{family:'Rubik',size:11}}}},
  scales:{
    x:{ticks:{color:'#8890A0',font:{family:'JetBrains Mono',size:10}},grid:{color:'rgba(255,255,255,.04)'}},
    y:{ticks:{color:'#8890A0',font:{family:'JetBrains Mono',size:10}},grid:{color:'rgba(255,255,255,.04)'},beginAtZero:true}
  }
};

let _charts={ex:null,vol:null,bw:null,rpe:null};

async function renderCharts(){
  const sel=document.getElementById('chartExSel');
  try{
    await loadChart();
  }catch(e){
    document.getElementById('ppCharts').innerHTML=`<div class="empty-state"><div class="es-icon">📡</div><div class="es-text">${e.message}</div></div>`;
    return;
  }

  // املأ قائمة التمارين
  const sets=await db.getAll('sets');
  const exNames=[...new Set(sets.map(s=>s.exerciseName))].sort((a,b)=>a.localeCompare(b,'ar'));
  if(sel.options.length<=1){
    exNames.forEach(n=>{
      const o=document.createElement('option');o.value=n;o.textContent=n;sel.appendChild(o);
    });
    sel.onchange=()=>renderExerciseChart(sel.value);
    if(exNames.length) sel.value=exNames[0];
  }
  if(sel.value) renderExerciseChart(sel.value);
  renderVolumeChart(sets);
  renderBodyWeightChart();
  await renderRpeTrend(sets); // V7.3 — رسم RPE المتوسط لكل جلسة
}

// V7.3 — رسم RPE المتوسط لكل جلسة + كشف ارتفاع متراكم (يقترح deload)
async function renderRpeTrend(setsOrNull){
  const Chart=window.Chart;
  const ctx=document.getElementById('chartRpe').getContext('2d');
  const hintEl=document.getElementById('rpeDeloadHint');
  if(_charts.rpe) _charts.rpe.destroy();

  const sets=setsOrNull||await db.getAll('sets');
  // اجمع السيتات التي فيها RPE فقط، حسب workoutId
  const byWorkout={};
  sets.forEach(s=>{
    if(s.rpe==null) return;
    if(!byWorkout[s.workoutId]) byWorkout[s.workoutId]={rpes:[],time:0};
    byWorkout[s.workoutId].rpes.push(s.rpe);
    const t=new Date(s.timestamp).getTime();
    if(t>byWorkout[s.workoutId].time) byWorkout[s.workoutId].time=t;
  });
  // احسب المتوسط لكل جلسة + رتّب زمنياً
  const workouts=Object.entries(byWorkout).map(([wid,info])=>{
    const avg=info.rpes.reduce((a,r)=>a+r,0)/info.rpes.length;
    return {wid,avg:Math.round(avg*10)/10,time:info.time,count:info.rpes.length};
  }).sort((a,b)=>a.time-b.time);

  if(hintEl) hintEl.style.display='none';
  if(!workouts.length){
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
    return;
  }

  const labels=workouts.map(w=>new Date(w.time).toLocaleDateString('ar-SA',{month:'short',day:'numeric'}));
  const data=workouts.map(w=>w.avg);

  // RPE-specific options (Y axis: 6-10)
  const opts=JSON.parse(JSON.stringify(CHART_BASE_OPTS));
  opts.scales.y.min=6;
  opts.scales.y.max=10;
  opts.scales.y.beginAtZero=false;
  opts.scales.y.ticks.stepSize=1;

  _charts.rpe=new Chart(ctx,{
    type:'line',
    data:{
      labels,
      datasets:[
        {label:'متوسط RPE',data,borderColor:'#B08AFF',backgroundColor:'rgba(176,138,255,.15)',tension:.3,fill:true,pointBackgroundColor:'#B08AFF',pointRadius:4,pointHoverRadius:6},
        // خط مرجعي عند 8.5 (عتبة التنبيه)
        {label:'عتبة الإرهاق (8.5)',data:labels.map(()=>8.5),borderColor:'rgba(255,90,95,.5)',borderDash:[4,4],pointRadius:0,fill:false,borderWidth:1}
      ]
    },
    options:opts
  });

  // كشف الإرهاق المتراكم: ٣ جلسات متتالية بمتوسط > 8.5
  if(workouts.length>=3 && hintEl){
    const last3=workouts.slice(-3);
    const allHigh=last3.every(w=>w.avg>8.5);
    if(allHigh){
      const avgOfLast3=Math.round((last3.reduce((a,w)=>a+w.avg,0)/3)*10)/10;
      hintEl.innerHTML=`💡 <b>ارتفاع RPE المتواصل</b> — متوسط آخر ٣ جلسات: <b>${avgOfLast3}</b>. قد تحتاج لـ <b>أسبوع deload</b> (×0.6 على الأوزان) للتعافي وتجنّب الإصابة.`;
      hintEl.style.display='block';
    }
  }
}

async function renderExerciseChart(name){
  if(!name) return;
  const Chart=window.Chart;
  const sets=(await db.getAll('sets','exerciseName',name)).sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp));
  if(!sets.length) return;
  const labels=sets.map(s=>s.date);
  const weights=sets.map(s=>s.weight);
  const oneRM=sets.map(s=>Math.round(EPLEY(s.weight,s.reps)*10)/10);

  const ctx=document.getElementById('chartEx').getContext('2d');
  if(_charts.ex) _charts.ex.destroy();
  _charts.ex=new Chart(ctx,{
    type:'line',
    data:{labels,datasets:[
      {label:'الوزن (كجم)',data:weights,borderColor:'#D4A853',backgroundColor:'rgba(212,168,83,.15)',tension:.3,fill:true,pointBackgroundColor:'#EDCA7A'},
      {label:'1RM مقدّر (كجم)',data:oneRM,borderColor:'#5AB4FF',backgroundColor:'rgba(90,180,255,.06)',tension:.3,fill:false,borderDash:[6,4],pointRadius:2}
    ]},
    options:CHART_BASE_OPTS
  });
}

function renderVolumeChart(sets){
  const Chart=window.Chart;
  // اجمع حسب الأسبوع
  const weekly={};
  sets.forEach(s=>{
    const d=new Date(s.date);
    const wk=getWeekKey(d);
    weekly[wk]=(weekly[wk]||0)+s.weight*s.reps;
  });
  const labels=Object.keys(weekly).sort();
  const data=labels.map(l=>Math.round(weekly[l]));
  const ctx=document.getElementById('chartVol').getContext('2d');
  if(_charts.vol) _charts.vol.destroy();
  if(!labels.length){
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
    return;
  }
  _charts.vol=new Chart(ctx,{
    type:'bar',
    data:{labels,datasets:[{label:'الحجم الأسبوعي',data,backgroundColor:'rgba(212,168,83,.55)',borderColor:'#D4A853',borderWidth:1,borderRadius:6}]},
    options:CHART_BASE_OPTS
  });
}

async function renderBodyWeightChart(){
  const Chart=window.Chart;
  const bm=(await db.getAll('bodyMetrics')).filter(b=>b.bodyWeight).sort((a,b)=>a.date.localeCompare(b.date));
  const ctx=document.getElementById('chartBW').getContext('2d');
  if(_charts.bw) _charts.bw.destroy();
  if(!bm.length){
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
    return;
  }
  _charts.bw=new Chart(ctx,{
    type:'line',
    data:{labels:bm.map(b=>b.date),datasets:[{label:'الوزن (كجم)',data:bm.map(b=>b.bodyWeight),borderColor:'#5AE68A',backgroundColor:'rgba(90,230,138,.12)',tension:.3,fill:true,pointBackgroundColor:'#5AE68A'}]},
    options:CHART_BASE_OPTS
  });
}

function getWeekKey(d){
  // ISO week — أبسط بمعزل عن المنطقة
  const target=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
  const dayNr=(target.getUTCDay()+6)%7;
  target.setUTCDate(target.getUTCDate()-dayNr+3);
  const firstThursday=target.valueOf();
  target.setUTCMonth(0,1);
  if(target.getUTCDay()!==4) target.setUTCMonth(0,1+((4-target.getUTCDay())+7)%7);
  const w=1+Math.ceil((firstThursday-target)/(7*24*3600*1000));
  return `${d.getUTCFullYear()}-W${String(w).padStart(2,'0')}`;
}
