# BULK MODE V8 — برنامج التضخيم النهائي 💪

تطبيق ويب (PWA) لمتابعة برنامج تضخيم العضلات لمدة 12 أسبوع، مع نظام تتبع احترافي يضاهي Hevy و Strong — يعمل أوفلاين، خصوصية كاملة، بدون backend.

> **رقم الإصدار** مصدره الوحيد: [`js/version.js`](js/version.js).
> **تفاصيل التغييرات** بين الإصدارات: [CHANGELOG.md](CHANGELOG.md).

---

## ✨ المميزات الرئيسية

### 🗄️ بنية احترافية
- **PWA يعمل أوفلاين** — بعد التثبيت لا يحتاج إنترنت
- **IndexedDB** — 8 stores، schema migrations framework
- **خصوصية ١٠٠٪** — كل بيانة على جهازك، لا backend، لا analytics، لا cookies
- **تصدير/استيراد JSON** — نسخة احتياطية شاملة
- **RTL عربي** — مصمّم خصيصاً للقراءة العربية

### 🏋️ تتبّع التمارين
- **جلسات كاملة** مع شريط جلسة نشط (مدة، سيتات، PRs) — قابل للتصغير لـ pill عائم
- **اكتشاف PRs تلقائي** (5 أنواع): Weight, Reps, Volume, 1RM (Epley), **Effort** (نفس الوزن×التكرار بـ RPE أقل)
- **مؤقت راحة ذكي** يعتمد على timestamps + إشعار + اهتزاز + صوت
- **Undo بعد كل save** (5 ثوانٍ) مع زر تراجع — يحذف السيت + يعكس PRs
- **RPE input** اختياري (6-10) — يُستخدم في اقتراح الوزن التالي
- **ملاحظات** على كل سيت + كل جلسة — ظاهرة في سجل الجلسات
- **Skip exercise** لليوم فقط — لو ركبتك تؤلمك مثلاً

### 🧠 الذكاء
- **RPE-aware progression**: لو RPE 7 (سهل) → +5 كجم، RPE 9 (قريب من الفشل) → حافظ على الوزن، RPE 10 → -2.5
- **Smart Deload Detection** (🛟): يفحص 4 معايير (RPE>8.5، تراجع PRs، طول الجلسات، زمن منذ آخر deload) ويقترح deload يلقائياً
- **Substitutions** ذكية (~110 بديل): كتالوج كامل + Plan B تلقائي من الكتالوج + تحذير وقت الذروة + اقتراح دائم بعد 3 تكرارات
- **Today highlight**: بطاقة اليوم تفتح تلقائياً + شارة ⭐
- **Onboarding overlay** عند أول فتح: 3 شرائح ترحيب

### 📊 التقدّم (8 تبويبات فرعية في «تقدمي»)
- 🏆 **الأرقام القياسية** — مرجع سريع لأفضل أرقامك
- 🎖️ **إنجازاتي** — 16 إنجاز موزع على 5 فئات
- 🛟 **الاستشفاء** — كشف ذكي لحاجة deload + معايير
- 📊 **الرسوم البيانية** — 4 رسوم: تطور تمرين، حجم أسبوعي، وزن الجسم، **معدل RPE**
- 📏 **قياسات الجسم** — 6 قياسات + الوزن، مع validation و كشف خطأ الوحدات
- 📅 **سجل يومي** — ماء، نوم، مكملات، وجبات + معدل التزام 7 أيام
- 📸 **صور التقدّم** — gallery مع مقارنة قبل/بعد (canvas merged JPEG)
- 📜 **سجل الجلسات** — كل الجلسات بترتيب زمني عكسي

### 🧮 أدوات إضافية
- **Plate Calculator** 🧮 — يقسّم الوزن المستهدف على البليتات لكل جانب مع visualization ملوّن (IPF standards)
- **Profile + حاسبة ماكروز** 👤 — Mifflin-St Jeor، حسب الهدف (تضخيم/تنشيف/recomp)
- **Workout Reminders** 🔔 — تذكير قبل التمرين عبر SW + ملف `.ics` للتقويم كاحتياط
- **Test page** (`test.html`) — 60+ smoke tests على الدوال النقيّة

