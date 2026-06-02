# BULK MODE V9 — برنامج التضخيم 💪

تطبيق ويب (PWA) لمتابعة برنامج تضخيم العضلات لمدة 12 أسبوع، مع نظام تتبّع احترافي يضاهي Hevy و Strong — يعمل أوفلاين، خصوصية كاملة، بدون backend.

> **رقم الإصدار** مصدره الوحيد: [`js/version.js`](js/version.js) · **تفاصيل كل إصدار:** [CHANGELOG.md](CHANGELOG.md)
> **النسخة الحيّة:** https://raqeemx.github.io/gym/

---

## ✨ المميزات الرئيسية

### 🗄️ بنية احترافية
- **PWA يعمل أوفلاين** — بعد التثبيت لا يحتاج إنترنت
- **IndexedDB** — 9 stores + إطار schema migrations (الإصدار الحالي 5)
- **خصوصية ١٠٠٪** — كل بيانة على جهازك: لا backend، لا analytics، لا cookies، لا تسجيل دخول
- **تصدير/استيراد JSON شامل** — نسخة احتياطية كاملة (تشمل الإعدادات والملف الشخصي والتغذية)، مع تطبيع آمن للنسخ القديمة
- **نسخ احتياطي تلقائي** (File System Access) — يكتب ملفاً لمجلد تختاره عند كل تصدير
- **RTL عربي** — مصمّم خصيصاً للقارئ العربي، وليس ترجمة

### 🏠 الرئيسية (Dashboard)
لوحة تجيب على ٣ أسئلة فوراً: *ما البرنامج؟ · ماذا سأستفيد؟ · ما أول زر أضغطه؟* وتعرض:
- **تمرين اليوم** (أكبر عنصر) + أوزان اليوم الجاهزة
- ملخص البرنامج (٦ شارات) + ملخص التقدّم (الأسبوع X/6، آخر جلسة/وزن/PR، الالتزام%)
- تغذية مختصرة (سعرات + ماكروز + الوجبة التالية) + شارة الأسبوع X/12 و deload

### 🏋️ تتبّع التمارين
- **جلسات كاملة** مع شريط جلسة نشط (المدة، السيتات، PRs) + شريط تقدّم الجلسة
- **اكتشاف PRs تلقائي** (5 أنواع): Weight, Reps, Volume, 1RM (Epley)، **Effort** (نفس الوزن×التكرار بـ RPE أقل)
- **مؤقت راحة ذكي** يبدأ تلقائياً بعد حفظ السيت، يعتمد على timestamps + إشعار + اهتزاز + صوت
- **Undo بعد كل save** (5 ثوانٍ) — يحذف السيت ويعكس الـ PRs
- **إدخال صوتي** للوزن/التكرار (Web Speech API) — لليدين المشغولتين في الجيم
- **RPE input** اختياري (6-10) — يُستخدم في اقتراح الوزن التالي
- **ملاحظات** على كل سيت وكل جلسة + **Skip exercise** لليوم فقط
- **جدول الأسبوع كبطاقات أيام** + تبويبات التمارين حسب اليوم

### 🧠 الذكاء
- **RPE-aware progression**: RPE 7 (سهل) → +5 كجم · RPE 8 → +2.5 · RPE 9 → ثبات · RPE 10 → -2.5
- **Smart Deload Detection** (🛟): يفحص ٤ معايير (RPE>8.5، تراجع PRs، طول الجلسات، الزمن منذ آخر deload) ويقترح deload
- **Smart Next Workout**: يقترح أنسب يوم تدريب تالٍ حسب جدولك وما فاتك
- **Substitutions** ذكية (~110 بديل): كتالوج كامل + Plan B تلقائي + تحذير وقت الذروة + اقتراح بعد التكرار
- **مراجعة أسبوعية** تلقائية + **عدّاد الـ streak** بصفحة مخصّصة

