/* ============ BULK MODE V5 — LEVEL 1 ============
 * IndexedDB + Workout Sessions + Automatic PRs + Smart Rest Timer + Charts
 * Offline-first, vanilla JS, single file.
 * ============================================== */

// ============ TAB NAVIGATION ============
// V8.4 (P3-UX-#7) — حفظ/استعادة موضع التمرير لكل tab
function _currentTabId(){
  const b=document.querySelector('.nb.a');
  return b?b.dataset.t:'1';
}
function _saveTabScroll(){
  try{
    const t=_currentTabId();
    sessionStorage.setItem('scroll:t'+t,String(window.scrollY||document.documentElement.scrollTop||0));
  }catch(e){}
}
function _restoreTabScroll(tabId){
  try{
    const saved=sessionStorage.getItem('scroll:t'+tabId);
    if(saved!=null){
      const y=parseInt(saved)||0;
      // requestAnimationFrame ليكون بعد transition + render
      requestAnimationFrame(()=>{
        window.scrollTo({top:y,behavior:'auto'});
      });
      return true;
    }
  }catch(e){}
  return false;
}
// V9.0 (P5) — switchToTab: تبديل برمجي للـ tab بدون الحاجة لزر nav موجود.
// يُستخدم من guide-hub cards و dashboard CTAs للوصول لـ tabs ليس لها زر مباشر (t2/t3/t4/t6).
function switchToTab(tabId){
  const id=String(tabId);
  _saveTabScroll();
  document.querySelectorAll('.nb').forEach(x=>x.classList.remove('a'));
  document.querySelectorAll('.sec').forEach(x=>x.classList.remove('a'));
  // فعّل زر nav المطابق لو موجود (للـ tabs الـ ٥ الأساسية)
  const btn=document.querySelector('.nb[data-t="'+id+'"]');
  if(btn) btn.classList.add('a');
  const sec=document.getElementById('t'+id);
  if(sec) sec.classList.add('a');
  const restored=_restoreTabScroll(id);
  if(!restored){
    window.scrollTo({top:document.querySelector('.nav').offsetTop,behavior:'smooth'});
  }
  if(id==='7' && typeof refreshProgressTab==='function') refreshProgressTab();
  if(id==='8' && typeof refreshCalendar==='function'){
    if(typeof calendarToday==='function' && !_calCursor) calendarToday();
    else refreshCalendar();
  }
  // V9.0 (P2) — Dashboard refresh عند فتح الرئيسية
  if(id==='0' && typeof refreshDashboard==='function') refreshDashboard();
}

document.querySelectorAll('.nb[data-t]').forEach(b=>{
  b.addEventListener('click',()=>switchToTab(b.dataset.t));
});
// V8.4 (P3-UX-#7) — احفظ الموقع عند مغادرة الصفحة لتعويد بعد reload
window.addEventListener('beforeunload',_saveTabScroll);

// ============ DAY TOGGLE ============
// V8.4 (P2-UX-#4) — عند فتح اليوم يدوياً، اسكرول حتى يظهر زر "بدء الجلسة" تحت الـ nav
function tg(e){
  // لا تطوي عند الضغط على الأزرار داخل اليوم
  if(event && event.target.closest('.session-ctrl,.track-input,.save-btn,.dby')) return;
  const willOpen=!e.classList.contains('open');
  e.classList.toggle('open');
  if(willOpen){
    // انتظر transition قليلاً (max-height يستغرق ~500ms) ثم اسكرول
    setTimeout(()=>{
      // ضع رأس البطاقة تحت الـ nav (~54px) ليظهر زر "بدء" فور الفتح
      const rect=e.getBoundingClientRect();
      const navH=document.querySelector('.nav')?.offsetHeight||48;
      const target=window.pageYOffset+rect.top-navH-8;
      window.scrollTo({top:target,behavior:'smooth'});
    },120);
  }
}

