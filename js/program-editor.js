/* ============================================================
 * BULK MODE — Program Editor (3.3)
 * ============================================================
 * يُتيح للمستخدم تخصيص أي يوم: تعديل أسماء التمارين، نصوص المعلومات،
 * إضافة/حذف سيتات أو راحات. التخصيصات تُحفظ كـ override كامل لليوم
 * في settings/KEYS.PROGRAM_OVERRIDES → عند renderProgram تستبدل اليوم
 * الافتراضي بالكامل.
 *
 * بنية الـ override: { [dayId]: <day-object> } — نفس شكل PROGRAM_DATA.days[i]
 * ============================================================ */

let _editorState=null;

async function openProgramEditor(dayId){
  if(!dayId){showToast('⚠️ لم يتم تحديد اليوم','var(--red)');return}
  // تحذير لو في جلسة نشطة — التعديل يُعيد بناء الواجهة
  if(typeof currentSession!=='undefined' && currentSession){
    if(!await customConfirm('لديك جلسة نشطة. تعديل اليوم سيُعيد بناء الواجهة، وقد تفقد المدخلات غير المحفوظة.<br><br>هل تريد المتابعة؟',{title:'جلسة نشطة',okText:'متابعة',danger:false,icon:'⚠️'})) return;
  }
  const defaultDay=PROGRAM_DATA.days.find(d=>d.id===dayId);
  if(!defaultDay){showToast('⚠️ يوم غير معروف','var(--red)');return}
  let day=defaultDay;
  let isCustom=false;
  try{
    // V9.7 (#9) — اقرأ من namespace البرنامج النشط
    if(typeof getOverridesFor==='function'){
      const ovs=await getOverridesFor();
      if(ovs[dayId]){day=ovs[dayId];isCustom=true}
    }else{
      const rec=await db.get('settings',KEYS.PROGRAM_OVERRIDES);
      const ovs=(rec&&rec.value)||{};
      if(ovs[dayId]){day=ovs[dayId];isCustom=true}
    }
  }catch(e){}
  // Deep clone for editing — لا نعدّل المرجع الأصلي
  _editorState={
    dayId,
    day:structuredClone(day),
    isCustom,
    originalDay:structuredClone(defaultDay)
  };
  renderEditorBody();
  const modal=document.getElementById('editorModal');
  if(modal){
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  }
}

