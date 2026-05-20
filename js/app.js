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
  await db.put('settings',{key:'onboarded',value:true,date:new Date().toISOString()});
  closeOnboarding();
  showToast('🎉 جاهز! ابدأ من تبويب «التمارين»');
}

async function skipOnboarding(){
  await db.put('settings',{key:'onboarded',value:true,date:new Date().toISOString(),skipped:true});
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
    const flag=await db.get('settings','onboarded');
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
  try{
    await db.open();
    await loadTheme();        // V7 #26 — حمّل الـ theme قبل أي شيء آخر
    await migrateFromLS();
    ensureStepIds();         // ID مستقر لكل step (V6)
    normalizeDataDigits();    // V7 #21 — توحيد الأرقام (لاتينية للبيانات)
    injectSessionControls();
    await injectTrackingInputs();
    injectAltButtons();      // أزرار "⇄ بديل؟" (V6)
    injectSkipButtons();      // أزرار "↷ تخطّى" (V7 — #12)
    syncPlanBTexts();         // مزامنة نصوص Plan B من الكتالوج (V7 — #11)
    await loadSubstitutions();// استرجع البدائل المحفوظة (V6)
    await loadSkippedSteps(); // استرجع حالات التخطّي اليوم (V7 — #12)
    await loadCurrentSession();
    highlightToday();          // تظليل بطاقة اليوم + فتحها تلقائياً (V7)
    await setupHeroCollapse(); // طي الـ Hero بعد أول جلسة (V7 — #24)
    await updateWeekUI();      // شارة الأسبوع + بانر deload (V7 — #15)
    await checkOnboarding();  // فحص أول فتح وعرض الـ onboarding (V7)
    await checkExportReminder(); // تذكير بالتصدير الأسبوعي (V7)
  }catch(e){
    console.error('Init error:',e);
    showToast('⚠️ خطأ في تحميل قاعدة البيانات','var(--red)');
  }
});

// تفعيل الصوت مبكراً (لـ iOS) — يتطلب لمسة من المستخدم
document.addEventListener('click',()=>{
  if(!REST.audioCtx){
    try{
      REST.audioCtx=new (window.AudioContext||window.webkitAudioContext)();
      if(REST.audioCtx.state==='suspended') REST.audioCtx.resume();
    }catch(e){}
  }
},{once:true});

// ============ SERVICE WORKER REGISTRATION (PWA) ============
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('service-worker.js')
      .then(reg=>console.log('SW registered:',reg.scope))
      .catch(err=>console.log('SW registration failed:',err));
  });
}