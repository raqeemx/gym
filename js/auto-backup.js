/* ============================================================
 * BULK MODE — Auto Backup (3.13)
 * ============================================================
 * يستخدم File System Access API لكتابة نسخ احتياطية تلقائية إلى
 * مجلد اختاره المستخدم — يعمل على Chromium-based فقط
 * (Chrome / Edge / Opera على الديسكتوب وأندرويد).
 *
 * ⚠️ غير مدعوم على iOS Safari و Firefox — في هذه الحالة تظهر للمستخدم
 * رسالة توضّح أن الميزة غير متاحة، مع تذكيره بالتصدير اليدوي الدوري.
 *
 * بعد ربط مجلد:
 *  - يُحفظ FileSystemDirectoryHandle في IndexedDB (settings)
 *  - بعد كل endSession يُكتب ملف JSON بتاريخ اليوم
 *  - رابط الإلغاء يحذف الـ handle ولا يحذف الملفات
 * ============================================================ */

function isAutoBackupSupported(){
  return typeof window!=='undefined'
    && typeof window.showDirectoryPicker==='function'
    && typeof indexedDB!=='undefined';
}

async function getAutoBackupHandle(){
  if(typeof db==='undefined' || !db.get) return null;
  try{
    const rec=await db.get('settings',KEYS.AUTOBACKUP_HANDLE);
    return rec && rec.value ? rec.value : null;
  }catch(e){return null}
}

async function setAutoBackupHandle(handle){
  await db.put('settings',{key:KEYS.AUTOBACKUP_HANDLE,value:handle});
}

async function clearAutoBackupHandle(){
  try{await db.delete('settings',KEYS.AUTOBACKUP_HANDLE)}catch(e){}
}

async function getAutoBackupPrefs(){
  try{
    const rec=await db.get('settings',KEYS.AUTOBACKUP_PREFS);
    return (rec && rec.value) || {enabled:false,lastBackupAt:null,folderName:null,lastFileName:null};
  }catch(e){return {enabled:false,lastBackupAt:null,folderName:null,lastFileName:null}}
}

async function setAutoBackupPrefs(p){
  await db.put('settings',{key:KEYS.AUTOBACKUP_PREFS,value:p});
}

// يطلب صلاحية الكتابة على الـ handle (قد يحتاج user gesture في أوّل مرة بعد إعادة فتح التطبيق)
async function ensureWritePermission(handle,interactive){
  if(!handle||typeof handle.queryPermission!=='function') return false;
  const opts={mode:'readwrite'};
  const cur=await handle.queryPermission(opts);
  if(cur==='granted') return true;
  if(!interactive) return false;
  const req=await handle.requestPermission(opts);
  return req==='granted';
}

// يفتح dialog لاختيار مجلد، ويحفظ الـ handle
async function pickAutoBackupFolder(){
  if(!isAutoBackupSupported()){
    showToast('⚠️ هذه الميزة غير مدعومة في متصفّحك (جرّب Chrome/Edge)','var(--red)',4500);
    return false;
  }
  try{
    const handle=await window.showDirectoryPicker({mode:'readwrite',startIn:'documents'});
    // اختبار الصلاحية فوراً
    const ok=await ensureWritePermission(handle,true);
    if(!ok){
      showToast('⚠️ يحتاج صلاحية الكتابة لتفعيل النسخ التلقائي','var(--org)',4000);
      return false;
    }
    await setAutoBackupHandle(handle);
    const prefs=await getAutoBackupPrefs();
    prefs.enabled=true;
    prefs.folderName=handle.name||'مجلد محدّد';
    prefs.lastBackupAt=null;
    prefs.lastFileName=null;
    await setAutoBackupPrefs(prefs);
    showToast(`✅ تم الربط بمجلد "${prefs.folderName}" — أوّل نسخ بعد الجلسة القادمة`,'var(--grn)',4500);
    if(typeof refreshAutoBackupUI==='function') refreshAutoBackupUI();
    // اعمل نسخة فوراً كاختبار
    await runAutoBackup(true);
    return true;
  }catch(e){
    if(e && e.name==='AbortError') return false; // المستخدم ألغى الـ picker
    console.warn('pickAutoBackupFolder failed:',e);
    showToast('⚠️ تعذّر ربط المجلد: '+(e.message||e),'var(--red)',4500);
    return false;
  }
}

async function unlinkAutoBackupFolder(){
  if(!confirm('إلغاء ربط المجلد؟ لن يتم حذف أي ملف سابق — فقط ستتوقف النسخ التلقائية.')) return;
  await clearAutoBackupHandle();
  const prefs=await getAutoBackupPrefs();
  prefs.enabled=false;
  prefs.folderName=null;
  await setAutoBackupPrefs(prefs);
  showToast('🔌 تم إلغاء الربط — لن تُكتب نسخ تلقائية بعد الآن','var(--blue)');
  if(typeof refreshAutoBackupUI==='function') refreshAutoBackupUI();
}

