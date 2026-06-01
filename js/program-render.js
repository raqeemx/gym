/* ============================================================
 * BULK MODE — Program Renderer
 * ============================================================
 * يأخذ PROGRAM_DATA ويولّد HTML مطابق للنسخة اليدوية القديمة.
 * يُستدعى في init قبل ensureStepIds() و injectXXX().
 *
 * المخرجات تُحقن في #programContainer.
 * الترتيب المُولَّد يطابق ترتيب .dy الأصلي → ensureStepIds()
 * يُنتج نفس IDs السابقة (step-D0-S3, ...) → البدائل المحفوظة لا تنكسر.
 * ============================================================ */

// V8.3 (3.3) — Cache of effective program (defaults + user overrides)
// مُحدَّث في renderProgram() ومُستخدَم في openProgramEditor()
let EFFECTIVE_PROGRAM=null;

// V8.4 (P1-#6) — helper للحقول القابلة للتعديل من المستخدم (program editor)
// الحقول التي تحوي HTML مقصود (finishTip, planB, banner.text, dayIntro.text) تبقى بدون escape
function _pre(s){return (typeof escHTML==='function')?escHTML(s):String(s==null?'':s)}

// V8.4 (P2-#8) — قسّم step.info إلى سطرين:
//   • السطر الأوّل (.si-main): الرقم/الوزن/التكرار — الأكثر أهمية أثناء التمرين (font أكبر، أبيض)
//   • السطر الثاني (.si-sub): النصائح/الانتقال — أقل تباينًا، خط أصغر
// قواعد التقسيم: الفصل عند علامة "·" — لأن المعلومات الرقمية أولاً في PROGRAM_DATA
function _splitStepInfo(info){
  if(info==null) return '';
  const s=String(info);
  // ابحث عن "·" أول (الفاصل الذي يفصل الأرقام عن النص الإرشادي)
  const idx=s.indexOf('·');
  if(idx<0){
    // لا فاصل — كلها سطر واحد
    return `<div class="si-main">${_pre(s)}</div>`;
  }
  // قسّم: أول جزءين أرقام (مثلاً "٨-١٠ تكرار · ١٠ كجم"), الباقي إرشادي
  // أحياناً تظهر "·" مرتين أو أكثر — أول اثنتين أرقام عادةً
  const parts=s.split('·').map(p=>p.trim());
  if(parts.length<=2){
    return `<div class="si-main">${_pre(parts.join(' · '))}</div>`;
  }
  // 3+ أجزاء: أول جزءين main، الباقي sub
  const main=parts.slice(0,2).join(' · ');
  const sub=parts.slice(2).join(' · ');
  return `<div class="si-main">${_pre(main)}</div><div class="si-sub">${_pre(sub)}</div>`;
}

async function renderProgram(){
  const container=document.getElementById('programContainer');
  if(!container){console.warn('programContainer not found — skipping renderProgram');return}
  // V9.1 (A.4) — استخدم getActiveProgram() لو متاح (multi-template)، وإلا PROGRAM_DATA الافتراضي
  let baseProgram=null;
  if(typeof getActiveProgram==='function'){
    try{ baseProgram = await getActiveProgram(); }catch(e){console.warn('getActiveProgram failed:',e)}
  }
  if(!baseProgram){
    if(typeof PROGRAM_DATA==='undefined'){console.warn('PROGRAM_DATA not loaded');return}
    baseProgram = PROGRAM_DATA;
  }
  // V8.3 (3.3) + V9.7 (#9) — ادمج التخصيصات للبرنامج النشط (namespaced)
  let overrides={};
  try{
    // V9.7 (#9): getOverridesFor يقرأ تلقائياً حسب البرنامج النشط مع backward-compat
    if(typeof getOverridesFor==='function'){
      overrides=await getOverridesFor();
    }else if(typeof db!=='undefined' && db.get){
      // fallback لو data-helpers.js لم يُحمّل
      const rec=await db.get('settings',KEYS.PROGRAM_OVERRIDES);
      overrides=(rec&&rec.value)||{};
    }
  }catch(e){console.warn('Failed to load program overrides:',e)}
  const days=baseProgram.days.map(d=>overrides[d.id]?{...overrides[d.id],_isCustom:true}:d);
  EFFECTIVE_PROGRAM={...baseProgram,days};
  container.innerHTML=days.map(renderDay).join('\n');
}