// ============ SCROLL PROGRESS + BACK TO TOP ============
window.addEventListener('scroll',()=>{
  const h=document.documentElement;
  const pct=(h.scrollTop/(h.scrollHeight-h.clientHeight))*100;
  document.getElementById('progressBar').style.width=pct+'%';
  const btt=document.getElementById('bttBtn');
  if(h.scrollTop>600){btt.classList.add('show')}else{btt.classList.remove('show')}
},{passive:true});

function scrollTop(){window.scrollTo({top:0,behavior:'smooth'})}

// V8.4 (P1-#6) — HTML escape helper (نُقل من progress.js ليكون global قبل أوّل استخدام)
// استخدمه لكل نص يأتي من المستخدم قبل إدراجه في innerHTML
function escHTML(str){
  if(str==null) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}

// ============ V8.4 (P2-#6) — MODAL STACK MANAGER ============
// LIFO stack يدير z-index تلقائياً لتجنّب صراعات الطبقات عند فتح عدّة modals
// الاستخدام: ModalStack.push(elementOrId) عند الفتح، ModalStack.pop(elementOrId) عند الإغلاق
// أعلى modal مفتوح يحصل على أعلى z-index. مفيد لمنع layering bugs.
const ModalStack = (function(){
  // قاع الـ z-index لأي modal مدفوع للستاك (يبدأ من 10100 ليكون فوق كل العناصر العادية)
  const BASE_Z = 10100;
  // قائمة الـ modals المفتوحة بترتيب الفتح (الأخير = أعلى)
  const stack = [];
  function _resolve(el){
    if(!el) return null;
    if(typeof el === 'string') return document.getElementById(el);
    return el;
  }
  function push(elOrId){
    const el = _resolve(elOrId);
    if(!el) return -1;
    // إذا موجود سابقاً، أزله ثم أضفه للأعلى (re-open)
    const i = stack.indexOf(el);
    if(i >= 0) stack.splice(i, 1);
    stack.push(el);
    // طبّق z-index: الأول=BASE_Z, الثاني=BASE_Z+10, ...
    const z = BASE_Z + (stack.length - 1) * 10;
    el.style.zIndex = String(z);
    // علّم على body لو فيه modal مفتوح
    document.body.classList.add('modal-open');
    return z;
  }
  function pop(elOrId){
    const el = _resolve(elOrId);
    if(!el) return;
    const i = stack.indexOf(el);
    if(i >= 0) stack.splice(i, 1);
    el.style.zIndex = '';
    if(stack.length === 0) document.body.classList.remove('modal-open');
  }
  function top(){return stack[stack.length-1]||null}
  function size(){return stack.length}
  function has(elOrId){const el=_resolve(elOrId);return el?stack.indexOf(el)>=0:false}
  // اضغط Escape يغلق الـ top modal لو موجود — مع منع تعدد المعالجات
  if(typeof document !== 'undefined' && !document._modalStackEscapeBound){
    document._modalStackEscapeBound = true;
    document.addEventListener('keydown', (e)=>{
      if(e.key !== 'Escape' || stack.length === 0) return;
      const t = top();
      if(!t) return;
      // ابحث عن close handler (يُمرَّر عبر data-modal-close)
      const closeFn = t._modalStackCloseFn;
      if(typeof closeFn === 'function'){
        e.preventDefault();
        closeFn();
      }
    });
  }
  // اربط close handler على modal — يُستدعى عند Escape أو outside-click
  function bindClose(elOrId, fn){
    const el = _resolve(elOrId);
    if(el) el._modalStackCloseFn = fn;
  }
  return { push, pop, top, size, has, bindClose, BASE_Z };
})();

