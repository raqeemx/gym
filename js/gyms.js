/* ============================================================
 * BULK MODE — Multi-Gym Support (V8.4)
 * ============================================================
 * يدعم عدّة Gym Profiles (الجيم الأساسي، البيت، فندق، سفر …)
 * مع تبديل سريع وفلترة البدائل حسب المعدّات المتوفرة في الجيم النشط.
 *
 * البنية:
 *   GymProfile = {
 *     id: string,           // معرّف فريد
 *     name: string,         // الاسم المعروض
 *     icon: string,         // إيموجي
 *     equipment: string[],  // قائمة أسماء المعدّات/الأجهزة المتوفرة
 *     bodyweightOnly: bool, // وضع وزن الجسم فقط (مقيّد)
 *     readonly?: bool,      // الجيم الافتراضي محمي من الحذف
 *     createdAt?: string
 *   }
 *
 * بيانات افتراضية:
 *   - default-technogym: 24 جهاز Technogym (يُنشأ تلقائياً عند أول إقلاع)
 *   - bodyweight-travel : وضع السفر (وزن جسم فقط)
 * ============================================================ */

// المعدّات الافتراضية للجيم الأساسي — مطابقة للنظام القديم
const _DEFAULT_TECHNOGYM_EQUIPMENT = [
  "Chest Press","Pectoral Fly","Crossover Cables",
  "Shoulder Press","Delts Machine","Reverse Fly",
  "Lat Machine","Vertical Traction","Low Row","Upper Back","Pulley",
  "Arm Curl","Arm Extension","Pulley Curl","Pulley Pushdown",
  "Pulley — Bicep Curl","Pulley — Tricep Pushdown",
  "Chin Ups","Dips","Kneeling Easy Chin Dip",
  "Leg Press","Leg Extension","Prone Leg Curl",
  "Abductor","Adductor","Calf Raise",
  "Lower Back","Rotary Torso","Abdominal Crunch","Hanging Leg Raise",
  "Skillrow","Cable Crossover",
  "Free weights area","بدون جهاز"   // ركيزتان موجودتان في غالبية الجيمات
];

// وضع السفر / وزن الجسم — معدّات محدودة
const _BODYWEIGHT_DEFAULT_EQUIPMENT = [
  "بدون جهاز","Free weights area","Free weights","مطاط مقاومة","Dumbbells"
];

// المعدّات اللي تُعتبر "وزن جسم" أو غير-جهازية — يُسمح بها دائماً في كل الجيمات
const _BODYWEIGHT_TAGS = new Set([
  "بدون جهاز","Free weights area","Free weights","مطاط مقاومة","Dumbbells"
]);

// كاش الجيم النشط لتقليل استعلامات DB أثناء الـ render
let _activeGymCache=null;
function invalidateGymCache(){_activeGymCache=null}

// ============ Storage helpers ============
async function getAllGyms(){
  try{
    const rec=await db.get('settings',KEYS.GYM_PROFILES);
    const obj=(rec&&rec.value)||{};
    // ابنِ array مرتّبة بالاسم لكن الافتراضي أوّلاً
    return Object.values(obj).sort((a,b)=>{
      if(a.id==='default-technogym') return -1;
      if(b.id==='default-technogym') return 1;
      return (a.name||'').localeCompare(b.name||'','ar');
    });
  }catch(e){return []}
}

async function getGym(id){
  if(!id) return null;
  const rec=await db.get('settings',KEYS.GYM_PROFILES);
  const obj=(rec&&rec.value)||{};
  return obj[id]||null;
}

async function saveGym(gym){
  if(!gym||!gym.id) throw new Error('Gym must have an id');
  const rec=await db.get('settings',KEYS.GYM_PROFILES);
  const obj=(rec&&rec.value)||{};
  obj[gym.id]={...gym,updatedAt:new Date().toISOString()};
  await db.put('settings',{key:KEYS.GYM_PROFILES,value:obj});
  invalidateGymCache();
}

