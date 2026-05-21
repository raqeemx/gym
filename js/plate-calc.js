/* ============================================================
 * BULK MODE — Plate Calculator (V8)
 * ============================================================
 * تقسيم وزن مستهدف إلى بليتات لكل جانب من البار.
 *
 * - الخوارزمية: greedy من الأكبر إلى الأصغر (مناسب للأطقم القياسية)
 * - لو غير ممكن بدقة: يبحث ±step حتى يجد أقرب وزن أعلى وأسفل
 * - يحفظ تفضيلات (وزن البار + البليتات المفعّلة) في settings
 * - التصوير: ألوان IPF القياسية (أحمر 25، أزرق 20، أصفر 15، أخضر 10، أبيض 5، أحمر صغير 2.5، فضي 1.25)
 * ============================================================ */

const PC_PLATE_COLORS={
  25:   {bg:'#D4322F', fg:'#fff'},   // أحمر
  20:   {bg:'#2974BB', fg:'#fff'},   // أزرق
  15:   {bg:'#D4A853', fg:'#000'},   // أصفر/ذهبي
  10:   {bg:'#2A9D5F', fg:'#fff'},   // أخضر
  5:    {bg:'#FFFFFF', fg:'#1A1D24'},// أبيض
  2.5:  {bg:'#D4322F', fg:'#fff'},   // أحمر صغير
  1.25: {bg:'#C0C5CE', fg:'#1A1D24'} // فضي/كروم
};
const PC_PLATE_SIZES=[25, 20, 15, 10, 5, 2.5, 1.25]; // الكل افتراضياً مفعّل
const PC_BAR_OPTIONS=[
  {value:20, label:'بار أولمبي قياسي (20 كجم)'},
  {value:15, label:'بار أولمبي للسيدات (15 كجم)'},
  {value:10, label:'بار قصير / EZ-bar (10 كجم)'},
  {value:7,  label:'بار صغير (7 كجم)'},
  {value:0,  label:'بدون بار (Dumbbell/Plate-loaded)'}
];
const PC_DEFAULTS={bar:20, available:[...PC_PLATE_SIZES]};

// ============ Storage ============
async function loadPCPrefs(){
  try{
    const rec=await db.get('settings',KEYS.PLATE_CALC_PREFS);
    if(rec && rec.value) return rec.value;
  }catch(e){}
  return {...PC_DEFAULTS, available:[...PC_DEFAULTS.available]};
}

async function savePCPrefs(bar, available){
  await db.put('settings',{key:KEYS.PLATE_CALC_PREFS,value:{bar:Number(bar), available:[...available]}});
}

// ============ Algorithm ============
// يحسب البليتات لكل جانب — yields exact match أو يقترح الأقرب فوق/تحت
function calculatePlates(target, bar, available){
  const result={target, bar};
  if(!isFinite(target) || target<0){
    return {...result, error:'أدخل وزناً صحيحاً'};
  }
  if(!Array.isArray(available) || available.length===0){
    return {...result, error:'فعّل بليتاً واحداً على الأقل'};
  }
  const sorted=[...available].map(Number).filter(n=>n>0).sort((a,b)=>b-a);
  if(sorted.length===0) return {...result, error:'البليتات المفعّلة غير صالحة'};

  const perSide=(target-bar)/2;
  if(perSide<0){
    return {...result, error:`الوزن المستهدف أقل من وزن البار (${bar} كجم)`};
  }

  // greedy للوزن المعطى — يرجّع plates لو exact، أو null
  const greedy=(t)=>{
    const ps=(t-bar)/2;
    if(ps<0) return null;
    if(ps===0) return {plates:[], perSide:0, total:bar};
    const plates=[];
    let r=ps;
    const eps=0.001;
    for(const p of sorted){
      while(r>=p-eps){
        plates.push(p);
        r-=p;
      }
    }
    if(Math.abs(r)<eps) return {plates, perSide:Math.round(ps*100)/100, total:t};
    return null;
  };

  // ١. جرّب الـ exact
  const exact=greedy(target);
  if(exact) return {...result, exact:true, ...exact};

  // ٢. ابحث ±step حتى الوصول لأقرب achievable
  const step=sorted[sorted.length-1]*2; // أصغر بليت × 2 (يضاف للجانبين)
  let below=null, above=null;
  for(let i=1;i<200;i++){
    const tb=Math.round((target-i*step)*1000)/1000;
    if(tb<bar) break;
    const r=greedy(tb);
    if(r){below={...r}; break}
  }
  for(let i=1;i<200;i++){
    const ta=Math.round((target+i*step)*1000)/1000;
    const r=greedy(ta);
    if(r){above={...r}; break}
  }

  return {...result, exact:false, error:'لا يمكن تحقيق الوزن بدقة بهذه البليتات', below, above};
}

