// ============ EXERCISE ALTERNATIVES (V6) ============
// كتالوج البدائل لكل تمرين — مرتّب من الأفضل للأسوأ بناءً على تطابق العضلة وتوفر الجهاز.
// peakFriendly: true = جهاز عادةً أقل ازدحاماً في وقت الذروة (٦-٩م)
const EXERCISE_ALTERNATIVES = {
  // ========== الصدر ==========
  "Chest Press":[
    {name:"Pectoral Fly",reason:"نفس العضلة بحركة عزل — يركّز على الصدر بدون تدخل الترايسبس",muscleMatch:85,equipment:"Pectoral Fly Machine"},
    {name:"Crossover Cables",reason:"صدر بالكابل مع تمدد أعمق — تحفيز ممتاز للألياف",muscleMatch:80,equipment:"Cable Crossover",peakFriendly:true},
    {name:"Dips (Kneeling Easy)",reason:"حركة دفع مركّبة بديلة — تحفّز الصدر السفلي والترايسبس",muscleMatch:75,equipment:"Kneeling Easy Chin Dip"},
    {name:"Push-ups على الأرض",reason:"حركة دفع بوزن الجسم — لا يحتاج جهاز",muscleMatch:70,equipment:"بدون جهاز",peakFriendly:true}
  ],
  "Pectoral Fly":[
    {name:"Crossover Cables",reason:"نفس النمط (عزل صدر) بكابل — تمدد أفضل في القمة",muscleMatch:95,equipment:"Cable Crossover",peakFriendly:true},
    {name:"Chest Press",reason:"مركّب يستهدف الصدر — بديل لو معدوم العزل",muscleMatch:75,equipment:"Chest Press"},
    {name:"Push-ups واسع",reason:"وزن الجسم بقبضة واسعة — يقترب من نمط الـ Fly",muscleMatch:65,equipment:"بدون جهاز",peakFriendly:true}
  ],
  "Crossover Cables":[
    {name:"Pectoral Fly",reason:"نفس نمط العزل بجهاز ثابت",muscleMatch:95,equipment:"Pectoral Fly Machine"},
    {name:"Chest Press",reason:"مركّب يستهدف الصدر",muscleMatch:75,equipment:"Chest Press"},
    {name:"Push-ups واسع",reason:"وزن الجسم بقبضة واسعة",muscleMatch:65,equipment:"بدون جهاز",peakFriendly:true}
  ],

  // ========== الظهر ==========
  "Lat Machine":[
    {name:"Vertical Traction",reason:"نفس النمط (سحب عمودي) بمقابض مستقلة لكل يد",muscleMatch:95,equipment:"Vertical Traction"},
    {name:"Chin Ups (بمساعدة)",reason:"سحب عمودي مركّب بوزن الجسم — الذهبية للظهر",muscleMatch:90,equipment:"Kneeling Easy Chin Dip"},
    {name:"Pulley (سحب عمودي)",reason:"سحب عمودي بالكابل بقبضة حرة",muscleMatch:80,equipment:"Pulley",peakFriendly:true},
    {name:"Low Row",reason:"سحب أفقي — استهداف مختلف لكن نفس عضلة الظهر",muscleMatch:60,equipment:"Low Row"}
  ],
  "Vertical Traction":[
    {name:"Lat Machine",reason:"نفس النمط بمقبض واحد متّصل",muscleMatch:95,equipment:"Lat Machine"},
    {name:"Chin Ups (بمساعدة)",reason:"سحب عمودي مركّب بوزن الجسم",muscleMatch:90,equipment:"Kneeling Easy Chin Dip"},
    {name:"Pulley (سحب عمودي)",reason:"سحب عمودي بالكابل",muscleMatch:80,equipment:"Pulley",peakFriendly:true}
  ],
  "Pulley":[
    {name:"Low Row",reason:"سحب أفقي مماثل بمقبض ثابت",muscleMatch:85,equipment:"Low Row"},
    {name:"Lat Machine",reason:"سحب عمودي بدل أفقي — لكن نفس العضلة",muscleMatch:75,equipment:"Lat Machine"},
    {name:"Vertical Traction",reason:"سحب عمودي بمقابض مستقلة",muscleMatch:75,equipment:"Vertical Traction"},
    {name:"Crossover Cables",reason:"كابل لكن للصدر — لو الـPulley محجوز للظهر",muscleMatch:55,equipment:"Cable Crossover",peakFriendly:true}
  ],
  "Low Row":[
    {name:"Pulley (سحب أفقي)",reason:"نفس الحركة بالكابل — قبضة حرة",muscleMatch:90,equipment:"Pulley",peakFriendly:true},
    {name:"Upper Back",reason:"سحب أفقي يستهدف أعلى الظهر",muscleMatch:75,equipment:"Upper Back"},
    {name:"Lat Machine",reason:"سحب عمودي بدل أفقي",muscleMatch:65,equipment:"Lat Machine"},
    {name:"Vertical Traction",reason:"سحب عمودي بمقابض",muscleMatch:60,equipment:"Vertical Traction"}
  ],
  "Upper Back":[
    {name:"Reverse Fly",reason:"نفس المنطقة (أعلى الظهر + الخلفي للكتف)",muscleMatch:85,equipment:"Reverse Fly Machine"},
    {name:"Low Row",reason:"سحب أفقي يحفّز أعلى الظهر",muscleMatch:80,equipment:"Low Row"},
    {name:"Pulley Face Pull",reason:"كابل بقبضة وجه — ممتاز للوضع الصحي للكتف",muscleMatch:90,equipment:"Pulley",peakFriendly:true}
  ],
  "Chin Ups":[
    {name:"Lat Machine",reason:"نفس النمط بمقاومة قابلة للتعديل",muscleMatch:90,equipment:"Lat Machine"},
    {name:"Vertical Traction",reason:"سحب عمودي بمقابض مستقلة",muscleMatch:88,equipment:"Vertical Traction"},
    {name:"Pulley (سحب عمودي)",reason:"بديل كابل",muscleMatch:75,equipment:"Pulley",peakFriendly:true}
  ],

  // ========== الكتف ==========
  "Shoulder Press":[
    {name:"Delts Machine",reason:"عزل كتف جانبي — حركة منفصلة لو الـPress مزدحم",muscleMatch:65,equipment:"Delts Machine"},
    {name:"Dumbbell Shoulder Press",reason:"دفع علوي بدمبل — لو متاح",muscleMatch:92,equipment:"Free weights area"},
    {name:"Arnold Press",reason:"دفع بدوران — يحفّز الأمامي والجانبي معاً",muscleMatch:88,equipment:"Free weights area"},
    {name:"Pulley Lateral Raise",reason:"رفع جانبي بكابل — لو الكتف هو الهدف",muscleMatch:55,equipment:"Pulley",peakFriendly:true}
  ],
  "Delts Machine":[
    {name:"Cable Lateral Raise",reason:"رفع جانبي بكابل — تحفيز ممتاز ومستمر",muscleMatch:92,equipment:"Pulley",peakFriendly:true},
    {name:"Dumbbell Lateral Raise",reason:"رفع جانبي بدمبل — الكلاسيكي للكتف",muscleMatch:90,equipment:"Free weights area"},
    {name:"Shoulder Press",reason:"دفع علوي مركّب — يحفّز الجانبي والأمامي",muscleMatch:70,equipment:"Shoulder Press"},
    {name:"Reverse Fly",reason:"للجزء الخلفي بدل الجانبي",muscleMatch:50,equipment:"Reverse Fly Machine"}
  ],
  "Reverse Fly":[
    {name:"Upper Back",reason:"نفس المنطقة (الكتف الخلفي + أعلى الظهر)",muscleMatch:85,equipment:"Upper Back"},
    {name:"Pulley Face Pull",reason:"كابل بقبضة وجه — ممتاز للكتف الخلفي",muscleMatch:92,equipment:"Pulley",peakFriendly:true},
    {name:"Bent-over Lateral",reason:"رفع جانبي بانحناء — يدوي بدمبل",muscleMatch:80,equipment:"Free weights area"}
  ],

  // ========== الذراعين ==========
  "Arm Curl":[
    {name:"Pulley Curl",reason:"كيرل بايسبس بالكابل — توتر مستمر",muscleMatch:95,equipment:"Pulley",peakFriendly:true},
    {name:"Pulley — Bicep Curl",reason:"نفس البديل بنفس الجهاز",muscleMatch:95,equipment:"Pulley",peakFriendly:true},
    {name:"Dumbbell Curl",reason:"كيرل بدمبل — الكلاسيكي للبايسبس",muscleMatch:92,equipment:"Free weights area"},
    {name:"Chin Ups (بمساعدة)",reason:"سحب مركّب يحفّز البايسبس بقوة",muscleMatch:75,equipment:"Kneeling Easy Chin Dip"},
    {name:"Hammer Curl",reason:"كيرل بقبضة عمودية — يستهدف الـbrachialis",muscleMatch:85,equipment:"Free weights area"}
  ],
  "Arm Extension":[
    {name:"Pulley Pushdown",reason:"ضغط ترايسبس بالكابل — التمرين الذهبي",muscleMatch:95,equipment:"Pulley",peakFriendly:true},
    {name:"Pulley — Tricep Pushdown",reason:"نفس البديل بنفس الجهاز",muscleMatch:95,equipment:"Pulley",peakFriendly:true},
    {name:"Dips (Kneeling Easy)",reason:"غمس مركّب — يحفّز الترايسبس بقوة",muscleMatch:80,equipment:"Kneeling Easy Chin Dip"},
    {name:"Overhead Tricep Extension",reason:"تمديد علوي بدمبل — يستهدف الرأس الطويل",muscleMatch:88,equipment:"Free weights area"},
    {name:"Close-grip Push-ups",reason:"ضغط بقبضة ضيقة — وزن الجسم",muscleMatch:65,equipment:"بدون جهاز",peakFriendly:true}
  ],
  "Pulley Curl":[
    {name:"Arm Curl",reason:"جهاز عزل البايسبس",muscleMatch:95,equipment:"Arm Curl Machine"},
    {name:"Dumbbell Curl",reason:"كيرل بدمبل — الكلاسيكي",muscleMatch:92,equipment:"Free weights area"},
    {name:"Chin Ups (بمساعدة)",reason:"سحب مركّب يحفّز البايسبس",muscleMatch:75,equipment:"Kneeling Easy Chin Dip"}
  ],
  "Pulley Pushdown":[
    {name:"Arm Extension",reason:"جهاز عزل الترايسبس",muscleMatch:95,equipment:"Arm Extension Machine"},
    {name:"Dips (Kneeling Easy)",reason:"غمس مركّب",muscleMatch:80,equipment:"Kneeling Easy Chin Dip"},
    {name:"Overhead Tricep Extension",reason:"تمديد علوي — للرأس الطويل",muscleMatch:88,equipment:"Free weights area"}
  ],
  "Dips":[
    {name:"Chest Press",reason:"دفع مركّب — يحفّز الصدر والترايسبس",muscleMatch:75,equipment:"Chest Press"},
    {name:"Arm Extension",reason:"عزل الترايسبس بجهاز",muscleMatch:70,equipment:"Arm Extension Machine"},
    {name:"Pulley Pushdown",reason:"ضغط ترايسبس بكابل",muscleMatch:75,equipment:"Pulley",peakFriendly:true},
    {name:"Close-grip Push-ups",reason:"ضغط أرض بقبضة ضيقة — وزن الجسم",muscleMatch:65,equipment:"بدون جهاز",peakFriendly:true}
  ],

  // ========== الأرجل ==========
  "Leg Press":[
    {name:"Leg Extension + Prone Leg Curl",reason:"تجزئة المركّب لعزلين متتاليين (سوبر سيت)",muscleMatch:80,equipment:"Leg Extension + Leg Curl"},
    {name:"Hack Squat",reason:"سكوات بزاوية — لو متاح",muscleMatch:92,equipment:"Hack Squat Machine"},
    {name:"Goblet Squat",reason:"سكوات بدمبل ممسوكة بالصدر — مركّبة بسيطة",muscleMatch:78,equipment:"Free weights"},
    {name:"Bulgarian Split Squat",reason:"سكوات بقدم واحدة — تركيز عالٍ بدون أوزان كبيرة",muscleMatch:80,equipment:"Free weights area",peakFriendly:true},
    {name:"Lunges (مشي)",reason:"خطوات أمامية — مركّبة وظيفية",muscleMatch:75,equipment:"بدون جهاز",peakFriendly:true}
  ],
  "Leg Extension":[
    {name:"Leg Press",reason:"مركّب يحفّز الكوادز بقوة",muscleMatch:75,equipment:"Leg Press"},
    {name:"Bulgarian Split Squat",reason:"يستهدف الكوادز بتركيز عالٍ",muscleMatch:78,equipment:"Free weights area",peakFriendly:true},
    {name:"Goblet Squat",reason:"سكوات بدمبل ممسوكة",muscleMatch:70,equipment:"Free weights"},
    {name:"Sissy Squat",reason:"سكوات معكوس — عزل الكوادز",muscleMatch:80,equipment:"بدون جهاز",peakFriendly:true}
  ],
  "Prone Leg Curl":[
    {name:"Seated Leg Curl",reason:"نفس النمط بوضعية الجلوس — لو متاح",muscleMatch:95,equipment:"Seated Leg Curl"},
    {name:"Romanian Deadlift",reason:"رفعة رومانية — مركّب ممتاز للهامسترنغ",muscleMatch:88,equipment:"Free weights area"},
    {name:"Stiff Leg Deadlift",reason:"رفعة بأرجل مستقيمة — هامسترنغ",muscleMatch:85,equipment:"Free weights area"},
    {name:"Glute Bridge / Hip Thrust",reason:"بريدج للأرداف والهامسترنغ",muscleMatch:70,equipment:"Free weights",peakFriendly:true},
    {name:"Nordic Hamstring Curl",reason:"كيرل بوزن الجسم — تحدي قوي",muscleMatch:80,equipment:"بدون جهاز",peakFriendly:true}
  ],
  "Abductor":[
    {name:"Cable Hip Abduction",reason:"فتح الأرجل بكابل — توتر مستمر",muscleMatch:90,equipment:"Pulley",peakFriendly:true},
    {name:"Side-lying Leg Raise",reason:"رفع جانبي على الأرض — وزن الجسم",muscleMatch:65,equipment:"بدون جهاز",peakFriendly:true},
    {name:"Banded Side Steps",reason:"خطوات جانبية بمطاط — ممتاز للأرداف",muscleMatch:75,equipment:"مطاط مقاومة",peakFriendly:true},
    {name:"Clamshells",reason:"تمرين أرض — يستهدف الـglute medius",muscleMatch:70,equipment:"بدون جهاز",peakFriendly:true}
  ],
  "Adductor":[
    {name:"Cable Hip Adduction",reason:"ضم الأرجل بكابل",muscleMatch:90,equipment:"Pulley",peakFriendly:true},
    {name:"Sumo Squat",reason:"سكوات بوقفة واسعة — يحفّز الـadductors",muscleMatch:65,equipment:"Free weights"},
    {name:"Copenhagen Plank",reason:"بلانك جانبي يستهدف الـadductors",muscleMatch:75,equipment:"بدون جهاز",peakFriendly:true},
    {name:"Side Lunge",reason:"خطوة جانبية — مركّبة للـadductors",muscleMatch:70,equipment:"بدون جهاز",peakFriendly:true}
  ],
  "Calf Raise":[
    {name:"Standing Calf Raise",reason:"رفع وقوف — لو الجهاز متاح",muscleMatch:95,equipment:"Standing Calf Machine"},
    {name:"Seated Calf Raise",reason:"رفع جلوس — يحفّز الـsoleus",muscleMatch:90,equipment:"Seated Calf Machine"},
    {name:"Single-leg Standing Calf",reason:"رفع برجل واحدة بوزن الجسم",muscleMatch:75,equipment:"بدون جهاز",peakFriendly:true},
    {name:"Donkey Calf Raise",reason:"رفع بانحناء — تحفيز مختلف",muscleMatch:88,equipment:"بدون جهاز",peakFriendly:true}
  ],

  // ========== أسفل الظهر والخصر ==========
  "Lower Back":[
    {name:"Hyperextension (45°)",reason:"تمديد الظهر — لو الجهاز متاح",muscleMatch:95,equipment:"Hyperextension Bench"},
    {name:"Romanian Deadlift",reason:"رفعة رومانية — تحفّز أسفل الظهر بقوة",muscleMatch:85,equipment:"Free weights area"},
    {name:"Bird Dog",reason:"تمرين أرض — أسفل الظهر والكور",muscleMatch:65,equipment:"بدون جهاز",peakFriendly:true},
    {name:"Glute Bridge",reason:"بريدج — يحفّز الأرداف وأسفل الظهر",muscleMatch:70,equipment:"بدون جهاز",peakFriendly:true},
    {name:"Superman",reason:"رفع علوي وسفلي بالبطن — وزن جسم",muscleMatch:75,equipment:"بدون جهاز",peakFriendly:true}
  ],
  "Rotary Torso":[
    {name:"Cable Wood Chop",reason:"دوران بكابل — وظيفي وممتاز للخصر",muscleMatch:92,equipment:"Pulley",peakFriendly:true},
    {name:"Russian Twist",reason:"دوران جلوس — وزن جسم أو ثقل",muscleMatch:75,equipment:"بدون جهاز",peakFriendly:true},
    {name:"Side Plank with Rotation",reason:"بلانك جانبي مع دوران",muscleMatch:75,equipment:"بدون جهاز",peakFriendly:true},
    {name:"Pallof Press",reason:"مقاومة دوران بكابل — أنتي-روتيشن",muscleMatch:80,equipment:"Pulley",peakFriendly:true}
  ],
  "Abdominal Crunch":[
    {name:"Cable Crunch",reason:"كرنش بكابل — مقاومة قابلة للتعديل",muscleMatch:92,equipment:"Pulley",peakFriendly:true},
    {name:"Hanging Leg Raise",reason:"رفع أرجل معلّق — البطن السفلي",muscleMatch:80,equipment:"Leg Raise Bar"},
    {name:"Plank",reason:"بلانك ثابت — كور كامل",muscleMatch:75,equipment:"بدون جهاز",peakFriendly:true},
    {name:"Crunches على الأرض",reason:"كرنش وزن جسم — الكلاسيكي",muscleMatch:78,equipment:"بدون جهاز",peakFriendly:true},
    {name:"Decline Sit-up",reason:"سيت أب بميل — تشديد للبطن",muscleMatch:80,equipment:"Decline Bench"}
  ],
  "Hanging Leg Raise":[
    {name:"Captain's Chair Leg Raise",reason:"رفع أرجل بكرسي — نفس النمط بثبات أكثر",muscleMatch:95,equipment:"Captain's Chair"},
    {name:"Reverse Crunch",reason:"كرنش معكوس على الأرض — البطن السفلي",muscleMatch:78,equipment:"بدون جهاز",peakFriendly:true},
    {name:"Lying Leg Raise",reason:"رفع أرجل على الأرض",muscleMatch:72,equipment:"بدون جهاز",peakFriendly:true},
    {name:"Abdominal Crunch",reason:"كرنش بجهاز — البطن العلوي",muscleMatch:65,equipment:"Abdominal Crunch Machine"}
  ]
};