async function deleteGym(id){
  const rec=await db.get('settings',KEYS.GYM_PROFILES);
  const obj=(rec&&rec.value)||{};
  const g=obj[id];
  if(!g) return false;
  if(g.readonly){
    if(typeof showToast==='function') showToast('⚠️ هذا الجيم محمي ولا يمكن حذفه','var(--red)');
    return false;
  }
  delete obj[id];
  await db.put('settings',{key:KEYS.GYM_PROFILES,value:obj});
  // لو الـ active هو المحذوف، رجّع للافتراضي
  const activeId=await getActiveGymId();
  if(activeId===id) await setActiveGymId('default-technogym');
  invalidateGymCache();
  return true;
}

async function getActiveGymId(){
  try{
    const rec=await db.get('settings',KEYS.ACTIVE_GYM_ID);
    return (rec&&rec.value)||'default-technogym';
  }catch(e){return 'default-technogym'}
}

async function setActiveGymId(id){
  await db.put('settings',{key:KEYS.ACTIVE_GYM_ID,value:id});
  invalidateGymCache();
  // V9.7 (#10) — reset dismiss + reevaluate banner
  try{sessionStorage.removeItem('gymMismatchDismissed')}catch(e){}
  if(typeof updateGymMismatchBanner==='function') setTimeout(updateGymMismatchBanner, 300);
  // V9.8 (#21) — حدّث Equipment grid في tab الرئيسية
  if(typeof refreshEquipmentGrid==='function') setTimeout(refreshEquipmentGrid, 300);
}

async function getActiveGym(){
  if(_activeGymCache) return _activeGymCache;
  const id=await getActiveGymId();
  const g=await getGym(id);
  _activeGymCache=g;
  return g;
}

// ============ Migration / Bootstrap ============
// عند أول إقلاع: أنشئ الـ default + bodyweight (إذا لم يكونا موجودين)
async function bootstrapGyms(){
  try{
    const rec=await db.get('settings',KEYS.GYM_PROFILES);
    const obj=(rec&&rec.value)||{};
    let changed=false;
    if(!obj['default-technogym']){
      obj['default-technogym']={
        id:'default-technogym',
        name:'الجيم الأساسي',
        icon:'🏋️',
        equipment:[..._DEFAULT_TECHNOGYM_EQUIPMENT],
        bodyweightOnly:false,
        readonly:true,
        createdAt:new Date().toISOString()
      };
      changed=true;
    }
    if(!obj['bodyweight-travel']){
      obj['bodyweight-travel']={
        id:'bodyweight-travel',
        name:'وضع السفر (وزن جسم)',
        icon:'✈️',
        equipment:[..._BODYWEIGHT_DEFAULT_EQUIPMENT],
        bodyweightOnly:true,
        readonly:false,
        createdAt:new Date().toISOString()
      };
      changed=true;
    }
    if(changed) await db.put('settings',{key:KEYS.GYM_PROFILES,value:obj});
    // تأكّد من وجود active
    const activeRec=await db.get('settings',KEYS.ACTIVE_GYM_ID);
    if(!activeRec || !activeRec.value){
      await db.put('settings',{key:KEYS.ACTIVE_GYM_ID,value:'default-technogym'});
    }
  }catch(e){console.warn('bootstrapGyms failed:',e)}
}

// ============ Equipment filter logic ============
// يفحص هل البديل (alt) متاح في الجيم المعطى
function isAltAvailableIn(gym,alt){
  if(!gym || !alt) return true;
  const eq=alt.equipment||'';
  // bodyweightOnly: السماح فقط للـ tags الـ bodyweight
  if(gym.bodyweightOnly) return _BODYWEIGHT_TAGS.has(eq);
  // وضع عادي: السماح لما هو في قائمة الجيم + الـ bodyweight ضمنياً
  if(_BODYWEIGHT_TAGS.has(eq)) return true;
  return (gym.equipment||[]).includes(eq);
}

// يرجّع البدائل المتاحة للتمرين في الجيم النشط — async (يقرأ active gym)
async function getEffectiveAlternatives(exerciseName){
  if(!exerciseName || typeof EXERCISE_ALTERNATIVES==='undefined') return [];
  const all=EXERCISE_ALTERNATIVES[exerciseName]||[];
  if(!all.length) return [];
  const gym=await getActiveGym();
  if(!gym) return all;
  return all.filter(alt=>isAltAvailableIn(gym,alt));
}

