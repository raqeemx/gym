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

function renderProgram(){
  const container=document.getElementById('programContainer');
  if(!container){console.warn('programContainer not found — skipping renderProgram');return}
  if(typeof PROGRAM_DATA==='undefined'){console.warn('PROGRAM_DATA not loaded');return}
  container.innerHTML=PROGRAM_DATA.days.map(renderDay).join('\n');
}

// ============ يوم كامل (.dy) ============
function renderDay(day){
  // يوم راحة بدون phases — header فقط
  if(day.isRest||day.type==='REST'){
    return renderRestDay(day);
  }
  // يوم تدريب عادي — phases مع عدّاد للسيتات
  const counter={n:0};
  const phasesHtml=day.phases.map(p=>renderPhase(p,counter)).join('\n\n');
  return `
  <!-- يوم ${day.shortName}: ${day.type} -->
  <div class="dy" onclick="tg(this)">
    <div class="dh">
      <div class="db ${day.colorClass}">${day.shortName}</div>
      <div class="di"><div class="dn">${day.label}</div><div class="df">${day.description}</div></div>
      <span class="dt ${day.tagClass}">${day.tagLabel}</span><span class="da">▾</span>
    </div>
    <div class="dby"><div class="dbi">

      ${renderDaySummary(day.stats)}

${phasesHtml}

      <div class="tip tg" style="margin-top:14px"><div class="ti">✅</div><div class="tt">${day.finishTip}</div></div>
    </div></div>
  </div>`;
}

// ============ يوم راحة بسيط ============
function renderRestDay(day){
  return `
  <!-- يوم ${day.shortName}: راحة -->
  <div class="dy">
    <div class="dh" style="cursor:default">
      <div class="db ${day.colorClass||'rest'}">${day.shortName}</div>
      <div class="di"><div class="dn">${day.label}</div><div class="df">${day.description}</div></div>
    </div>
  </div>`;
}

// ============ ملخّص اليوم ============
function renderDaySummary(stats){
  if(!stats) return '';
  return `<div class="day-summary">
        <div class="ds-item"><span class="ds-num">${stats.sets}</span><div class="ds-lbl">سيت</div></div>
        <div class="ds-item"><span class="ds-num">${stats.exercises}</span><div class="ds-lbl">تمارين</div></div>
        <div class="ds-item"><span class="ds-num">${stats.pairs}</span><div class="ds-lbl">أزواج</div></div>
        <div class="ds-item"><span class="ds-num">${stats.minutes}</span><div class="ds-lbl">دقيقة</div></div>
      </div>`;
}

// ============ مرحلة (warmup/solo/pair) ============
function renderPhase(phase,counter){
  let html=`      <div class="phase-bar">`+
           `<span class="pl">${phase.label}</span>`+
           `<span class="pn">${phase.name}</span>`+
           (phase.meta?`<span class="pmeta">${phase.meta}</span>`:'')+
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
           `<div class="step-name">${step.name}</div>`+
           `<div class="step-info">${step.info}</div>`+
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
         `<div class="step-name">${step.name}</div>`+
         `<div class="step-info">${step.info}</div>`+
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
  if(note.gif){
    gifEl.src=note.gif;
    gifEl.alt=note.title||exName;
    gifWrap.style.display='';
  }else{
    gifEl.removeAttribute('src');
    gifWrap.style.display='none';
  }
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}

function closeFormNoteModal(){
  const modal=document.getElementById('formNoteModal');
  if(!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}
