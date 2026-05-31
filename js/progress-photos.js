/* ============================================================
 * BULK MODE — Progress Photos (V8)
 * ============================================================
 * صور التقدّم — تُحفظ كـ Blob في IndexedDB (لا تغادر الجهاز).
 *
 * - ضغط تلقائي عبر Canvas (1080px max، JPEG 0.85)
 * - معرض thumbnails مرتبط بـ Object URLs (تُلغى عند إعادة العرض)
 * - عرض fullscreen + حذف
 * - مقارنة "قبل/بعد" مع تصدير صورة مدمجة (Canvas)
 *
 * Schema record: { id (auto), blob, date, category, weight?, notes?, timestamp }
 * ============================================================ */

const PHOTO_CATEGORIES=[
  {id:'front', label:'أمامي',     icon:'⬆️'},
  {id:'side',  label:'جانبي',     icon:'➡️'},
  {id:'back',  label:'خلفي',      icon:'⬇️'},
  {id:'upper', label:'أعلى الجسم',icon:'💪'},
  {id:'lower', label:'أسفل الجسم',icon:'🦵'}
];
const PHOTO_MAX_SIDE=1080;
const PHOTO_JPEG_QUALITY=0.85;

// إدارة Object URLs (نلغيها قبل كل re-render لتفادي تسرّب الذاكرة)
const _photoURLs=new Set();
function _trackURL(url){_photoURLs.add(url);return url}
function _revokeAllPhotoURLs(){
  _photoURLs.forEach(u=>{try{URL.revokeObjectURL(u)}catch(e){}});
  _photoURLs.clear();
}
function _catLabel(id){const c=PHOTO_CATEGORIES.find(x=>x.id===id);return c?c.label:id}
function _catIcon(id){const c=PHOTO_CATEGORIES.find(x=>x.id===id);return c?c.icon:'📸'}

// ============ Helpers: Blob ↔ Image ============
function blobToImage(blob){
  return new Promise((res,rej)=>{
    const url=URL.createObjectURL(blob);
    const img=new Image();
    img.onload=()=>{URL.revokeObjectURL(url);res(img)};
    img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('Image load failed'))};
    img.src=url;
  });
}

// ============ ضغط الصورة عبر Canvas ============
// لو فشل: يرجّع الـ blob الأصلي مع تحذير
async function resizeImageFile(file, maxSide=PHOTO_MAX_SIDE, quality=PHOTO_JPEG_QUALITY){
  try{
    const img=await blobToImage(file);
    let {width:w, height:h}=img;
    const long=Math.max(w,h);
    if(long>maxSide){
      const r=maxSide/long;
      w=Math.round(w*r);
      h=Math.round(h*r);
    }
    const canvas=document.createElement('canvas');
    canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d');
    ctx.drawImage(img,0,0,w,h);
    return await new Promise((res,rej)=>{
      canvas.toBlob(b=>{
        if(b) res({blob:b, resized:true, originalSize:file.size, newSize:b.size});
        else rej(new Error('Canvas toBlob failed'));
      },'image/jpeg',quality);
    });
  }catch(e){
    console.warn('Resize failed, using original:',e);
    showToast('⚠️ تعذّر ضغط الصورة — حُفظت بالحجم الأصلي','var(--org)',5000);
    return {blob:file, resized:false, originalSize:file.size, newSize:file.size};
  }
}

// ============ Render: التبويب الكامل ============
async function renderProgressPhotos(){
  _revokeAllPhotoURLs();
  const wrap=document.getElementById('ppBody');
  if(!wrap) return;
  // ابنِ HTML الأساسي
  wrap.innerHTML=`
    <div class="pp-hint">📸 صور التقدّم تُحفظ على جهازك فقط — لا تغادر التطبيق أبداً. مضغوطة تلقائياً لتوفير المساحة.</div>
    <div class="pp-actions">
      <button class="pp-add-btn" onclick="document.getElementById('ppFileInput').click()">➕ أضف صورة</button>
      <button class="pp-compare-btn" onclick="openPhotoCompareModal()">🔄 مقارنة قبل/بعد</button>
    </div>
    <input type="file" id="ppFileInput" accept="image/*" style="display:none">
    <div id="ppFormWrap" style="display:none"></div>
    <div id="ppGallery" class="pp-gallery"></div>
  `;
  // ربط file input
  const fi=document.getElementById('ppFileInput');
  fi.addEventListener('change',e=>{
    const f=e.target.files&&e.target.files[0];
    if(f) handlePhotoFile(f);
    fi.value=''; // اسمح بإعادة اختيار نفس الملف لاحقاً
  });
  await renderPhotoGallery();
}