// نسخة سينكرونية للحالات اللي يكون فيها الكاش بالفعل محمّل
function getEffectiveAlternativesSync(exerciseName){
  if(!exerciseName || typeof EXERCISE_ALTERNATIVES==='undefined') return [];
  const all=EXERCISE_ALTERNATIVES[exerciseName]||[];
  if(!all.length) return [];
  const gym=_activeGymCache;
  if(!gym) return all;
  return all.filter(alt=>isAltAvailableIn(gym,alt));
}

// يفحص هل التمرين الأساسي نفسه متاح في الجيم النشط
// (يُستخدم لاقتراح "هذا الجهاز غير متوفر هنا — جرّب بديلاً")
async function isExerciseAvailable(exerciseName){
  const gym=await getActiveGym();
  if(!gym) return true;
  if(gym.bodyweightOnly){
    // التمرين الأساسي عادةً جهاز معيّن — لو bodyweightOnly، احسبه غير متاح
    return false;
  }
  // افحص: هل اسم التمرين موجود ضمن equipment الجيم؟
  const eq=gym.equipment||[];
  if(eq.includes(exerciseName)) return true;
  // محاولة matching جزئي (Lat Machine لو الجيم يحوي "Lat Machine")
  for(const e of eq){
    if(e===exerciseName) return true;
    // tolerance: المستخدم قد يُسمّي "Pulley Curl" كـ "Pulley"
    if(exerciseName.startsWith(e+' ') || exerciseName.startsWith(e+'—')) return true;
  }
  return false;
}

// V9.7 (#10) — يفحص كل تمارين البرنامج النشط ضد active gym
// يرجّع {unavailable:[ex1,ex2,...], total:25}
async function getProgramEquipmentMismatch(){
  const gym=await getActiveGym();
  if(!gym) return {unavailable:[],total:0,gym:null};
  // اقرأ كل التمارين من EFFECTIVE_PROGRAM
  const program=(typeof EFFECTIVE_PROGRAM!=='undefined' && EFFECTIVE_PROGRAM)
    ?EFFECTIVE_PROGRAM
    :(typeof getActiveProgram==='function'?await getActiveProgram():null);
  if(!program || !program.days) return {unavailable:[],total:0,gym};
  // استخرج كل أسماء التمارين الفريدة (من steps من نوع 'set' أو 'solo-set')
  const exNames=new Set();
  for(const day of program.days){
    if(day.isRest||!day.phases) continue;
    for(const phase of day.phases){
      if(!phase.steps) continue;
      for(const step of phase.steps){
        if(step.type==='set' || step.type==='solo-set'){
          // استخرج اسم التمرين من step.name (مثلاً "Chest Press — سيت ١")
          const name=(step.name||'').split('—')[0].trim();
          // طبّع
          const norm=(typeof normalizeExName==='function')?normalizeExName(name):name;
          if(norm) exNames.add(norm);
        }
      }
    }
  }
  // افحص كل اسم
  const unavailable=[];
  for(const ex of exNames){
    if(!(await isExerciseAvailable(ex))){
      unavailable.push(ex);
    }
  }
  return {unavailable, total:exNames.size, gym};
}

// ============ Utility: list of all known equipment (for the editor UI) ============
// يجمع المعدّات المعروفة من ALL_EQUIPMENT (الكتالوج) + جميع المعدّات المذكورة في
// EXERCISE_ALTERNATIVES، ليُعرض كـ checkboxes في محرّر الجيم.
function listAllKnownEquipment(){
  const set=new Set();
  if(typeof ALL_EQUIPMENT!=='undefined'){
    ALL_EQUIPMENT.forEach(e=>set.add(e.name));
  }
  if(typeof EXERCISE_ALTERNATIVES!=='undefined'){
    for(const arr of Object.values(EXERCISE_ALTERNATIVES)){
      for(const a of arr){if(a.equipment) set.add(a.equipment)}
    }
  }
  // أضِف الافتراضيات الأساسية
  _DEFAULT_TECHNOGYM_EQUIPMENT.forEach(e=>set.add(e));
  _BODYWEIGHT_DEFAULT_EQUIPMENT.forEach(e=>set.add(e));
  // رتّب: bodyweight tags في النهاية، الباقي abc
  const list=[...set];
  list.sort((a,b)=>{
    const ab=_BODYWEIGHT_TAGS.has(a)?1:0;
    const bb=_BODYWEIGHT_TAGS.has(b)?1:0;
    if(ab!==bb) return ab-bb;
    return a.localeCompare(b,'ar');
  });
  return list;
}

