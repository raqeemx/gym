// ============ Swipe-to-dismiss للـ Bottom Sheet ============
(function(){
  let startY=0, currentY=0, isDragging=false;
  document.addEventListener('DOMContentLoaded',()=>{
    const sheet=document.getElementById('altSheet');
    const modal=document.getElementById('altModal');
    if(!sheet||!modal) return;
    sheet.addEventListener('touchstart',(e)=>{
      if(sheet.scrollTop>0) return;
      startY=e.touches[0].clientY;
      isDragging=true;
    },{passive:true});
    sheet.addEventListener('touchmove',(e)=>{
      if(!isDragging) return;
      currentY=e.touches[0].clientY;
      const dy=currentY-startY;
      if(dy>0) sheet.style.transform=`translateY(${dy}px)`;
    },{passive:true});
    sheet.addEventListener('touchend',()=>{
      if(!isDragging) return;
      const dy=currentY-startY;
      if(dy>120){
        closeAltModal();
      }
      sheet.style.transform='';
      isDragging=false;startY=0;currentY=0;
    },{passive:true});
    // النقر خارج السحب يغلق
    modal.addEventListener('click',(e)=>{
      if(e.target.id==='altModal') closeAltModal();
    });
  });
})();

// ============ FAB MENU ============
// V8.3 (UX-3) — hint لموقع زر الـ FAB (يسار) أول مرة فقط
async function maybeShowFabHint(){
  try{
    const rec=await db.get('settings',KEYS.FAB_HINT_SHOWN);
    if(rec && rec.value) return;
    const fab=document.getElementById('fabBtn');
    if(!fab) return;
    const hint=document.createElement('div');
    hint.id='fabHint';
    hint.className='fab-hint';
    hint.innerHTML=`
      <div class="fh-arrow"></div>
      <div class="fh-body">
        <b>📊 قائمتك هنا</b>
        <div>الإحصائيات، الملف الشخصي، التصدير، حاسبة البليتات — كلها من هذا الزر.</div>
      </div>
      <button class="fh-close" type="button" aria-label="فهمت">فهمت</button>
    `;
    document.body.appendChild(hint);
    setTimeout(()=>hint.classList.add('show'),300);
    const dismiss=async()=>{
      hint.classList.remove('show');
      setTimeout(()=>hint.remove(),300);
      try{await db.put('settings',{key:KEYS.FAB_HINT_SHOWN,value:true})}catch(e){}
    };
    hint.querySelector('.fh-close').onclick=dismiss;
    // اضغطة على الـ fab نفسه = تجاهل الـ hint
    fab.addEventListener('click',dismiss,{once:true});
    // اختفاء تلقائي بعد ٨ ثوانٍ
    setTimeout(()=>{if(document.body.contains(hint)) dismiss()},8000);
  }catch(e){}
}

document.getElementById('fabBtn').addEventListener('click',(e)=>{
  e.stopPropagation();
  document.getElementById('fabMenu').classList.toggle('open');
});

document.addEventListener('click',(e)=>{
  if(!e.target.closest('#fabBtn')&&!e.target.closest('#fabMenu')){
    document.getElementById('fabMenu').classList.remove('open');
  }
});

// ============ MODAL OUTSIDE CLICKS ============
document.getElementById('statsModal').addEventListener('click',(e)=>{
  if(e.target.id==='statsModal') closeStats();
});
document.getElementById('summaryModal').addEventListener('click',(e)=>{
  if(e.target.id==='summaryModal') closeSummary();
});
// V7.2 (#37) — Profile modal outside click
const _profileModal=document.getElementById('profileModal');
if(_profileModal){
  _profileModal.addEventListener('click',(e)=>{
    if(e.target.id==='profileModal') closeProfile();
  });
}
// V8 — Plate Calculator modal outside click
const _plateCalcModal=document.getElementById('plateCalcModal');
if(_plateCalcModal){
  _plateCalcModal.addEventListener('click',(e)=>{
    if(e.target.id==='plateCalcModal') closePlateCalc();
  });
}