// ============ بعد اختيار صورة: ضغط + نموذج ============
async function handlePhotoFile(file){
  if(!file.type.startsWith('image/')){
    showToast('⚠️ نوع الملف غير مدعوم','var(--red)');return;
  }
  showToast('⏳ جاري ضغط الصورة...','var(--blue)',1500);
  const {blob, resized, originalSize, newSize}=await resizeImageFile(file);
  // اعرض النموذج مع المعاينة
  const wrap=document.getElementById('ppFormWrap');
  const previewUrl=_trackURL(URL.createObjectURL(blob));
  const today=new Date().toISOString().split('T')[0];
  const savedKB=Math.round((originalSize-newSize)/1024);
  const sizeNote=resized && savedKB>0
    ?`وفّرنا <b>${savedKB} كيلوبايت</b> بالضغط`
    :`الحجم: ${Math.round(newSize/1024)} كيلوبايت`;

  wrap.innerHTML=`
    <div class="pp-form">
      <div class="pp-preview">
        <img src="${previewUrl}" alt="معاينة">
        <div class="pp-preview-note">${sizeNote}</div>
      </div>
      <div class="pp-form-grid">
        <div class="bm-field">
          <label>التاريخ</label>
          <input type="date" id="ppDate" value="${today}">
        </div>
        <div class="bm-field">
          <label>الفئة</label>
          <select id="ppCategory" class="prof-select">
            ${PHOTO_CATEGORIES.map(c=>`<option value="${c.id}">${c.icon} ${c.label}</option>`).join('')}
          </select>
        </div>
        <div class="bm-field">
          <label>الوزن الحالي <small>(كجم — اختياري)</small></label>
          <input type="number" inputmode="decimal" step="0.1" id="ppWeight" placeholder="—">
        </div>
        <div class="bm-field pp-notes-field">
          <label>ملاحظة <small>(اختياري)</small></label>
          <input type="text" id="ppNotes" placeholder="مثلاً: نهاية الأسبوع الأول">
        </div>
      </div>
      <div class="pp-form-actions">
        <button class="pp-cancel" onclick="cancelPhotoForm()">إلغاء</button>
        <button class="bm-save" onclick="savePhotoFromForm()">💾 احفظ الصورة</button>
      </div>
    </div>
  `;
  wrap.style.display='block';
  // احفظ الـ blob المضغوط في dataset مؤقتاً عبر متغيّر module-level
  _pendingPhotoBlob=blob;
}

let _pendingPhotoBlob=null;

function cancelPhotoForm(){
  _pendingPhotoBlob=null;
  const wrap=document.getElementById('ppFormWrap');
  if(wrap){wrap.innerHTML='';wrap.style.display='none'}
}

// ============ حفظ الصورة بعد ملء النموذج ============
async function savePhotoFromForm(){
  if(!_pendingPhotoBlob){showToast('⚠️ لا توجد صورة للحفظ','var(--red)');return}
  const date=document.getElementById('ppDate').value;
  const category=document.getElementById('ppCategory').value;
  const weightRaw=document.getElementById('ppWeight').value.trim();
  const notes=document.getElementById('ppNotes').value.trim();
  if(!date){showToast('⚠️ أدخل التاريخ','var(--red)');return}
  const rec={
    blob:_pendingPhotoBlob,
    date,
    category,
    weight:weightRaw?parseFloat(weightRaw):null,
    notes:notes||null,
    timestamp:new Date().toISOString()
  };
  try{
    await db.add('progressPhotos',rec);
    showToast('✓ تم حفظ الصورة','var(--grn)');
    try{navigator.vibrate&&navigator.vibrate(30)}catch(e){}

    // V9.5 (#2) — لو في وزن مع الصورة، اقترح حفظه في bodyMetrics لنفس التاريخ
    if(rec.weight){
      try{
        const existingBM=await db.get('bodyMetrics',date);
        // لا تكتب فوق قياسات موجودة بدون موافقة
        if(!existingBM || existingBM.bodyWeight==null){
          const bm=existingBM
            ?{...existingBM, bodyWeight:rec.weight, timestamp:new Date().toISOString()}
            :{date, bodyWeight:rec.weight, timestamp:new Date().toISOString()};
          await db.put('bodyMetrics',bm);
          setTimeout(()=>showToast('✓ تم تحديث "قياسات الجسم" أيضاً','var(--blue)',2500),1200);
        }else if(Math.abs(existingBM.bodyWeight-rec.weight)>0.1){
          // وزن موجود ومختلف — لا نكتب فوقه، لكن ننبّه
          setTimeout(()=>showToast(`💡 وزنك في "قياسات الجسم" لهذا اليوم: ${existingBM.bodyWeight} كجم`,'var(--org)',4000),1200);
        }
      }catch(syncErr){console.warn('Photo→BM sync failed:',syncErr)}
    }

    _pendingPhotoBlob=null;
    cancelPhotoForm();
    await renderPhotoGallery();
  }catch(e){
    if(e && e.name==='QuotaExceededError'){
      // handleQuotaError مُستدعى تلقائياً من db wrapper
      console.warn('Quota exceeded saving photo');
    }else{
      console.error('Save photo failed:',e);
      showToast('⚠️ فشل الحفظ: '+e.message,'var(--red)');
    }
  }
}

