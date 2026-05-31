/* ============================================================
 * BULK MODE V9.1 (A.4) — Program Templates Registry
 * ============================================================
 * نظام برامج متعدد بدلاً من برنامج واحد ثابت.
 *
 * بنية كل template = نفس بنية PROGRAM_DATA الحالية:
 *   { meta:{id,name,...}, days:[{id,dayOfWeek,type,phases:[...]}, ...] }
 *
 * كيف يعمل:
 *   1. PROGRAM_TEMPLATES يحوي كل البرامج (الأصلي + الجديدة).
 *   2. KEYS.ACTIVE_PROGRAM_ID يحفظ الـ id المختار.
 *   3. getActiveProgram() يقرأ الـ id ويُرجع الـ template المطابق.
 *   4. renderProgram() (في program-render.js) يستدعي getActiveProgram() بدل PROGRAM_DATA مباشرة.
 *
 * recommendProgram(profile) يقترح الأنسب من بيانات onboarding.
 *
 * هذا الملف يُحمَّل بعد program-data.js (يعتمد على PROGRAM_DATA كأساس
 * للـ 'upper-priority' template).
 * ============================================================ */

// ============ Helper: Straight-Set Day Builder ============
// مولّد بسيط لأيام Straight-Sets (بدون APS). يستخدم في Full Body / Upper-Lower.
// كل تمرين = phase واحدة بـ N سيت × راحة مُحددة.
function _ssPhase(label, exName, sets, repsRange, startWeight, restSec, isCompound){
  const steps = [];
  for(let i=1;i<=sets;i++){
    const isLast = i===sets;
    const setLabel = isLast ? `${exName} — سيت ${i} (الأخير)` : `${exName} — سيت ${i}`;
    const info = i===1
      ? `${repsRange} تكرار · ${startWeight} كجم`
      : `${repsRange} تكرار`;
    steps.push({ type:'solo-set', name:setLabel, info });
    if(!isLast){
      steps.push({ type:'rest', name:`راحة ${restSec} ثانية`, info: isCompound?'تنفّس بعمق':'—' });
    }
  }
  return {
    type:'solo',
    label,
    name:`${exName} — ${isCompound?'مركّب':'عزل'}`,
    meta:`${sets} sets`,
    steps
  };
}

function _warmupPhase(targetExercise){
  return {
    type:'warmup',
    label:'إحماء',
    name:'قبل البدء',
    steps:[
      { type:'warmup', name:'Skillrow — تجديف', info:'٥ دقائق · سرعة مريحة' },
      { type:'warmup', name:`${targetExercise} — مجموعة تسخين`, info:'١٢ تكرار بنصف وزن العمل' }
    ]
  };
}

function _restDay(dayOfWeek, shortName){
  return {
    id:`rest-${shortName}`,
    dayOfWeek,
    shortName,
    type:'REST',
    isRest:true,
    colorClass:'rest',
    label:'يوم راحة',
    description:'جسمك يبني العضل اليوم — لا تقلل أكلك',
    restNote:{ icon:'🧘', text:'<strong>تفاصيل يوم الراحة:</strong><br>• تمشية خفيفة ٢٠-٣٠ دقيقة<br>• تمدد ١٠-١٥ دقيقة<br>• <b>كل وجباتك كاملة</b> — العضل يُبنى في الراحة' }
  };
}