### 🍽️ التغذية
- **أهداف ماكروز** محسوبة (Mifflin-St Jeor حسب الهدف) — سعرات/بروتين/كارب/دهون
- **قاعدة أطعمة** + تسجيل وجبات فعلية + **قائمة مشتريات**
- سجل ١٤ يوم + شريط تقدّم يومي مقابل الهدف

### 📊 التقدّم (تبويبات «تقدّمي»)
- 🎖️ **إنجازاتي** — 16 إنجاز على 5 فئات + 🏆 الأرقام القياسية
- 🛟 **الاستشفاء** — كشف ذكي لحاجة deload + معاييره
- 📊 **التحليلات** — رسوم (تطور تمرين، حجم أسبوعي، وزن الجسم، معدل RPE) + سجل الجلسات + أنماط البدائل
- 📏 **قياسات الجسم** — 6 قياسات + الوزن، مع validation وكشف خطأ الوحدات
- 📅 **سجل يومي** — ماء، نوم، مكملات، وجبات + معدل التزام
- 📸 **صور التقدّم** — gallery + مقارنة قبل/بعد (canvas merged JPEG)

### 🧮 أدوات إضافية
- **Plate Calculator** 🧮 — يقسّم الوزن على البليتات لكل جانب مع visualization ملوّن
- **محرّر البرنامج** ✏️ — تعديل أيام/تمارين البرنامج (per-day overrides namespaced لكل برنامج)
- **قوالب برامج متعددة** — `upper-priority` (الافتراضي)، `full-body-3day`، `upper-lower-4day`
- **إدارة جيمات متعددة** 🏋️ — ملفات جيمات + أجهزة لكل جيم + تبديل سريع، والأجهزة حسب العضلة
- **التقويم** 📅 — عرض الجلسات على شهر + التنقّل بينها
- **Profile + حاسبة ماكروز** 👤 + **Workout Reminders** 🔔 (SW + ملف `.ics`)
- **Test page** (`test.html`) — smoke tests على الدوال النقيّة

### 🎨 واجهة + A11y
- **لا أيقونات عائمة** — كل الأدوات في درج «المزيد» (من الشريط السفلي على الموبايل، ومن زر «⋯ المزيد» بالشريط العلوي على سطح المكتب)؛ مؤقت الراحة زر ثابت أثناء الجلسة
- **تنقّل سفلي** على الموبايل (اليوم · التمارين · التقدم · التغذية · المزيد) + درج منزلق
- **Light/Dark theme** يتبع نظام الجهاز افتراضياً · WCAG AA contrast · Touch targets ≥44×44
- **safe-area insets** للشاشات المنحوتة · `prefers-reduced-motion`

---

## 🚀 النشر على GitHub Pages

المستودع يُنشر مباشرةً من فرع `main` (لا build step — ملفات ثابتة).

```bash
git add .
git commit -m "deploy"
git push origin main
# Settings → Pages → Source: Deploy from a branch → main / (root)
# النتيجة خلال ١-٢ دقيقة: https://USERNAME.github.io/REPO/
```

### تثبيت التطبيق
- **Android (Chrome/Edge):** افتح الرابط → «إضافة إلى الشاشة الرئيسية».
- **iOS (Safari فقط):** زر المشاركة → «إضافة إلى الشاشة الرئيسية».
- يظهر زر «📲 ثبّت التطبيق» تلقائياً عند دعم `beforeinstallprompt`.

---

## 📊 كيف تستخدم

### تسجيل جلسة كاملة
١. تبويب **«التمارين»** → اليوم مفتوح تلقائياً
٢. **▶ بدء الجلسة** → شريط جلسة بالأعلى
٣. تحت كل سيت: **كجم** + **تكرار** + **RPE** (اختياري) + 📝 ملاحظة — أو استخدم الإدخال الصوتي
٤. **حفظ** → السيت أخضر، مؤقت الراحة يبدأ تلقائياً، toast undo لـ 5 ثوانٍ
٥. **🏆 PR؟** احتفال + اهتزاز
٦. **إنهاء** → شاشة ملخص + ملاحظة الجلسة