// ============ Render: المعرض (Grid) ============
async function renderPhotoGallery(){
  const gallery=document.getElementById('ppGallery');
  if(!gallery) return;
  const all=await db.getAll('progressPhotos');
  if(!all.length){
    gallery.innerHTML=`<div class="empty-state"><div class="es-icon">📷</div><div class="es-text">لا توجد صور بعد.<br><b>التقط أول صورة لرحلتك!</b></div></div>`;
    return;
  }
  // الأحدث أولاً (date desc، ثم timestamp)
  const sorted=[...all].sort((a,b)=>{
    if(b.date!==a.date) return b.date.localeCompare(a.date);
    return (b.timestamp||'').localeCompare(a.timestamp||'');
  });
  gallery.innerHTML=sorted.map(p=>{
    const url=_trackURL(URL.createObjectURL(p.blob));
    // V9.6 (#7) — badge بارز للوزن (top-left على الصورة)
    const wBadge=p.weight?`<div class="pp-thumb-weight-badge">⚖️ ${p.weight}<small>كجم</small></div>`:'';
    return `<div class="pp-thumb" onclick="openPhotoFullscreen(${p.id})">
      <img src="${url}" alt="صورة ${p.date}" loading="lazy">
      ${wBadge}
      <div class="pp-thumb-overlay">
        <div class="pp-thumb-cat">${_catIcon(p.category)} ${_catLabel(p.category)}</div>
        <div class="pp-thumb-date">${fmtDate(p.date)}</div>
      </div>
    </div>`;
  }).join('');
}

// ============ Fullscreen modal ============
async function openPhotoFullscreen(id){
  const rec=await db.get('progressPhotos',id);
  if(!rec){showToast('⚠️ الصورة غير موجودة','var(--red)');return}
  const url=_trackURL(URL.createObjectURL(rec.blob));
  let overlay=document.getElementById('ppFullscreen');
  if(!overlay){
    overlay=document.createElement('div');
    overlay.id='ppFullscreen';
    overlay.className='pp-fullscreen';
    document.body.appendChild(overlay);
  }
  const wTxt=rec.weight?` · ${rec.weight}كجم`:'';
  const noteTxt=rec.notes?`<div class="pp-fs-note">📝 ${escHTML(rec.notes)}</div>`:'';
  overlay.innerHTML=`
    <button class="pp-fs-close" onclick="closePhotoFullscreen()" aria-label="إغلاق">✕</button>
    <img src="${url}" alt="صورة ${rec.date}">
    <div class="pp-fs-info">
      <div class="pp-fs-meta">${_catIcon(rec.category)} ${_catLabel(rec.category)} · ${fmtDate(rec.date)}${wTxt}</div>
      ${noteTxt}
      <button class="pp-fs-delete" onclick="deletePhoto(${rec.id})">🗑 حذف</button>
    </div>
  `;
  overlay.classList.add('show');
  document.body.style.overflow='hidden';
  // إغلاق عند النقر على الخلفية
  overlay.onclick=(e)=>{if(e.target===overlay) closePhotoFullscreen()};
}

function closePhotoFullscreen(){
  const overlay=document.getElementById('ppFullscreen');
  if(!overlay) return;
  overlay.classList.remove('show');
  document.body.style.overflow='';
  // امسح المحتوى لتفادي الاحتفاظ بالـ URL
  setTimeout(()=>{overlay.innerHTML=''},300);
}

// ============ حذف صورة ============
async function deletePhoto(id){
  if(!await customConfirm('حذف الصورة نهائياً؟<br><small style="color:var(--tx3)">لا يمكن استرجاعها.</small>',{title:'حذف صورة',okText:'احذف',danger:true,icon:'🗑'})) return;
  await db.delete('progressPhotos',id);
  closePhotoFullscreen();
  showToast('🗑 تم حذف الصورة','var(--red)');
  await renderPhotoGallery();
}

