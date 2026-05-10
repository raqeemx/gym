/* ============================================
   BULK MODE — طبقة التخزين (localStorage)
   كل البيانات تُحفظ محلياً في الجوال
   ============================================ */

const STORAGE_KEY = 'bulkmode_v1';

// الهيكل العام للبيانات:
// {
//   sessions: [           // كل جلسة تمرين كاملة
//     {
//       id, dayId, dayTitle, dayType,
//       date (ISO),
//       startedAt, finishedAt,
//       durationSec,
//       notes,
//       exercises: [
//         { exerciseId, name, sets: [ { weight, reps, done } ] }
//       ]
//     }
//   ],
//   activeSession: {...} | null,   // جلسة جارية الآن
//   settings: { defaultRest: 90, soundOn: true }
// }

const DEFAULT_DATA = {
  sessions: [],
  activeSession: null,
  bodyEntries: [],
  prs: [],
  settings: {
    defaultRest: 90,
    soundOn: true,
    vibrationOn: true,
    barWeight: 20,                    // كجم
    plateSet: [25, 20, 15, 10, 5, 2.5, 1.25],
    weightUnit: 'kg',
    restWarnSeconds: 5,
    autoProgress: { enabled: true, compoundKg: 2.5, isolationKg: 1.25 },
    theme: 'dark',
    showHijri: false,
    confettiOn: true
  }
};

// تمارين تُعتبر "مركّبة" لتمييز مقدار الزيادة
const COMPOUND_EXERCISE_PATTERNS = /chest press|shoulder press|leg press|chin|dip|row|lat machine|squat|deadlift|press/i;

