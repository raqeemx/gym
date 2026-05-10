/* ============================================
   BULK MODE — بيانات البرنامج الأسبوعي
   كل يوم يحتوي على تمارين كاملة بمعلومات السيت والراحة
   ============================================ */

const PROGRAM = {
  meta: {
    name: 'BULK MODE',
    subtitle: 'برنامج التضخيم النهائي',
    cycle: 'أسبوعي — 6 أيام تمرين + يوم راحة'
  },
  days: [
    {
      id: 'push-a',
      key: 'push',
      label: 'الأحد',
      shortLabel: 'أحد',
      title: 'يوم الدفع A',
      muscles: 'صدر + أكتاف + ترايسبس',
      tag: 'دفع',
      type: 'push',
      desc: 'نبدأ بالأثقل وننزل بالتدريج',
      duration: '55-60 دقيقة',
      exercises: [
        { id:'pa1', name:'Chest Press', note:'أهم تمرين صدر — نبدأ فيه وأنت بكامل قوتك', sets:4, reps:'8-10', rest:90 },
        { id:'pa2', name:'Shoulder Press', note:'ضغط أكتاف — ثاني أثقل تمرين', sets:4, reps:'8-10', rest:90 },
        { id:'pa3', name:'Pectoral Fly', note:'عزل صدر — تفتيح وتقفيل بدون ترايسبس', sets:3, reps:'10-12', rest:75 },
        { id:'pa4', name:'Delts Machine', note:'عزل الكتف الجانبي — هذا اللي يعرّض الأكتاف', sets:3, reps:'12-15', rest:60 },
        { id:'pa5', name:'Arm Extension', note:'عزل ترايسبس — آخر عضلة لأنها أصغرهم', sets:3, reps:'10-12', rest:60 },
        { id:'pa6', name:'Abdominal Crunch', note:'بطن — دايماً في النهاية', sets:3, reps:'15-20', rest:45 }
      ]
    },
    {
      id: 'pull-a',
      key: 'pull',
      label: 'الاثنين',
      shortLabel: 'اثن',
      title: 'يوم السحب A',
      muscles: 'ظهر + بايسبس',
      tag: 'سحب',
      type: 'pull',
      desc: 'نبدّل بين سحب عمودي وأفقي',
      duration: '50-55 دقيقة',
      exercises: [
        { id:'la1', name:'Lat Machine', note:'سحب من فوق لتحت — يعرّض الظهر', sets:4, reps:'8-10', rest:90 },
        { id:'la2', name:'Low Row', note:'سحب أفقي — يكثّف وسط الظهر', sets:4, reps:'8-10', rest:90 },
        { id:'la3', name:'Upper Back', note:'أعلى الظهر — يحسّن الوقفة', sets:2, reps:'10-12', rest:75 },
        { id:'la4', name:'Reverse Fly', note:'خلف الكتف — مهم لتوازن شكل الكتف', sets:3, reps:'12-15', rest:60 },
        { id:'la5', name:'Arm Curl', note:'بايسبس — آخر شيء لأنه أصغر عضلة', sets:3, reps:'10-12', rest:60 }
      ]
    },
    {
      id: 'legs-a',
      key: 'legs',
      label: 'الثلاثاء',
      shortLabel: 'ثلا',
      title: 'يوم الأرجل A',
      muscles: 'فخذ + سمانة + بطن',
      tag: 'أرجل',
      type: 'legs',
      desc: 'نبدّل بين أمامي وخلفي',
      duration: '60-65 دقيقة',
      exercises: [
        { id:'gA1', name:'Leg Press', note:'أثقل تمرين أرجل — يشتغل فيه كل شيء', sets:4, reps:'8-10', rest:120 },
        { id:'gA2', name:'Prone Leg Curl', note:'فخذ خلفي — نروح له عشان الأمامي يرتاح', sets:4, reps:'10-12', rest:75 },
        { id:'gA3', name:'Leg Extension', note:'فخذ أمامي — رجعنا له بعد ما ارتاح', sets:3, reps:'10-12', rest:60 },
        { id:'gA4', name:'Abductor', note:'فتح الأرجل — عضلات الورك الخارجية', sets:3, reps:'12-15', rest:60 },
        { id:'gA5', name:'Adductor', note:'ضم الأرجل — عضلات الفخذ الداخلية', sets:3, reps:'12-15', rest:60 },
        { id:'gA6', name:'Lower Back', note:'أسفل الظهر — يحمي الظهر ويقوّيه', sets:3, reps:'12-15', rest:60 },
        { id:'gA7', name:'Calf Raise', note:'سمانة — على Leg Press بأصابع القدم', sets:4, reps:'15-20', rest:45 },
        { id:'gA8', name:'Hanging Leg Raise', note:'بطن سفلي — تعلّق وارفع ركبك', sets:3, reps:'10-15', rest:45 }
      ]
    },
    {
      id: 'rest-1',
      key: 'rest',
      label: 'الأربعاء',
      shortLabel: 'أرب',
      title: 'يوم راحة',
      muscles: 'تعافي وبناء',
      tag: 'راحة',
      type: 'rest',
      desc: 'جسمك يبني العضل اليوم مو في الجيم',
      duration: '—',
      exercises: []
    },
    {
      id: 'push-b',
      key: 'push',
      label: 'الخميس',
      shortLabel: 'خمي',
      title: 'يوم الدفع B',
      muscles: 'صدر + أكتاف + ترايسبس',
      tag: 'دفع',
      type: 'push',
      desc: 'هالمرة نركّز على البطء والتحكم',
      duration: '55-60 دقيقة',
      exercises: [
        { id:'pb1', name:'Dips', note:'على جهاز Kneeling Easy Chin Dip — أقوى تمرين دفع', sets:3, reps:'8-12', rest:90 },
        { id:'pb2', name:'Shoulder Press — ثقيل', note:'بدأنا بالأكتاف هالمرة بدل الصدر', sets:4, reps:'6-8', rest:120 },
        { id:'pb3', name:'Chest Press — بطيء', note:'انزل ببطء عد 3 ثواني، ارفع عادي', sets:3, reps:'12-15', rest:75 },
        { id:'pb4', name:'Pectoral Fly — فتح واسع', note:'افتح صدرك لأقصى حد وارجع ببطء', sets:3, reps:'12-15', rest:60 },
        { id:'pb5', name:'Delts Machine', note:'كتف جانبي — نفس اللي في يوم A', sets:3, reps:'12-15', rest:60 },
        { id:'pb6', name:'Arm Extension — بطيء', note:'ترايسبس — انزل ببطء عد 4 ثواني', sets:3, reps:'10-12', rest:60 },
        { id:'pb7', name:'Rotary Torso', note:'خصر — لف يمين ويسار', sets:3, reps:'12/جانب', rest:45 }
      ]
    },
    {
      id: 'pull-b',
      key: 'pull',
      label: 'الجمعة',
      shortLabel: 'جمع',
      title: 'يوم السحب B',
      muscles: 'ظهر + بايسبس',
      tag: 'سحب',
      type: 'pull',
      desc: 'نبدأ بتمرين وزن الجسم',
      duration: '50-55 دقيقة',
      exercises: [
        { id:'lb1', name:'Chin Ups', note:'على جهاز Kneeling Easy Chin Dip — أقوى تمرين ظهر', sets:3, reps:'8-12', rest:90 },
        { id:'lb2', name:'Pulley — سحب أفقي', note:'وسط الظهر بعد العقلة العمودية', sets:4, reps:'10-12', rest:75 },
        { id:'lb3', name:'Vertical Traction', note:'ظهر عريض — رجعنا للسحب من فوق', sets:3, reps:'10-12', rest:75 },
        { id:'lb4', name:'Reverse Fly', note:'خلف الكتف — توازن شكل الكتف', sets:3, reps:'12-15', rest:60 },
        { id:'lb5', name:'Arm Curl', note:'بايسبس — عزل مقدمة الذراع', sets:3, reps:'10-12', rest:60 },
        { id:'lb6', name:'Abdominal Crunch', note:'بطن', sets:3, reps:'15-20', rest:45 }
      ]
    },
    {
      id: 'legs-b',
      key: 'legs',
      label: 'السبت',
      shortLabel: 'سبت',
      title: 'يوم الأرجل B',
      muscles: 'تكرار أعلى + خصر',
      tag: 'أرجل',
      type: 'legs',
      desc: 'نفس العضلات بتكرارات أكثر ووزن أخف',
      duration: '60-65 دقيقة',
      exercises: [
        { id:'gB1', name:'Leg Press — خفيف وكثير', note:'وزن أخف من يوم A لكن تكرارات أكثر', sets:4, reps:'12-15', rest:90 },
        { id:'gB2', name:'Prone Leg Curl — بطيء', note:'فخذ خلفي — انزل ببطء عد 3 ثواني', sets:4, reps:'12-15', rest:60 },
        { id:'gB3', name:'Leg Extension — بطيء', note:'فخذ أمامي — انزل ببطء عد 3 ثواني', sets:3, reps:'15', rest:60 },
        { id:'gB4', name:'Adductor', note:'ضم الأرجل', sets:3, reps:'15', rest:45 },
        { id:'gB5', name:'Abductor', note:'فتح الأرجل', sets:3, reps:'15', rest:45 },
        { id:'gB6', name:'Lower Back', note:'أسفل الظهر', sets:3, reps:'15', rest:60 },
        { id:'gB7', name:'Calf Raise', note:'سمانة — تكرار عالي', sets:4, reps:'20', rest:30 },
        { id:'gB8', name:'Rotary Torso', note:'خصر — لف يمين ويسار', sets:3, reps:'12/جانب', rest:45 }
      ]
    }
  ]
};

