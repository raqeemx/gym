/* ============================================
   BULK MODE — منطق التطبيق الرئيسي
   ============================================ */

// ====== أدوات مساعدة ======
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const uid = () => 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);

const ARABIC_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function fmtDate(ts){
  const d = new Date(ts);
  return `${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]}`;
}
function fmtDateFull(ts){
  const d = new Date(ts);
  return `${WEEKDAY_NAMES[d.getDay()]}، ${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function fmtTime(ts){
  const d = new Date(ts);
  return d.toLocaleTimeString('ar-SA-u-nu-latn', {hour:'2-digit', minute:'2-digit', hour12:false}).replace(/[٠-٩]/g, ch => '0123456789'[ch.charCodeAt(0)-1632]);
}
function fmtDuration(sec){
  if (!sec || sec < 0) return '00:00';
  const m = Math.floor(sec/60);
  const s = sec%60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function fmtDurationLong(sec){
  if (!sec) return '0 د';
  const m = Math.floor(sec/60);
  if (m < 60) return `${m} د`;
  const h = Math.floor(m/60); const mm = m%60;
  return `${h}س ${mm}د`;
}

function vibrate(pattern){
  if (Store.getSettings().vibrationOn && navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch(e){}
  }
}

function beep(freq=880, dur=120){
  if (!Store.getSettings().soundOn) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur/1000);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + dur/1000 + .02);
    setTimeout(() => ctx.close(), dur + 100);
  } catch(e){}
}

function toast(msg){
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2200);
}

// ====== الراوتر ======
const Router = {
  current: 'home',
  params: {},
  go(view, params={}){
    this.current = view;
    this.params = params;
    $$('.view').forEach(v => v.classList.remove('active'));
    $('#view-' + view).classList.add('active');
    window.scrollTo(0, 0);

    // إظهار/إخفاء زر الرجوع
    $('#backBtn').style.display = (view === 'home') ? 'none' : 'flex';

    // تحديث BottomNav
    $$('.bn-btn').forEach(b => b.classList.remove('active'));
    if (view === 'home') $('.bn-btn[data-nav="home"]').classList.add('active');
    else if (view === 'history' || view === 'session-detail') $('.bn-btn[data-nav="history"]').classList.add('active');
    else if (view === 'day' || view === 'session') $('.bn-btn[data-nav="today"]').classList.add('active');

    // تنفيذ المعالج
    if (this.handlers[view]) this.handlers[view](params);
  },
  back(){
    if (this.current === 'home') return;
    if (this.current === 'session') {
      // محمي بـ confirm
      confirmModal('إيقاف الجلسة؟', 'سيُحفظ التقدم الحالي تلقائياً ويمكنك العودة لاحقاً.', () => {
        this.go('home');
      });
      return;
    }
    if (this.current === 'session-detail') return this.go('history');
    if (this.current === 'day') return this.go('home');
    this.go('home');
  },
  handlers: {}
};

// ====== Modal & Confirm ======
function confirmModal(title, text, onOk, okLabel='تأكيد', cancelLabel='إلغاء'){
  $('#modalTitle').textContent = title;
  $('#modalText').textContent = text;
  $('#modalOk').textContent = okLabel;
  $('#modalCancel').textContent = cancelLabel;
  $('#modal').classList.add('active');
  const ok = $('#modalOk'), cancel = $('#modalCancel');
  const close = () => $('#modal').classList.remove('active');
  ok.onclick = () => { close(); onOk && onOk(); };
  cancel.onclick = close;
}
function alertModal(title, text){
  $('#modalTitle').textContent = title;
  $('#modalText').textContent = text;
  $('#modalOk').textContent = 'حسناً';
  $('#modalActions').classList.add('single');
  $('#modalCancel').style.display = 'none';
  $('#modal').classList.add('active');
  $('#modalOk').onclick = () => {
    $('#modal').classList.remove('active');
    $('#modalActions').classList.remove('single');
    $('#modalCancel').style.display = '';
  };
}

// ====== HOME VIEW ======
Router.handlers.home = () => {
  $('#brandSub').textContent = 'مدرّبك الشخصي للتضخيم';
  renderHero();
  renderTodayBlock();
  renderActiveBlock();
  renderDaysList();
  renderRecentList();
};

function renderHero(){
  const stats = Store.getStats();
  const el = $('#heroStats');
  el.innerHTML = `
    <div class="sp"><span class="n">${stats.totalSessions}</span><span class="l">جلسة</span></div>
    <div class="sp"><span class="n">${stats.last7}</span><span class="l">هذا الأسبوع</span></div>
    <div class="sp"><span class="n">${fmtDurationLong(stats.totalSeconds)}</span><span class="l">مدة كلية</span></div>
  `;
}

function renderTodayBlock(){
  const today = getTodayProgramDay();
  const todaySessions = Store.getSessionsByDay(today.id).filter(s => {
    const d = new Date(s.startedAt); const t = new Date();
    return d.toDateString() === t.toDateString();
  });
  const doneToday = todaySessions.length > 0;

  const isRest = today.type === 'rest';
  let actionHTML;
  if (isRest) {
    actionHTML = `<button class="btn-ghost" onclick="Router.go('day',{id:'${today.id}'})">عرض تفاصيل اليوم</button>`;
  } else if (doneToday) {
    const s = todaySessions[0];
    actionHTML = `
      <div class="btn-row" style="margin-bottom:0">
        <button class="btn-ghost" onclick="Router.go('day',{id:'${today.id}'})">عرض البرنامج</button>
        <button class="btn-primary" onclick="Router.go('session-detail',{id:'${s.id}'})">جلسة اليوم ✓</button>
      </div>`;
  } else {
    actionHTML = `
      <div class="btn-row" style="margin-bottom:0">
        <button class="btn-ghost" onclick="Router.go('day',{id:'${today.id}'})">التفاصيل</button>
        <button class="btn-primary" onclick="startSession('${today.id}')">ابدأ التمرين 💪</button>
      </div>`;
  }

  $('#todayBlock').innerHTML = `
    <div class="today-card fu">
      <div class="tc-label"><span class="dot"></span>تمرين اليوم • ${today.label}</div>
      <div class="tc-day">${today.title}</div>
      <div class="tc-muscle">${today.muscles}</div>
      <div class="tc-meta">
        <div class="tc-meta-item">⏱ <b>${today.duration}</b></div>
        ${!isRest ? `<div class="tc-meta-item">💪 <b>${today.exercises.length}</b> تمرين</div>` : ''}
        ${doneToday ? `<div class="tc-meta-item">✓ <b style="color:var(--grn)">تم اليوم</b></div>` : ''}
      </div>
      ${actionHTML}
    </div>
  `;
}

function renderActiveBlock(){
  const active = Store.getActiveSession();
  const block = $('#activeBlock');
  if (!active) { block.innerHTML = ''; return; }
  const day = DAY_BY_ID[active.dayId];
  block.innerHTML = `
    <div class="today-card fu" style="border-color:rgba(90,230,138,.3)">
      <div class="tc-label" style="color:var(--grn)"><span class="dot" style="background:var(--grn)"></span>جلسة جارية</div>
      <div class="tc-day">${day ? day.title : 'تمرين'}</div>
      <div class="tc-muscle">بدأت ${fmtTime(active.startedAt)} • ${fmtDate(active.startedAt)}</div>
      <button class="btn-primary" onclick="resumeSession()" style="background:linear-gradient(135deg,var(--grn),#3ECC72);box-shadow:0 8px 24px rgba(90,230,138,.25)">متابعة الجلسة ⏵</button>
    </div>
  `;
}

function renderDaysList(){
  const today = getTodayProgramDay();
  const html = PROGRAM.days.map(d => {
    const sessions = Store.getSessionsByDay(d.id);
    const last = sessions[0];
    const isToday = d.id === today.id;
    return `
      <div class="day-card ${isToday ? 'is-today' : ''}" onclick="Router.go('day',{id:'${d.id}'})">
        <div class="dc-row">
          <div class="dc-badge ${d.type}"><span class="num">${d.shortLabel}</span></div>
          <div class="dc-info">
            <div class="dc-title">${d.title}</div>
            <div class="dc-sub">${d.muscles}</div>
          </div>
          <span class="dc-tag tag-${d.type}">${d.tag}</span>
        </div>
        ${d.type !== 'rest' ? `
          <div class="dc-stats">
            <span class="dc-stat">💪 <b>${d.exercises.length}</b> تمرين</span>
            <span class="dc-stat">📊 <b>${sessions.length}</b> جلسة</span>
            ${last ? `<span class="dc-stat">آخر: <b>${fmtDate(last.startedAt)}</b></span>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
  $('#daysList').innerHTML = html;
}

function renderRecentList(){
  const sessions = Store.getSessions().slice(0, 4);
  const block = $('#recentList');
  if (sessions.length === 0){
    block.innerHTML = `
      <div class="empty-state">
        <div class="ico">📋</div>
        <div class="ttl">لا توجد جلسات بعد</div>
        <div class="sub">ابدأ تمرينك الأول وستظهر هنا</div>
      </div>`;
    return;
  }
  block.innerHTML = sessions.map(s => renderHistItem(s)).join('') +
    (Store.getSessions().length > 4 ? `<button class="btn-ghost mt-12" onclick="Router.go('history')">عرض كل السجل ←</button>` : '');
}

function renderHistItem(s){
  const day = DAY_BY_ID[s.dayId];
  const d = new Date(s.startedAt);
  const totalSets = (s.exercises||[]).reduce((a,ex) => a + (ex.sets||[]).filter(x=>x.done).length, 0);
  const vol = Store.totalVolume(s);
  return `
    <div class="hist-item" onclick="Router.go('session-detail',{id:'${s.id}'})">
      <div class="hist-date">
        <div class="d">${d.getDate()}</div>
        <div class="m">${ARABIC_MONTHS[d.getMonth()].slice(0,3)}</div>
      </div>
      <div class="hist-info">
        <div class="hist-title">${day ? day.title : 'تمرين'}</div>
        <div class="hist-meta">
          <b>${totalSets}</b> سيت •
          <b>${fmtDurationLong(s.durationSec)}</b> •
          <b>${vol.toLocaleString('en-US')}</b> كجم
        </div>
      </div>
      <span class="hist-arrow">‹</span>
    </div>
  `;
}

// ====== DAY DETAIL ======
Router.handlers.day = ({id}) => {
  const day = DAY_BY_ID[id];
  if (!day) return Router.go('home');
  $('#brandSub').textContent = day.title;

  const sessions = Store.getSessionsByDay(id);
  const isRest = day.type === 'rest';

  let mainAction = '';
  if (!isRest){
    mainAction = `<button class="btn-primary mt-12" onclick="startSession('${day.id}')">ابدأ هذا التمرين 💪</button>`;
  }

  const exercisesHTML = day.exercises.map((ex, i) => {
    const best = Store.getBestForExercise(ex.id);
    return `
      <div class="exercise-item">
        <div class="ex-num">${i+1}</div>
        <div class="ex-info">
          <div class="ex-name">${ex.name}</div>
          <div class="ex-note">${ex.note}</div>
          ${best ? `<div class="ex-rest">🏆 أفضل: <b style="color:var(--g2)">${best.weight} كجم × ${best.reps}</b></div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-start;gap:4px">
          <span class="ex-sets">${ex.sets} × ${ex.reps}</span>
          <span class="ex-rest">راحة ${ex.rest}ث</span>
        </div>
      </div>
    `;
  }).join('');

  const restHTML = isRest ? `
    <div class="detail-card">
      <div style="font-size:13px;color:var(--tx2);line-height:1.9">
        <strong style="color:var(--g2)">يوم راحة — مو يوم كسل!</strong><br><br>
        • تمشية خفيفة 20-30 دقيقة (تنشّط الدورة الدموية وتسرّع التعافي)<br>
        • تمدد 10-15 دقيقة للعضلات المتعبة<br>
        • <b style="color:#fff">كل وجباتك كاملة</b> — العضل يُبنى يوم الراحة<br>
        • نام مبكر — حاول 8 ساعات<br>
        • ممنوع تتمرن «بس شوي» — الراحة الكاملة جزء من البرنامج
      </div>
    </div>` : '';

  const recent = sessions.slice(0, 5);
  const recentHTML = recent.length ? `
    <div class="section-title"><h2>آخر ${recent.length} جلسات</h2><span class="line"></span></div>
    ${recent.map(renderHistItem).join('')}
  ` : '';

  $('#dayDetail').innerHTML = `
    <div class="dd-hero">
      <span class="dc-tag tag-${day.type} dd-tag">${day.tag}</span>
      <div class="dd-title">${day.title}</div>
      <div class="dd-muscles">${day.muscles}</div>
      <div class="dd-desc">${day.desc}</div>
      <div class="dd-meta">
        <div class="tc-meta-item">⏱ <b>${day.duration}</b></div>
        ${!isRest ? `<div class="tc-meta-item">💪 <b>${day.exercises.length}</b> تمرين</div>` : ''}
        <div class="tc-meta-item">📊 <b>${sessions.length}</b> جلسة سابقة</div>
      </div>
      ${mainAction}
    </div>
    ${restHTML}
    ${exercisesHTML ? `<div class="section-title"><h2>التمارين</h2><span class="line"></span></div><div class="exercises-list">${exercisesHTML}</div>` : ''}
    ${recentHTML}
  `;
};

// ====== SESSION (الجلسة الحية) ======
let sessionTimer = null;
let restTimer = null;
let restRemaining = 0;
let restTotal = 0;

function startSession(dayId){
  const active = Store.getActiveSession();
  if (active && active.dayId !== dayId){
    confirmModal('هناك جلسة جارية', 'يوجد جلسة لم تنتهِ بعد. هل تريد إنهاءها وبدء جلسة جديدة؟', () => {
      finishSession(true); // حفظ كنهاية تلقائية
      _createAndStartSession(dayId);
    }, 'إنهاء وبدء جديدة', 'متابعة القديمة');
    return;
  }
  if (active && active.dayId === dayId){
    return resumeSession();
  }
  _createAndStartSession(dayId);
}

function _createAndStartSession(dayId){
  const day = DAY_BY_ID[dayId];
  if (!day || day.type === 'rest') return;
  const session = {
    id: uid(),
    dayId: day.id,
    dayTitle: day.title,
    dayType: day.type,
    startedAt: Date.now(),
    finishedAt: null,
    durationSec: 0,
    notes: '',
    currentExerciseIdx: 0,
    exercises: day.exercises.map(ex => {
      const last = Store.getLastSetsForExercise(ex.id);
      return {
        exerciseId: ex.id,
        name: ex.name,
        targetSets: ex.sets,
        targetReps: ex.reps,
        targetRest: ex.rest,
        sets: Array.from({length: ex.sets}, (_, i) => ({
          weight: last && last.sets[i] ? last.sets[i].weight : '',
          reps: last && last.sets[i] ? last.sets[i].reps : '',
          done: false
        }))
      };
    })
  };
  Store.setActiveSession(session);
  Router.go('session');
}

function resumeSession(){ Router.go('session'); }

Router.handlers.session = () => {
  const session = Store.getActiveSession();
  if (!session) return Router.go('home');
  $('#brandSub').textContent = 'جلسة جارية';

  renderSession();
  startSessionTimer();
};

function startSessionTimer(){
  stopSessionTimer();
  const update = () => {
    const s = Store.getActiveSession();
    if (!s) return stopSessionTimer();
    const sec = Math.floor((Date.now() - s.startedAt) / 1000);
    s.durationSec = sec;
    $('#sbTime').textContent = fmtDuration(sec);
  };
  update();
  sessionTimer = setInterval(update, 1000);
}
function stopSessionTimer(){
  if (sessionTimer) { clearInterval(sessionTimer); sessionTimer = null; }
}

function renderSession(){
  const s = Store.getActiveSession();
  if (!s) return;

  const totalSets = s.exercises.reduce((a,ex) => a + ex.sets.length, 0);
  const doneSets = s.exercises.reduce((a,ex) => a + ex.sets.filter(x=>x.done).length, 0);
  $('#sbCount').textContent = `${doneSets}/${totalSets}`;
  $('#sbProgress').style.width = totalSets ? `${(doneSets/totalSets)*100}%` : '0%';

  const html = s.exercises.map((ex, exIdx) => {
    const programEx = EXERCISE_BY_ID[ex.exerciseId] || {};
    const last = Store.getLastSetsForExercise(ex.exerciseId);
    const best = Store.getBestForExercise(ex.exerciseId);
    const allDone = ex.sets.every(x => x.done);
    const isCurrent = !allDone && s.exercises.slice(0, exIdx).every(e => e.sets.every(x => x.done));

    let lastHint = '';
    if (last) {
      const summary = last.sets.filter(x => x.done).map(x => `${x.weight}×${x.reps}`).join(' • ');
      if (summary) lastHint = `<div class="last-session-hint">📅 آخر مرة (${fmtDate(last.date)}): <b>${summary}</b></div>`;
    } else if (best) {
      lastHint = `<div class="last-session-hint">🏆 أفضل: <b>${best.weight} كجم × ${best.reps}</b></div>`;
    }

    return `
      <div class="session-ex ${isCurrent ? 'is-current' : ''} ${allDone ? 'is-done' : ''}" id="sex-${exIdx}">
        <div class="se-head">
          <div class="ex-num">${exIdx+1}</div>
          <div class="ex-info">
            <div class="ex-name">${ex.name}</div>
            ${programEx.note ? `<div class="ex-note">${programEx.note}</div>` : ''}
            <div class="se-target">الهدف: ${ex.targetSets} × ${ex.targetReps} • راحة ${ex.targetRest}ث</div>
          </div>
        </div>
        ${lastHint}
        <table class="sets-table">
          <thead>
            <tr>
              <th style="width:40px">#</th>
              <th>الوزن (كجم)</th>
              <th>التكرار</th>
              <th style="width:48px">✓</th>
            </tr>
          </thead>
          <tbody>
            ${ex.sets.map((set, setIdx) => `
              <tr class="set-row ${set.done ? 'done' : ''}" data-ex="${exIdx}" data-set="${setIdx}">
                <td><div class="set-num">${setIdx+1}</div></td>
                <td><input class="input-num" type="number" inputmode="decimal" step="0.5" min="0" placeholder="0"
                  value="${set.weight !== '' ? set.weight : ''}"
                  onchange="updateSet(${exIdx},${setIdx},'weight',this.value)"
                  onfocus="this.select()"></td>
                <td><input class="input-num" type="number" inputmode="numeric" step="1" min="0" placeholder="0"
                  value="${set.reps !== '' ? set.reps : ''}"
                  onchange="updateSet(${exIdx},${setIdx},'reps',this.value)"
                  onfocus="this.select()"></td>
                <td><button class="set-check" onclick="toggleSetDone(${exIdx},${setIdx})">${set.done ? '✓' : ''}</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <button class="add-set-btn" onclick="addSet(${exIdx})">+ إضافة سيت</button>
      </div>
    `;
  }).join('');

  $('#sessionContent').innerHTML = `
    ${html}
    <div class="notes-card">
      <label>ملاحظات الجلسة</label>
      <textarea class="notes-input" id="sessionNotes" placeholder="كيف كان الأداء؟ أي ألم؟ ملاحظات للمرة القادمة..."
        onchange="updateNotes(this.value)">${s.notes || ''}</textarea>
    </div>
    <div class="session-actions">
      <button class="btn-ghost" onclick="cancelSession()">إلغاء</button>
      <button class="btn-primary" onclick="finishSession()">إنهاء الجلسة ✓</button>
    </div>
  `;
}

window.updateSet = (exIdx, setIdx, field, value) => {
  const s = Store.getActiveSession();
  if (!s) return;
  s.exercises[exIdx].sets[setIdx][field] = value === '' ? '' : (field === 'weight' ? parseFloat(value) : parseInt(value));
  Store.setActiveSession(s);
};

window.toggleSetDone = (exIdx, setIdx) => {
  const s = Store.getActiveSession();
  if (!s) return;
  const set = s.exercises[exIdx].sets[setIdx];
  set.done = !set.done;

  if (set.done) {
    // لو لم يدخل قيمة، انسخ من الإفتراضي
    if (set.weight === '' || set.weight == null) set.weight = 0;
    if (set.reps === '' || set.reps == null) {
      // محاولة استخراج رقم من targetReps "8-10"
      const target = s.exercises[exIdx].targetReps;
      const m = String(target).match(/\d+/);
      set.reps = m ? parseInt(m[0]) : 0;
    }
    vibrate(40);
    beep(880, 100);
    // ابدأ مؤقت الراحة
    startRest(s.exercises[exIdx].targetRest || 90);
  }
  Store.setActiveSession(s);
  renderSession();
};

window.addSet = (exIdx) => {
  const s = Store.getActiveSession();
  if (!s) return;
  const ex = s.exercises[exIdx];
  const lastSet = ex.sets[ex.sets.length - 1];
  ex.sets.push({
    weight: lastSet ? lastSet.weight : '',
    reps: lastSet ? lastSet.reps : '',
    done: false
  });
  Store.setActiveSession(s);
  renderSession();
};

window.updateNotes = (val) => {
  const s = Store.getActiveSession();
  if (!s) return;
  s.notes = val;
  Store.setActiveSession(s);
};

window.cancelSession = () => {
  confirmModal('إلغاء الجلسة؟', 'سيتم حذف كل ما سجلته في هذه الجلسة. هل أنت متأكد؟', () => {
    stopSessionTimer();
    stopRest();
    Store.clearActiveSession();
    Router.go('home');
    toast('تم الإلغاء');
  }, 'حذف', 'تراجع');
};

window.finishSession = (silent=false) => {
  const s = Store.getActiveSession();
  if (!s) return;
  const doneSets = s.exercises.reduce((a,ex) => a + ex.sets.filter(x=>x.done).length, 0);
  if (doneSets === 0 && !silent){
    return alertModal('لم تسجّل أي سيت', 'سجّل سيت واحد على الأقل قبل إنهاء الجلسة، أو ألغها.');
  }
  const finalize = () => {
    s.finishedAt = Date.now();
    s.durationSec = Math.floor((s.finishedAt - s.startedAt)/1000);
    delete s.currentExerciseIdx;
    Store.saveSession(s);
    Store.clearActiveSession();
    stopSessionTimer();
    stopRest();
    if (!silent) {
      toast('تم الحفظ ✓');
      Router.go('session-detail', { id: s.id });
    }
  };
  if (silent) return finalize();
  confirmModal('إنهاء الجلسة؟', `سجّلت ${doneSets} سيت في ${fmtDurationLong(s.durationSec)}. حفظ الجلسة وعرض ملخصها؟`, finalize, 'حفظ', 'متابعة');
};

// ====== REST TIMER ======
function startRest(seconds){
  restTotal = seconds;
  restRemaining = seconds;
  $('#restTarget').textContent = `${seconds} ثانية`;
  $('#restTime').textContent = seconds;
  $('#restOverlay').classList.add('active');
  $$('.rest-quick[data-rest]').forEach(b => b.classList.toggle('active', parseInt(b.dataset.rest) === seconds));

  if (restTimer) clearInterval(restTimer);
  restTimer = setInterval(() => {
    restRemaining--;
    if (restRemaining <= 0){
      stopRest();
      vibrate([100,80,100,80,200]);
      beep(660, 200);
      setTimeout(() => beep(880, 280), 220);
      toast('انتهت الراحة! ابدأ السيت التالي 💪');
    } else {
      $('#restTime').textContent = restRemaining;
      if (restRemaining <= 5) beep(440, 80);
    }
  }, 1000);
}
function stopRest(){
  if (restTimer) clearInterval(restTimer);
  restTimer = null;
  restRemaining = 0;
  $('#restOverlay').classList.remove('active');
}

// ====== HISTORY VIEW ======
Router.handlers.history = () => {
  $('#brandSub').textContent = 'السجل والتقدم';
  renderHistoryTab();
  renderStatsTab();
};

function renderHistoryTab(){
  const sessions = Store.getSessions();
  if (sessions.length === 0){
    $('#tabHistory').innerHTML = `
      <div class="empty-state">
        <div class="ico">📊</div>
        <div class="ttl">سجل التمارين فارغ</div>
        <div class="sub">ابدأ تمرينك الأول وستظهر جلساتك هنا</div>
      </div>`;
    return;
  }

  // تجميع بحسب الشهر
  const groups = {};
  sessions.forEach(s => {
    const d = new Date(s.startedAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = `${ARABIC_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    if (!groups[key]) groups[key] = { label, items: [] };
    groups[key].items.push(s);
  });

  $('#tabHistory').innerHTML = Object.values(groups).map(g => `
    <div class="section-title"><h2>${g.label}</h2><span class="line"></span></div>
    ${g.items.map(renderHistItem).join('')}
  `).join('');
}

function renderStatsTab(){
  const stats = Store.getStats();
  const total = (stats.byType.push + stats.byType.pull + stats.byType.legs) || 1;

  // أفضل أداء (أعلى وزن في كل من 3 تمارين رئيسية)
  const keyExercises = ['pa1','la1','gA1']; // Chest Press, Lat, Leg Press
  const personalBests = keyExercises.map(id => {
    const ex = EXERCISE_BY_ID[id];
    if (!ex) return null;
    const best = Store.getBestForExercise(id);
    return { ex, best };
  }).filter(x => x);

  const pbHTML = personalBests.map(({ex, best}) => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.04)">
      <div>
        <div style="font-weight:700;font-size:13px;color:#fff">${ex.name}</div>
        <div style="font-size:10.5px;color:var(--tx3)">${ex.dayTitle}</div>
      </div>
      <div style="text-align:left">
        ${best ? `<div style="font-family:'JetBrains Mono',monospace;font-size:15px;color:var(--g2);font-weight:700">${best.weight} كجم</div>
          <div style="font-size:10px;color:var(--tx3)">× ${best.reps} • ${fmtDate(best.date)}</div>`
          : `<div style="color:var(--tx3);font-size:11px">— لا توجد بيانات</div>`}
      </div>
    </div>
  `).join('');

  $('#tabStats').innerHTML = `
    <div class="stats-grid">
      <div class="stat-tile">
        <div class="stat-icon">🔥</div>
        <div class="stat-num gold">${stats.totalSessions}</div>
        <div class="stat-label">جلسة كلية</div>
      </div>
      <div class="stat-tile">
        <div class="stat-icon">📅</div>
        <div class="stat-num grn">${stats.last7}</div>
        <div class="stat-label">هذا الأسبوع</div>
      </div>
      <div class="stat-tile">
        <div class="stat-icon">💪</div>
        <div class="stat-num blue">${stats.totalSets}</div>
        <div class="stat-label">سيت كامل</div>
      </div>
      <div class="stat-tile">
        <div class="stat-icon">🏋️</div>
        <div class="stat-num red">${stats.totalVolume.toLocaleString('en-US')}</div>
        <div class="stat-label">كجم مرفوع</div>
      </div>
      <div class="stat-tile">
        <div class="stat-icon">⏱️</div>
        <div class="stat-num">${fmtDurationLong(stats.totalSeconds)}</div>
        <div class="stat-label">ساعات تمرين</div>
      </div>
      <div class="stat-tile">
        <div class="stat-icon">⚡</div>
        <div class="stat-num gold">${stats.streak}</div>
        <div class="stat-label">سلسلة (يوم)</div>
      </div>
    </div>

    <div class="split-card">
      <div class="split-title">توزيع التمارين</div>
      <div class="split-bars">
        <div class="split-bar">
          <span class="lbl" style="color:var(--red)">دفع</span>
          <div class="bar"><div class="fill push" style="width:${(stats.byType.push/total)*100}%"></div></div>
          <span class="num">${stats.byType.push}</span>
        </div>
        <div class="split-bar">
          <span class="lbl" style="color:var(--blue)">سحب</span>
          <div class="bar"><div class="fill pull" style="width:${(stats.byType.pull/total)*100}%"></div></div>
          <span class="num">${stats.byType.pull}</span>
        </div>
        <div class="split-bar">
          <span class="lbl" style="color:var(--grn)">أرجل</span>
          <div class="bar"><div class="fill legs" style="width:${(stats.byType.legs/total)*100}%"></div></div>
          <span class="num">${stats.byType.legs}</span>
        </div>
      </div>
    </div>

    <div class="split-card">
      <div class="split-title">🏆 أفضل أرقام شخصية</div>
      ${pbHTML}
    </div>

    <div class="split-card">
      <div class="split-title">إدارة البيانات</div>
      <div class="btn-row">
        <button class="btn-ghost" onclick="exportData()">📤 تصدير</button>
        <button class="btn-ghost" onclick="importData()">📥 استيراد</button>
      </div>
      <button class="btn-ghost" style="color:var(--red);border-color:rgba(255,90,95,.2)" onclick="resetData()">🗑️ حذف كل البيانات</button>
    </div>
  `;
}

window.exportData = () => {
  const json = Store.exportJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bulkmode-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('تم تصدير النسخة الاحتياطية');
};
window.importData = () => {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json';
  inp.onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (Store.importJSON(reader.result)){
        toast('تم استيراد البيانات ✓');
        Router.go('history');
      } else {
        alertModal('فشل الاستيراد', 'الملف غير صالح أو تالف.');
      }
    };
    reader.readAsText(f);
  };
  inp.click();
};
window.resetData = () => {
  confirmModal('حذف كل البيانات؟', 'سيتم حذف كل جلساتك وسجلك بشكل نهائي. لا يمكن التراجع.', () => {
    Store.resetAll();
    toast('تم الحذف');
    Router.go('home');
  }, 'حذف الكل', 'إلغاء');
};

// ====== SESSION DETAIL ======
Router.handlers['session-detail'] = ({id}) => {
  const s = Store.getSessionById(id);
  if (!s) return Router.go('history');
  const day = DAY_BY_ID[s.dayId];
  $('#brandSub').textContent = day ? day.title : 'تفاصيل الجلسة';

  const totalSets = s.exercises.reduce((a,ex) => a + ex.sets.filter(x=>x.done).length, 0);
  const vol = Store.totalVolume(s);

  // مقارنة بالجلسة السابقة لنفس اليوم
  const previous = Store.getSessionsByDay(s.dayId).find(p => p.startedAt < s.startedAt);
  const prevVol = previous ? Store.totalVolume(previous) : null;
  const volDiff = prevVol != null ? vol - prevVol : null;

  const exercisesHTML = s.exercises.map(ex => {
    const programEx = EXERCISE_BY_ID[ex.exerciseId] || {};
    // اجلب آخر جلسة سابقة لهذا التمرين قبل تاريخ هذه
    const prevForEx = Store.getLastSetsForExercise(ex.exerciseId, s.startedAt);
    const setsHTML = ex.sets.map((set, i) => {
      if (!set.done) return `<span class="detail-set empty">سيت ${i+1}: تخطّى</span>`;
      // مقارنة بسيت في الجلسة السابقة
      let cmp = '';
      if (prevForEx && prevForEx.sets[i] && prevForEx.sets[i].done){
        const prev = prevForEx.sets[i];
        const w = parseFloat(set.weight)||0, pw = parseFloat(prev.weight)||0;
        const r = parseInt(set.reps)||0, pr = parseInt(prev.reps)||0;
        if (w > pw) cmp = `<span class="compare-tag up">+${(w-pw).toFixed(1)}كجم</span>`;
        else if (w < pw) cmp = `<span class="compare-tag down">-${(pw-w).toFixed(1)}كجم</span>`;
        else if (r > pr) cmp = `<span class="compare-tag up">+${r-pr} تكرار</span>`;
        else if (r < pr) cmp = `<span class="compare-tag down">-${pr-r} تكرار</span>`;
        else cmp = `<span class="compare-tag same">=</span>`;
      }
      return `<span class="detail-set">${cmp}<b>${set.weight}</b> كجم × <b>${set.reps}</b></span>`;
    }).join('');
    return `
      <div class="detail-ex">
        <div class="detail-ex-name">${ex.name}</div>
        <div class="detail-sets">${setsHTML}</div>
      </div>
    `;
  }).join('');

  const compareHTML = volDiff != null ? `
    <div class="last-session-hint" style="background:${volDiff >= 0 ? 'rgba(90,230,138,.05)' : 'rgba(255,90,95,.05)'};border-color:${volDiff >= 0 ? 'rgba(90,230,138,.18)' : 'rgba(255,90,95,.18)'};color:${volDiff >= 0 ? 'var(--grn)' : 'var(--red)'}">
      ${volDiff >= 0 ? '📈' : '📉'} مقارنة بآخر جلسة (${fmtDate(previous.startedAt)}):
      <b>${volDiff >= 0 ? '+' : ''}${volDiff.toLocaleString('en-US')}</b> كجم
    </div>` : '';

  $('#sessionDetailContent').innerHTML = `
    <div class="dd-hero">
      <span class="dc-tag tag-${s.dayType} dd-tag">${day ? day.tag : ''}</span>
      <div class="dd-title">${s.dayTitle}</div>
      <div class="dd-muscles">${fmtDateFull(s.startedAt)}</div>
      <div class="dd-desc">⏰ ${fmtTime(s.startedAt)}${s.finishedAt ? ' — ' + fmtTime(s.finishedAt) : ''}</div>
      <div class="dd-meta">
        <div class="tc-meta-item">⏱ <b>${fmtDurationLong(s.durationSec)}</b></div>
        <div class="tc-meta-item">💪 <b>${totalSets}</b> سيت</div>
        <div class="tc-meta-item">🏋️ <b>${vol.toLocaleString('en-US')}</b> كجم</div>
      </div>
    </div>

    ${compareHTML}

    <div class="detail-card">
      ${exercisesHTML}
    </div>

    ${s.notes ? `
      <div class="notes-card">
        <label>ملاحظاتك</label>
        <div style="font-size:13.5px;color:var(--tx);line-height:1.8;white-space:pre-wrap">${s.notes}</div>
      </div>` : ''}

    <div class="btn-row mt-12">
      <button class="btn-ghost" onclick="deleteSession('${s.id}')" style="color:var(--red);border-color:rgba(255,90,95,.2)">🗑️ حذف</button>
      <button class="btn-primary" onclick="startSession('${s.dayId}')">🔁 كرر هذا اليوم</button>
    </div>
  `;
};

window.deleteSession = (id) => {
  confirmModal('حذف الجلسة؟', 'سيتم حذف هذه الجلسة بشكل نهائي.', () => {
    Store.deleteSession(id);
    toast('تم الحذف');
    Router.go('history');
  }, 'حذف', 'إلغاء');
};

// ====== EVENT BINDINGS ======
function bindGlobalEvents(){
  $('#backBtn').addEventListener('click', () => Router.back());
  $('#brandBtn').addEventListener('click', () => Router.go('home'));
  $('#menuBtn').addEventListener('click', () => {
    Router.go('history');
    setTimeout(() => switchTab('stats'), 50);
  });

  $$('.bn-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.nav;
      if (target === 'home') Router.go('home');
      else if (target === 'today') {
        const today = getTodayProgramDay();
        Router.go('day', { id: today.id });
      } else if (target === 'history') Router.go('history');
    });
  });

  // Tabs
  $$('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));

  // Rest timer controls
  $$('.rest-quick[data-rest]').forEach(b => {
    b.addEventListener('click', () => startRest(parseInt(b.dataset.rest)));
  });
  $('#restAdd15').addEventListener('click', () => {
    if (restTimer) startRest(restRemaining + 15);
  });
  $('#restSub15').addEventListener('click', () => {
    if (restTimer) startRest(Math.max(5, restRemaining - 15));
  });
  $('#restSkip').addEventListener('click', stopRest);

  // Modal close on backdrop click
  $('#modal').addEventListener('click', (e) => {
    if (e.target === $('#modal')) $('#modal').classList.remove('active');
  });

  // منع إغلاق الصفحة بالخطأ أثناء التمرين
  window.addEventListener('beforeunload', (e) => {
    if (Store.getActiveSession()){
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // Wake lock أثناء الجلسة (كي لا تنطفئ الشاشة)
  let wakeLock = null;
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && Store.getActiveSession() && 'wakeLock' in navigator){
      try { wakeLock = await navigator.wakeLock.request('screen'); } catch(e){}
    }
  });
}

function switchTab(name){
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  $('#tabHistory').style.display = name === 'history' ? '' : 'none';
  $('#tabStats').style.display = name === 'stats' ? '' : 'none';
}

// ====== INIT ======
document.addEventListener('DOMContentLoaded', () => {
  bindGlobalEvents();
  // إذا كان هناك جلسة جارية، نعرض الرئيسية مع زر المتابعة
  Router.go('home');

  // تسجيل Service Worker للعمل بدون إنترنت
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
});