// ============ V8.4 (P1-#2) — CUSTOM CONFIRM MODAL ============
// بديل أنيق لـ window.confirm() — يحترم theme التطبيق، يدعم RTL، multi-line، أيقونة، خطر/معلومات.
// الاستخدام:
//   if(await customConfirm('حذف هذا الستيب؟')) { ... }
//   await customConfirm('متابعة؟', { title:'تأكيد', okText:'احذف', cancelText:'إلغاء', danger:true, icon:'🗑' })
//
// المعاملات:
//   message: string|HTML — يدعم <b>, <br>... (escape الـ user-controlled portions من القائل قبل التمرير)
//   opts.title: عنوان مختصر (افتراضي "تأكيد")
//   opts.okText: نص زر التأكيد (افتراضي "موافق")
//   opts.cancelText: نص زر الإلغاء (افتراضي "إلغاء"). لو null = زر واحد فقط (alert-mode)
//   opts.danger: true = زر التأكيد أحمر (للعمليات الخطرة)
//   opts.icon: emoji للأيقونة (افتراضي "⚠️" للخطرة، "❓" للعادية)
let _confirmActive=null;
function customConfirm(message,opts={}){
  return new Promise(resolve=>{
    const modal=document.getElementById('confirmModal');
    if(!modal){
      // fallback آمن لو الـ modal مش موجود (مثل test.html)
      console.warn('confirmModal not in DOM — falling back to native confirm()');
      resolve(window.confirm(typeof message==='string'?message.replace(/<[^>]+>/g,''):''));
      return;
    }
    // أعدّ المحتوى
    const titleEl=document.getElementById('confirmTitle');
    const bodyEl=document.getElementById('confirmBody');
    const iconEl=document.getElementById('confirmIcon');
    const okBtn=document.getElementById('confirmOkBtn');
    const cancelBtn=document.getElementById('confirmCancelBtn');
    const isDanger=!!opts.danger;
    if(titleEl) titleEl.textContent=opts.title||'تأكيد';
    if(bodyEl) bodyEl.innerHTML=String(message||'');
    if(iconEl) iconEl.textContent=opts.icon||(isDanger?'⚠️':'❓');
    if(okBtn) okBtn.textContent=opts.okText||'موافق';
    okBtn.classList.toggle('danger',isDanger);
    if(opts.cancelText===null){
      cancelBtn.style.display='none';
    }else{
      cancelBtn.style.display='';
      cancelBtn.textContent=opts.cancelText||'إلغاء';
    }
    modal.classList.add('show');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    // V8.4 (P2-#6) — ادفع للستاك ليأخذ أعلى z-index تلقائياً (يحلّ صراع layering مع modals أخرى مفتوحة)
    if(typeof ModalStack!=='undefined') ModalStack.push(modal);
    // تنظيف معالجات سابقة (لمنع memory leak عند نوافذ متعدّدة)
    if(_confirmActive){_confirmActive()}
    const cleanup=()=>{
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden','true');
      // V8.4 (P2-#6) — إذا فيه modal تحت الـ confirm، لا تشيل scroll lock (يبقى open)
      if(typeof ModalStack!=='undefined'){
        ModalStack.pop(modal);
        if(ModalStack.size()===0) document.body.style.overflow='';
      }else{
        document.body.style.overflow='';
      }
      okBtn.onclick=null;
      cancelBtn.onclick=null;
      modal.onclick=null;
      document.removeEventListener('keydown',onKey);
      _confirmActive=null;
    };
    const onOk=()=>{cleanup();resolve(true)};
    const onCancel=()=>{cleanup();resolve(false)};
    const onKey=(e)=>{
      if(e.key==='Escape'){e.preventDefault();onCancel()}
      else if(e.key==='Enter'){e.preventDefault();onOk()}
    };
    okBtn.onclick=onOk;
    cancelBtn.onclick=onCancel;
    modal.onclick=(e)=>{if(e.target===modal) onCancel()};
    document.addEventListener('keydown',onKey);
    _confirmActive=cleanup;
    setTimeout(()=>okBtn.focus(),50);
  });
}