### النسخ الاحتياطي ⚠️ مهم
البيانات على متصفح جهازك فقط. **صدّر كل أسبوع** من درج «المزيد» → 💾 تصدير البيانات (JSON يشمل: workouts, sets, exercises, bodyMetrics, dailyLog, foodEntries, prs, settings). الاستيراد من 📥 استيراد البيانات، ويستعيد كل ذلك مع تطبيع آمن للنسخ القديمة.

> **الصور (📸) لا تُضمّن في الـ JSON** (حجمها كبير) — احفظها يدوياً. والتطبيق يذكّرك بالتصدير بعد ٧ أيام.

---

## 🛠 التطوير المحلي

```bash
python -m http.server 8000   # أو: npx serve
# افتح http://localhost:8000  (الـ Service Worker لا يعمل من file://)
```

- بيانات الأيام في [js/program-data.js](js/program-data.js) · القوالب في [js/program-templates.js](js/program-templates.js)
- منطق الجلسات + RPE + deload في [js/session.js](js/session.js) · الذكاء في [js/smart-recovery.js](js/smart-recovery.js) و[js/smart-next-workout.js](js/smart-next-workout.js)
- **رقم النسخة:** غيّر `APP_VERSION` في [js/version.js](js/version.js) فقط — كل شيء آخر يتبع (SW، manifest، الواجهة)
- **Smoke tests:** افتح [test.html](test.html) — assertions على الدوال النقيّة (EPLEY، computeStreak، parseRepRange، progression الـ RPE-aware، إلخ)

---

## 📂 بنية الملفات (33 ملف JS)

```
gym/
├── index.html              # HTML + tabs + modals + bottom-nav/drawer
├── manifest.json           # PWA + version
├── service-worker.js       # cache (network-first HTML · SWR للأصول) + reminders + SKIP_WAITING
├── README.md · CHANGELOG.md · PROJECT_BRIEF.md
├── test.html               # smoke tests
├── css/styles.css          # كل الـ CSS (RTL · theming · responsive)
├── vendor/chart.umd.min.js # Chart.js محلي (lazy)
├── icons/                  # icon-192/512
└── js/
    ├── version.js          # 🎯 مصدر النسخة الوحيد
    ├── data.js             # IndexedDB · KEYS namespaced · migrations · showToast · utils
    ├── data-helpers.js     # تواريخ بدء البرامج · حساب الأسبوع · overrides
    ├── program-data.js     # PROGRAM_DATA (البرنامج الافتراضي)
    ├── program-templates.js# قوالب برامج متعددة + getActiveProgram
    ├── program-render.js   # renderProgram() → HTML
    ├── program-editor.js   # محرّر أيام/تمارين البرنامج
    ├── session.js          # الجلسات · السيتات · PRs · RPE · deload · المؤقت · الثيم
    ├── pr-detection.js     # منطق اكتشاف الـ PRs (5 أنواع)
    ├── auto-rest.js        # بدء مؤقت الراحة تلقائياً بعد الحفظ
    ├── substitutions.js    # البدائل · skip · Plan B
    ├── progress.js         # تبويب التقدّم · الرسوم · القياسات · السجل اليومي · التصدير/الاستيراد
    ├── achievements.js     # 16 إنجاز · check · celebrate
    ├── progress-photos.js  # رفع الصور · gallery · مقارنة · ICS
    ├── dashboard.js        # الرئيسية (Dashboard)
    ├── nutrition.js        # التغذية · أهداف الماكروز · قائمة المشتريات
    ├── foods-database.js   # قاعدة الأطعمة
    ├── calendar.js         # تبويب التقويم
    ├── exercise-history.js # سجل كل تمرين
    ├── exercise-media.js   # وسائط/ملاحظات أداء التمرين
    ├── smart-recovery.js   # كشف حاجة الـ deload
    ├── smart-next-workout.js# اقتراح التمرين التالي
    ├── weekly-review.js    # المراجعة الأسبوعية
    ├── streak-page.js      # صفحة الـ streak
    ├── voice-input.js      # الإدخال الصوتي (Web Speech)
    ├── gyms.js             # إدارة الجيمات المتعددة
    ├── gym-mode.js         # وضع الجيم/التركيز أثناء الجلسة
    ├── plate-calc.js       # حاسبة البليتات
    ├── reminders.js        # الإشعارات · تصدير .ics · فحص محلي
    ├── auto-backup.js      # نسخ احتياطي تلقائي (File System Access)
    ├── mobile-fixes.js     # تحسينات الموبايل
    ├── ui-v99.js           # واجهة V9 · التنقّل السفلي · الدرج
    └── app.js              # init · nav · onboarding · today · تسجيل الـ SW
```

