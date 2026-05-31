/* ============================================================
 * BULK MODE — Achievements System (V8)
 * ============================================================
 * نظام إنجازات بسيط لتعزيز الالتزام.
 * - ACHIEVEMENTS = قائمة ثابتة من الإنجازات (id, icon, title, desc, check)
 * - الإنجازات المفتوحة تُحفظ في settings.KEYS.ACHIEVEMENTS
 *   كـ { [id]: { unlockedAt: ISOString } }
 * - checkAchievements() يُستدعى بعد saveSet/endSession ليفحص الجديد.
 * - عند فتح عدّة دفعة واحدة (مستخدم قديم): يعرض popup للأول فقط،
 *   الباقي يظهر في تبويب "🏆 إنجازاتي" بدون spam.
 * ============================================================ */

// V8.3 (3.8) — أضيف حقل progress لكل إنجاز يرجّع {current, target, unit?}
// (للإنجازات الثنائية مثل pr_storm — لا progress لأن العدّاد يصفّر كل جلسة)
const ACHIEVEMENTS = [
  // ===== الأساسيات (first-time milestones) =====
  { id:'first_set',     icon:'🎯', title:'أول سيت',         desc:'سجّلت أول سيت لك',           check:(s)=>s.totalSets>=1,        progress:(s)=>({current:Math.min(s.totalSets,1),target:1,unit:'سيت'}) },
  { id:'first_session', icon:'🔥', title:'بدأت الرحلة',     desc:'أنهيت أول جلسة كاملة',       check:(s)=>s.totalSessions>=1,    progress:(s)=>({current:Math.min(s.totalSessions,1),target:1,unit:'جلسة'}) },
  { id:'first_pr',      icon:'🏆', title:'أول رقم قياسي',   desc:'حطّمت أول PR',                check:(s)=>s.totalPRs>=1,         progress:(s)=>({current:Math.min(s.totalPRs,1),target:1,unit:'PR'}) },

  // ===== كميات تراكمية =====
  { id:'sets_100',      icon:'💯', title:'100 سيت',          desc:'سجّلت 100 سيت إجمالي',       check:(s)=>s.totalSets>=100,      progress:(s)=>({current:s.totalSets,target:100,unit:'سيت'}) },
  { id:'sets_500',      icon:'🔥', title:'500 سيت',          desc:'سجّلت 500 سيت',              check:(s)=>s.totalSets>=500,      progress:(s)=>({current:s.totalSets,target:500,unit:'سيت'}) },
  { id:'sets_1000',     icon:'💎', title:'1000 سيت',         desc:'وصلت 1000 سيت',              check:(s)=>s.totalSets>=1000,     progress:(s)=>({current:s.totalSets,target:1000,unit:'سيت'}) },
  { id:'volume_10k',    icon:'⚡', title:'10,000 كجم',       desc:'حجم تراكمي 10,000 كجم',      check:(s)=>s.totalVolume>=10000,  progress:(s)=>({current:s.totalVolume,target:10000,unit:'كجم'}) },
  { id:'volume_50k',    icon:'🚀', title:'50,000 كجم',       desc:'حجم تراكمي 50,000 كجم',      check:(s)=>s.totalVolume>=50000,  progress:(s)=>({current:s.totalVolume,target:50000,unit:'كجم'}) },
  { id:'volume_100k',   icon:'🌟', title:'100,000 كجم',      desc:'حجم تراكمي 100,000 كجم',     check:(s)=>s.totalVolume>=100000, progress:(s)=>({current:s.totalVolume,target:100000,unit:'كجم'}) },

  // ===== سلاسل (streaks) =====
  { id:'streak_7',      icon:'📅', title:'أسبوع كامل',       desc:'7 أيام تدريب متتالية',       check:(s)=>s.bestStreak>=7,       progress:(s)=>({current:s.bestStreak,target:7,unit:'يوم'}) },
  { id:'streak_14',     icon:'🗓️', title:'أسبوعان',          desc:'14 يوم متتالي',              check:(s)=>s.bestStreak>=14,      progress:(s)=>({current:s.bestStreak,target:14,unit:'يوم'}) },
  { id:'streak_30',     icon:'🔱', title:'شهر بلا انقطاع',   desc:'30 يوم متتالي',              check:(s)=>s.bestStreak>=30,      progress:(s)=>({current:s.bestStreak,target:30,unit:'يوم'}) },

  // ===== PRs تراكمية =====
  { id:'prs_10',        icon:'🥇', title:'محطّم الأرقام',    desc:'10 PRs',                     check:(s)=>s.totalPRs>=10,        progress:(s)=>({current:s.totalPRs,target:10,unit:'PR'}) },
  { id:'prs_50',        icon:'🥈', title:'ملك الـ PRs',      desc:'50 PRs',                     check:(s)=>s.totalPRs>=50,        progress:(s)=>({current:s.totalPRs,target:50,unit:'PR'}) },

  // ===== PRs في جلسة واحدة (تحتاج lastSession — لا progress) =====
  { id:'pr_storm',      icon:'⛈️', title:'عاصفة الأرقام',    desc:'3 PRs في جلسة واحدة',        check:(s,ls)=>ls && ls.prCount>=3 },
  { id:'pr_legend',     icon:'🐉', title:'أسطورة',            desc:'5 PRs في جلسة واحدة',        check:(s,ls)=>ls && ls.prCount>=5 }
];

