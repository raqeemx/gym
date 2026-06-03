# سجل التغييرات (CHANGELOG)

كل التغييرات الملحوظة بين الإصدارات.
رقم الإصدار الحالي مصدره الوحيد: [`js/version.js`](js/version.js).

---

## [V9.14.11 — أنواع بطاقات · مؤقت مرتبط بالتالي · تغذية مختصرة · بلا تسميات تقنية] — 2026-06-03

معالجة المشاكل 6–10:

6. **أنواع بطاقات متمايزة** ([`css/styles.css`](css/styles.css) + [`js/dashboard.js`](js/dashboard.js)): شريط حافة ولون عنوان لكل نوع — فعل (ذهبي) · إحصائي (أزرق) · تمرين/أوزان (أخضر) · تحذير (برتقالي) · شرح/دليل (مكتوم رمادي) — ليُميّز المستخدم الأهم بنظرة.

7. **التنقّل السفلي**: مكتمل من 9.14.9 (اليوم · التمارين · تقدمي · التغذية · المزيد + زر راحة أثناء الجلسة)؛ وُحّدت تسمية «التقدم» → «تقدمي».

8. **مؤقت الراحة مرتبط بالتمرين التالي** ([`index.html`](index.html) + [`js/session.js`](js/session.js)): عند بدء الراحة تظهر «التالي بعد الراحة: اسم التمرين · الوزن · التكرارات» + زر «🔄 عرض البديل»، بالإضافة لـ +30/تخطّي الموجودين. عبر `renderNextUp` الذي يجد أول سيت مُعلّق.

9. **تغذية الرئيسية مختصرة** ([`js/dashboard.js`](js/dashboard.js)): بروتين اليوم + الماء (شريطان) + وجبة قبل/بعد التمرين فقط؛ السعرات والماكروز وتفاصيل ٦ وجبات تبقى في تبويب التغذية.

10. **إزالة التسميات التقنية** ([`js/version.js`](js/version.js) + [`index.html`](index.html)): العنوان صار «BULK MODE» بلا V9، وأُزيلت كل إشارات «V4» من محتوى الدليل والتمارين (استُبدلت بـ«النظام/البرنامج»). رقم البناء يبقى صغيراً في الفوتر فقط للدعم.

تحقّق آلي بـ headless Chrome (يوم تدريبي): أنواع البطاقات مطبّقة، التغذية مختصرة بلا سعرات/ماكروز، المؤقت يعرض التالي + زر البديل، الشريط السفلي صحيح، صفر «V4»، صفر أخطاء. bump إلى 9.14.11.

---

## [V9.14.10 — تحسينات UX: الفعل أولاً · أوزان قابلة للبحث · Plan B بارز · مستويان] — 2026-06-03

معالجة ٥ مشاكل تصميم/تجربة:

1+2. **كثافة المعلومات / تمرين اليوم مركز التجربة** ([`js/dashboard.js`](js/dashboard.js)): أُعيد ترتيب الرئيسية — بطاقة «تمرين اليوم» أولاً مباشرةً (٤ إحصاءات: المدة · التمارين · السيتات · الراحة + زر مهيمن «💪 ابدأ تمرين اليوم»)، والشرح الطويل صار قسماً مطويّاً «📖 افهم البرنامج بعمق» في الأسفل.

3. **مستويان واضحان** ([`index.html`](index.html)): درج «المزيد» قُسّم بعناوين — «📂 أقسام» (تصفّح) و«🛠 أدوات وإعدادات». الاستخدام اليومي (اليوم/التمارين/التقدم/التغذية) في الشريط السفلي، والأدوات في الدرج.

4. **الأوزان كبطاقات قابلة للبحث** ([`js/dashboard.js`](js/dashboard.js)): بدل قائمة نصية — مربع بحث + بطاقة لكل تمرين (الاسم · الوزن الحالي الكبير · «آخر مرة: ٥٠كجم × ٩» · «المقترح: …» ملوّن حسب نوع التقدّم عبر `computeProgression`).

5. **Plan B بارز** ([`js/substitutions.js`](js/substitutions.js)): زر مُعَنوَن «🔄 الجهاز مشغول؟» كصف مستقل أسفل كل تمرين (مرة واحدة لكل تمرين/يوم، لا لكل سيت) يفتح bottom sheet بالبدائل فوراً.

**إصلاح جذري مكتشَف أثناء العمل** ([`js/data.js`](js/data.js)): `getExerciseName` كان يقرأ الاسم الثنائي مدموجاً («Chest Pressضغط صدر») بعد `applyBilingualNames`، فلا يطابق مفاتيح البدائل — **كان يكسر كل نقرات البدائل بعد عرض التمارين**. الآن يعتمد على `.sn-en` القانوني.

تحقّق آلي بـ headless Chrome (يوم تدريبي + يوم راحة): الترتيب صحيح، البطاقة بـ٤ إحصاءات، الأوزان قابلة للبحث، البدائل تفتح الـ bottom sheet، صفر أخطاء. bump إلى 9.14.10.

---

## [V9.14.9 — إزالة كل الأيقونات العائمة ونقلها لأماكن ثابتة] — 2026-06-01

بناءً على طلب المستخدم: لا أيقونات عائمة. أُزيلت/أُخفيت كل العناصر `position:fixed` العائمة ونُقلت وظائفها لأماكن ثابتة، على الموبايل وسطح المكتب:

- **زر الـ FAB العائم (📊) + قائمته** ([`index.html`](index.html)): حُذف نهائياً. أدواته (الملف الشخصي، الحاسبة، الجيمات، الثيم، تصدير، استيراد، الجولة) انتقلت لدرج «المزيد» — يُفتح من زر «المزيد» بالشريط السفلي على الموبايل، ومن زر «⋯ المزيد» جديد بالشريط العلوي على سطح المكتب (دالة `openBnDrawer` في [`js/ui-v99.js`](js/ui-v99.js)).
- **مؤقت الراحة** (كان عائماً وسط الأسفل): صار زراً ثابتاً يظهر أثناء الجلسة فقط — في الشريط السفلي على الموبايل (`#bnTimer`)، وفي شريط الجلسة العلوي على سطح المكتب (`.sb-timer`). العنصر `#tTrig` يبقى مخفياً في DOM للحفاظ على منطق `showT/hideT`.
- **شارة الأسبوع العائمة + زر العودة للأعلى + شارة الجلسة المصغّرة + زر التصغير**: أُخفيت (معلومات الأسبوع موجودة في الرئيسية وشريط الجلسة).
- تحديث `applyTheme` ([`js/session.js`](js/session.js)) ليحدّث عنصر الثيم الجديد في الدرج.

تحقّق آلي بـ headless Chrome (390px + 1280px): صفر عناصر عائمة ظاهرة، الدرج يفتح بكل الأدوات على المنصتين، المؤقت يظهر في مكانه الصحيح لكل منصة أثناء الجلسة، التنقّل من الشريط/الدرج يعمل، صفر أخطاء. bump إلى 9.14.9.

---

## [V9.14.8 — إصلاح شارة الأسبوع الممتدة على الموبايل + متانة استيراد النسخ القديمة] — 2026-06-01

تدقيق شامل (فحص ثابت لكل معالجات `onclick`/`onchange` الـ54 + تدقيق وقت تشغيل بـ headless Chrome عبر كل التبويبات والنوافذ) كشف وأصلح:

**شارة الأسبوع/شارة الجلسة الممتدة عمودياً على الموبايل** ([`css/styles.css`](css/styles.css)): قاعدة الموبايل كانت تضبط `bottom` دون إلغاء `top` الأساسي (`top:60px` لـ `.week-float`، `top:14px` لـ `.sess-pill`)، فيُطبّق الاثنان فيتمدد العنصر شريطاً عمودياً طويلاً (كما في صورة المستخدم). الإصلاح: `top:auto` في قاعدة الموبايل → شارة مدمجة فوق التنقّل السفلي.

**أعطال استيراد النسخ القديمة/التالفة** ([`js/progress.js`](js/progress.js), [`js/data.js`](js/data.js)):
- `Invalid time value` في `renderPRs`: `Math.max` على تواريخ `NaN` ثم `new Date(NaN).toISOString()`. الإصلاح: تصفية التواريخ التالفة + حارس `isFinite`.
- تصلّب `fmtDate` ضد التواريخ غير الصالحة (تُرجع '').
- **تطبيع عند الاستيراد**: أي `startTime`/`date` غير صالح في النسخة المستوردة → '' (نقطة واحدة تمنع crashes في `split`/`localeCompare`/`toISOString` عبر ~15 موضع قراءة)، + استرجاع `exerciseName` من حقل `exercise` القديم في الـ PRs.

تحقّق آلي: استيراد نسخ واقعية قديمة + نسخ بتواريخ تالفة + جلسات بلا `startTime` → صفر أخطاء، صفر loaders عالقة، البرنامج النشط القديم يرجع للافتراضي، الملف الشخصي يُستعاد. bump إلى 9.14.8.

---

## [V9.14.7 — تحسين الإشعارات على الموبايل + إبراز واكتمال استيراد البيانات] — 2026-06-01

**الإشعارات (toast) على الموبايل** ([`css/styles.css`](css/styles.css)): قاعدة `@media (max-width:600px)` مخصّصة — شريط بعرض مريح (هامش ١٢px من كل جانب) فوق التنقّل السفلي مباشرةً، يحترم `safe-area-inset`، خط أوضح ونص يلتف، فلا يتداخل مع الـ bottom-nav ولا يُقتطع على الشاشات المنحوتة.

**استيراد البيانات** — كان موجوداً لكنه (أ) كان معطّلاً قبل 9.14.6 بسبب خطأ تحليل `progress.js`، (ب) مدفوناً تحت "⋯ مزيد":
- إبراز: زر «📥 استيراد البيانات» صار في أعلى قائمة الـ FAB بجوار التصدير، وأُضيف «📥 استيراد نسخة احتياطية» في نافذة الإحصائيات.
- اكتمال ([`js/progress.js`](js/progress.js)): التصدير والاستيراد صارا يشملان `foodEntries` (سجل التغذية)، والاستيراد صار يستعيد `settings` (الملف الشخصي/الجيمات/إعدادات البرنامج) مع تخطّي مفاتيح الجلسة/الترحيل حتى لا تُستعاد حالة جلسة قديمة.
- تحقّق آلي بـ headless Chrome (موبايل): الزر ظاهر، ودورة استيراد كاملة تستعيد السيتات/التغذية/الملف الشخصي وتتخطّى `session:current`.

bump إلى 9.14.7 لتغيير CACHE_NAME.

---

## [V9.14.6 — إصلاح جذري: أقسام "تقدّمي" عالقة على «جاري التحميل…»] — 2026-06-01

السبب الجذري: الدالة `renderDailyLogStats` في [`js/progress.js`](js/progress.js) كانت تستخدم `await` وهي **ليست `async`** → خطأ تحليل (`await is only valid in async functions`) **يُعطّل ملف `progress.js` بالكامل**. فلم تُعرّف `renderAchievements`/`renderPRs`/`renderRecovery` ولا معالجات النقر على التبويبات الفرعية ولا `checkExportReminder` → بقيت بطاقات «جاري التحميل…» عالقة في صفحة "تقدّمي" والتبويبات الفرعية لا تتبدّل.

- الإصلاح: `async function renderDailyLogStats(...)` (المستدعي fire-and-forget، آمن).
- التحقّق: فحص آلي بـ headless Chrome — كل التبويبات الفرعية (إنجازات/راحة/تحليلات/قياسات/يومي/صور) نظيفة بلا علوق، واختفت أخطاء console (`pageerror` + `ReferenceError: checkExportReminder`).
- bump إلى 9.14.6 لتغيير CACHE_NAME.

---

## [V9.14.5 — تصلّب آلية تحديث الـ PWA: التعديلات تظهر دائماً] — 2026-06-01

السبب الجذري لـ"التحديثات لا تظهر": الموقع المنشور والكود سليمان (تحقّقنا أن GitHub Pages يحمل آخر إصدار وكل أصول الـ SW تُرجع 200)، لكن كاش الـ PWA على الجهاز كان بطيئاً في كشف النسخة الجديدة. الإصلاح في تسجيل الـ Service Worker ([`js/app.js`](js/app.js)):

