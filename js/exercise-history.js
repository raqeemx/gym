/* ============================================================
 * BULK MODE — Exercise History (3.9)
 * ============================================================
 * زر "📜" بجانب اسم كل تمرين يفتح modal بكل السيتات السابقة لذلك التمرين.
 * - يجمع السيتات من IndexedDB، يجمعها بالجلسة (workout)، ويعرض تطوّر الأوزان.
 * - سيتات التسخين (isWarmup) تُعرض بشارة 🔥 ولا تدخل ضمن "أفضل/أعلى".
 * ============================================================ */

function injectHistoryButtons(){
  // كل ستيب تدريبي + ستيبات التسخين القابلة للتتبع
  document.querySelectorAll('.step:not(.rest)').forEach(step=>{
    if(step.querySelector('.ex-history-btn')) return;
    const stepBody=step.querySelector('.step-body');
    const nameEl=step.querySelector('.step-name');
    if(!stepBody||!nameEl) return;
    const raw=(typeof getExerciseName==='function')?getExerciseName(step):'';
    if(!raw) return;
    const exName=(typeof normalizeExName==='function')?normalizeExName(raw):raw;
    if(!exName) return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='ex-history-btn';
    btn.setAttribute('aria-label','تاريخ هذا التمرين');
    btn.title='عرض كل سيتاتك السابقة لهذا التمرين';
    btn.textContent='📜';
    btn.dataset.exName=exName;
    btn.onclick=(e)=>{e.stopPropagation();openExerciseHistory(exName)};
    // ضع بعد form-note-btn لو موجود، وإلا بعد step-name مباشرة
    const formNoteBtn=stepBody.querySelector('.form-note-btn');
    const anchor=formNoteBtn||nameEl;
    stepBody.insertBefore(btn,anchor.nextSibling);
    stepBody.classList.add('has-history');
  });
}