// خريطة المجموعات العضلية لكل تمرين (للإحصائيات المتقدمة)
// group: العضلة المستهدفة الرئيسية · region: علوي/سفلي/كور
const MUSCLE_GROUP_MAP = {
  "Chest Press":{group:"صدر",region:"upper"},
  "Pectoral Fly":{group:"صدر",region:"upper"},
  "Crossover Cables":{group:"صدر",region:"upper"},
  "Push-ups":{group:"صدر",region:"upper"},
  "Lat Machine":{group:"ظهر",region:"upper"},
  "Vertical Traction":{group:"ظهر",region:"upper"},
  "Low Row":{group:"ظهر",region:"upper"},
  "Upper Back":{group:"ظهر",region:"upper"},
  "Pulley":{group:"ظهر",region:"upper"},
  "Chin Ups":{group:"ظهر",region:"upper"},
  "Shoulder Press":{group:"أكتاف",region:"upper"},
  "Delts Machine":{group:"أكتاف",region:"upper"},
  "Reverse Fly":{group:"أكتاف",region:"upper"},
  "Arm Curl":{group:"ذراعين",region:"upper"},
  "Pulley Curl":{group:"ذراعين",region:"upper"},
  "Arm Extension":{group:"ذراعين",region:"upper"},
  "Pulley Pushdown":{group:"ذراعين",region:"upper"},
  "Dips":{group:"ذراعين",region:"upper"},
  "Leg Press":{group:"أرجل",region:"lower"},
  "Leg Extension":{group:"أرجل",region:"lower"},
  "Prone Leg Curl":{group:"أرجل",region:"lower"},
  "Abductor":{group:"أرجل",region:"lower"},
  "Adductor":{group:"أرجل",region:"lower"},
  "Calf Raise":{group:"سمانة",region:"lower"},
  "Abdominal Crunch":{group:"بطن/خصر",region:"core"},
  "Rotary Torso":{group:"بطن/خصر",region:"core"},
  "Hanging Leg Raise":{group:"بطن/خصر",region:"core"},
  "Lower Back":{group:"بطن/خصر",region:"core"}
};