- `register(..., {updateViaCache:'none'})` → المتصفح يفحص `service-worker.js` و`js/version.js` من الشبكة مباشرة (لا من كاش HTTP الذي يصل ١٠ دقائق على GitHub Pages) فيلاحظ تغيّر رقم الإصدار فوراً.
- `reg.update()` عند عودة المستخدم للتطبيق (`visibilitychange` + `focus`) → الـ PWA يبقى مفتوحاً أياماً، فنفحص نسخة جديدة كلما رجع بدل انتظار إعادة فتح كاملة.
- معالجة `reg.waiting` (نسخة منتظِرة وقت فتح الصفحة) إضافةً إلى `updatefound`.
- bump إلى 9.14.5 لتغيير CACHE_NAME وإجبار SW على تحميل النسخة الجديدة.

---

## [V9.14.1 — حذف الـ Hero الخارجي القديم] — 2026-05-31

- حُذف `<div class="hero" id="heroEl">` الخارجي من index.html (كان يعرض "BULK V4 · PEAK-HOUR OPTIMIZED · برنامج التضخيم النهائي")
- الـ Hero الجديد في V9.14 (داخل `#dashboardContainer`) يُغطّي نفس الغرض بصورة أنظف
- دوال `toggleHero`, `setupHeroCollapse`, `updateHeroCompactWeek` في session.js تتحقّق `if(!hero) return` فلا تُسبّب أخطاء بعد الحذف
- bump إلى 9.14.1 لتغيير CACHE_NAME وإجبار SW على تحميل النسخة الجديدة

---

## [V9.14 — Homepage Redesign: Hero + Today's Workout Card + Program Summary] — 2026-05-31

إعادة هيكلة الصفحة الرئيسية لتجيب على ٣ أسئلة فورية:
**ما هذا البرنامج؟ · ماذا سأستفيد؟ · ما أول زر أضغطه الآن؟**

### ✨ 1. Hero Section (تفسيري ومباشر)
- Title: **"برنامج تضخيم ١٢ أسبوع — اتبع تمرين اليوم فقط"**
- Description: شرح موجز للبرنامج مع تأكيد على Plan B
- ٣ أزرار:
  - 💪 **ابدأ تمرين اليوم** (primary، ذهبي)
  - 📅 **شاهد جدول الأسبوع** (secondary، يفتح التقويم)
  - 🎯 **أول مرة في الجيم؟** (tertiary، dashed border)
- **collapse-by-default للمستخدمين النشطين** (٥+ جلسات) عبر `<details>` — توفير المساحة بعد فهم البرنامج
- Visual: gradient ذهبي خفيف + radial highlight ذهبي

### ✨ 2. Today's Workout Card (أهم عنصر في الصفحة)
- ribbon: **⭐ تمرين اليوم**
- **معلومات Grid:**
  - اليوم: الأحد
  - الجلسة: UPPER A
  - الهدف: صدر · ظهر · أكتاف (مُستخرَج من `DAY_TARGETS` map)
- **Stats Grid (٣ بطاقات):**
  - ⏱ ٥٥ دقيقة
  - 🏋 ٨ تمارين (من `todayProg.stats.exercises`)
  - ⏸ ٦٠–٩٠ ثانية راحة
- **Progress line:**
  - افتراضياً: `📊 التقدم: 0/8 تمارين` (dashed)
  - بعد اكتمال اليوم: `✓ اكتمل اليوم · ٢٢ سيت` (أخضر)
- **First Exercise:** `▶ أول تمرين: Chest Press` (dashed border ذهبي)
- **٣ أزرار:**
  - 💪 **ابدأ الجلسة** (primary كبير)
  - **عرض التمارين** (secondary)
  - 🔄 **الجهاز مشغول؟** (tertiary أزرق، يفتح Plan B Hint)
- **حالات:**
  - يوم تدريب → البطاقة الكاملة كما أعلاه
  - يوم راحة → `tc-rest-badge` + رسالة هادئة + Smart Reco إذا مناسب
  - جلسة نشطة → `tc-pulse` نبضة حمراء + ↩ ارجع للجلسة

### ✨ 3. Program Quick Summary (٦ مصغّرات)
- شبكة ٣×٢ بعد بطاقة اليوم مباشرة:
  - 📅 ١٢ أسبوع
  - 💪 ٦ أيام تمرين
  - ⏱ ٥٢-٥٧ دقيقة للجلسة
  - ⏸ ٦٠ ث راحة
  - 🥩 ١٧٥g بروتين
  - 🔄 Plan B لكل تمرين
- الأرقام تظهر كقرارات سريعة (ذهبية) — لا كزينة

### 🗑 محذوف
- `_statusStrip` (sliver chips) — استُبدل بـ Hero Section
- `_primaryHero` (V9.11) — استُبدل بـ Today's Workout Card الأكثر تفصيلاً

### 🛠 ملفات معدّلة
- `js/dashboard.js` — أُضيف:
  - `DAY_TARGETS` map (UPPER A → صدر·ظهر·أكتاف، etc.)
  - `_muscleTargets(dayType)` — يستخرج الأهداف العضلية
  - `_firstExerciseName(day)` — أول تمرين بعد warmup
  - `_heroSection(workouts)` — البلوك التفسيري
  - `_todayWorkoutCard(...)` — البطاقة الكبيرة (٣ حالات: تدريب/راحة/جلسة-نشطة)
  - `_programQuickSummary()` — شبكة المصغّرات
  - `main render`: استبدل StatusStrip+PrimaryHero بـ Hero+TodayCard+Summary
- `css/styles.css` — قسم V9.14 (~400 سطر): `hero-v14`، `hv-*`، `today-card`، `tc-*`، `program-summary-grid`، `psg-*`
- `index.html` — بدون تعديل (الكل ديناميكي)

### 📐 تسلسل الصفحة الرئيسية الجديد
1. Hero Section (collapsible)
2. Profile-missing strip (شرطي)
3. **Today's Workout Card** ← الأكبر
4. Program Quick Summary (٦ badges)
5. Top Progress Card (V9.13)
6. Quick Stats (٣)
7. Week Grid
8. Next Achievement (شرطي)
9. PRs Carousel
10. Nutrition + Next Meal
11. Quick Actions

---

## [V9.13 — Gym Mode + Bottom Nav + Inline Plan B + Progress Card] — 2026-05-31