// ============ يوم كامل (.dy) ============
function renderDay(day){
  // يوم راحة بدون phases — header فقط (+ ملاحظة اختيارية أسفله)
  if(day.isRest||day.type==='REST'){
    return renderRestDay(day);
  }
  // يوم تدريب عادي — phases مع عدّاد للسيتات
  const counter={n:0};
  const phasesHtml=day.phases.map(p=>renderPhase(p,counter)).join('\n\n');
  // V8.3 (3.3) — dayIntro اختياري (tip tpu قبل الـ phases)
  const introHtml=day.dayIntro
    ?`<div class="tip tpu" style="margin-bottom:14px"><div class="ti">${day.dayIntro.icon||'⭐'}</div><div class="tt">${day.dayIntro.text}</div></div>`
    :'';
  return `
  <!-- يوم ${_pre(day.shortName)}: ${_pre(day.type)} -->
  <div class="dy" onclick="tg(this)" data-day-id="${_pre(day.id||'')}">
    <div class="dh">
      <div class="db ${_pre(day.colorClass)}">${_pre(day.shortName)}</div>
      <div class="di"><div class="dn">${_pre(day.label)}</div><div class="df">${_pre(day.description)}</div></div>
      <span class="dt ${_pre(day.tagClass)}">${_pre(day.tagLabel)}</span><span class="da">▾</span>
    </div>
    <div class="dby"><div class="dbi">

      ${renderDaySummary(day.stats)}
      ${introHtml}
${phasesHtml}

      <div class="tip tg" style="margin-top:14px"><div class="ti">✅</div><div class="tt">${day.finishTip}</div></div>
    </div></div>
  </div>`;
}

// ============ يوم راحة بسيط ============
function renderRestDay(day){
  // V8.3 (3.3) — restNote: tip منفصل أسفل بطاقة اليوم
  const noteHtml=day.restNote
    ?`\n  <div class="tip t0" style="margin-bottom:16px"><div class="ti">${day.restNote.icon||'🧘'}</div><div class="tt">${day.restNote.text}</div></div>`
    :'';
  return `
  <!-- يوم ${_pre(day.shortName)}: راحة -->
  <div class="dy" data-day-id="${_pre(day.id||'')}">
    <div class="dh" style="cursor:default">
      <div class="db ${_pre(day.colorClass||'rest')}">${_pre(day.shortName)}</div>
      <div class="di"><div class="dn">${_pre(day.label)}</div><div class="df">${_pre(day.description)}</div></div>
    </div>
  </div>${noteHtml}`;
}

// ============ ملخّص اليوم ============
function renderDaySummary(stats){
  if(!stats) return '';
  const pairsLbl=stats.pairsLabel||'أزواج';
  return `<div class="day-summary">
        <div class="ds-item"><span class="ds-num">${stats.sets}</span><div class="ds-lbl">سيت</div></div>
        <div class="ds-item"><span class="ds-num">${stats.exercises}</span><div class="ds-lbl">تمارين</div></div>
        <div class="ds-item"><span class="ds-num">${stats.pairs}</span><div class="ds-lbl">${pairsLbl}</div></div>
        <div class="ds-item"><span class="ds-num">${stats.minutes}</span><div class="ds-lbl">دقيقة</div></div>
      </div>`;
}