// ============ Full Body 3-Day (مبتدئ) ============
// ٣ أيام (سبت/ثلاثاء/خميس مثلاً) + ٤ راحة
// تركيز: تعلّم الحركة + تكرار التحفيز ٣ مرات لكل عضلة
const FULL_BODY_3DAY = {
  meta:{
    id:'full-body-3day',
    name:'Full Body — ٣ أيام',
    nameEn:'Full Body 3-Day',
    description:'مثالي للمبتدئ · كل عضلة ٣×/أسبوع · بدون APS · تركيز على الحركة الصحيحة',
    targetExperience:['beginner'],
    targetGoals:['bulk','maintain','recomp'],
    daysPerWeek:3,
    focus:'foundation',
    weeks:12,
    estMinutes:55,
    recommended:false
  },
  days:[
    // الأحد — Full Body A (Push focus)
    {
      id:'fb-a',
      dayOfWeek:0,
      shortName:'أحد',
      type:'FULL BODY A',
      tagLabel:'FB-A',
      tagClass:'tp',
      colorClass:'push',
      label:'Full Body A — تركيز دفع',
      description:'٢١ سيت · ~٥٥ دقيقة · ٧ تمارين',
      stats:{ sets:21, exercises:7, pairs:0, minutes:'~55', pairsLabel:'مركّبة' },
      dayIntro:{ icon:'💪', text:'<strong>هدف اليوم:</strong> تعلّم الحركات الأساسية في ضغط الصدر والأرجل. الأوزان خفيفة عمداً في الأسبوع الأول — ركّز على الأسلوب.' },
      finishTip:'<strong>انتهيت من Full Body A</strong> · ٢ يوم راحة قادم ثم Full Body B.',
      phases:[
        _warmupPhase('Chest Press'),
        _ssPhase('A', 'Chest Press',     3, '٨-١٠',  10, 90, true),
        _ssPhase('B', 'Lat Machine',     3, '٨-١٠',  15, 90, true),
        _ssPhase('C', 'Leg Press',       3, '١٠-١٢', 50, 90, true),
        _ssPhase('D', 'Shoulder Press',  3, '٨-١٢',  10, 75, false),
        _ssPhase('E', 'Arm Curl',        3, '١٠-١٢', 10, 60, false),
        _ssPhase('F', 'Arm Extension',   3, '١٠-١٢', 20, 60, false),
        {
          type:'solo',
          label:'G',
          name:'Abdominal Crunch — بطن',
          meta:'3 sets',
          steps:[
            { type:'solo-set', name:'Abdominal Crunch — سيت ١', info:'١٥ تكرار · ١٥ كجم' },
            { type:'rest', name:'راحة ٤٥ ثانية', info:'—' },
            { type:'solo-set', name:'Abdominal Crunch — سيت ٢', info:'١٥ تكرار' },
            { type:'rest', name:'راحة ٤٥ ثانية', info:'—' },
            { type:'solo-set', name:'Abdominal Crunch — سيت ٣ (الأخير)', info:'١٥ تكرار · ✓ انتهيت! 🎉', last:true }
          ]
        }
      ]
    },
    _restDay(1,'اثن'),
    // الثلاثاء — Full Body B (Pull focus)
    {
      id:'fb-b',
      dayOfWeek:2,
      shortName:'ثلا',
      type:'FULL BODY B',
      tagLabel:'FB-B',
      tagClass:'tpl',
      colorClass:'pull',
      label:'Full Body B — تركيز سحب',
      description:'٢١ سيت · ~٥٥ دقيقة · تنويع التمارين',
      stats:{ sets:21, exercises:7, pairs:0, minutes:'~55', pairsLabel:'مركّبة' },
      dayIntro:{ icon:'🦅', text:'<strong>هدف اليوم:</strong> نفس عضلات الأمس بزوايا مختلفة. هذا التنويع يحفّز نمواً متوازناً.' },
      finishTip:'<strong>انتهيت من Full Body B</strong> · ١ يوم راحة ثم Full Body C.',
      phases:[
        _warmupPhase('Low Row'),
        _ssPhase('A', 'Low Row',         3, '١٠-١٢', 15, 90, true),
        _ssPhase('B', 'Pectoral Fly',    3, '١٠-١٢', 10, 75, false),
        _ssPhase('C', 'Leg Extension',   3, '١٢-١٥', 15, 60, false),
        _ssPhase('D', 'Prone Leg Curl',  3, '١٢-١٥', 10, 60, false),
        _ssPhase('E', 'Delts Machine',   3, '١٢-١٥',  5, 60, false),
        _ssPhase('F', 'Reverse Fly',     3, '١٢-١٥',  5, 60, false),
        {
          type:'solo',
          label:'G',
          name:'Lower Back — أسفل الظهر',
          meta:'3 sets',
          steps:[
            { type:'solo-set', name:'Lower Back — سيت ١', info:'١٢ تكرار · ١٥ كجم' },
            { type:'rest', name:'راحة ٦٠ ثانية', info:'—' },
            { type:'solo-set', name:'Lower Back — سيت ٢', info:'١٢ تكرار' },
            { type:'rest', name:'راحة ٦٠ ثانية', info:'—' },
            { type:'solo-set', name:'Lower Back — سيت ٣ (الأخير)', info:'١٢ تكرار · ✓ انتهيت! 🎉', last:true }
          ]
        }
      ]
    },
    _restDay(3,'أرب'),
    // الخميس — Full Body C (Mixed)
    {
      id:'fb-c',
      dayOfWeek:4,
      shortName:'خمي',
      type:'FULL BODY C',
      tagLabel:'FB-C',
      tagClass:'tp',
      colorClass:'push',
      label:'Full Body C — مكثّف',
      description:'٢٤ سيت · ~٦٠ دقيقة · يوم القمة',
      stats:{ sets:24, exercises:8, pairs:0, minutes:'~60', pairsLabel:'مركّبة' },
      dayIntro:{ icon:'🔥', text:'<strong>هدف اليوم:</strong> آخر يوم في الأسبوع — اعطه كل طاقتك. ٢ يوم راحة كاملة بعده.' },
      finishTip:'<strong>انتهيت من Full Body C = انتهيت الأسبوع!</strong> · ٢ يوم راحة قادم — تعافى وتغذّى جيداً.',
      phases:[
        _warmupPhase('Chest Press'),
        _ssPhase('A', 'Chest Press',     3, '٨-١٠',  10, 90, true),
        _ssPhase('B', 'Lat Machine',     3, '٨-١٠',  15, 90, true),
        _ssPhase('C', 'Leg Press',       3, '١٠-١٢', 50, 90, true),
        _ssPhase('D', 'Shoulder Press',  3, '١٠-١٢', 10, 75, false),
        _ssPhase('E', 'Vertical Traction', 3, '١٠-١٢', 15, 75, false),
        _ssPhase('F', 'Pulley',          3, '١٢-١٥', 10, 60, false),
        _ssPhase('G', 'Calf Raise',      3, '١٢-١٥', 50, 45, false),
        {
          type:'solo',
          label:'H',
          name:'Hanging Leg Raise — بطن',
          meta:'3 sets',
          steps:[
            { type:'solo-set', name:'Hanging Leg Raise — سيت ١', info:'١٠ تكرار' },
            { type:'rest', name:'راحة ٤٥ ثانية', info:'—' },
            { type:'solo-set', name:'Hanging Leg Raise — سيت ٢', info:'١٠ تكرار' },
            { type:'rest', name:'راحة ٤٥ ثانية', info:'—' },
            { type:'solo-set', name:'Hanging Leg Raise — سيت ٣ (الأخير)', info:'١٠ تكرار · ✓ انتهيت الأسبوع! 🎉', last:true }
          ]
        }
      ]
    },
    _restDay(5,'جمع'),
    _restDay(6,'سبت')
  ]
};