async function openExerciseHistory(exName){
  if(!exName) return;
  const modal=document.getElementById('exHistoryModal');
  if(!modal) return;
  const titleEl=document.getElementById('exHistoryTitle');
  const subEl=document.getElementById('exHistorySubtitle');
  const statsEl=document.getElementById('exHistoryStats');
  const bodyEl=document.getElementById('exHistoryBody');
  if(titleEl) titleEl.textContent=`📜 ${exName}`;
  if(subEl) subEl.textContent='جاري التحميل...';
  if(statsEl) statsEl.innerHTML='';
  if(bodyEl) bodyEl.innerHTML='<div class="chart-loading">جاري التحميل...</div>';

  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';

  // اقرأ كل السيتات لهذا التمرين
  let sets=[];
  let workouts=[];
  try{
    sets=await db.getAll('sets','exerciseName',exName);
    if(sets.length){
      const allW=await db.getAll('workouts');
      const wIds=new Set(sets.map(s=>s.workoutId));
      workouts=allW.filter(w=>wIds.has(w.id));
    }
  }catch(e){console.warn('Failed to load history:',e)}

  if(!sets.length){
    if(subEl) subEl.textContent='—';
    if(bodyEl) bodyEl.innerHTML=`<div class="exh-empty">
      <div class="exh-empty-icon">📭</div>
      <div>لم تسجّل أي سيت لهذا التمرين بعد.</div>
      <small>سيظهر هنا تاريخك كاملاً بعد أول سيت محفوظ.</small>
    </div>`;
    return;
  }

  // إحصائيات
  const work=sets.filter(s=>!s.isWarmup);
  const warmupCount=sets.length-work.length;
  const totalSets=sets.length;
  const totalVol=work.reduce((a,s)=>a+(s.weight||0)*(s.reps||0),0);
  const prCount=work.filter(s=>s.isPR).length;
  let bestSet=null;
  let bestE1rm=0;
  for(const s of work){
    if(!bestSet || s.weight>bestSet.weight || (s.weight===bestSet.weight && s.reps>bestSet.reps)) bestSet=s;
    const e=s.weight*(1+s.reps/30);
    if(e>bestE1rm) bestE1rm=e;
  }
  const firstSet=[...sets].sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp))[0];
  const lastSet=[...sets].sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp))[0];

  if(subEl){
    const firstStr=firstSet?fmtDate(firstSet.timestamp):'';
    subEl.textContent=`أول مرة: ${firstStr} · ${workouts.length} جلسة`;
  }

  if(statsEl){
    statsEl.innerHTML=`
      <div class="exh-stat"><div class="exh-sn">${totalSets}</div><div class="exh-sl">إجمالي السيتات</div></div>
      <div class="exh-stat"><div class="exh-sn">${work.length}</div><div class="exh-sl">سيت عمل${warmupCount?' <small>(+'+warmupCount+'🔥)</small>':''}</div></div>
      <div class="exh-stat"><div class="exh-sn">${bestSet?(bestSet.weight+'كجم'):'—'}</div><div class="exh-sl">أعلى وزن${bestSet?' × '+bestSet.reps:''}</div></div>
      <div class="exh-stat"><div class="exh-sn">${bestE1rm?Math.round(bestE1rm)+'كجم':'—'}</div><div class="exh-sl">أعلى 1RM مقدّر</div></div>
      <div class="exh-stat"><div class="exh-sn">${Math.round(totalVol).toLocaleString('ar-SA')}</div><div class="exh-sl">إجمالي الحجم</div></div>
      <div class="exh-stat"><div class="exh-sn">${prCount}</div><div class="exh-sl">🏆 PRs</div></div>
    `;
  }

  // اجمع السيتات بالـ workout — رتّب من الأحدث للأقدم
  const setsByWid={};
  for(const s of sets){
    if(!setsByWid[s.workoutId]) setsByWid[s.workoutId]=[];
    setsByWid[s.workoutId].push(s);
  }
  const sortedWorkouts=[...workouts].sort((a,b)=>new Date(b.startTime||0)-new Date(a.startTime||0));

  // احسب أعلى وزن سابق لكل جلسة لتحديد "ارتفاع/انخفاض" مقارنة بالجلسة السابقة
  const bestPerWorkoutDesc=sortedWorkouts.map(w=>{
    const ws=(setsByWid[w.id]||[]).filter(s=>!s.isWarmup);
    if(!ws.length) return null;
    return ws.reduce((b,s)=>(!b||s.weight>b.weight||(s.weight===b.weight&&s.reps>b.reps))?s:b,null);
  });

  const sessionsHtml=sortedWorkouts.map((w,idx)=>{
    const ws=(setsByWid[w.id]||[]).sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp));
    if(!ws.length) return '';
    const best=bestPerWorkoutDesc[idx];
    const prevBest=bestPerWorkoutDesc[idx+1];
    let trendHtml='';
    if(best && prevBest){
      const diff=best.weight-prevBest.weight;
      if(diff>0) trendHtml=`<span class="exh-trend up">↑ +${diff}كجم</span>`;
      else if(diff<0) trendHtml=`<span class="exh-trend down">↓ ${diff}كجم</span>`;
      else trendHtml=`<span class="exh-trend flat">— نفس الوزن</span>`;
    }
    const setsHtml=ws.map(s=>{
      const cls='exh-set'+(s.isWarmup?' warmup':'')+(s.isPR?' pr':'');
      const warm=s.isWarmup?'🔥 ':'';
      const pr=s.isPR?' 🏆':'';
      const rpe=s.rpe?`<span class="exh-rpe">@${s.rpe}</span>`:'';
      const note=s.note?`<span class="exh-set-note" title="${escAttrEx(s.note)}">📝</span>`:'';
      return `<span class="${cls}">${warm}<b>${s.weight}</b>×${s.reps}${rpe}${pr}${note}</span>`;
    }).join('');
    const wDate=fmtDate(w.startTime);
    const wType=w.dayType||'جلسة';
    return `<div class="exh-session">
      <div class="exh-session-head">
        <span class="exh-date">${wDate}</span>
        <span class="exh-type">${wType}</span>
        ${trendHtml}
      </div>
      <div class="exh-sets">${setsHtml}</div>
    </div>`;
  }).join('');

  if(bodyEl) bodyEl.innerHTML=sessionsHtml||'<div class="exh-empty">لا توجد جلسات.</div>';
}

function closeExerciseHistory(){
  const modal=document.getElementById('exHistoryModal');
  if(!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}

function escAttrEx(s){return String(s==null?'':s).replace(/"/g,'&quot;').replace(/</g,'&lt;')}