// ============ V7.2 — USER PROFILE (#37) ============
// V8.3 (3.14) — أضيفت حقول الجنس + مستوى النشاط
// V8.3 (3.12) — أضيف هدف الوزن + التاريخ المستهدف + رسم بياني
async function openProfile(){
  document.body.style.overflow='hidden';
  // اقرأ الملف الحالي
  const rec=await db.get('settings',KEYS.USER_PROFILE);
  const p=(rec&&rec.value)||{};
  document.getElementById('profName').value=p.name||'';
  document.getElementById('profAge').value=p.age||'';
  document.getElementById('profHeight').value=p.height||'';
  document.getElementById('profWeight').value=p.weight||'';
  document.getElementById('profGoal').value=p.goal||'bulk';
  document.getElementById('profExp').value=p.experience||'beginner';
  // V8.3 (3.14)
  const gEl=document.getElementById('profGender');if(gEl) gEl.value=p.gender||'male';
  const aEl=document.getElementById('profActivity');if(aEl) aEl.value=p.activity||'moderate';
  // V8.3 (3.12)
  const twEl=document.getElementById('profTargetWeight');if(twEl) twEl.value=p.targetWeight||'';
  const tdEl=document.getElementById('profTargetDate');if(tdEl) tdEl.value=p.targetDate||'';
  updateProfileCalc();
  updateWeightGoalDisplay(); // V8.3 (3.12)
  // اربط on-input handlers لإعادة الحساب
  ['profAge','profHeight','profWeight','profGoal','profExp','profGender','profActivity'].forEach(id=>{
    const el=document.getElementById(id);
    if(el && !el.dataset.bound){
      el.addEventListener('input',updateProfileCalc);
      el.addEventListener('change',updateProfileCalc);
      el.dataset.bound='1';
    }
  });
  ['profTargetWeight','profTargetDate'].forEach(id=>{
    const el=document.getElementById(id);
    if(el && !el.dataset.bound){
      el.addEventListener('input',updateWeightGoalDisplay);
      el.addEventListener('change',updateWeightGoalDisplay);
      el.dataset.bound='1';
    }
  });
  // V8.3 (3.13) — حدّث واجهة النسخ الاحتياطي التلقائي
  if(typeof refreshAutoBackupUI==='function') refreshAutoBackupUI();
  // V8 — املأ حقول التذكيرات من الإعدادات المحفوظة
  if(typeof loadReminderPrefs==='function'){
    const prefs=await loadReminderPrefs();
    const remEnabled=document.getElementById('remEnabled');
    const remTime=document.getElementById('remTime');
    const remBefore=document.getElementById('remBefore');
    const remMissed=document.getElementById('remMissed');
    if(remEnabled) remEnabled.checked=!!prefs.enabled;
    if(remTime) remTime.value=prefs.workoutTime||'21:30';
    if(remBefore) remBefore.value=String(prefs.notifyBeforeMinutes||15);
    if(remMissed) remMissed.checked=prefs.missedSessionEnabled!==false;
    if(typeof updateReminderStatusDisplay==='function') updateReminderStatusDisplay();
  }
  document.getElementById('profileModal').classList.add('open');
}

function closeProfile(){
  document.getElementById('profileModal').classList.remove('open');
  document.body.style.overflow='';
}

// V8.3 (3.14) — معاملات Mifflin-St Jeor تختلف للذكر/الأنثى
// مستويات النشاط مرجعية (Harris-Benedict القياسية)
const ACTIVITY_FACTORS = {
  sedentary:    {factor:1.2,  label:'قليل'},
  light:        {factor:1.375,label:'خفيف'},
  moderate:     {factor:1.55, label:'متوسط'},
  active:       {factor:1.725,label:'نشط'},
  very_active:  {factor:1.9,  label:'نشط جداً'}
};

// يحسب التوصيات الغذائية بناءً على الملف
// V8.3 (3.14) — يدعم الجنس + مستوى النشاط
function computeNutritionTargets(p){
  const w=parseFloat(p.weight);const h=parseFloat(p.height);const a=parseInt(p.age);
  if(!w||!h||!a) return null;
  // Mifflin-St Jeor — يختلف للذكر/الأنثى
  const gender=(p.gender==='female')?'female':'male';
  const bmr=gender==='female'
    ?Math.round(10*w + 6.25*h - 5*a - 161)
    :Math.round(10*w + 6.25*h - 5*a + 5);
  const activityKey=p.activity||'moderate';
  const actCfg=ACTIVITY_FACTORS[activityKey]||ACTIVITY_FACTORS.moderate;
  const tdee=Math.round(bmr*actCfg.factor);
  let calories=tdee;
  if(p.goal==='bulk') calories=tdee+400;
  else if(p.goal==='cut') calories=tdee-400;
  else if(p.goal==='recomp') calories=tdee;
  // بروتين: ٢ جم/كجم لتضخيم، ٢.٤ لتنشيف
  const protein=Math.round(p.goal==='cut'?2.4*w:2.0*w);
  // دهون: ٢٥٪ من السعرات (٩ سعرات/جم)
  const fat=Math.round((calories*0.25)/9);
  // كارب: الباقي
  const carb=Math.round((calories-protein*4-fat*9)/4);
  return {bmr,tdee,calories,protein,fat,carb,activityLabel:actCfg.label,activityFactor:actCfg.factor,gender};
}