// ============ Upper/Lower 4-Day (متوسط) ============
// السبت/الإثنين/الأربعاء/الجمعة = تمرين، الباقي راحة
const UPPER_LOWER_4DAY = {
  meta:{
    id:'upper-lower-4day',
    name:'Upper / Lower — ٤ أيام',
    nameEn:'Upper / Lower 4-Day',
    description:'الأنسب للمتوسط · ٢ علوي + ٢ سفلي/أسبوع · توازن مثالي بين التحفيز والتعافي',
    targetExperience:['intermediate'],
    targetGoals:['bulk','recomp','strength'],
    daysPerWeek:4,
    focus:'balanced',
    weeks:12,
    estMinutes:60,
    recommended:true
  },
  days:[
    // الأحد — Upper A
    {
      id:'ul-upper-a',
      dayOfWeek:0,
      shortName:'أحد',
      type:'UPPER A',
      tagLabel:'UPPER',
      tagClass:'tp',
      colorClass:'push',
      label:'UPPER A — جذع علوي ثقيل',
      description:'٢٤ سيت · ~٦٠ دقيقة · صدر/ظهر/أكتاف',
      stats:{ sets:24, exercises:6, pairs:0, minutes:'~60', pairsLabel:'مركّبة' },
      finishTip:'<strong>انتهيت من Upper A</strong> · غداً Lower A. الـ Upper التالي يوم الأربعاء.',
      phases:[
        _warmupPhase('Chest Press'),
        _ssPhase('A', 'Chest Press',      4, '٦-٨',   15, 120, true),
        _ssPhase('B', 'Lat Machine',      4, '٦-٨',   20, 120, true),
        _ssPhase('C', 'Shoulder Press',   4, '٨-١٠',  12,  90, true),
        _ssPhase('D', 'Low Row',          3, '٨-١٠',  20,  75, false),
        _ssPhase('E', 'Pectoral Fly',     3, '١٠-١٢', 12,  60, false),
        _ssPhase('F', 'Reverse Fly',      3, '١٢-١٥',  7,  60, false)
      ]
    },
    // الإثنين — Lower A
    {
      id:'ul-lower-a',
      dayOfWeek:1,
      shortName:'اثن',
      type:'LOWER A',
      tagLabel:'LOWER',
      tagClass:'tl',
      colorClass:'legs',
      label:'LOWER A — أرجل ثقيل',
      description:'٢٠ سيت · ~٥٥ دقيقة · فخذ أمامي/خلفي/بطن',
      stats:{ sets:20, exercises:6, pairs:0, minutes:'~55', pairsLabel:'مركّبة' },
      finishTip:'<strong>انتهيت من Lower A</strong> · يومين راحة قادم.',
      phases:[
        _warmupPhase('Leg Press'),
        _ssPhase('A', 'Leg Press',        4, '٨-١٠',  60, 120, true),
        _ssPhase('B', 'Leg Extension',    3, '١٠-١٢', 20,  75, false),
        _ssPhase('C', 'Prone Leg Curl',   3, '١٠-١٢', 15,  75, false),
        _ssPhase('D', 'Calf Raise',       3, '١٢-١٥', 60,  45, false),
        _ssPhase('E', 'Lower Back',       3, '١٢-١٥', 20,  60, false),
        _ssPhase('F', 'Abdominal Crunch', 4, '١٢-١٥', 15,  45, false)
      ]
    },
    _restDay(2,'ثلا'),
    // الأربعاء — Upper B
    {
      id:'ul-upper-b',
      dayOfWeek:3,
      shortName:'أرب',
      type:'UPPER B',
      tagLabel:'UPPER',
      tagClass:'tp',
      colorClass:'push',
      label:'UPPER B — تنويع جذع علوي',
      description:'٢٤ سيت · ~٦٠ دقيقة · أوزان أعلى/تكرارات أقل',
      stats:{ sets:24, exercises:7, pairs:0, minutes:'~60', pairsLabel:'مركّبة' },
      finishTip:'<strong>انتهيت من Upper B</strong> · غداً Lower B لإنهاء الأسبوع.',
      phases:[
        _warmupPhase('Vertical Traction'),
        _ssPhase('A', 'Vertical Traction', 4, '٨-١٠',  20, 90, true),
        _ssPhase('B', 'Pectoral Fly',     3, '١٠-١٢', 12, 75, false),
        _ssPhase('C', 'Delts Machine',    3, '١٢-١٥',  7, 60, false),
        _ssPhase('D', 'Upper Back',       3, '١٠-١٢', 15, 60, false),
        _ssPhase('E', 'Arm Curl',         3, '١٢-١٥', 12, 60, false),
        _ssPhase('F', 'Arm Extension',    3, '١٢-١٥', 22, 60, false),
        _ssPhase('G', 'Rotary Torso',     3, '١٢/جانب', 12, 45, false)
      ]
    },
    // الخميس — Lower B
    {
      id:'ul-lower-b',
      dayOfWeek:4,
      shortName:'خمي',
      type:'LOWER B',
      tagLabel:'LOWER',
      tagClass:'tl',
      colorClass:'legs',
      label:'LOWER B — تنويع أرجل',
      description:'٢٠ سيت · ~٥٥ دقيقة · تركيز عزل',
      stats:{ sets:20, exercises:6, pairs:0, minutes:'~55', pairsLabel:'مركّبة' },
      finishTip:'<strong>انتهيت من Lower B = انتهيت الأسبوع!</strong> · ٢ يوم راحة قادم.',
      phases:[
        _warmupPhase('Leg Extension'),
        _ssPhase('A', 'Leg Extension',    4, '١٠-١٢', 22,  75, false),
        _ssPhase('B', 'Prone Leg Curl',   4, '١٠-١٢', 17,  75, false),
        _ssPhase('C', 'Leg Press',        3, '١٢-١٥', 50,  90, true),
        _ssPhase('D', 'Abductor',         3, '١٢-١٥', 20,  60, false),
        _ssPhase('E', 'Adductor',         3, '١٢-١٥', 20,  60, false),
        _ssPhase('F', 'Hanging Leg Raise',3, '١٠-١٢',  0,  60, false)
      ]
    },
    _restDay(5,'جمع'),
    _restDay(6,'سبت')
  ]
};

