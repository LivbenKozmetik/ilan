// Enhanced i18n: loads from JSON files, supports tr/en
const dictionaries = {};
let locale = localStorage.getItem('ilan_locale') || 'tr';
let isLoaded = false;
const listeners = [];

async function loadDictionaries() {
  try {
    const [trResponse, enResponse] = await Promise.all([
      fetch('./locales/tr.json'),
      fetch('./locales/en.json')
    ]);
    
    dictionaries.tr = await trResponse.json();
    dictionaries.en = await enResponse.json();
    isLoaded = true;
  } catch (error) {
    console.error('Failed to load dictionaries:', error);
    // Fallback dictionaries
    dictionaries.tr = {
      "nav.home":"Anasayfa",
      "nav.categories":"Kategoriler",
      "nav.storefront":"Vitrin",
      "home.heroTitle":"Öne çıkan ilanlar",
      "home.heroSubtitle":"Güncel ve güvenilir ilanlar",
      "home.filters":"Filtreler",
      "footer.note":"Demo — veriler localStorage'da saklanır."
    };
    dictionaries.en = {
      "nav.home":"Home",
      "nav.categories":"Categories",
      "nav.storefront":"Showcase",
      "home.heroTitle":"Featured listings",
      "home.heroSubtitle":"Fresh and trusted listings",
      "home.filters":"Filters",
      "footer.note":"Demo — data stored in localStorage."
    };
    isLoaded = true;
  }
}

export const i18n = {
  getLocale(){ return locale; },
  async setLocale(lng){
    if(dictionaries[lng]) locale = lng;
    try { localStorage.setItem('ilan_locale', locale); } catch(e){}
    listeners.forEach(fn=>fn(locale));
  },
  t(key){ 
    if (!isLoaded) return key;
    return (dictionaries[locale] && dictionaries[locale][key]) ? dictionaries[locale][key] : key; 
  },
  onChange(fn){ listeners.push(fn); },
  async init() {
    if (!isLoaded) {
      await loadDictionaries();
    }
    return this;
  }
};