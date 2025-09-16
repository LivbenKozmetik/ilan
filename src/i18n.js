// minimal i18n: tr/en, sync access for templates using dataset keys
const dictionaries = {
  tr: {
    "nav.home":"Anasayfa",
    "nav.categories":"Kategoriler",
    "nav.storefront":"Vitrin",
    "home.heroTitle":"Öne çıkan ilanlar",
    "home.heroSubtitle":"Güncel ve güvenilir ilanlar",
    "home.filters":"Filtreler",
    "footer.note":"Demo — veriler localStorage'da saklanır."
  },
  en: {
    "nav.home":"Home",
    "nav.categories":"Categories",
    "nav.storefront":"Showcase",
    "home.heroTitle":"Featured listings",
    "home.heroSubtitle":"Fresh and trusted listings",
    "home.filters":"Filters",
    "footer.note":"Demo — data stored in localStorage."
  }
};
let locale = localStorage.getItem('ilan_locale') || 'tr';
const listeners = [];
export const i18n = {
  getLocale(){ return locale; },
  async setLocale(lng){
    if(dictionaries[lng]) locale = lng;
    try { localStorage.setItem('ilan_locale', locale); } catch(e){}
    listeners.forEach(fn=>fn(locale));
  },
  t(key){ return (dictionaries[locale] && dictionaries[locale][key]) ? dictionaries[locale][key] : key; },
  onChange(fn){ listeners.push(fn); }
};