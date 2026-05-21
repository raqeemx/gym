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
    }
    // ============================================================
    // الأيام التالية ستُضاف في الـ pass التالي بعد المراجعة:
    // - BACK & WINGS (الإثنين)
    // - ARMS A (الثلاثاء)
    // - REST (الأربعاء)
    // - UPPER B (الخميس)
    // - LEGS (الجمعة)
    // - ARMS B (السبت)
    // ============================================================
  ]
};