// ============ UI: Switcher pill ============
async function refreshGymSwitcherUI(){
  const wrap=document.getElementById('gymSwitcher');
  if(!wrap) return;
  const gym=await getActiveGym();
  if(!gym){wrap.style.display='none';return}
  wrap.style.display='';
  const nameEl=document.getElementById('gsName');
  const iconEl=document.getElementById('gsIcon');
  if(nameEl) nameEl.textContent=gym.name||'الجيم';
  if(iconEl) iconEl.textContent=gym.icon||'🏋️';
  // أغلق القائمة لو مفتوحة (لمنع stale data)
  const menu=document.getElementById('gsMenu');
  if(menu) menu.classList.remove('open');
}

async function toggleGymSwitcherMenu(ev){
  if(ev && ev.stopPropagation) ev.stopPropagation();
  const menu=document.getElementById('gsMenu');
  if(!menu) return;
  if(menu.classList.contains('open')){
    menu.classList.remove('open');
    return;
  }
  // ابني القائمة
  const gyms=await getAllGyms();
  const activeId=await getActiveGymId();
  menu.innerHTML=`
    <div class="gs-menu-title">اختر جيماً نشطاً</div>
    ${gyms.map(g=>`
      <button type="button" class="gs-item ${g.id===activeId?'active':''}" onclick="switchActiveGym('${escAttrGym(g.id)}')">
        <span class="gsi-icon">${g.icon||'🏋️'}</span>
        <span class="gsi-body">
          <b>${escAttrGym(g.name)}</b>
          <small>${(g.equipment||[]).length} معدّة${g.bodyweightOnly?' · وضع وزن جسم':''}</small>
        </span>
        ${g.id===activeId?'<span class="gsi-tick">✓</span>':''}
      </button>
    `).join('')}
    <button type="button" class="gs-manage" onclick="openGymManager()">🛠 إدارة الجيمات</button>
  `;
  menu.classList.add('open');
}

// أغلق القائمة عند الضغط خارجها
if(typeof document!=='undefined'){
  document.addEventListener('click',(e)=>{
    if(!e.target.closest('#gymSwitcher')){
      const menu=document.getElementById('gsMenu');
      if(menu) menu.classList.remove('open');
    }
  });
}

async function switchActiveGym(id){
  if(!id) return;
  const cur=await getActiveGymId();
  if(cur===id){
    const menu=document.getElementById('gsMenu');
    if(menu) menu.classList.remove('open');
    return;
  }
  await setActiveGymId(id);
  const g=await getGym(id);
  if(typeof showToast==='function' && g){
    // V8.4 (P1-#6) — escape gym.name (user-typed)
    showToast(`${escHTML(g.icon||'🏋️')} تم التبديل إلى "${escHTML(g.name)}"`,'var(--blue)',3000);
  }
  await refreshGymSwitcherUI();
  // أعد فحص أزرار البدائل + خرائط Plan B
  if(typeof refreshAltButtonsAvailability==='function') refreshAltButtonsAvailability();
  if(typeof syncPlanBTexts==='function'){
    // امسح حالة sync لإعادة البناء
    document.querySelectorAll('.plan-b').forEach(p=>delete p.dataset.synced);
    syncPlanBTexts();
  }
}

// ============ UI: Gym Manager (list + actions) ============
async function openGymManager(focusGymId){
  const modal=document.getElementById('gymManagerModal');
  if(!modal) return;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  await renderGymManagerBody(focusGymId);
}

