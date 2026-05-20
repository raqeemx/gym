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
// V7.2 (#37) — Profile modal outside click
const _profileModal=document.getElementById('profileModal');
if(_profileModal){
  _profileModal.addEventListener('click',(e)=>{
    if(e.target.id==='profileModal') closeProfile();
  });
}

// ============ V7.2 — USER PROFILE (#37) ============
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
  updateProfileCalc();
  // اربط on-input handlers لإعادة الحساب
  ['profAge','profHeight','profWeight','profGoal','profExp'].forEach(id=>{
    const el=document.getElementById(id);
    if(el && !el.dataset.bound){
      el.addEventListener('input',updateProfileCalc);
      el.addEventListener('change',updateProfileCalc);
      el.dataset.bound='1';
    }
  });
  document.getElementById('profileModal').classList.add('open');
}

function closeProfile(){
  document.getElementById('profileModal').classList.remove('open');
  document.body.style.overflow='';
}

// يحسب التوصيات الغذائية بناءً على الملف
function computeNutritionTargets(p){
  const w=parseFloat(p.weight);const h=parseFloat(p.height);const a=parseInt(p.age);
  if(!w||!h||!a) return null;
  // Mifflin-St Jeor (ذكر افتراضياً — نضيف اختيار الجنس مستقبلاً)
  const bmr=Math.round(10*w + 6.25*h - 5*a + 5);
  // مستوى النشاط: متوسط (يتمرن ٤-٦ مرات)
  const tdee=Math.round(bmr*1.55);
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
  return {bmr,tdee,calories,protein,fat,carb};
}

function updateProfileCalc(){
  const p={
    age:document.getElementById('profAge').value,
    height:document.getElementById('profHeight').value,
    weight:document.getElementById('profWeight').value,
    goal:document.getElementById('profGoal').value,
    experience:document.getElementById('profExp').value
  };
  const n=computeNutritionTargets(p);
  const wrap=document.getElementById('profCalc');
  if(!n){wrap.innerHTML='<div class="prof-calc-empty">أكمل البيانات أعلاه لاحتساب احتياجك اليومي</div>';return}
  wrap.innerHTML=`<div class="prof-calc-title">🧮 احتياجك اليومي المحسوب</div>
    <div class="prof-calc-grid">
      <div class="prof-calc-item"><span class="pcv">${n.calories}</span><span class="pcl">سعرة</span></div>
      <div class="prof-calc-item"><span class="pcv">${n.protein}<small>جم</small></span><span class="pcl">بروتين</span></div>
      <div class="prof-calc-item"><span class="pcv">${n.carb}<small>جم</small></span><span class="pcl">كارب</span></div>
      <div class="prof-calc-item"><span class="pcv">${n.fat}<small>جم</small></span><span class="pcl">دهون</span></div>
    </div>
    <div class="prof-calc-note">BMR: ${n.bmr} · TDEE: ${n.tdee} · الهدف: ${
      p.goal==='bulk'?'+400 للتضخيم':p.goal==='cut'?'-400 للتنشيف':p.goal==='recomp'?'متعادل':'حفاظ'
    }</div>`;
}

async function saveUserProfile(){
  const p={
    name:document.getElementById('profName').value.trim(),
    age:parseInt(document.getElementById('profAge').value)||null,
    height:parseFloat(document.getElementById('profHeight').value)||null,
    weight:parseFloat(document.getElementById('profWeight').value)||null,
    goal:document.getElementById('profGoal').value,
    experience:document.getElementById('profExp').value,
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
  try{
    await db.open();
    await applyDataMigrations(); // V7 #29 — رحّل مفاتيح settings للأسماء الـ namespaced
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
    await checkSessionRecovery(); // V7 #36 — فحص جلسة معلّقة بعد فترة طويلة
    highlightToday();          // تظليل بطاقة اليوم + فتحها تلقائياً (V7)
    await setupHeroCollapse(); // طي الـ Hero بعد أول جلسة (V7 — #24)
    await updateWeekUI();      // شارة الأسبوع + بانر deload (V7 — #15)
    await checkOnboarding();  // فحص أول فتح وعرض الـ onboarding (V7)
    await checkExportReminder(); // تذكير بالتصدير الأسبوعي (V7)
    setupInstallPrompt();      // V7 #34 — التقاط beforeinstallprompt + iOS hint
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