// ============ Stats Builder ============
// يجمع إحصائيات الـ DB في object واحد لتمريره لـ check()
async function computeAchievementStats(){
  const sets=await db.getAll('sets');
  const workouts=await db.getAll('workouts');
  const prs=await db.getAll('prs');
  // V8.3 — استبعاد سيتات التسخين من الحجم الإجمالي
  const totalVolume=sets.reduce((a,s)=>s.isWarmup?a:a+(s.weight||0)*(s.reps||0),0);
  // bestStreak من computeStreak (معرّفة في progress.js — متاحة كـ global)
  let bestStreak=0;
  try{
    if(typeof computeStreak==='function'){
      bestStreak=computeStreak(workouts).best||0;
    }
  }catch(e){}
  return {
    totalSets:sets.length,
    totalSessions:workouts.length,
    totalPRs:prs.length,
    totalVolume:Math.round(totalVolume),
    bestStreak
  };
}

// ============ Core: check + unlock ============
// opts: { lastSession?, afterPR?, delay?, silent? }
//   - lastSession: workout object (لـ pr_storm/legend)
//   - afterPR: لو هناك PR popup شغّال، يؤخّر popup الإنجاز
//   - delay: override للتأخير اليدوي
//   - silent: لو true يحفظ بدون popup (مفيد للترحيل أو الفحص الأول)
async function checkAchievements(opts){
  opts=opts||{};
  try{
    const stats=await computeAchievementStats();
    const rec=await db.get('settings',KEYS.ACHIEVEMENTS);
    const unlocked=(rec&&rec.value)||{};
    const newlyUnlocked=[];

    for(const ach of ACHIEVEMENTS){
      if(unlocked[ach.id]) continue;
      let passed=false;
      try{ passed=ach.check(stats,opts.lastSession||null); }
      catch(e){ console.warn('Achievement check error:',ach.id,e) }
      if(passed){
        unlocked[ach.id]={unlockedAt:new Date().toISOString()};
        newlyUnlocked.push(ach);
      }
    }

    if(newlyUnlocked.length===0) return [];
    await db.put('settings',{key:KEYS.ACHIEVEMENTS,value:unlocked});

    // popup للأول فقط، الباقي في صفحة الإنجازات
    if(!opts.silent){
      const first=newlyUnlocked[0];
      const more=newlyUnlocked.length-1;
      const delay=opts.delay!=null?opts.delay:(opts.afterPR?3800:600);
      setTimeout(()=>celebrateAchievement(first,more),delay);
    }
    return newlyUnlocked;
  }catch(e){
    console.warn('checkAchievements failed:',e);
    return [];
  }
}

// V9.8 (#16) — يرجّع أقرب إنجاز قادم للفتح (أعلى % progress من المقفلة)
async function getNextAchievement(){
  try{
    const rec=await db.get('settings',KEYS.ACHIEVEMENTS);
    const unlocked=(rec&&rec.value)||{};
    const stats=await computeAchievementStats();
    let best=null;
    for(const ach of ACHIEVEMENTS){
      if(unlocked[ach.id]) continue;
      if(typeof ach.progress!=='function') continue;
      try{
        const p=ach.progress(stats);
        if(!p || !isFinite(p.target) || p.target<=0) continue;
        const cur=Math.max(0,Math.min(p.current,p.target));
        const pct=cur/p.target;
        if(pct>=1) continue; // فعلاً مفتوح لكن لم يُكتشف بعد — تجاهل
        // اختر الأعلى pct (الأقرب للفتح)
        if(!best || pct>best.pct){
          best={
            ach,
            current:cur,
            target:p.target,
            unit:p.unit||'',
            pct,
            remaining:Math.ceil(p.target-cur)
          };
        }
      }catch(e){}
    }
    return best;
  }catch(e){return null}
}

// ============ Popup (مرآة celebratePR بلون مختلف) ============
function celebrateAchievement(ach,moreCount){
  const overlay=document.createElement('div');
  overlay.className='pr-flash ach-popup';
  const moreHtml=(moreCount>0)
    ?`<div class="ach-more">+${moreCount} إنجاز جديد · شوفها في تبويب 🏆 إنجازاتي</div>`
    :'';
  overlay.innerHTML=`
    <div class="pr-flash-inner">
      <div class="pr-flash-icon">${ach.icon}</div>
      <div class="pr-flash-title">إنجاز جديد!</div>
      <div class="pr-flash-ex">${ach.title}</div>
      <div class="pr-flash-prs">
        <div class="pr-flash-item">${ach.desc}</div>
      </div>
      ${moreHtml}
    </div>
  `;
  overlay.onclick=()=>{overlay.classList.remove('show');setTimeout(()=>overlay.remove(),400)};
  document.body.appendChild(overlay);
  setTimeout(()=>overlay.classList.add('show'),50);
  try{navigator.vibrate&&navigator.vibrate([60,40,60,40,100])}catch(e){}
  setTimeout(()=>{overlay.classList.remove('show');setTimeout(()=>overlay.remove(),400)},3500);
}

// ============ Helper: عدد المفتوحة (للـ progress tab badge مستقبلاً) ============
async function getUnlockedAchievementsMap(){
  const rec=await db.get('settings',KEYS.ACHIEVEMENTS);
  return (rec&&rec.value)||{};
}
