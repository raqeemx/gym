# سجل التغييرات (CHANGELOG)

كل التغييرات الملحوظة بين الإصدارات.
رقم الإصدار الحالي مصدره الوحيد: [`js/version.js`](js/version.js).

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