function updateProfileCalc(){
  const p={
    age:document.getElementById('profAge').value,
    height:document.getElementById('profHeight').value,
    weight:document.getElementById('profWeight').value,
    goal:document.getElementById('profGoal').value,
    experience:document.getElementById('profExp').value,
    gender:(document.getElementById('profGender')||{}).value||'male',
    activity:(document.getElementById('profActivity')||{}).value||'moderate'
  };
  const n=computeNutritionTargets(p);
  const wrap=document.getElementById('profCalc');
  if(!n){wrap.innerHTML='<div class="prof-calc-empty">أكمل البيانات أعلاه لاحتساب احتياجك اليومي</div>';return}
  const genderLabel=n.gender==='female'?'♀ أنثى':'♂ ذكر';
  wrap.innerHTML=`<div class="prof-calc-title">🧮 احتياجك اليومي المحسوب</div>
    <div class="prof-calc-grid">
      <div class="prof-calc-item"><span class="pcv">${n.calories}</span><span class="pcl">سعرة</span></div>
      <div class="prof-calc-item"><span class="pcv">${n.protein}<small>جم</small></span><span class="pcl">بروتين</span></div>
      <div class="prof-calc-item"><span class="pcv">${n.carb}<small>جم</small></span><span class="pcl">كارب</span></div>
      <div class="prof-calc-item"><span class="pcv">${n.fat}<small>جم</small></span><span class="pcl">دهون</span></div>
    </div>
    <div class="prof-calc-note">BMR: ${n.bmr} · ${genderLabel} · نشاط ${n.activityLabel} (×${n.activityFactor}) · TDEE: ${n.tdee} · الهدف: ${
      p.goal==='bulk'?'+400 للتضخيم':p.goal==='cut'?'-400 للتنشيف':p.goal==='recomp'?'متعادل':'حفاظ'
    }</div>`;
}

