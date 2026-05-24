/* ============================================================
 * BULK MODE V9.1 (A.3) — Foods Database
 * ============================================================
 * قاعدة بيانات أطعمة محلية (~80 صنف) مخصصة للمستخدم العربي/الخليجي.
 * كل قيمة per 100g — التحويل للحصة الفعلية يحصل في UI.
 *
 * المصادر:
 *   - USDA FoodData Central (للأرقام الأساسية)
 *   - وزارة الصحة السعودية (للأطعمة المحلية)
 *
 * كل صنف:
 *   { id, name (ar), nameEn, category, kcal, protein, carbs, fat, fiber,
 *     defaultServingG, commonServings:[{label,g}] }
 *
 * categories:
 *   protein, carbs, dairy, fats, veggie, fruit, sweet, drink, snack
 * ============================================================ */

const FOODS_DATABASE = [
  // ============ بروتين حيواني ============
  { id:'chicken_breast_grilled', name:'صدر دجاج مشوي', nameEn:'Chicken Breast (grilled)', category:'protein',
    kcal:165, protein:31, carbs:0, fat:3.6, fiber:0,
    defaultServingG:150, commonServings:[{label:'صدر صغير',g:100},{label:'صدر متوسط',g:150},{label:'صدر كبير',g:200}] },
  { id:'chicken_thigh', name:'فخذ دجاج', nameEn:'Chicken Thigh', category:'protein',
    kcal:209, protein:26, carbs:0, fat:11, fiber:0,
    defaultServingG:120, commonServings:[{label:'فخذ',g:120},{label:'فخذين',g:240}] },
  { id:'beef_lean', name:'لحم بقري قليل الدهن', nameEn:'Lean Beef', category:'protein',
    kcal:217, protein:26, carbs:0, fat:12, fiber:0,
    defaultServingG:150, commonServings:[{label:'حصة صغيرة',g:100},{label:'حصة متوسطة',g:150}] },
  { id:'lamb', name:'لحم ضأن', nameEn:'Lamb', category:'protein',
    kcal:294, protein:25, carbs:0, fat:21, fiber:0,
    defaultServingG:150, commonServings:[{label:'حصة',g:150}] },
  { id:'turkey', name:'ديك رومي', nameEn:'Turkey', category:'protein',
    kcal:135, protein:30, carbs:0, fat:1, fiber:0,
    defaultServingG:150, commonServings:[{label:'حصة',g:150}] },
  { id:'fish_tuna_canned', name:'تونة معلّبة (بالماء)', nameEn:'Tuna (canned in water)', category:'protein',
    kcal:116, protein:25, carbs:0, fat:1, fiber:0,
    defaultServingG:120, commonServings:[{label:'علبة صغيرة',g:120},{label:'علبة كبيرة',g:185}] },
  { id:'salmon', name:'سلمون', nameEn:'Salmon', category:'protein',
    kcal:208, protein:20, carbs:0, fat:13, fiber:0,
    defaultServingG:150, commonServings:[{label:'شريحة',g:150}] },
  { id:'shrimp', name:'روبيان مشوي', nameEn:'Shrimp (grilled)', category:'protein',
    kcal:99, protein:24, carbs:0.2, fat:0.3, fiber:0,
    defaultServingG:120, commonServings:[{label:'حصة',g:120}] },
  { id:'egg_whole', name:'بيضة كاملة', nameEn:'Egg (whole)', category:'protein',
    kcal:155, protein:13, carbs:1.1, fat:11, fiber:0,
    defaultServingG:50, commonServings:[{label:'بيضة',g:50},{label:'بيضتين',g:100},{label:'٣ بيضات',g:150}] },
  { id:'egg_white', name:'بياض بيض', nameEn:'Egg White', category:'protein',
    kcal:52, protein:11, carbs:0.7, fat:0.2, fiber:0,
    defaultServingG:33, commonServings:[{label:'بياض ١',g:33},{label:'٣ بياضات',g:100}] },

  // ============ ألبان ============
  { id:'greek_yogurt_full', name:'زبادي يوناني (كامل الدسم)', nameEn:'Greek Yogurt (full-fat)', category:'dairy',
    kcal:97, protein:9, carbs:3.8, fat:5, fiber:0,
    defaultServingG:200, commonServings:[{label:'علبة',g:200},{label:'نص علبة',g:100}] },
  { id:'greek_yogurt_low', name:'زبادي يوناني (قليل الدسم)', nameEn:'Greek Yogurt (low-fat)', category:'dairy',
    kcal:59, protein:10, carbs:3.6, fat:0.4, fiber:0,
    defaultServingG:200, commonServings:[{label:'علبة',g:200}] },
  { id:'milk_whole', name:'حليب كامل الدسم', nameEn:'Whole Milk', category:'dairy',
    kcal:61, protein:3.2, carbs:4.8, fat:3.3, fiber:0,
    defaultServingG:250, commonServings:[{label:'كوب',g:250},{label:'نص كوب',g:125}] },
  { id:'milk_low', name:'حليب قليل الدسم', nameEn:'Low-fat Milk', category:'dairy',
    kcal:42, protein:3.4, carbs:5, fat:1, fiber:0,
    defaultServingG:250, commonServings:[{label:'كوب',g:250}] },
  { id:'cheese_qareesh', name:'جبن قريش', nameEn:'Cottage Cheese (Qareesh)', category:'dairy',
    kcal:98, protein:11, carbs:3.4, fat:4.3, fiber:0,
    defaultServingG:100, commonServings:[{label:'حصة',g:100}] },
  { id:'cheese_feta', name:'جبن فيتا', nameEn:'Feta Cheese', category:'dairy',
    kcal:264, protein:14, carbs:4.1, fat:21, fiber:0,
    defaultServingG:30, commonServings:[{label:'شريحة',g:30}] },
  { id:'labneh', name:'لبنة', nameEn:'Labneh', category:'dairy',
    kcal:130, protein:7, carbs:5, fat:9, fiber:0,
    defaultServingG:50, commonServings:[{label:'ملعقتين',g:50}] },

  // ============ نشويات / حبوب ============
  { id:'rice_white_cooked', name:'أرز أبيض مطبوخ', nameEn:'White Rice (cooked)', category:'carbs',
    kcal:130, protein:2.7, carbs:28, fat:0.3, fiber:0.4,
    defaultServingG:200, commonServings:[{label:'كوب',g:200},{label:'نص كوب',g:100},{label:'كوب ونص',g:300}] },
  { id:'rice_basmati', name:'أرز بسمتي مطبوخ', nameEn:'Basmati Rice', category:'carbs',
    kcal:121, protein:3, carbs:25, fat:0.4, fiber:0.4,
    defaultServingG:200, commonServings:[{label:'كوب',g:200}] },
  { id:'rice_brown', name:'أرز أسمر', nameEn:'Brown Rice', category:'carbs',
    kcal:111, protein:2.6, carbs:23, fat:0.9, fiber:1.8,
    defaultServingG:200, commonServings:[{label:'كوب',g:200}] },
  { id:'oats', name:'شوفان جاف', nameEn:'Oats (dry)', category:'carbs',
    kcal:389, protein:17, carbs:66, fat:7, fiber:11,
    defaultServingG:50, commonServings:[{label:'نص كوب',g:50},{label:'كوب',g:100}] },
  { id:'bread_white', name:'خبز أبيض', nameEn:'White Bread', category:'carbs',
    kcal:265, protein:9, carbs:49, fat:3.2, fiber:2.7,
    defaultServingG:30, commonServings:[{label:'شريحة',g:30},{label:'شريحتين',g:60}] },
  { id:'bread_brown', name:'خبز أسمر', nameEn:'Brown Bread', category:'carbs',
    kcal:247, protein:13, carbs:41, fat:3.4, fiber:7,
    defaultServingG:30, commonServings:[{label:'شريحة',g:30},{label:'شريحتين',g:60}] },
  { id:'pita_white', name:'خبز عربي (تميس)', nameEn:'Pita Bread', category:'carbs',
    kcal:275, protein:9, carbs:55, fat:1.2, fiber:2.2,
    defaultServingG:60, commonServings:[{label:'رغيف صغير',g:60},{label:'رغيف كبير',g:100}] },
  { id:'pasta_cooked', name:'معكرونة مطبوخة', nameEn:'Pasta (cooked)', category:'carbs',
    kcal:158, protein:5.8, carbs:31, fat:0.9, fiber:1.8,
    defaultServingG:200, commonServings:[{label:'كوب',g:200},{label:'كوب ونص',g:300}] },
  { id:'potato_boiled', name:'بطاطس مسلوقة', nameEn:'Potato (boiled)', category:'carbs',
    kcal:87, protein:1.9, carbs:20, fat:0.1, fiber:1.8,
    defaultServingG:200, commonServings:[{label:'حبة متوسطة',g:200},{label:'حبة كبيرة',g:300}] },
  { id:'sweet_potato', name:'بطاطا حلوة', nameEn:'Sweet Potato', category:'carbs',
    kcal:86, protein:1.6, carbs:20, fat:0.1, fiber:3,
    defaultServingG:200, commonServings:[{label:'حبة',g:200}] },
  { id:'bulgur', name:'برغل', nameEn:'Bulgur', category:'carbs',
    kcal:83, protein:3.1, carbs:19, fat:0.2, fiber:4.5,
    defaultServingG:150, commonServings:[{label:'كوب',g:150}] },
  { id:'quinoa', name:'كينوا مطبوخة', nameEn:'Quinoa (cooked)', category:'carbs',
    kcal:120, protein:4.4, carbs:21, fat:1.9, fiber:2.8,
    defaultServingG:150, commonServings:[{label:'كوب',g:150}] },
  { id:'lentils_cooked', name:'عدس مطبوخ', nameEn:'Lentils (cooked)', category:'carbs',
    kcal:116, protein:9, carbs:20, fat:0.4, fiber:8,
    defaultServingG:200, commonServings:[{label:'كوب',g:200}] },
  { id:'chickpeas_cooked', name:'حمص مطبوخ', nameEn:'Chickpeas (cooked)', category:'carbs',
    kcal:164, protein:8.9, carbs:27, fat:2.6, fiber:7.6,
    defaultServingG:160, commonServings:[{label:'كوب',g:160}] },
  { id:'fava_beans', name:'فول', nameEn:'Fava Beans', category:'carbs',
    kcal:110, protein:8, carbs:19, fat:0.4, fiber:5,
    defaultServingG:200, commonServings:[{label:'صحن',g:200}] },

  // ============ دهون صحية / مكسرات ============
  { id:'olive_oil', name:'زيت زيتون', nameEn:'Olive Oil', category:'fats',
    kcal:884, protein:0, carbs:0, fat:100, fiber:0,
    defaultServingG:10, commonServings:[{label:'ملعقة صغيرة',g:5},{label:'ملعقة كبيرة',g:14}] },
  { id:'almonds', name:'لوز', nameEn:'Almonds', category:'fats',
    kcal:579, protein:21, carbs:22, fat:50, fiber:12,
    defaultServingG:25, commonServings:[{label:'حفنة',g:25},{label:'حفنتين',g:50}] },
  { id:'cashews', name:'كاجو', nameEn:'Cashews', category:'fats',
    kcal:553, protein:18, carbs:30, fat:44, fiber:3.3,
    defaultServingG:25, commonServings:[{label:'حفنة',g:25}] },
  { id:'walnuts', name:'جوز', nameEn:'Walnuts', category:'fats',
    kcal:654, protein:15, carbs:14, fat:65, fiber:6.7,
    defaultServingG:25, commonServings:[{label:'حفنة',g:25}] },
  { id:'peanut_butter', name:'زبدة الفول السوداني', nameEn:'Peanut Butter', category:'fats',
    kcal:588, protein:25, carbs:20, fat:50, fiber:6,
    defaultServingG:16, commonServings:[{label:'ملعقة كبيرة',g:16},{label:'ملعقتين',g:32}] },
  { id:'tahini', name:'طحينة', nameEn:'Tahini', category:'fats',
    kcal:595, protein:17, carbs:21, fat:54, fiber:9.3,
    defaultServingG:15, commonServings:[{label:'ملعقة',g:15}] },
  { id:'avocado', name:'أفوكادو', nameEn:'Avocado', category:'fats',
    kcal:160, protein:2, carbs:9, fat:15, fiber:7,
    defaultServingG:100, commonServings:[{label:'نص حبة',g:100},{label:'حبة كاملة',g:200}] },

  // ============ خضار ============
  { id:'salad_mixed', name:'سلطة خضراء (خس+طماط+خيار)', nameEn:'Mixed Green Salad', category:'veggie',
    kcal:18, protein:1, carbs:3.6, fat:0.2, fiber:1.7,
    defaultServingG:200, commonServings:[{label:'صحن صغير',g:150},{label:'صحن متوسط',g:200},{label:'صحن كبير',g:300}] },
  { id:'tomato', name:'طماط', nameEn:'Tomato', category:'veggie',
    kcal:18, protein:0.9, carbs:3.9, fat:0.2, fiber:1.2,
    defaultServingG:100, commonServings:[{label:'حبة',g:100}] },
  { id:'cucumber', name:'خيار', nameEn:'Cucumber', category:'veggie',
    kcal:15, protein:0.7, carbs:3.6, fat:0.1, fiber:0.5,
    defaultServingG:100, commonServings:[{label:'حبة',g:100}] },
  { id:'broccoli_cooked', name:'بروكلي مطبوخ', nameEn:'Broccoli (cooked)', category:'veggie',
    kcal:35, protein:2.4, carbs:7, fat:0.4, fiber:3.3,
    defaultServingG:150, commonServings:[{label:'حصة',g:150}] },
  { id:'carrot', name:'جزر', nameEn:'Carrot', category:'veggie',
    kcal:41, protein:0.9, carbs:9.6, fat:0.2, fiber:2.8,
    defaultServingG:100, commonServings:[{label:'حبة',g:100}] },
  { id:'spinach', name:'سبانخ', nameEn:'Spinach', category:'veggie',
    kcal:23, protein:2.9, carbs:3.6, fat:0.4, fiber:2.2,
    defaultServingG:100, commonServings:[{label:'حصة',g:100}] },
  { id:'onion', name:'بصل', nameEn:'Onion', category:'veggie',
    kcal:40, protein:1.1, carbs:9.3, fat:0.1, fiber:1.7,
    defaultServingG:50, commonServings:[{label:'نص بصلة',g:50}] },
  { id:'bell_pepper', name:'فلفل رومي', nameEn:'Bell Pepper', category:'veggie',
    kcal:31, protein:1, carbs:6, fat:0.3, fiber:2.1,
    defaultServingG:100, commonServings:[{label:'حبة',g:100}] },

  // ============ فواكه ============
  { id:'banana', name:'موز', nameEn:'Banana', category:'fruit',
    kcal:89, protein:1.1, carbs:23, fat:0.3, fiber:2.6,
    defaultServingG:120, commonServings:[{label:'حبة متوسطة',g:120},{label:'حبة كبيرة',g:150}] },
  { id:'apple', name:'تفاح', nameEn:'Apple', category:'fruit',
    kcal:52, protein:0.3, carbs:14, fat:0.2, fiber:2.4,
    defaultServingG:180, commonServings:[{label:'حبة',g:180}] },
  { id:'orange', name:'برتقال', nameEn:'Orange', category:'fruit',
    kcal:47, protein:0.9, carbs:12, fat:0.1, fiber:2.4,
    defaultServingG:130, commonServings:[{label:'حبة',g:130}] },
  { id:'dates', name:'تمر', nameEn:'Dates', category:'fruit',
    kcal:282, protein:2.5, carbs:75, fat:0.4, fiber:8,
    defaultServingG:24, commonServings:[{label:'تمرة',g:8},{label:'٣ تمرات',g:24},{label:'٥ تمرات',g:40}] },
  { id:'grapes', name:'عنب', nameEn:'Grapes', category:'fruit',
    kcal:67, protein:0.6, carbs:17, fat:0.4, fiber:0.9,
    defaultServingG:150, commonServings:[{label:'صحن صغير',g:150}] },
  { id:'mango', name:'مانجو', nameEn:'Mango', category:'fruit',
    kcal:60, protein:0.8, carbs:15, fat:0.4, fiber:1.6,
    defaultServingG:200, commonServings:[{label:'حبة صغيرة',g:200}] },
  { id:'watermelon', name:'بطيخ', nameEn:'Watermelon', category:'fruit',
    kcal:30, protein:0.6, carbs:7.6, fat:0.2, fiber:0.4,
    defaultServingG:300, commonServings:[{label:'شريحة',g:300}] },
  { id:'strawberry', name:'فراولة', nameEn:'Strawberries', category:'fruit',
    kcal:32, protein:0.7, carbs:7.7, fat:0.3, fiber:2,
    defaultServingG:150, commonServings:[{label:'كوب',g:150}] },

  // ============ مكملات / بودرة ============
  { id:'whey_protein', name:'واي بروتين (سكوب)', nameEn:'Whey Protein (1 scoop)', category:'protein',
    kcal:120, protein:24, carbs:3, fat:1.5, fiber:0,
    defaultServingG:30, commonServings:[{label:'سكوب',g:30},{label:'سكوبين',g:60}] },
  { id:'creatine', name:'كرياتين مونوهيدرات', nameEn:'Creatine Monohydrate', category:'protein',
    kcal:0, protein:0, carbs:0, fat:0, fiber:0,
    defaultServingG:5, commonServings:[{label:'٥ جم',g:5}] },

  // ============ حلويات / سناك (للسعرات) ============
  { id:'honey', name:'عسل', nameEn:'Honey', category:'sweet',
    kcal:304, protein:0.3, carbs:82, fat:0, fiber:0.2,
    defaultServingG:21, commonServings:[{label:'ملعقة',g:21}] },
  { id:'chocolate_dark', name:'شوكولاتة داكنة 70%', nameEn:'Dark Chocolate 70%', category:'sweet',
    kcal:598, protein:7.8, carbs:46, fat:43, fiber:11,
    defaultServingG:25, commonServings:[{label:'قطعة',g:25}] },
  { id:'protein_bar', name:'بروتين بار', nameEn:'Protein Bar', category:'snack',
    kcal:200, protein:20, carbs:20, fat:6, fiber:3,
    defaultServingG:60, commonServings:[{label:'بار',g:60}] },

  // ============ مشروبات ============
  { id:'water', name:'ماء', nameEn:'Water', category:'drink',
    kcal:0, protein:0, carbs:0, fat:0, fiber:0,
    defaultServingG:250, commonServings:[{label:'كوب',g:250},{label:'زجاجة',g:500},{label:'لتر',g:1000}] },
  { id:'coffee_black', name:'قهوة سوداء (بدون سكر)', nameEn:'Black Coffee', category:'drink',
    kcal:2, protein:0.3, carbs:0, fat:0, fiber:0,
    defaultServingG:240, commonServings:[{label:'كوب',g:240}] },
  { id:'tea_unsweetened', name:'شاي بدون سكر', nameEn:'Tea (unsweetened)', category:'drink',
    kcal:1, protein:0, carbs:0.3, fat:0, fiber:0,
    defaultServingG:240, commonServings:[{label:'كوب',g:240}] },
  { id:'orange_juice', name:'عصير برتقال طازج', nameEn:'Orange Juice', category:'drink',
    kcal:45, protein:0.7, carbs:10, fat:0.2, fiber:0.2,
    defaultServingG:250, commonServings:[{label:'كوب',g:250}] },

  // ============ أطعمة جاهزة عربية شعبية ============
  { id:'kabsa_chicken', name:'كبسة دجاج', nameEn:'Chicken Kabsa', category:'carbs',
    kcal:185, protein:11, carbs:25, fat:5, fiber:1.5,
    defaultServingG:350, commonServings:[{label:'صحن صغير',g:300},{label:'صحن متوسط',g:400},{label:'صحن كبير',g:500}] },
  { id:'shawarma_chicken', name:'شاورما دجاج', nameEn:'Chicken Shawarma', category:'protein',
    kcal:220, protein:18, carbs:14, fat:11, fiber:1,
    defaultServingG:250, commonServings:[{label:'سندوتش',g:250},{label:'حصة',g:300}] },
  { id:'falafel', name:'فلافل', nameEn:'Falafel', category:'protein',
    kcal:333, protein:13, carbs:32, fat:18, fiber:5,
    defaultServingG:60, commonServings:[{label:'٤ حبات',g:60}] },
  { id:'hummus', name:'حمص بالطحينة', nameEn:'Hummus', category:'fats',
    kcal:166, protein:8, carbs:14, fat:10, fiber:6,
    defaultServingG:100, commonServings:[{label:'صحن صغير',g:100}] },
  { id:'mutabbal', name:'متبّل (بابا غنوج)', nameEn:'Baba Ghanouj', category:'veggie',
    kcal:90, protein:2, carbs:9, fat:6, fiber:3,
    defaultServingG:100, commonServings:[{label:'صحن صغير',g:100}] },
  { id:'foul_medames', name:'فول مدمس', nameEn:'Foul Medames', category:'carbs',
    kcal:135, protein:8, carbs:18, fat:4, fiber:7,
    defaultServingG:200, commonServings:[{label:'صحن',g:200}] },
  { id:'tabbouleh', name:'تبولة', nameEn:'Tabbouleh', category:'veggie',
    kcal:120, protein:3, carbs:14, fat:7, fiber:3,
    defaultServingG:150, commonServings:[{label:'صحن',g:150}] }
];