// بيانات وصفية إضافية للتمارين (عضلة أساسية + معدّات + نوع حركة)
// id => { primaryMuscle, equipment, isCompound }
const EXERCISE_META = {
  pa1:  { primaryMuscle: 'صدر', equipment: 'machine',    isCompound: true  },
  pa2:  { primaryMuscle: 'أكتاف', equipment: 'machine',  isCompound: true  },
  pa3:  { primaryMuscle: 'صدر', equipment: 'machine',    isCompound: false },
  pa4:  { primaryMuscle: 'أكتاف', equipment: 'machine',  isCompound: false },
  pa5:  { primaryMuscle: 'ترايسبس', equipment: 'machine',isCompound: false },
  pa6:  { primaryMuscle: 'بطن', equipment: 'machine',    isCompound: false },
  la1:  { primaryMuscle: 'ظهر', equipment: 'cable',      isCompound: true  },
  la2:  { primaryMuscle: 'ظهر', equipment: 'cable',      isCompound: true  },
  la3:  { primaryMuscle: 'ظهر', equipment: 'machine',    isCompound: false },
  la4:  { primaryMuscle: 'أكتاف خلفية', equipment: 'machine', isCompound: false },
  la5:  { primaryMuscle: 'بايسبس', equipment: 'machine', isCompound: false },
  gA1:  { primaryMuscle: 'فخذ', equipment: 'machine',    isCompound: true  },
  gA2:  { primaryMuscle: 'فخذ خلفي', equipment: 'machine', isCompound: false },
  gA3:  { primaryMuscle: 'فخذ أمامي', equipment: 'machine', isCompound: false },
  gA4:  { primaryMuscle: 'ورك', equipment: 'machine',    isCompound: false },
  gA5:  { primaryMuscle: 'فخذ داخلي', equipment: 'machine', isCompound: false },
  gA6:  { primaryMuscle: 'أسفل الظهر', equipment: 'machine', isCompound: false },
  gA7:  { primaryMuscle: 'سمانة', equipment: 'machine',  isCompound: false },
  gA8:  { primaryMuscle: 'بطن', equipment: 'bodyweight', isCompound: false },
  pb1:  { primaryMuscle: 'صدر', equipment: 'bodyweight', isCompound: true  },
  pb2:  { primaryMuscle: 'أكتاف', equipment: 'machine',  isCompound: true  },
  pb3:  { primaryMuscle: 'صدر', equipment: 'machine',    isCompound: true  },
  pb4:  { primaryMuscle: 'صدر', equipment: 'machine',    isCompound: false },
  pb5:  { primaryMuscle: 'أكتاف', equipment: 'machine',  isCompound: false },
  pb6:  { primaryMuscle: 'ترايسبس', equipment: 'machine',isCompound: false },
  pb7:  { primaryMuscle: 'خصر', equipment: 'machine',    isCompound: false },
  lb1:  { primaryMuscle: 'ظهر', equipment: 'bodyweight', isCompound: true  },
  lb2:  { primaryMuscle: 'ظهر', equipment: 'cable',      isCompound: true  },
  lb3:  { primaryMuscle: 'ظهر', equipment: 'machine',    isCompound: true  },
  lb4:  { primaryMuscle: 'أكتاف خلفية', equipment: 'machine', isCompound: false },
  lb5:  { primaryMuscle: 'بايسبس', equipment: 'machine', isCompound: false },
  lb6:  { primaryMuscle: 'بطن', equipment: 'machine',    isCompound: false },
  gB1:  { primaryMuscle: 'فخذ', equipment: 'machine',    isCompound: true  },
  gB2:  { primaryMuscle: 'فخذ خلفي', equipment: 'machine', isCompound: false },
  gB3:  { primaryMuscle: 'فخذ أمامي', equipment: 'machine', isCompound: false },
  gB4:  { primaryMuscle: 'فخذ داخلي', equipment: 'machine', isCompound: false },
  gB5:  { primaryMuscle: 'ورك', equipment: 'machine',    isCompound: false },
  gB6:  { primaryMuscle: 'أسفل الظهر', equipment: 'machine', isCompound: false },
  gB7:  { primaryMuscle: 'سمانة', equipment: 'machine',  isCompound: false },
  gB8:  { primaryMuscle: 'خصر', equipment: 'machine',    isCompound: false }
};

// خريطة سريعة للوصول لأي يوم بالـ id
const DAY_BY_ID = Object.fromEntries(PROGRAM.days.map(d => [d.id, d]));

// خريطة لكل التمارين (لجلب اسم تمرين من id بسرعة)
const EXERCISE_BY_ID = {};
PROGRAM.days.forEach(d => d.exercises.forEach(ex => {
  EXERCISE_BY_ID[ex.id] = { ...ex, dayId: d.id, dayTitle: d.title, ...(EXERCISE_META[ex.id] || {}) };
}));

// أيام الأسبوع المرتبة (الأحد = 0 في تقويمنا الأسبوعي)
const WEEKDAY_NAMES = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

// ربط رقم اليوم في JS Date (0=Sun) باليوم في برنامجنا
function getTodayProgramDay() {
  const dow = new Date().getDay(); // 0=Sun ... 6=Sat
  return PROGRAM.days[dow]; // ترتيبهم متطابق
}
