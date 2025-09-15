// scripts-image-fix.js — non-invasive image fallback + debug logger
// Add this after your main scripts.js (defer) so it enhances images without replacing existing logic.

(function () {
  // Inline SVG placeholder (small, keeps repo binary-free)
  const FALLBACK_SVG = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="100%" height="100%" fill="#f3f4f6"/><g transform="translate(0,0)" fill="#9ca3af" font-family="Arial, Helvetica, sans-serif"><text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" font-size="28">Görsel Yok</text><text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-size="16">İlan görseli yüklenemedi</text></g></svg>`
  );
  const FALLBACK_DATA_URI = `data:image/svg+xml;charset=utf-8,${FALLBACK_SVG}`;

  // Safety: limit number of times we swap src to avoid infinite loops
  function applyImageFallback(img) {
    if (!img || img.__fallbackApplied) return;
    img.__fallbackApplied = true;

    const originalSrc = img.getAttribute('src') || img.dataset.src || '';
    try { console.debug('[img-fix] applying to', originalSrc || '(no-src)', img); } catch {}

    img.addEventListener('error', function onErr() {
      img.removeEventListener('error', onErr);
      try { console.warn(`[img-fix] failed to load image: ${originalSrc || img.src}`); } catch {}
      img.src = FALLBACK_DATA_URI;
      img.classList.add('no-image');
    }, { once: true });

    // Re-attach logic if lazy-libs replace data-src later
    const attrObserver = new MutationObserver(muts => {
      muts.forEach(m => {
        if (m.type === 'attributes' && (m.attributeName === 'src' || m.attributeName === 'data-src')) {
          if (!img.src.startsWith('data:image')) {
            img.__fallbackApplied = false;
            applyImageFallback(img);
            attrObserver.disconnect();
          }
        }
      });
    });
    attrObserver.observe(img, { attributes: true });
  }

  function enhanceExistingImages() {
    const selectors = [
      '#listingsGrid img',
      '#detailContainer img',
      'article img',
      '.previewImage img',
      '#thumbs img',
      'img'
    ];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(img => applyImageFallback(img));
    });
  }

  function watchForNewImages() {
    const root = document.body;
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes.length) {
          m.addedNodes.forEach(node => {
            if (node.nodeType !== 1) return;
            if (node.tagName === 'IMG') applyImageFallback(node);
            node.querySelectorAll && node.querySelectorAll('img').forEach(i => applyImageFallback(i));
          });
        }
      }
    });
    mo.observe(root, { childList: true, subtree: true });
    window.__imgFixMutationObserver = mo;
  }

  function checkServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        if (regs && regs.length) {
          console.info('[img-fix] service workers registered:', regs.length, ' — if images are stale, try "Bypass for network" in DevTools > Application > Service Workers');
        }
      }).catch(() => {});
    }
  }

  function init() {
    enhanceExistingImages();
    watchForNewImages();
    checkServiceWorker();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.ilansite = window.ilansite || {};
  window.ilansite.applyImageFallback = applyImageFallback;
  window.ilansite.FALLBACK_DATA_URI = FALLBACK_DATA_URI;
})();