// V8.3 (3.11) — مراجع الحجم الأسبوعي بحسب Renaissance Periodization (Mike Israetel)
// MEV = الحد الأدنى الفعّال · MAV = نطاق الحجم المثالي للنمو · MRV = الحد الأقصى للتعافي
// القيم تقريبية للمبتدئ/المتوسط؛ المتقدّم قد يحتاج تعديل + 5-10 سيت/أسبوع
const MUSCLE_VOLUME_REF = {
  "صدر":     {mev:10, mav:[12,18], mrv:22, note:"دفع · 8-12 تكرار"},
  "ظهر":     {mev:10, mav:[14,22], mrv:25, note:"سحب · 8-15 تكرار"},
  "أكتاف":   {mev:8,  mav:[12,20], mrv:22, note:"شامل (جانبي/خلفي) · 10-20 تكرار"},
  "ذراعين":  {mev:8,  mav:[14,20], mrv:24, note:"بايسبس + ترايسبس مجموعاً"},
  "أرجل":    {mev:8,  mav:[12,18], mrv:20, note:"كوادز/هامسترنغز · 6-15 تكرار"},
  "سمانة":   {mev:8,  mav:[12,16], mrv:20, note:"سمانة · 10-20 تكرار"},
  "بطن/خصر": {mev:0,  mav:[6,16],  mrv:25, note:"كور · حسب الحاجة"}
};