// ============ TOAST ============
let TOAST_TIMER=null;
function showToast(msg,color='var(--grn)',duration=2500,opts={}){
  const t=document.getElementById('toast');
  if(TOAST_TIMER){clearTimeout(TOAST_TIMER);TOAST_TIMER=null}
  // إذا فيه أكشن (مثل تراجع)، ابنِ HTML مركّب
  if(opts && opts.action){
    t.classList.add('toast-full');
    t.innerHTML=`<div style="display:flex;align-items:center;gap:10px;width:100%"><div class="toast-msg">${msg}</div><button class="toast-undo">↩ ${opts.action.label||'تراجع'}</button></div><div class="toast-undo-bar"></div>`;
    const btn=t.querySelector('.toast-undo');
    if(btn) btn.onclick=()=>{
      t.classList.remove('show');
      if(TOAST_TIMER){clearTimeout(TOAST_TIMER);TOAST_TIMER=null}
      try{opts.action.handler()}catch(e){console.error(e)}
    };
  }else{
    t.classList.remove('toast-full');
    t.innerHTML=`<div class="toast-msg">${msg}</div>`;
  }
  t.style.borderColor=color;
  t.style.color=color;
  t.classList.add('show');
  TOAST_TIMER=setTimeout(()=>{t.classList.remove('show');TOAST_TIMER=null},duration);
}

// ============ INDEXEDDB WRAPPER ============
// مغلّف مبسّط للوصول لـ IndexedDB بطريقة async/await
const DB_NAME='bulkmode_db';
const DB_VERSION=5; // V9.1 — bumped from 4: foodEntries store (nutrition tracking)
const STORES=['workouts','sets','exercises','bodyMetrics','prs','progressPhotos','settings','dailyLog','foodEntries'];

// V7 (#29) — Namespaced settings keys (app:, session:, subs:)
const KEYS={
  // app-level
  ONBOARDED:'app:onboarded',
  LAST_EXPORT:'app:last_export',
  FIRST_WORKOUT:'app:first_workout',
  THEME:'app:theme',
  HERO_COLLAPSED:'app:hero_collapsed',
  MIGRATION_LS_V1:'app:migrated_from_ls_v1',
  MIGRATION_KEYS_V2:'app:migrated_keys_v2',
  // session-level
  CURRENT_SESSION:'session:current',
  SESSION_MINIMIZED:'session:minimized',
  SKIPPED_STEPS:'session:skipped_today',
  LAST_ACTIVE_AT:'session:last_active_at',
  // substitution-level
  SUBS_ACTIVE:'subs:active',
  SUBS_PREFS:'subs:prefs',
  SUBS_HISTORY:'subs:history',
  // V7.2 — user profile (#37)
  USER_PROFILE:'app:user_profile',
  // V8 — achievements
  ACHIEVEMENTS:'app:achievements_unlocked',
  // V8 — plate calculator preferences (bar weight + enabled plates)
  PLATE_CALC_PREFS:'app:plate_calc_prefs',
  // V8 — smart deload state: {active, startedAt, reason, endedAt?, autoEnded?}
  MANUAL_DELOAD_ACTIVE:'session:manual_deload',
  // V8 — workout reminders preferences
  REMINDER_PREFS:'app:reminder_prefs',
  // V8.3 (3.3) — program editor: per-day full overrides {dayId: dayObject}
  PROGRAM_OVERRIDES:'app:program_overrides',
  // V8.3 (3.13) — File System Access auto-backup
  AUTOBACKUP_HANDLE:'app:autobackup_handle',
  AUTOBACKUP_PREFS:'app:autobackup_prefs',
  // V8.3 (UX) — flags
  SKIP_HINT_SHOWN:'app:skip_hint_shown',
  FAB_HINT_SHOWN:'app:fab_hint_shown',
  DELOAD_LAST_REMINDER:'app:deload_last_reminder',
  BACKUP_REMINDER_SHOWN:'app:backup_reminder_shown',
  // V8.4 — Multi-gym support
  GYM_PROFILES:'app:gym_profiles',           // { [id]: GymProfile }
  ACTIVE_GYM_ID:'app:active_gym_id',         // string
  GYM_HINT_SHOWN:'app:gym_hint_shown',       // first-time switcher hint flag
  IOS_INSTALL_HINT_SHOWN:'app:ios_install_hint_shown',
  // V9.1 (A.4) — Multi-program templates
  ACTIVE_PROGRAM_ID:'app:active_program_id'  // string id matching PROGRAM_TEMPLATES key
};