// ============ Registry ============
// نلفّ PROGRAM_DATA الأصلي كـ template أيضاً (للـ backward-compat الكامل)
const PROGRAM_TEMPLATES = {};
function _registerTemplates(){
  // upper-priority = البرنامج الأصلي (PROGRAM_DATA)
  if(typeof PROGRAM_DATA !== 'undefined' && PROGRAM_DATA && PROGRAM_DATA.days){
    PROGRAM_TEMPLATES['upper-priority'] = {
      meta:{
        id:'upper-priority',
        name:'Upper Priority — ٦ أيام',
        nameEn:'Upper Priority 6-Day',
        description:'تركيز كثيف على الجذع العلوي · APS · مصمم لذروة الجيم · الأكثر تقدماً',
        targetExperience:['intermediate','advanced'],
        targetGoals:['bulk'],
        daysPerWeek:6,
        focus:'upper-aps',
        weeks:12,
        estMinutes:55,
        recommended:false,
        ...(PROGRAM_DATA.meta||{})
      },
      days:PROGRAM_DATA.days
    };
  }
  PROGRAM_TEMPLATES['full-body-3day']    = FULL_BODY_3DAY;
  PROGRAM_TEMPLATES['upper-lower-4day']  = UPPER_LOWER_4DAY;
}
_registerTemplates();