// ============ Compare Modal ============
async function openPhotoCompareModal(){
  const all=await db.getAll('progressPhotos');
  if(all.length<2){
    showToast('⚠️ تحتاج صورتين على الأقل للمقارنة','var(--org)',4000);
    return;
  }
  const sorted=[...all].sort((a,b)=>a.date.localeCompare(b.date));
  let modal=document.getElementById('ppCompareModal');
  if(!modal){
    modal=document.createElement('div');
    modal.id='ppCompareModal';
    modal.className='stats-modal';
    document.body.appendChild(modal);
    modal.addEventListener('click',(e)=>{if(e.target===modal) closePhotoCompareModal()});
  }
  const opt=p=>`<option value="${p.id}">${fmtDate(p.date)} · ${_catLabel(p.category)}${p.weight?' · '+p.weight+'كجم':''}</option>`;
  modal.innerHTML=`
    <div class="stats-content">
      <button class="close-modal" onclick="closePhotoCompareModal()">✕</button>
      <h2>🔄 مقارنة قبل/بعد</h2>
      <div class="pp-compare-selects">
        <div class="bm-field">
          <label>قبل</label>
          <select id="ppCmpBefore" class="prof-select" onchange="renderCompareView()">
            ${sorted.map(opt).join('')}
          </select>
        </div>
        <div class="bm-field">
          <label>بعد</label>
          <select id="ppCmpAfter" class="prof-select" onchange="renderCompareView()">
            ${sorted.map(opt).join('')}
          </select>
        </div>
      </div>
      <div id="ppCompareView"></div>
      <div class="pp-compare-actions">
        <button class="bm-save" onclick="exportCompareImage()">📥 احفظ كصورة مدمجة</button>
      </div>
    </div>
  `;
  // افتراضياً: الأقدم vs الأحدث
  document.getElementById('ppCmpBefore').value=sorted[0].id;
  document.getElementById('ppCmpAfter').value=sorted[sorted.length-1].id;
  await renderCompareView();
  modal.classList.add('open');
  document.body.style.overflow='hidden';
}

