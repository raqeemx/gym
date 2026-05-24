/* ============================================================
 * BULK MODE V9.2 (B.8) — Smart Rest Detection
 * ============================================================
 * يضيف "ذكاء" بسيط للراحة بدون تعطيل الـ rest timer الحالي:
 *
 *   1. تتبع زمن الراحة الفعلي بين السيتات (lastSaveTimestamp)
 *      → يُحسب الفرق عند بدء إدخال السيت التالي
 *      → يُخزّن في setRec.actualRestSeconds لتحليل لاحق
 *
 *   2. Page Visibility resume toast:
 *      لو المستخدم رجع للتاب بعد انتهاء الراحة بـ ٣٠+ ثانية،
 *      يرى toast: «✓ راحتك انتهت من X ثانية — جاهز للسيت التالي»
 *
 *   3. Idle hint:
 *      لو لم يحفظ سيت لـ ٣ دقائق بعد انتهاء الراحة،
 *      يظهر hint خفيف فوق track-input التالي.
 *
 * يعمل مع REST timer الموجود في session.js (لا يستبدله).
 * ============================================================ */

(function(){
  let _lastSaveAt = null;           // timestamp آخر save (ms)
  let _lastRestEndAt = null;        // timestamp انتهاء آخر راحة متوقعة (ms)
  let _idleHintTimer = null;
  let _visibilityHandler = null;
  let _wasHidden = false;
  let _hiddenAt = null;

  // اضبط بعد كل save (يُستدعى من session.js عند save ناجح)
  function markSaveTimestamp(){
    _lastSaveAt = Date.now();
    // calculate expected rest end لاحقاً من REST timer إن كان نشطاً
    if(typeof REST !== 'undefined' && REST.expectedSec){
      _lastRestEndAt = Date.now() + REST.expectedSec*1000;
    }else{
      // افتراضي ٦٠ ث
      _lastRestEndAt = Date.now() + 60000;
    }
    _scheduleIdleHint();
  }

  // عند بدء كتابة سيت جديد، احسب الراحة الفعلية
  function recordActualRest(setRec){
    if(!setRec || !_lastSaveAt) return;
    const restSec = Math.round((Date.now() - _lastSaveAt)/1000);
    // sanity check: بين ١٠ ث و ٢٠ دقيقة
    if(restSec>=10 && restSec<=1200){
      setRec.actualRestSeconds = restSec;
    }
  }

  // Page Visibility — لو رجع التاب بعد انتهاء الراحة بفترة، toast لطيف
  function _setupVisibility(){
    if(_visibilityHandler) return;
    _visibilityHandler = ()=>{
      if(document.hidden){
        _wasHidden = true;
        _hiddenAt = Date.now();
      }else if(_wasHidden){
        _wasHidden = false;
        const now = Date.now();
        const hiddenFor = (now - (_hiddenAt||now))/1000;
        _hiddenAt = null;
        // لو ما في جلسة نشطة → لا شيء
        if(typeof currentSession==='undefined' || !currentSession) return;
        // لو لا نعرف وقت انتهاء الراحة → لا شيء
        if(!_lastRestEndAt) return;
        // كم مرّ من انتهاء الراحة المتوقعة؟
        const sinceRestEnd = (now - _lastRestEndAt)/1000;
        // إذا الراحة المتوقعة انتهت قبل ٣٠ ث على الأقل، وكان غائباً ٢٠ ث+
        if(sinceRestEnd>=30 && hiddenFor>=20){
          const msg = sinceRestEnd>=60
            ? `✓ راحتك انتهت قبل ${Math.round(sinceRestEnd/60)} دقيقة — جاهز`
            : `✓ راحتك انتهت قبل ${Math.round(sinceRestEnd)} ث — جاهز`;
          if(typeof showToast==='function') showToast(msg,'var(--grn)',3500);
        }
      }
    };
    document.addEventListener('visibilitychange', _visibilityHandler);
  }

  function _scheduleIdleHint(){
    if(_idleHintTimer){clearTimeout(_idleHintTimer);_idleHintTimer=null}
    // بعد ٣ دقائق من آخر save بدون فعل
    _idleHintTimer = setTimeout(()=>{
      if(typeof currentSession==='undefined' || !currentSession) return;
      // ابحث عن أول track-input غير مكتمل بعد آخر سيت
      const nextStep = document.querySelector('.step:not(.completed):not(.skipped):not(.rest):not(.warmup) .track-input');
      if(!nextStep) return;
      // أضف hint مرئي خفيف
      let hint = nextStep.querySelector('.idle-hint');
      if(hint) return; // موجود بالفعل
      hint = document.createElement('div');
      hint.className='idle-hint';
      hint.innerHTML='⏰ مر <b>٣ دقائق</b> منذ آخر سيت — هل لا تزال تتمرن؟';
      nextStep.appendChild(hint);
      // امسح تلقائياً عند input
      const inputs=nextStep.querySelectorAll('input');
      const remove=()=>{if(hint && hint.parentNode){hint.remove()}inputs.forEach(i=>i.removeEventListener('input',remove))};
      inputs.forEach(i=>i.addEventListener('input',remove,{once:true}));
    }, 180000); // 3 دقائق
  }

  function clearIdleHint(){
    if(_idleHintTimer){clearTimeout(_idleHintTimer);_idleHintTimer=null}
  }

  function reset(){
    _lastSaveAt = null;
    _lastRestEndAt = null;
    _wasHidden = false;
    _hiddenAt = null;
    clearIdleHint();
  }

  // setup مرة واحدة
  if(document.readyState!=='loading') _setupVisibility();
  else window.addEventListener('DOMContentLoaded',_setupVisibility);

  // expose
  window.smartRest = {
    markSaveTimestamp,
    recordActualRest,
    clearIdleHint,
    reset
  };
})();