// V7 (#29) — خريطة ترحيل المفاتيح القديمة للنسخة الجديدة
const LEGACY_KEY_MAP={
  'onboarded':KEYS.ONBOARDED,
  'last_export':KEYS.LAST_EXPORT,
  'firstWorkoutDate':KEYS.FIRST_WORKOUT,
  'theme':KEYS.THEME,
  'heroCollapsed':KEYS.HERO_COLLAPSED,
  'migration_v1':KEYS.MIGRATION_LS_V1,
  'currentSession':KEYS.CURRENT_SESSION,
  'sessionMinimized':KEYS.SESSION_MINIMIZED,
  'skippedSteps':KEYS.SKIPPED_STEPS,
  'substitutions':KEYS.SUBS_ACTIVE,
  'substitutionPrefs':KEYS.SUBS_PREFS,
  'substitutionHistory':KEYS.SUBS_HISTORY
};

// V7 (#32) — معالجة QuotaExceededError مركزياً
let _quotaErrorShown=false;
function handleQuotaError(){
  if(_quotaErrorShown) return;
  _quotaErrorShown=true;
  setTimeout(()=>{_quotaErrorShown=false},10000);
  const msg='💾 المساحة شبه ممتلئة! صدّر بياناتك من 📊 → 💾 ثم احذف الجلسات الأقدم من ٦ أشهر.';
  if(typeof showToast==='function') showToast(msg,'var(--red)',8000);
  else alert(msg);
}

// V7 (#30) — Schema migrations (تطبّق فقط لو oldVersion < target)
function migrateV0toV1(d){
  // أول إصدار: أنشئ كل المتاجر
  if(!d.objectStoreNames.contains('workouts')){
    const s=d.createObjectStore('workouts',{keyPath:'id'});
    s.createIndex('date','date');
    s.createIndex('dayType','dayType');
  }
  if(!d.objectStoreNames.contains('sets')){
    const s=d.createObjectStore('sets',{keyPath:'id',autoIncrement:true});
    s.createIndex('workoutId','workoutId');
    s.createIndex('exerciseName','exerciseName');
    s.createIndex('date','date');
  }
  if(!d.objectStoreNames.contains('exercises')) d.createObjectStore('exercises',{keyPath:'name'});
  if(!d.objectStoreNames.contains('bodyMetrics')) d.createObjectStore('bodyMetrics',{keyPath:'date'});
  if(!d.objectStoreNames.contains('prs')){
    const s=d.createObjectStore('prs',{keyPath:'id',autoIncrement:true});
    s.createIndex('exerciseName','exerciseName');
    s.createIndex('type','type');
  }
  if(!d.objectStoreNames.contains('progressPhotos')) d.createObjectStore('progressPhotos',{keyPath:'id',autoIncrement:true});
  if(!d.objectStoreNames.contains('settings')) d.createObjectStore('settings',{keyPath:'key'});
}

function migrateV1toV2(d){
  // V2: لا تغييرات في schema (مخطّط بنفسه). ترحيل المفاتيح يحصل بعد open في applyDataMigrations()
}

// V7.2 (#38) — أضف dailyLog store للماء/النوم/المكملات/الوجبات
function migrateV2toV3(d){
  if(!d.objectStoreNames.contains('dailyLog')){
    d.createObjectStore('dailyLog',{keyPath:'date'});
  }
}

// V8 — indexes على progressPhotos (date, category) للاستعلام السريع
// نحتاج الـ transaction للوصول للـ store الموجود وإضافة indexes جديدة
function migrateV3toV4(d, tx){
  if(!d.objectStoreNames.contains('progressPhotos')) return; // أُنشئ في V0→V1
  if(!tx) return; // الـ transaction مطلوب
  const store=tx.objectStore('progressPhotos');
  if(!store.indexNames.contains('date')) store.createIndex('date','date');
  if(!store.indexNames.contains('category')) store.createIndex('category','category');
}

// V9.1 (A.3) — foodEntries store لتتبع الوجبات الفعلية مع macros محسوبة
function migrateV4toV5(d){
  if(!d.objectStoreNames.contains('foodEntries')){
    const s=d.createObjectStore('foodEntries',{keyPath:'id',autoIncrement:true});
    s.createIndex('date','date');          // ISO YYYY-MM-DD — أهم استعلام
    s.createIndex('foodId','foodId');      // لمعرفة أكثر طعام مأكول
  }
}

