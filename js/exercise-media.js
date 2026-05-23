/* ============================================================
 * BULK MODE V9.0 — Exercise Media (P3)
 * ============================================================
 * يوفّر طبقة media للتمارين:
 *  1) لو EXERCISE_FORM_NOTES[name].gif موجود → استخدمه (كما السابق)
 *  2) لو null → ولّد SVG placeholder ديناميكي حسب category
 *     (push/pull/legs/core/cardio) — لا اتصال خارجي، لا تنزيلات
 *
 * كل التمارين الـ ٢٥+ صار لها visual representation الآن.
 *
 * استخدام:
 *   const src = getExerciseMediaSrc(exName);   // returns string or null
 *   const dataURI = renderPlaceholderDataURI('push', exName);
 * ============================================================ */

(function(){
  // ألوان أساسية مطابقة لـ palette التطبيق (g1/blue/grn/purple/org)
  const CATEGORY_THEME = {
    push:   {stroke:'#D4A853', glow:'#EDCA7A', bg:'#10131A', label:'PUSH'},
    pull:   {stroke:'#5AB4FF', glow:'#7BC8FF', bg:'#10131A', label:'PULL'},
    legs:   {stroke:'#5AE68A', glow:'#7AF0A0', bg:'#10131A', label:'LEGS'},
    core:   {stroke:'#B08AFF', glow:'#C8A8FF', bg:'#10131A', label:'CORE'},
    cardio: {stroke:'#FFB85A', glow:'#FFCD80', bg:'#10131A', label:'CARDIO'},
    default:{stroke:'#9CA4B5', glow:'#BCC3D2', bg:'#10131A', label:'EXERCISE'}
  };

  // SVG shapes — كل واحد ثابت بتحريك CSS بسيط (يلوّن حسب الفئة)
  // الأشكال abstract — لا تمثيل دقيق لجسم بشري، لكن توحي بنوع الحركة
  function _svgPushArrow(theme){
    // سهم لأمام (push)
    return `
      <rect width="100%" height="100%" fill="${theme.bg}" rx="14"/>
      <g transform="translate(240 140)" fill="none" stroke="${theme.stroke}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="-100" cy="0" r="34" fill="${theme.stroke}" opacity=".15"/>
        <circle cx="-100" cy="0" r="34"/>
        <path d="M-66 0 H80">
          <animate attributeName="stroke-dasharray" values="0,200;200,200;200,200" dur="2.2s" repeatCount="indefinite"/>
        </path>
        <path d="M40 -28 L98 0 L40 28" />
      </g>
      <text x="240" y="240" text-anchor="middle" font-family="Outfit,sans-serif" font-weight="800" font-size="14" letter-spacing="2" fill="${theme.glow}" opacity=".55">${theme.label}</text>
    `;
  }
  function _svgPullArrow(theme){
    // سهم للداخل (pull) — معكوس
    return `
      <rect width="100%" height="100%" fill="${theme.bg}" rx="14"/>
      <g transform="translate(240 140)" fill="none" stroke="${theme.stroke}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="100" cy="0" r="34" fill="${theme.stroke}" opacity=".15"/>
        <circle cx="100" cy="0" r="34"/>
        <path d="M66 0 H-80">
          <animate attributeName="stroke-dasharray" values="0,200;200,200;200,200" dur="2.2s" repeatCount="indefinite"/>
        </path>
        <path d="M-40 -28 L-98 0 L-40 28"/>
      </g>
      <text x="240" y="240" text-anchor="middle" font-family="Outfit,sans-serif" font-weight="800" font-size="14" letter-spacing="2" fill="${theme.glow}" opacity=".55">${theme.label}</text>
    `;
  }
  function _svgLegs(theme){
    // عمود متحرك يمثّل ضغط أرجل
    return `
      <rect width="100%" height="100%" fill="${theme.bg}" rx="14"/>
      <g transform="translate(240 140)" fill="none" stroke="${theme.stroke}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <rect x="-60" y="-50" width="120" height="100" rx="10" fill="${theme.stroke}" opacity=".12"/>
        <rect x="-60" y="-50" width="120" height="100" rx="10"/>
        <line x1="-60" y1="-20" x2="60" y2="-20" opacity=".4"/>
        <line x1="-60" y1="10" x2="60" y2="10" opacity=".4"/>
        <g>
          <path d="M-30 60 L-30 70 L30 70 L30 60" />
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,-20; 0,0" dur="2.4s" repeatCount="indefinite"/>
        </g>
      </g>
      <text x="240" y="240" text-anchor="middle" font-family="Outfit,sans-serif" font-weight="800" font-size="14" letter-spacing="2" fill="${theme.glow}" opacity=".55">${theme.label}</text>
    `;
  }
  function _svgCore(theme){
    // قوس متحرك يمثّل crunch
    return `
      <rect width="100%" height="100%" fill="${theme.bg}" rx="14"/>
      <g transform="translate(240 140)" fill="none" stroke="${theme.stroke}" stroke-width="6" stroke-linecap="round">
        <path d="M-80 30 Q0 -40 80 30" opacity=".25"/>
        <path d="M-80 30 Q0 -40 80 30">
          <animate attributeName="d" values="M-80 30 Q0 -40 80 30; M-80 30 Q0 30 80 30; M-80 30 Q0 -40 80 30" dur="2.5s" repeatCount="indefinite"/>
        </path>
        <circle cx="0" cy="-10" r="14" fill="${theme.stroke}" opacity=".2"/>
        <circle cx="0" cy="-10" r="14">
          <animate attributeName="cy" values="-10; 22; -10" dur="2.5s" repeatCount="indefinite"/>
        </circle>
      </g>
      <text x="240" y="240" text-anchor="middle" font-family="Outfit,sans-serif" font-weight="800" font-size="14" letter-spacing="2" fill="${theme.glow}" opacity=".55">${theme.label}</text>
    `;
  }
  function _svgCardio(theme){
    // خط نبض
    return `
      <rect width="100%" height="100%" fill="${theme.bg}" rx="14"/>
      <g transform="translate(50 140)" fill="none" stroke="${theme.stroke}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M0 0 L60 0 L80 -40 L100 40 L120 0 L160 0 L180 -25 L200 25 L220 0 L380 0" opacity=".25"/>
        <path d="M0 0 L60 0 L80 -40 L100 40 L120 0 L160 0 L180 -25 L200 25 L220 0 L380 0" stroke-dasharray="600" stroke-dashoffset="600">
          <animate attributeName="stroke-dashoffset" values="600;0" dur="1.8s" repeatCount="indefinite"/>
        </path>
      </g>
      <text x="240" y="240" text-anchor="middle" font-family="Outfit,sans-serif" font-weight="800" font-size="14" letter-spacing="2" fill="${theme.glow}" opacity=".55">${theme.label}</text>
    `;
  }

  const SHAPE_FOR = {
    push:_svgPushArrow,
    pull:_svgPullArrow,
    legs:_svgLegs,
    core:_svgCore,
    cardio:_svgCardio,
    default:_svgPushArrow
  };

  // يولّد SVG كنص data URI (يُسند مباشرة لـ img.src)
  function renderPlaceholderDataURI(category,exName){
    const theme=CATEGORY_THEME[category]||CATEGORY_THEME.default;
    const shape=(SHAPE_FOR[category]||SHAPE_FOR.default)(theme);
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 280" width="480" height="280" role="img" aria-label="${(exName||'').replace(/"/g,'')}">${shape}</svg>`;
    // encodeURIComponent يحوّل # ﻷمان data URI
    return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  }

  // الواجهة العامة: يعطي مصدر media جاهز للاستخدام في img.src
  // priority: gif file (لو موجود) → placeholder حسب category
  function getExerciseMediaSrc(exName){
    if(typeof EXERCISE_FORM_NOTES==='undefined') return null;
    const note=EXERCISE_FORM_NOTES[exName];
    if(!note) return null;
    if(note.gif) return note.gif;
    return renderPlaceholderDataURI(note.category||'default',exName);
  }

  // expose
  window.renderPlaceholderDataURI=renderPlaceholderDataURI;
  window.getExerciseMediaSrc=getExerciseMediaSrc;
})();
