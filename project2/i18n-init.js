// Basit i18n loader — include this after your main scripts.js (defer).
(function () {
  const defaultLang = 'tr';
  function loadLocale(lang) {
    return fetch(`/locales/${lang}.json`).then(r => r.ok ? r.json() : {});
  }
  function applyTranslations(trans) {
    document.querySelectorAll('[data-i18n-key]').forEach(el => {
      const key = el.getAttribute('data-i18n-key');
      if (!key) return;
      const txt = trans[key] || key;
      if (el.placeholder !== undefined && el.tagName === 'INPUT') el.placeholder = txt;
      else el.textContent = txt;
    });
  }
  async function init() {
    const saved = localStorage.getItem('lang') || defaultLang;
    const trans = await loadLocale(saved);
    applyTranslations(trans);
    // language switcher (optional)
    document.querySelectorAll('[data-lang]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const lang = btn.getAttribute('data-lang');
        localStorage.setItem('lang', lang);
        const t = await loadLocale(lang);
        applyTranslations(t);
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();