const db={
  _h:null,
  async open(){
    if(this._h) return this._h;
    return new Promise((res,rej)=>{
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onerror=()=>rej(req.error);
      req.onsuccess=()=>{this._h=req.result;res(this._h)};
      req.onupgradeneeded=(e)=>{
        const d=e.target.result;
        const tx=e.target.transaction; // مطلوب لتعديل indexes الستورات الموجودة
        // طبّق الترحيلات بالتسلسل
        if(e.oldVersion<1) migrateV0toV1(d);
        if(e.oldVersion<2) migrateV1toV2(d);
        if(e.oldVersion<3) migrateV2toV3(d);
        if(e.oldVersion<4) migrateV3toV4(d,tx);
        if(e.oldVersion<5) migrateV4toV5(d);
      };
    });
  },
  async add(store,rec){const h=await this.open();return new Promise((res,rej)=>{const tx=h.transaction(store,'readwrite');const r=tx.objectStore(store).add(rec);r.onsuccess=()=>res(r.result);r.onerror=()=>{if(r.error&&r.error.name==='QuotaExceededError') handleQuotaError();rej(r.error)};tx.onerror=()=>{if(tx.error&&tx.error.name==='QuotaExceededError') handleQuotaError()}})},
  async put(store,rec){const h=await this.open();return new Promise((res,rej)=>{const tx=h.transaction(store,'readwrite');const r=tx.objectStore(store).put(rec);r.onsuccess=()=>res(r.result);r.onerror=()=>{if(r.error&&r.error.name==='QuotaExceededError') handleQuotaError();rej(r.error)};tx.onerror=()=>{if(tx.error&&tx.error.name==='QuotaExceededError') handleQuotaError()}})},
  async get(store,key){const h=await this.open();return new Promise((res,rej)=>{const tx=h.transaction(store,'readonly');const r=tx.objectStore(store).get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})},
  async getAll(store,idx,query){const h=await this.open();return new Promise((res,rej)=>{const tx=h.transaction(store,'readonly');const src=idx?tx.objectStore(store).index(idx):tx.objectStore(store);const r=query!==undefined?src.getAll(query):src.getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})},
  async delete(store,key){const h=await this.open();return new Promise((res,rej)=>{const tx=h.transaction(store,'readwrite');const r=tx.objectStore(store).delete(key);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})},
  async clear(store){const h=await this.open();return new Promise((res,rej)=>{const tx=h.transaction(store,'readwrite');const r=tx.objectStore(store).clear();r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
};

// V7 (#29) — ترحيل مفاتيح settings للأسماء الـ namespaced
// يُستدعى بعد db.open() (وليس داخل onupgradeneeded لأنه يحتاج عمليات async)
async function applyDataMigrations(){
  const done=await db.get('settings',KEYS.MIGRATION_KEYS_V2);
  if(done && done.value) return;
  try{
    const all=await db.getAll('settings');
    let renamed=0;
    for(const rec of all){
      const newKey=LEGACY_KEY_MAP[rec.key];
      if(newKey && newKey!==rec.key){
        // لو الجديد موجود بالفعل، لا نكتب فوقه
        const existing=await db.get('settings',newKey);
        if(!existing){
          await db.put('settings',{...rec,key:newKey});
        }
        await db.delete('settings',rec.key);
        renamed++;
      }
    }
    await db.put('settings',{key:KEYS.MIGRATION_KEYS_V2,value:true,date:new Date().toISOString(),renamed});
  }catch(e){console.warn('Settings keys migration failed:',e)}
}

// ============ MIGRATION FROM LOCALSTORAGE ============
// ترحيل بيانات النسخة القديمة (LocalStorage) لـ IndexedDB
async function migrateFromLS(){
  const flag=await db.get('settings',KEYS.MIGRATION_LS_V1);
  if(flag&&flag.value) return;

  const raw=localStorage.getItem('bulkmode_tracker_v1');
  if(raw){
    try{
      const old=JSON.parse(raw);
      if(old.logs && old.logs.length){
        // group logs by date to create synthetic workouts
        const grouped={};
        old.logs.forEach(l=>{
          const day=(l.date||new Date().toISOString()).split('T')[0];
          if(!grouped[day]) grouped[day]={dayType:l.day||'مستورد',logs:[]};
          grouped[day].logs.push(l);
        });
        let migCount=0;
        for(const [date,grp] of Object.entries(grouped)){
          const wId='legacy_'+date;
          let totalVol=0;
          grp.logs.forEach(l=>totalVol+=(l.weight||0)*(l.reps||0));
          await db.put('workouts',{
            id:wId,date:date,dayType:grp.dayType,
            startTime:grp.logs[0].date,
            endTime:grp.logs[grp.logs.length-1].date,
            duration:0,totalVolume:totalVol,
            setsCount:grp.logs.length,notes:'مستورد من النسخة القديمة'
          });
          for(const l of grp.logs){
            await db.add('sets',{
              workoutId:wId,exerciseName:l.exercise,
              weight:l.weight||0,reps:l.reps||0,
              timestamp:l.date,date:date,
              isPR:false,prType:null
            });
            migCount++;
          }
        }
        if(migCount>0) setTimeout(()=>showToast(`✓ تم ترحيل ${migCount} سجل من النسخة السابقة`),800);
      }
    }catch(e){console.warn('Migration error:',e)}
  }
  await db.put('settings',{key:KEYS.MIGRATION_LS_V1,value:true});
  // V8.4 (P1-#7) — نظّف مفاتيح localStorage القديمة بعد نجاح الترحيل
  cleanupLegacyLocalStorage();
}

// V8.4 (P1-#7) — حذف مفاتيح localStorage التي لم تعد مستخدمة بعد الترحيل لـ IndexedDB
// الـ flag KEYS.MIGRATION_LS_V1 يبقى في settings (داخل IDB) — مفاتيح LS الفعلية تُحذف
function cleanupLegacyLocalStorage(){
  const legacyKeys=[
    'bulkmode_tracker_v1',      // النسخة الأولى — لم تعد مقروءة
    'bulkmode_tracker_v0',      // احتياط
    'bulkmode_logs',             // مفاتيح أقدم محتملة
    'bulkmode_lastWeights'
  ];
  for(const k of legacyKeys){
    try{
      if(localStorage.getItem(k)!==null){
        localStorage.removeItem(k);
      }
    }catch(e){}
  }
}

// ============ HELPERS ============
function getExerciseName(stepEl){
  const nameEl=stepEl.querySelector('.step-name');
  if(!nameEl) return null;
  // V8.3 — اعتمد على النص النصي فقط (يتجاهل زر "ℹ️ form-note-btn" المحقون)
  let name='';
  for(const node of nameEl.childNodes){
    if(node.nodeType===3) name+=node.nodeValue;
  }
  name=(name||nameEl.textContent).trim();
  name=name
    .replace(/\s*[—-]\s*مجموعة\s+تسخين\s*$/,'')  // V8.3 — استبعد لاحقة "— مجموعة تسخين"
    .replace(/\s*—\s*سيت.*$/,'')
    .replace(/\s*-\s*سيت.*$/,'')
    .replace(/\s*\(.*?\)\s*$/,'')
    .trim();
  return name;
}

function getDayLabel(stepEl){
  const dy=stepEl.closest('.dy');
  if(!dy) return 'يوم غير محدد';
  const dn=dy.querySelector('.dn');
  return dn?dn.textContent.split('—')[0].trim():'يوم';
}

function fmtDate(iso){
  if(!iso) return '';
  const d=new Date(iso);
  return d.toLocaleDateString('ar-SA',{year:'numeric',month:'short',day:'numeric'});
}

function fmtDuration(secs){
  const m=Math.floor(secs/60);
  const s=secs%60;
  return `${m}:${String(s).padStart(2,'0')}`;
}