function closeProgramEditor(){
  const modal=document.getElementById('editorModal');
  if(!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
  _editorState=null;
}

function renderEditorBody(){
  if(!_editorState) return;
  const day=_editorState.day;
  const titleEl=document.getElementById('editorTitle');
  // V8.4 (P1-#6) — escape day fields (user-editable via program editor)
  if(titleEl) titleEl.innerHTML=`✏️ تخصيص: ${escAttr(day.type||day.label||day.id)} ${_editorState.isCustom?'<span class="ed-custom-tag">معدّل</span>':''}`;

  const body=document.getElementById('editorBody');
  if(!body) return;

  if(day.isRest||day.type==='REST'){
    body.innerHTML=`
      <div class="ed-hint">هذا يوم راحة — لا يحتوي على تمارين قابلة للتعديل.</div>
      <div class="ed-field">
        <label>اسم اليوم</label>
        <input type="text" data-ed-day="label" value="${escAttr(day.label||'')}">
      </div>
      <div class="ed-field">
        <label>وصف اليوم</label>
        <input type="text" data-ed-day="description" value="${escAttr(day.description||'')}">
      </div>
    `;
    bindDayFieldInputs();
    return;
  }

  const phasesHtml=(day.phases||[]).map((phase,pIdx)=>renderEditorPhase(phase,pIdx)).join('');
  body.innerHTML=`
    <div class="ed-hint">💡 عدّل أي حقل، أو احذف سيت، أو أضف سيت/راحة جديدة. اضغط <b>💾 حفظ</b> لتفعيل التعديلات.<br><small>⚠️ إضافة/حذف سيتات قد يؤثر على البدائل المحفوظة لهذا اليوم.</small></div>
    <div class="ed-day-meta">
      <div class="ed-field">
        <label>وصف اليوم <small>(يظهر تحت اسم اليوم)</small></label>
        <input type="text" data-ed-day="description" value="${escAttr(day.description||'')}">
      </div>
    </div>
    ${phasesHtml}
  `;
  bindEditorEvents();
}

function renderEditorPhase(phase,pIdx){
  const labelTxt=phase.label||'';
  const stepsHtml=(phase.steps||[]).map((s,sIdx)=>renderEditorStep(s,pIdx,sIdx)).join('');
  return `
    <div class="ed-phase" data-phase-idx="${pIdx}">
      <div class="ed-phase-head">
        <span class="ed-phase-tag">${labelTxt}</span>
        <input class="ed-phase-name" type="text" data-ed-phase="${pIdx}" data-ed-field="name" value="${escAttr(phase.name||'')}" placeholder="اسم المرحلة">
        <input class="ed-phase-meta" type="text" data-ed-phase="${pIdx}" data-ed-field="meta" value="${escAttr(phase.meta||'')}" placeholder="مثلاً: 4 sets">
      </div>
      <div class="ed-steps">
        ${stepsHtml}
      </div>
      <div class="ed-phase-actions">
        <button class="ed-add-btn" type="button" data-ed-action="add-set" data-phase-idx="${pIdx}">＋ إضافة سيت</button>
        <button class="ed-add-btn ed-add-rest" type="button" data-ed-action="add-rest" data-phase-idx="${pIdx}">＋ إضافة راحة</button>
      </div>
    </div>
  `;
}

function renderEditorStep(step,pIdx,sIdx){
  const isRest=step.type==='rest';
  const typeBadge=isRest?'⏱ راحة'
    :step.type==='warmup'?'🔥 تسخين'
    :step.type==='solo-set'?'🎯 SOLO'
    :'💪 سيت';
  return `
    <div class="ed-step ${isRest?'ed-rest':''}" data-step-idx="${sIdx}">
      <div class="ed-step-head">
        <span class="ed-step-badge">${typeBadge}</span>
        <button class="ed-step-del" type="button" data-ed-action="del-step" data-phase-idx="${pIdx}" data-step-idx="${sIdx}" aria-label="حذف">🗑</button>
      </div>
      <input type="text" class="ed-step-name" data-ed-step="${pIdx}.${sIdx}" data-ed-field="name" value="${escAttr(step.name||'')}" placeholder="اسم الستيب">
      <input type="text" class="ed-step-info" data-ed-step="${pIdx}.${sIdx}" data-ed-field="info" value="${escAttr(step.info||'')}" placeholder="مثلاً: ٨-١٠ تكرار · ١٠ كجم">
    </div>
  `;
}

// V8.4 (P1-#6) — استخدم escHTML الـ global (escape كامل ضد XSS)
function escAttr(s){return (typeof escHTML==='function')?escHTML(s):String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#039;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

function bindEditorEvents(){
  const body=document.getElementById('editorBody');
  if(!body) return;
  bindDayFieldInputs();
  // step + phase text inputs — تحديث _editorState.day مباشرة
  body.querySelectorAll('[data-ed-step]').forEach(inp=>{
    inp.addEventListener('input',(e)=>{
      const [p,s]=inp.dataset.edStep.split('.').map(Number);
      const field=inp.dataset.edField;
      const step=_editorState.day.phases[p].steps[s];
      step[field]=inp.value;
    });
  });
  body.querySelectorAll('[data-ed-phase]').forEach(inp=>{
    inp.addEventListener('input',(e)=>{
      const p=parseInt(inp.dataset.edPhase,10);
      const field=inp.dataset.edField;
      _editorState.day.phases[p][field]=inp.value;
    });
  });
  // action buttons (delete/add)
  body.querySelectorAll('[data-ed-action]').forEach(btn=>{
    btn.addEventListener('click',(e)=>{
      e.preventDefault();
      e.stopPropagation();
      const action=btn.dataset.edAction;
      const p=parseInt(btn.dataset.phaseIdx,10);
      const s=btn.dataset.stepIdx!=null?parseInt(btn.dataset.stepIdx,10):null;
      handleEditorAction(action,p,s);
    });
  });
}

function bindDayFieldInputs(){
  const body=document.getElementById('editorBody');
  if(!body) return;
  body.querySelectorAll('[data-ed-day]').forEach(inp=>{
    inp.addEventListener('input',(e)=>{
      _editorState.day[inp.dataset.edDay]=inp.value;
    });
  });
}

async function handleEditorAction(action,pIdx,sIdx){
  const day=_editorState.day;
  if(action==='del-step'){
    if(!day.phases[pIdx]||!day.phases[pIdx].steps[sIdx]) return;
    if(!await customConfirm('حذف هذا الستيب؟',{title:'حذف ستيب',okText:'احذف',danger:true,icon:'🗑'})) return;
    day.phases[pIdx].steps.splice(sIdx,1);
    renderEditorBody();
    return;
  }
  if(action==='add-set'){
    const phase=day.phases[pIdx];
    if(!phase) return;
    // ابحث عن آخر ستيب من نوع set/solo-set في المرحلة لاستنساخه
    const lastTrackable=[...phase.steps].reverse().find(s=>s.type==='set'||s.type==='solo-set');
    const defaultType=phase.type==='solo'?'solo-set':'set';
    const newStep=lastTrackable
      ?{type:lastTrackable.type,name:lastTrackable.name.replace(/\(الأخير\)/,'').trim()+' (مضاف)',info:lastTrackable.info}
      :{type:defaultType,name:'تمرين جديد',info:'٨-١٠ تكرار'};
    phase.steps.push(newStep);
    renderEditorBody();
    return;
  }
  if(action==='add-rest'){
    const phase=day.phases[pIdx];
    if(!phase) return;
    phase.steps.push({type:'rest',name:'راحة ٦٠ ثانية',info:'—'});
    renderEditorBody();
    return;
  }
}

async function saveEditorChanges(){
  if(!_editorState) return;
  const day=_editorState.day;
  try{
    // V9.7 (#9) — احفظ بـ namespace للبرنامج النشط
    const activeProgramId=(typeof getActiveProgramId==='function')?await getActiveProgramId():'upper-priority';
    if(typeof setOverrideFor==='function'){
      await setOverrideFor(activeProgramId, _editorState.dayId, day);
    }else{
      // fallback للنسخة القديمة
      const rec=await db.get('settings',KEYS.PROGRAM_OVERRIDES);
      const ovs=(rec&&rec.value)||{};
      ovs[_editorState.dayId]=day;
      await db.put('settings',{key:KEYS.PROGRAM_OVERRIDES,value:ovs});
    }
    closeProgramEditor();
    showToast('✓ تم حفظ التخصيصات','var(--grn)');
    await rerenderProgramAfterEdit();
  }catch(e){
    console.error(e);
    showToast('⚠️ فشل الحفظ: '+e.message,'var(--red)');
  }
}

async function resetEditorDay(){
  if(!_editorState) return;
  if(!await customConfirm('استعادة هذا اليوم لإعداداته الافتراضية؟<br><br><b>سيتم فقدان كل التعديلات</b>.',{title:'إعادة للافتراضي',okText:'استعد',danger:true,icon:'↺'})) return;
  try{
    // V9.7 (#9) — احذف من namespace البرنامج النشط
    const activeProgramId=(typeof getActiveProgramId==='function')?await getActiveProgramId():'upper-priority';
    if(typeof clearOverrideFor==='function'){
      await clearOverrideFor(activeProgramId, _editorState.dayId);
    }else{
      const rec=await db.get('settings',KEYS.PROGRAM_OVERRIDES);
      const ovs=(rec&&rec.value)||{};
      delete ovs[_editorState.dayId];
      await db.put('settings',{key:KEYS.PROGRAM_OVERRIDES,value:ovs});
    }
    closeProgramEditor();
    showToast('↺ تم استعادة الإعدادات الافتراضية','var(--blue)');
    await rerenderProgramAfterEdit();
  }catch(e){
    console.error(e);
    showToast('⚠️ فشل الاستعادة: '+e.message,'var(--red)');
  }
}

// إعادة بناء واجهة البرنامج بعد التعديل — تحافظ على البدائل والتخطّيات
async function rerenderProgramAfterEdit(){
  await renderProgram();
  ensureStepIds();
  if(typeof normalizeDataDigits==='function') normalizeDataDigits();
  if(typeof injectSessionControls==='function') injectSessionControls();
  if(typeof injectTrackingInputs==='function') await injectTrackingInputs();
  if(typeof injectAltButtons==='function') injectAltButtons();
  if(typeof injectSkipButtons==='function') injectSkipButtons();
  if(typeof injectFormNoteButtons==='function') injectFormNoteButtons();
  if(typeof injectEditorButtons==='function') injectEditorButtons();
  if(typeof injectHistoryButtons==='function') injectHistoryButtons();
  if(typeof loadSubstitutions==='function') await loadSubstitutions();
  if(typeof loadSkippedSteps==='function') await loadSkippedSteps();
  if(typeof updateSessionUI==='function') updateSessionUI();
  if(typeof highlightToday==='function') highlightToday();
}

// زر ✏️ "تخصيص اليوم" أعلى كل يوم (بجانب زر بدء الجلسة)
function injectEditorButtons(){
  document.querySelectorAll('.dy[data-day-id]').forEach(dy=>{
    const dayId=dy.dataset.dayId;
    if(!dayId) return;
    if(dy.querySelector('.day-edit-btn')) return;
    const ctrl=dy.querySelector('.session-ctrl');
    const target=ctrl||dy.querySelector('.dbi');
    if(!target) return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='day-edit-btn';
    btn.title='تخصيص هذا اليوم';
    btn.innerHTML='✏️ تخصيص';
    btn.onclick=(e)=>{e.stopPropagation();openProgramEditor(dayId)};
    if(ctrl){
      // ضع الزر بعد زر "بدء الجلسة" مباشرة (قبل الهمزة) لتلتصق به
      const startBtn=ctrl.querySelector('.session-start-btn');
      if(startBtn && startBtn.nextSibling){
        ctrl.insertBefore(btn,startBtn.nextSibling);
      }else{
        ctrl.appendChild(btn);
      }
    }else{
      target.insertBefore(btn,target.firstChild);
    }
  });
}