function closeGymManager(){
  const modal=document.getElementById('gymManagerModal');
  if(!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}

async function renderGymManagerBody(focusGymId){
  const body=document.getElementById('gymManagerBody');
  if(!body) return;
  const gyms=await getAllGyms();
  const activeId=await getActiveGymId();
  body.innerHTML=gyms.map(g=>{
    const isActive=g.id===activeId;
    const eqCount=(g.equipment||[]).length;
    const bwTag=g.bodyweightOnly?'<span class="gm-bw-tag">✈️ وضع وزن جسم</span>':'';
    const readonlyTag=g.readonly?'<span class="gm-ro-tag">🔒 محمي</span>':'';
    const focusCls=(focusGymId && g.id===focusGymId)?' gm-focus':'';
    return `
      <div class="gm-card ${isActive?'gm-active':''}${focusCls}">
        <div class="gm-card-head">
          <span class="gm-icon">${g.icon||'🏋️'}</span>
          <div class="gm-card-body">
            <div class="gm-name"><b>${escAttrGym(g.name)}</b> ${isActive?'<span class="gm-active-tag">نشط</span>':''}</div>
            <div class="gm-meta">${eqCount} معدّة ${bwTag} ${readonlyTag}</div>
          </div>
        </div>
        <div class="gm-card-actions">
          ${!isActive?`<button type="button" class="gm-activate" onclick="switchActiveGym('${escAttrGym(g.id)}');setTimeout(()=>renderGymManagerBody(),300)">▶ تفعيل</button>`:''}
          <button type="button" class="gm-edit" onclick="openGymEditor('${escAttrGym(g.id)}')">✏️ تعديل</button>
          ${!g.readonly?`<button type="button" class="gm-delete" onclick="confirmDeleteGym('${escAttrGym(g.id)}')">🗑 حذف</button>`:''}
        </div>
      </div>`;
  }).join('');
  if(focusGymId){
    setTimeout(()=>{
      const el=body.querySelector('.gm-focus');
      if(el) el.scrollIntoView({behavior:'smooth',block:'center'});
    },80);
  }
}

async function confirmDeleteGym(id){
  const g=await getGym(id);
  if(!g) return;
  // V8.4 (P1-#2) — custom modal
  if(!await customConfirm(`حذف <b>"${escHTML(g.name)}"</b>؟<br><small style="color:var(--tx3)">لا يمكن التراجع.</small>`,{title:'حذف جيم',okText:'احذف',danger:true,icon:'🗑'})) return;
  await deleteGym(id);
  await renderGymManagerBody();
  await refreshGymSwitcherUI();
  if(typeof showToast==='function') showToast('🗑 تم حذف الجيم','var(--red)');
}

// ============ UI: Gym Editor (create/edit) ============
let _editingGym=null;     // مرجع الجيم الذي نُعدّله، أو null عند الإنشاء
let _editingSelected=new Set(); // المعدّات المحدّدة حالياً

async function startCreateGym(){
  _editingGym={
    id:'gym_'+Date.now(),
    name:'',
    icon:'🏠',
    equipment:[..._BODYWEIGHT_DEFAULT_EQUIPMENT],
    bodyweightOnly:false,
    readonly:false
  };
  _editingSelected=new Set(_editingGym.equipment);
  populateGymEditor('إنشاء جيم جديد');
}

async function openGymEditor(id){
  const g=await getGym(id);
  if(!g){if(typeof showToast==='function') showToast('⚠️ جيم غير موجود','var(--red)');return}
  _editingGym=structuredClone(g);
  _editingSelected=new Set(_editingGym.equipment||[]);
  populateGymEditor(`تعديل: ${g.name}`);
}

function closeGymEditor(){
  const modal=document.getElementById('gymEditorModal');
  if(modal){modal.classList.remove('open');modal.setAttribute('aria-hidden','true')}
  _editingGym=null;
  _editingSelected=new Set();
}

function populateGymEditor(title){
  const modal=document.getElementById('gymEditorModal');
  if(!modal) return;
  document.getElementById('gymEditorTitle').textContent=title;
  document.getElementById('gymEdName').value=_editingGym.name||'';
  document.getElementById('gymEdIcon').value=_editingGym.icon||'🏋️';
  document.getElementById('gymEdBodyweight').checked=!!_editingGym.bodyweightOnly;
  document.getElementById('gymEdCustomEq').value='';
  document.getElementById('gymEdEqSearch').value='';
  renderEquipmentList('');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}

function renderEquipmentList(query){
  const wrap=document.getElementById('gymEdEqList');
  const countEl=document.getElementById('gymEdEqCount');
  if(!wrap) return;
  const all=listAllKnownEquipment();
  // أضِف المعدّات المخصّصة (إن وُجدت في selected لكن غير معروفة عالمياً)
  for(const e of _editingSelected){if(!all.includes(e)) all.push(e)}
  const q=(query||'').trim().toLowerCase();
  const filtered=q?all.filter(e=>e.toLowerCase().includes(q)):all;
  wrap.innerHTML=filtered.map(e=>{
    const checked=_editingSelected.has(e)?'checked':'';
    const isBw=_BODYWEIGHT_TAGS.has(e)?'gm-eq-bw':'';
    return `<label class="gm-eq-item ${isBw}">
      <input type="checkbox" value="${escAttrGym(e)}" ${checked} onchange="toggleEquipmentSelect(this)">
      <span>${escAttrGym(e)}</span>
    </label>`;
  }).join('');
  if(countEl) countEl.textContent=`${_editingSelected.size} جهاز محدّد`;
}

function toggleEquipmentSelect(input){
  const v=input.value;
  if(input.checked) _editingSelected.add(v);
  else _editingSelected.delete(v);
  const countEl=document.getElementById('gymEdEqCount');
  if(countEl) countEl.textContent=`${_editingSelected.size} جهاز محدّد`;
}

function filterEquipmentList(){
  const q=document.getElementById('gymEdEqSearch').value;
  renderEquipmentList(q);
}

function selectAllEquipment(on){
  if(on){
    listAllKnownEquipment().forEach(e=>_editingSelected.add(e));
  }else{
    _editingSelected.clear();
  }
  const q=document.getElementById('gymEdEqSearch').value;
  renderEquipmentList(q);
}

function addCustomEquipment(){
  const inp=document.getElementById('gymEdCustomEq');
  const v=(inp.value||'').trim();
  if(!v) return;
  _editingSelected.add(v);
  inp.value='';
  const q=document.getElementById('gymEdEqSearch').value;
  renderEquipmentList(q);
}

async function saveGymFromEditor(){
  if(!_editingGym) return;
  const name=document.getElementById('gymEdName').value.trim();
  if(!name){
    if(typeof showToast==='function') showToast('⚠️ أدخل اسم الجيم','var(--red)');
    return;
  }
  _editingGym.name=name;
  _editingGym.icon=document.getElementById('gymEdIcon').value||'🏋️';
  _editingGym.bodyweightOnly=document.getElementById('gymEdBodyweight').checked;
  _editingGym.equipment=[..._editingSelected];
  await saveGym(_editingGym);
  closeGymEditor();
  await renderGymManagerBody(_editingGym.id);
  await refreshGymSwitcherUI();
  if(typeof showToast==='function') showToast(`✓ تم حفظ "${escHTML(_editingGym.name)}"`,'var(--grn)');
}

// V8.4 (P1-#6) — يحوّل لاستخدام escHTML الـ global (escape كامل)
function escAttrGym(s){return (typeof escHTML==='function')?escHTML(s):String(s==null?'':s).replace(/"/g,'&quot;').replace(/'/g,'&#039;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/&/g,'&amp;')}

// V8.4 — first-time hint to introduce gym switcher
async function maybeShowGymHint(){
  try{
    const rec=await db.get('settings',KEYS.GYM_HINT_SHOWN);
    if(rec && rec.value) return;
    // فقط لو المستخدم مرّ بـ onboarding وله بيانات
    const sw=document.getElementById('gymSwitcher');
    if(!sw || sw.style.display==='none') return;
    setTimeout(()=>{
      if(typeof showToast==='function'){
        showToast('🏋️ جديد: يمكنك إنشاء جيمات متعدّدة (سفر، بيت، فندق) وتبديلها من الأعلى','var(--blue)',6000);
      }
      db.put('settings',{key:KEYS.GYM_HINT_SHOWN,value:true}).catch(()=>{});
    },3000);
  }catch(e){}
}