### 🎨 A11y + UX
- **Light/Dark theme** يتبع نظام الجهاز افتراضياً
- **WCAG AA color contrast** (--tx3 على bg = 5.13:1)
- **Touch targets ≥44×44** عبر `::before` شفافة
- **Focus indicators** على `:focus-visible`
- **prefers-reduced-motion** — يلغي كل animations
- **Arabic digits في النصوص الطبيعية، Latin digits في البيانات**

---

## 🚀 رفع الموقع على GitHub Pages

### الخطوة ١: أنشئ مستودع جديد

١. اذهب إلى [github.com/new](https://github.com/new)  
٢. **Repository name:** `bulkmode` (أو أي اسم)  
٣. اجعله **Public**  
٤. اضغط **Create repository**

### الخطوة ٢: ارفع الملفات

**عبر الواجهة:**

ارفع البنية التالية:
```
bulkmode/
├── index.html
├── manifest.json
├── service-worker.js
├── README.md
├── CHANGELOG.md
├── test.html
├── css/
│   └── styles.css
├── js/
│   ├── version.js
│   ├── data.js
│   ├── program-data.js
│   ├── program-render.js
│   ├── session.js
│   ├── substitutions.js
│   ├── progress.js
│   ├── achievements.js
│   ├── progress-photos.js
│   ├── plate-calc.js
│   ├── reminders.js
│   └── app.js
├── vendor/
│   └── chart.umd.min.js
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

**أو عبر terminal:**
```bash
git init
git add .
git commit -m "Initial deploy V8"
git branch -M main
git remote add origin https://github.com/USERNAME/bulkmode.git
git push -u origin main
```

### الخطوة ٣: فعّل GitHub Pages

١. **Settings** → **Pages**  
٢. **Source**: Deploy from a branch  
٣. **Branch**: main / (root) → Save  
٤. انتظر ١-٢ دقيقة → `https://USERNAME.github.io/bulkmode/`

### الخطوة ٤: ثبّت التطبيق

**Android (Chrome/Edge):** افتح الرابط → "إضافة إلى الشاشة الرئيسية" أو من القائمة (⋮).

**iOS (Safari فقط):** افتح الرابط → زر المشاركة → "إضافة إلى الشاشة الرئيسية".

**ميزة V7+:** زر «📲 ثبّت التطبيق» يظهر تلقائياً لو المتصفح يدعم `beforeinstallprompt`.

---

## 📊 كيف تستخدم

### تسجيل جلسة كاملة
١. تبويب **«التمارين»** → اليوم يكون **مفتوحاً تلقائياً** (V7 today highlight)  
٢. اضغط **▶ بدء الجلسة** → شريط أحمر بالأعلى  
٣. تحت كل سيت: **كجم** + **تكرار** + **RPE** (اختياري) + 📝 ملاحظة (اختياري)  
٤. **حفظ** → السيت أخضر، مؤقت راحة يبدأ، toast undo لـ 5 ثوان  
٥. **🏆 PR؟** احتفال + اهتزاز  
٦. **إنهاء** → شاشة ملخص + خانة ملاحظة الجلسة

### Smart Suggestions (RPE-aware)
بعد كل سيت، يظهر اقتراح للوزن التالي:
- **RPE 7** (سهل) → +5 كجم
- **RPE 8** (مثالي) → +2.5 كجم
- **RPE 9** (قريب من الفشل) → نفس الوزن
- **RPE 10** (الفشل) → -2.5 كجم
- **بدون RPE** → fallback على نطاق التكرار

في **deload mode**: كل اقتراح ×0.6 تلقائياً.

### تتبّع نمط الحياة (📅 سجل يومي)
- ماء، نوم، مكملات (5)، وجبات (6)
- يُعرض متوسط الالتزام آخر 7 أيام مع نسبة مئوية
- يصدّر مع JSON backup

### قياسات الجسم الشهرية (📏)
- 6 قياسات (ذراع، صدر، كتف، فخذ، خصر، وزن) مع **validation**:
  - Hard limits: 15-60 سم للذراع، 30-300 كجم للوزن، إلخ
  - Soft warning عند تغيّر مفاجئ
  - كشف خطأ الوحدات (سم/بوصة، كجم/رطل) لو قفزت 3+ قياسات معاً

### صور التقدّم (📸)
- ضغط Canvas تلقائي (1080px max، JPEG 0.85) — يبقى الـ blob في IndexedDB
- مقارنة قبل/بعد مع تصدير صورة JPEG مدمجة (تواريخ + أوزان + فرق)
- ⚠️ الصور **لا تُضمّن** في JSON backup (حجمها كبير) — صدّرها يدوياً

### إنجازات (🎖️)
16 إنجاز يُفتح تلقائياً بعد كل save/endSession، popup فضي/أزرق (مختلف عن PR الذهبي).

### تذكيرات التمرين (🔔 من Profile)
3 طبقات احتياط:
1. SW setTimeout (≤12 ساعة)
2. Local check عند فتح التطبيق (يكشف الجلسة المفوّتة)
3. **.ics export** للتقويم — الأكثر موثوقية، خصوصاً لـ iOS Safari

### النسخ الاحتياطي ⚠️ مهم
البيانات على متصفح جوالك فقط. لو مسحت بيانات المتصفح = تخسر التاريخ.

**اعمل تصدير كل أسبوع** (📊 → 💾 تصدير البيانات). يحفظ JSON يشمل: workouts, sets, exercises, bodyMetrics, dailyLog, prs, settings.

> **الصور (📸) لا تُضمّن في الـ JSON** — احفظها يدوياً.

التطبيق يذكّرك بالتصدير لو مرّ 7 أيام بدون نسخة احتياطية.

---

## 🛠 التطوير المحلي

```bash
cd bulkmode
python3 -m http.server 8000
# أو
npx serve
```

افتح `http://localhost:8000`.

**ملاحظة:** Service Worker لا يعمل من `file://`.

### التطوير في الكود
- بيانات الأيام في [js/program-data.js](js/program-data.js) (٧ أيام كاملة: UPPER A/B + BACK & WINGS + ARMS A/B + LEGS + REST)
- منطق الجلسات + RPE + deload في [js/session.js](js/session.js)
- شجرة الإنجازات في [js/achievements.js](js/achievements.js)
- نمط الـ CSS في [css/styles.css](css/styles.css)
- **رقم النسخة**: غيّر في [js/version.js](js/version.js) فقط — كل شيء آخر يتبع

### Smoke Tests
افتح [test.html](test.html) في المتصفح → 60+ assertions على pure functions (EPLEY, computeStreak, parseRepRange, computeProgression الـ RPE-aware، إلخ).

---

## 📂 بنية الملفات

```
bulkmode/
├── index.html              # HTML (1300 سطر) + tabs + modals
├── manifest.json           # PWA + version
├── service-worker.js       # cache + reminders + SW updates
├── README.md               # هذا الملف
├── CHANGELOG.md            # تاريخ الإصدارات
├── test.html               # smoke tests
├── css/
│   └── styles.css          # كل الـ CSS
├── js/
│   ├── version.js          # 🎯 مصدر النسخة الوحيد
│   ├── data.js             # IndexedDB + KEYS + migrations + utils
│   ├── program-data.js     # PROGRAM_DATA (JSON-driven)
│   ├── program-render.js   # renderProgram() → HTML
│   ├── session.js          # sessions + sets + PRs + RPE + deload + timer
│   ├── substitutions.js    # alternatives + skip + Plan B sync
│   ├── progress.js         # PRs + charts + body metrics + daily log + photos tab
│   ├── achievements.js     # ACHIEVEMENTS array + check + celebrate
│   ├── progress-photos.js  # photo upload + gallery + compare + ICS
│   ├── plate-calc.js       # plate calculator
│   ├── reminders.js        # notifications + .ics export + local check
│   └── app.js              # init + nav + theme + onboarding + today + week
├── vendor/
│   └── chart.umd.min.js    # Chart.js محلي
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## ⚠️ ملاحظات مهمة

- **التخزين محلي فقط**: لا حساب، لا تسجيل دخول، لا تتبع.
- **خصوصية كاملة**: لا analytics، لا cookies، لا اتصال خارجي (إلا Google Fonts عند أول تحميل، يُخزَّن).
- **لا مزامنة بين الأجهزة**: استخدم export/import JSON.
- **الصور لا تُضمّن في النسخة الاحتياطية**.
- **iOS Safari محدود**: Notification API يحتاج install كـ PWA. ICS export احتياط مضمون.

---

## 🧠 البنية التقنية

| المكوّن | التفاصيل |
|--------|-----------|
| **IndexedDB** | 8 stores · 4 schema migrations · indexes على date/category/exerciseName |
| **Storage Keys** | namespaced: `app:*`, `session:*`, `subs:*` |
| **PRs Detection** | 5 أنواع: Weight, Reps, Volume, 1RM (Epley), **Effort** (RPE-based) |
| **Rest Timer** | timestamp-based (Date.now())، يستمر مع خمول التاب |
| **Chart.js** | محلي في `vendor/`، lazy-loaded عند فتح تبويب الرسوم |
| **Notification + Vibration + Audio APIs** | للراحة، PRs، الإنجازات، التذكيرات |
| **Page Visibility API** | للحفاظ على دقّة المؤقت |
| **Service Worker** | offline cache · update notification · workout reminders · SKIP_WAITING |
| **Code Architecture** | classic scripts (لا modules) · 13 ملف JS منفصل · مصدر نسخة وحيد |

---

## 🆕 ما الجديد في V8؟

راجع [CHANGELOG.md](CHANGELOG.md) للتفاصيل. أبرز إضافات V8:

- 🎖️ **نظام إنجازات** (16 إنجاز)
- 📸 **صور التقدّم** + مقارنة canvas
- 🧮 **حاسبة بليتات** بصرية
- 🛟 **Smart Deload Detection** (4 معايير)
- 🔔 **Workout Reminders** (SW + ICS)
- 🏗️ **Program JSON refactor** (كل ٧ الأيام منقولة إلى `js/program-data.js`)
- 🎯 **Version source of truth** (`js/version.js`)

---

## 📜 الترخيص

استخدام شخصي. التصميم والكود مبنيان خصيصاً لـ Abdulrahman Alyahya.

---

## ❓ مشاكل شائعة

**"التطبيق لا يعمل أوفلاين"**  
زر الموقع مرة واحدة متصلاً — Service Worker يحتاج التشغيل أول مرة ليحفظ كل شيء.

**"إضافة إلى الشاشة الرئيسية لا تظهر"**  
- Chrome/Edge على Android: تأكد من إصدار حديث
- Safari على iOS فقط (ليس Chrome على iOS)
- الموقع يجب أن يكون على `https://`

**"التذكيرات لا تشتغل على iPhone"**  
iOS Safari لا يدعم Notification API كاملاً. استخدم **`📅 صدّر للتقويم`** من Profile modal — يولّد `.ics` يُستورد لتقويم iOS مع تكرار أسبوعي 12 مرة (مضمون 100%).

**"البيانات اختفت فجأة"**  
على الأغلب مسحت بيانات المتصفح. لا يمكن استرجاعها بدون JSON backup. **اعمل تصدير كل أسبوع.**

**"الـ Smart Deload يقترح وأنا قوي"**  
يفحص ٤ معايير. لو غير دقيق في حالتك: تجاهله — هو اقتراح بصري فقط، لا يُفرض. أو تجاهل المعيار الذي يطلق (مثلاً، RPE — لا تستخدمه).

**"رقم النسخة لا يتحدّث بعد تحديث الكود"**  
- غيّر `APP_VERSION` في [`js/version.js`](js/version.js) فقط
- Hard refresh (Ctrl+Shift+R) أو إغلاق-فتح التطبيق ليلتقط الـ SW الجديد
- ستظهر toast «🔄 نسخة جديدة متاحة» مع زر تحديث (V7 #33)
