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
  settings: { defaultRest: 90, soundOn: true, vibrationOn: true }
};

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
        if (!this._data.settings) this._data.settings = { ...DEFAULT_DATA.settings };
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