---

## 🧠 البنية التقنية

| المكوّن | التفاصيل |
|--------|-----------|
| **IndexedDB** | 9 stores (`workouts`, `sets`, `exercises`, `bodyMetrics`, `prs`, `progressPhotos`, `settings`, `dailyLog`, `foodEntries`) · schema v5 |
| **Storage Keys** | namespaced: `app:*` · `session:*` · `subs:*` |
| **PRs Detection** | 5 أنواع: Weight · Reps · Volume · 1RM (Epley) · Effort (RPE-based) |
| **Rest Timer** | timestamp-based، يستمر مع خمول التاب (Page Visibility API) |
| **Programs** | قوالب متعددة + per-day overrides namespaced + تواريخ بدء لكل برنامج |
| **Chart.js** | محلي في `vendor/`، lazy عند فتح التحليلات |
| **Web APIs** | Notification · Vibration · Audio · Web Speech (إدخال صوتي) · File System Access (نسخ تلقائي) |
| **Service Worker** | HTML: network-first · الأصول: stale-while-revalidate · `updateViaCache:'none'` + `reg.update()` عند العودة → التحديثات تظهر تلقائياً |
| **معمارية الكود** | classic scripts (لا modules) · 33 ملف JS · مصدر نسخة وحيد · بدون build step |

---

## ⚠️ ملاحظات مهمة

- **التخزين محلي فقط** — لا حساب، لا تسجيل دخول، لا تتبع.
- **لا مزامنة بين الأجهزة** — استخدم export/import JSON.
- **الصور لا تُضمّن في النسخة الاحتياطية**.
- **iOS Safari محدود** — Notification API يحتاج تثبيت كـ PWA؛ ICS export احتياط مضمون.

---

## ❓ مشاكل شائعة

**«التطبيق لا يعمل أوفلاين»** — زر الموقع مرة متصلاً أولاً ليُفعّل الـ Service Worker ويحفظ الأصول.

**«إضافة إلى الشاشة الرئيسية لا تظهر»** — Chrome/Edge حديث على Android، أو Safari على iOS (ليس Chrome على iOS)، والموقع على `https://`.

**«التذكيرات لا تشتغل على iPhone»** — استخدم **«📅 صدّر للتقويم»** من Profile — يولّد `.ics` يُستورد لتقويم iOS مع تكرار أسبوعي (مضمون).

**«البيانات اختفت»** — على الأغلب مُسحت بيانات المتصفح، ولا استرجاع بدون JSON backup. **صدّر كل أسبوع.**

**«التحديثات لا تظهر»** — مُعالَج: الـ SW يفحص النسخة من الشبكة مباشرةً ويطبّقها عند العودة للتطبيق؛ قد تحتاج تحديثاً واحداً لتجاوز نسخة قديمة عالقة لمرة أخيرة.

---

## 📜 الترخيص

استخدام شخصي. التصميم والكود مبنيان خصيصاً لصاحب المشروع.
