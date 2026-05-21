/* ============ BULK MODE V5 — LEVEL 1 ============
 * IndexedDB + Workout Sessions + Automatic PRs + Smart Rest Timer + Charts
 * Offline-first, vanilla JS, single file.
 * ============================================== */

// ============ TAB NAVIGATION ============
document.querySelectorAll('.nb[data-t]').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('.nb').forEach(x=>x.classList.remove('a'));
    document.querySelectorAll('.sec').forEach(x=>x.classList.remove('a'));
    b.classList.add('a');
    const sec=document.getElementById('t'+b.dataset.t);
    if(sec) sec.classList.add('a');
    window.scrollTo({top:document.querySelector('.nav').offsetTop,behavior:'smooth'});
    // إذا فُتح تبويب "تقدمي" حدّث محتواه
    if(b.dataset.t==='7') refreshProgressTab();
  });
});

// ============ DAY TOGGLE ============
function tg(e){
  // لا تطوي عند الضغط على الأزرار داخل اليوم
  if(event && event.target.closest('.session-ctrl,.track-input,.save-btn,.dby')) return;
  e.classList.toggle('open');
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
const DB_VERSION=4; // V8 — bumped from 3: progressPhotos indexes (date, category)
const STORES=['workouts','sets','exercises','bodyMetrics','prs','progressPhotos','settings','dailyLog'];

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
  PROGRAM_OVERRIDES:'app:program_overrides'
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