// ============ Helpers ============
function getFoodById(id){
  return FOODS_DATABASE.find(f=>f.id===id) || null;
}

function searchFoods(query, limit=20){
  const q = (query||'').trim().toLowerCase();
  if(!q) return FOODS_DATABASE.slice(0, limit);
  // Match against name (ar) أو nameEn — case-insensitive + simple includes
  return FOODS_DATABASE
    .filter(f => f.name.toLowerCase().includes(q) || (f.nameEn||'').toLowerCase().includes(q))
    .slice(0, limit);
}

function listFoodCategories(){
  const cats = new Set(FOODS_DATABASE.map(f=>f.category));
  return Array.from(cats);
}

// يحسب macros لحصة معينة بالجرامات
function computeFoodMacros(foodId, grams){
  const f = getFoodById(foodId);
  if(!f || !grams) return null;
  const factor = grams/100;
  return {
    grams,
    kcal:    Math.round(f.kcal * factor),
    protein: Math.round(f.protein * factor * 10)/10,
    carbs:   Math.round(f.carbs * factor * 10)/10,
    fat:     Math.round(f.fat * factor * 10)/10,
    fiber:   Math.round((f.fiber||0) * factor * 10)/10
  };
}

const FOOD_CATEGORY_LABELS = {
  protein:'بروتين', carbs:'نشويات', dairy:'ألبان', fats:'دهون',
  veggie:'خضار', fruit:'فاكهة', sweet:'حلويات', drink:'مشروبات', snack:'سناك'
};

// expose
window.FOODS_DATABASE = FOODS_DATABASE;
window.getFoodById = getFoodById;
window.searchFoods = searchFoods;
window.listFoodCategories = listFoodCategories;
window.computeFoodMacros = computeFoodMacros;
window.FOOD_CATEGORY_LABELS = FOOD_CATEGORY_LABELS;