// ============ مرحلة (warmup/solo/pair) ============
// V9.14.2 — تُعرض كبطاقات تمارين: بطاقة لكل تمرين (solo) أو بطاقة زوج (superset)
// تحافظ على ترتيب وعدد عناصر .step كما هي → step IDs والتتبع لا ينكسران.
function renderPhase(phase,counter){
  // ستيبات المرحلة بنفس الترتيب الأصلي (لا نعيد ترتيبها أبداً)
  let stepsHtml='';
  for(const s of phase.steps){
    stepsHtml+='\n        '+renderStep(s,counter);
  }

  // --- إحماء: بطاقة إحماء بسيطة ---
  if(phase.type==='warmup'){
    return `      <div class="ex-card ex-warmup">
        <div class="ex-head"><span class="ex-kind">🔥 ${_pre(phase.label||'إحماء')}</span>`+
        (phase.name?`<span class="ex-title-sm">${_pre(phase.name)}</span>`:'')+`</div>
        <div class="ex-body">${stepsHtml}
        </div>
      </div>`;
  }

  const exList=_phaseExercises(phase);
  const restName=_phaseRestName(phase);

  // --- تمرين منفرد (SOLO أو أي مرحلة بتمرين واحد) ---
  if(exList.length<=1){
    const ex=exList[0]||{name:phase.name||'',sets:0,reps:''};
    return `      <div class="ex-card">
        ${_exHeadHtml(ex,phase,restName)}`+
        (phase.banner?_bannerHtml(phase.banner):'')+
        (phase.planB?_planBHtml(phase.planB):'')+`
        <div class="ex-body">${stepsHtml}
        </div>
      </div>`;
  }

  // --- زوج (Superset): تمرينان+ يتبادلان — نحافظ على التبادل ---
  const exHeads=exList.map(ex=>`<div class="ss-ex">
          <div class="ss-ex-name">${_pre(ex.name)}</div>
          <div class="ss-ex-meta">${_exMetaInline(ex)}</div>
        </div>`).join('<div class="ss-vs">↔</div>');
  return `      <div class="ex-card ex-superset">
        <div class="ss-head"><span class="ss-tag">🔄 ${_pre(phase.label||'SUPERSET')}</span>`+
        (phase.name?`<span class="ss-name">${_pre(phase.name)}</span>`:'')+
        (phase.meta?`<span class="ss-meta">${_pre(phase.meta)}</span>`:'')+`</div>
        <div class="ss-exercises">${exHeads}</div>`+
        (phase.banner?_bannerHtml(phase.banner):'')+
        (phase.planB?_planBHtml(phase.planB):'')+
        (restName?`<div class="ss-rest-note">🔁 تبادل بين التمرينين · راحة ${_pre(restName)} بين كل انتقال</div>`:'')+`
        <div class="ex-body ss-rounds">${stepsHtml}
        </div>
      </div>`;
}

