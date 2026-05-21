# سجل التغييرات (CHANGELOG)

كل التغييرات الملحوظة بين الإصدارات.
رقم الإصدار الحالي مصدره الوحيد: [`js/version.js`](js/version.js).

---

## [V8.0 — برنامج JSON + إنجازات + صور تقدّم + Smart Deload] — 2026-05-21

أكبر ترقية معمارية: فصل بيانات البرنامج عن HTML، إضافة ميزات شخصية متعددة، وكشف ذكي لحاجة الاستشفاء.

### ✨ جديد

#### بنية البرنامج
- **PROGRAM_DATA (JSON-driven)** — بيانات الأيام/الـ phases/الستيبات في `js/program-data.js` بدل HTML يدوي. `renderProgram()` يولّد DOM مطابقاً للنسخة القديمة. (UPPER A فقط حالياً — باقي الأيام قادمة)
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