// ============ Public API ============
const DEFAULT_PROGRAM_ID = 'upper-priority';

// يقترح برنامجاً مناسباً من بيانات profile/onboarding
function recommendProgram(profile){
  const p = profile||{};
  const exp = p.experience || 'beginner';
  const days = Number(p.daysPerWeek||0);
  const goal = p.goal || 'bulk';

  // قواعد بسيطة وقابلة للقراءة:
  if(exp==='beginner') return 'full-body-3day';
  if(days && days<=3) return 'full-body-3day';
  if(days && days<=4) return 'upper-lower-4day';
  if(exp==='intermediate' && !days) return 'upper-lower-4day';
  if(goal==='strength') return 'upper-lower-4day';
  return 'upper-priority'; // متقدم/٥-٦ أيام/تضخيم
}

async function getActiveProgramId(){
  try{
    const rec = await db.get('settings', KEYS.ACTIVE_PROGRAM_ID);
    const id = rec && rec.value;
    if(id && PROGRAM_TEMPLATES[id]) return id;
  }catch(e){}
  return DEFAULT_PROGRAM_ID;
}

async function getActiveProgram(){
  const id = await getActiveProgramId();
  return PROGRAM_TEMPLATES[id] || PROGRAM_TEMPLATES[DEFAULT_PROGRAM_ID];
}

async function setActiveProgram(id){
  if(!PROGRAM_TEMPLATES[id]) throw new Error('Unknown program: '+id);
  await db.put('settings', { key:KEYS.ACTIVE_PROGRAM_ID, value:id, at:new Date().toISOString() });
  // V9.7 (#14) — سجّل بدء البرنامج لو ما كان مسجلاً (يضمن "الأسبوع 1 من 12" يبدأ من اليوم)
  if(typeof recordProgramStart==='function'){
    try{await recordProgramStart(id)}catch(e){}
  }
  // أعِد بناء البرنامج فوراً
  if(typeof renderProgram==='function'){
    await renderProgram();
    if(typeof ensureStepIds==='function') ensureStepIds();
    if(typeof normalizeDataDigits==='function') normalizeDataDigits();
    if(typeof injectSessionControls==='function') injectSessionControls();
    if(typeof injectTrackingInputs==='function') await injectTrackingInputs();
    if(typeof injectAltButtons==='function') injectAltButtons();
    if(typeof injectSkipButtons==='function') injectSkipButtons();
    if(typeof injectFormNoteButtons==='function') injectFormNoteButtons();
    if(typeof injectEditorButtons==='function') injectEditorButtons();
    if(typeof injectHistoryButtons==='function') injectHistoryButtons();
    if(typeof syncPlanBTexts==='function') syncPlanBTexts();
    if(typeof highlightToday==='function') highlightToday();
    if(typeof refreshDashboard==='function') refreshDashboard();
    // V9.7 (#10) — أعد فحص توافق الجيم مع البرنامج الجديد
    try{sessionStorage.removeItem('gymMismatchDismissed')}catch(e){}
    if(typeof updateGymMismatchBanner==='function') setTimeout(updateGymMismatchBanner, 600);
  }
}

function listPrograms(){
  return Object.values(PROGRAM_TEMPLATES).map(t=>({
    id: t.meta.id,
    name: t.meta.name,
    description: t.meta.description,
    daysPerWeek: t.meta.daysPerWeek,
    experience: t.meta.targetExperience||[],
    goals: t.meta.targetGoals||[],
    estMinutes: t.meta.estMinutes,
    focus: t.meta.focus
  }));
}

// expose
window.PROGRAM_TEMPLATES = PROGRAM_TEMPLATES;
window.recommendProgram = recommendProgram;
window.getActiveProgramId = getActiveProgramId;
window.getActiveProgram = getActiveProgram;
window.setActiveProgram = setActiveProgram;
window.listPrograms = listPrograms;
window.DEFAULT_PROGRAM_ID = DEFAULT_PROGRAM_ID;
