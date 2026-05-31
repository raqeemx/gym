/* ============================================================
 * BULK MODE V9.7 — Data Helpers (Single Sources of Truth)
 * ============================================================
 * يجمع المنطق المتكرر/المتضارب في مكان واحد:
 *
 *   1. getProgramStartDate(programId?)  — تاريخ بدء البرنامج النشط (#14)
 *   2. recordProgramStart(programId)    — يسجّل البدء عند setActiveProgram
 *   3. getOverridesFor(programId)       — يقرأ overrides بـ namespace (#9)
 *   4. setOverrideFor(programId,dayId,obj) — يحفظ override بـ namespace
 *   5. getOverridesCounts()             — {programId: count} للعرض في Profile
 *   6. clearOverridesFor(programId)     — مسح كل overrides لبرنامج محدد
 *   7. getDeloadStatus()                — مصدر حقيقة موحّد للـ Deload (#11)
 *
 * Backward-compat:
 *   - PROGRAM_OVERRIDES القديمة (flat {dayId:...}) تُترجم تلقائياً لـ DEFAULT_PROGRAM_ID
 *   - firstWorkoutDate يُستخدم كـ fallback لـ programStartDates[DEFAULT_PROGRAM_ID]
 *
 * يُحمَّل بعد data.js + program-templates.js
 * ============================================================ */