// ============ مساعدات بطاقات التمارين (V9.14.2) ============
// نظّف اسم التمرين من لاحقة "— سيت ١ / — مجموعة تسخين / (الأخير)"
function _exNameClean(name){
  return String(name==null?'':name)
    .replace(/\s*[—-]\s*مجموعة\s+تسخين\s*$/,'')
    .replace(/\s*[—-]\s*سيت[\s\S]*$/,'')
    .replace(/\s*\([^)]*\)\s*$/,'')
    .trim();
}
// استخرج تمارين المرحلة (بالترتيب) مع عدد السيتات ونطاق التكرار لكل تمرين
function _phaseExercises(phase){
  const order=[]; const map={};
  for(const s of (phase.steps||[])){
    if(!s || s.type==='rest') continue;
    const ex=_exNameClean(s.name);
    if(!ex) continue;
    if(!map[ex]){ map[ex]={name:ex,sets:0,reps:''}; order.push(ex); }
    map[ex].sets++;
    if(!map[ex].reps && s.info){ map[ex].reps=String(s.info).split('·')[0].trim(); }
  }
  return order.map(k=>map[k]);
}
// استخرج مدة الراحة من أول ستيب راحة (مثلاً "٩٠ ثانية")
function _phaseRestName(phase){
  const r=(phase.steps||[]).find(s=>s && s.type==='rest');
  if(!r) return '';
  const m=String(r.name||'').match(/[\d٠-٩]+\s*(?:ثانية|ث|دقيقة|د)/);
  if(m) return m[0];
  return String(r.name||'').replace(/^راحة\s*/,'').split('+')[0].trim();
}
// العضلة المستهدفة من كتالوج substitutions.js (لو متاح)
function _exMuscle(exName){
  try{
    if(typeof getMuscleGroup==='function'){
      const mg=getMuscleGroup(exName);
      if(mg && mg.group) return mg.group;
    }
  }catch(e){}
  return '';
}
// رأس بطاقة تمرين منفرد: الاسم + شرائح (عضلة/جهاز/سيتات/راحة)
function _exHeadHtml(ex,phase,restName){
  const muscle=_exMuscle(ex.name);
  const chips=[];
  if(muscle) chips.push(`<span class="ex-chip ex-muscle">🎯 ${_pre(muscle)}</span>`);
  chips.push(`<span class="ex-chip ex-machine">🏋️ ${_pre(ex.name)}</span>`);
  if(ex.sets) chips.push(`<span class="ex-chip">📊 ${ex.sets} × ${_pre(ex.reps||'')}</span>`);
  if(restName) chips.push(`<span class="ex-chip ex-rest">⏱ ${_pre(restName)}</span>`);
  return `<div class="ex-head">`+
    (phase.label?`<span class="ex-kind">${_pre(phase.label)}</span>`:'')+
    `<div class="ex-title">${_pre(ex.name)}</div>
        <div class="ex-chips">${chips.join('')}</div>
      </div>`;
}
// سطر معلومات مضغوط لتمرين داخل بطاقة الزوج
function _exMetaInline(ex){
  const muscle=_exMuscle(ex.name);
  const bits=[];
  if(muscle) bits.push(`🎯 ${_pre(muscle)}`);
  bits.push(`🏋️ ${_pre(ex.name)}`);
  if(ex.sets) bits.push(`📊 ${ex.sets}×${_pre(ex.reps||'')}`);
  return bits.join(' · ');
}
function _bannerHtml(banner){
  return `<div class="pair-banner"><span class="pb-icon">${banner.icon}</span>`+
         `<div><span class="zone-tag">${banner.zoneTag}</span>${banner.text}</div></div>`;
}
function _planBHtml(planB){
  return `<div class="plan-b"><span class="pb-tag">PLAN B</span><div>${planB}</div></div>`;
}

// ============ ستيب واحد ============
function renderStep(step,counter){
  // step.rest — عدّاد ثابت "⏱"
  if(step.type==='rest'){
    return `<div class="step rest">`+
           `<div class="step-num">⏱</div>`+
           `<div class="step-body">`+
           `<div class="step-name">${_pre(step.name)}</div>`+
           `<div class="step-info">${_splitStepInfo(step.info)}</div>`+
           `</div></div>`;
  }
  // ستيب تدريبي — عدّاد متسلسل
  counter.n++;
  const classes=['step'];
  if(step.type==='warmup'){
    classes.push('warmup');
    // V8.3 — التسخين بنصف وزن العمل لتمرين معيّن = ستيب قابل للتتبع
    // الكاردِيو (Skillrow) أو إحماء عام يبقى غير قابل للتتبع
    if(/مجموعة\s+تسخين/.test(step.name)) classes.push('trackable-warmup');
  }
  else if(step.type==='solo-set') classes.push('solo-set');
  // ستيب 'set' عادي بدون class إضافي
  if(step.last) classes.push('done');
  return `<div class="${classes.join(' ')}">`+
         `<div class="step-num">${counter.n}</div>`+
         `<div class="step-body">`+
         `<div class="step-name">${_pre(step.name)}</div>`+
         `<div class="step-info">${_splitStepInfo(step.info)}</div>`+
         `</div></div>`;
}

/* ============================================================
 * V8.3 — Exercise Form Notes (3.2)
 * ============================================================
 * زر ℹ️ بجانب اسم التمرين يفتح modal بشرح مختصر للأداء الصحيح.
 * يعتمد على EXERCISE_FORM_NOTES من program-data.js.
 * ============================================================ */