const Store = {
  _data: null,

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this._data = JSON.parse(JSON.stringify(DEFAULT_DATA));
      } else {
        const parsed = JSON.parse(raw);
        this._data = Object.assign({}, DEFAULT_DATA, parsed);
        // ضمّن الإعدادات الجديدة لو كانت ناقصة (ترقية ناعمة)
        this._data.settings = Object.assign({}, DEFAULT_DATA.settings, parsed.settings || {});
        if (!this._data.bodyEntries) this._data.bodyEntries = [];
        if (!this._data.prs) this._data.prs = [];
      }
    } catch (e) {
      console.error('فشل تحميل البيانات', e);
      this._data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    return this._data;
  },

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
    } catch (e) {
      console.error('فشل الحفظ', e);
      alert('تعذّر حفظ البيانات — قد تكون الذاكرة ممتلئة.');
    }
  },

  get data() {
    if (!this._data) this.load();
    return this._data;
  },

  // ===== الجلسات =====
  getSessions() {
    return this.data.sessions.slice().sort((a,b) => b.startedAt - a.startedAt);
  },

  getSessionsByDay(dayId) {
    return this.data.sessions
      .filter(s => s.dayId === dayId)
      .sort((a,b) => b.startedAt - a.startedAt);
  },

  getSessionById(id) {
    return this.data.sessions.find(s => s.id === id);
  },

  saveSession(session) {
    const idx = this.data.sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) this.data.sessions[idx] = session;
    else this.data.sessions.push(session);
    this.save();
  },

  deleteSession(id) {
    this.data.sessions = this.data.sessions.filter(s => s.id !== id);
    this.save();
  },

  // ===== الجلسة النشطة =====
  getActiveSession() { return this.data.activeSession; },

  setActiveSession(session) {
    this.data.activeSession = session;
    this.save();
  },

  clearActiveSession() {
    this.data.activeSession = null;
    this.save();
  },

  // ===== الإعدادات =====
  getSettings() { return this.data.settings; },
  updateSettings(patch) {
    this.data.settings = { ...this.data.settings, ...patch };
    this.save();
  },

  // ===== التحليلات =====

  // أفضل وزن (أعلى وزن مرفوع × عدد تكرارات يساوي أو يزيد عن 1) لتمرين معيّن
  getBestForExercise(exerciseId) {
    let best = null; // {weight, reps, date}
    for (const s of this.data.sessions) {
      const ex = s.exercises.find(e => e.exerciseId === exerciseId);
      if (!ex) continue;
      for (const set of ex.sets) {
        if (!set.done) continue;
        const w = parseFloat(set.weight) || 0;
        if (w <= 0) continue;
        if (!best || w > best.weight) {
          best = { weight: w, reps: set.reps || 0, date: s.startedAt };
        }
      }
    }
    return best;
  },

  // آخر جلسة فيها هذا التمرين (للمقارنة)
  getLastSetsForExercise(exerciseId, beforeTimestamp = Infinity) {
    const sessions = this.data.sessions
      .filter(s => s.startedAt < beforeTimestamp)
      .sort((a,b) => b.startedAt - a.startedAt);
    for (const s of sessions) {
      const ex = s.exercises.find(e => e.exerciseId === exerciseId);
      if (ex && ex.sets && ex.sets.some(x => x.done)) {
        return { sets: ex.sets, date: s.startedAt, sessionId: s.id };
      }
    }
    return null;
  },

  // متطور: مجموع حجم الرفع لجلسة (وزن × تكرار)
  totalVolume(session) {
    let v = 0;
    for (const ex of session.exercises) {
      for (const set of ex.sets) {
        if (!set.done) continue;
        v += (parseFloat(set.weight)||0) * (parseInt(set.reps)||0);
      }
    }
    return Math.round(v);
  },

  // إحصائيات عامة
  getStats() {
    const sessions = this.data.sessions;
    const totalSessions = sessions.length;
    let totalSeconds = 0;
    let totalVolume = 0;
    let totalSets = 0;
    const byType = { push:0, pull:0, legs:0 };

    for (const s of sessions) {
      totalSeconds += s.durationSec || 0;
      totalVolume += this.totalVolume(s);
      for (const ex of s.exercises) {
        totalSets += (ex.sets||[]).filter(x => x.done).length;
      }
      if (byType[s.dayType] !== undefined) byType[s.dayType]++;
    }

    // streak: أيام التمرين المتتالية حتى آخر جلسة
    const dates = [...new Set(sessions.map(s => new Date(s.startedAt).toDateString()))].sort();
    let streak = 0;
    if (dates.length) {
      // عدد أيام مختلفة في آخر 7 أيام
      const today = new Date();
      const oneDay = 86400000;
      let cur = today;
      for (let i = 0; i < 30; i++) {
        const ds = cur.toDateString();
        if (dates.includes(ds)) { streak++; cur = new Date(cur.getTime() - oneDay); }
        else if (i === 0) { cur = new Date(cur.getTime() - oneDay); } // اليوم بدون تمرين OK
        else break;
      }
    }

    // عدد الأيام المختلفة في آخر 7 أيام
    const weekAgo = Date.now() - 7*86400000;
    const last7 = new Set(
      sessions.filter(s => s.startedAt >= weekAgo).map(s => new Date(s.startedAt).toDateString())
    ).size;

    return { totalSessions, totalSeconds, totalVolume, totalSets, byType, streak, last7 };
  },

  // ===== وزن الجسم =====
  getBodyEntries() {
    return (this.data.bodyEntries || []).slice().sort((a,b) => b.recordedAt - a.recordedAt);
  },
  addBodyEntry(entry) {
    if (!this.data.bodyEntries) this.data.bodyEntries = [];
    const e = { id: 'b_' + Date.now().toString(36), recordedAt: Date.now(), ...entry };
    this.data.bodyEntries.push(e);
    this.save();
    return e;
  },
  deleteBodyEntry(id) {
    this.data.bodyEntries = (this.data.bodyEntries || []).filter(e => e.id !== id);
    this.save();
  },
  getLatestBodyWeight() {
    const arr = this.getBodyEntries();
    const latest = arr.find(e => typeof e.weightKg === 'number');
    return latest ? latest.weightKg : null;
  },

  // ===== الأرقام الشخصية (PRs) =====
  getPRs() { return (this.data.prs || []).slice().sort((a,b) => b.achievedAt - a.achievedAt); },
  getPRsByExercise(exerciseId) {
    return (this.data.prs || []).filter(p => p.exerciseId === exerciseId);
  },
  // أعلى 1RM مقدّر لتمرين معيّن (Epley)
  epley(weight, reps) {
    const w = parseFloat(weight) || 0; const r = parseInt(reps) || 0;
    if (w <= 0 || r <= 0) return 0;
    if (r === 1) return w;
    return w * (1 + r / 30);
  },
  getBestE1RM(exerciseId) {
    let best = 0;
    for (const s of this.data.sessions) {
      const ex = s.exercises.find(e => e.exerciseId === exerciseId);
      if (!ex) continue;
      for (const set of ex.sets) {
        if (!set.done) continue;
        const e1 = this.epley(set.weight, set.reps);
        if (e1 > best) best = e1;
      }
    }
    return best;
  },
  getBestRepsAtWeight(exerciseId, weight) {
    const w = parseFloat(weight) || 0;
    let best = 0;
    for (const s of this.data.sessions) {
      const ex = s.exercises.find(e => e.exerciseId === exerciseId);
      if (!ex) continue;
      for (const set of ex.sets) {
        if (!set.done) continue;
        if ((parseFloat(set.weight)||0) >= w && (parseInt(set.reps)||0) > best) {
          best = parseInt(set.reps);
        }
      }
    }
    return best;
  },
  getSessionVolumeForExercise(session, exerciseId) {
    const ex = session.exercises.find(e => e.exerciseId === exerciseId);
    if (!ex) return 0;
    let v = 0;
    for (const set of ex.sets) {
      if (!set.done) continue;
      v += (parseFloat(set.weight)||0) * (parseInt(set.reps)||0);
    }
    return v;
  },
  getBestSessionVolumeForExercise(exerciseId, beforeTimestamp = Infinity) {
    let best = 0;
    for (const s of this.data.sessions) {
      if (s.startedAt >= beforeTimestamp) continue;
      const v = this.getSessionVolumeForExercise(s, exerciseId);
      if (v > best) best = v;
    }
    return best;
  },
  // فحص الجلسة بعد الحفظ — يكتشف PRs ويسجّلها
  detectAndStorePRs(session) {
    const newPRs = [];
    const seenInSession = new Set();
    if (!this.data.prs) this.data.prs = [];

    for (const ex of session.exercises) {
      // احسب الـ"قبل هذه الجلسة" بحساب أفضل قبل startedAt
      // أفضل وزن مرفوع (أي تكرار ≥1)
      let prevBestWeight = 0, prevBestE1RM = 0;
      const repsAtWeightMap = {}; // weight -> best reps
      for (const s of this.data.sessions) {
        if (s.id === session.id) continue;
        if (s.startedAt >= session.startedAt) continue;
        const e = s.exercises.find(x => x.exerciseId === ex.exerciseId);
        if (!e) continue;
        for (const st of e.sets) {
          if (!st.done) continue;
          const w = parseFloat(st.weight)||0, r = parseInt(st.reps)||0;
          if (w <= 0 || r <= 0) continue;
          if (w > prevBestWeight) prevBestWeight = w;
          const e1 = this.epley(w, r);
          if (e1 > prevBestE1RM) prevBestE1RM = e1;
          if (!repsAtWeightMap[w] || r > repsAtWeightMap[w]) repsAtWeightMap[w] = r;
        }
      }
      const prevBestVolume = this.getBestSessionVolumeForExercise(ex.exerciseId, session.startedAt);

      // افحص سيتات هذه الجلسة
      let bestWeightThis = 0, bestE1RMThis = 0;
      let bestWeightSet = null, bestE1RMSet = null;
      for (const set of ex.sets) {
        if (!set.done) continue;
        const w = parseFloat(set.weight)||0, r = parseInt(set.reps)||0;
        if (w <= 0 || r <= 0) continue;
        if (w > bestWeightThis) { bestWeightThis = w; bestWeightSet = set; }
        const e1 = this.epley(w, r);
        if (e1 > bestE1RMThis) { bestE1RMThis = e1; bestE1RMSet = set; }
      }

      const key = (t) => ex.exerciseId + ':' + t;

      // PR وزن
      if (bestWeightThis > prevBestWeight && prevBestWeight > 0 && !seenInSession.has(key('weight'))) {
        seenInSession.add(key('weight'));
        const pr = { id: 'pr_' + Date.now().toString(36) + Math.random().toString(36).slice(2,5),
          exerciseId: ex.exerciseId, exerciseName: ex.name,
          type: 'weight', value: bestWeightThis,
          context: { weight: bestWeightSet.weight, reps: bestWeightSet.reps, prev: prevBestWeight },
          achievedAt: session.startedAt, sessionId: session.id };
        newPRs.push(pr); this.data.prs.push(pr);
      }
      // PR 1RM مقدّر
      if (bestE1RMThis > prevBestE1RM && prevBestE1RM > 0 && !seenInSession.has(key('e1rm'))) {
        seenInSession.add(key('e1rm'));
        const pr = { id: 'pr_' + Date.now().toString(36) + Math.random().toString(36).slice(2,5),
          exerciseId: ex.exerciseId, exerciseName: ex.name,
          type: 'e1rm', value: Math.round(bestE1RMThis * 10) / 10,
          context: { weight: bestE1RMSet.weight, reps: bestE1RMSet.reps, prev: Math.round(prevBestE1RM*10)/10 },
          achievedAt: session.startedAt, sessionId: session.id };
        newPRs.push(pr); this.data.prs.push(pr);
      }
      // PR حجم جلسة
      const thisVol = this.getSessionVolumeForExercise(session, ex.exerciseId);
      if (thisVol > prevBestVolume && prevBestVolume > 0 && !seenInSession.has(key('volume'))) {
        seenInSession.add(key('volume'));
        const pr = { id: 'pr_' + Date.now().toString(36) + Math.random().toString(36).slice(2,5),
          exerciseId: ex.exerciseId, exerciseName: ex.name,
          type: 'volume', value: Math.round(thisVol),
          context: { prev: Math.round(prevBestVolume) },
          achievedAt: session.startedAt, sessionId: session.id };
        newPRs.push(pr); this.data.prs.push(pr);
      }
    }
    if (newPRs.length) this.save();
    return newPRs;
  },

  // بيانات الرسم البياني للتقدّم — كل جلسة فيها هذا التمرين، نعطي e1RM ووزن أعلى
  getProgressionData(exerciseId, limit = 30) {
    const points = [];
    for (const s of this.data.sessions) {
      const ex = s.exercises.find(e => e.exerciseId === exerciseId);
      if (!ex) continue;
      let topWeight = 0, topE1RM = 0, totalVol = 0;
      for (const set of ex.sets) {
        if (!set.done) continue;
        const w = parseFloat(set.weight)||0, r = parseInt(set.reps)||0;
        if (w > topWeight) topWeight = w;
        const e1 = this.epley(w, r);
        if (e1 > topE1RM) topE1RM = e1;
        totalVol += w * r;
      }
      if (topWeight > 0) {
        points.push({ date: s.startedAt, weight: topWeight, e1rm: Math.round(topE1RM*10)/10, volume: Math.round(totalVol) });
      }
    }
    return points.sort((a,b) => a.date - b.date).slice(-limit);
  },

  // اقتراح التقدّم — يفحص آخر جلسة لهذا التمرين ويرجّع توصية
  suggestProgress(exerciseId, exerciseName) {
    const last = this.getLastSetsForExercise(exerciseId);
    if (!last) return null;
    const set = last.sets.find(x => x.done);
    if (!set) return null;

    // افهم الهدف من اسم التمرين/البرنامج
    const isCompound = COMPOUND_EXERCISE_PATTERNS.test(exerciseName || '');
    const inc = isCompound
      ? this.data.settings.autoProgress.compoundKg
      : this.data.settings.autoProgress.isolationKg;

    // افحص: هل كل السيتات المنجزة في الجلسة السابقة وصلت أعلى التكرار المستهدف؟
    const program = (typeof EXERCISE_BY_ID !== 'undefined') ? EXERCISE_BY_ID[exerciseId] : null;
    const targetReps = program ? program.reps : '8-10';
    const m = String(targetReps).match(/(\d+)\s*-\s*(\d+)/);
    const lo = m ? parseInt(m[1]) : 8;
    const hi = m ? parseInt(m[2]) : 10;

    const doneSets = last.sets.filter(x => x.done);
    if (doneSets.length === 0) return null;
    const allHitTop = doneSets.every(s => (parseInt(s.reps)||0) >= hi);
    const allInRange = doneSets.every(s => {
      const r = parseInt(s.reps)||0;
      return r >= lo && r <= hi;
    });
    const failedBottom = doneSets.some(s => (parseInt(s.reps)||0) < lo);

    const lastWeight = parseFloat(set.weight) || 0;
    if (allHitTop) return { kind: 'up', delta: inc, suggestedWeight: lastWeight + inc, reason: `كل السيتات وصلت ${hi} تكرار — زد ${inc} كجم` };
    if (failedBottom) return { kind: 'down', delta: -inc, suggestedWeight: Math.max(0, lastWeight - inc), reason: `لم تصل ${lo} تكرار آخر مرة — جرّب أقل ${inc} كجم` };
    if (allInRange) return { kind: 'hold', delta: 0, suggestedWeight: lastWeight, reason: 'كرر نفس الوزن وحاول تكرار أكثر' };
    return null;
  },

  // إجمالي عدد الـ PRs لجلسة (للحفظ في session.prCount لو احتجنا)
  // تصدير/استيراد
  exportJSON() { return JSON.stringify(this.data, null, 2); },
  importJSON(json) {
    try {
      const parsed = JSON.parse(json);
      this._data = Object.assign({}, DEFAULT_DATA, parsed);
      this.save();
      return true;
    } catch(e){ return false; }
  },
  resetAll() {
    this._data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    this.save();
  }
};

Store.load();