// V8.3 (3.12) — Weight goal tracker: ملخّص نصي + رسم بياني (المسار الفعلي vs الخطي المستهدف)
async function updateWeightGoalDisplay(){
  const targetW=parseFloat((document.getElementById('profTargetWeight')||{}).value);
  const targetD=(document.getElementById('profTargetDate')||{}).value;
  const currentW=parseFloat((document.getElementById('profWeight')||{}).value);
  const summaryEl=document.getElementById('profGoalSummary');
  const chartWrap=document.getElementById('profGoalChart');
  if(!summaryEl||!chartWrap) return;
  if(!isFinite(targetW)||!targetD){
    summaryEl.innerHTML='<div class="pg-empty">حدّد وزن وتاريخ مستهدف لتتبع التقدّم نحو الهدف.</div>';
    chartWrap.style.display='none';
    return;
  }
  // اجلب آخر قياس وزن من bodyMetrics
  let lastBM=null;
  try{
    const bm=(await db.getAll('bodyMetrics')).filter(b=>b.bodyWeight).sort((a,b)=>b.date.localeCompare(a.date));
    lastBM=bm[0]||null;
  }catch(e){}
  const startW=lastBM?lastBM.bodyWeight:currentW;
  const targetDate=new Date(targetD+'T00:00:00');
  const today=new Date();today.setHours(0,0,0,0);
  const startDate=lastBM?new Date(lastBM.date+'T00:00:00'):today;
  if(!isFinite(startW)){
    summaryEl.innerHTML='<div class="pg-empty">سجّل وزنك الحالي (في الأعلى أو من تبويب التقدّم) ليُحسب التقدّم.</div>';
    chartWrap.style.display='none';
    return;
  }
  const totalDelta=targetW-startW;
  const totalDays=Math.max(1,Math.round((targetDate-startDate)/86400000));
  const daysElapsed=Math.max(0,Math.round((today-startDate)/86400000));
  const daysRemaining=Math.max(0,Math.round((targetDate-today)/86400000));
  const expectedWNow=startW+totalDelta*Math.min(1,daysElapsed/totalDays);
  // وزن المستخدم اليوم — إذا في قياس اليوم استخدمه، وإلا startW (آخر قياس)
  const currentVsTarget=isFinite(currentW)?currentW:startW;
  const actualDelta=currentVsTarget-startW;
  const expectedDelta=expectedWNow-startW;
  const onTrack=totalDelta>0
    ?actualDelta>=expectedDelta*0.85
    :actualDelta<=expectedDelta*0.85; // للتنشيف: الـ "negative" delta يحقّق نسبياً
  const direction=totalDelta>0?'+':totalDelta<0?'-':'=';
  const remainingDelta=targetW-currentVsTarget;
  // الأسبوعي المستهدف
  const weeklyRate=totalDays>0?Math.round((totalDelta/totalDays*7)*100)/100:0;
  // ملاحظة طبية: تضخيم >0.5كجم/أسبوع = دهون كثيرة، تنشيف <-1كجم/أسبوع = فقدان عضلات
  let healthHint='';
  const absWeekly=Math.abs(weeklyRate);
  if(totalDelta>0 && weeklyRate>0.6) healthHint='⚠️ معدّل سريع — قد يزيد الدهون أكثر من العضلات (المثالي ٠.٢-٠.٥ كجم/أسبوع).';
  else if(totalDelta<0 && weeklyRate<-1.0) healthHint='⚠️ معدّل سريع للتنشيف — قد تفقد كتلة عضلية (المثالي ٠.٥-١.٠ كجم/أسبوع).';
  else if(absWeekly>0 && absWeekly<2.5) healthHint='✅ معدّل صحي ومستدام.';

  summaryEl.innerHTML=`
    <div class="pg-stats">
      <div class="pg-stat"><div class="pg-num">${startW}<small>كجم</small></div><div class="pg-lbl">البداية</div></div>
      <div class="pg-stat"><div class="pg-num">${currentVsTarget}<small>كجم</small></div><div class="pg-lbl">الحالي</div></div>
      <div class="pg-stat"><div class="pg-num">${targetW}<small>كجم</small></div><div class="pg-lbl">الهدف</div></div>
    </div>
    <div class="pg-progress">
      <div class="pg-line"><b>${direction}${Math.abs(Math.round(actualDelta*10)/10)}كجم</b> من ${direction}${Math.abs(Math.round(totalDelta*10)/10)}كجم · باقي <b>${Math.abs(Math.round(remainingDelta*10)/10)}كجم</b> في <b>${daysRemaining}</b> يوم</div>
      <div class="pg-line">المسار المتوقّع الآن: <b>${Math.round(expectedWNow*10)/10}كجم</b> ${onTrack?'<span class="pg-tag pg-on">📈 ضمن المسار</span>':'<span class="pg-tag pg-off">📉 خلف المسار</span>'}</div>
      <div class="pg-line">المعدّل المطلوب: <b>${direction}${absWeekly}كجم</b>/أسبوع</div>
      ${healthHint?`<div class="pg-health">${healthHint}</div>`:''}
    </div>
  `;
  await renderWeightGoalChart(startDate,startW,targetDate,targetW);
}

async function renderWeightGoalChart(startDate,startW,targetDate,targetW){
  const wrap=document.getElementById('profGoalChart');
  const canvas=document.getElementById('profGoalChartCanvas');
  if(!wrap||!canvas||typeof window.Chart!=='function'){if(wrap) wrap.style.display='none';return}
  let bm=[];
  try{bm=(await db.getAll('bodyMetrics')).filter(b=>b.bodyWeight && b.date>=_isoOf(startDate) && b.date<=_isoOf(targetDate)).sort((a,b)=>a.date.localeCompare(b.date))}catch(e){}
  if(!bm.length){wrap.style.display='none';return}

  // اجمع كل التواريخ (نقاط فعلية + نقطتين للمسار المستهدف) كـ labels سلسلة
  const startISO=_isoOf(startDate);
  const targetISO=_isoOf(targetDate);
  const labelsSet=new Set();
  labelsSet.add(startISO);
  bm.forEach(b=>labelsSet.add(b.date));
  labelsSet.add(targetISO);
  const labels=[...labelsSet].sort();

  // الفعلي: نقطة لكل تاريخ مع وزن، null للأخرى → الـ chart يتجاوزها مع spanGaps
  const actualByDate={[startISO]:startW};
  bm.forEach(b=>{actualByDate[b.date]=b.bodyWeight});
  const actualData=labels.map(d=>actualByDate[d]!=null?actualByDate[d]:null);
  // قطع المسار الفعلي عند آخر قياس (لا نمدّه للمستقبل)
  const lastActualDate=bm.length?bm[bm.length-1].date:startISO;
  const actualCut=labels.map((d,i)=>d<=lastActualDate?actualData[i]:null);

  // المسار المستهدف الخطي: y تتدرّج خطياً من startW عند startISO إلى targetW عند targetISO
  const totalMs=new Date(targetISO).getTime()-new Date(startISO).getTime();
  const targetData=labels.map(d=>{
    const t=new Date(d).getTime();
    if(totalMs<=0) return startW;
    const f=Math.max(0,Math.min(1,(t-new Date(startISO).getTime())/totalMs));
    return Math.round((startW+(targetW-startW)*f)*100)/100;
  });

  wrap.style.display='';
  if(window._weightGoalChart && window._weightGoalChart.destroy){window._weightGoalChart.destroy()}
  const ctx=canvas.getContext('2d');
  window._weightGoalChart=new Chart(ctx,{
    type:'line',
    data:{
      labels,
      datasets:[
        {label:'الفعلي',data:actualCut,borderColor:'#5AE68A',backgroundColor:'rgba(90,230,138,.12)',tension:.3,fill:true,pointBackgroundColor:'#5AE68A',pointRadius:3,spanGaps:true},
        {label:'المسار المستهدف',data:targetData,borderColor:'#D4A853',borderDash:[5,5],backgroundColor:'transparent',tension:0,fill:false,pointRadius:0}
      ]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      scales:{
        x:{ticks:{color:'#8890A0',font:{size:9},maxTicksLimit:6},grid:{color:'rgba(255,255,255,.04)'}},
        y:{ticks:{color:'#8890A0',font:{size:10}},grid:{color:'rgba(255,255,255,.04)'},title:{display:true,text:'كجم',color:'#8890A0',font:{size:10}}}
      },
      plugins:{legend:{labels:{color:'#D8D8D8',font:{size:10}}},tooltip:{enabled:true}}
    }
  });
}

