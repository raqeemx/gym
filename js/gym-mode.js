/* ============================================================
 * BULK MODE V9.13 — Gym Mode (Focus on one exercise at a time)
 * ============================================================
 * مشكلة #5: المستخدم لا يرى مسارًا واضحًا للجلسة.
 *
 * Gym Mode يعرض تمريناً واحداً في كل مرة:
 *  - اسم التمرين (كبير، ثنائي اللغة)
 *  - الوزن مع أزرار +/- كبيرة
 *  - target reps
 *  - زر "✓ تم السيت" كبير
 *  - مؤقت راحة آلي بين السيتات
 *  - زر "⏭ التالي" لتجاوز السيت
 *  - تصميم أهدأ (مشكلة #10): ألوان أبسط، نصوص أكبر، ظلال أخف
 *
 * يُستخدم بدلاً من Focus Mode عند بدء جلسة.
 * يتفاعل مع DOM الحقيقي للـ track-input عبر تعبئة قيم + click على زر حفظ.
 * ============================================================ */
(function(){
  const E=(typeof escHTML==='function')?escHTML:(x=>String(x==null?'':x));

  let gymModeActive=false;
  let _arNameMap=null;

  // -------- Arabic name lookup (شارك مع V9.10 bilingual) --------
  function _arName(en){
    if(_arNameMap) return _arNameMap[en]||null;
    _arNameMap={};
    if(typeof EXERCISE_FORM_NOTES==='undefined') return null;
    for(const v of Object.values(EXERCISE_FORM_NOTES)){
      if(!v || !v.title) continue;
      const idx=v.title.indexOf('—');
      if(idx<0) continue;
      const eName=v.title.slice(0,idx).trim();
      const aName=v.title.slice(idx+1).trim();
      if(eName && aName) _arNameMap[eName]=aName;
    }
    return _arNameMap[en]||null;
  }

  // -------- Find current step (first not-completed in active day) --------
  function _activeDayCard(){
    if(typeof currentSession==='undefined' || !currentSession) return null;
    const days=document.querySelectorAll('#t1 .dy');
    const target=String(currentSession.dayType||'').trim().toUpperCase();
    for(const d of days){
      const dn=d.querySelector('.dn');
      if(dn && dn.textContent.toUpperCase().includes(target)) return d;
    }
    return null;
  }

  function _findCurrentStep(){
    const day=_activeDayCard();
    if(!day) return null;
    // أول step غير مكتمل وليس rest/warmup/skipped/done
    const step=day.querySelector('.step:not(.rest):not(.warmup):not(.completed):not(.skipped):not(.done)');
    return step;
  }

  function _findNextStep(currentStep){
    if(!currentStep) return null;
    let cur=currentStep.nextElementSibling;
    while(cur){
      if(cur.classList && cur.classList.contains('step') &&
         !cur.classList.contains('rest') &&
         !cur.classList.contains('warmup') &&
         !cur.classList.contains('completed') &&
         !cur.classList.contains('skipped') &&
         !cur.classList.contains('done')){
        return cur;
      }
      cur=cur.nextElementSibling;
    }
    // ابحث في nextSibling phases
    let phase=currentStep.closest('.phase-bar')?currentStep.closest('.phase-bar').parentElement:null;
    // fallback: ابحث في الـ day card عن أول uncompleted بعد currentStep
    const day=_activeDayCard();
    if(day){
      const all=Array.from(day.querySelectorAll('.step:not(.rest):not(.warmup):not(.completed):not(.skipped):not(.done)'));
      const idx=all.indexOf(currentStep);
      if(idx>=0 && all[idx+1]) return all[idx+1];
    }
    return null;
  }

  function _parseStepInfo(step){
    const info=step.querySelector('.step-info');
    if(!info) return {repsText:'',targetW:null};
    const raw=info.textContent;
    const txt=(typeof arabicToLatinDigits==='function')?arabicToLatinDigits(raw):raw;
    const repMatch=txt.match(/(\d+)\s*-\s*(\d+)\s*تكرار/) || txt.match(/(\d+)\s*تكرار/);
    const repsText=repMatch?(repMatch[2]?`${repMatch[1]}-${repMatch[2]}`:repMatch[1]):'';
    const wMatch=txt.match(/(\d+(?:\.\d+)?)\s*كجم/);
    const targetW=wMatch?parseFloat(wMatch[1]):null;
    return {repsText,targetW};
  }

  function _suggestedWeight(step){
    // اقرأ من weight-chip (يحوي dataset.weight)
    const chip=step.parentElement && step.parentElement.querySelector
      ?step.querySelector('.weight-chip') || step.parentElement.querySelector('.weight-chip')
      :null;
    if(chip && chip.dataset && chip.dataset.weight){
      const w=parseFloat(chip.dataset.weight);
      if(!isNaN(w)) return w;
    }
    // أو من track-input
    const wi=step.querySelector('.weight-input');
    if(wi){
      if(wi.value) return parseFloat(wi.value);
      if(wi.placeholder) return parseFloat(wi.placeholder);
    }
    // أو من step-info
    const i=_parseStepInfo(step);
    return i.targetW;
  }

  function _suggestedReps(step){
    const ri=step.querySelector('.reps-input');
    if(ri && ri.placeholder){
      const n=parseInt(ri.placeholder);
      if(!isNaN(n)) return n;
    }
    const i=_parseStepInfo(step);
    if(i.repsText){
      const top=i.repsText.split('-').pop();
      return parseInt(top);
    }
    return 8;
  }

  function _stepName(step){
    const sn=step.querySelector('.step-name');
    if(!sn) return '—';
    const en=sn.querySelector('.sn-en');
    if(en) return en.textContent.trim();
    // fallback: get text before "—"
    const t=sn.textContent.trim();
    const idx=t.indexOf('—');
    return idx>0?t.slice(0,idx).trim():t;
  }

  function _stepProgressLabel(){
    const day=_activeDayCard();
    if(!day) return '';
    const all=day.querySelectorAll('.step:not(.rest):not(.warmup):not(.skipped):not(.done)');
    const done=day.querySelectorAll('.step.completed:not(.rest):not(.warmup)').length;
    const total=all.length+done;
    return `${done+1}/${total}`;
  }

  // -------- Build overlay HTML --------
  function _ensureOverlay(){
    let ov=document.getElementById('gymModeOverlay');
    if(ov) return ov;
    ov=document.createElement('div');
    ov.id='gymModeOverlay';
    ov.className='gym-mode-overlay';
    ov.innerHTML=`
      <div class="gmo-header">
        <button class="gmo-exit" type="button" aria-label="خروج">✕ خروج</button>
        <div class="gmo-progress" id="gmoProgress">—</div>
        <div class="gmo-timer" id="gmoTimer"></div>
      </div>
      <div class="gmo-body" id="gmoBody">
        <div class="gmo-empty">جاهز للبدء — اضغط "ابدأ Gym Mode"</div>
      </div>
      <div class="gmo-rest-overlay" id="gmoRest" style="display:none">
        <div class="gmo-rest-card">
          <div class="gmo-rest-lbl">⏱ راحة</div>
          <div class="gmo-rest-time" id="gmoRestTime">60</div>
          <div class="gmo-rest-actions">
            <button type="button" class="gmo-rest-skip" id="gmoRestSkip">⏭ تخطّى الراحة</button>
            <button type="button" class="gmo-rest-add" id="gmoRestAdd">+30ث</button>
          </div>
          <div class="gmo-next-preview" id="gmoNextPreview"></div>
        </div>
      </div>
    `;
    document.body.appendChild(ov);
    ov.querySelector('.gmo-exit').onclick=()=>exitGymMode();
    return ov;
  }

  // -------- Render current step in overlay --------
  function _renderCurrentStep(){
    const ov=_ensureOverlay();
    const body=ov.querySelector('#gmoBody');
    const progLbl=ov.querySelector('#gmoProgress');
    const step=_findCurrentStep();
    if(!step){
      // كل التمارين خلصت
      body.innerHTML=`
        <div class="gmo-done">
          <div class="gmo-done-icon">🏆</div>
          <div class="gmo-done-title">انتهت الجلسة!</div>
          <div class="gmo-done-sub">سجّلت كل السيتات. اضغط "إنهاء الجلسة" لحفظ التمرين.</div>
          <button type="button" class="gmo-done-btn" onclick="endSession();exitGymMode();">✓ إنهاء الجلسة</button>
        </div>`;
      if(progLbl) progLbl.textContent='✓ خلصت';
      return;
    }
    const exName=_stepName(step);
    const arName=_arName(exName);
    const info=_parseStepInfo(step);
    const sugW=_suggestedWeight(step);
    const sugR=_suggestedReps(step);
    if(progLbl) progLbl.textContent=_stepProgressLabel();
    const lastValue=(()=>{
      const lastEl=step.querySelector('.track-input .last b');
      return lastEl?lastEl.textContent:null;
    })();

    body.innerHTML=`
      <div class="gmo-step" data-step-id="${E(step.id||'')}">
        <div class="gmo-ex">
          <div class="gmo-ex-en">${E(exName)}</div>
          ${arName?`<div class="gmo-ex-ar">${E(arName)}</div>`:''}
        </div>
        <div class="gmo-weight-card">
          <div class="gmo-w-lbl">⚖ الوزن</div>
          <div class="gmo-w-controls">
            <button type="button" class="gmo-w-btn gmo-w-minus" aria-label="نقص">−</button>
            <div class="gmo-w-val">
              <input type="number" inputmode="decimal" step="0.5" class="gmo-w-input" value="${sugW!=null?E(sugW):''}" placeholder="0">
              <span class="gmo-w-unit">كجم</span>
            </div>
            <button type="button" class="gmo-w-btn gmo-w-plus" aria-label="زد">+</button>
          </div>
        </div>
        <div class="gmo-reps-card">
          <div class="gmo-r-lbl">🎯 التكرارات</div>
          <div class="gmo-r-controls">
            <button type="button" class="gmo-r-btn gmo-r-minus" aria-label="نقص">−</button>
            <div class="gmo-r-val">
              <input type="number" inputmode="numeric" step="1" class="gmo-r-input" value="${sugR}" placeholder="0">
            </div>
            <button type="button" class="gmo-r-btn gmo-r-plus" aria-label="زد">+</button>
          </div>
          ${info.repsText?`<div class="gmo-r-target">الهدف: ${E(info.repsText)}</div>`:''}
        </div>
        ${lastValue?`<div class="gmo-last-line">آخر مرة: <b>${E(lastValue)}</b></div>`:''}
        <button type="button" class="gmo-save-btn" id="gmoSave">✓ تم السيت</button>
        <div class="gmo-secondary">
          <button type="button" class="gmo-skip" id="gmoSkip">⏭ تخطّى</button>
          <button type="button" class="gmo-alt" id="gmoAlt">🔄 بديل</button>
        </div>
      </div>`;

    // -------- bind controls --------
    const wInput=body.querySelector('.gmo-w-input');
    const rInput=body.querySelector('.gmo-r-input');
    const wMinus=body.querySelector('.gmo-w-minus');
    const wPlus=body.querySelector('.gmo-w-plus');
    const rMinus=body.querySelector('.gmo-r-minus');
    const rPlus=body.querySelector('.gmo-r-plus');
    const saveBtn=body.querySelector('#gmoSave');
    const skipBtn=body.querySelector('#gmoSkip');
    const altBtn=body.querySelector('#gmoAlt');

    const adjustW=(d)=>{
      const cur=parseFloat(wInput.value||'0')||0;
      const next=Math.max(0,Math.round((cur+d)*2)/2);
      wInput.value=next;
    };
    const adjustR=(d)=>{
      const cur=parseInt(rInput.value||'0',10)||0;
      const next=Math.max(0,cur+d);
      rInput.value=next;
    };
    if(wMinus) wMinus.onclick=()=>adjustW(-2.5);
    if(wPlus) wPlus.onclick=()=>adjustW(2.5);
    if(rMinus) rMinus.onclick=()=>adjustR(-1);
    if(rPlus) rPlus.onclick=()=>adjustR(1);

    if(saveBtn) saveBtn.onclick=async ()=>{
      const w=parseFloat(wInput.value);
      const r=parseInt(rInput.value,10);
      if(!w || !r){
        if(typeof showToast==='function') showToast('⚠️ أدخل الوزن والتكرار','var(--red)',2200);
        return;
      }
      saveBtn.disabled=true;
      saveBtn.textContent='جاري الحفظ...';
      const ok=await _savePassThrough(step,w,r);
      if(!ok){
        saveBtn.disabled=false;
        saveBtn.textContent='✓ تم السيت';
        return;
      }
      // ابدأ مؤقت راحة
      const restSec=_findRestSeconds(step);
      _showRestTimer(restSec);
    };

    if(skipBtn) skipBtn.onclick=()=>{
      // تخطّى = ضع class skipped + انتقل للتالي
      step.classList.add('skipped');
      setTimeout(_renderCurrentStep,200);
    };

    if(altBtn) altBtn.onclick=()=>{
      // اعرض البديل: نسخة مبسّطة - نقّر زر ⇄ الموجود
      const sub=step.querySelector('.alt-btn');
      if(sub){
        // اخرج Gym Mode مؤقتاً، اعرض البدائل
        exitGymMode(true);
        setTimeout(()=>sub.click(),200);
      } else if(typeof showToast==='function'){
        showToast('لا توجد بدائل لهذا التمرين','var(--tx2)',2200);
      }
    };

    // animation للسطر
    requestAnimationFrame(()=>{body.querySelector('.gmo-step')?.classList.add('show')});
  }

  // -------- Save set by simulating user input on real track-input --------
  async function _savePassThrough(step,weight,reps){
    const wInput=step.querySelector('.weight-input');
    const rInput=step.querySelector('.reps-input');
    const saveBtn=step.querySelector('.save-btn');
    if(!wInput || !rInput || !saveBtn){
      if(typeof showToast==='function') showToast('⚠️ لا يمكن العثور على خانات الإدخال','var(--red)',2500);
      return false;
    }
    wInput.value=weight;
    wInput.dispatchEvent(new Event('input',{bubbles:true}));
    rInput.value=reps;
    rInput.dispatchEvent(new Event('input',{bubbles:true}));
    // انتظر قليلاً ثم انقر save
    await new Promise(r=>setTimeout(r,80));
    saveBtn.click();
    return true;
  }

  // -------- Rest timer --------
  function _findRestSeconds(step){
    // ابحث عن أقرب step.rest بعده
    let cur=step.nextElementSibling;
    while(cur){
      if(cur.classList && cur.classList.contains('step')){
        if(cur.classList.contains('rest')){
          const txt=cur.textContent;
          const norm=(typeof arabicToLatinDigits==='function')?arabicToLatinDigits(txt):txt;
          const m=norm.match(/(\d{2,3})/);
          if(m) return parseInt(m[1],10);
          return 60;
        }
        return 60;
      }
      cur=cur.nextElementSibling;
    }
    return 60;
  }

  let _restTimerId=null;
  let _restRemaining=0;

  function _showRestTimer(seconds){
    const ov=_ensureOverlay();
    const restOv=ov.querySelector('#gmoRest');
    const timeEl=ov.querySelector('#gmoRestTime');
    const skipBtn=ov.querySelector('#gmoRestSkip');
    const addBtn=ov.querySelector('#gmoRestAdd');
    const preview=ov.querySelector('#gmoNextPreview');
    _restRemaining=seconds||60;
    if(timeEl) timeEl.textContent=_restRemaining;
    if(restOv) restOv.style.display='flex';
    if(_restTimerId) clearInterval(_restTimerId);
    _restTimerId=setInterval(()=>{
      _restRemaining--;
      if(timeEl) timeEl.textContent=Math.max(0,_restRemaining);
      if(_restRemaining<=0){
        _endRest();
      } else if(_restRemaining<=3){
        // ألوان تحذير
        timeEl.classList.add('gmo-rt-finish');
        try{navigator.vibrate&&navigator.vibrate(60)}catch(e){}
      }
    },1000);
    if(skipBtn) skipBtn.onclick=_endRest;
    if(addBtn) addBtn.onclick=()=>{_restRemaining+=30;if(timeEl)timeEl.textContent=_restRemaining;timeEl.classList.remove('gmo-rt-finish')};
    // اعرض next step preview
    if(preview){
      // نحتاج التالي بعد إنهاء السيت — لكن الحالة الحالية لم تتحدّث بعد (rendering يأتي بعد _endRest)
      // اعرض الـ active day card's next non-completed step
      setTimeout(()=>{
        const next=_findCurrentStep();
        if(next){
          const name=_stepName(next);
          preview.innerHTML=`التالي: <b>${E(name)}</b>`;
        } else {
          preview.innerHTML=`<b>آخر سيت!</b>`;
        }
      },80);
    }
  }

  function _endRest(){
    if(_restTimerId) clearInterval(_restTimerId);
    _restTimerId=null;
    const ov=document.getElementById('gymModeOverlay');
    if(!ov) return;
    const restOv=ov.querySelector('#gmoRest');
    const timeEl=ov.querySelector('#gmoRestTime');
    if(timeEl) timeEl.classList.remove('gmo-rt-finish');
    if(restOv) restOv.style.display='none';
    // أعد render
    _renderCurrentStep();
  }

  // -------- Public API --------
  function enterGymMode(){
    if(typeof currentSession==='undefined' || !currentSession){
      if(typeof showToast==='function') showToast('⚠️ ابدأ جلسة أولاً','var(--red)',2500);
      return;
    }
    gymModeActive=true;
    const ov=_ensureOverlay();
    ov.classList.add('open');
    document.body.classList.add('gym-mode-active');
    _renderCurrentStep();
    if(typeof showToast==='function') showToast('🎯 Gym Mode — تركيز كامل','var(--g2)',2200);
  }

  function exitGymMode(preserveSession){
    gymModeActive=false;
    const ov=document.getElementById('gymModeOverlay');
    if(ov) ov.classList.remove('open');
    document.body.classList.remove('gym-mode-active');
    if(_restTimerId){clearInterval(_restTimerId);_restTimerId=null}
  }

  function toggleGymMode(){
    if(gymModeActive) exitGymMode();
    else enterGymMode();
  }

  // expose
  window.enterGymMode=enterGymMode;
  window.exitGymMode=exitGymMode;
  window.toggleGymMode=toggleGymMode;
  window.isGymModeActive=()=>gymModeActive;
})();