// ألوان المجموعات العضلية (لرسم البار)
const MUSCLE_COLORS = {
  "ظهر":"#5AB4FF",        // أزرق — أهم مجموعة في برنامج UPPER PRIORITY
  "صدر":"#FF5A5F",        // أحمر
  "أكتاف":"#FFB85A",      // برتقالي
  "ذراعين":"#B08AFF",     // بنفسجي
  "أرجل":"#5AE68A",       // أخضر
  "سمانة":"#5AE68A",      // أخضر فاتح
  "بطن/خصر":"#8890A0"    // رمادي
};

// يرجّع المجموعة العضلية لاسم تمرين (مع تطبيع وفولباك)
function getMuscleGroup(exName){
  if(!exName) return null;
  const norm=normalizeExName(exName);
  if(MUSCLE_GROUP_MAP[norm]) return MUSCLE_GROUP_MAP[norm];
  // محاولة جزئية (لو الاسم فيه إضافات)
  for(const key of Object.keys(MUSCLE_GROUP_MAP)){
    if(norm.includes(key)) return MUSCLE_GROUP_MAP[key];
  }
  return null;
}

// قائمة كل الأجهزة المتاحة في الجيم (للـ "ما لقيت اللي يناسبك؟")
const ALL_EQUIPMENT = [
  {name:"Chest Press",cat:"صدر"},{name:"Pectoral Fly",cat:"صدر"},
  {name:"Shoulder Press",cat:"أكتاف"},{name:"Delts Machine",cat:"أكتاف جانبية"},
  {name:"Arm Extension",cat:"خلف الذراع"},{name:"Arm Curl",cat:"مقدمة الذراع"},
  {name:"Lat Machine",cat:"ظهر عريض"},{name:"Vertical Traction",cat:"ظهر"},
  {name:"Low Row",cat:"وسط الظهر"},{name:"Pulley",cat:"كابل متعدد"},
  {name:"Upper Back",cat:"أعلى الظهر"},{name:"Reverse Fly",cat:"خلف الكتف"},
  {name:"Leg Press",cat:"فخذ"},{name:"Leg Extension",cat:"فخذ أمامي"},
  {name:"Prone Leg Curl",cat:"فخذ خلفي"},{name:"Abductor",cat:"فتح أرجل"},
  {name:"Adductor",cat:"ضم أرجل"},{name:"Lower Back",cat:"أسفل الظهر"},
  {name:"Rotary Torso",cat:"خصر"},{name:"Abdominal Crunch",cat:"بطن"},
  {name:"Chin Ups",cat:"عقلة"},{name:"Dips",cat:"غمس"},
  {name:"Crossover Cables",cat:"كابل صدر"}
];

// تطبيع اسم التمرين (إزالة "بطيء", "ثقيل", "خفيف", إلخ)
function normalizeExName(name){
  if(!name) return '';
  let n=name.trim()
    .replace(/\s*(بطيء|ثقيل|خفيف)\s*$/,'')
    .replace(/^Pulley\s*[—-]\s*Bicep Curl$/,'Pulley Curl')
    .replace(/^Pulley\s*[—-]\s*Tricep Pushdown$/,'Pulley Pushdown')
    .replace(/^Pulley\s*[—-]\s*سحب أفقي$/,'Pulley')
    .replace(/\s*على Leg Press\s*$/,'')
    .replace(/\s*[—-]\s*مجموعة\s+تسخين\s*$/,'')  // V8.3 — warmup set
    .replace(/\s*[—-]\s*تسخين\s*$/,'');
  return n;
}

// ID مستقر لكل step (يعتمد على ترتيب اليوم وترتيب الـstep داخله)
function ensureStepIds(){
  document.querySelectorAll('.dy').forEach((dy,dayIdx)=>{
    const steps=dy.querySelectorAll('.step');
    steps.forEach((step,stepIdx)=>{
      if(!step.id) step.id=`step-D${dayIdx}-S${stepIdx}`;
    });
  });
}

// حقن زر "⇄ بديل؟" بجانب كل تمرين قابل للاستبدال
function injectAltButtons(){
  document.querySelectorAll('.step:not(.rest):not(.warmup)').forEach(step=>{
    if(step.querySelector('.alt-btn')) return;
    const nameEl=step.querySelector('.step-name');
    if(!nameEl) return;
    const rawName=nameEl.textContent.trim();
    // skip non-trackable rows (warmup-like)
    if(rawName.includes('تجديف')||rawName.includes('مجموعة تسخين')) return;
    const norm=normalizeExName(getExerciseName(step));
    if(!EXERCISE_ALTERNATIVES[norm]) return; // لا بدائل مسجلة → لا زر

    const btn=document.createElement('button');
    btn.className='alt-btn';
    btn.setAttribute('aria-label','عرض البدائل');
    btn.innerHTML='<span class="alt-icon">⇄</span><span>بديل؟</span>';
    btn.onclick=(e)=>{e.stopPropagation();showAlternatives(step)};
    step.appendChild(btn);
    step.classList.add('has-alt');
  });
  // V8.4 — حدّث حالة الأزرار حسب توفّر بدائل في الجيم النشط
  if(typeof refreshAltButtonsAvailability==='function') refreshAltButtonsAvailability();
}

// V7 — حقن زر "↷ تخطّى" بجانب كل تمرين قابل للتتبع (#12)
function injectSkipButtons(){
  document.querySelectorAll('.step:not(.rest):not(.warmup):not(.done)').forEach(step=>{
    if(step.querySelector('.skip-btn')) return;
    const nameEl=step.querySelector('.step-name');
    if(!nameEl) return;
    const rawName=nameEl.textContent.trim();
    if(rawName.includes('تجديف')||rawName.includes('مجموعة تسخين')) return;
    const btn=document.createElement('button');
    btn.className='skip-btn';
    btn.setAttribute('aria-label','تخطّى التمرين اليوم');
    // V8.3 (UX-1) — tooltip توضيحية لمتى يُستخدم الزر
    btn.title='تخطّى هذا التمرين اليوم فقط (الجهاز مشغول، أو ضيق وقت، أو إصابة بسيطة). يعود تلقائياً غداً.';
    btn.innerHTML='<span class="skip-icon">↷</span><span>تخطّى</span>';
    btn.onclick=(e)=>{e.stopPropagation();maybeShowSkipHint();toggleSkipStep(step.id)};
    step.appendChild(btn);
  });
}

