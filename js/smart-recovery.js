/* ============================================================
 * BULK MODE — Smart Day Recommendation (3.10)
 * ============================================================
 * عند فتح التطبيق بعد >24س بدون جلسة، يقترح "خطة استرجاع":
 *  • لو اليوم يوم تدريب في الجدول → ابدأ تدريب اليوم
 *  • لو اليوم راحة وفات يوم تدريب → ابدأ التدريب الفائت
 *  • لو فات أكثر من يوم → اقترح الأقرب فاتت
 *
 * الـ banner يظهر في تبويب التمارين (top) ويختفي عند الضغط على
 * "ابدأ" أو "تجاهل" (يُحفظ خيار التجاهل لليوم نفسه فقط).
 * ============================================================ */

const RECOVERY_DISMISS_KEY='smartRecovery_dismissedFor';

function _srToday(){const d=new Date();d.setHours(0,0,0,0);return d}
function _srISO(d){return d.toISOString().split('T')[0]}
function _srProgramDayFor(weekday){
  const days=(typeof EFFECTIVE_PROGRAM!=='undefined' && EFFECTIVE_PROGRAM && EFFECTIVE_PROGRAM.days)
    ?EFFECTIVE_PROGRAM.days
    :(typeof PROGRAM_DATA!=='undefined'?PROGRAM_DATA.days:[]);
  return days.find(d=>d.dayOfWeek===weekday);
}

async function checkMissedDayRecommendation(){
  const banner=document.getElementById('missedDayBanner');
  if(!banner) return;
  banner.style.display='none';
  banner.innerHTML='';

  try{
    // لا تعرض البانر لو في جلسة نشطة الآن
    if(typeof currentSession!=='undefined' && currentSession) return;

    const workouts=await db.getAll('workouts');
    if(workouts.length<2) return; // المستخدم جديد — لا تظهر "أهلاً بعودتك"

    // التجاهل اليومي (sessionStorage فقط — لا يستمر بين الأيام)
    const today=_srToday();
    const todayISO=_srISO(today);
    try{
      if(sessionStorage.getItem(RECOVERY_DISMISS_KEY)===todayISO) return;
    }catch(e){}

    const sorted=[...workouts].sort((a,b)=>new Date(b.startTime||0)-new Date(a.startTime||0));
    const last=sorted[0];
    if(!last||!last.startTime) return;

    const lastDate=new Date(last.startTime);
    const hoursSince=(Date.now()-lastDate.getTime())/3600000;
    if(hoursSince<24) return; // أقل من يوم — لا حاجة

    // هل تمرّن المستخدم اليوم؟ (احتراز)
    const todayWorkouts=workouts.filter(w=>w.startTime && w.startTime.split('T')[0]===todayISO);
    if(todayWorkouts.length>0) return;

    const daysSince=Math.floor(hoursSince/24);
    const todayWd=today.getDay();
    const todayProgram=_srProgramDayFor(todayWd);
    const todayIsRest=todayProgram && (todayProgram.isRest||todayProgram.type==='REST');

    // ابحث عن أقرب يوم تدريب فاتت (في آخر ٧ أيام، قبل اليوم نفسه)
    let missedDay=null;
    let missedDate=null;
    for(let i=1;i<=7;i++){
      const dt=new Date(today);dt.setDate(dt.getDate()-i);
      const wd=dt.getDay();
      const pd=_srProgramDayFor(wd);
      if(!pd||pd.isRest||pd.type==='REST') continue;
      // هل تمرّن المستخدم في هذا اليوم؟
      const iso=_srISO(dt);
      const hadWorkout=workouts.some(w=>w.startTime && w.startTime.split('T')[0]===iso);
      if(!hadWorkout){missedDay=pd;missedDate=dt;break}
    }

    // الاقتراح
    let primary=null;   // اليوم المُقترح فعلياً
    let context='';     // النص الإيضاحي
    if(todayProgram && !todayIsRest){
      primary=todayProgram;
      context=`اليوم <b>${todayProgram.type||todayProgram.label}</b> حسب الجدول. ابدأ الآن لتعود للروتين.`;
    }else if(missedDay){
      primary=missedDay;
      const daysAgo=Math.floor((today.getTime()-missedDate.getTime())/86400000);
      context=todayIsRest
        ?`اليوم راحة، لكن فاتك <b>${missedDay.type||missedDay.label}</b> قبل ${daysAgo} يوم. أنجزه الآن لتعويض الفجوة.`
        :`فاتك <b>${missedDay.type||missedDay.label}</b> قبل ${daysAgo} يوم. أنجزه الآن قبل أن تفقد الالتزام.`;
    }

    // ابني الـ banner
    const sinceTxt=daysSince===1?'يوم واحد':`${daysSince} أيام`;
    const lastTypeTxt=last.dayType||'جلسة';
    const headIcon=daysSince>=4?'⚠️':daysSince>=2?'👋':'💪';
    const headText=daysSince>=4?'انقطاع طويل':daysSince>=2?'أهلاً بعودتك':'استرجع الالتزام';
    const startBtn=primary
      ?`<button class="mb-start" type="button" onclick="startRecoverySession('${escAttrSR(primary.type||primary.label||'')}')">▶ ابدأ ${escAttrSR(primary.type||primary.label||'تمرين اليوم')}</button>`
      :'';
    const fallback=!primary
      ?`<div class="mb-fallback">اليوم راحة ولا توجد جلسات فاتت قريباً — استمتع براحتك 🧘</div>`
      :'';

    banner.innerHTML=`
      <div class="mb-head">
        <span class="mb-icon">${headIcon}</span>
        <span class="mb-title">${headText}</span>
        <button class="mb-dismiss" type="button" onclick="dismissRecoveryBanner()" aria-label="تجاهل">✕</button>
      </div>
      <div class="mb-body">
        <div class="mb-line">آخر جلسة <b>${lastTypeTxt}</b> قبل <b>${sinceTxt}</b>.</div>
        ${context?`<div class="mb-line">${context}</div>`:''}
        ${fallback}
      </div>
      <div class="mb-actions">
        ${startBtn}
        <button class="mb-skip" type="button" onclick="dismissRecoveryBanner()">تجاهل اليوم</button>
      </div>
    `;
    banner.style.display='';
  }catch(e){
    console.warn('Missed-day check failed:',e);
  }
}

function escAttrSR(s){return String(s==null?'':s).replace(/"/g,'&quot;').replace(/'/g,"\\'").replace(/</g,'&lt;')}

async function startRecoverySession(dayType){
  if(!dayType) return;
  dismissRecoveryBanner();
  if(typeof onStartSession==='function'){
    await onStartSession(dayType);
    // مرّر للمستخدم لقسم التمارين + اليوم
    if(typeof EFFECTIVE_PROGRAM!=='undefined' && EFFECTIVE_PROGRAM && EFFECTIVE_PROGRAM.days){
      const idx=EFFECTIVE_PROGRAM.days.findIndex(d=>(d.type||d.label||'').trim()===dayType.trim());
      if(idx>=0 && typeof goToDay==='function') goToDay(idx);
    }
  }
}

function dismissRecoveryBanner(){
  const banner=document.getElementById('missedDayBanner');
  if(banner){banner.style.display='none';banner.innerHTML=''}
  try{sessionStorage.setItem(RECOVERY_DISMISS_KEY,_srISO(_srToday()))}catch(e){}
}