// ============ Visualization ============
// يبني HTML لشكل البار مع البليتات (دائرتان من كل جانب)
function renderPlateVisual(plates, barWeight){
  if(!plates || plates.length===0){
    return `<div class="pc-bar">
      <div class="pc-bar-side empty">—</div>
      <div class="pc-bar-rod"><span class="pc-bar-label">بار ${barWeight}كجم</span></div>
      <div class="pc-bar-side empty">—</div>
    </div>`;
  }
  // الأكبر للداخل (قريب من البار) — نرتّب desc
  const sorted=[...plates].sort((a,b)=>b-a);
  // الحجم البصري نسبي للوزن (logarithmic-ish)
  const sizeFor=(w)=>{
    if(w>=25) return 90;
    if(w>=20) return 80;
    if(w>=15) return 72;
    if(w>=10) return 62;
    if(w>=5)  return 52;
    if(w>=2.5) return 38;
    return 28;
  };
  const plateHtml=(w)=>{
    const c=PC_PLATE_COLORS[w]||{bg:'#7A8093',fg:'#fff'};
    const h=sizeFor(w);
    return `<div class="pc-plate" style="height:${h}px;background:${c.bg};color:${c.fg}">${w}</div>`;
  };
  // كل جانب يعرض البليتات من الأكبر للأصغر (للداخل ← للخارج)
  const sideInner=sorted.map(plateHtml).reverse().join(''); // من الأصغر للأكبر (للخارج إلى الداخل بصرياً RTL)
  return `<div class="pc-bar">
    <div class="pc-bar-side">${sideInner}</div>
    <div class="pc-bar-rod"><span class="pc-bar-label">بار ${barWeight}كجم</span></div>
    <div class="pc-bar-side">${[...sorted].map(plateHtml).join('')}</div>
  </div>`;
}

// ============ Modal Open/Close ============
// V8.3 (3.4) — opts.prefillWeight: تعبئة تلقائية للوزن المستهدف من سياق التمرين
// opts.context: نص اختياري يُعرض كهَمزة سياق (مثلاً اسم التمرين)
// opts.autoCalc: لو true، احسب فوراً بعد التعبئة
async function openPlateCalc(opts={}){
  const prefs=await loadPCPrefs();
  const modal=document.getElementById('plateCalcModal');
  if(!modal) return;
  // ابني checkboxes البليتات
  const platesHtml=PC_PLATE_SIZES.map(w=>{
    const checked=prefs.available.includes(w)?'checked':'';
    return `<label class="pc-plate-chip">
      <input type="checkbox" value="${w}" ${checked}>
      <span>${w} كجم</span>
    </label>`;
  }).join('');
  const barOptionsHtml=PC_BAR_OPTIONS.map(o=>
    `<option value="${o.value}" ${o.value===prefs.bar?'selected':''}>${o.label}</option>`
  ).join('');

  document.getElementById('pcBarSelect').innerHTML=barOptionsHtml;
  document.getElementById('pcPlateChips').innerHTML=platesHtml;
  const targetInp=document.getElementById('pcTarget');
  const prefill=(opts && opts.prefillWeight!=null && isFinite(opts.prefillWeight) && opts.prefillWeight>0)
    ?Number(opts.prefillWeight):null;
  targetInp.value=prefill!=null?prefill:'';
  document.getElementById('pcResult').innerHTML='';

  // V8.3 (3.4) — اعرض همزة السياق لو موجودة
  const ctxEl=document.getElementById('pcContext');
  if(ctxEl){
    if(opts && opts.context){
      ctxEl.textContent=`🧮 من: ${opts.context}`;
      ctxEl.style.display='';
    }else{
      ctxEl.textContent='';
      ctxEl.style.display='none';
    }
  }

  modal.classList.add('open');
  document.body.style.overflow='hidden';
  setTimeout(()=>{
    if(targetInp){targetInp.focus();targetInp.select&&targetInp.select()}
  },120);

  // V8.3 (3.4) — احسب فوراً لو طُلب التحضير المسبق
  if(prefill!=null && opts.autoCalc!==false){
    setTimeout(()=>doPlateCalc(),140);
  }
}