// V8.3 (UX-1) — اعرض شرح أوّل مرة فقط عبر toast، ثم خزّن flag في settings
async function maybeShowSkipHint(){
  try{
    const rec=await db.get('settings','app:skip_hint_shown');
    if(rec && rec.value) return;
    await db.put('settings',{key:'app:skip_hint_shown',value:true});
    if(typeof showToast==='function'){
      showToast('💡 التخطّي يخصّ اليوم فقط — يعود التمرين غداً تلقائياً.','var(--blue)',5000);
    }
  }catch(e){}
}

// V7 — تبديل حالة التخطّي (#12)
async function toggleSkipStep(stepId){
  const step=document.getElementById(stepId);
  if(!step) return;
  const rec=await db.get('settings',KEYS.SKIPPED_STEPS);
  const data=(rec&&rec.value)||{};
  const today=new Date().toISOString().split('T')[0];

  if(step.classList.contains('skipped')){
    // إلغاء التخطّي
    step.classList.remove('skipped');
    delete data[stepId];
    await db.put('settings',{key:KEYS.SKIPPED_STEPS,value:data});
    const btn=step.querySelector('.skip-btn span:last-child');
    if(btn) btn.textContent='تخطّى';
    showToast('↩ أُعيد التمرين','var(--blue)');
  }else{
    // تطبيق التخطّي
    step.classList.add('skipped');
    data[stepId]={date:today,skippedAt:new Date().toISOString()};
    await db.put('settings',{key:KEYS.SKIPPED_STEPS,value:data});
    const btn=step.querySelector('.skip-btn span:last-child');
    if(btn) btn.textContent='تراجع';
    showToast('↷ تم تخطّي التمرين اليوم','var(--org)');
    try{navigator.vibrate&&navigator.vibrate(20)}catch(e){}
  }
}

// V7 — استعد حالات التخطّي (تنتهي تلقائياً بعد منتصف الليل)
async function loadSkippedSteps(){
  const rec=await db.get('settings',KEYS.SKIPPED_STEPS);
  const data=(rec&&rec.value)||{};
  const today=new Date().toISOString().split('T')[0];
  const cleaned={};
  for(const [stepId,info] of Object.entries(data)){
    if(info.date===today){
      cleaned[stepId]=info;
      const step=document.getElementById(stepId);
      if(step){
        step.classList.add('skipped');
        const btn=step.querySelector('.skip-btn span:last-child');
        if(btn) btn.textContent='تراجع';
      }
    }
  }
  // امسح التخطّيات القديمة من قاعدة البيانات
  if(Object.keys(cleaned).length!==Object.keys(data).length){
    await db.put('settings',{key:KEYS.SKIPPED_STEPS,value:cleaned});
  }
}

// V7 — يحسب عدد التمارين المتخطّاة اليوم (للإحصائيات)
async function getSkippedTodayCount(){
  const rec=await db.get('settings',KEYS.SKIPPED_STEPS);
  const data=(rec&&rec.value)||{};
  const today=new Date().toISOString().split('T')[0];
  return Object.values(data).filter(v=>v.date===today).length;
}

