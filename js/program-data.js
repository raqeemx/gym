/* ============================================================
 * BULK MODE — Program Data (JSON-driven workout schema)
 * ============================================================
 * يفصل بيانات البرنامج عن الـ HTML.
 * كل يوم تمرين = object بحقوله، و phases بداخله = warmup/solo/pair.
 *
 * ⚠️ ملاحظات للمحرّر:
 * - أسماء التمارين (step.name) يجب أن تطابق ما في catalog البدائل و normalizeExName.
 *   التطبيع يزيل لاحقات: "بطيء/ثقيل/خفيف"، "— تسخين"، "على Leg Press".
 * - الأرقام العربية تبقى عربية هنا — normalizeDataDigits() تحوّلها لاتينية بعد الرندر.
 * - الـ HTML داخل بعض الحقول (<b>…</b>) مقصود (planB, banner.text, finishTip).
 * - last:true في آخر step تدريبي = يضيف class "done" تلقائياً + الـ info فيه السهم/الإيموجي.
 * - دوال tag/color classes: انظر .db.push / .db.pull / .db.legs / .db.rest
 * ============================================================ */

const PROGRAM_DATA = {
  meta: {
    name: "BULK MODE 12-Week",
    version: "1.0",
    weeks: 12,
    daysPerWeek: 6,
    description: "تضخيم 12 أسبوع — UPPER PRIORITY · 5 أيام علوي + يوم أرجل صيانة"
  },
  days: [
    // ============================================================
    // اليوم الأول: الأحد — UPPER A
    // ============================================================
    {
      id: "upper-a",
      dayOfWeek: 0,
      shortName: "أحد",
      type: "UPPER A",
      tagLabel: "UPPER",
      tagClass: "tp",
      colorClass: "push",
      label: "UPPER A — الترتيب الكامل خطوة بخطوة",
      description: "٢٢ سيت · ~٥٥ دقيقة · أزواج بنفس المنطقة",
      stats: { sets: 22, exercises: 6, pairs: 3, minutes: "~55" },
      finishTip: "<strong>انتهيت من UPPER A</strong> · ٢٦ خطوة · ~٥٥ دقيقة · إذا واجهت ازدحاماً، استخدم Plan B بدون تردد.",
      phases: [
        // --- إحماء ---
        {
          type: "warmup",
          label: "إحماء",
          name: "قبل البدء",
          steps: [
            { type: "warmup", name: "Skillrow — تجديف", info: "٥ دقائق · سرعة مريحة" },
            { type: "warmup", name: "Chest Press — مجموعة تسخين", info: "١٢ تكرار بنصف وزن العمل" }
          ]
        },
        // --- SOLO: Chest Press ---
        {
          type: "solo",
          label: "SOLO",
          name: "Chest Press — راحة كاملة",
          meta: "4 sets",
          steps: [
            { type: "solo-set", name: "Chest Press — سيت ١", info: "٨-١٠ تكرار · ١٠ كجم" },
            { type: "rest", name: "راحة ٩٠ ثانية", info: "اشرب ماء · تنفّس بعمق" },
            { type: "solo-set", name: "Chest Press — سيت ٢", info: "٨-١٠ تكرار" },
            { type: "rest", name: "راحة ٩٠ ثانية", info: "—" },
            { type: "solo-set", name: "Chest Press — سيت ٣", info: "٨-١٠ تكرار" },
            { type: "rest", name: "راحة ٩٠ ثانية", info: "—" },
            { type: "solo-set", name: "Chest Press — سيت ٤ (الأخير)", info: "٨-١٠ تكرار · بعدها انتقل للزوج A" }
          ]
        },
        // --- PAIR A: Lat Machine ↔ Shoulder Press ---
        {
          type: "pair",
          label: "PAIR A",
          name: "Lat Machine ↔ Shoulder Press",
          meta: "4 جولات",
          banner: {
            icon: "🔄",
            zoneTag: "🟢 ZONE",
            text: "منطقة السحب/الدفع · راحة <b>٦٠ ثانية</b> · العضلة المستهدفة ترتاح ١٦٠ ث فعلياً"
          },
          planB: "لو <b>Shoulder Press مشغول</b> → استبدله بـ <b>Delts Machine بوزن أثقل</b> (نفس الفائدة، ضغط أكتاف بطريقة مختلفة)",
          steps: [
            { type: "set", name: "Lat Machine — سيت ١", info: "٨-١٠ تكرار · ١٥ كجم" },
            { type: "rest", name: "راحة ٦٠ ثانية + انتقال", info: "روح لـ Shoulder Press" },
            { type: "set", name: "Shoulder Press — سيت ١", info: "٨-١٠ تكرار · ١٠ كجم" },
            { type: "rest", name: "راحة ٦٠ ثانية + رجوع", info: "ارجع لـ Lat Machine" },
            { type: "set", name: "Lat Machine — سيت ٢", info: "٨-١٠ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية + انتقال", info: "—" },
            { type: "set", name: "Shoulder Press — سيت ٢", info: "٨-١٠ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية + رجوع", info: "—" },
            { type: "set", name: "Lat Machine — سيت ٣", info: "٨-١٠ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية + انتقال", info: "—" },
            { type: "set", name: "Shoulder Press — سيت ٣", info: "٨-١٠ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية + رجوع", info: "—" },
            { type: "set", name: "Lat Machine — سيت ٤ (الأخير)", info: "٨-١٠ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية + انتقال", info: "—" },
            { type: "set", name: "Shoulder Press — سيت ٤ (الأخير)", info: "٨-١٠ تكرار · انتهى الزوج A" }
          ]
        },
        // --- PAIR B: Low Row ↔ Pectoral Fly ---
        {
          type: "pair",
          label: "PAIR B",
          name: "Low Row ↔ Pectoral Fly",
          meta: "3 جولات",
          banner: {
            icon: "🔄",
            zoneTag: "🟢 ZONE",
            text: "منطقة العزل · راحة <b>٦٠ ثانية</b>"
          },
          planB: "لو <b>Pectoral Fly مشغول</b> → استبدله بـ <b>Crossover Cables</b> (تفتيح صدر بالكابل، تمدد أعمق)",
          steps: [
            { type: "set", name: "Low Row — سيت ١", info: "١٠-١٢ تكرار · ١٥ كجم" },
            { type: "rest", name: "راحة ٦٠ ثانية + انتقال", info: "—" },
            { type: "set", name: "Pectoral Fly — سيت ١", info: "١٠-١٢ تكرار · ١٠ كجم" },
            { type: "rest", name: "راحة ٦٠ ثانية + رجوع", info: "—" },
            { type: "set", name: "Low Row — سيت ٢", info: "١٠-١٢ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية + انتقال", info: "—" },
            { type: "set", name: "Pectoral Fly — سيت ٢", info: "١٠-١٢ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية + رجوع", info: "—" },
            { type: "set", name: "Low Row — سيت ٣ (الأخير)", info: "١٠-١٢ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية + انتقال", info: "—" },
            { type: "set", name: "Pectoral Fly — سيت ٣ (الأخير)", info: "١٠-١٢ تكرار · انتهى الزوج B" }
          ]
        },
        // --- PAIR C: Reverse Fly ↔ Delts Machine ---
        {
          type: "pair",
          label: "PAIR C",
          name: "Reverse Fly ↔ Delts Machine",
          meta: "3 جولات",
          banner: {
            icon: "⭐",
            zoneTag: "🟢 ZONE",
            text: "منطقة الأكتاف · الجهازان متجاوران · راحة <b>٦٠ ثانية</b>"
          },
          planB: "لو <b>Reverse Fly مشغول</b> → استخدم <b>Pulley بوضع السحب الخلفي</b> (الكابلات للأعلى، اسحب للخارج)",
          steps: [
            { type: "set", name: "Reverse Fly — سيت ١", info: "١٢-١٥ تكرار · ٥ كجم" },
            { type: "rest", name: "راحة ٦٠ ثانية + انتقال", info: "—" },
            { type: "set", name: "Delts Machine — سيت ١", info: "١٢-١٥ تكرار · ٥ كجم" },
            { type: "rest", name: "راحة ٦٠ ثانية + رجوع", info: "—" },
            { type: "set", name: "Reverse Fly — سيت ٢", info: "١٢-١٥ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Delts Machine — سيت ٢", info: "١٢-١٥ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Reverse Fly — سيت ٣ (الأخير)", info: "١٢-١٥ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Delts Machine — سيت ٣ (الأخير)", info: "١٢-١٥ تكرار · ✓ انتهيت! 🎉", last: true }
          ]
        }
      ]
    },
    // ============================================================
    // اليوم الثاني: الإثنين — BACK & WINGS
    // ============================================================
    {
      id: "back-wings",
      dayOfWeek: 1,
      shortName: "اثن",
      type: "BACK & WINGS",
      tagLabel: "BACK",
      tagClass: "tpl",
      colorClass: "pull",
      label: "BACK & WINGS — يوم الضلات والظهر الكامل",
      description: "٢٤ سيت · ~٦٠ دقيقة · ضلات + ظهر عريض + ضخامة الجناحين V-Taper",
      stats: { sets: 24, exercises: 7, pairs: 3, minutes: "~60" },
      dayIntro: { icon:"🦅", text:"<strong>الهدف اليوم:</strong> توسيع الظهر والضلات (V-Taper) — هذا الشكل الذي يجعل خصرك يبان أنحف وكتفك أعرض. تركيز كثيف على عضلات الـ Lats عبر تمارين السحب الرأسي والأفقي بتنوع زوايا." },
      finishTip: "<strong>انتهيت من BACK & WINGS</strong> · ٢٦ خطوة · ~٦٠ دقيقة · هذا اليوم الذي يبني الظهر العريض وضلات الجناحين. سيظهر الفرق بعد ٣-٤ أسابيع.",
      phases: [
        // --- إحماء ---
        {
          type: "warmup",
          label: "إحماء",
          name: "قبل البدء",
          steps: [
            { type: "warmup", name: "Skillrow — تجديف", info: "٥ دقائق · يسخّن الظهر مباشرة" },
            { type: "warmup", name: "Lat Machine — مجموعة تسخين", info: "١٢ تكرار بنصف وزن العمل" }
          ]
        },
        // --- SOLO: Lat Machine ---
        {
          type: "solo",
          label: "SOLO",
          name: "Lat Machine ثقيل — باني الضلات الرئيسي",
          meta: "4 sets",
          steps: [
            { type: "solo-set", name: "Lat Machine — سيت ١", info: "٨-١٠ تكرار · ١٥ كجم · اسحب للصدر" },
            { type: "rest", name: "راحة ٩٠ ثانية", info: "شغّل عضلة الـ Lat واضغطها" },
            { type: "solo-set", name: "Lat Machine — سيت ٢", info: "٨-١٠ تكرار" },
            { type: "rest", name: "راحة ٩٠ ثانية", info: "—" },
            { type: "solo-set", name: "Lat Machine — سيت ٣", info: "٨-١٠ تكرار" },
            { type: "rest", name: "راحة ٩٠ ثانية", info: "—" },
            { type: "solo-set", name: "Lat Machine — سيت ٤ (الأخير)", info: "٨-١٠ تكرار · انتقل للزوج A" }
          ]
        },
        // --- PAIR A: Vertical Traction ↔ Low Row ---
        {
          type: "pair",
          label: "PAIR A",
          name: "Vertical Traction ↔ Low Row",
          meta: "4 جولات",
          banner: { icon:"🦅", zoneTag:"🟢 ZONE", text:"عرض ↕ سمك الظهر · سحب رأسي + سحب أفقي · راحة <b>٦٠ ثانية</b>" },
          planB: "لو <b>Low Row مشغول</b> → استخدم <b>Pulley مع البار من القاعدة</b> (سحب أفقي بالكابل، نفس الفائدة)",
          steps: [
            { type: "set", name: "Vertical Traction — سيت ١", info: "٨-١٠ تكرار · ١٥ كجم · ظهر علوي عريض" },
            { type: "rest", name: "راحة ٦٠ ثانية + انتقال", info: "روح لـ Low Row" },
            { type: "set", name: "Low Row — سيت ١", info: "١٠-١٢ تكرار · ١٥ كجم · سمك الظهر الأوسط" },
            { type: "rest", name: "راحة ٦٠ ثانية + رجوع", info: "ارجع لـ Vertical Traction" },
            { type: "set", name: "Vertical Traction — سيت ٢", info: "٨-١٠ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Low Row — سيت ٢", info: "١٠-١٢ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Vertical Traction — سيت ٣", info: "٨-١٠ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Low Row — سيت ٣", info: "١٠-١٢ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Vertical Traction — سيت ٤ (الأخير)", info: "٨-١٠ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Low Row — سيت ٤ (الأخير)", info: "١٠-١٢ تكرار · انتهى الزوج A" }
          ]
        },
        // --- PAIR B: Chin Ups (Kneeling) ↔ Pulley (سحب أحادي) ---
        {
          type: "pair",
          label: "PAIR B",
          name: "Chin Ups (Kneeling) ↔ Pulley (سحب جانبي بذراع واحدة)",
          meta: "3 جولات",
          banner: { icon:"🎯", zoneTag:"🟢 ZONE", text:"عزل Lats · Chin Ups بقبضة عكسية + سحب أحادي للضلة · راحة <b>٦٠ ثانية</b>" },
          planB: "لو <b>Kneeling Easy مشغول</b> → استبدله بـ <b>Lat Machine بقبضة عكسية ضيقة</b> (تركيز قوي على Lats السفلية)",
          steps: [
            { type: "set", name: "Chin Ups (Kneeling) — سيت ١", info: "٨-١٢ تكرار · أثقل مساعدة ممكنة" },
            { type: "rest", name: "راحة ٦٠ ثانية + انتقال", info: "روح لجهاز Pulley" },
            { type: "set", name: "Pulley — سحب أحادي للضلة — سيت ١", info: "١٢ تكرار/ذراع · ٥-٧.٥ كجم · مدى حركة كامل" },
            { type: "rest", name: "راحة ٦٠ ثانية + رجوع", info: "—" },
            { type: "set", name: "Chin Ups — سيت ٢", info: "٨-١٢ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Pulley — سحب أحادي — سيت ٢", info: "١٢ تكرار/ذراع" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Chin Ups — سيت ٣ (الأخير)", info: "٨-١٢ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Pulley — سحب أحادي — سيت ٣ (الأخير)", info: "١٢ تكرار/ذراع · انتهى الزوج B" }
          ]
        },
        // --- PAIR C: Upper Back ↔ Reverse Fly ---
        {
          type: "pair",
          label: "PAIR C",
          name: "Upper Back ↔ Reverse Fly",
          meta: "3 جولات",
          banner: { icon:"⭐", zoneTag:"🟢 ZONE", text:"كثافة أعلى الظهر + كتف خلفي · راحة <b>٦٠ ثانية</b>" },
          planB: "لو <b>Upper Back مشغول</b> → استخدم <b>Low Row بقبضة عريضة</b> (يستهدف نفس المنطقة)",
          steps: [
            { type: "set", name: "Upper Back — سيت ١", info: "١٢-١٥ تكرار · ١٠ كجم · اضغط لوحي الكتف" },
            { type: "rest", name: "راحة ٦٠ ثانية + انتقال", info: "—" },
            { type: "set", name: "Reverse Fly — سيت ١", info: "١٢-١٥ تكرار · ٥ كجم · كتف خلفي" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Upper Back — سيت ٢", info: "١٢-١٥ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Reverse Fly — سيت ٢", info: "١٢-١٥ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Upper Back — سيت ٣ (الأخير)", info: "١٢-١٥ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Reverse Fly — سيت ٣ (الأخير)", info: "١٢-١٥ تكرار · ✓ انتهيت! 🎉", last: true }
          ]
        }
      ]
    },
    // ============================================================
    // اليوم الثالث: الثلاثاء — ARMS A
    // ============================================================
    {
      id: "arms-a",
      dayOfWeek: 2,
      shortName: "ثلا",
      type: "ARMS A",
      tagLabel: "ARMS",
      tagClass: "tpl",
      colorClass: "pull",
      label: "ARMS A — الترتيب الكامل خطوة بخطوة",
      description: "٢٠ سيت · ~٤٥ دقيقة · أسرع يوم",
      stats: { sets: 20, exercises: 6, pairs: 3, minutes: "~45" },
      finishTip: "<strong>انتهيت من ARMS A</strong> · ٢٢ خطوة · ~٤٥ دقيقة · أقصر يوم في الأسبوع.",
      phases: [
        {
          type: "warmup",
          label: "إحماء",
          name: "قبل البدء",
          steps: [
            { type: "warmup", name: "Skillrow — تجديف", info: "٥ دقائق" },
            { type: "warmup", name: "Arm Extension — مجموعة تسخين", info: "١٢ تكرار بنصف الوزن" }
          ]
        },
        // --- PAIR A: Arm Extension ↔ Arm Curl ---
        {
          type: "pair",
          label: "PAIR A",
          name: "Arm Extension ↔ Arm Curl",
          meta: "4 جولات",
          banner: { icon:"⭐", zoneTag:"🟢 ZONE", text:"منطقة الذراعين · الجهازان متجاوران · راحة <b>٦٠ ثانية</b>" },
          planB: "لو <b>Arm Curl مشغول</b> → استخدم <b>Pulley مع البار القصير من الأسفل</b> (Bicep Curl بالكابل)",
          steps: [
            { type: "set", name: "Arm Extension — سيت ١", info: "١٠-١٢ تكرار · ٢٠ كجم · ترايسبس" },
            { type: "rest", name: "راحة ٦٠ ثانية + انتقال", info: "روح لـ Arm Curl" },
            { type: "set", name: "Arm Curl — سيت ١", info: "١٠-١٢ تكرار · ١٠ كجم · بايسبس" },
            { type: "rest", name: "راحة ٦٠ ثانية + رجوع", info: "—" },
            { type: "set", name: "Arm Extension — سيت ٢", info: "١٠-١٢ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Arm Curl — سيت ٢", info: "١٠-١٢ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Arm Extension — سيت ٣", info: "١٠-١٢ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Arm Curl — سيت ٣", info: "١٠-١٢ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Arm Extension — سيت ٤ (الأخير)", info: "١٠-١٢ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Arm Curl — سيت ٤ (الأخير)", info: "١٠-١٢ تكرار · انتهى الزوج A" }
          ]
        },
        // --- PAIR B: Dips ↔ Chin Ups (نفس الجهاز) ---
        {
          type: "pair",
          label: "PAIR B",
          name: "Dips ↔ Chin Ups — نفس الجهاز!",
          meta: "3 جولات",
          banner: { icon:"🎯", zoneTag:"🟢 ZONE", text:"Kneeling Easy Chin Dip · فقط غيّر القبضة · راحة <b>٦٠ ثانية</b>" },
          planB: "نفس الجهاز يخدم الزوجين — احتمال المشكلة صفر",
          steps: [
            { type: "set", name: "Dips (Kneeling) — سيت ١", info: "٨-١٢ تكرار · أثقل مساعدة ممكنة" },
            { type: "rest", name: "راحة ٦٠ ثانية + تغيير القبضة", info: "من قبضة Dips لقبضة Chin Up" },
            { type: "set", name: "Chin Ups (Kneeling) — سيت ١", info: "٨-١٢ تكرار · بايسبس مركّب" },
            { type: "rest", name: "راحة ٦٠ ثانية + تغيير القبضة", info: "—" },
            { type: "set", name: "Dips — سيت ٢", info: "٨-١٢ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Chin Ups — سيت ٢", info: "٨-١٢ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Dips — سيت ٣ (الأخير)", info: "٨-١٢ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Chin Ups — سيت ٣ (الأخير)", info: "٨-١٢ تكرار · انتهى الزوج B" }
          ]
        },
        // --- PAIR C: Abdominal Crunch ↔ Rotary Torso ---
        {
          type: "pair",
          label: "PAIR C",
          name: "Abdominal Crunch ↔ Rotary Torso",
          meta: "3 جولات",
          banner: { icon:"⭐", zoneTag:"🟢 ZONE", text:"منطقة البطن · الجهازان متجاوران · راحة <b>٦٠ ثانية</b>" },
          planB: "لو الجهازان مشغولان → سوِّ <b>Plank على الأرض ٦٠ ث + Russian Twist بوزن</b>",
          steps: [
            { type: "set", name: "Abdominal Crunch — سيت ١", info: "١٥-٢٠ تكرار · ١٥ كجم" },
            { type: "rest", name: "راحة ٦٠ ثانية + انتقال", info: "—" },
            { type: "set", name: "Rotary Torso — سيت ١", info: "١٢ تكرار لكل جانب · ١٠ كجم" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Abdominal Crunch — سيت ٢", info: "١٥-٢٠ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Rotary Torso — سيت ٢", info: "١٢ تكرار/جانب" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Abdominal Crunch — سيت ٣ (الأخير)", info: "١٥-٢٠ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Rotary Torso — سيت ٣ (الأخير)", info: "١٢ تكرار/جانب · ✓ انتهيت! 🎉", last: true }
          ]
        }
      ]
    },
    // ============================================================
    // اليوم الرابع: الأربعاء — REST
    // ============================================================
    {
      id: "rest-wed",
      dayOfWeek: 3,
      shortName: "أرب",
      type: "REST",
      isRest: true,
      colorClass: "rest",
      label: "يوم راحة — مو يوم كسل!",
      description: "جسمك يبني العضل اليوم مو في الجيم",
      restNote: {
        icon: "🧘",
        text: "<strong>تفاصيل يوم الراحة:</strong><br>• تمشية خفيفة 20-30 دقيقة<br>• تمدد 10-15 دقيقة للعضلات المتعبة<br>• <b>كل وجباتك كاملة</b> — العضل يُبنى يوم الراحة فلا تقلل أكلك<br>• نام مبكر — حاول 8 ساعات"
      }
    },
    // ============================================================
    // اليوم الخامس: الخميس — UPPER B
    // ============================================================
    {
      id: "upper-b",
      dayOfWeek: 4,
      shortName: "خمي",
      type: "UPPER B",
      tagLabel: "UPPER",
      tagClass: "tp",
      colorClass: "push",
      label: "UPPER B — الترتيب الكامل خطوة بخطوة",
      description: "٢٢ سيت · ~٦٠ دقيقة · نبدأ بالأكتاف الثقيلة",
      stats: { sets: 22, exercises: 6, pairs: 3, minutes: "~60" },
      finishTip: "<strong>انتهيت من UPPER B</strong> · ٢٦ خطوة · ~٦٠ دقيقة",
      phases: [
        {
          type: "warmup",
          label: "إحماء",
          name: "قبل البدء",
          steps: [
            { type: "warmup", name: "Skillrow — تجديف", info: "٥ دقائق" },
            { type: "warmup", name: "Shoulder Press — مجموعة تسخين", info: "١٢ تكرار بنصف الوزن" }
          ]
        },
        // --- SOLO: Shoulder Press ثقيل ---
        {
          type: "solo",
          label: "SOLO",
          name: "Shoulder Press — وزن أثقل من Upper A",
          meta: "4 sets",
          steps: [
            { type: "solo-set", name: "Shoulder Press ثقيل — سيت ١", info: "٦-٨ تكرار · زد ٢.٥ كجم على وزن Upper A" },
            { type: "rest", name: "راحة ١٢٠ ثانية", info: "وزن ثقيل = راحة طويلة" },
            { type: "solo-set", name: "Shoulder Press — سيت ٢", info: "٦-٨ تكرار" },
            { type: "rest", name: "راحة ١٢٠ ثانية", info: "—" },
            { type: "solo-set", name: "Shoulder Press — سيت ٣", info: "٦-٨ تكرار" },
            { type: "rest", name: "راحة ١٢٠ ثانية", info: "—" },
            { type: "solo-set", name: "Shoulder Press — سيت ٤ (الأخير)", info: "٦-٨ تكرار · انتقل للزوج A" }
          ]
        },
        // --- PAIR A: Vertical Traction ↔ Chest Press بطيء ---
        {
          type: "pair",
          label: "PAIR A",
          name: "Vertical Traction ↔ Chest Press بطيء",
          meta: "4 جولات",
          banner: { icon:"🔄", zoneTag:"🟢 ZONE", text:"منطقة السحب/الدفع · في Chest Press انزل ببطء ٣ ثوان · راحة <b>٦٠ ثانية</b>" },
          planB: "لو <b>Vertical Traction مشغول</b> → استخدم <b>Lat Machine</b> (سحب عمودي عريض، نفس الفائدة)",
          steps: [
            { type: "set", name: "Vertical Traction — سيت ١", info: "٨-١٠ تكرار · ١٥ كجم" },
            { type: "rest", name: "راحة ٦٠ ثانية + انتقال", info: "—" },
            { type: "set", name: "Chest Press بطيء — سيت ١", info: "١٠-١٢ تكرار · انزل ٣ ث ارفع ١ ث" },
            { type: "rest", name: "راحة ٦٠ ثانية + رجوع", info: "—" },
            { type: "set", name: "Vertical Traction — سيت ٢", info: "٨-١٠ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Chest Press بطيء — سيت ٢", info: "١٠-١٢ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Vertical Traction — سيت ٣", info: "٨-١٠ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Chest Press بطيء — سيت ٣", info: "١٠-١٢ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Vertical Traction — سيت ٤ (الأخير)", info: "٨-١٠ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Chest Press بطيء — سيت ٤ (الأخير)", info: "١٠-١٢ تكرار · انتهى الزوج A" }
          ]
        },
        // --- PAIR B: Pulley (سحب) ↔ Crossover Cables ---
        {
          type: "pair",
          label: "PAIR B",
          name: "Pulley (سحب) ↔ Crossover Cables (صدر)",
          meta: "3 جولات",
          banner: { icon:"⭐", zoneTag:"🟢 ZONE", text:"منطقة الكابلات · تنقل سريع جداً · راحة <b>٦٠ ثانية</b>" },
          planB: "لو <b>Crossover مشغول</b> → استخدم <b>Pectoral Fly</b> بدلاً منه",
          steps: [
            { type: "set", name: "Pulley — سحب أفقي — سيت ١", info: "١٠-١٢ تكرار · ١٠ كجم" },
            { type: "rest", name: "راحة ٦٠ ثانية + تنقل", info: "روح لـ Crossover Cables" },
            { type: "set", name: "Crossover Cables — سيت ١", info: "١٠-١٢ تكرار · ٥ كجم/جانب" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Pulley — سيت ٢", info: "١٠-١٢ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Crossover Cables — سيت ٢", info: "١٠-١٢ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Pulley — سيت ٣ (الأخير)", info: "١٠-١٢ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Crossover Cables — سيت ٣ (الأخير)", info: "١٠-١٢ تكرار · انتهى الزوج B" }
          ]
        },
        // --- PAIR C: Reverse Fly ↔ Delts Machine ---
        {
          type: "pair",
          label: "PAIR C",
          name: "Reverse Fly ↔ Delts Machine",
          meta: "3 جولات",
          banner: { icon:"⭐", zoneTag:"🟢 ZONE", text:"منطقة الأكتاف · الجهازان متجاوران · راحة <b>٦٠ ثانية</b>" },
          planB: "لو الزوج مشغول → <b>Upper Back ↔ Pulley بوضع جانبي</b>",
          steps: [
            { type: "set", name: "Reverse Fly — سيت ١", info: "١٢-١٥ تكرار · ٥ كجم" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Delts Machine — سيت ١", info: "١٢-١٥ تكرار · ٥ كجم" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Reverse Fly — سيت ٢", info: "١٢-١٥ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Delts Machine — سيت ٢", info: "١٢-١٥ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Reverse Fly — سيت ٣ (الأخير)", info: "١٢-١٥ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Delts Machine — سيت ٣ (الأخير)", info: "١٢-١٥ تكرار · ✓ انتهيت! 🎉", last: true }
          ]
        }
      ]
    },
    // ============================================================
    // اليوم السادس: الجمعة — LEGS مختصر
    // ============================================================
    {
      id: "legs",
      dayOfWeek: 5,
      shortName: "جمع",
      type: "LEGS",
      tagLabel: "LEGS",
      tagClass: "tl",
      colorClass: "legs",
      label: "LEGS مختصر — يوم صيانة الأرجل",
      description: "١٤ سيت · ~٤٠ دقيقة · أرجل صيانة + بطن (تركيز الأسبوع على العلوي)",
      stats: { sets: 14, exercises: 5, pairs: 1, pairsLabel: "زوج", minutes: "~40" },
      dayIntro: { icon:"🦵", text:"<strong>الفكرة:</strong> أنت تركّز على العلوي. هذا يوم <b>صيانة</b> فقط — يبقي أرجلك قوية ويحافظ على الهرمونات (تستوستيرون + GH) بدون استنزاف. <b>لا تتعب نفسك</b> — كل طاقتك للعلوي." },
      finishTip: "<strong>انتهيت من LEGS مختصر</strong> · ١٧ خطوة · ~٤٠ دقيقة · يوم خفيف عن قصد — وفّر الطاقة ليوم الذراعين غداً.",
      phases: [
        {
          type: "warmup",
          label: "إحماء",
          name: "قبل البدء",
          steps: [
            { type: "warmup", name: "Skillrow — تجديف", info: "٥ دقائق" },
            { type: "warmup", name: "Leg Press — مجموعة تسخين", info: "١٥ تكرار بنصف الوزن" }
          ]
        },
        // --- SOLO: Leg Press ---
        {
          type: "solo",
          label: "SOLO",
          name: "Leg Press — تمرين الأرجل الأساسي",
          meta: "3 sets",
          steps: [
            { type: "solo-set", name: "Leg Press — سيت ١", info: "١٠-١٢ تكرار · ٥٠ كجم" },
            { type: "rest", name: "راحة ٩٠ ثانية", info: "—" },
            { type: "solo-set", name: "Leg Press — سيت ٢", info: "١٠-١٢ تكرار" },
            { type: "rest", name: "راحة ٩٠ ثانية", info: "—" },
            { type: "solo-set", name: "Leg Press — سيت ٣ (الأخير)", info: "١٠-١٢ تكرار" }
          ]
        },
        // --- PAIR A: Leg Extension ↔ Prone Leg Curl ---
        {
          type: "pair",
          label: "PAIR A",
          name: "Leg Extension ↔ Prone Leg Curl",
          meta: "3 جولات",
          banner: { icon:"⭐", zoneTag:"🟢 ZONE", text:"كوادز ↕ هامسترنغز · راحة <b>٦٠ ثانية</b>" },
          planB: "لو أحد الجهازين مشغول → <b>Leg Press بقدم منخفضة (هامسترنغز) ↔ Leg Press بقدم عالية (كوادز)</b>",
          steps: [
            { type: "set", name: "Leg Extension — سيت ١", info: "١٢-١٥ تكرار · ١٥ كجم" },
            { type: "rest", name: "راحة ٦٠ ثانية + انتقال", info: "—" },
            { type: "set", name: "Prone Leg Curl — سيت ١", info: "١٢-١٥ تكرار · ١٠ كجم" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Leg Extension — سيت ٢", info: "١٢-١٥ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Prone Leg Curl — سيت ٢", info: "١٢-١٥ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Leg Extension — سيت ٣ (الأخير)", info: "١٢-١٥ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Prone Leg Curl — سيت ٣ (الأخير)", info: "١٢-١٥ تكرار · انتهى الزوج A" }
          ]
        },
        // --- SOLO: Calf Raise + Abdominal Crunch ---
        {
          type: "solo",
          label: "SOLO",
          name: "Calf Raise + Abdominal Crunch",
          meta: "3 + 3 sets",
          steps: [
            { type: "solo-set", name: "Calf Raise على Leg Press — سيت ١", info: "٢٠ تكرار" },
            { type: "rest", name: "راحة ٣٠ ثانية", info: "—" },
            { type: "solo-set", name: "Calf Raise — سيت ٢", info: "٢٠ تكرار" },
            { type: "rest", name: "راحة ٣٠ ثانية", info: "—" },
            { type: "solo-set", name: "Calf Raise — سيت ٣ (الأخير)", info: "٢٠ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية + تنقل لجهاز البطن", info: "—" },
            { type: "solo-set", name: "Abdominal Crunch — سيت ١", info: "٢٠ تكرار · ١٥ كجم" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "solo-set", name: "Abdominal Crunch — سيت ٢", info: "٢٠ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "solo-set", name: "Abdominal Crunch — سيت ٣ (الأخير)", info: "٢٠ تكرار · ✓ انتهيت! 🎉", last: true }
          ]
        }
      ]
    },
    // ============================================================
    // اليوم السابع: السبت — ARMS B
    // ============================================================
    {
      id: "arms-b",
      dayOfWeek: 6,
      shortName: "سبت",
      type: "ARMS B",
      tagLabel: "ARMS",
      tagClass: "tpl",
      colorClass: "pull",
      label: "ARMS B — الترتيب الكامل خطوة بخطوة",
      description: "٢٢ سيت · ~٥٠ دقيقة · ابدأ بالمركّب الذراعي",
      stats: { sets: 22, exercises: 8, pairs: 4, minutes: "~50" },
      finishTip: "<strong>انتهيت من ARMS B = انتهيت الأسبوع كاملاً!</strong> · ٢٨ خطوة · ~٥٠ دقيقة · يوم الأحد القادم تبدأ UPPER A بأوزان أعلى (لو أكملت كل التكرارات بسهولة).",
      phases: [
        {
          type: "warmup",
          label: "إحماء",
          name: "قبل البدء",
          steps: [
            { type: "warmup", name: "Skillrow — تجديف", info: "٥ دقائق" },
            { type: "warmup", name: "تسخين Kneeling Easy Chin Dip", info: "٥ تكرار Chin Up + ٥ تكرار Dip بمساعدة قصوى" }
          ]
        },
        // --- PAIR A: Chin Ups ↔ Dips (نفس الجهاز) ---
        {
          type: "pair",
          label: "PAIR A",
          name: "Chin Ups ↔ Dips (نفس الجهاز)",
          meta: "4 جولات",
          banner: { icon:"🎯", zoneTag:"🟢 ZONE", text:"Kneeling Easy Chin Dip · فقط غيّر القبضة · راحة <b>٦٠ ثانية</b>" },
          planB: "نفس الجهاز يخدم الزوجين — احتمال المشكلة صفر",
          steps: [
            { type: "set", name: "Chin Ups — سيت ١", info: "٦-١٠ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية + تغيير القبضة", info: "من Chin Up لـ Dip" },
            { type: "set", name: "Dips — سيت ١", info: "٦-١٠ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية + تغيير القبضة", info: "—" },
            { type: "set", name: "Chin Ups — سيت ٢", info: "٦-١٠ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Dips — سيت ٢", info: "٦-١٠ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Chin Ups — سيت ٣", info: "٦-١٠ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Dips — سيت ٣", info: "٦-١٠ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Chin Ups — سيت ٤ (الأخير)", info: "٦-١٠ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Dips — سيت ٤ (الأخير)", info: "٦-١٠ تكرار · انتهى الزوج A" }
          ]
        },
        // --- PAIR B: Arm Curl ↔ Arm Extension (بطيء) ---
        {
          type: "pair",
          label: "PAIR B",
          name: "Arm Curl ↔ Arm Extension (بطيء)",
          meta: "3 جولات",
          banner: { icon:"🐌", zoneTag:"🟢 ZONE", text:"منطقة الذراعين · انزل ببطء عد ٣ ثوان · راحة <b>٦٠ ثانية</b>" },
          planB: "لو أحدهما مشغول → استخدم <b>Pulley</b> (نفس الفائدة بالكابل)",
          steps: [
            { type: "set", name: "Arm Curl بطيء — سيت ١", info: "١٢-١٥ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Arm Extension بطيء — سيت ١", info: "١٢-١٥ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Arm Curl — سيت ٢", info: "١٢-١٥ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Arm Extension — سيت ٢", info: "١٢-١٥ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Arm Curl — سيت ٣ (الأخير)", info: "١٢-١٥ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Arm Extension — سيت ٣ (الأخير)", info: "١٢-١٥ تكرار · انتهى الزوج B" }
          ]
        },
        // --- PAIR C: Pulley Curl ↔ Pulley Pushdown ---
        {
          type: "pair",
          label: "PAIR C",
          name: "Pulley Curl ↔ Pulley Pushdown (نفس الكابل)",
          meta: "3 جولات",
          banner: { icon:"🎯", zoneTag:"🟢 ZONE", text:"جهاز Pulley · غيّر ارتفاع الكابل فقط · راحة <b>٦٠ ثانية</b>" },
          planB: "نفس الجهاز — احتمال المشكلة صفر · لو Pulley مشغول → استخدم <b>Arm Curl ↔ Arm Extension</b> مرة ثانية",
          steps: [
            { type: "set", name: "Pulley — Bicep Curl — سيت ١", info: "١٢ تكرار · كابل سفلي · بار قصير" },
            { type: "rest", name: "راحة ٦٠ ثانية + تغيير", info: "انقل الكابل للأعلى" },
            { type: "set", name: "Pulley — Tricep Pushdown — سيت ١", info: "١٢ تكرار · كابل علوي · مقبض" },
            { type: "rest", name: "راحة ٦٠ ثانية + تغيير", info: "—" },
            { type: "set", name: "Pulley Curl — سيت ٢", info: "١٢ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Pulley Pushdown — سيت ٢", info: "١٢ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Pulley Curl — سيت ٣ (الأخير)", info: "١٢ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Pulley Pushdown — سيت ٣ (الأخير)", info: "١٢ تكرار · انتهى الزوج C" }
          ]
        },
        // --- PAIR D: Hanging Leg Raise ↔ Rotary Torso ---
        {
          type: "pair",
          label: "PAIR D",
          name: "Hanging Leg Raise ↔ Rotary Torso",
          meta: "3 جولات",
          banner: { icon:"🔄", zoneTag:"🟢 ZONE", text:"منطقة البطن · راحة <b>٦٠ ثانية</b>" },
          planB: "لو Hanging Leg Raise مشغول → <b>Abdominal Crunch بدلاً منه</b>",
          steps: [
            { type: "set", name: "Hanging Leg Raise — سيت ١", info: "١٠-١٥ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Rotary Torso — سيت ١", info: "١٢/جانب" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Hanging Leg Raise — سيت ٢", info: "١٠-١٥ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Rotary Torso — سيت ٢", info: "١٢/جانب" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Hanging Leg Raise — سيت ٣ (الأخير)", info: "١٠-١٥ تكرار" },
            { type: "rest", name: "راحة ٦٠ ثانية", info: "—" },
            { type: "set", name: "Rotary Torso — سيت ٣ (الأخير)", info: "١٢/جانب · ✓ انتهيت الأسبوع! 🎉", last: true }
          ]
        }
      ]
    }
  ]
};

/* ============================================================
 * V8.3 — EXERCISE FORM NOTES (3.2)
 * ============================================================
 * ملاحظات أداء مختصرة لكل تمرين، تُعرض عبر زر ℹ️ بجانب اسم التمرين.
 * المفاتيح يجب أن تطابق نتيجة normalizeExName(getExerciseName(step)).
 * gif: مسار محلي اختياري (لا CDN — حفاظاً على الوضع الـ offline).
 *      ضع الملفات في مجلد assets/gifs/ بحجم 50-100KB لكل ملف.
 * ============================================================ */
const EXERCISE_FORM_NOTES = {
  "Chest Press": {
    title: "Chest Press — ضغط صدر",
    formNote: "<b>الأسلوب الصحيح:</b><br>• اجلس وظهرك ملصوق بالمسند بالكامل<br>• المقابض بمستوى صدرك (عدّل المقعد)<br>• ادفع للأمام بدون قفل الكوع<br>• ارجع <b>ببطء</b> — هذا الجزء الأهم<br><br>⚠️ لا ترمي الوزن للخلف، تحكّم في الحركة كاملة.",
    gif: null
  },
  "Pectoral Fly": {
    title: "Pectoral Fly — تفتيح صدر",
    formNote: "<b>الأسلوب الصحيح:</b><br>• اجلس وظهرك ملصوق<br>• جيب الذراعين لقدام لين يلتقون أمام صدرك<br>• حس بالضغط على عضلة الصدر<br>• ارجع <b>ببطء</b> لين تحس بتمدد<br><br>⚠️ لا تفتح أكثر من اللازم — تجنّب إجهاد الكتف.",
    gif: null
  },
  "Shoulder Press": {
    title: "Shoulder Press — ضغط أكتاف",
    formNote: "<b>الأسلوب الصحيح:</b><br>• اجلس — المقابض بمستوى أذنك تقريباً<br>• ادفع لفوق بدون قفل الكوع<br>• انزل ببطء لين المقبض يرجع بمستوى أذنك<br><br>⚠️ الكتف عضلة صغيرة — ابدأ خفيف وزد تدريجياً.",
    gif: null
  },
  "Delts Machine": {
    title: "Delts Machine — كتف جانبي",
    formNote: "<b>الأسلوب الصحيح:</b><br>• الوسائد على ذراعك من الخارج (فوق الكوع)<br>• ارفع للجانب لين يوصل مستوى الكتف<br>• <b>لا ترفع أعلى من الكتف</b><br>• انزل ببطء<br><br>⚠️ الحركة بطيئة ومتحكمة — لا أرجحة.",
    gif: null
  },
  "Lat Machine": {
    title: "Lat Machine — سحب عمودي",
    formNote: "<b>الأسلوب الصحيح:</b><br>• ثبّت فخذك تحت الوسادة<br>• قبضة عريضة من فوق<br>• اسحب البار لصدرك — <b>تخيّل كوعك يدخل جيبك</b><br>• ارجع ببطء وبتحكم<br><br>⚠️ لا تسحب لخلف الرقبة — خطر على الكتف.",
    gif: null
  },
  "Low Row": {
    title: "Low Row — سحب أفقي",
    formNote: "<b>الأسلوب الصحيح:</b><br>• صدرك ملصوق بالوسادة الأمامية<br>• اسحب لصدرك — اجمع لوحين الظهر<br>• ارجع ببطء — احتفظ بتوتر الظهر<br><br>⚠️ لا تستخدم الذراع فقط — الحركة من الظهر.",
    gif: null
  },
  "Reverse Fly": {
    title: "Reverse Fly — خلف الكتف",
    formNote: "<b>الأسلوب الصحيح:</b><br>• ووجهك مقابل الجهاز (عكس Pectoral Fly)<br>• صدرك على الوسادة<br>• ادفع الذراعين للخلف — افتح صدرك<br>• ارجع ببطء<br><br>⚠️ عضلة صغيرة جداً — ابدأ بـ ٥ كجم فقط.",
    gif: null
  },
  "Crossover Cables": {
    title: "Crossover Cables — كابل صدر",
    formNote: "<b>الأسلوب الصحيح:</b><br>• قف بين العمودين، الكابل بارتفاع الكتف<br>• خطوة للأمام، جيب يديك لقدام لين يلتقون<br>• حس بضغط على الصدر<br>• ارجع ببطء وافتح الصدر<br><br>✅ ميزته: تمدد أعمق من Pectoral Fly.",
    gif: null
  }
};
