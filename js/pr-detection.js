/* ============================================================
 * BULK MODE V9.0 (P8) — PR Detection & Near-PR Hint
 * ============================================================
 * مستخرج من session.js للوضوح والاختبار.
 *
 * يحتوي:
 *   • EPLEY                — معادلة 1RM المقدّر
 *   • detectPRs(setRec)    — كشف ٥ أنواع PR + حفظها في 'prs' store
 *   • celebratePR(prs,name)— overlay احتفال
 *   • near-PR cache + logic + DOM listener (V9.0 P7)
 *     يُظهر hint تحت كل track-input لو الإدخال = PR أو قريب منه
 *
 * يعتمد على:
 *   • db (data.js)
 *   • escHTML (data.js)
 *
 * كل الدوال global (classic scripts) — متاحة في session.js وأي
 * ملف يأتي بعد هذا في ترتيب الـ <script>.
 *
 * يُحمّل قبل session.js في index.html.
 * ============================================================ */

// ============ Epley + Detection ============
const EPLEY=(w,r)=>w*(1+r/30);

async function detectPRs(setRec){
  // V8.3 — سيتات التسخين لا تُحتسب في الأرقام القياسية
  if(setRec.isWarmup) return [];
  const all=await db.getAll('sets','exerciseName',setRec.exerciseName);
  // V8.3 — استبعد سيتات التسخين من مقارنة السجلات
  const prev=all.filter(s=>s.id!==setRec.id && !s.isWarmup);
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
  const E=(typeof escHTML==='function')?escHTML:(x=>String(x==null?'':x));
  overlay.innerHTML=`
    <div class="pr-flash-inner">
      <div class="pr-flash-icon">🏆</div>
      <div class="pr-flash-title">رقم قياسي جديد!</div>
      <div class="pr-flash-ex">${E(exName)}</div>
      <div class="pr-flash-prs">
        ${prs.map(p=>`<div class="pr-flash-item">${E(p.label)}</div>`).join('')}
      </div>
    </div>
  `;
  overlay.onclick=()=>{overlay.classList.remove('show');setTimeout(()=>overlay.remove(),400)};
  document.body.appendChild(overlay);
  setTimeout(()=>overlay.classList.add('show'),50);
  try{navigator.vibrate&&navigator.vibrate([100,50,100,50,200])}catch(e){}
  setTimeout(()=>{overlay.classList.remove('show');setTimeout(()=>overlay.remove(),400)},3000);
}

// ============================================================
// V9.0 (P7) — Near-PR hint: يفحص الإدخال الحالي ويبلّغ المستخدم
// لو سيحقق PR أو قريب منه (يحتاج +١ تكرار أو +٢.٥ كجم فقط).
// ============================================================
const _nearPRCache=new Map(); // exName → {prevSets:[...], maxW, maxV, max1RM, expireAt}
const NEAR_PR_TTL=30000; // ٣٠ ثانية — يكفي لحماية DB من spam بدون تأخر مرئي

async function _getPRStats(exName){
  const now=Date.now();
  const cached=_nearPRCache.get(exName);
  if(cached && cached.expireAt>now) return cached;
  const all=await db.getAll('sets','exerciseName',exName);
  const prev=all.filter(s=>!s.isWarmup);
  const maxW=prev.length?Math.max(...prev.map(s=>s.weight)):0;
  const maxV=prev.length?Math.max(...prev.map(s=>s.weight*s.reps)):0;
  const max1RM=prev.length?Math.max(...prev.map(s=>EPLEY(s.weight,s.reps))):0;
  const repsByWeight={};
  prev.forEach(s=>{if(!repsByWeight[s.weight]||s.reps>repsByWeight[s.weight]) repsByWeight[s.weight]=s.reps});
  const stats={prevCount:prev.length,maxW,maxV,max1RM,repsByWeight,expireAt:now+NEAR_PR_TTL};
  _nearPRCache.set(exName,stats);
  return stats;
}