function injectFormNoteButtons(){
  if(typeof EXERCISE_FORM_NOTES==='undefined') return;
  document.querySelectorAll('.step:not(.rest)').forEach(step=>{
    if(step.querySelector('.form-note-btn')) return;
    const stepBody=step.querySelector('.step-body');
    const nameEl=step.querySelector('.step-name');
    if(!stepBody || !nameEl) return;
    const raw=getExerciseName(step);
    if(!raw) return;
    const norm=(typeof normalizeExName==='function')?normalizeExName(raw):raw;
    if(!EXERCISE_FORM_NOTES[norm]) return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='form-note-btn';
    btn.setAttribute('aria-label','عرض طريقة الأداء');
    btn.title='شرح طريقة الأداء';
    btn.textContent='ℹ️';
    btn.dataset.exName=norm;
    btn.onclick=(e)=>{e.stopPropagation();openFormNoteModal(norm)};
    // ضع الزر بين الاسم والمعلومات — كسيد عنصر مستقل (يبقى بعد الاستبدالات)
    stepBody.insertBefore(btn,nameEl.nextSibling);
    stepBody.classList.add('has-form-note');
  });
}

function openFormNoteModal(exName){
  const note=EXERCISE_FORM_NOTES&&EXERCISE_FORM_NOTES[exName];
  if(!note) return;
  const modal=document.getElementById('formNoteModal');
  if(!modal) return;
  document.getElementById('formNoteTitle').textContent=note.title||exName;
  document.getElementById('formNoteBody').innerHTML=note.formNote||'';
  const gifWrap=document.getElementById('formNoteGifWrap');
  const gifEl=document.getElementById('formNoteGif');
  // V9.0 (P3) — استخدم النظام الموحّد: gif فعلي → SVG placeholder حسب category
  const mediaSrc=(typeof getExerciseMediaSrc==='function')?getExerciseMediaSrc(exName):(note.gif||null);
  if(mediaSrc){
    // إذا كان gif ملف فعلي → fallback يلجأ للـ placeholder عند الفشل
    const isFile=note.gif && mediaSrc===note.gif;
    gifEl.onerror=()=>{
      if(isFile && typeof renderPlaceholderDataURI==='function'){
        console.warn('Form-note asset failed, switching to placeholder:',note.gif);
        gifEl.onerror=null;
        gifEl.src=renderPlaceholderDataURI(note.category||'default',exName);
      }else{
        gifWrap.style.display='none';
      }
    };
    gifEl.onload=()=>{gifWrap.style.display=''};
    gifEl.src=mediaSrc;
    gifEl.alt=note.title||exName;
    gifWrap.style.display='';
  }else{
    gifEl.onerror=null;gifEl.onload=null;
    gifEl.removeAttribute('src');
    gifWrap.style.display='none';
  }
  // V9.1 (A.2) — رابط YouTube لشرح فيديو حقيقي
  injectVideoLink(exName);
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}

// V9.1 (A.2) — يضمن وجود زر "🎬 شاهد فيديو شرح" أسفل form-note body
function injectVideoLink(exName){
  const body=document.getElementById('formNoteBody');
  if(!body) return;
  // أزل أي رابط قديم
  const existing=body.parentElement.querySelector('.form-note-video-link');
  if(existing) existing.remove();
  if(typeof buildYouTubeSearchURL!=='function') return;
  const url=buildYouTubeSearchURL(exName);
  if(!url) return;
  const wrap=document.createElement('div');
  wrap.className='form-note-video-link';
  // noopener+noreferrer لحماية window.opener + لا تسريب مرجع
  wrap.innerHTML=`<a href="${url}" target="_blank" rel="noopener noreferrer">🎬 شاهد فيديو شرح على YouTube ›</a>
    <small>يفتح بحث في YouTube — لا اتصال خارجي من التطبيق نفسه</small>`;
  body.parentElement.appendChild(wrap);
}