function closePlateCalc(){
  const modal=document.getElementById('plateCalcModal');
  if(!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow='';
}

// ============ Calculate (button handler) ============
async function doPlateCalc(){
  const target=parseFloat(document.getElementById('pcTarget').value);
  const bar=parseFloat(document.getElementById('pcBarSelect').value);
  const checkboxes=document.querySelectorAll('#pcPlateChips input[type=checkbox]:checked');
  const available=Array.from(checkboxes).map(cb=>parseFloat(cb.value));

  if(isNaN(target)){
    showToast('⚠️ أدخل الوزن المستهدف','var(--red)');
    return;
  }

  // احفظ التفضيلات
  await savePCPrefs(bar, available);

  // احسب
  const r=calculatePlates(target, bar, available);
  renderPlateCalcResult(r);
}

// ============ Render result ============
function renderPlateCalcResult(r){
  const wrap=document.getElementById('pcResult');
  if(!wrap) return;
  if(r.error && !r.below && !r.above){
    wrap.innerHTML=`<div class="pc-error">⚠️ ${r.error}</div>`;
    return;
  }
  if(r.exact){
    if(r.plates.length===0){
      wrap.innerHTML=`<div class="pc-success">
        <div class="pc-success-line">✅ <b>${r.total} كجم</b> = البار وحده (بدون بليتات)</div>
        ${renderPlateVisual([], r.bar)}
      </div>`;
      return;
    }
    const formula=r.plates.join(' + ');
    wrap.innerHTML=`<div class="pc-success">
      <div class="pc-success-line">✅ ضع على <b>كل جانب</b>:</div>
      <div class="pc-formula">${formula} = <b>${r.perSide} كجم</b></div>
      ${renderPlateVisual(r.plates, r.bar)}
      <div class="pc-total">الإجمالي: <b>${r.total} كجم</b> (بار ${r.bar} + 2 × ${r.perSide})</div>
    </div>`;
    return;
  }
  // غير ممكن بدقة — اقتراحات
  let html=`<div class="pc-warn">⚠️ لا يمكن تحقيق <b>${r.target} كجم</b> بدقة بهذه البليتات</div>`;
  if(r.below){
    const formulaB=r.below.plates.length?r.below.plates.join(' + '):'بدون بليتات';
    html+=`<div class="pc-alt pc-alt-below">
      <div class="pc-alt-head">⬇️ أقرب أدنى: <b>${r.below.total} كجم</b></div>
      <div class="pc-formula">${formulaB} لكل جانب = ${r.below.perSide} كجم</div>
      ${renderPlateVisual(r.below.plates, r.bar)}
    </div>`;
  }
  if(r.above){
    const formulaA=r.above.plates.length?r.above.plates.join(' + '):'بدون بليتات';
    html+=`<div class="pc-alt pc-alt-above">
      <div class="pc-alt-head">⬆️ أقرب أعلى: <b>${r.above.total} كجم</b></div>
      <div class="pc-formula">${formulaA} لكل جانب = ${r.above.perSide} كجم</div>
      ${renderPlateVisual(r.above.plates, r.bar)}
    </div>`;
  }
  if(!r.below && !r.above){
    html+=`<div class="pc-error">لم نعثر على أي وزن قابل للتحقيق قريب. جرّب تفعيل بليتات أصغر.</div>`;
  }
  wrap.innerHTML=html;
}
