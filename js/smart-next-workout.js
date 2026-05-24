/* ============================================================
 * BULK MODE V9.2 (B.7) — Smart Next Workout Recommendation
 * ============================================================
 * يحلل البرنامج النشط + workouts السابقة + اليوم الحالي ويقترح:
 *   "الجلسة الأنسب الآن = X لأن آخر تدريب لـ <العضلة> كان قبل Y ساعة"
 *
 * يستخدمها Dashboard hero:
 *   - لو اليوم في الجدول → اقترحه (سلوك سابق)
 *   - لو يوم راحة → اقترح missedDay (سلوك سابق)
 *   - لو لا شيء واضح → استخدم recommendNextWorkout() (الجديد)
 *
 * منطق التحليل:
 *   1. لكل يوم تدريب في البرنامج، استخرج "main muscles" من asأسماء التمارين
 *   2. لكل عضلة، احسب آخر workout استهدفها
 *   3. اليوم المرشّح = الذي عضلاته الأقدم تدريباً (longest recovery)
 *   4. يحترم 48h minimum بين تدريب نفس العضلة
 * ============================================================ */

(function(){
  const E=(typeof escHTML==='function')?escHTML:(x=>String(x==null?'':x));

  // عضلات أساسية في كل يوم — مستخرجة من type/label/exercises
  // مفاتيح موحّدة: chest, back, shoulders, biceps, triceps, quads, hams, glutes, calves, core
  const DAY_TYPE_MUSCLES = {
    // البرنامج الأصلي (Upper Priority)
    'UPPER A':       ['chest','back','shoulders'],
    'BACK & WINGS':  ['back','shoulders'],
    'ARMS A':        ['biceps','triceps','core'],
    'UPPER B':       ['shoulders','chest','back'],
    'LEGS':          ['quads','hams','glutes','calves'],
    'ARMS B':        ['biceps','triceps','core'],
    // Upper/Lower 4-Day
    'UPPER':         ['chest','back','shoulders'],
    'LOWER':         ['quads','hams','glutes','calves','core'],
    // Full Body 3-Day
    'FULL BODY A':   ['chest','back','quads','shoulders'],
    'FULL BODY B':   ['back','chest','quads','hams','shoulders'],
    'FULL BODY C':   ['chest','back','quads','shoulders','core']
  };

  // muscle → ساعات تعافي مثالية (Schoenfeld guidelines)
  const MUSCLE_RECOVERY_HOURS = {
    chest:48, back:48, shoulders:48, biceps:48, triceps:48,
    quads:72, hams:72, glutes:72, calves:48, core:24
  };

  function _musclesForDay(day){
    if(!day) return [];
    const key=String(day.type||day.label||'').toUpperCase();
    // مطابقة دقيقة أولاً
    if(DAY_TYPE_MUSCLES[key]) return DAY_TYPE_MUSCLES[key];
    // مطابقة جزئية (مثلاً 'UPPER A — الترتيب الكامل')
    for(const k of Object.keys(DAY_TYPE_MUSCLES)){
      if(key.includes(k)) return DAY_TYPE_MUSCLES[k];
    }
    return [];
  }

  // يحسب آخر مرة استهدفت كل عضلة (ms timestamp)، null إذا لا يوجد
  function _lastMuscleSession(workouts, programDays){
    const map={};
    if(!Array.isArray(workouts)||!workouts.length) return map;
    // اربط كل workout بالعضلات التي يستهدفها
    for(const w of workouts){
      if(!w.dayType || !w.startTime) continue;
      const day=(programDays||[]).find(d=>String(d.type||'').toUpperCase()===String(w.dayType||'').toUpperCase())
              ||{type:w.dayType};
      const muscles=_musclesForDay(day);
      const ts=new Date(w.startTime).getTime();
      for(const m of muscles){
        if(!map[m] || ts>map[m]) map[m]=ts;
      }
    }
    return map;
  }

  // الواجهة الرئيسية: يرجع {day, reason, urgency, hoursSinceMin, mostNeglected}
  async function recommendNextWorkout(){
    try{
      // جلب البرنامج النشط
      let program=null;
      if(typeof getActiveProgram==='function') program=await getActiveProgram();
      if(!program){
        if(typeof EFFECTIVE_PROGRAM!=='undefined' && EFFECTIVE_PROGRAM) program=EFFECTIVE_PROGRAM;
        else if(typeof PROGRAM_DATA!=='undefined') program=PROGRAM_DATA;
      }
      if(!program || !program.days) return null;
      const trainingDays=program.days.filter(d=>!d.isRest && d.type!=='REST');
      if(!trainingDays.length) return null;

      const workouts=await db.getAll('workouts').catch(()=>[]);
      const now=Date.now();

      // لو لا توجد جلسات سابقة → اقترح أول يوم تدريب
      if(!workouts.length){
        return {
          day:trainingDays[0],
          reason:'ابدأ من أول يوم في برنامجك',
          urgency:'low',
          hoursSinceMin:null,
          mostNeglected:null,
          isFirstWorkout:true
        };
      }

      const muscleMap=_lastMuscleSession(workouts, program.days);

      // لكل يوم تدريب، احسب "أقدم عضلة" يستهدفها
      const candidates=trainingDays.map(day=>{
        const muscles=_musclesForDay(day);
        if(!muscles.length) return null;
        // متى آخر مرة كل عضلة في هذا اليوم تدربت؟
        let oldestTs=Infinity;
        let oldestMuscle=null;
        let allTrainedRecently=true;
        for(const m of muscles){
          const ts=muscleMap[m]||0;
          if(ts<oldestTs){oldestTs=ts;oldestMuscle=m}
          // هل تجاوزت ساعات التعافي؟
          const hoursSince=ts?(now-ts)/3600000:Infinity;
          const requiredHours=MUSCLE_RECOVERY_HOURS[m]||48;
          if(hoursSince<requiredHours) allTrainedRecently=false;
        }
        const hoursSinceMin=oldestTs===Infinity?9999:Math.round((now-oldestTs)/3600000);
        return {
          day,
          muscles,
          oldestMuscle,
          hoursSinceMin,
          allRecovered:allTrainedRecently
        };
      }).filter(Boolean);

      if(!candidates.length) return null;

      // اختر اليوم بأقدم عضلة (أعلى hoursSinceMin)، مع تفضيل الذي كل عضلاته تعافت
      candidates.sort((a,b)=>{
        // أولاً: المتعافي تماماً > غير المتعافي
        if(a.allRecovered!==b.allRecovered) return a.allRecovered?-1:1;
        // ثم: أقدم عضلة أولاً
        return b.hoursSinceMin-a.hoursSinceMin;
      });

      const top=candidates[0];
      const lastWorkoutTs=Math.max(...workouts.map(w=>new Date(w.startTime).getTime()).filter(t=>!isNaN(t)));
      const hoursSinceLast=Math.round((now-lastWorkoutTs)/3600000);

      // urgency:
      //   high   = آخر جلسة قبل ٤٨+ ساعة وعضلة مهملة بـ ٧٢+ ساعة
      //   medium = آخر جلسة قبل ٢٤-٤٨ ساعة
      //   low    = أقل من ٢٤ ساعة (لا تحتاج الآن غالباً)
      let urgency='medium';
      if(hoursSinceLast<24) urgency='low';
      else if(top.hoursSinceMin>=72) urgency='high';

      // نص السبب
      const muscleArLabels = {
        chest:'الصدر', back:'الظهر', shoulders:'الأكتاف', biceps:'البايسبس',
        triceps:'الترايسبس', quads:'الفخذ الأمامي', hams:'الفخذ الخلفي',
        glutes:'المؤخرة', calves:'السمانة', core:'البطن'
      };
      const muscleLabel=muscleArLabels[top.oldestMuscle]||top.oldestMuscle;
      let reasonText;
      if(top.hoursSinceMin>=9000){
        reasonText=`لم تستهدف <b>${muscleLabel}</b> من قبل`;
      }else if(top.hoursSinceMin>=72){
        const days=Math.round(top.hoursSinceMin/24);
        reasonText=`آخر تدريب لـ <b>${muscleLabel}</b> كان قبل <b>${days} يوم</b>`;
      }else{
        reasonText=`آخر تدريب لـ <b>${muscleLabel}</b> كان قبل <b>${top.hoursSinceMin} ساعة</b>`;
      }

      return {
        day:top.day,
        reason:reasonText,
        urgency,
        hoursSinceMin:top.hoursSinceMin,
        mostNeglected:top.oldestMuscle,
        muscleLabel,
        hoursSinceLast,
        isFirstWorkout:false
      };
    }catch(e){
      console.warn('recommendNextWorkout failed:',e);
      return null;
    }
  }

  // expose
  window.recommendNextWorkout=recommendNextWorkout;
  window.DAY_TYPE_MUSCLES=DAY_TYPE_MUSCLES;
})();
