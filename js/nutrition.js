/* ============================================================
 * BULK MODE V9.1 (A.3) — Nutrition Tracking
 * ============================================================
 * يدير الـ foodEntries store + modal بحث/إضافة + ربط مع Daily Log.
 *
 * foodEntry schema:
 *   { id (auto), date:'YYYY-MM-DD', foodId, name, grams,
 *     kcal, protein, carbs, fat, fiber, mealSlot, addedAt }
 *
 * mealSlot اختياري: 'breakfast'|'lunch'|'snack'|'pre'|'post'|'late'
 *
 * APIs:
 *   addFoodEntry({foodId, grams, mealSlot?})
 *   removeFoodEntry(id)
 *   getFoodEntriesForDate(date)
 *   getNutritionTotals(date)
 *
 * UI:
 *   openFoodSearch(mealSlot?)
 *   refreshFoodLogPanel(date)
 *
 * يُحمَّل بعد foods-database.js و data.js.
 * ============================================================ */

(function(){
  const E=(typeof escHTML==='function')?escHTML:(x=>String(x==null?'':x));

  // ---------- Public data layer ----------
  async function addFoodEntry({foodId, grams, mealSlot}){
    if(!foodId || !grams) throw new Error('foodId and grams required');
    const food=getFoodById(foodId);
    if(!food) throw new Error('Unknown foodId: '+foodId);
    const macros=computeFoodMacros(foodId, grams);
    const today=new Date().toISOString().split('T')[0];
    const entry={
      date:today,
      foodId,
      name:food.name,
      grams,
      kcal:macros.kcal,
      protein:macros.protein,
      carbs:macros.carbs,
      fat:macros.fat,
      fiber:macros.fiber,
      mealSlot:mealSlot||null,
      addedAt:new Date().toISOString()
    };
    const id=await db.add('foodEntries', entry);
    entry.id=id;
    return entry;
  }

  async function removeFoodEntry(id){
    await db.delete('foodEntries', id);
  }

  async function getFoodEntriesForDate(date){
    const all=await db.getAll('foodEntries','date',date).catch(()=>[]);
    return Array.isArray(all)?all:[];
  }

  async function getNutritionTotals(date){
    const entries=await getFoodEntriesForDate(date);
    const t={kcal:0,protein:0,carbs:0,fat:0,fiber:0,count:entries.length};
    for(const e of entries){
      t.kcal    += e.kcal||0;
      t.protein += e.protein||0;
      t.carbs   += e.carbs||0;
      t.fat     += e.fat||0;
      t.fiber   += e.fiber||0;
    }
    // round
    t.protein=Math.round(t.protein*10)/10;
    t.carbs  =Math.round(t.carbs*10)/10;
    t.fat    =Math.round(t.fat*10)/10;
    t.fiber  =Math.round(t.fiber*10)/10;
    return t;
  }

  // يقرأ هدف المستخدم لحساب progress %
  async function getNutritionTargets(){
    try{
      const rec=await db.get('settings',KEYS.USER_PROFILE);
      const p=rec&&rec.value;
      if(!p) return null;
      if(typeof computeNutritionTargets!=='function') return null;
      return computeNutritionTargets(p);
    }catch(e){return null}
  }

  // ---------- Food Search Modal ----------
  let _activeMealSlot=null;
  let _selectedFood=null;
  let _selectedGrams=null;

  function _ensureModal(){
    let modal=document.getElementById('foodSearchModal');
    if(modal) return modal;
    modal=document.createElement('div');
    modal.id='foodSearchModal';
    modal.className='stats-modal';
    modal.innerHTML=`
      <div class="stats-content food-search-content" style="position:relative">
        <button class="close-modal" onclick="closeFoodSearch()" aria-label="إغلاق">✕</button>
        <h2>🍽️ أضف وجبة</h2>
        <div class="bm-hint">اختر طعاماً من القائمة (أكثر من ٧٠ صنفاً). الماكروز تُحسب تلقائياً.</div>
        <div class="food-search-wrap">
          <input type="text" id="foodSearchInput" placeholder="🔍 ابحث (دجاج، أرز، تونة...)" autocomplete="off">
          <div class="food-cat-filter" id="foodCatFilter"></div>
        </div>
        <div id="foodSearchResults" class="food-search-results"></div>
        <div id="foodPortionPicker" class="food-portion-picker" style="display:none"></div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click',(e)=>{if(e.target.id==='foodSearchModal') closeFoodSearch()});
    // ربط الـ search
    const input=modal.querySelector('#foodSearchInput');
    let searchTimer=null;
    input.addEventListener('input',()=>{
      if(searchTimer) clearTimeout(searchTimer);
      searchTimer=setTimeout(()=>_renderResults(input.value,_currentCategory),120);
    });
    return modal;
  }

  let _currentCategory='all';
  function _renderCategories(){
    const wrap=document.getElementById('foodCatFilter');
    if(!wrap) return;
    const cats=['all',...listFoodCategories()];
    wrap.innerHTML=cats.map(c=>{
      const lbl=c==='all'?'الكل':(FOOD_CATEGORY_LABELS[c]||c);
      const active=c===_currentCategory?' active':'';
      return `<button type="button" class="fc-chip${active}" data-cat="${E(c)}">${E(lbl)}</button>`;
    }).join('');
    wrap.querySelectorAll('.fc-chip').forEach(b=>{
      b.onclick=()=>{
        _currentCategory=b.dataset.cat;
        _renderCategories();
        const input=document.getElementById('foodSearchInput');
        _renderResults(input?input.value:'', _currentCategory);
      };
    });
  }

  function _renderResults(query, category){
    const wrap=document.getElementById('foodSearchResults');
    if(!wrap) return;
    let foods=searchFoods(query, 100);
    if(category && category!=='all'){
      foods=foods.filter(f=>f.category===category);
    }
    if(!foods.length){
      wrap.innerHTML=`<div class="food-empty">⚠️ لا نتائج لـ "${E(query)}" — جرب اسم أبسط</div>`;
      return;
    }
    wrap.innerHTML=foods.map(f=>`
      <button type="button" class="food-result-card" data-food-id="${E(f.id)}">
        <div class="frc-main">
          <div class="frc-name">${E(f.name)}</div>
          <div class="frc-macros">
            <span class="frc-macro frc-kcal">${E(f.kcal)} كسعرة</span>
            <span class="frc-macro frc-p">${E(f.protein)}g بروتين</span>
            <span class="frc-macro frc-c">${E(f.carbs)}g كارب</span>
            <span class="frc-macro frc-f">${E(f.fat)}g دهون</span>
          </div>
          <div class="frc-per">لكل ١٠٠ جم</div>
        </div>
        <div class="frc-add">+</div>
      </button>
    `).join('');
    wrap.querySelectorAll('.food-result-card').forEach(card=>{
      card.onclick=()=>_pickPortion(card.dataset.foodId);
    });
  }

  function _pickPortion(foodId){
    const food=getFoodById(foodId);
    if(!food) return;
    _selectedFood=food;
    _selectedGrams=food.defaultServingG||100;
    const picker=document.getElementById('foodPortionPicker');
    const results=document.getElementById('foodSearchResults');
    if(!picker || !results) return;
    results.style.display='none';
    picker.style.display='block';
    _renderPicker();
  }

  function _renderPicker(){
    const picker=document.getElementById('foodPortionPicker');
    if(!picker || !_selectedFood) return;
    const f=_selectedFood;
    const g=_selectedGrams||f.defaultServingG||100;
    const macros=computeFoodMacros(f.id, g);
    const servings=f.commonServings||[{label:'حصة',g:f.defaultServingG||100}];
    picker.innerHTML=`
      <div class="fpp-head">
        <button type="button" class="fpp-back" onclick="document.getElementById('foodPortionPicker').style.display='none';document.getElementById('foodSearchResults').style.display=''">← رجوع للبحث</button>
        <div class="fpp-name">${E(f.name)}</div>
      </div>
      <div class="fpp-servings">
        <div class="fpp-label">اختر الحصة:</div>
        <div class="fpp-chips">
          ${servings.map((s,i)=>`<button type="button" class="fpp-chip${s.g===g?' active':''}" data-g="${s.g}">${E(s.label)}<small>${s.g} جم</small></button>`).join('')}
        </div>
        <div class="fpp-custom">
          <label>أو أدخل وزن مخصص (جم):</label>
          <input type="number" inputmode="decimal" step="5" min="5" max="2000" id="fppCustomGrams" value="${g}">
        </div>
      </div>
      <div class="fpp-macros">
        <div class="fpp-mac"><b>${E(macros.kcal)}</b><span>كسعرة</span></div>
        <div class="fpp-mac"><b>${E(macros.protein)}g</b><span>بروتين</span></div>
        <div class="fpp-mac"><b>${E(macros.carbs)}g</b><span>كارب</span></div>
        <div class="fpp-mac"><b>${E(macros.fat)}g</b><span>دهون</span></div>
      </div>
      <button type="button" class="fpp-confirm" onclick="confirmAddFood()">✓ أضف للوجبات اليوم</button>
    `;
    // bind chips + input
    picker.querySelectorAll('.fpp-chip').forEach(c=>{
      c.onclick=()=>{ _selectedGrams=Number(c.dataset.g); _renderPicker(); };
    });
    const ci=document.getElementById('fppCustomGrams');
    if(ci){
      let t=null;
      ci.addEventListener('input',()=>{
        if(t) clearTimeout(t);
        t=setTimeout(()=>{
          const v=parseFloat(ci.value);
          if(v>0 && v<5000){_selectedGrams=v;_renderPicker(); const ni=document.getElementById('fppCustomGrams');if(ni){ni.focus();ni.setSelectionRange(ni.value.length,ni.value.length)}}
        },300);
      });
    }
  }

  async function confirmAddFood(){
    if(!_selectedFood || !_selectedGrams) return;
    try{
      const entry=await addFoodEntry({foodId:_selectedFood.id, grams:_selectedGrams, mealSlot:_activeMealSlot});
      showToast(`✓ أُضيفت: ${entry.name}`,'var(--grn)');
      closeFoodSearch();
      // حدّث Daily Log & Dashboard
      if(typeof refreshFoodLogPanel==='function') refreshFoodLogPanel();
      if(typeof refreshDashboard==='function') refreshDashboard();
    }catch(e){
      console.error('confirmAddFood failed:',e);
      showToast('⚠️ تعذّر الإضافة','var(--red)');
    }
  }

  function openFoodSearch(mealSlot){
    _activeMealSlot=mealSlot||null;
    _selectedFood=null;
    _selectedGrams=null;
    _currentCategory='all';
    const modal=_ensureModal();
    modal.classList.add('open');
    document.body.style.overflow='hidden';
    _renderCategories();
    _renderResults('','all');
    // إخفاء الـ picker لو ظاهر من فتح سابق
    const picker=document.getElementById('foodPortionPicker');
    const results=document.getElementById('foodSearchResults');
    if(picker) picker.style.display='none';
    if(results) results.style.display='';
    // فوكس على البحث (بعد transition)
    setTimeout(()=>{
      const input=document.getElementById('foodSearchInput');
      if(input){input.value='';input.focus()}
    },120);
  }

  function closeFoodSearch(){
    const modal=document.getElementById('foodSearchModal');
    if(modal) modal.classList.remove('open');
    document.body.style.overflow='';
  }

  // ---------- Food Log Panel (داخل Daily Log) ----------
  async function refreshFoodLogPanel(){
    const panel=document.getElementById('foodLogPanel');
    if(!panel) return;
    const dateInput=document.getElementById('dlDate');
    const date=(dateInput&&dateInput.value)||new Date().toISOString().split('T')[0];
    const entries=await getFoodEntriesForDate(date);
    const totals=await getNutritionTotals(date);
    const targets=await getNutritionTargets();

    const targetsHtml=targets?`
      <div class="flp-targets">
        ${_progressBar('السعرات', totals.kcal, targets.calories, 'kcal')}
        ${_progressBar('البروتين', totals.protein, targets.protein, 'g')}
        ${_progressBar('الكارب', totals.carbs, targets.carb, 'g')}
        ${_progressBar('الدهون', totals.fat, targets.fat, 'g')}
      </div>`:`
      <div class="flp-totals-simple">
        <div><b>${totals.kcal}</b> سعرة</div>
        <div><b>${totals.protein}g</b> بروتين</div>
        <div><b>${totals.carbs}g</b> كارب</div>
        <div><b>${totals.fat}g</b> دهون</div>
      </div>
      <div class="flp-hint">💡 أكمل ملفك الشخصي لرؤية النسب مقابل أهدافك.</div>`;

    const entriesHtml=entries.length?entries.map(e=>`
      <div class="flp-entry">
        <div class="flp-entry-main">
          <div class="flp-entry-name">${E(e.name)}</div>
          <div class="flp-entry-meta">${E(e.grams)} جم · ${E(e.kcal)} سعرة · ${E(e.protein)}g بروتين</div>
        </div>
        <button type="button" class="flp-entry-del" onclick="deleteFoodEntry(${E(e.id)})" aria-label="حذف">×</button>
      </div>
    `).join(''):`<div class="flp-empty">لم تُسجَّل أي وجبة بعد. اضغط <b>+ أضف طعاماً</b> لتبدأ.</div>`;

    panel.innerHTML=`
      <div class="flp-head">
        <span>🍽️ وجبات اليوم (${E(entries.length)})</span>
        <button type="button" class="flp-add" onclick="openFoodSearch()">+ أضف طعاماً</button>
      </div>
      ${targetsHtml}
      <div class="flp-entries">${entriesHtml}</div>
    `;
  }

  function _progressBar(label, val, target, unit){
    const pct=target?Math.min(150, Math.round((val/target)*100)):0;
    const cls=pct<70?'low':pct<=110?'ok':'high';
    return `
      <div class="flp-bar flp-bar-${cls}">
        <div class="flp-bar-row">
          <span class="flp-bar-label">${E(label)}</span>
          <span class="flp-bar-val"><b>${E(val)}</b>/${E(target)} ${E(unit)} <small>(${E(pct)}%)</small></span>
        </div>
        <div class="flp-bar-track"><div class="flp-bar-fill" style="width:${Math.min(100,pct)}%"></div></div>
      </div>`;
  }

  async function deleteFoodEntry(id){
    try{
      await removeFoodEntry(id);
      showToast('✓ حُذف','var(--g2)');
      if(typeof refreshFoodLogPanel==='function') refreshFoodLogPanel();
      if(typeof refreshDashboard==='function') refreshDashboard();
    }catch(e){console.error('delete food entry failed:',e)}
  }

  // expose
  window.addFoodEntry=addFoodEntry;
  window.removeFoodEntry=removeFoodEntry;
  window.getFoodEntriesForDate=getFoodEntriesForDate;
  window.getNutritionTotals=getNutritionTotals;
  window.getNutritionTargets=getNutritionTargets;
  window.openFoodSearch=openFoodSearch;
  window.closeFoodSearch=closeFoodSearch;
  window.confirmAddFood=confirmAddFood;
  window.refreshFoodLogPanel=refreshFoodLogPanel;
  window.deleteFoodEntry=deleteFoodEntry;
})();