function _isoOf(d){return new Date(d).toISOString().split('T')[0]}

async function saveUserProfile(){
  const p={
    name:document.getElementById('profName').value.trim(),
    age:parseInt(document.getElementById('profAge').value)||null,
    height:parseFloat(document.getElementById('profHeight').value)||null,
    weight:parseFloat(document.getElementById('profWeight').value)||null,
    goal:document.getElementById('profGoal').value,
    experience:document.getElementById('profExp').value,
    // V8.3 (3.14)
    gender:(document.getElementById('profGender')||{}).value||'male',
    activity:(document.getElementById('profActivity')||{}).value||'moderate',
    // V8.3 (3.12)
    targetWeight:parseFloat((document.getElementById('profTargetWeight')||{}).value)||null,
    targetDate:(document.getElementById('profTargetDate')||{}).value||null,
    updatedAt:new Date().toISOString()
  };
  await db.put('settings',{key:KEYS.USER_PROFILE,value:p});
  showToast('✓ تم حفظ الملف الشخصي','var(--grn)');
  closeProfile();
}

// ============ TODAY HIGHLIGHT (V7) ============
// تظليل بطاقة اليوم في تبويب التمارين + شبكة الأسبوع في نظرة عامة
// + فتح اليوم تلقائياً، أو عرض خيارات الاستبدال إذا كان يوم راحة
function highlightToday(){
  const dayIdx=new Date().getDay(); // 0=الأحد ... 6=السبت
  const days=document.querySelectorAll('#t1 .dy');
  if(days.length<7) return; // الكروت ما حُمّلت بعد

  // ١. تظليل بطاقة اليوم في تبويب التمارين
  const todayCard=days[dayIdx];
  if(!todayCard) return;
  todayCard.classList.add('today-day');

  // ٢. شارة "اليوم ⭐" بجانب اسم اليوم
  const dn=todayCard.querySelector('.dn');
  if(dn && !dn.querySelector('.today-badge')){
    const badge=document.createElement('span');
    badge.className='today-badge';
    badge.textContent='اليوم';
    dn.prepend(badge);
  }

  // ٣. فتح البطاقة تلقائياً (إلا إذا يوم راحة — كرت الراحة بدون body)
  const isRestDay=todayCard.querySelector('.db.rest');
  if(!isRestDay){
    todayCard.classList.add('open');
  }else{
    injectRestDaySwap(todayCard,dayIdx);
  }

  // ٤. تظليل الخلية المقابلة في شبكة "نظرة عامة"
  const cells=document.querySelectorAll('.wg .wc');
  if(cells[dayIdx]) cells[dayIdx].classList.add('today-cell');

  // ٥. سكروول هادئ للبطاقة لو في تبويب التمارين (لاحقاً عند فتح التبويب)
  todayCard.dataset.isToday='1';
}