function _invalidateNearPRCache(exName){
  if(exName) _nearPRCache.delete(exName);
  else _nearPRCache.clear();
}

function _evaluateNearPR(stats,w,r){
  if(!stats || stats.prevCount===0) return null;
  if(!w || !r || w<=0 || r<=0) return null;

  const types=[];
  if(w>stats.maxW) types.push('weight');
  const vol=w*r;
  if(vol>stats.maxV) types.push('volume');
  const oneRm=EPLEY(w,r);
  if(oneRm>stats.max1RM) types.push('1rm');
  const sameWMaxR=stats.repsByWeight[w];
  if(sameWMaxR!=null && r>sameWMaxR) types.push('reps');

  if(types.length) return {isPR:true,types};
  // قريب
  if(sameWMaxR!=null && r===sameWMaxR){
    return {isPR:false,nearMsg:`⚡ تكرار واحد إضافي = Rep PR عند ${w} كجم`};
  }
  if(w>=stats.maxW-2.5 && w<=stats.maxW){
    const need=stats.maxW-w+0.5;
    if(need>0 && need<=2.5){
      return {isPR:false,nearMsg:`⚡ +${need} كجم = Weight PR (الحالي ${stats.maxW})`};
    }
  }
  if(stats.max1RM>0 && oneRm>=stats.max1RM*0.95 && oneRm<stats.max1RM){
    return {isPR:false,nearMsg:`⚡ قريب من 1RM PR (${Math.round(stats.max1RM*10)/10} كجم متوقع)`};
  }
  return null;
}

function _updateNearPRHint(trackDiv,result){
  let hint=trackDiv.querySelector('.pr-hint');
  if(!result){
    if(hint) hint.remove();
    return;
  }
  if(!hint){
    hint=document.createElement('div');
    hint.className='pr-hint';
    trackDiv.appendChild(hint);
  }
  if(result.isPR){
    hint.className='pr-hint pr-hint-active';
    hint.innerHTML=`<span class="prh-icon">🏆</span><span><b>سيت قياسي!</b> ${result.types.map(t=>({weight:'وزن',volume:'حجم','1rm':'1RM',reps:'تكرار'})[t]||t).join(' · ')}</span>`;
  }else{
    hint.className='pr-hint pr-hint-near';
    const E=(typeof escHTML==='function')?escHTML:(x=>String(x==null?'':x));
    hint.innerHTML=`<span class="prh-icon">⚡</span><span>${E(result.nearMsg)}</span>`;
  }
}

const _nearPRTimers=new WeakMap();

async function _runNearPRCheck(trackDiv){
  const wInput=trackDiv.querySelector('.weight-input');
  const rInput=trackDiv.querySelector('.reps-input');
  if(!wInput || !rInput) return;
  const exName=wInput.dataset.name;
  if(!exName) return;
  if(trackDiv.dataset.isWarmup==='1'){_updateNearPRHint(trackDiv,null);return}
  const step=trackDiv.closest('.step');
  if(step && (step.classList.contains('completed')||step.classList.contains('skipped'))){
    _updateNearPRHint(trackDiv,null);return;
  }
  const w=parseFloat(wInput.value);
  const r=parseInt(rInput.value,10);
  if(isNaN(w)||isNaN(r)||w<=0||r<=0){_updateNearPRHint(trackDiv,null);return}
  try{
    const stats=await _getPRStats(exName);
    const result=_evaluateNearPR(stats,w,r);
    _updateNearPRHint(trackDiv,result);
  }catch(e){/* صامت */}
}

// Delegated input listener — مرة واحدة عند load
document.addEventListener('input',(e)=>{
  const t=e.target;
  if(!t || (!t.classList.contains('weight-input') && !t.classList.contains('reps-input'))) return;
  const trackDiv=t.closest('.track-input');
  if(!trackDiv) return;
  const prev=_nearPRTimers.get(trackDiv);
  if(prev) clearTimeout(prev);
  _nearPRTimers.set(trackDiv,setTimeout(()=>_runNearPRCheck(trackDiv),150));
});