(function(){

// ============================================================
// (#14) — Program Start Dates
// ============================================================

async function getProgramStartDate(programId){
  if(!programId && typeof getActiveProgramId==='function'){
    programId=await getActiveProgramId();
  }
  if(!programId) programId='upper-priority';
  try{
    const rec=await db.get('settings',KEYS.PROGRAM_START_DATES);
    const map=(rec&&rec.value)||{};
    if(map[programId]) return map[programId];
    // Backward-compat: لو programId='upper-priority' و firstWorkoutDate موجود
    if(programId==='upper-priority'){
      const fw=await db.get('settings',KEYS.FIRST_WORKOUT);
      if(fw && fw.value) return fw.value;
    }
    // fallback: تاريخ أول workout لهذا البرنامج إذا كان workouts تحمل programId
    const workouts=await db.getAll('workouts').catch(()=>[]);
    const filtered=workouts.filter(w=>{
      // V9.7 (#13): workouts الجديدة تحوي programId
      if(w.programId) return w.programId===programId;
      // workouts القديمة بدون programId تُعتبر تابعة لـ default
      return programId==='upper-priority';
    });
    if(filtered.length){
      const sorted=filtered.sort((a,b)=>new Date(a.startTime||0)-new Date(b.startTime||0));
      const start=sorted[0].startTime;
      // احفظها لتسريع المرات القادمة
      try{
        const rec2=await db.get('settings',KEYS.PROGRAM_START_DATES);
        const m=(rec2&&rec2.value)||{};
        m[programId]=start;
        await db.put('settings',{key:KEYS.PROGRAM_START_DATES,value:m});
      }catch(e){}
      return start;
    }
  }catch(e){console.warn('getProgramStartDate failed:',e)}
  return null;
}

async function recordProgramStart(programId){
  if(!programId) return;
  try{
    const rec=await db.get('settings',KEYS.PROGRAM_START_DATES);
    const map=(rec&&rec.value)||{};
    if(map[programId]) return; // موجود مسبقاً
    map[programId]=new Date().toISOString();
    await db.put('settings',{key:KEYS.PROGRAM_START_DATES,value:map});
  }catch(e){console.warn('recordProgramStart failed:',e)}
}

// V9.7 (#14) — يحسب الأسبوع/الشهر للبرنامج النشط
async function getProgramWeekProgress(programId){
  const start=await getProgramStartDate(programId);
  if(!start) return null;
  const first=new Date(start);
  const days=Math.max(0, Math.floor((Date.now()-first.getTime())/86400000));
  const week=Math.min(12, Math.max(1, Math.floor(days/7)+1));
  const month=Math.min(3, Math.max(1, Math.floor((week-1)/4)+1));
  return {week, month, daysIn:days, pct:Math.min(100, Math.round((week/12)*100)), startDate:start};
}

// ============================================================
// (#9) — Namespaced PROGRAM_OVERRIDES
// ============================================================
// شكل جديد: { [programId]: { [dayId]: dayObject } }
// شكل قديم (backward-compat): { [dayId]: dayObject } — يُترجم لـ default-program

async function _getAllOverridesRaw(){
  const rec=await db.get('settings',KEYS.PROGRAM_OVERRIDES);
  return (rec&&rec.value)||{};
}

// يكتشف لو الشكل قديم (مفاتيحه dayIds مباشرة) أم جديد (programIds)
function _isLegacyOverridesShape(raw){
  if(!raw || typeof raw!=='object') return false;
  const keys=Object.keys(raw);
  if(!keys.length) return false;
  // الشكل الجديد: المفاتيح = programIds معروفة في PROGRAM_TEMPLATES
  // الشكل القديم: المفاتيح = dayIds مثل 'upper-a', 'fb-a'
  const known=(typeof PROGRAM_TEMPLATES!=='undefined')?Object.keys(PROGRAM_TEMPLATES):[];
  // لو أي مفتاح موجود في known programs → الشكل الجديد
  if(keys.some(k=>known.includes(k))) return false;
  // لو القيمة الأولى object فيه phases/type/dayOfWeek = dayObject مباشرة → legacy
  const first=raw[keys[0]];
  return first && (typeof first==='object') && (first.phases || first.type || first.dayOfWeek!=null);
}

async function getOverridesFor(programId){
  if(!programId && typeof getActiveProgramId==='function'){
    programId=await getActiveProgramId();
  }
  if(!programId) programId='upper-priority';
  const raw=await _getAllOverridesRaw();
  if(_isLegacyOverridesShape(raw)){
    // legacy = ينتمي لـ upper-priority
    return programId==='upper-priority'?raw:{};
  }
  return raw[programId]||{};
}

async function setOverrideFor(programId, dayId, dayObject){
  if(!programId || !dayId) throw new Error('programId and dayId required');
  const raw=await _getAllOverridesRaw();
  let map=raw;
  // لو legacy: حوّل الشكل
  if(_isLegacyOverridesShape(raw)){
    map={'upper-priority': {...raw}};
  }
  if(!map[programId]) map[programId]={};
  map[programId][dayId]=dayObject;
  await db.put('settings',{key:KEYS.PROGRAM_OVERRIDES, value:map});
}

async function clearOverrideFor(programId, dayId){
  const raw=await _getAllOverridesRaw();
  let map=raw;
  if(_isLegacyOverridesShape(raw)){
    if(programId!=='upper-priority') return;
    delete map[dayId];
  }else{
    if(!map[programId]) return;
    delete map[programId][dayId];
    if(Object.keys(map[programId]).length===0) delete map[programId];
  }
  await db.put('settings',{key:KEYS.PROGRAM_OVERRIDES, value:map});
}

async function clearOverridesFor(programId){
  const raw=await _getAllOverridesRaw();
  if(_isLegacyOverridesShape(raw)){
    if(programId==='upper-priority'){
      await db.put('settings',{key:KEYS.PROGRAM_OVERRIDES, value:{}});
    }
    return;
  }
  if(raw[programId]){
    delete raw[programId];
    await db.put('settings',{key:KEYS.PROGRAM_OVERRIDES, value:raw});
  }
}

async function getOverridesCounts(){
  const raw=await _getAllOverridesRaw();
  if(_isLegacyOverridesShape(raw)){
    return {'upper-priority': Object.keys(raw).length};
  }
  const result={};
  for(const pid of Object.keys(raw)){
    const days=raw[pid]||{};
    const count=Object.keys(days).length;
    if(count>0) result[pid]=count;
  }
  return result;
}

// ============================================================
// (#11) — Unified Deload Status
// ============================================================
// مصدر حقيقة واحد لكل عرض Deload في التطبيق

async function getDeloadStatus(){
  const out={
    active:false,
    activeSince:null,
    activeUntil:null,        // ينتهي تلقائياً يوم الأحد التالي
    daysLeft:0,
    source:null,             // 'manual' | 'smart-detect' | 'weekly-review'
    recommended:false,
    recommendationUrgency:null,  // 'high' | 'low' | null
    reasons:[]
  };

  try{
    // 1. هل في deload نشط حالياً؟
    const rec=await db.get('settings', KEYS.MANUAL_DELOAD_ACTIVE);
    if(rec && rec.value && rec.value.active){
      out.active=true;
      out.activeSince=rec.value.startedAt;
      out.source=rec.value.reason||'manual';
      // احسب نهاية الـ deload (الأحد التالي بعد startedAt)
      if(rec.value.startedAt){
        const sd=new Date(rec.value.startedAt);
        sd.setHours(0,0,0,0);
        const day=sd.getDay();
        const daysToAdd=day===0?7:(7-day);
        const endBoundary=new Date(sd);
        endBoundary.setDate(endBoundary.getDate()+daysToAdd);
        out.activeUntil=endBoundary.toISOString();
        out.daysLeft=Math.max(0, Math.ceil((endBoundary.getTime()-Date.now())/86400000));
      }
    }

    // 2. هل هناك توصية بـ deload (حتى لو نشط)؟
    if(typeof detectDeloadNeed==='function'){
      const detection=await detectDeloadNeed();
      if(detection && detection.needed){
        out.recommended=!out.active; // فقط لو ما هو نشط بالفعل
        out.recommendationUrgency=detection.urgency||'low';
        if(detection.reason) out.reasons.push({type:'smart-detect', text:detection.reason});
      }
    }

    // 3. توصية من Weekly Review (RPE>8.5 في آخر ٣ جلسات)
    try{
      const workouts=await db.getAll('workouts').catch(()=>[]);
      const sets=await db.getAll('sets').catch(()=>[]);
      const last3W=workouts.sort((a,b)=>new Date(b.startTime)-new Date(a.startTime)).slice(0,3);
      if(last3W.length>=3){
        const last3Sets=sets.filter(s=>last3W.some(w=>w.id===s.workoutId) && s.rpe!=null);
        if(last3Sets.length){
          const avg=last3Sets.reduce((a,s)=>a+s.rpe,0)/last3Sets.length;
          if(avg>8.5){
            const reason=`متوسط RPE ${Math.round(avg*10)/10} في آخر ٣ جلسات (>٨.٥)`;
            out.reasons.push({type:'weekly-review', text:reason});
            if(!out.active && !out.recommended){
              out.recommended=true;
              out.recommendationUrgency='high';
            }
          }
        }
      }
    }catch(e){}
  }catch(err){console.warn('getDeloadStatus failed:',err)}

  return out;
}

// V9.7 (#12) — يحدد هل workout كان أثناء Deload (للـ chart markers)
function isWorkoutDuringDeload(workout, deloadHistory){
  if(!workout || !deloadHistory) return false;
  const wTime=new Date(workout.startTime).getTime();
  return deloadHistory.some(d=>{
    const start=new Date(d.startedAt).getTime();
    const end=d.endedAt?new Date(d.endedAt).getTime():Date.now();
    return wTime>=start && wTime<=end;
  });
}

// expose
window.getProgramStartDate=getProgramStartDate;
window.recordProgramStart=recordProgramStart;
window.getProgramWeekProgress=getProgramWeekProgress;
window.getOverridesFor=getOverridesFor;
window.setOverrideFor=setOverrideFor;
window.clearOverrideFor=clearOverrideFor;
window.clearOverridesFor=clearOverridesFor;
window.getOverridesCounts=getOverridesCounts;
window.getDeloadStatus=getDeloadStatus;
window.isWorkoutDuringDeload=isWorkoutDuringDeload;

})();