// عرض خيارات الاستبدال داخل يوم الراحة
function injectRestDaySwap(restCard,todayIdx){
  // امنع التكرار
  if(restCard.nextElementSibling && restCard.nextElementSibling.classList.contains('rest-swap')) return;
  // خيارات: كل أيام التدريب (استبعاد الراحة نفسها)
  const opts=[
    {idx:0,wd:'الأحد',type:'UPPER A'},
    {idx:1,wd:'الإثنين',type:'BACK & WINGS'},
    {idx:2,wd:'الثلاثاء',type:'ARMS A'},
    {idx:4,wd:'الخميس',type:'UPPER B'},
    {idx:5,wd:'الجمعة',type:'LEGS'},
    {idx:6,wd:'السبت',type:'ARMS B'}
  ];
  const swap=document.createElement('div');
  swap.className='rest-swap';
  swap.innerHTML=`
    <div class="rest-swap-title">🔄 ستتدرّب اليوم بدلاً من الراحة؟</div>
    <div class="rest-swap-sub">اختر جلسة من أي يوم آخر — سيُفتح ويتم التمرير إليه:</div>
    <div class="rest-swap-row">
      ${opts.map(o=>`<button class="rest-swap-btn" onclick="goToDay(${o.idx})"><b>${o.wd}</b>${o.type}</button>`).join('')}
    </div>
  `;
  restCard.insertAdjacentElement('afterend',swap);
}

// فتح يوم محدد والتمرير إليه
function goToDay(idx){
  const days=document.querySelectorAll('#t1 .dy');
  const target=days[idx];
  if(!target) return;
  // تأكد إن تبويب التمارين فاتح
  const t1Btn=document.querySelector('.nb[data-t="1"]');
  if(t1Btn && !t1Btn.classList.contains('a')) t1Btn.click();
  // افتح البطاقة
  if(!target.classList.contains('open')) target.classList.add('open');
  // سكروول بعد فريم لضمان عرض التبويب
  setTimeout(()=>{
    target.scrollIntoView({behavior:'smooth',block:'start'});
  },180);
}

// ============ ONBOARDING (أول فتح) ============
// خريطة الجدول الأسبوعي الحالية — يجب أن تطابق <wg> في "نظرة عامة"
const WEEKLY_SCHEDULE=[
  {wd:'الأحد',short:'أحد',type:'UPPER A',cls:'upper'},
  {wd:'الاثنين',short:'اثن',type:'BACK & WINGS',cls:'arms'},
  {wd:'الثلاثاء',short:'ثلا',type:'ARMS A',cls:'arms'},
  {wd:'الأربعاء',short:'أرب',type:'راحة',cls:'rest'},
  {wd:'الخميس',short:'خمي',type:'UPPER B',cls:'upper'},
  {wd:'الجمعة',short:'جمع',type:'LEGS',cls:'legs'},
  {wd:'السبت',short:'سبت',type:'ARMS B',cls:'arms'}
];

let ONB_STEP=0;

function renderOnboardingWeek(){
  const wrap=document.getElementById('onbWeek');
  const note=document.getElementById('onbTodayNote');
  if(!wrap) return;
  const todayIdx=new Date().getDay(); // 0=الأحد ... 6=السبت
  wrap.innerHTML=WEEKLY_SCHEDULE.map((d,i)=>{
    const isToday=i===todayIdx;
    return `<div class="onb-day ${d.cls}${isToday?' today':''}">
      <div class="od-wd">${d.short}</div>
      <div class="od-tp">${d.type}</div>
    </div>`;
  }).join('');
  const today=WEEKLY_SCHEDULE[todayIdx];
  if(today.cls==='rest'){
    note.innerHTML=`اليوم <b>${today.wd}</b> — يوم راحة. استمتع، جسمك يبني العضل اليوم.`;
  }else{
    note.innerHTML=`اليوم <b>${today.wd}</b> — جلستك: <b>${today.type}</b> ⭐`;
  }
}

function onbNav(direction){
  const slides=document.querySelectorAll('.onb-slide');
  const dots=document.querySelectorAll('.onb-dot');
  const next=ONB_STEP+direction;
  if(next<0 || next>=slides.length){
    if(next>=slides.length) finishOnboarding();
    return;
  }
  slides[ONB_STEP].classList.remove('a');
  dots[ONB_STEP].classList.remove('a');
  dots[ONB_STEP].classList.add('done');
  ONB_STEP=next;
  slides[ONB_STEP].classList.add('a');
  dots[ONB_STEP].classList.remove('done');
  dots[ONB_STEP].classList.add('a');
  // أزرار التنقل
  const prev=document.getElementById('onbPrev');
  const nx=document.getElementById('onbNext');
  prev.style.display=ONB_STEP===0?'none':'inline-block';
  if(ONB_STEP===slides.length-1){
    nx.textContent='ابدأ التضخيم 💪';
    nx.classList.add('finish');
  }else{
    nx.textContent='التالي ▶';
    nx.classList.remove('finish');
  }
}

