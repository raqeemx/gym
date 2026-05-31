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
function renderPhase(phase,counter){
  let html=`      <div class="phase-bar">`+
           `<span class="pl">${_pre(phase.label)}</span>`+
           `<span class="pn">${_pre(phase.name)}</span>`+
           (phase.meta?`<span class="pmeta">${_pre(phase.meta)}</span>`:'')+
           `</div>`;
  // banner اختياري (للأزواج)
  if(phase.banner){
    html+=`\n      <div class="pair-banner">`+
          `<span class="pb-icon">${phase.banner.icon}</span>`+
          `<div><span class="zone-tag">${phase.banner.zoneTag}</span>${phase.banner.text}</div>`+
          `</div>`;
  }
  // Plan B (للأزواج)
  if(phase.planB){
    html+=`\n      <div class="plan-b"><span class="pb-tag">PLAN B</span><div>${phase.planB}</div></div>`;
  }
  // الستيبات
  for(const s of phase.steps){
    html+='\n      '+renderStep(s,counter);
  }
  return html;
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