function closeFormNoteModal(){
  const modal=document.getElementById('formNoteModal');
  if(!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}

/* ============================================================
 * V9.14.2 — تبويبات التمارين حسب اليوم (Day Tabs)
 * ============================================================
 * بدل عرض كل الأيام دفعة واحدة، نعرض شريط تبويبات:
 *   اليوم · الأحد · الاثنين · ... (أيام التدريب فقط، تُستثنى الراحة)
 * كل تبويب يُظهر بطاقة يومه فقط (الباقي display:none — تبقى في DOM
 * فيبقى التتبع و step IDs سليمة).
 * ============================================================ */
const _AR_DAY_NAMES=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

function _progDays(){
  if(typeof EFFECTIVE_PROGRAM!=='undefined' && EFFECTIVE_PROGRAM && EFFECTIVE_PROGRAM.days) return EFFECTIVE_PROGRAM.days;
  if(typeof PROGRAM_DATA!=='undefined' && PROGRAM_DATA && PROGRAM_DATA.days) return PROGRAM_DATA.days;
  return [];
}

function setupDayTabs(){
  const container=document.getElementById('programContainer');
  if(!container) return;
  const prog=_progDays();
  // اربط كل بطاقة .dy بيوم الأسبوع الخاص بها
  container.querySelectorAll('.dy').forEach((dy,i)=>{
    const id=dy.getAttribute('data-day-id');
    const pd=prog.find(d=>d.id===id);
    dy.dataset.weekday=(pd && pd.dayOfWeek!=null)?pd.dayOfWeek:i;
  });
  // ابنِ شريط التبويبات (أيام التدريب فقط، مرتّبة)
  let bar=document.getElementById('dayTabs');
  if(!bar){
    bar=document.createElement('div');
    bar.id='dayTabs';
    bar.className='day-tabs';
    bar.setAttribute('role','tablist');
    container.parentNode.insertBefore(bar,container);
  }
  const trainDays=prog.filter(d=>!(d.isRest||d.type==='REST'))
                      .slice().sort((a,b)=>a.dayOfWeek-b.dayOfWeek);
  let html=`<button type="button" class="day-tab" data-wd="today" onclick="selectDayTab('today')">⭐ اليوم</button>`;
  html+=trainDays.map(d=>`<button type="button" class="day-tab" data-wd="${d.dayOfWeek}" onclick="selectDayTab(${d.dayOfWeek})">${_pre(_AR_DAY_NAMES[d.dayOfWeek]||d.shortName||'')}</button>`).join('');
  bar.innerHTML=html;
  selectDayTab('today');
}

function selectDayTab(wd){
  const container=document.getElementById('programContainer');
  if(!container) return;
  const isToday=(wd==='today');
  let targetWd=isToday?new Date().getDay():Number(wd);
  // لو اليوم الحالي لا يطابق أي بطاقة (نادر) → اعرض أول يوم تدريب
  const allDy=container.querySelectorAll('.dy');
  let matchExists=Array.prototype.some.call(allDy,dy=>Number(dy.dataset.weekday)===targetWd);
  if(!matchExists && allDy.length){ targetWd=Number(allDy[0].dataset.weekday); }
  // أظهر يوم الهدف فقط
  allDy.forEach(dy=>{
    if(Number(dy.dataset.weekday)===targetWd) dy.classList.remove('dt-hidden');
    else dy.classList.add('dt-hidden');
  });
  // افتح البطاقة الظاهرة تلقائياً (إلا يوم الراحة بدون body)
  const visible=container.querySelector('.dy:not(.dt-hidden)');
  if(visible && !visible.querySelector('.db.rest')) visible.classList.add('open');
  // تفعيل التبويب المناسب بصرياً
  const bar=document.getElementById('dayTabs');
  if(bar){
    bar.querySelectorAll('.day-tab').forEach(b=>b.classList.remove('active'));
    const sel=isToday?bar.querySelector('.day-tab[data-wd="today"]')
                     :bar.querySelector('.day-tab[data-wd="'+targetWd+'"]');
    if(sel) sel.classList.add('active');
  }
}

// يُستدعى من بطاقات جدول الأسبوع في الـ Dashboard
function openWorkoutDay(wd){
  if(typeof switchToTab==='function') switchToTab(1);
  setTimeout(()=>{
    if(typeof selectDayTab==='function') selectDayTab(Number(wd));
    const c=document.getElementById('programContainer');
    const v=c&&c.querySelector('.dy:not(.dt-hidden)');
    if(v) v.scrollIntoView({behavior:'smooth',block:'start'});
  },160);
}

window.setupDayTabs=setupDayTabs;
window.selectDayTab=selectDayTab;
window.openWorkoutDay=openWorkoutDay;
