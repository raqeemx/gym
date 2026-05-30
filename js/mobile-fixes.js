/* ============================================================
 * BULK MODE V9.4 — Mobile UX Fixes
 * ============================================================
 * إصلاحات سلوكية يعجز عنها CSS:
 *
 *   1. منع pull-to-refresh العَرَضي عند سحب فوق track-input
 *   2. منع double-tap zoom على الأزرار (back-up لـ touch-action في الـ CSS)
 *   3. إصلاح iOS Safari viewport height (100vh مع شريط العنوان)
 *      → CSS variable --real-vh يساوي ١٪ من الـ viewport الفعلي
 *   4. عند فتح modal: حفظ scroll position + استعادتها عند الإغلاق
 *   5. عند keyboard يظهر على iOS: scroll للـ input النشط
 *   6. تحسين اختيار الـ input عند الـ focus (select all)
 *   7. منع zoom-in-out مع pinch (احتراز — viewport يسمح للـ accessibility)
 *
 * Lightweight — لا dependencies، يعمل صامتاً.
 * ============================================================ */

(function(){
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints>0;
  if(!isTouch) return; // desktop — لا نحتاج هذه الإصلاحات

  // ---------- 1. --real-vh لإصلاح iOS Safari 100vh ----------
  // الـ 100vh على iOS Safari لا يأخذ في الاعتبار شريط العنوان المتحرّك.
  // نحفظ القيمة الفعلية في --real-vh ونحدّثها عند resize.
  function setRealVH(){
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--real-vh', `${vh}px`);
  }
  setRealVH();
  window.addEventListener('resize', setRealVH, {passive:true});
  window.addEventListener('orientationchange', ()=>setTimeout(setRealVH, 100), {passive:true});

  // ---------- 2. Input focus on iOS — scroll للوسط ----------
  // على iOS لما الكيبورد يظهر، الـ input قد يختفي تحت الكيبورد.
  // نضمن scroll للـ input بعد ٣٠٠ms (وقت animation الكيبورد).
  document.addEventListener('focusin', (e)=>{
    const t = e.target;
    if(!t || !t.matches || !t.matches('input, textarea, select')) return;
    setTimeout(()=>{
      try{
        t.scrollIntoView({behavior:'smooth', block:'center'});
      }catch(err){}
    }, 320);
  });

  // ---------- 3. Auto-select content for weight/reps inputs ----------
  // لما المستخدم يلمس input الوزن/التكرار، نختار محتواه ليبدأ يكتب فوراً
  // (يلغي الحاجة لمحو القيمة السابقة)
  document.addEventListener('focusin', (e)=>{
    const t = e.target;
    if(!t || !t.classList) return;
    if(t.classList.contains('weight-input') ||
       t.classList.contains('reps-input') ||
       t.classList.contains('dl-num-input') ||
       t.classList.contains('rpe-input')){
      // تأخير صغير حتى لا يلغي iOS الاختيار
      setTimeout(()=>{
        try{
          if(typeof t.setSelectionRange==='function' && t.value){
            t.setSelectionRange(0, t.value.length);
          }
        }catch(err){}
      }, 30);
    }
  });

  // ---------- 4. Modal scroll lock فعّال ----------
  // عند فتح modal، نحفظ scrollY ونمنع التمرير. عند الإغلاق، نُعيد.
  const _scrollLockState = {scrollY:0, locked:false};
  function _isAnyModalOpen(){
    return !!document.querySelector('.stats-modal.open, .alt-modal.open, .voice-overlay.show, .onb-overlay.open');
  }
  // observer للـ modal classes
  const modalObserver = new MutationObserver(()=>{
    const anyOpen = _isAnyModalOpen();
    if(anyOpen && !_scrollLockState.locked){
      _scrollLockState.scrollY = window.scrollY;
      _scrollLockState.locked = true;
      // الـ body.style.overflow بالفعل يُعدّل من الكود الموجود — نحن نضيف position fix
      document.body.style.position = 'fixed';
      document.body.style.top = `-${_scrollLockState.scrollY}px`;
      document.body.style.width = '100%';
    }else if(!anyOpen && _scrollLockState.locked){
      _scrollLockState.locked = false;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, _scrollLockState.scrollY);
    }
  });
  // راقب class changes على modals
  document.querySelectorAll('.stats-modal, .alt-modal, .voice-overlay, .onb-overlay').forEach(m=>{
    modalObserver.observe(m, {attributes:true, attributeFilter:['class']});
  });
  // راقب أيضاً modals تُنشأ ديناميكياً (food-search, streak-page, weekly-review)
  const bodyObserver = new MutationObserver((records)=>{
    for(const rec of records){
      for(const node of rec.addedNodes){
        if(node.nodeType!==1) continue;
        if(node.classList && (
          node.classList.contains('stats-modal') ||
          node.classList.contains('alt-modal') ||
          node.classList.contains('voice-overlay')
        )){
          modalObserver.observe(node, {attributes:true, attributeFilter:['class']});
        }
      }
    }
  });
  bodyObserver.observe(document.body, {childList:true});

  // ---------- 5. Pull-to-refresh تخفيف ----------
  // overscroll-behavior:contain في CSS يحلّ كثيراً، لكن نضيف safety:
  // لو المستخدم بدأ السحب من أعلى الصفحة وكان فيه modal/track-input مفتوحة،
  // نمنع pull-to-refresh.
  let _touchStartY = 0;
  document.addEventListener('touchstart',(e)=>{
    _touchStartY = e.touches[0].clientY;
  }, {passive:true});
  document.addEventListener('touchmove',(e)=>{
    if(_isAnyModalOpen()) return; // الـ modal يدير scroll لوحده
    const y = e.touches[0].clientY;
    const dy = y - _touchStartY;
    // لو المستخدم في أعلى الصفحة ويسحب لأسفل + هو يكتب في input، امنع
    const active = document.activeElement;
    const isTyping = active && active.matches && active.matches('input, textarea, select');
    if(window.scrollY<=0 && dy>10 && isTyping){
      e.preventDefault();
    }
  }, {passive:false});

  // ---------- 6. orientation change re-render trigger ----------
  // عند تغيير الاتجاه، بعض الـ canvas charts لا تُعاد رسمها.
  window.addEventListener('orientationchange', ()=>{
    setTimeout(()=>{
      // أعد رسم Dashboard لو ظاهر
      if(typeof refreshDashboard==='function'){
        const t0 = document.getElementById('t0');
        if(t0 && t0.classList.contains('a')) refreshDashboard();
      }
      // أعد عرض timeline chart لو ظاهر
      if(typeof renderBodyMetrics==='function'){
        const metricsPane = document.getElementById('ppMetrics');
        if(metricsPane && metricsPane.classList.contains('a')) renderBodyMetrics();
      }
    }, 350);
  }, {passive:true});

  // ---------- 7. تجنّب double-tap zoom على الأزرار ----------
  // CSS touch-action:manipulation يحل ذلك، لكن للأزرار التي ليس لها هذا الـ rule:
  let _lastTouchEnd = 0;
  document.addEventListener('touchend', (e)=>{
    const now = Date.now();
    if(now - _lastTouchEnd <= 300){
      const t = e.target;
      // فقط للأزرار/links، لا نمنع تكبير محتوى نصي عادي
      if(t && t.closest && t.closest('button, a, [role="button"], .nb, .prog-tab')){
        e.preventDefault();
      }
    }
    _lastTouchEnd = now;
  }, {passive:false});

  // ---------- 8. Tap state visual feedback (CSS :active لا يعمل دائماً على iOS) ----------
  // أضف class .is-pressing مؤقتاً للأزرار عند اللمس — يكمّل :active في CSS
  document.addEventListener('touchstart',(e)=>{
    const btn = e.target.closest('button, .dash-action, .guide-hub-card, .fpp-chip, .fc-chip');
    if(btn) btn.classList.add('is-pressing');
  }, {passive:true});
  document.addEventListener('touchend',(e)=>{
    document.querySelectorAll('.is-pressing').forEach(b=>{
      setTimeout(()=>b.classList.remove('is-pressing'), 60);
    });
  }, {passive:true});
  document.addEventListener('touchcancel',()=>{
    document.querySelectorAll('.is-pressing').forEach(b=>b.classList.remove('is-pressing'));
  }, {passive:true});
})();