async function finishOnboarding(){
  await db.put('settings',{key:KEYS.ONBOARDED,value:true,date:new Date().toISOString()});
  closeOnboarding();
  showToast('🎉 جاهز! ابدأ من تبويب «التمارين»');
}

async function skipOnboarding(){
  await db.put('settings',{key:KEYS.ONBOARDED,value:true,date:new Date().toISOString(),skipped:true});
  closeOnboarding();
}

function closeOnboarding(){
  const ov=document.getElementById('onbOverlay');
  ov.classList.remove('open');
  ov.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}

function openOnboarding(){
  const ov=document.getElementById('onbOverlay');
  ONB_STEP=0;
  // ريست الـ slides
  document.querySelectorAll('.onb-slide').forEach((s,i)=>s.classList.toggle('a',i===0));
  document.querySelectorAll('.onb-dot').forEach((d,i)=>{
    d.classList.remove('done');
    d.classList.toggle('a',i===0);
  });
  document.getElementById('onbPrev').style.display='none';
  const nx=document.getElementById('onbNext');
  nx.textContent='التالي ▶';
  nx.classList.remove('finish');
  renderOnboardingWeek();
  ov.classList.add('open');
  ov.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}

async function checkOnboarding(){
  try{
    const flag=await db.get('settings',KEYS.ONBOARDED);
    if(!flag || !flag.value){
      // أول فتح — اعرض الـ onboarding بعد تأخير صغير لتحميل العناصر
      setTimeout(()=>openOnboarding(),250);
    }
  }catch(e){
    console.warn('Onboarding check failed:',e);
  }
}

// ============ INIT ============
window.addEventListener('DOMContentLoaded',async()=>{
  // V8 — اضبط العنوان ورقم الإصدار من js/version.js (مصدر وحيد)
  if(typeof APP_TITLE==='string') document.title=APP_TITLE;
  const vEl=document.getElementById('footerVersion');
  if(vEl && typeof APP_VERSION==='string') vEl.textContent=`v${APP_VERSION} · ${APP_BUILD||''}`;
  try{
    await db.open();
    await applyDataMigrations(); // V7 #29 — رحّل مفاتيح settings للأسماء الـ namespaced
    await loadTheme();        // V7 #26 — حمّل الـ theme قبل أي شيء آخر
    await migrateFromLS();
    await renderProgram();    // V8 (#37) — ولّد HTML من PROGRAM_DATA · V8.3 — async (يحمّل التخصيصات)
    ensureStepIds();         // ID مستقر لكل step (V6)
    normalizeDataDigits();    // V7 #21 — توحيد الأرقام (لاتينية للبيانات)
    injectSessionControls();
    await injectTrackingInputs();
    injectAltButtons();      // أزرار "⇄ بديل؟" (V6)
    injectSkipButtons();      // أزرار "↷ تخطّى" (V7 — #12)
    injectFormNoteButtons();  // V8.3 — أزرار "ℹ️" لشرح طريقة الأداء (3.2)
    injectEditorButtons();    // V8.3 — أزرار "✏️ تخصيص" لتعديل اليوم (3.3)
    if(typeof injectHistoryButtons==='function') injectHistoryButtons(); // V8.3 — أزرار "📜" لتاريخ التمرين (3.9)
    syncPlanBTexts();         // مزامنة نصوص Plan B من الكتالوج (V7 — #11)
    await loadSubstitutions();// استرجع البدائل المحفوظة (V6)
    await loadSkippedSteps(); // استرجع حالات التخطّي اليوم (V7 — #12)
    await loadCurrentSession();
    await checkSessionRecovery(); // V7 #36 — فحص جلسة معلّقة بعد فترة طويلة
    if(typeof checkMissedDayRecommendation==='function'){
      checkMissedDayRecommendation(); // V8.3 (3.10) — banner استرجاع لو فات >24س
    }
    if(typeof maybeRemindDeloadActive==='function'){
      maybeRemindDeloadActive(); // V8.3 (UX-2) — toast يومي أثناء الـ deload
    }
    if(typeof maybeShowBackupReminder==='function'){
      maybeShowBackupReminder(); // V8.3 (UX-4) — تذكير قوي بعد ١٠ سيتات
    }
    if(typeof maybeShowFabHint==='function'){
      maybeShowFabHint(); // V8.3 (UX-3) — hint لموقع الـ FAB
    }
    highlightToday();          // تظليل بطاقة اليوم + فتحها تلقائياً (V7)
    await setupHeroCollapse(); // طي الـ Hero بعد أول جلسة (V7 — #24)
    await updateWeekUI();      // شارة الأسبوع + بانر deload (V7 — #15)
    await checkOnboarding();  // فحص أول فتح وعرض الـ onboarding (V7)
    await checkExportReminder(); // تذكير بالتصدير الأسبوعي (V7)
    setupInstallPrompt();      // V7 #34 — التقاط beforeinstallprompt + iOS hint
    // V8 — تذكيرات التمرين: فحص جلسة مفوّتة + جدول التذكير القادم
    if(typeof checkMissedSession==='function') checkMissedSession();
    if(typeof scheduleNextReminder==='function') scheduleNextReminder();
  }catch(e){
    console.error('Init error:',e);
    showToast('⚠️ خطأ في تحميل قاعدة البيانات','var(--red)');
  }
});