// فتح Modal البدائل
// V8.4 — async الآن، يفلتر البدائل حسب الجيم النشط
async function showAlternatives(step){
  // لو الستيب مستبدل بالفعل، اقرأ الأصلي من dataset (تجنب نص الـ DOM المُعدّل)
  const rawOriginal=step.dataset.original||getExerciseName(step);
  const original=normalizeExName(rawOriginal);
  const currentSub=step.dataset.substitute || null;
  const rawAlts=EXERCISE_ALTERNATIVES[original]||[];
  if(!rawAlts.length){
    showToast('⚠️ لا توجد بدائل مسجلة لهذا التمرين','var(--red)');
    return;
  }

  // V8.4 — فلترة حسب الجيم النشط + قراءة الجيم لعرضه في الترويسة
  let activeGym=null;
  let alts=rawAlts;
  try{
    if(typeof getActiveGym==='function') activeGym=await getActiveGym();
    if(typeof getEffectiveAlternatives==='function'){
      alts=await getEffectiveAlternatives(original);
    }
  }catch(e){console.warn('Gym filter failed:',e)}

  const modal=document.getElementById('altModal');
  const sheet=document.getElementById('altSheet');
  const title=document.getElementById('altTitle');
  const list=document.getElementById('altList');
  const peakWarn=document.getElementById('altPeakWarn');
  const smart=document.getElementById('altSmartSuggest');
  const allWrap=document.getElementById('altAllWrap');
  allWrap.style.display='none';
  allWrap.innerHTML='';

  // V8.4 — همزة سياق: الجيم النشط
  const gymCtx=document.getElementById('altGymContext');
  if(gymCtx){
    if(activeGym){
      const hidden=rawAlts.length-alts.length;
      const hiddenTxt=hidden>0?` <small>(${hidden} بديل غير متاح في هذا الجيم)</small>`:'';
      gymCtx.innerHTML=`<span class="agc-icon">${activeGym.icon||'🏋️'}</span> البدائل المتاحة في: <b>${escAttrSub(activeGym.name||'الجيم')}</b>${hiddenTxt}`;
      gymCtx.style.display='';
    }else{
      gymCtx.style.display='none';
    }
  }

  title.innerHTML=`🔄 بدائل لـ <b>${original}</b>`;

  // وقت الذروة (٦-٩ مساءً)
  const hour=new Date().getHours();
  const isPeak=hour>=18 && hour<21;
  if(isPeak){
    peakWarn.innerHTML=`<div class="peak-warning"><span style="font-size:14px">⚠️</span><div><b>وقت ذروة الجيم.</b> البدائل المعلّمة بـ <b style="color:var(--grn)">⚡ متاح</b> غالباً أقل ازدحاماً.</div></div>`;
  }else{
    peakWarn.innerHTML='';
  }

  // اقتراح ذكي بناءً على التاريخ
  smart.innerHTML='';
  checkSmartSuggestion(original).then(suggestion=>{
    if(suggestion){
      smart.innerHTML=`<div class="smart-suggest">
        <div class="ss-head">💡 اقتراح ذكي</div>
        <div>لاحظنا إنك استبدلت <b>${original}</b> بـ <b style="color:var(--blue)">${suggestion.substitute}</b> ${suggestion.count} مرات. تبي نخلّيه دائم؟</div>
        <button onclick="makePermanent('${original.replace(/'/g,"\\'")}','${suggestion.substitute.replace(/'/g,"\\'")}',this)">نعم، استبدل دائماً</button>
      </div>`;
    }
  });

  // V8.4 — حالة فارغة: لا بدائل متاحة في هذا الجيم
  if(!alts.length){
    list.innerHTML=`
      <div class="alt-empty-gym">
        <div class="aeg-icon">🚫</div>
        <div class="aeg-title">لا يوجد بديل مناسب في "${escAttrSub(activeGym?activeGym.name:'الجيم النشط')}"</div>
        <div class="aeg-body">جميع البدائل المسجّلة لهذا التمرين تحتاج معدّات غير متوفرة هنا.</div>
        <div class="aeg-actions">
          <button class="aeg-bw" type="button" onclick="quickSwitchToBodyweight()">✈️ فعّل وضع السفر (وزن جسم)</button>
          <button class="aeg-add" type="button" onclick="openGymManager('${activeGym?activeGym.id:''}')">🛠 أضف معدّات للجيم</button>
          <button class="aeg-show-all" type="button" onclick="showAllEquipment()">📦 شوف كل المعدّات للاستبدال يدوياً</button>
        </div>
      </div>
    `;
    setTimeout(()=>{},0);
    modal.dataset.targetStep=step.id;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    return;
  }

  // رتّب: peakFriendly أولاً في وقت الذروة، وإلا الترتيب الأصلي
  const sorted=isPeak?[...alts].sort((a,b)=>(b.peakFriendly?1:0)-(a.peakFriendly?1:0)):alts;

  list.innerHTML=sorted.map((alt,i)=>{
    const isCurrent=currentSub===alt.name;
    const escName=alt.name.replace(/'/g,"\\'");
    return `<div class="alt-card ${alt.peakFriendly&&isPeak?'peak-friendly':''} ${isCurrent?'current':''}">
      <div class="alt-rank">${i+1}</div>
      <div class="alt-name">${alt.name}</div>
      <div class="alt-reason">${alt.reason}</div>
      <div class="alt-match-bar"><div class="alt-match-fill" style="width:0%" data-w="${alt.muscleMatch}"></div></div>
      <div class="alt-meta">
        <span class="alt-match-label">تطابق العضلة ${alt.muscleMatch}٪</span>
        <span class="alt-equipment">${alt.equipment}</span>
      </div>
      ${isCurrent?`<button class="alt-use-btn" disabled>✓ البديل الحالي</button>`:`
      <div class="alt-scope-label">طبّق على:</div>
      <div class="alt-scope">
        <button class="alt-scope-btn" data-scope="set" onclick="applyScopedSubstitution('set','${step.id}','${escName}')">
          <b>هذا السيت</b><span>سيت واحد فقط</span>
        </button>
        <button class="alt-scope-btn primary" data-scope="day" onclick="applyScopedSubstitution('day','${step.id}','${escName}')">
          <b>كل اليوم</b><span>جميع سيتات نفس التمرين</span>
        </button>
        <button class="alt-scope-btn" data-scope="always" onclick="applyScopedSubstitution('always','${step.id}','${escName}')">
          <b>دائماً</b><span>كل الأيام (بديل دائم)</span>
        </button>
      </div>`}
    </div>`;
  }).join('');

  // animate match bars
  setTimeout(()=>{
    list.querySelectorAll('.alt-match-fill').forEach(el=>{
      el.style.width=el.dataset.w+'%';
    });
  },50);

  modal.dataset.targetStep=step.id;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  // قفل تمرير الـbody
  document.body.style.overflow='hidden';
}

function closeAltModal(){
  const modal=document.getElementById('altModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}

// عرض كل الأجهزة (الـ "ما لقيت اللي يناسبك؟")
function showAllEquipment(){
  const wrap=document.getElementById('altAllWrap');
  if(wrap.style.display!=='none'){wrap.style.display='none';return}
  const modal=document.getElementById('altModal');
  const stepId=modal.dataset.targetStep;
  wrap.innerHTML=`<div style="font-size:11px;color:var(--tx2);margin:8px 0">اضغط أي جهاز لاستخدامه كبديل:</div>
    <div class="alt-all">
      ${ALL_EQUIPMENT.map(e=>`<div class="alt-all-item" onclick="applySubstitution('${stepId}','${e.name.replace(/'/g,"\\'")}',this)">${e.name}<span class="ai-cat">${e.cat}</span></div>`).join('')}
    </div>`;
  wrap.style.display='block';
  wrap.scrollIntoView({behavior:'smooth',block:'nearest'});
}

// V7 — مزامنة نصوص Plan B من كتالوج EXERCISE_ALTERNATIVES (#11)
// النصوص في HTML مكتوبة يدوياً وقد تتعارض مع الكتالوج — هذه الدالة تولّدها تلقائياً.
function syncPlanBTexts(){
  // أسماء جزئية شائعة → الاسم الكامل في الكتالوج
  const partialMap={
    'Crossover':'Crossover Cables',
    'Kneeling Easy':'Chin Ups',
    'Hanging Leg Raise':'Hanging Leg Raise',
    'Adductor':'Adductor',
    'Abductor':'Abductor'
  };
  document.querySelectorAll('.plan-b').forEach(pb=>{
    const body=pb.querySelector('div');
    if(!body) return;
    // احفظ النص الأصلي للرجوع إليه عند الحاجة
    if(!pb.dataset.originalText) pb.dataset.originalText=body.innerHTML;
    const html=body.innerHTML;
    // حالات نتركها كما هي (لا تنطبق عليها قاعدة بديل واحد)
    if(/نفس الجهاز/.test(html)) return;
    if(/الجهازان مشغولان/.test(html)) return;
    if(/أحد الجهازين/.test(html)) return;
    if(/الزوج مشغول/.test(html)) return;
    if(/أحدهما مشغول/.test(html)) return;
    // ابحث عن النمط: "لو <b>X مشغول</b>"
    const m=html.match(/لو\s*<b>([^<]+?)\s*مشغول<\/b>/);
    if(!m) return;
    let target=m[1].trim();
    // تطبيع الأسماء الجزئية
    if(partialMap[target]) target=partialMap[target];
    let alts=EXERCISE_ALTERNATIVES[target];
    if(!alts || !alts.length) return;
    // V8.4 — فلتر حسب الجيم النشط لو الكاش موجود
    if(typeof getEffectiveAlternativesSync==='function'){
      const filtered=getEffectiveAlternativesSync(target);
      if(filtered.length) alts=filtered;
    }
    // اختر الأول كأفضل بديل، لكن لو في وقت ذروة ولديه peakFriendly اختره
    const hour=new Date().getHours();
    const isPeak=hour>=18 && hour<21;
    let best=alts[0];
    if(isPeak){
      const peakAlt=alts.find(a=>a.peakFriendly);
      if(peakAlt) best=peakAlt;
    }
    // ولّد النص الجديد
    const peakBadge=best.peakFriendly?' <span style="color:var(--grn);font-size:10px">⚡</span>':'';
    body.innerHTML=`لو <b>${target} مشغول</b> → استخدم <b>${best.name}</b>${peakBadge} (${best.reason})`;
    pb.dataset.synced='1';
  });
}

// V7 — تطبيق الاستبدال على نطاق محدد (سيت واحد / كل اليوم / دائماً)
async function applyScopedSubstitution(scope,stepId,substitute){
  const step=document.getElementById(stepId);
  if(!step) return;
  const rawOriginal=step.dataset.original||getExerciseName(step);
  const original=normalizeExName(rawOriginal);

  if(scope==='always'){
    // استبدال دائم — يطبّق على كل الأيام
    await makePermanent(original,substitute);
    return;
  }

  if(scope==='day'){
    // كل سيتات نفس التمرين في نفس اليوم
    const dy=step.closest('.dy');
    if(!dy){await applySubstitution(stepId,substitute);return}
    const allSteps=dy.querySelectorAll('.step:not(.rest):not(.warmup)');
    const targets=[];
    allSteps.forEach(s=>{
      // اقرأ الأصلي من dataset (لو مستبدل بالفعل) وإلا من اسم التمرين
      const o=normalizeExName(s.dataset.original||getExerciseName(s));
      if(o===original) targets.push(s);
    });
    if(!targets.length){await applySubstitution(stepId,substitute);return}
    // طبّق على كل ستيب
    for(const t of targets){
      await applySubstitutionUI(t,original,substitute);
      await saveSubstitution(t.id,original,substitute,getDayLabel(t));
    }
    await logSubstitutionHistory(original,substitute);
    closeAltModal();
    showToast(`✓ استُبدل ${original} بـ ${substitute} في ${targets.length} سيت بنفس اليوم`,'var(--blue)');
    try{navigator.vibrate&&navigator.vibrate([40,30,40])}catch(e){}
    return;
  }

  // scope === 'set' (الافتراضي) — سيت واحد فقط
  await applySubstitution(stepId,substitute,null);
}

// تطبيق الاستبدال على ستيب معيّن
async function applySubstitution(stepId,substitute,btnEl){
  const step=document.getElementById(stepId);
  if(!step) return;
  // لو الستيب مستبدل بالفعل، احصل على الأصلي من dataset (وليس النص الحالي)
  const rawOriginal=step.dataset.original||getExerciseName(step);
  const original=normalizeExName(rawOriginal);

  // 1) حدّث الـ DOM
  step.dataset.substitute=substitute;
  step.dataset.original=original;
  renderSubstitutedName(step,original,substitute);
  step.classList.add('exercise-substituted');

  // 2) حدّث الـ track-input data-name (المهم لحفظ السيتات تحت اسم البديل)
  const wInput=step.querySelector('.weight-input');
  const rInput=step.querySelector('.reps-input');
  if(wInput){
    wInput.dataset.name=substitute;
    wInput.dataset.ex=substitute.replace(/\s+/g,'_');
  }
  if(rInput) rInput.dataset.ex=substitute.replace(/\s+/g,'_');

  // 3) حدّث "آخر مرة / أفضل" من سجل البديل (V7 #13)
  const lastSet=await getLastSetFor(substitute);
  const lastEl=step.querySelector('.track-input .last');
  await setLastBestForExName(lastEl,substitute);
  if(wInput) wInput.placeholder=lastSet?lastSet.weight:'';
  if(rInput) rInput.placeholder=lastSet?lastSet.reps:'';

  // 4) احفظ الاستبدال
  await saveSubstitution(stepId,original,substitute,getDayLabel(step));

  closeAltModal();
  showToast(`✓ استُبدل ${original} بـ ${substitute}`,'var(--blue)');
  try{navigator.vibrate&&navigator.vibrate(40)}catch(e){}
}

function renderSubstitutedName(step,original,substitute){
  const nameEl=step.querySelector('.step-name');
  if(!nameEl) return;
  // احفظ النص الأصلي الكامل (مع "— سيت N") لو ما محفوظ
  if(!step.dataset.originalNameText) step.dataset.originalNameText=nameEl.textContent;
  // استخرج suffix (مثل "— سيت ١")
  const suffixMatch=step.dataset.originalNameText.match(/(\s*[—-]\s*سيت.*)$/);
  const suffix=suffixMatch?suffixMatch[1]:'';
  nameEl.innerHTML=`<span class="sub-badge">🔄 بديل</span>${substitute}${suffix} <button class="restore-original-btn" onclick="restoreOriginal('${step.id}');event.stopPropagation()" title="استعد الأصلي">↩ ${original}</button>`;
}

async function restoreOriginal(stepId){
  const step=document.getElementById(stepId);
  if(!step) return;
  const nameEl=step.querySelector('.step-name');
  // استعد النص الكامل أولاً (يحتوي الـ variants مثل "بطيء")
  if(nameEl && step.dataset.originalNameText){
    nameEl.textContent=step.dataset.originalNameText;
  }
  step.classList.remove('exercise-substituted');
  delete step.dataset.substitute;
  delete step.dataset.original;
  delete step.dataset.originalNameText;

  // استخرج الاسم الخام بعد الاستعادة (يحافظ على variants)
  const rawOriginal=getExerciseName(step);

  const wInput=step.querySelector('.weight-input');
  const rInput=step.querySelector('.reps-input');
  if(wInput){
    wInput.dataset.name=rawOriginal;
    wInput.dataset.ex=rawOriginal.replace(/\s+/g,'_');
  }
  if(rInput) rInput.dataset.ex=rawOriginal.replace(/\s+/g,'_');

  const lastSet=await getLastSetFor(rawOriginal);
  const lastEl=step.querySelector('.track-input .last');
  await setLastBestForExName(lastEl,rawOriginal); // V7 #13
  if(wInput) wInput.placeholder=lastSet?lastSet.weight:'';
  if(rInput) rInput.placeholder=lastSet?lastSet.reps:'';

  await removeSubstitution(stepId);
  showToast(`↩ تم استعادة ${rawOriginal}`);
}

async function getLastSetFor(exerciseName){
  const sets=await db.getAll('sets','exerciseName',exerciseName);
  if(!sets||!sets.length) return null;
  sets.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  return sets[0];
}

// تخزين الاستبدالات في settings store
async function saveSubstitution(stepId,original,substitute,dayType){
  const all=await db.get('settings',KEYS.SUBS_ACTIVE);
  const data=(all&&all.value)||{};
  data[stepId]={original,substitute,date:new Date().toISOString(),dayType};
  await db.put('settings',{key:KEYS.SUBS_ACTIVE,value:data});
}

async function removeSubstitution(stepId){
  const all=await db.get('settings',KEYS.SUBS_ACTIVE);
  const data=(all&&all.value)||{};
  delete data[stepId];
  await db.put('settings',{key:KEYS.SUBS_ACTIVE,value:data});
}

// استعد الاستبدالات عند تحميل الصفحة
async function loadSubstitutions(){
  // 1) تفضيلات دائمة (موجودة في كل خطوة لها نفس الـoriginal)
  const prefsRec=await db.get('settings',KEYS.SUBS_PREFS);
  const prefs=(prefsRec&&prefsRec.value)||{};

  // 2) استبدالات لكل-ستيب
  const subsRec=await db.get('settings',KEYS.SUBS_ACTIVE);
  const subs=(subsRec&&subsRec.value)||{};

  // طبّق التفضيلات الدائمة أولاً (لو ما في per-step override)
  if(Object.keys(prefs).length){
    document.querySelectorAll('.step:not(.rest):not(.warmup)').forEach(step=>{
      const orig=normalizeExName(getExerciseName(step));
      if(!orig) return;
      if(subs[step.id]) return; // per-step override
      if(prefs[orig]){
        applySubstitutionUI(step,orig,prefs[orig]);
      }
    });
  }

  // طبّق per-step
  for(const [stepId,sub] of Object.entries(subs)){
    const step=document.getElementById(stepId);
    if(!step) continue;
    applySubstitutionUI(step,sub.original,sub.substitute);
  }
}

// تطبيق UI فقط (بدون حفظ في IDB — للاسترجاع عند التحميل)
async function applySubstitutionUI(step,original,substitute){
  step.dataset.substitute=substitute;
  step.dataset.original=original;
  renderSubstitutedName(step,original,substitute);
  step.classList.add('exercise-substituted');
  const wInput=step.querySelector('.weight-input');
  const rInput=step.querySelector('.reps-input');
  if(wInput){
    wInput.dataset.name=substitute;
    wInput.dataset.ex=substitute.replace(/\s+/g,'_');
  }
  if(rInput) rInput.dataset.ex=substitute.replace(/\s+/g,'_');
  const lastSet=await getLastSetFor(substitute);
  const lastEl=step.querySelector('.track-input .last');
  await setLastBestForExName(lastEl,substitute); // V7 #13
  if(wInput) wInput.placeholder=lastSet?lastSet.weight:'';
  if(rInput) rInput.placeholder=lastSet?lastSet.reps:'';
}

// اقتراح ذكي: لو المستخدم استبدل نفس التمرين بنفس البديل ≥ ٣ مرات → اقترح permanent
async function checkSmartSuggestion(original){
  const subsRec=await db.get('settings',KEYS.SUBS_ACTIVE);
  const subs=(subsRec&&subsRec.value)||{};
  const histRec=await db.get('settings',KEYS.SUBS_HISTORY);
  const hist=(histRec&&histRec.value)||[];

  // count substitute occurrences for this original
  const counts={};
  hist.filter(h=>h.original===original).forEach(h=>{
    counts[h.substitute]=(counts[h.substitute]||0)+1;
  });
  // also count currently-active per-step subs for this original
  Object.values(subs).filter(s=>s.original===original).forEach(s=>{
    counts[s.substitute]=(counts[s.substitute]||0)+1;
  });

  // لا تقترح لو فيه pref دائم بالفعل
  const prefsRec=await db.get('settings',KEYS.SUBS_PREFS);
  const prefs=(prefsRec&&prefsRec.value)||{};
  if(prefs[original]) return null;

  const top=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
  if(top && top[1]>=3) return {substitute:top[0],count:top[1]};
  return null;
}

// جعل الاستبدال دائماً
// V8.3 (UX-6) — توست مع زر "تراجع" لمدة ١٠ ثوانٍ يستعيد الحالة السابقة
async function makePermanent(original,substitute,btn){
  // ١) خزّن السياق للتراجع
  const prefsRec=await db.get('settings',KEYS.SUBS_PREFS);
  const prevPrefs=(prefsRec&&prefsRec.value)?{...prefsRec.value}:{};
  const prevAssignment=prevPrefs[original]; // قد يكون undefined لو ما في استبدال سابق
  // التقط الستيبات اللي ستُعدَّل (لاستعادتها)
  const willChange=[];
  for(const step of document.querySelectorAll('.step:not(.rest):not(.warmup)')){
    const orig=normalizeExName(getExerciseName(step));
    if(orig===original && !step.dataset.substitute) willChange.push(step.id);
  }

  // ٢) طبّق الاستبدال الدائم
  const newPrefs={...prevPrefs,[original]:substitute};
  await db.put('settings',{key:KEYS.SUBS_PREFS,value:newPrefs});
  for(const sid of willChange){
    const step=document.getElementById(sid);
    if(step && !step.dataset.substitute){
      await applySubstitutionUI(step,original,substitute);
    }
  }
  closeAltModal();
  try{navigator.vibrate&&navigator.vibrate([60,30,60])}catch(e){}

  // ٣) اعرض toast مع زر تراجع (١٠ ثوانٍ)
  const undoCtx={original,substitute,prevAssignment,changedStepIds:willChange};
  showToast(`✓ ${substitute} الآن البديل الدائم لـ ${original}`,'var(--purple)',10000,{
    action:{label:'تراجع',handler:()=>undoMakePermanent(undoCtx)}
  });
}

// V8.3 (UX-6) — تراجع عن makePermanent
async function undoMakePermanent(ctx){
  try{
    // ١) أعد prefs لحالتها السابقة
    const rec=await db.get('settings',KEYS.SUBS_PREFS);
    const prefs=(rec&&rec.value)||{};
    if(ctx.prevAssignment==null) delete prefs[ctx.original];
    else prefs[ctx.original]=ctx.prevAssignment;
    await db.put('settings',{key:KEYS.SUBS_PREFS,value:prefs});

    // ٢) استعد كل الـ steps اللي تغيّرت
    for(const sid of ctx.changedStepIds||[]){
      const step=document.getElementById(sid);
      if(!step) continue;
      // امسح dataset + استرجع الاسم الأصلي
      if(step.dataset.originalNameText){
        const nameEl=step.querySelector('.step-name');
        if(nameEl) nameEl.textContent=step.dataset.originalNameText;
      }
      delete step.dataset.substitute;
      delete step.dataset.original;
      delete step.dataset.originalNameText;
      step.classList.remove('exercise-substituted');
      // أعِد data-name إلى الأصلي
      const wInput=step.querySelector('.weight-input');
      const rInput=step.querySelector('.reps-input');
      const rawOriginal=getExerciseName(step);
      if(wInput){wInput.dataset.name=rawOriginal;wInput.dataset.ex=rawOriginal.replace(/\s+/g,'_')}
      if(rInput) rInput.dataset.ex=rawOriginal.replace(/\s+/g,'_');
      // حدّث "آخر/أفضل" للأصلي
      const lastEl=step.querySelector('.track-input .last');
      if(lastEl && typeof setLastBestForExName==='function') await setLastBestForExName(lastEl,rawOriginal);
      if(typeof getLastSetFor==='function'){
        const ls=await getLastSetFor(rawOriginal);
        if(wInput) wInput.placeholder=ls?ls.weight:'';
        if(rInput) rInput.placeholder=ls?ls.reps:'';
      }
      // أزل الاستبدال من store أيضاً (لو دخل)
      if(typeof removeSubstitution==='function') await removeSubstitution(sid);
    }
    showToast('↩ تم التراجع — البديل الدائم أُلغي','var(--blue)',2500);
  }catch(e){
    console.warn('undoMakePermanent failed:',e);
    showToast('⚠️ فشل التراجع','var(--red)');
  }
}

// سجل تاريخ الاستبدالات (لميزة الاقتراح الذكي)
async function logSubstitutionHistory(original,substitute){
  const histRec=await db.get('settings',KEYS.SUBS_HISTORY);
  const hist=(histRec&&histRec.value)||[];
  hist.push({original,substitute,date:new Date().toISOString()});
  // احتفظ بآخر ٢٠٠ فقط
  if(hist.length>200) hist.splice(0,hist.length-200);
  await db.put('settings',{key:KEYS.SUBS_HISTORY,value:hist});
}

// V8.4 — helper لـ HTML attribute escaping
function escAttrSub(s){return String(s==null?'':s).replace(/"/g,'&quot;').replace(/'/g,"\\'").replace(/</g,'&lt;')}

// V8.4 — تبديل سريع للوضع الـ bodyweight
async function quickSwitchToBodyweight(){
  if(typeof setActiveGymId!=='function') return;
  await setActiveGymId('bodyweight-travel');
  if(typeof refreshGymSwitcherUI==='function') await refreshGymSwitcherUI();
  closeAltModal();
  if(typeof showToast==='function') showToast('✈️ تم التبديل إلى وضع السفر (وزن جسم)','var(--blue)',3500);
  // أعد فحص قابلية البدائل في الـ DOM (للأزرار)
  if(typeof refreshAltButtonsAvailability==='function') refreshAltButtonsAvailability();
}

// V8.4 — يعيد فحص أزرار "بديل؟" بعد تغيير الجيم
function refreshAltButtonsAvailability(){
  document.querySelectorAll('.step:not(.rest):not(.warmup)').forEach(step=>{
    const altBtn=step.querySelector('.alt-btn');
    if(!altBtn) return;
    const norm=normalizeExName(getExerciseName(step));
    const rawAlts=(EXERCISE_ALTERNATIVES[norm]||[]);
    if(!rawAlts.length) return;
    const filtered=(typeof getEffectiveAlternativesSync==='function')?getEffectiveAlternativesSync(norm):rawAlts;
    if(filtered.length===0){
      altBtn.classList.add('alt-btn-empty');
      altBtn.title='لا بدائل متاحة في الجيم النشط — اضغط لرؤية الخيارات';
    }else{
      altBtn.classList.remove('alt-btn-empty');
      altBtn.title='';
    }
  });
}