function closePhotoCompareModal(){
  const modal=document.getElementById('ppCompareModal');
  if(!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow='';
  setTimeout(()=>{if(modal) modal.innerHTML=''},300);
}

async function renderCompareView(){
  const bId=parseInt(document.getElementById('ppCmpBefore').value);
  const aId=parseInt(document.getElementById('ppCmpAfter').value);
  const before=await db.get('progressPhotos',bId);
  const after=await db.get('progressPhotos',aId);
  const view=document.getElementById('ppCompareView');
  if(!before||!after){view.innerHTML='<div class="ss-empty">اختر صورتين</div>';return}
  const beforeUrl=_trackURL(URL.createObjectURL(before.blob));
  const afterUrl=_trackURL(URL.createObjectURL(after.blob));
  // V9.8 (#18) — تنبيه لو الـ categories مختلفة (وضعيات مختلفة = مقارنة صعبة)
  let categoryWarn='';
  if(before.category && after.category && before.category!==after.category){
    categoryWarn=`<div class="pp-cmp-warn">
      ⚠️ الوضعيات مختلفة: <b>${_catIcon(before.category)} ${_catLabel(before.category)}</b> vs <b>${_catIcon(after.category)} ${_catLabel(after.category)}</b> — قد يصعب التقييم البصري الدقيق.
    </div>`;
  }
  // V9.6 (#7) — فرق الوزن + المدة الزمنية (لو الاثنين عندهم weight)
  let weightDelta='';
  if(before.weight!=null && after.weight!=null){
    const d=Math.round((after.weight-before.weight)*10)/10;
    const sign=d>0?'+':'';
    const cls=d>0?'pp-w-up':(d<0?'pp-w-down':'pp-w-flat');
    // المدة بين الصورتين
    const daysBetween=Math.abs(Math.round((new Date(after.date)-new Date(before.date))/86400000));
    const periodTxt = daysBetween===0?'نفس اليوم'
                    : daysBetween<7?`خلال ${daysBetween} يوم`
                    : daysBetween<60?`خلال ${Math.round(daysBetween/7)} أسبوع`
                    : `خلال ${Math.round(daysBetween/30)} شهر`;
    // معدل التغيير الأسبوعي (مفيد للتضخيم/التنشيف)
    let rateTxt='';
    if(daysBetween>=14 && d!==0){
      const ratePerWeek=Math.round((d/daysBetween)*7*100)/100;
      const rateSign=ratePerWeek>0?'+':'';
      rateTxt=` <small>(${rateSign}${ratePerWeek} كجم/أسبوع)</small>`;
    }
    weightDelta=`<div class="pp-cmp-delta ${cls}">
      <div class="pp-cmp-delta-main">
        <span class="pp-cmp-delta-icon">${d>0?'📈':(d<0?'📉':'➖')}</span>
        <b>${sign}${d}</b> كجم ${periodTxt}${rateTxt}
      </div>
    </div>`;
  }
  view.innerHTML=`
    <div class="pp-compare-grid">
      <div class="pp-compare-side">
        <div class="pp-cmp-label">قبل</div>
        <img src="${beforeUrl}" alt="قبل">
        <div class="pp-cmp-meta">${fmtDate(before.date)}${before.weight?' · '+before.weight+'كجم':''}</div>
      </div>
      <div class="pp-compare-side">
        <div class="pp-cmp-label after">بعد</div>
        <img src="${afterUrl}" alt="بعد">
        <div class="pp-cmp-meta">${fmtDate(after.date)}${after.weight?' · '+after.weight+'كجم':''}</div>
      </div>
    </div>
    ${categoryWarn}
    ${weightDelta}
  `;
}

// ============ تصدير المقارنة كصورة JPEG ============
async function exportCompareImage(){
  const bId=parseInt(document.getElementById('ppCmpBefore').value);
  const aId=parseInt(document.getElementById('ppCmpAfter').value);
  const before=await db.get('progressPhotos',bId);
  const after=await db.get('progressPhotos',aId);
  if(!before||!after){showToast('⚠️ اختر صورتين','var(--red)');return}
  try{
    const beforeImg=await blobToImage(before.blob);
    const afterImg=await blobToImage(after.blob);
    const W=1080;
    const gap=20;
    const eachW=Math.floor((W-gap)/2);
    const headerH=60;
    const labelH=40;
    const footerH=80;
    const beforeH=Math.round(beforeImg.height*(eachW/beforeImg.width));
    const afterH=Math.round(afterImg.height*(eachW/afterImg.width));
    const imgH=Math.max(beforeH,afterH);
    const canvas=document.createElement('canvas');
    canvas.width=W;
    canvas.height=headerH+labelH+imgH+footerH;
    const ctx=canvas.getContext('2d');
    // خلفية
    ctx.fillStyle='#0B0D11';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // Header
    ctx.fillStyle='#D4A853';
    ctx.font='bold 28px sans-serif';
    ctx.textAlign='center';
    ctx.fillText('💪 BULK MODE — مقارنة التقدّم',W/2,40);
    // Labels قبل/بعد
    ctx.font='bold 20px sans-serif';
    ctx.fillStyle='#9CA4B5';
    ctx.fillText('قبل',eachW/2,headerH+28);
    ctx.fillStyle='#5AE68A';
    ctx.fillText('بعد',eachW+gap+eachW/2,headerH+28);
    // الصور (centered vertically)
    const beforeY=headerH+labelH+Math.floor((imgH-beforeH)/2);
    const afterY=headerH+labelH+Math.floor((imgH-afterH)/2);
    ctx.drawImage(beforeImg,0,beforeY,eachW,beforeH);
    ctx.drawImage(afterImg,eachW+gap,afterY,eachW,afterH);
    // Footer: تواريخ + أوزان
    const footY=headerH+labelH+imgH+30;
    ctx.font='16px sans-serif';
    ctx.fillStyle='#DEE0E6';
    ctx.fillText(`${before.date}${before.weight?' · '+before.weight+' كجم':''}`,eachW/2,footY);
    ctx.fillText(`${after.date}${after.weight?' · '+after.weight+' كجم':''}`,eachW+gap+eachW/2,footY);
    // فرق الوزن (لو موجود)
    if(before.weight!=null && after.weight!=null){
      const d=Math.round((after.weight-before.weight)*10)/10;
      const sign=d>0?'+':'';
      ctx.font='bold 18px sans-serif';
      ctx.fillStyle=d>0?'#5AE68A':(d<0?'#FF5A5F':'#9CA4B5');
      ctx.fillText(`فرق الوزن: ${sign}${d} كجم`,W/2,footY+30);
    }
    // التصدير
    canvas.toBlob(b=>{
      if(!b){showToast('⚠️ فشل توليد الصورة','var(--red)');return}
      const url=URL.createObjectURL(b);
      const a=document.createElement('a');
      a.href=url;
      a.download=`bulkmode_compare_${before.date}_vs_${after.date}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('✓ تم تحميل صورة المقارنة','var(--grn)');
    },'image/jpeg',0.9);
  }catch(e){
    console.error('Compare export failed:',e);
    showToast('⚠️ فشل التصدير: '+e.message,'var(--red)');
  }
}
