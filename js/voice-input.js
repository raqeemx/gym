/* ============================================================
 * BULK MODE V9.2 (B.9) — Voice Input للوزن والتكرار
 * ============================================================
 * يستخدم Web Speech API (SpeechRecognition) لإدخال الوزن والتكرار صوتياً
 * — مفيد في الجيم حين تكون اليدان مشغولتين أو متعرّقتين.
 *
 * UX:
 *   - زر 🎤 صغير داخل كل track-input (بجانب الـ inputs)
 *   - الضغط يفتح "listening overlay" يستمع لـ ٥-٧ ثوانٍ
 *   - يفهم أنماطاً مثل:
 *      "عشرين خمسة" / "20 5"          → weight=20, reps=5
 *      "خمسة وعشرين تكرار عشرة"        → reps=10, weight=25
 *      "خمسة عشر ضرب اثنتي عشرة"       → reps=12, weight=15
 *      "أربعين"                        → weight=40 (لو فاضي)
 *
 *   - يكتب النتيجة في الـ inputs مع feedback
 *   - دعم لـ ar-SA + en-US fallback
 *
 * يدعم: Chrome/Edge (mobile + desktop), Safari iOS 14.5+
 * لا يدعم: Firefox (يخفي الزر)
 * ============================================================ */

(function(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){
    // المتصفح لا يدعم Web Speech — لا تربط شيء
    window.voiceInputSupported=false;
    return;
  }
  window.voiceInputSupported=true;

  // ---------- خريطة الأرقام العربية المنطوقة → أرقام ----------
  const NUMBER_WORDS_AR = {
    'صفر':0,
    'واحد':1,'واحدة':1,'وحدة':1,
    'اثنان':2,'اثنين':2,'اثنتين':2,'اثنتان':2,
    'ثلاثة':3,'ثلاث':3,'ثلاثه':3,
    'أربعة':4,'اربعة':4,'أربع':4,'اربع':4,'اربعه':4,
    'خمسة':5,'خمس':5,'خمسه':5,
    'ستة':6,'ست':6,'سته':6,
    'سبعة':7,'سبع':7,'سبعه':7,
    'ثمانية':8,'ثمان':8,'ثمانيه':8,'تمانية':8,'تمنية':8,
    'تسعة':9,'تسع':9,'تسعه':9,
    'عشرة':10,'عشره':10,
    'أحد عشر':11,'احدعشر':11,'حدعش':11,'إحدى عشر':11,
    'اثنا عشر':12,'اثنعش':12,'اثنعشر':12,
    'ثلاثة عشر':13,'ثلاثه عشر':13,
    'أربعة عشر':14,'اربعة عشر':14,'اربعه عشر':14,
    'خمسة عشر':15,'خمسه عشر':15,'خمستعشر':15,
    'ستة عشر':16,'سته عشر':16,'ستعش':16,
    'سبعة عشر':17,'سبعه عشر':17,
    'ثمانية عشر':18,'تمنطعش':18,
    'تسعة عشر':19,'تسعتعش':19,
    'عشرون':20,'عشرين':20,
    'ثلاثون':30,'ثلاثين':30,
    'أربعون':40,'اربعون':40,'اربعين':40,
    'خمسون':50,'خمسين':50,
    'ستون':60,'ستين':60,
    'سبعون':70,'سبعين':70,
    'ثمانون':80,'ثمانين':80,
    'تسعون':90,'تسعين':90,
    'مئة':100,'مية':100,'ميه':100
  };

  // المفاتيح المساعدة (الاتجاه)
  const REP_KEYWORDS = ['تكرار','مرة','مرات','ريب','reps','rep'];
  const WEIGHT_KEYWORDS = ['كيلو','كجم','كيلوغرام','وزن','kilo','kg','weight'];
  const SEP_KEYWORDS = ['و','في','ضرب','×','x','*'];

  // V9.8 (#20) — كسور عربية شائعة في الجيم (2.5/0.5/0.25 increments)
  const FRACTION_WORDS = {
    'نصف':0.5, 'نص':0.5, 'النص':0.5, 'النصف':0.5,
    'ربع':0.25, 'الربع':0.25,
    'ثلاث ارباع':0.75, 'ثلاثة ارباع':0.75, 'ثلاث أرباع':0.75,
    'ثلث':0.333, 'الثلث':0.333,
    'ثلثين':0.667, 'الثلثين':0.667
  };
  // كلمات الفاصلة العشرية ("اثنين فاصلة خمسة" = 2.5)
  const DECIMAL_POINT_WORDS = ['فاصلة','فاصله','نقطة','نقطه','point'];

  // يحوّل كلمات عربية (مع "و") لأرقام: "خمسة وعشرين" → 25
  function _parseArabicNumber(words){
    // إذا الرقم ينتهي بـ "و<عقد>" مثل "خمسة وعشرين"
    if(words.length===3 && SEP_KEYWORDS.includes(words[1])){
      const a=NUMBER_WORDS_AR[words[0]];
      const b=NUMBER_WORDS_AR[words[2]];
      if(a!=null && b!=null && b>=20 && b<100){
        return a+b;
      }
    }
    // كلمة واحدة
    if(words.length===1){
      const v=NUMBER_WORDS_AR[words[0]];
      if(v!=null) return v;
      // رقم لاتيني/عربي
      const num=parseFloat(words[0].replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))));
      if(!isNaN(num)) return num;
    }
    // كلمتين متتاليتين بدون فاصل (مثلاً "خمسة عشر")
    if(words.length===2){
      const joined=words.join(' ');
      if(NUMBER_WORDS_AR[joined]!=null) return NUMBER_WORDS_AR[joined];
    }
    return null;
  }

  // V9.8 (#20) — يحوّل tokens مثل ["اثنين","فاصلة","خمسة"] → [2.5]
  // أو ["اثنين","ونصف"] → [2.5]
  function _preprocessDecimalsAndFractions(tokens){
    const out=[];
    for(let i=0;i<tokens.length;i++){
      const t=tokens[i];
      const next=tokens[i+1]||'';
      const next2=tokens[i+2]||'';
      // 1. "<num> فاصلة <num>"
      if(DECIMAL_POINT_WORDS.includes(next)){
        const a=_parseArabicNumber([t]);
        const b=_parseArabicNumber([next2]);
        if(a!=null && b!=null && b>=0 && b<10){
          out.push(String(a+b/10));
          i+=2;
          continue;
        }
      }
      // 2. "<num> و<fraction>" أو "<num> <fraction>"
      // 2a. "اثنين ونصف"
      if(next.startsWith('و') && next.length>1){
        const fracKey=next.substring(1);
        if(FRACTION_WORDS[fracKey]!=null){
          const base=_parseArabicNumber([t]);
          if(base!=null){
            out.push(String(base+FRACTION_WORDS[fracKey]));
            i++;
            continue;
          }
        }
      }
      // 2b. "اثنين نصف"
      if(FRACTION_WORDS[next]!=null){
        const base=_parseArabicNumber([t]);
        if(base!=null){
          out.push(String(base+FRACTION_WORDS[next]));
          i++;
          continue;
        }
      }
      // 3. كسر مفرد: "نصف" بدون رقم قبله = 0.5
      if(FRACTION_WORDS[t]!=null){
        out.push(String(FRACTION_WORDS[t]));
        continue;
      }
      // 4. decimal مكتوب مباشرة (2.5, ٢.٥)
      if(/^\d+\.\d+$/.test(t)){
        out.push(t);
        continue;
      }
      out.push(t);
    }
    return out;
  }

  // الـ parser الرئيسي: يستخرج {weight, reps} من نص
  function parseVoiceInput(text){
    if(!text) return {};
    // طبّع: lowercase + شيل علامات (نحفظ النقطة العشرية)
    const norm=text.toString().trim().toLowerCase()
      .replace(/[،,؟?!]/g,' ')
      .replace(/\.(\D|$)/g,' $1')  // نقطة قبل حرف = فصل، نقطة قبل رقم = عشري
      .replace(/\s+/g,' ');
    // قسّم لكلمات
    let tokens=norm.split(' ').filter(Boolean);
    // V9.8 (#20) — preprocess: ادمج الكسور والعشريات لـ tokens رقمية واحدة
    tokens=_preprocessDecimalsAndFractions(tokens);

    let weight=null, reps=null;

    // محاولة ١: استخرج أرقام لاتينية مباشرة (مثل "20 5" أو "kg 20 reps 5")
    const latinNums=[];
    for(let i=0;i<tokens.length;i++){
      const t=tokens[i];
      const n=parseFloat(t.replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))));
      if(!isNaN(n) && n>=0 && n<1000){
        latinNums.push({val:n,idx:i});
      }
    }

    // إذا فيه ٢ أرقام لاتينية + لا كلمات عربية → الأول وزن، الثاني تكرار
    if(latinNums.length>=2 && latinNums.length<=4){
      // ابحث عن أيهم محاط بكلمة weight/rep
      latinNums.forEach(({val,idx})=>{
        const before=tokens[idx-1]||'';
        const after=tokens[idx+1]||'';
        if(WEIGHT_KEYWORDS.some(k=>before.includes(k)||after.includes(k))){
          if(weight==null) weight=val;
        }else if(REP_KEYWORDS.some(k=>before.includes(k)||after.includes(k))){
          if(reps==null) reps=val;
        }
      });
      // fallback: الأول وزن، الثاني تكرار
      if(weight==null && reps==null){
        weight=latinNums[0].val;
        reps=latinNums[1].val;
      }else if(weight==null){
        weight=latinNums.find(n=>n.val!==reps)?.val||null;
      }else if(reps==null){
        reps=latinNums.find(n=>n.val!==weight)?.val||null;
      }
    }
    // محاولة ٢: رقم لاتيني واحد فقط → اعتبره وزن (الأكثر شيوعاً)
    else if(latinNums.length===1 && weight==null){
      weight=latinNums[0].val;
    }

    // محاولة ٣: parser عربي للجملة كاملة (لو لم نجد لاتيني)
    if(weight==null && reps==null){
      // قسّم على REP_KEYWORDS / WEIGHT_KEYWORDS / SEP
      // ابحث عن أنماط "<num_ar> [تكرار|كيلو]" أو "[تكرار|كيلو] <num_ar>"
      for(let i=0;i<tokens.length;i++){
        if(WEIGHT_KEYWORDS.some(k=>tokens[i].includes(k))){
          // الكلمة بعدها أو قبلها رقم
          const next=_parseArabicNumber([tokens[i+1]].filter(Boolean));
          const prev=_parseArabicNumber([tokens[i-1]].filter(Boolean));
          if(next!=null) weight=next;
          else if(prev!=null) weight=prev;
        }else if(REP_KEYWORDS.some(k=>tokens[i].includes(k))){
          const next=_parseArabicNumber([tokens[i+1]].filter(Boolean));
          const prev=_parseArabicNumber([tokens[i-1]].filter(Boolean));
          if(next!=null) reps=next;
          else if(prev!=null) reps=prev;
        }
      }
      // محاولة أخيرة: استخرج كل أرقام عربية بترتيب — الأول وزن، الثاني تكرار
      if(weight==null && reps==null){
        const allNums=[];
        for(let i=0;i<tokens.length;i++){
          // كلمة + "و" + كلمة
          if(i+2<tokens.length && SEP_KEYWORDS.includes(tokens[i+1])){
            const n=_parseArabicNumber([tokens[i],tokens[i+1],tokens[i+2]]);
            if(n!=null){allNums.push(n);i+=2;continue}
          }
          const n=_parseArabicNumber([tokens[i]]);
          if(n!=null) allNums.push(n);
        }
        if(allNums.length>=2){weight=allNums[0];reps=allNums[1]}
        else if(allNums.length===1){weight=allNums[0]}
      }
    }

    // Sanity checks: أرقام معقولة
    if(weight!=null && (weight<0||weight>500)) weight=null;
    if(reps!=null && (reps<0||reps>100||!Number.isInteger(reps))) reps=null;

    return {weight, reps};
  }

  // ---------- UI ----------
  let _activeTrackDiv=null;
  let _activeRecognition=null;

  function _ensureOverlay(){
    let o=document.getElementById('voiceOverlay');
    if(o) return o;
    o=document.createElement('div');
    o.id='voiceOverlay';
    o.className='voice-overlay';
    o.innerHTML=`
      <div class="vo-card">
        <button class="vo-close" type="button" aria-label="إلغاء" onclick="cancelVoiceInput()">✕</button>
        <div class="vo-mic">🎤</div>
        <div class="vo-status" id="voStatus">جارٍ الاستماع…</div>
        <div class="vo-hint">قل: «عشرين خمسة» أو «20 5» — الأول وزن، الثاني تكرار</div>
        <div class="vo-transcript" id="voTranscript"></div>
        <button type="button" class="vo-cancel" onclick="cancelVoiceInput()">إلغاء</button>
      </div>
    `;
    document.body.appendChild(o);
    return o;
  }

  function _showOverlay(){
    const o=_ensureOverlay();
    o.classList.add('show');
  }
  function _hideOverlay(){
    const o=document.getElementById('voiceOverlay');
    if(o) o.classList.remove('show');
  }
  function _setStatus(txt){const el=document.getElementById('voStatus');if(el) el.textContent=txt}
  function _setTranscript(txt){const el=document.getElementById('voTranscript');if(el) el.textContent=txt}

  function startVoiceInput(trackDiv){
    if(!SR){showToast('⚠️ المتصفح لا يدعم الإدخال الصوتي','var(--red)');return}
    if(_activeRecognition){try{_activeRecognition.stop()}catch(e){}_activeRecognition=null}
    _activeTrackDiv=trackDiv;
    _showOverlay();
    _setStatus('جارٍ الاستماع…');
    _setTranscript('');

    const r=new SR();
    r.lang='ar-SA';      // عربي افتراضي
    r.interimResults=true;
    r.maxAlternatives=3;
    r.continuous=false;

    let finalText='';
    let interimText='';

    r.onresult=(event)=>{
      interimText='';
      for(let i=event.resultIndex;i<event.results.length;i++){
        const transcript=event.results[i][0].transcript;
        if(event.results[i].isFinal){
          finalText+=transcript+' ';
        }else{
          interimText+=transcript;
        }
      }
      _setTranscript((finalText+' '+interimText).trim());
    };

    r.onerror=(e)=>{
      console.warn('Voice recognition error:',e.error);
      _setStatus('⚠️ خطأ: '+(e.error||'unknown'));
      setTimeout(()=>_hideOverlay(),1800);
    };

    r.onend=()=>{
      // طبّق الـ parsing على النص النهائي
      const text=(finalText||interimText).trim();
      if(!text){
        _setStatus('⚠️ لم يُسمع شيء');
        setTimeout(()=>_hideOverlay(),1500);
        _activeRecognition=null;
        return;
      }
      const parsed=parseVoiceInput(text);
      _applyVoiceResult(_activeTrackDiv, parsed, text);
      _activeRecognition=null;
    };

    _activeRecognition=r;
    try{
      r.start();
    }catch(e){
      console.warn('Voice start failed:',e);
      _setStatus('⚠️ تعذّر بدء الاستماع');
      setTimeout(()=>_hideOverlay(),1500);
    }
  }

  function cancelVoiceInput(){
    if(_activeRecognition){try{_activeRecognition.abort()}catch(e){}_activeRecognition=null}
    _hideOverlay();
  }

  function _applyVoiceResult(trackDiv, parsed, originalText){
    if(!trackDiv){_hideOverlay();return}
    const wInput=trackDiv.querySelector('.weight-input');
    const rInput=trackDiv.querySelector('.reps-input');
    let applied=[];
    if(parsed.weight!=null && wInput){
      wInput.value=parsed.weight;
      wInput.dispatchEvent(new Event('input',{bubbles:true}));
      applied.push(`الوزن: ${parsed.weight}`);
    }
    if(parsed.reps!=null && rInput){
      rInput.value=parsed.reps;
      rInput.dispatchEvent(new Event('input',{bubbles:true}));
      applied.push(`التكرار: ${parsed.reps}`);
    }
    if(applied.length){
      _setStatus('✓ ' + applied.join(' · '));
      setTimeout(()=>_hideOverlay(),1200);
    }else{
      _setStatus('⚠️ لم أفهم الرقم — جرّب: «عشرين خمسة»');
      _setTranscript('سمعت: "'+originalText+'"');
      setTimeout(()=>_hideOverlay(),3000);
    }
  }

  // ---------- يضخّ زر 🎤 في كل track-input ----------
  function injectVoiceButtons(){
    if(!SR) return;
    document.querySelectorAll('.track-input').forEach(td=>{
      if(td.querySelector('.voice-btn')) return;
      // ابحث عن save button للوضع جنبه
      const saveBtn=td.querySelector('.save-btn');
      if(!saveBtn) return;
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='voice-btn';
      btn.innerHTML='🎤';
      btn.title='إدخال صوتي (وزن + تكرار)';
      btn.setAttribute('aria-label','إدخال صوتي');
      btn.onclick=(e)=>{e.stopPropagation();startVoiceInput(td)};
      saveBtn.parentNode.insertBefore(btn, saveBtn);
    });
  }

  // اضخّ بعد render البرنامج (مرة واحدة) + بعد كل re-render
  if(document.readyState!=='loading'){
    setTimeout(injectVoiceButtons, 1500);
  }else{
    window.addEventListener('DOMContentLoaded',()=>setTimeout(injectVoiceButtons,1500));
  }
  // re-inject عند تبديل البرنامج (program-templates يعيد بناء)
  // نستخدم MutationObserver خفيف على programContainer
  const _observerInit=()=>{
    const root=document.getElementById('programContainer');
    if(!root) return;
    const obs=new MutationObserver(()=>{
      // debounce
      clearTimeout(_observerInit._t);
      _observerInit._t=setTimeout(injectVoiceButtons,400);
    });
    obs.observe(root,{childList:true,subtree:true});
  };
  if(document.readyState==='complete') _observerInit();
  else window.addEventListener('load',_observerInit);

  // expose
  window.startVoiceInput=startVoiceInput;
  window.cancelVoiceInput=cancelVoiceInput;
  window.parseVoiceInput=parseVoiceInput;
  window.injectVoiceButtons=injectVoiceButtons;
})();