// يبني JSON النسخة الاحتياطية (نفس بيانات exportData لكن بدون تحميل ملف)
async function buildBackupDump(){
  const dump={
    version:(typeof APP_VERSION!=='undefined'?APP_VERSION:'unknown'),
    exportedAt:new Date().toISOString(),
    source:'auto-backup',
    workouts:await db.getAll('workouts'),
    sets:await db.getAll('sets'),
    exercises:await db.getAll('exercises'),
    bodyMetrics:await db.getAll('bodyMetrics'),
    dailyLog:await db.getAll('dailyLog'),
    prs:await db.getAll('prs'),
    settings:(await db.getAll('settings')).filter(s=>!(s.key||'').includes('autobackup_handle'))
    // ملاحظة: handle المجلد ذاته لا يُضمَّن (غير قابل للترميز عند الاستيراد على متصفّح آخر)
  };
  return dump;
}

// يكتب نسخة احتياطية إلى المجلد المرتبط (يستدعى تلقائياً بعد endSession)
async function runAutoBackup(silent){
  if(!isAutoBackupSupported()) return false;
  const handle=await getAutoBackupHandle();
  if(!handle) return false;
  try{
    const ok=await ensureWritePermission(handle,false);
    if(!ok){
      // لا يمكن الطلب بدون user gesture — نُسجّل الفشل ونحاول لاحقاً
      console.warn('Auto-backup: permission not granted (needs user gesture to re-grant).');
      return false;
    }
    const dump=await buildBackupDump();
    const dateStr=new Date().toISOString().split('T')[0];
    const fileName=`bulkmode_autobackup_${dateStr}.json`;
    const fileHandle=await handle.getFileHandle(fileName,{create:true});
    const writable=await fileHandle.createWritable();
    await writable.write(JSON.stringify(dump,null,2));
    await writable.close();
    const prefs=await getAutoBackupPrefs();
    prefs.enabled=true;
    prefs.lastBackupAt=new Date().toISOString();
    prefs.lastFileName=fileName;
    if(!prefs.folderName) prefs.folderName=handle.name||'مجلد';
    await setAutoBackupPrefs(prefs);
    if(!silent && typeof showToast==='function'){
      showToast(`💾 نسخة احتياطية محفوظة في "${prefs.folderName}"`,'var(--grn)',3500);
    }
    if(typeof refreshAutoBackupUI==='function') refreshAutoBackupUI();
    return true;
  }catch(e){
    console.warn('runAutoBackup failed:',e);
    if(!silent && typeof showToast==='function'){
      showToast('⚠️ فشل النسخ التلقائي: '+(e.message||e),'var(--red)',4500);
    }
    return false;
  }
}

// واجهة المستخدم داخل modal الـ profile — تُستدعى عند openProfile
async function refreshAutoBackupUI(){
  const wrap=document.getElementById('autobackupBody');
  if(!wrap) return;
  if(!isAutoBackupSupported()){
    wrap.innerHTML=`
      <div class="ab-unsupported">
        <div class="ab-icon">📵</div>
        <div class="ab-text">
          <b>غير مدعوم في هذا المتصفّح</b><br>
          النسخ التلقائي يحتاج <b>Chrome / Edge / Opera</b> على ديسكتوب أو أندرويد.
          <small>iOS Safari و Firefox لا يدعمان حالياً File System Access API.</small><br>
          استمرّ في <b>التصدير اليدوي</b> الدوري من قائمة 📊 لحماية بياناتك.
        </div>
      </div>`;
    return;
  }
  const prefs=await getAutoBackupPrefs();
  const handle=await getAutoBackupHandle();
  if(!handle || !prefs.enabled){
    wrap.innerHTML=`
      <div class="ab-hint">اربط مجلداً على جهازك — بعد كل جلسة تنتهي، ستُكتب نسخة JSON تلقائياً بدون أي ضغطة.</div>
      <button class="bm-save ab-link" type="button" onclick="pickAutoBackupFolder()">🔗 اربط مجلداً للنسخ التلقائي</button>
    `;
    return;
  }
  const lastTxt=prefs.lastBackupAt?fmtBackupDate(prefs.lastBackupAt):'لم يُكتب بعد';
  const lastFile=prefs.lastFileName?`<small class="ab-file">آخر ملف: ${escAttrAB(prefs.lastFileName)}</small>`:'';
  wrap.innerHTML=`
    <div class="ab-status">
      <div class="ab-row"><span class="ab-lbl">المجلد:</span> <b>${escAttrAB(prefs.folderName||'—')}</b></div>
      <div class="ab-row"><span class="ab-lbl">آخر نسخة:</span> <b>${lastTxt}</b></div>
      ${lastFile}
    </div>
    <div class="ab-actions">
      <button class="ab-test" type="button" onclick="runAutoBackup(false)">💾 شغّل نسخة الآن</button>
      <button class="ab-unlink" type="button" onclick="unlinkAutoBackupFolder()">🔌 إلغاء الربط</button>
    </div>
  `;
}

function fmtBackupDate(iso){
  try{
    const d=new Date(iso);
    const t=d.toLocaleString('ar-SA',{year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
    return t;
  }catch(e){return iso}
}

function escAttrAB(s){return String(s==null?'':s).replace(/"/g,'&quot;').replace(/</g,'&lt;')}