حلّ ٧ مشاكل UX (#4-#10): Plan B داخل كل تمرين، وضع Gym Mode للجلسات، تنقّل سفلي على الموبايل، أوزان مع +/-، ملخص تغذية مع الوجبة التالية، بطاقة تقدم في الأعلى، تصميم أهدأ للجلسة.

### ✨ #4 — Plan B داخل بطاقة التمرين
- لكل step تدريبي، يُحقن سطر `inline-planb` مباشرة تحت `step-info`:
  `🔄 الجهاز مشغول؟ استخدم: Vertical Traction [بدّل]`
- البديل المعروض: أفضل بديل من `EXERCISE_ALTERNATIVES[exName]` (فلتر حسب الجيم النشط + `peakFriendly` في ساعات الذروة ١٨-٢١)
- زر "بدّل" → ينفّذ `applySubstitution(stepId, name)` مباشرة + toast تأكيد
- يُحقن تلقائياً عبر MutationObserver عند توليد أي step جديد

### ✨ #5 + #10 — Gym Mode (وضع تمرين واحد في كل مرة، تصميم أهدأ)
- زر `🎯` جديد في `sess-bar` بجانب Focus
- عند التفعيل: overlay full-screen يحلّ محل كل واجهة t1
- يعرض **تمريناً واحداً** فقط في وقت معيّن:
  - اسم التمرين (ثنائي اللغة، 36px)
  - بطاقة الوزن: `[−]  15  [+] كجم` (أزرار 56px ضخمة)
  - بطاقة التكرارات: `[−]  8  [+]`
  - "آخر مرة" line
  - زر `✓ تم السيت` كبير أخضر
  - `⏭ تخطّى` و `🔄 بديل` ثانوية
- عند الضغط على "تم السيت":
  1. يملأ track-input الحقيقي + ينقر save تلقائياً (تكامل مع saveSet/PRs/إنجازات)
  2. ينبثق **Rest Timer** بخط 128px في منتصف الشاشة + معاينة التمرين التالي
  3. زرّان: `⏭ تخطّى الراحة` و `+30ث`
  4. بعد انتهاء الراحة: ينتقل تلقائياً للسيت التالي
- بعد آخر سيت: شاشة `🏆 انتهت الجلسة!` مع زر إنهاء الجلسة
- **التصميم الأهدأ (#10):**
  - خلفية واحدة `#0A0B0E` (بدون gradient)
  - بطاقات بـ border خفيف فقط، بدون gradients كثيرة
  - نصوص أكبر بـ ٢-٣ مرات من العرض العادي
  - ظلال خفيفة، تركيز على التباين

### ✨ #6 — Bottom Nav (موبايل فقط)
- على الموبايل فقط (`max-width:600px`): إخفاء nav العلوي، إظهار `.bottom-nav`
- ٥ أزرار: `🏠 اليوم` · `💪 التمارين` · `📈 التقدم` · `🥗 التغذية` · `⋯ المزيد`
- "المزيد" يفتح drawer من الأسفل مع ٨ خيارات: التقويم، الدليل، زيادة الأوزان، نصائح، أول مرة، الملف الشخصي، حاسبة بليتات، إدارة الجيمات
- مزامنة تلقائية للـ active state عند تبديل tab من أي مكان
- يحترم `safe-area-inset-bottom` للـ notch
- ضبط مواضع: FAB، btt، sess-pill، week-float، ttrig كلها ترتفع لتجنّب التراكب

### ✨ #7 — Weight Chip مع أزرار +/-
- داخل `weight-chip`، الـ value الكبير صار محاطاً بزرّين دائريين:
  `[−]  15  [+]`
- خطوة افتراضية ٢.٥ كجم
- **Long-press على ±** يقفز ٥ كجم
- سطر إضافي `آخر مرة: 12 كجم × 8` تحت
- زر "تطبيق" يحوّل القيمة المُعدّلة إلى track-input

### ✨ #8 — ملخص تغذية + الوجبة التالية
- بطاقة Nutrition في Dashboard أصبحت تعرض:
  - ٣ progress bars: سعرات · بروتين · ماء (كما هي)
  - **سطر "الوجبة التالية"** ذهبي: `🥚 الوجبة التالية: الفطور [+ سجّل]`
  - الجدول الافتراضي: ٨ص/١ظ/٤ع/٨م/١٠:٣٠م/١٢ص
- زر "قسم التغذية الكامل ›" يفتح tab 3 (الأكل) بدلاً من daily log

### ✨ #9 — بطاقة تقدّم في الأعلى
- بعد Primary Hero مباشرة، بطاقة `dash-top-progress`:
  - `📅 هذا الأسبوع: 3/6 تمارين` + progress bar ذهبي
  - `🏆 آخر رقم قياسي: Lat Machine +2.5kg`
  - `✅ الالتزام: 82%` + progress bar (أخضر/برتقالي/أحمر حسب النسبة)
- الالتزام يُحسب من dailyLog (آخر ٧ أيام مع بيانات)

### 🛠 ملفات جديدة/معدّلة
- **جديد:** `js/gym-mode.js` (~370 سطر) — Overlay + State + Pass-through save
- `js/ui-v99.js` — `injectInlinePlanB`، `_initBottomNav`، `closeBnDrawer`، تحسين `injectWeightChip` بـ ±، زر `sb-gym` في sess-bar (~150 سطر)
- `js/dashboard.js` — `_topProgressCard`، `_nextMealHint`، `_nutritionBars` بالـ next-meal row، `_todayDaily` يصدر `mealsArr` (~100 سطر)
- `index.html` — `.bottom-nav` + `.bn-drawer` + drawer-backdrop + script `gym-mode.js`
- `service-worker.js` — أضف `gym-mode.js` للـ ASSETS
- `css/styles.css` — قسم V9.13 (~480 سطر): Gym Mode، Bottom Nav، Inline Plan B، Weight ±، Top Progress، Next Meal

---

## [V9.12 — نقطة بداية يومية + Progressive Disclosure + Ops Row] — 2026-05-31

حل ٣ مشاكل من تحليل واجهة المستخدم: غياب نقطة بداية يومية واضحة، صفحة طويلة كمرجع، معلومات عملية مدفونة.

### ✨ #1 — نقطة بداية يومية واضحة (Daily Start Card)
- في **Primary Hero** (Dashboard، بعد Status Strip)، أُضيف:
  - **سطر "أول تمرين"** بـ dashed border ذهبي خفيف:
    `▶ أول تمرين: Chest Press` (يُستخرج من `phase.name` تلقائياً)
  - **زر Plan B ثانوي** أزرق تحت الـ CTA الرئيسي:
    `🔄 الجهاز مشغول؟ Plan B`
- زر Plan B → `openPlanBHint()`:
  1. ينتقل لـ t1
  2. يفتح اليوم النشط
  3. يضيء كل أزرار `⇄` بـ flash animation (3 نبضات أزرق)
  4. toast: `🔄 اضغط زر ⇄ بجانب أي تمرين لإيجاد بديل`

### ✨ #2 — Progressive Disclosure في t1 (مستويين)
- بطاقتان كبيرتان في أعلى t1 أصبحتا داخل `<details>` مغلقة افتراضياً:
  - **"منطق ترتيب التمارين الجديد"** (٤ tips تعليمية)
  - **"أوزانك المبدئية — الأسبوع الأول"** (قائمة طويلة بالأوزان)
- المستوى الأول (مرئي افتراضياً): البطاقات العملية + الأيام
- المستوى الثاني (داخل `<details>`): الشرح والتفاصيل
- التصميم: `summary` بأيقونة 📖 + `▶` rotation + hint "اضغط للعرض"
- تنبيه "قبل كل تمرين" (سطر واحد قصير) يبقى مرئياً — لأنه عملي

### ✨ #3 — Step Ops Row (معلومات عملية تحت كل step)
- صف badges عملية تحت `.step-info` لكل step تدريبي:
  - **⏱ <b>60</b>ث راحة** — يُحسب تلقائياً من next `.rest` step
  - **🏷 ZONE** — من `phase.banner.zoneTag` الأقرب
- ألوان موحّدة: راحة = أزرق، zone = أخضر
- معاً مع الموجود سابقاً (Weight Chip ⚖ + Alt Button ⇄ + Form Note ℹ️) =
  **كل المعلومات العملية في مكان واحد لكل step**:
  وزن · مجموعات · تكرارات · راحة · جهاز · بديل
- يُحقن تلقائياً عبر MutationObserver عند توليد أي step جديد

### 🛠 ملفات معدّلة
- `js/dashboard.js → _primaryHero` (training-day branch) — `dpr-first-ex` + `dpr-cta-row` (~20 سطر)
- `js/ui-v99.js` — `openPlanBHint`، `initT1ProgressiveDisclosure`، `injectStepOpsRow` + helpers (~150 سطر)
- `css/styles.css` — قسم V9.12 (~135 سطر): `dpr-first-ex`، `dpr-cta-row`، `alt-btn-flash`، `t1-disclosure`، `step-ops-row`، `sor-badge`

---

## [V9.11 — إعادة تصميم الصفحة الرئيسية (Homepage Redesign)] — 2026-05-31

**المبدأ:** «المستخدم يفتح التطبيق وهو في الجيم، لديه ٣ ثوانٍ ليقرر». كل عنصر يخدم سؤالاً واحداً: «ماذا أفعل الآن؟»

### 🎯 البنية الجديدة (من الأعلى للأسفل)

١. **Status Strip** (compact) — `[ أسبوع ٣/١٢ · 🔥 ٥ يوم · ⭐ UPPER B اليوم ]`
   - دمج "بياناتك" كنقطة `dss-profile-missing` (تظهر فقط لو ناقص)
٢. **Primary Action Hero** — أكبر عنصر في الصفحة
   - tag + dayType + duration estimate (⏱ ~٥٥ دقيقة · ٢٢ سيت · ٧ تمارين)
   - CTA كبير (full-width، 14px font، 1.5px letter-spacing)
   - سطر تحفيزي ديناميكي (يتغيّر مع streak)
٣. **Quick Stats** — ٣ بطاقات: 🔥 Streak / 🏆 Week PRs / ⚖ Volume
٤. **Week Grid** — ٧ خلايا تفاعلية مع `data-day-type` (موحّد مع V9.10)
   - يتفاعل تلقائياً مع `applyWeekGridStatus` لإظهار done/today/missed/upcoming
٥. **Next Achievement** — يظهر فقط إذا **pct ≥ 30%** (يُحذف لو بعيد)
٦. **Recent PRs Carousel** — ٣ كحد أقصى، أفقي `scroll-snap` على الموبايل
٧. **Today Nutrition** — ٣ progress bars فقط: 🔥 سعرات · 🥩 بروتين · 💧 ماء
٨. **Quick Actions** — ٣ أزرار فقط: 📏 قياسات · 📸 صورة · 🧮 حاسبة
٩. **Expandable Program Info** (`<details>`) — مغلق افتراضياً

### 🗑 محذوف

- `#userProfileCard` (HTML كامل) — صار نقطة في Status Strip
- `<div class="card fu fu2">` (تقسيم الأسبوع المنفصل) — صار ضمن Dashboard
- "Hero" الديكوري القديم (`.dash-hero`) — استُبدل بـ `.dash-primary`
- Daily Compliance widget — دُمج في 3 nutrition bars
- زر "ملخص الأسبوع" من Quick Actions — لم يكن ضمن الـ ٣ الأهم

### 🛠 تفاصيل التنفيذ

- `js/dashboard.js` — أُضيفت ٨ دوال جديدة:
  `_statusStrip`، `_primaryHero`، `_quickStats3`، `_weekGridBlock`،
  `_nextAchievementBlockFiltered` (شرطي)، `_prsCarousel`، `_nutritionBars`، `_quickActions3`
- `js/app.js → refreshOverviewProfileCard` — أصبح defensive (يستدعي refreshDashboard إذا متاح، يعود بدون أخطاء لو البطاقة محذوفة)
- `js/ui-v99.js` — `applyWeekGridStatus` و `applyDayTypeColors` يدعمان `.dash-week-card .wg .wc` بجانب القديم `.fu2 .wg .wc`
- `css/styles.css` — قسم V9.11 (~260 سطر): `dash-status-strip`، `dss-pill`، `dash-primary`، `dpr-*`، `dash-quick-stats`، `dqs-card`، `dash-week-card`، `dash-prs-carousel`، `dprc-card`، `dash-nut-bars`، `dnb-*`، `dash-actions-3`

### 🎨 مبادئ بصرية

- **Hierarchy واضح:** Primary Hero ضعف حجم باقي البطاقات (24px font + 14px CTA)
- **Information density:** Status Strip يحتوي ٤ معلومات في 32px ارتفاع
- **Progressive Disclosure:** Next Ach يظهر فقط لو قريب، Program Info مغلق
- **Mobile-first:** PRs Carousel يستخدم `scroll-snap-type:x mandatory`
- **Color coding موحّد:** كل خلية week-grid تأخذ `data-day-type` (push/pull/legs/arms/rest)

---

## [V9.10 — UI/UX Sprint 2: FAB + Set Row + Progress + Bilingual] — 2026-05-31

تنفيذ ٨ مشاكل UI/UX (من #8 إلى #15). الهدف: تقليل التكدّس البصري + تحفيز نفسي + توحيد ألوان + احترام اللغة الأم.

### ✨ #8 — FAB تبسيط (٩ → ٥ + "مزيد")
- ٥ عناصر شائعة مكشوفة مباشرة: 👤 ملف · 🧮 بليتات · 🏋️ جيمات · 🌙 ثيم · 💾 تصدير
- ٢ نادرة الاستخدام داخل `<details>⋯ مزيد</details>`: 🎯 جولة · 📥 استيراد
- إزالة الـ `fab-group-title` المكرّرة (٣ عناوين → بنية مسطّحة)

### ✨ #9 — Set Row تصميم جديد (صفّان)
- الصف الأول: `كجم [input] 🧮 | تكرار [input] | حفظ | 📝 🎤`
- الصف الثاني: `[RPE 6 7 8 9 10]` (chips ملوّنة full-width)
- الصف الثالث (lazy): "آخر/أفضل" (`.last`)
- 📝 و 🎤 صاروا icons `30×30` بـ border خفيف بدل أزرار كبيرة

### ✨ #10 — Workout Progress Bar في Session Bar
- شريط أفقي `5px` تحت "⏱ 0:00 · 💪 0 سيت · 🏆 0 PR"
- متن: `12/22 سيت · تبقى 55٪`
- ألوان متغيّرة: ذهبي (افتراضي) → أخضر مع `pulse` (≥٨٠٪) → ذهبي-أبيض `shine` (١٠٠٪)
- `updateSessionProgress()` يُستدعى بعد كل `saveSet` تلقائياً

### ✨ #11 — Tips Collapsible (سطر واحد + اقرأ المزيد)
- أي `.tip` نصها >١٣٠ حرف أو يحوي `<br><br>` يصير collapsible
- يُعرض السطرين الأولين فقط + زر `اقرأ المزيد ›` ذهبي
- النقر → التوسعة + تغيير النص إلى `اطوِ ‹`
- يطبَّق على كل `.tip` في كل الصفحات تلقائياً عبر MutationObserver

### ✨ #12 — Modals Mobile Polish (Profile + Food Search + GymManager + PlateCalc)
- كل `.stats-modal` كانت تستخدم full-screen في الموبايل (V9.4)، الآن:
  - `font-size:16px` لكل inputs (يمنع iOS auto-zoom)
  - `padding-top` يحترم `safe-area-inset-top` (notch)
  - `padding-bottom` يحترم `safe-area-inset-bottom`
  - `#foodSearchResults` بـ `max-height:55vh` بدل overflow غير محدود

### ✨ #13 — Last Sets Alert (تنبيه آخر سيتين / آخر سيت)
- عند تبقي `2 sets`: toast `🔥 آخر سيتين! ركّز` + `lastSetsPulse` (background ذهبي خفيف ينبض)
- عند تبقي `1 set`: toast `💪 آخر سيت! اعطه كل ما عندك` + `lastSetFinal` (background أحمر ينبض + 🔥 يقفز)
- vibration patterns مميّزة: `[100,40,100]` لـ ٢، `[120,50,120,50,120]` لـ ١
- flag-once لكل جلسة (`_lastSetsAlerts.two`, `_lastSetsAlerts.one`)

### ✨ #14 — Unified Day Type Colors
- نظام لوني موحّد عبر CSS variables:
  - Push = ذهبي (`--g1`)
  - Pull / Arms = بنفسجي (`--purple`)
  - Legs = أخضر (`--grn`)
  - Rest = رمادي ذهبي خفيف
- يُطبَّق على: `.wg .wc` (Dashboard) + `.dt` (شارات t1) + `.db` (مربع نوع اليوم) + `.ds-chip` (Day Strip)
- `data-day-type` يُضاف ديناميكياً عبر `_categorizeDayType(text)` بـ regex على النص العربي/الإنجليزي

### ✨ #15 — Bilingual Exercise Names
- كل `.step-name` في t1 يُعاد بناؤه تلقائياً من `EXERCISE_FORM_NOTES[ex].title`:
  - `<span class="sn-en">Chest Press</span>`
  - `<span class="sn-ar">ضغط صدر</span>`
- الإنجليزي bold أبيض (`13.5px`)، العربي أصغر رمادي مع نقطة فاصلة (`11px`)
- يحافظ على `injectFormNoteButtons` و سائر children داخل step-name (لا يستخدم innerHTML)

### 🛠 ملفات معدّلة
- `js/ui-v99.js` — إضافة `applyTipsCollapsible`، `applyDayTypeColors`، `applyBilingualNames` (~180 سطر إضافية)
- `js/session.js` — `updateSessionProgress`، `_findActiveSessionDayCard`، `maybeShowLastSetsAlert` (~75 سطر)
- `css/styles.css` — قسم V9.10 (~250 سطر)
- `index.html` — FAB إعادة هيكلة + `<div id="sessProgress">` داخل sess-bar

---

## [V9.9 — UI/UX Overhaul Sprint 1: Focus Mode + Weight Chip + Day Strip] — 2026-05-31

تنفيذ ٧ أولويات من تقرير تحليل UI/UX. الهدف: تقليل التشتيت أثناء التمرين + جعل البيانات الحرجة بارزة + تكثيف الشاشات المزدحمة.

### ✨ #1 — Focus Mode (إخفاء chrome أثناء الجلسة)
- `body.focus-mode` يُخفي بطاقات الشرح، اليوم غير النشط، footer، week-float، btt
- زر تبديل `◎/◉` في `sess-bar` (بجانب زر إنهاء)
- يُفعّل تلقائياً للمستخدمين ذوي ٣+ جلسات (تفضيل قابل للتعديل)
- شريط `focus-exit-hint` ذهبي يذكّر بحالة Focus + زر "خروج" سريع
- يُعلَّم اليوم النشط بـ `.session-active-day` كل ١.٥ ث ليبقى بارزاً

### ✨ #2 — Weight Suggestion Chip (chip ذهبي بارز فوق track-input)
- chip كبير (`32px icon` + `22px وزن`) قبل كل track-input في t1
- يعرض: الوزن المقترح/آخر وزن + الهدف بالتكرار + زر "تطبيق" فوري
- حالات بصرية: `📈 زيادة`، `⏸ استمرار`، `🛟 Deload` (أزرق)، `⚠ تخفيف`، `first-time` (رمادي)
- زر "تطبيق" يحقن القيمة + يقفز إلى reps-input

### ✨ #3 — Hero Compact (طي تلقائي بعد ٣ جلسات)
- Hero الكامل يصير سطر واحد: `💪 UPPER A · ٢٢ سيت [الخميس]` + زر `+` للتوسعة
- يبقى كامل للمستخدمين الجدد (`< 3 workouts`) أو على شاشة الترحيب

### ✨ #4 — Daily Log Subtabs (٣ أقسام)
- `📋 حالة اليوم`: ماء/نوم/بروتين/مكملات/الوجبات الست
- `🍽️ وجبات اليوم`: foodLogPanel الفعلي (food search + entries)
- `📊 الإحصائيات`: dlStats + آخر ١٤ يوم
- النموذج الأصلي + saveDailyLog يعملون كما هم — فقط أُعيد توزيع DOM

### ✨ #5 — Guide V4 Collapsible
- محتوى V4 الكامل (بدائل/جداول/قياسات/توقيت/مكملات/قياسات شهرية/الـ ١٢ أسبوع) صار خلف `<details>`
- شاشة tab 5 الأولى = ٤ Hub Cards + ٤ هدف clickable بدون scrolling
- Summary مع `▶` rotation + شرح فرعي

### ✨ #6 — Week Grid Status (تفاعلي + ملوّن)
- كل خلية في `wg` تحصل `data-week-status`: `done` (✓ أخضر)، `today` (⭐ ذهبي)، `missed` (⚠ أحمر)، `upcoming` (نقطة رمادية)، `rest` (يبقى cr)
- النقر على خلية → ينقل لـ t1 + يفتح اليوم المطابق + scroll smooth

### ✨ #7 — Day Strip (شريط أيام أفقي sticky)
- `.day-strip` فوق `#programContainer` في t1، sticky تحت nav
- chips أفقية: `[أحد U.A] [إثن BACK] [⭐ثلا A.A] [أرب 🧘] ...`
- النقر → يطوي بقية الأيام + يفتح المطلوب + scroll
- اليوم النشط: `⭐` ذهبي (today-chip) أو `✓` أزرق (last-session-chip)
- يُعاد بناؤه عبر MutationObserver عند تغيّر `programContainer`

### 🛠 ملفات جديدة
- `js/ui-v99.js` (~520 سطر) — كل التحسينات في mod واحد، expose للـ window
- إضافات CSS (~280 سطر) إلى `styles.css` في قسم V9.9

### 📦 Bundle
- `index.html` — أُدخل ui-v99.js في نهاية scripts
- `service-worker.js` — أضف ui-v99.js للـ ASSETS

---

## [V9.8 — Round 4: تفاصيل PRs + RPE chips + إنجاز قادم + شهري + decimals] — 2026-05-31

حلّ آخر ٨ مشاكل **🟢 منخفضة الأولوية** من تقرير Data Audit (#15 → #22). كلها quick wins ذات تأثير تحفيزي/تنظيمي.

### ✨ #15 — `workout.prList` snapshot
- `endSession` الآن يحفظ تفاصيل PRs بدل عدد فقط: `[{type, exerciseName, value, label}, ...]`
- في history، يُعرض كـ **chips ملوّنة** قابلة للقراءة: `⚖️ Chest Press 22.5` بدل `🏆 3` غامض
- `_renderPrListSummary(prList)` helper موحّد للعرض

### ✨ #19 — RPE chip ملوّن في history
- بدل `20×10@8` نص ضمن السطر، أصبح `20×10 [@8]` chip منفصل مع ٣ ألوان:
  - 🟢 **أخضر** RPE ≤7 (سهل)
  - 🟡 **برتقالي** RPE 8 (مثالي)
  - 🔴 **أحمر** RPE ≥9 (قريب من الفشل)
- `_renderRpeChip(rpe)` helper + tooltip توضيحي
- تطبيق فوري في كلا renderHistory functions

### ✨ #16 — Achievement "قادم" في Dashboard
- `getNextAchievement()` في achievements.js يحسب الأقرب للفتح (أعلى progress %)
- بطاقة جديدة في Dashboard «🏅 إنجاز قادم» بـ:
  - أيقونة الإنجاز (filter grayscale تخفّ عند hover)
  - الاسم + الوصف
  - progress bar + «باقي ١٢ سيت · ٨٨٪»
  - كل البطاقة قابلة للضغط → تنقل لتبويب الإنجازات

### ✨ #17 — Daily Log monthly stats
بعد الـ stats الأسبوعية، بطاقة جديدة «📊 آخر ٣٠ يوم» تعرض:
- **لكل مكمل** (٥ مكملات): name + 🔥 streak الحالي + progress bar + «X/30 يوم · Y%»
- **اكتمال الوجبات**: «18/30 (60%)» مع لون ديناميكي + أفضل streak لـ ٦ وجبات متتالية
- ٣ ألوان: أخضر ≥80% / برتقالي ≥50% / أحمر <50%

### ✨ #18 — Photo compare بأي categories مع warning
- ✅ الـ dropdowns بالفعل لا تفلتر category (موجود من قبل)
- إضافة: **warning chip** برتقالي عند اختيار categories مختلفة: «⚠️ الوضعيات مختلفة: 📐 أمامية vs 🪞 جانبية — قد يصعب التقييم البصري الدقيق»

### ✨ #20 — Voice parser للكسور والعشريات
- **FRACTION_WORDS**: `نصف=0.5`, `ربع=0.25`, `ثلاث أرباع=0.75`, `ثلث=0.33`, `ثلثين=0.67`
- **DECIMAL_POINT_WORDS**: `فاصلة`, `نقطة`, `point`
- `_preprocessDecimalsAndFractions(tokens)` يدمج tokens قبل parsing:
  - `"اثنين فاصلة خمسة"` → `2.5`
  - `"اثنين ونصف"` → `2.5`
  - `"اثنين نصف"` → `2.5`
  - `"خمسة وعشرين فاصلة خمسة"` → `25.5`
  - `"2.5"` يُحفظ كما هو
- نتيجة: Voice input يفهم 95%+ من حالات إدخال الوزن (بدل 70%)

### ✨ #21 — Equipment grid ديناميكي
- بدل قائمة Technogym hardcoded في HTML
- `refreshEquipmentGrid()` يقرأ من `getActiveGym().equipment` ويعرضها:
  - عنوان: «🏠 جيم البيت — 12 جهاز»
  - subtitle ديناميكي حسب bodyweightOnly
  - empty state لو الجيم بلا معدّات
- يُحدَّث تلقائياً بعد `setActiveGymId`

### ✨ #22 — Welcome back toast
- `checkWelcomeBack()` يقرأ `LAST_ACTIVE_AT` ثم يحدّثه فوراً
- لو الغياب ≥7 أيام: toast مع زر «ابدأ الآن» يفتح تبويب التمارين
- ٣ مستويات حسب طول الغياب:
  - **7-14 يوم** 👋 «أهلاً بعودتك! غبت X أيام — لنرجع للروتين» (أزرق)
  - **14-30 يوم** 💪 «اشتقنا لك! ابدأ بأخف وزن لاستعادة العادة» (برتقالي)
  - **30+ يوم** 🌅 «رحلة جديدة — X شهر بدون تمرين. ابدأ بـ ٦٠٪ من آخر أوزانك لتجنّب الإصابة» (برتقالي)

### 📁 ملفات معدّلة (٧)
- `js/session.js` — `workout.prList` snapshot
- `js/progress.js` — `_renderPrListSummary` + `_renderRpeChip` + `_renderMonthlyStats` + استخدامها
- `js/dashboard.js` — `_nextAchievementBlock` widget
- `js/achievements.js` — `getNextAchievement()` helper
- `js/progress-photos.js` — `categoryWarn` في compare
- `js/voice-input.js` — `FRACTION_WORDS` + `DECIMAL_POINT_WORDS` + `_preprocessDecimalsAndFractions`
- `js/app.js` — `refreshEquipmentGrid` + `checkWelcomeBack` + init wiring
- `js/gyms.js` — refresh equipment grid بعد setActiveGymId
- `index.html` — تحويل equipment grid لـ container ديناميكي
- `css/styles.css` — ~١٥٠ سطر CSS جديد (hist-pr-list + rpe-chip + dash-next-ach + dl-monthly + pp-cmp-warn)

### 🛡️ توافق
- لا migration. كل التحسينات backward-compatible:
  - workouts القديمة بدون `prList` لا تعرض الـ summary (يخفى تلقائياً)
  - Voice parser الجديد متوافق مع الإدخال القديم
- Service Worker: `bulkmode-v9-8-0`

---

## [V9.7 — Multi-program tracking + Deload unification + Equipment guard] — 2026-05-31

حلّ ٦ مشاكل **🟠 متوسطة-عالية** من تقرير Data Audit (#9 → #14). معظمها تتمحور حول دعم **تبديل البرامج** بشكل صحي.

### 🏗️ Foundation — `js/data-helpers.js` (ملف جديد ~٢٠٠ سطر)
ملف مركزي يجمع **مصادر الحقيقة الموحّدة**:
- `getProgramStartDate(programId?)` — تاريخ بدء البرنامج النشط (#14)
- `recordProgramStart(programId)` — تسجيل البدء عند `setActiveProgram`
- `getProgramWeekProgress()` — حساب "الأسبوع X من ١٢"
- `getOverridesFor(programId)` — قراءة overrides بـ namespace (#9)
- `setOverrideFor(programId, dayId, obj)` — حفظ بـ namespace
- `clearOverridesFor(programId)` — مسح كل overrides لبرنامج
- `getOverridesCounts()` — `{programId: count}` للعرض في Profile
- `getDeloadStatus()` — مصدر حقيقة واحد للـ Deload (#11)
- `isWorkoutDuringDeload(workout, history)` — للـ chart markers (#12)

كل الـ helpers تدعم **backward-compat**:
- PROGRAM_OVERRIDES بشكلها القديم (`{dayId:...}`) تُترجم تلقائياً لـ `upper-priority` namespace
- `firstWorkoutDate` يُستخدم كـ fallback لـ `programStartDates['upper-priority']`

### ✨ #13 — `workout.programId` عند كل save
- `endSession` يحفظ الآن `programId` (البرنامج النشط لحظة التسجيل)
- `deloadActive` (true/false) — للـ chart markers في #12
- workouts القديمة بدون programId تُعتبر تابعة لـ `upper-priority` (legacy)

### ✨ #14 — `programStartDates` لكل برنامج منفصلاً
- `KEYS.PROGRAM_START_DATES` جديد: `{programId: ISOString}`
- `setActiveProgram(id)` يستدعي `recordProgramStart(id)` تلقائياً (لو ما مُسجّل)
- Dashboard «الأسبوع X من ١٢» يستخدم تاريخ بدء البرنامج النشط بدل `firstWorkoutDate` المُوحّد
- النتيجة: لو بدّلت لـ Full Body في مارس بعد ٨ أسابيع في Upper Priority → ترى «الأسبوع ١ من ١٢» لـ Full Body (دقيق)، بدل «الأسبوع ١٠ من ١٢» (خاطئ)

### ✨ #9 — PROGRAM_OVERRIDES بـ namespace
- البنية الجديدة: `{programId: {dayId: dayObject}}`
- `program-editor.js` (`saveEditorChanges`, `resetEditorDay`, `openProgramEditor`) كلها تستخدم helpers المنفصلة
- **Profile modal — قسم جديد «✏️ تخصيصاتك للأيام»** يعرض:
  - لكل برنامج فيه overrides: اسم + عدد + علامة «نشط» لو هو الـ active
  - زر «🗑 مسح الكل» لتنظيف overrides برنامج محدد
- لا تتراكم زبالة بعد اليوم: overrides Full Body لا تتداخل مع Upper Priority

### ✨ #11 — Deload state موحّد (مصدر واحد)
- 3 mismatches قديمة (`MANUAL_DELOAD_ACTIVE` + `detectDeloadNeed()` + `weekly-review.suggestDeload`) → الآن كلها تقرأ من `getDeloadStatus()`
- `getDeloadStatus()` يُرجع: `{active, activeSince, activeUntil, daysLeft, source, recommended, recommendationUrgency, reasons:[...]}`
- `updateDeloadHeaderBanner` (في session.js) → يستخدم الـ status مع `daysLeft` صريح
- `weekly-review.js` → `_renderDeloadSuggestion(status)` يفرّق بين «نشط الآن» / «اقتراح» / «استمر»
- المستخدم لا يرى رسائل متضاربة بعد اليوم

### ✨ #12 — RPE chart مع Deload markers
- نقاط أيام Deload في الـ chart الآن:
  - **لون مختلف** (أزرق `#5AB4FF` بدل بنفسجي `#B08AFF`)
  - **شكل مختلف** (⬥ rectRot بدل ●)
  - **حجم أكبر** (6px بدل 4px)
- **Legend** يظهر «🛟 أيام Deload» تلقائياً لو فيه أي نقطة Deload
- **Tooltip** يضيف سطر «🛟 خلال Deload» للنقاط المعنية
- **Hint منطقي**: لو آخر ٣ جلسات كلها Deload، الرسالة تقول «هذا ليس تحسّن — الأوزان مخفّضة. الـ RPE الحقيقي بعد العودة لـ bulk mode» (بدل تنبيه deload كاذب)

### ✨ #10 — Gym Equipment Mismatch Banner
- `getProgramEquipmentMismatch()` في gyms.js يفحص كل تمارين البرنامج النشط ضد `gym.equipment`
- Banner برتقالي أعلى تبويب التمارين: «⚠️ ١٢ تمرين من ٢٥ (٤٨٪) غير متاحة في 🏠 جيم البيت — Chest Press · Lat Machine...»
- في وضع `bodyweightOnly`: زر CTA «جرّب Full Body بدلاً» يبدّل البرنامج بضغطة
- زر dismiss يحفظ في sessionStorage (يظهر مرة واحدة لكل جلسة + يعود بعد تبديل الجيم/البرنامج)
- ينطلق تلقائياً بعد `setActiveGymId` و `setActiveProgram`

### 📁 ملفات جديدة (١)
- `js/data-helpers.js` (~٢٠٠ سطر) — مصادر حقيقة موحّدة

### ✏️ ملفات معدّلة (٩)
- `js/data.js` — `KEYS.PROGRAM_START_DATES`
- `js/session.js` — `workout.programId` + `workout.deloadActive` + `recordProgramStart` + `updateDeloadHeaderBanner` يستخدم getDeloadStatus
- `js/program-templates.js` — `setActiveProgram` يستدعي `recordProgramStart` + reset gym mismatch
- `js/program-render.js` — يستخدم `getOverridesFor(activeProgramId)`
- `js/program-editor.js` — `save/reset/open` يستخدمون `setOverrideFor/clearOverrideFor/getOverridesFor`
- `js/dashboard.js` — `_weekProgress` async يقرأ `getProgramWeekProgress`
- `js/weekly-review.js` — `_renderDeloadSuggestion(status)` بـ ٣ حالات
- `js/progress.js` — RPE chart مع Deload markers (color/shape/size) + legend ديناميكي + tooltip + hint محسّن
- `js/gyms.js` — `getProgramEquipmentMismatch` + reset banner في `setActiveGymId`
- `js/app.js` — `refreshOverridesList` + `clearProgramOverrides` + `updateGymMismatchBanner` + `dismissGymMismatchBanner` + استدعاء في init
- `index.html` — قسم Overrides Manager في Profile + `gymMismatchBanner` في tab التمارين + script tag
- `css/styles.css` — ~٦٠ سطر CSS جديد (prof-override-row + gym-mismatch-banner + wr-suggestion-info)
- `service-worker.js` — تضمين `data-helpers.js`

### 🛡️ توافق وهجرة
- **لا migration formal** — كل التغييرات backward-compatible:
  - workouts القديمة بدون `programId` تُعتبر تابعة لـ `upper-priority`
  - PROGRAM_OVERRIDES بالشكل القديم تعمل تلقائياً (detected by shape)
  - `firstWorkoutDate` يُستخدم كـ fallback لـ `programStartDates['upper-priority']`
- Service Worker: `bulkmode-v9-7-0`

---

## [V9.6 — استثمار البيانات المخفية: subs/meal-slot/PR-types/fiber/photo-weight] — 2026-05-31

حلّ ٥ مشاكل **🟡 متوسطة الأولوية** من تقرير Data Audit (#4 → #8). كلها بيانات كانت مخزّنة لكن غير ظاهرة.

### ✨ #4 — بطاقة «🔄 أنماط الاستبدال» في تحليلات
بدلاً من ترك `subs:history` لـ smart-suggestion فقط (٢٠٠ entry مدفون)، الآن:
- **3 stat cells**: إجمالي الاستبدالات، تمارين مختلفة، هذا الشهر
- **Trend hint ذكي**: «⚠️ +٧٥٪ استبدالات هذا الشهر — هل الجيم أصبح أزحم؟» أو «✓ −٤٠٪ — الجيم أهدأ»
- **Top 5 list** بشريط نسبي (rank + count + bar)
- **بدائلك المفضّلة لـ {أكثر تمرين مستبدل}** ـ ٣ chips، الأكثر ⭐
- **توصية make-permanent**: «💡 جرّب جعل X بديلاً دائماً — يوفّر وقت البحث في كل جلسة»
- **Bar chart شهري**: هذا الشهر vs الماضي vs ما قبله

### ✨ #5 — mealSlot routing + breakdown في Dashboard
الحقل كان موجود لكن لا UI يربط الوجبات بـ slots محددة:
- **في Daily Log**: كل meal chip له زر «+» جنبه يفتح Food Search مع `mealSlot` محدد (`breakfast/lunch/snack/pre/post/late`)
- **عند إضافة وجبة بـ slot**: علامة auto-tick على checkbox المطابق + auto-save
- **في Dashboard nutrition**: قسم جديد «⏱ التوزيع على الوجبات» يعرض grid لكل slot نشط (icon + label + kcal + protein)
- **قسم خاص للوجبات غير المُصنّفة**: «❓ غير محدّد · ٣ وجبات · حدّد التوقيت لتحليل أفضل»

### ✨ #6 — أيقونات PR types (5 أنواع مميزة)
بدلاً من 🏆 موحّد للـ ٥ أنواع:
- **History**: chips ملوّنة `⚖️ R` / `🔁 B` / `📦 P` / `🎯 R` / `💪 G` بدل 🏆 (مع tooltip للنوع)
- **prsBody**: 
  - **Filter chips** فوق القائمة: «الكل (٤٥) · ⚖️ وزن (١٢) · 🎯 1RM (٨)...» للتصفية حسب النوع
  - كل PR item يعرض الأنواع كـ rows ملوّنة مرتبة بالأهمية (weight > 1rm > volume > reps > effort)
  - أيقونة الـ item الرئيسية = أعلى نوع للـ PR
- **ثوابت** `PR_TYPE_META` و `_renderPRTypeChips()` للاتساق عبر التطبيق

### ✨ #7 — photo.weight badge + compare diff محسّن
- **Gallery thumbnails**: badge بصري بارز top-right على كل صورة `⚖️ 78كجم` (glass-blur + ذهبي)
- **Compare view**: 
  - بدل «فرق الوزن: +4 كجم»: «📈 +4 كجم خلال 8 أسبوع <small>(+0.5 كجم/أسبوع)</small>»
  - حساب معدل التغيير الأسبوعي (مهم للمتابعة العلمية للتضخيم 0.25-0.5kg/أسبوع)
  - ٣ ألوان: ذهبي للزيادة، أزرق للنقص، رمادي للثبات

### ✨ #8 — fiber row في Dashboard nutrition
- row صغير تحت macros الأساسية: `🌾 ألياف: 28g (هدف ~٢٥-٣٥g/يوم)`
- يظهر فقط لو `nutrition.fiber > 0` (لا يزعج لو ما فيه foodEntries)
- بدون progress bar — مساحة قليلة، إشارة سريعة

### 📁 ملفات معدّلة (٧)
- `js/progress.js` — `renderSubsPatterns` + `PR_TYPE_META` + `_renderPRTypeChips` + تحديث `renderPRs` بـ filter chips
- `js/dashboard.js` — `_todayNutritionBreakdown` + تحديث `_nutritionBlock` بـ fiber + breakdown
- `js/nutrition.js` — ثوابت `MEAL_SLOT_LABELS/ICONS/ORDER` + `getNutritionBreakdown` + auto-tick checkbox عند slot
- `js/progress-photos.js` — weight badge على gallery + compare delta محسّن مع period/rate
- `index.html` — meal chips بأزرار `+` (٦ × `openFoodSearch(slot)`) + subsPatternsBody section
- `css/styles.css` — ~١٤٠ سطر CSS جديد (subs-patterns + dl-meal-add + dn-fiber-row + dn-breakdown + pr-type-chips + pr-filter + pp-thumb-weight-badge + pp-cmp-delta enhanced)

### 🛡️ توافق
- لا migration. كل التحسينات backward-compatible.
- لا حقول جديدة في DB — استثمار حقول موجودة (`subs:history`, `mealSlot`, `prType`, `fiber`, `photo.weight`).
- Service Worker: `bulkmode-v9-6-0`

---

## [V9.5 — توحيد مصادر البيانات + استثمار actualRestSeconds] — 2026-05-31

حلّ ٣ مشاكل **🔴 عالية الأولوية** من تقرير Data Audit.

### ✨ #1 — استثمار `actualRestSeconds` بثلاث طبقات
الحقل كان يُسجَّل منذ V9.2 لكن لا يقرأه أي مكان. الآن مستخدم في ٣ أماكن:

1. **Session Summary**: بطاقة جديدة «⏱ متوسط راحتك ١٠٥ث (مستهدف ~٦٠ث)» مع ٣ ألوان (أخضر ≤٧٥ث، برتقالي ≤١٠٥ث، أحمر >١٠٥ث) + نصيحة تفسيرية
2. **History (في كلا renderHistory)**: عرض ` · ⏸ 85ث راحة` بجانب مدة الجلسة
3. **Chart جديد في تحليلات**: «⏱ متوسط زمن الراحة عبر الزمن» — line chart بالأزرق مع خط مرجعي عند ٦٠ث، يكشف عند آخر ٣ جلسات > ٩٠ث ويقترح: «تقليل الراحة لـ ٦٠ث يختصر الجلسة بـ ~٧ دقائق دون التأثير على نمو العضل»

### ✨ #2 — توحيد مصادر وزن الجسم (bodyMetrics = source of truth)
3 مصادر سابقة كانت تتضارب (`bodyMetrics.bodyWeight` + `profile.weight` + `progressPhotos.weight`). الآن:

- **عند حفظ bodyMetric جديد بـ bodyWeight** → يُحدَّث `profile.weight` تلقائياً + علامة `weightSource: 'bodyMetrics'` + يُحدَّث Dashboard لإعادة حساب السعرات/البروتين فوراً
- **عند فتح Profile modal**: إذا فيه bodyMetric أحدث من profile.weight → hint برتقالي «آخر قياس X كجم — استورد ›» مع زر استيراد بنقرة واحدة. لو متطابقان → علامة أخضر «✓ مزامن مع قياسات الجسم»
- **عند حفظ Profile بوزن جديد يدوياً** → يُسجَّل snapshot في `bodyMetrics` لتاريخ اليوم تلقائياً، مع علامة `weightSource: 'manual'`
- **عند حفظ صورة بوزن**: لو لا يوجد bodyMetric لذلك التاريخ → يُحفظ تلقائياً + toast «✓ تم تحديث قياسات الجسم أيضاً». لو موجود ومختلف → نصيحة «وزنك في قياسات الجسم: X كجم» (بدون كتابة فوقه)

### ✨ #3 — توحيد البروتين (foodEntries primary, dailyLog fallback)
الحلّ الذكي: dailyLog.protein لا يُحذف لكن يصبح **مُحَكَّم بـ foodEntries**:

- **لو فيه foodEntries لليوم**: حقل البروتين في Daily Log يصبح **read-only** مع badge أخضر «✓ محسوب تلقائياً من X وجبة [إدخال يدوي ›]» + أزرار -10/+10 معطّلة بصرياً
- **زر "إدخال يدوي ›"**: يعيد الحقل لـ writable لو المستخدم يريد override
- **عند saveDailyLog**: لو المصدر = foodEntries، نحفظ `protein:null` و `proteinSource:'foodEntries'` (نتجنّب الكتابة المزدوجة)
- **في History**: العمود 🥩 يقرأ من foodEntries لو dailyLog.protein=null، مع علامة 🍽 صغيرة تبيّن المصدر
- **عند إضافة/حذف وجبة**: يُعاد تحميل Daily Log تلقائياً ليتحول الحقل لـ locked/unlocked فوراً

### 📁 ملفات معدّلة (٥)
- `js/session.js` — `showSessionSummary` صار async + بطاقة الراحة
- `js/progress.js` — `_avgRestForWorkout` + `renderRestTrend` + `loadDailyLogForDate` (موحّد للبروتين) + `_updateProteinFieldState` + `overrideProteinManual` + saveBodyMetrics sync + renderDailyLogHistory async للبروتين
- `js/app.js` — `openProfile` يقرأ آخر bodyMetric + `_updateProfileWeightHint` + `_useLatestBMWeight` + saveUserProfile يحفظ snapshot في bodyMetrics
- `js/progress-photos.js` — savePhotoFromForm يقترح sync مع bodyMetrics
- `js/nutrition.js` — confirmAddFood/deleteFoodEntry يعيدان تحميل Daily Log
- `index.html` — canvas chartRest + restHint
- `css/styles.css` — ~٦٠ سطر CSS جديد (.summary-rest, .prof-weight-hint, .dl-source-badge, .dl-num-input-locked, .dl-from-food)

### 🛡️ توافق
- لا migration. الحقول الجديدة (`proteinSource`, `weightSource`, `weightSyncedAt`) اختيارية — السجلات القديمة تعمل كما هي
- Service Worker: `bulkmode-v9-5-0`

---

## [V9.4 — تحسين شامل لتجربة الموبايل] — 2026-05-30

تحسينات mobile-first شاملة — حلّ ٨ مشاكل أساسية في تجربة الهاتف.

### ✨ تحسينات CSS (1952→2400 سطر)

#### 1. منع iOS auto-zoom على inputs
- كل `<input>`، `<select>`، `<textarea>` صار `font-size: 16px !important` (iOS لا يُكبّر >= 16px)
- استثناء `@media (min-width: 768px)` يُعيدها لـ 14px للديسكتوب

#### 2. Safe-area-inset support كامل (iPhone X+ مع notch/home-indicator)
- `viewport-fit=cover` في الـ meta tag (شرط لتفعيل الـ safe-area)
- CSS variables: `--sai-top/bottom/left/right`
- FAB، btt، install-btn، toast، session-bar كلها تستخدم `calc(... + var(--sai-...))`
- في PWA standalone، `<body>` يحصل على `padding-top: var(--sai-top)`

#### 3. تحسين track-input للموبايل (الأهم — قلب التمرين)
- inputs أعرض (55→68px)، أطول (32→42px height)
- save-btn أكبر (42px min-height)
- على شاشات < 360px: full-width يتراص عمودياً للوصول الأسهل

#### 4. Spacing/padding system متدرّج
- `.sec`: 28px → 18px → 14px (مع نقص الشاشة)
- `.card`: 24px → 16px → 14px
- `.hero`: 60px → 32px → 24px (مع تصغير `h1` font-size)
- `.dy` و `.step` و `.phase-bar` كلها مضغوطة

#### 5. Modals full-screen على الموبايل (< 600px)
- `.stats-content`: 100vw × 100vh، بدون border-radius، padding مع safe-area
- `.close-modal` صار 38×38 دائري أوضح
- Bottom-sheet modals (alt، form-note، exh): max-height 90vh + safe-area bottom

#### 6. Equipment grid يتكيّف حتى 320px
- 135px → 120px minmax على الموبايل
- < 380px: عمودين ثابتين (`repeat(2, 1fr)`)

#### 7. Tables horizontal-scroll (لمنع تكسير الجدول)
- `.bm-table-wrap` و `.pt` مع `-webkit-overflow-scrolling: touch`

#### 8. Landscape + tiny screens
- `@media (max-height: 500px) and (orientation: landscape)`: hero مضغوط، charts صغيرة
- `@media (max-width: 359px)`: hide labels، nav-brand مخفي، عمود واحد لكل شيء

#### 9. Touch-action + tap-highlight
- `touch-action: manipulation` على كل الأزرار (يلغي 300ms tap delay)
- `tap-highlight-color` ذهبي خفيف للفيدباك اللمسي

#### 10. تحسينات بصرية متفرقة
- `text-size-adjust: 100%` لمنع iOS من تكبير عشوائي
- `user-select: none` على عناصر UI غير قابلة للنسخ (تجنّب accidental selection)
- `overscroll-behavior: contain` للـ modals
- `scroll-snap` على nav tabs و prog-tabs (تجربة أفضل عند swipe)

### ✨ JS مكمّل ([`js/mobile-fixes.js`](js/mobile-fixes.js))

1. **`--real-vh` CSS variable** — يصلح مشكلة `100vh` على iOS Safari مع شريط العنوان المتحرّك
2. **Auto-scroll للـ input عند focus** — يضمن ظهور الـ input فوق الكيبورد
3. **Auto-select content** عند focus على weight/reps/rpe inputs (يبدأ يكتب فوراً بدون مسح يدوي)
4. **Modal scroll lock فعّال** — `body{position:fixed}` يمنع scroll body خلف الـ modal، ويُعيد الموضع عند الإغلاق
5. **Pull-to-refresh تخفيف** — يمنع السحب العَرَضي أثناء الكتابة
6. **Orientation change re-render** — Dashboard و body timeline charts تُعاد رسمها عند تدوير الجهاز
7. **Double-tap zoom prevention** على الأزرار (مكمّل لـ touch-action)
8. **Tap visual feedback** — class `.is-pressing` يُضاف مؤقتاً عند اللمس (iOS `:active` غير موثوق)

### 📝 ملف جديد
- `js/mobile-fixes.js` (~150 سطر)

### ✏️ ملفات مُعدّلة
- `index.html` — viewport محدث + script tag
- `css/styles.css` — ~٤٥٠ سطر CSS جديد للموبايل
- `service-worker.js` — تضمين `mobile-fixes.js`

### 🛡️ Service Worker
- `bulkmode-v9-4-0`

---

## [V9.3 — تظليل آخر جلسة بدل اليوم الحالي] — 2026-05-30

### ✏️ تعديل سلوكي

**`highlightToday()` صار يستخدم آخر جلسة بدأها المستخدم بدل اليوم في التقويم.**

#### السبب
قبل: التظليل كان مبنياً على `new Date().getDay()` — مفترِض أن المستخدم يتبع الجدول الأسبوعي حرفياً. لو فات أيام أو بدّل، الإشارة على "اليوم" تصبح مضلّلة.

بعد: المنطق متدرج بأولوية:
1. **جلسة نشطة الآن** → تظليل يومها بشارة «الجلسة النشطة» (ذهبي)
2. **آخر workout مكتمل** → تظليل ذلك اليوم بشارة «آخر جلسة» (أزرق ✓)
3. **مستخدم جديد بدون workouts** → fallback لليوم في التقويم بشارة «اليوم» (ذهبي ⭐)

#### تغييرات بصرية
- لون أزرق مميّز للـ "آخر جلسة" يفرّقها بصرياً عن "اليوم في التقويم":
  - بطاقة `.dy.last-session-day` (border + shadow أزرق هادئ)
  - شارة `.today-badge.last-session-badge` (gradient أزرق + `✓`)
  - خلية `.wc.last-session-cell` في شبكة الأسبوع (نفس الفكرة، حجم أصغر)
- `injectRestDaySwap` يبقى للـ fallback (مستخدم جديد + اليوم راحة) فقط — للمستخدم النشط، البطاقة المظللة هي يوم تدريبه الأخير

#### تفاصيل تقنية
- `highlightToday()` صارت **async** (تقرأ `db.getAll('workouts')`)
- دالة جديدة `_findDayIdxByType(dayType, days)` تطابق dayType النصي مع البطاقة في DOM (و fallback لـ `EFFECTIVE_PROGRAM.days[].dayOfWeek`)
- `dataset.highlightSource` على البطاقة المظللة = `'session'|'last-workout'|'calendar'` للتشخيص
- يُعيد بناء التظليل من الصفر في كل استدعاء (يزيل بطاقات قديمة) — يعمل بعد تبديل البرامج

---

## [V9.2 — Smart Next + Timeline + Streak Page + Voice + Auto-Rest] — 2026-05-24

تنفيذ ميزات UX المتبقية من المراجعة (B.7-B.9 + C.10 + C.12).

### ✨ جديد

#### B.7 — Smart Next Workout
- **محرك توصيات** ([`js/smart-next-workout.js`](js/smart-next-workout.js)) يحلل:
  - آخر مرة استهدفت كل مجموعة عضلية (chest/back/shoulders/quads/hams/glutes/biceps/triceps/calves/core)
  - أيام التعافي المطلوبة لكل عضلة (Schoenfeld 2016: 48-72h)
  - يقترح اليوم الذي عضلاته الأقدم تدريباً (longest recovery)
- **Dashboard hero يستخدمه**:
  - لو اليوم في الجدول → اقتراحه (السابق)
  - لو يوم راحة + smart suggestion عاجل → عرضه كـ option
  - لو لا شيء واضح → استبدال «يوم حر» بـ smart recommendation (variant بنفسجي)
- النص يشرح السبب: "آخر تدريب لـ <b>الصدر</b> كان قبل <b>٤ أيام</b>"

#### C.12 — Body Composition Timeline
- **Summary cards** لكل قياس تعرض:
  - القيمة الحالية + الـ delta منذ أول قياس مسجّل (+٢.٥ سم)
  - تلوين ذكي: أخضر للزيادة، أحمر للنقص (معكوس للخصر — النقص أفضل)
- **Chart تفاعلي** (Chart.js lazy-loaded) — كل قياس له tab منفصل (الذراع/الصدر/الكتف/الفخذ/الخصر/الوزن)
- "التطور خلال X يوم من Y إلى Z" — context زمني واضح
- يظهر تلقائياً في tab «📏 قياسات الجسم» بمجرد تسجيل ٢ قياسات

#### C.10 — Streak Page (Duolingo-style)
- **Modal بارز** ([`js/streak-page.js`](js/streak-page.js)) يفتح من Dashboard streak block:
  - **شعلة كبيرة** (54px) + رقم streak ضخم (64px)
  - **نص تحفيزي ديناميكي**: «٣ أيام حتى تفتح أسبوع ⭐»
  - **3 stat cells**: أفضل streak، جلسات الشهر، إجمالي الجلسات
  - **٦ Milestones** (3/7/14/30/60/100 يوم) — مفتوحة مع أيقونة ملوّنة أو مقفلة بـ grayscale
  - **Calendar ٤٢ يوم** (٦×٧) مع تظليل أيام التدريب + علامة "اليوم"

#### B.9 — Voice Input
- **زر 🎤** بجانب زر «حفظ» في كل track-input ([`js/voice-input.js`](js/voice-input.js))
- **Listening overlay** يستمع لـ ٥-٧ ثوانٍ مع animations
- **Parser عربي ذكي** يفهم:
  - أرقام لاتينية: «20 5» → weight=20, reps=5
  - أرقام عربية منطوقة: «عشرين خمسة» / «خمسة وعشرين تكرار عشرة»
  - دلائل: «كيلو/كجم» للوزن، «تكرار/مرة» للتكرار
  - ٣٠+ كلمة عربية للأرقام (واحد→مئة)
- **Sanity checks**: weight 0-500، reps integer 0-100
- **Graceful degradation**: يُخفى الزر في Firefox (لا يدعم Web Speech)
- **MutationObserver**: re-inject الزر بعد تبديل البرامج

#### B.8 — Smart Rest Detection
- **تتبع زمن الراحة الفعلي** ([`js/auto-rest.js`](js/auto-rest.js)):
  - يحفظ `actualRestSeconds` لكل setRec (الفرق بين save السابق و save الحالي)
  - متاح لاحقاً لتحليل: «متوسط راحتك ١٠٥ ث (مستهدف ٦٠)»
- **Page Visibility resume toast**:
  - عند العودة للتاب بعد انتهاء الراحة بـ ٣٠+ ثانية، toast لطيف: «✓ راحتك انتهت قبل X ث — جاهز»
  - يحترم الوقت الفعلي للغياب (يتطلب ٢٠ ث+ غياب لتجنب الـ false positives)
- **Idle hint**:
  - بعد ٣ دقائق من آخر save بدون فعل، hint خفيف فوق track-input التالي
  - يختفي تلقائياً عند بدء الإدخال

### 📁 ملفات جديدة (٥)
- `js/smart-next-workout.js` (~170 سطر)
- `js/streak-page.js` (~170 سطر)
- `js/voice-input.js` (~290 سطر)
- `js/auto-rest.js` (~125 سطر)

### ✏️ ملفات مُعدّلة
- `js/dashboard.js` — heroBlock يقبل smartReco + streak block زر قابل للضغط
- `js/progress.js` — `renderBodyTimeline` + `_renderBmtChart`
- `js/session.js` — استدعاء `smartRest.recordActualRest` + `markSaveTimestamp` بعد save
- `index.html` — `bmTimelineWrap` + ٤ script tags جديدة
- `css/styles.css` — ~٢٥٠ سطر CSS جديد (timeline + streak page + voice + idle hint + hero variants)
- `service-worker.js` — تضمين الـ ٤ ملفات الجديدة

### 🛡️ Service Worker
- نسخة جديدة: `bulkmode-v9-2-0`

---

## [V9.1 — برامج متعددة + تتبع تغذية + مكتبة Media] — 2026-05-24

تنفيذ ميزات Core الناقصة من مراجعة PM (A.1-A.4).

### ✨ جديد

#### A.4 — Program Templates (نظام برامج متعدد)
- **٣ برامج جاهزة** بدلاً من برنامج واحد ثابت:
  - **Full Body 3-Day** للمبتدئ (٣ أيام/أسبوع، straight sets، تمارين أساسية)
  - **Upper/Lower 4-Day** للمتوسط (٢ علوي + ٢ سفلي، توازن مثالي)
  - **Upper Priority 6-Day** للمتقدم (الأصلي بـ APS، تركيز على الجذع العلوي)
- [`js/program-templates.js`](js/program-templates.js) — Registry موحّد للبرامج
- **`recommendProgram(profile)`** — engine يقترح الأنسب حسب الخبرة/الأيام/الهدف
- **`getActiveProgram() / setActiveProgram(id)`** — تبديل ديناميكي مع إعادة بناء كاملة
- **UI تبديل البرامج** داخل Profile modal مع زر «⚡ اقتراح ذكي»
- **Auto-recommendation** بعد onboarding تشخيصي (toast هادئ يخبر بالاختيار)

#### A.3 — Nutrition Tracking (تتبع التغذية الفعلي)
- **قاعدة بيانات أطعمة عربية** ([`js/foods-database.js`](js/foods-database.js)) — ٧٠+ صنف:
  - بروتين حيواني (دجاج، لحم، تونة، سلمون، بيض...)
  - ألبان (زبادي يوناني، حليب، جبن قريش، لبنة...)
  - نشويات (أرز، شوفان، خبز، معكرونة، بطاطس، بسمتي، كينوا...)
  - دهون صحية (زيت زيتون، لوز، جوز، طحينة، أفوكادو...)
  - خضار + فواكه + مشروبات
  - **أطعمة عربية شعبية** (كبسة، شاورما، فلافل، حمص، متبّل، فول، تبولة...)
- **IndexedDB store جديد `foodEntries`** — Schema migration V4→V5 + indexes على date/foodId
- **Food Search modal** ([`js/nutrition.js`](js/nutrition.js)):
  - بحث فوري (debounced) + فلترة بالفئة
  - اختيار حصة من قائمة جاهزة أو وزن مخصص
  - عرض ماكروز محسوبة فوراً قبل الإضافة
- **Food Log Panel** داخل Daily Log:
  - قائمة وجبات اليوم مع زر حذف لكل وجبة
  - Progress bars مقابل أهداف السعرات/البروتين/الكارب/الدهون (من profile)
  - يعرض نسبة الالتزام بـ ٣ ألوان (منخفض/مثالي/زائد)
- **Dashboard integration**: بطاقة «🥩 التغذية اليوم» تظهر تلقائياً عند وجود وجبات + توحيد عداد البروتين

#### A.2 — Enhanced Exercise Media
- **Placeholders محسّنة**: كل SVG يعرض الآن:
  - **اسم التمرين بارز** في الأعلى
  - **إيموجي مخصص لكل تمرين** (٢٥+ ايموجي في `EXERCISE_ICONS`)
  - الـ shape المتحرّك الأصلي حسب category
- **زر «🎬 شاهد فيديو شرح على YouTube»** داخل form-note modal — يفتح بحث مباشر بـ name + " proper form" (فيديوهات حقيقية بدون استضافة)
- آلية fallback ثلاثية: gif ملف → placeholder → خفي

### 🛡️ Schema (DB_VERSION=5)
- V4→V5: `foodEntries` store جديد بـ `keyPath:'id', autoIncrement:true` + indexes (date, foodId)

### 📁 ملفات جديدة
- `js/program-templates.js` (~390 سطر) — Templates + recommendation engine
- `js/foods-database.js` (~310 سطر) — قاعدة بيانات أطعمة عربية
- `js/nutrition.js` (~330 سطر) — Food entries + UI + Daily Log integration

### ✏️ ملفات مُعدّلة
- `js/data.js` — DB_VERSION 4→5 + migrateV4toV5 + KEYS.ACTIVE_PROGRAM_ID
- `js/program-render.js` — يستدعي getActiveProgram() قبل PROGRAM_DATA + injectVideoLink
- `js/exercise-media.js` — placeholders بـ اسم+إيموجي + buildYouTubeSearchURL + EXERCISE_ICONS
- `js/dashboard.js` — بطاقة nutrition + توحيد عداد البروتين من foodEntries
- `js/app.js` — refreshProgramList + selectProgram + applyRecommendedProgram + auto-recommend في diagnostic
- `js/progress.js` — refresh foodLogPanel عند فتح Daily Log
- `index.html` — قسم program selector + foodLogPanel + script tags
- `service-worker.js` — تضمين الملفات الجديدة في offline cache

### 🛡️ Service Worker
- نسخة جديدة: `bulkmode-v9-1-0`

---

## [V9.0 — لوحة تحكم + Onboarding تشخيصي + Near-PR + معمارية أنظف] — 2026-05-23

ترقية تجربة المستخدم الكبرى — تنفيذ ٨ أولويات من مراجعة PM/UX شاملة.

### ✨ جديد

#### P2 — Dashboard موحّد (tab 0)
- **«🏠 الرئيسية»** أصبح الـ landing tab الافتراضي بدل «التمارين».
- لوحة تحكم ديناميكية ([`js/dashboard.js`](js/dashboard.js)) تعرض بنظرة واحدة:
  - الجلسة المقترحة لليوم + زر «ابدأ» بارز
  - شارة Streak الحالي + الأفضل (🔥)
  - إحصائيات آخر ٧ أيام (سيتات/حجم/PRs/جلسات)
  - تقدّم البرنامج (الأسبوع X من ١٢ + النسبة)
  - آخر ٣ PRs مع وقت نسبي
  - التزام اليوم (ماء/نوم/بروتين/وجبات) مع progress bars
  - Quick Actions (٤ أزرار)
- **Empty state** خاص للمستخدم الجديد (٠ جلسات).
- المحتوى التعليمي القديم (٥ كروت) صار في `<details>` collapsible — متاح لمن يريد، مخفي افتراضياً.

#### P5 — تقليل التبويبات + تنظيف FAB
- nav من ٦ → **٥ tabs** (🏠 الرئيسية / 💪 التمارين / 📈 تقدمي / 📅 التقويم / 📖 الدليل).
- tab **«الدليل»** صار hub بـ ٤ بطاقات تنقل لتبويبات المحتوى التعليمي (الأكل · الأوزان · النصائح · أول مرة) — هذه التبويبات بقيت موجودة لكن خارج الـ nav الرئيسي.
- **FAB** من ٩ أزرار → **٧ أزرار** مجمّعة في ٣ أقسام مرئية (الملف / الأدوات / البيانات) — إزالة المكررات (الإحصائيات + أول مرة).
- إضافة `switchToTab(id)` ([`js/data.js`](js/data.js)) للتنقل البرمجي.

#### P6 — Weekly Review
- **Modal تلقائي يوم السبت** ([`js/weekly-review.js`](js/weekly-review.js)) لو فيه ٢+ جلسات هذا الأسبوع.
- يلخّص: الجلسات/السيتات/الحجم/PRs مع مقارنة % مع الأسبوع السابق، أفضل تمرين، التزام تغذية ٧ أيام، Streak، اقتراح Deload لو RPE عالٍ.
- زر «📊 ملخص الأسبوع» داخل Dashboard quick actions.

#### P7 — مؤشر «PR قريب»
- Hint ديناميكي تحت كل `track-input` يكشف بعد كل تغيير وزن/تكرار:
  - 🏆 **«سيت قياسي!»** لو الإدخال سيحقق PR فعلياً (٥ أنواع: weight/reps/volume/1rm)
  - ⚡ **«تكرار واحد إضافي = Rep PR»** أو **«+٢.٥ كجم = Weight PR»** لو قريب
- Debounce ١٥٠ ميلي + cache ٣٠ ثانية بـ exerciseName + invalidate بعد كل save.

#### P4 — Onboarding تشخيصي
- شريحة جديدة في الـ onboarding تجمع: الجنس · العمر · الوزن · الطول · الخبرة · الهدف.
- تُحفظ في `KEYS.USER_PROFILE` تلقائياً عند التقدم — تُغذّي حساب السعرات/البروتين والـ Dashboard.
- اختياري (زر «تخطّى الآن» متاح).

#### P3 — مكتبة Media للتمارين
- نظام **placeholder ديناميكي** ([`js/exercise-media.js`](js/exercise-media.js)) يولّد SVG مُلوّن متحرّك حسب category (push/pull/legs/core/cardio).
- كل تمرين في `EXERCISE_FORM_NOTES` صار له visual representation حتى لو ما عنده gif file.
- Fallback تلقائي للـ placeholder عند فشل تحميل gif.

#### P8 — تجزئة المعمارية
- استخراج `EPLEY` + `detectPRs` + `celebratePR` + near-PR logic كاملاً من session.js إلى [`js/pr-detection.js`](js/pr-detection.js) — session.js انخفض ٢٠٠+ سطر.

### 🛡️ توافق
- لا تغييرات في schema. كل البيانات الموجودة تعمل كما هي.
- `mergeGuideTabs` ألغيت من init (كانت تحذف t2/t4؛ بُدلت بـ guide-hub في t5).

### 📁 ملفات جديدة
- `js/dashboard.js` (300 سطر) — Dashboard
- `js/weekly-review.js` (220 سطر) — Weekly Review modal
- `js/exercise-media.js` (140 سطر) — SVG placeholder system
- `js/pr-detection.js` (200 سطر) — PR + Near-PR (مستخرج من session.js)

### 🔬 اختبار
- `test.html` محدث ليحمل `pr-detection.js` قبل `session.js` — اختبارات EPLEY تعمل كما هي.

---

## [V8.0 — برنامج JSON + إنجازات + صور تقدّم + Smart Deload] — 2026-05-21

أكبر ترقية معمارية: فصل بيانات البرنامج عن HTML، إضافة ميزات شخصية متعددة، وكشف ذكي لحاجة الاستشفاء.

### ✨ جديد

#### بنية البرنامج
- **PROGRAM_DATA (JSON-driven)** — بيانات الأيام/الـ phases/الستيبات في `js/program-data.js` بدل HTML يدوي. `renderProgram()` يولّد DOM مطابقاً للنسخة القديمة. (٧ أيام كاملة منذ V8.3)
- **`step-D<n>-S<n>` IDs** تبقى متطابقة بعد الـ render → البدائل المحفوظة لا تنكسر.

#### Achievements (🎖️ إنجازاتي)
- ١٦ إنجاز موزع على ٥ فئات: أساسيات، كميات، سلاسل، PRs، PRs لكل جلسة (pr_storm, pr_legend).
- popup فضي/أزرق بعد PR celebration مباشرة (يحترم 3800ms تأخير).
- لا spam: لو فُتح ١٠ دفعة، popup واحد فقط، الباقي في صفحة الإنجازات.
- شريط تقدّم: `5/16 إنجاز` مع نسبة مئوية.

#### Progress Photos (📸 صور التقدّم)
- صور تُحفظ كـ Blob في IndexedDB — تبقى على الجهاز فقط، لا CDN.
- ضغط Canvas تلقائي (1080px max، JPEG 0.85) — يوفّر ~70% مساحة.
- ٥ فئات: أمامي، جانبي، خلفي، أعلى الجسم، أسفل الجسم.
- معرض responsive (2-4 أعمدة)، fullscreen مع حذف.
- **مقارنة قبل/بعد** مع تصدير صورة JPEG مدمجة (Canvas) — تواريخ + أوزان + فرق الوزن.
- Export warning: الصور لا تُضمّن في JSON backup.
- Schema migration V3→V4: indexes على `date` و `category`.

#### Plate Calculator (🧮 حاسبة بليتات)
- يقسّم الوزن المستهدف على البليتات (greedy من الأكبر).
- ٥ خيارات بار (20/15/10/7/0 كجم) + 7 أحجام بليتات (25/20/15/10/5/2.5/1.25).
- visualization بصرية: شكل بار مع البليتات بألوان IPF القياسية.
- لو غير قابل بدقة → اقتراح الأقرب أعلى وأسفل (+ visual).
- يحفظ تفضيلات المستخدم في settings.

#### Smart Deload Detection (🛟 الاستشفاء)
- `detectDeloadNeed()` يفحص ٤ معايير:
  1. متوسط RPE > 8.5 في آخر 3 جلسات → urgency: high
  2. 0 PRs في آخر 3 + تراجع وزن → urgency: high
  3. مدة الجلسات > 1.5× المتوسط التاريخي → urgency: low
  4. > 28 يوم منذ آخر deload → urgency: low
- header banner تحت nav (sticky): «🛟 يبدو أنك تحتاج deload» مع زر «ابدأ Deload»
- عند التفعيل: `computeProgression` يقترح ×0.6 لكل الأوزان (kind: 'deload')
- Sunday auto-reset: ينتهي تلقائياً يوم الأحد التالي
- تبويب «🛟 الاستشفاء» يعرض كل المعايير المُفحوصة بـ ✓/⚠️/➖

#### Workout Reminders (🔔 تذكيرات)
- ٣ طبقات احتياط:
  1. **SW setTimeout** (Service Worker — حتى 12 ساعة)
  2. **Local check** عند فتح التطبيق (يكشف الجلسة المفوّتة بعد ساعة من الموعد)
  3. **.ics export** — ملف تقويم للأمان النهائي
- يحترم Notification permission state، لا يسأل بعد رفض صريح
- تكامل في Profile modal: وقت التمرين + قبل كم دقيقة + toggle تذكير الفوات
- iOS Safari: يكشف unsupported ويوجّه للـ ICS

#### Version Source of Truth
- `js/version.js` — `APP_VERSION`, `APP_BUILD`, `APP_NAME`, `APP_TITLE`, `APP_CACHE_NAME`
- service-worker.js يستخدم `importScripts('./js/version.js')` → CACHE_NAME ديناميكي
- index.html title + footer يُحدَّثان من JS عند load
- manifest.json: `"version": "8.0.0"` field

### 🛡️ Schema (DB_VERSION=4)
- V3→V4: indexes على `progressPhotos.date` و `progressPhotos.category`

### 🛡️ Service Worker
- نسخة جديدة: `bulkmode-v8-0-0` (ديناميكية من version.js)
- `SCHEDULE_REMINDER` message handler
- `notificationclick` يفتح/يركّز نافذة التطبيق
- Chart.js محلي من `./vendor/` (لا CDN)

---

## [V7.3 — RPE Integration + Notes] — 2026-05-20

استخدام RPE في الاقتراحات + كشف PR جديد + ملاحظات على السيتات والجلسات.

### ✨ جديد

#### RPE-aware Progression
- `computeProgression(lastSet, repRange, lastRpe)` صار يستخدم RPE كإشارة أولى:
  - RPE ≤7 → +٥ كجم
  - RPE 8 → +٢.٥ كجم (الافتراضي)
  - RPE 9 → حافظ على نفس الوزن (kind: 'maintain')
  - RPE 10 → -٢.٥ كجم (تخفيف)
- بدون RPE → fallback للمنطق القديم (max → +٢.٥، below min → -٢.٥)

#### Effort PR
- نوع جديد من PRs: نفس الوزن × نفس التكرار بـ RPE أقل
- يعكس تحسّن قوة حقيقي (السيت صار أسهل بنفس الحمل)
- ظاهر في احتفال PR ومجموعة الـ PRs

#### RPE Trend Chart
- رسم رابع في تبويب الرسوم — متوسط RPE لكل جلسة عبر الزمن
- خط مرجعي عند 8.5
- بنر «ارتفاع RPE المتواصل قد يعني الحاجة لـ deload» لو 3 جلسات متتالية > 8.5

#### Set + Session Notes
- زر 📝 صغير بجانب «حفظ» في كل ستيب — يفتح prompt لإضافة ملاحظة على السيت
- ملاحظة الجلسة في showSessionSummary (textarea)
- يظهران في سجل الجلسات: ملاحظة الجلسة بـ background ذهبي خفيف، ملاحظة السيت بـ tooltip
- undoSetSave يستعيد الملاحظة كحالة معلّقة للإدخال

#### Body Metrics Validation
- 6 حقول بحدود hard (مثلاً arm: 15-60 سم، weight: 30-300 كجم)
- Soft warning عند تغيّر مفاجئ عن آخر قياس
- كشف شذوذ جماعي: لو 3+ قياسات قفزت دفعة → تحذير عن خطأ في الوحدات (سم/بوصة)

### 🛡️ Service Worker
- `bulkmode-v7-3`

---

## [V7.2 — الملف الشخصي + السجل اليومي] — 2026-05-19

تخصيص للمستخدم + تتبع متغيرات نمط الحياة المؤثرة على النتيجة.

### ✨ جديد

- (#37) **Profile Modal** + حاسبة ماكروز (Mifflin-St Jeor):
  - الاسم/العمر/الطول/الوزن
  - الهدف: تضخيم/تنشيف/recomp/حفاظ
  - مستوى الخبرة
  - حساب حيّ: BMR / TDEE / السعرات / البروتين / الكارب / الدهون
- (#38) **Daily Log** (📅 سجل يومي):
  - عدّاد الماء (هدف 8 كأس)
  - عدّاد النوم (هدف 7-8 ساعة)
  - ٥ مكملات (كرياتين، بروتين، ملتي، فيتامين D، أوميجا 3)
  - Store جديد: `dailyLog` (Schema migration V2→V3)
- (#39) **RPE input** (ظاهر، استخدامه في V7.3): قائمة 6-10 لكل سيت، يحفظ في setRec.rpe
- (#41) **Meal checkboxes**: ٦ وجبات/يوم + التزام شهري
- **Daily Log Stats**: متوسط آخر 7 أيام مع الالتزام بالنسبة المئوية

### 🛡️ Service Worker
- `bulkmode-v7-2`

---

## [V7.1 — Chart.js محلي] — 2026-05-19

أمان + سرعة: ربح من إزالة الاعتماد على CDN خارجي.

### ✨ جديد
- (#31) **Chart.js محلي في `vendor/chart.umd.min.js`** — لا CDN، لا supply-chain risk
- يعمل أوفلاين من أول تحميل (لم يعد يحتاج فتح أول مرة متصلاً)
- `loadChart()` يُحمّل من `./vendor/chart.umd.min.js`

### 🛡️ Service Worker
- إزالة معالجة `cdn.jsdelivr.net`
- `bulkmode-v7-1`

---

## [V7.0 — جودة + A11y + UX] — 2026-05-18

ترقية شاملة بـ 36 إصلاح/ميزة. تحويل من «MVP» إلى **app احترافي**.

### ✨ جديد

#### Onboarding + Today UX
- (#8) **Onboarding overlay** عند أول فتح: ٣ شرائح (ترحيب + جدول الأسبوع، كيف تبدأ جلسة، تصدير أسبوعي)
- (#9) **Today highlight**: بطاقة اليوم تنفتح تلقائياً + شارة ⭐ + إطار ذهبي
- (#24) **Hero collapse** بعد أول جلسة — يتوفّر مساحة لمحتوى التطبيق

#### Substitutions
- (#10) **Scope choice** لتطبيق البديل: هذا السيت / كل اليوم / دائماً
- (#11) **syncPlanBTexts**: مزامنة نصوص Plan B تلقائياً من كتالوج البدائل
- (#12) **Skip exercise**: زر ↷ تخطّى — يُعطّل الستيب لليوم فقط

#### Tracking
- (#13) **«آخر مرة» قابلة للتبديل** لعرض «أفضل أداء» (PR)
- (#16) **Auto-progression**: اقتراح وزن السيت التالي مبني على نطاق التكرار
- (#17) **Session bar minimize**: تصغير لـ pill عائم
- (#18) **Toast undo** بعد كل save (5 ث) — يحذف السيت + يعكس PRs
- (#36) **Session heartbeat** + recovery: لو الجوال انطفأ، يقترح إنهاء الجلسة على آخر activity

#### Body & Progress
- (#14) **Body Metrics** (📏 قياسات): 6 قياسات + الوزن + مقارنات أسبوعية
- (#15) **Program Week Tracker**: شارة في session bar `أسبوع 3/12 · شهر 1/3` + deload banner

#### A11y + Performance
- (#19) **Touch targets ≥44×44** عبر `::before { inset: -10px }`
- (#20) **Color contrast WCAG AA**: `--tx3` رفع من `#4E5568` إلى `#7A8093`
- (#21) **Latin digits** للبيانات (سيتات/تكرار/كجم) — العربية للنصوص الطبيعية
- (#22) **prefers-reduced-motion**: يلغي كل animations + grain للمستخدمين الحساسين
- (#23) **Focus indicators**: outline ذهبي على `:focus-visible`
- (#25) **Grain texture**: opacity مخفّف من .35 إلى .18، 0.05 في light mode
- (#26) **Light/Dark theme switcher**: زر في القائمة العائمة، يتبع `prefers-color-scheme`

#### Architecture + Reliability
- (#27) **Code split**: من 5210 سطر إلى 5 ملفات (data/session/substitutions/progress/app) + styles.css
- (#28) **Test page** (`test.html`): 60+ smoke tests على pure functions
- (#29) **Namespaced KEYS**: `app:onboarded`, `session:current`, `subs:active`, إلخ — مع migration تلقائي للمفاتيح القديمة
- (#30) **Schema migrations framework**: `migrateV0toV1`, `migrateV1toV2` separate functions
- (#32) **QuotaExceededError handler**: toast واضح + اقتراح حذف القديم
- (#33) **SW update notification**: «نسخة جديدة متاحة» مع زر تحديث (SKIP_WAITING)
- (#34) **PWA install prompt**: beforeinstallprompt + iOS Safari instructions
- (#35) **AudioContext warmup** على touch/pointer/click (مش click only) — يضمن iOS

### 🛡️ Service Worker
- `bulkmode-v7-0`

---

## [V6 — البدائل الذكية] — 2026-05-11

نظام كامل لاستبدال أي تمرين ببديل ذكي عند ازدحام الجهاز.

### ✨ جديد
- **EXERCISE_ALTERNATIVES catalog**: ~25 تمرين × 3-5 بدائل = ~110+ بديل
- زر **⇄ بديل؟** تلقائي بجانب كل تمرين قابل للاستبدال
- **Bottom Sheet Modal** ينزلق من أسفل بـ swipe-to-dismiss
- **تحذير وقت الذروة** (6-9م): تعيد ترتيب البدائل حسب peakFriendly
- **اقتراح ذكي**: بعد 3 مرات استبدال متكررة → يقترح جعل البديل دائماً
- **"ما لقيت اللي يناسبك؟"**: يعرض كل الـ 24 جهاز كخيار احتياطي
- **تكامل مع V5 tracking**: السيت يُحفظ تحت اسم البديل
- **IDs مستقرة للستيبات** (`step-D<n>-S<n>`)

### 🛡️ Service Worker
- `bulkmode-v6`

---

## [V5 — المستوى ١] — 2026-05-11

تحويل من برنامج تتبع بسيط إلى تطبيق احترافي.

### ✨ جديد
- **IndexedDB** كامل: 7 stores + indexes + migration تلقائي من LocalStorage
- **Workout Sessions**: زر «بدء الجلسة» + شريط نشط + شاشة ملخص
- **Personal Records تلقائية** (4 أنواع): Weight, Reps, Volume, 1RM (Epley)
- **Smart Rest Timer**: timestamps-based، يستمر مع خمول التاب، أصوات + اهتزاز + إشعار
- **Charts** (Chart.js lazy-loaded): تطور التمرين، الحجم الأسبوعي، وزن الجسم
- **تبويب «تقدمي»** بـ 3 sub-tabs: PRs / Charts / History
- **Export/Import JSON** شامل لكل stores

### 🛡️ Service Worker
- `bulkmode-v5`

---

## [V4] — 2026-05-07

النسخة الأساسية: برنامج 12 أسبوع، APS pairs، LocalStorage tracking، مؤقت راحة بسيط، 7 تبويبات.
