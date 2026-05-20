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
const DB_VERSION=1;
const STORES=['workouts','sets','exercises','bodyMetrics','prs','progressPhotos','settings'];

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
      };
    });
  },
  async add(store,rec){const h=await this.open();return new Promise((res,rej)=>{const tx=h.transaction(store,'readwrite');const r=tx.objectStore(store).add(rec);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})},
  async put(store,rec){const h=await this.open();return new Promise((res,rej)=>{const tx=h.transaction(store,'readwrite');const r=tx.objectStore(store).put(rec);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})},
  async get(store,key){const h=await this.open();return new Promise((res,rej)=>{const tx=h.transaction(store,'readonly');const r=tx.objectStore(store).get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})},
  async getAll(store,idx,query){const h=await this.open();return new Promise((res,rej)=>{const tx=h.transaction(store,'readonly');const src=idx?tx.objectStore(store).index(idx):tx.objectStore(store);const r=query!==undefined?src.getAll(query):src.getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})},
  async delete(store,key){const h=await this.open();return new Promise((res,rej)=>{const tx=h.transaction(store,'readwrite');const r=tx.objectStore(store).delete(key);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})},
  async clear(store){const h=await this.open();return new Promise((res,rej)=>{const tx=h.transaction(store,'readwrite');const r=tx.objectStore(store).clear();r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
};

// ============ MIGRATION FROM LOCALSTORAGE ============
// ترحيل بيانات النسخة القديمة (LocalStorage) لـ IndexedDB
async function migrateFromLS(){
  const flag=await db.get('settings','migration_v1');
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
  await db.put('settings',{key:'migration_v1',value:true});
}

// ============ HELPERS ============
function getExerciseName(stepEl){
  const nameEl=stepEl.querySelector('.step-name');
  if(!nameEl) return null;
  let name=nameEl.textContent.trim();
  name=name.replace(/\s*—\s*سيت.*$/,'').replace(/\s*-\s*سيت.*$/,'').replace(/\s*\(.*?\)\s*$/,'').trim();
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