// V7 (#35) — تفعيل الصوت مبكراً عند أي تفاعل (touchstart/pointerdown/click)
let _audioWarmupDone=false;
function warmupAudio(){
  if(_audioWarmupDone) return;
  try{
    REST.audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    if(REST.audioCtx.state==='suspended') REST.audioCtx.resume();
    _audioWarmupDone=true;
    // أزل المستمعات بعد النجاح
    document.removeEventListener('click',warmupAudio);
    document.removeEventListener('touchstart',warmupAudio);
    document.removeEventListener('pointerdown',warmupAudio);
    document.removeEventListener('keydown',warmupAudio);
  }catch(e){}
}
document.addEventListener('click',warmupAudio,{passive:true});
document.addEventListener('touchstart',warmupAudio,{passive:true});
document.addEventListener('pointerdown',warmupAudio,{passive:true});
document.addEventListener('keydown',warmupAudio,{passive:true});

// V7 (#34) — Install Prompt (Add to Home Screen)
let _deferredInstallPrompt=null;
function setupInstallPrompt(){
  // أخفِ زر التثبيت لو التطبيق مثبّت بالفعل
  if(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone){
    return;
  }
  window.addEventListener('beforeinstallprompt',(e)=>{
    e.preventDefault();
    _deferredInstallPrompt=e;
    showInstallButton();
  });
  window.addEventListener('appinstalled',()=>{
    _deferredInstallPrompt=null;
    const btn=document.getElementById('installBtn');
    if(btn) btn.remove();
    showToast('🎉 تم تثبيت التطبيق على شاشتك الرئيسية');
  });
  // iOS Safari (لا يدعم beforeinstallprompt) — اعرض تعليمات يدوية أول مرة
  const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isSafari=/^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if(isIOS && isSafari && !window.navigator.standalone){
    db.get('settings','app:ios_install_hint_shown').then(rec=>{
      if(!rec||!rec.value){
        setTimeout(()=>{
          showToast('💡 للتثبيت: اضغط مشاركة → "إضافة إلى الشاشة الرئيسية"','var(--blue)',8000);
          db.put('settings',{key:'app:ios_install_hint_shown',value:true});
        },4000);
      }
    });
  }
}

function showInstallButton(){
  if(document.getElementById('installBtn')) return;
  const btn=document.createElement('button');
  btn.id='installBtn';
  btn.className='install-btn';
  btn.innerHTML='📲 ثبّت التطبيق';
  btn.onclick=async()=>{
    if(!_deferredInstallPrompt) return;
    _deferredInstallPrompt.prompt();
    const choice=await _deferredInstallPrompt.userChoice;
    _deferredInstallPrompt=null;
    btn.remove();
    if(choice.outcome==='accepted'){
      showToast('🎉 جاري التثبيت...');
    }
  };
  document.body.appendChild(btn);
}

// ============ SERVICE WORKER REGISTRATION (PWA) ============
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('service-worker.js').then(reg=>{
      console.log('SW registered:',reg.scope);
      // V7 (#33) — اكشف عن تحديثات
      reg.addEventListener('updatefound',()=>{
        const newSW=reg.installing;
        if(!newSW) return;
        newSW.addEventListener('statechange',()=>{
          if(newSW.state==='installed' && navigator.serviceWorker.controller){
            // نسخة جديدة جاهزة — اعرض toast بزر للتحديث
            showToast('🔄 نسخة جديدة متاحة',  'var(--blue)', 12000, {
              action:{label:'تحديث',handler:()=>{
                newSW.postMessage({type:'SKIP_WAITING'});
              }}
            });
          }
        });
      });
    }).catch(err=>console.log('SW registration failed:',err));
    // عند تغيير الـ SW النشط، أعد تحميل الصفحة
    let _reloading=false;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      if(_reloading) return;
      _reloading=true;
      location.reload();
    });
  });
}