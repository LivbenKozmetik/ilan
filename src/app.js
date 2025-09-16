// Entry point: render header/footer, register routes, bootstrap pages
import { renderHeader } from './components/header.js';
import { renderFooter } from './components/footer.js';
import { router, navigate } from './router.js';
import { homePage } from './pages/home.js';
import { categoriesPage } from './pages/categories.js';
import { storefrontPage } from './pages/storefront.js';
import { i18n } from './i18n.js';
import headManager from './head-manager.js';

// Make head manager globally available
if (typeof window !== 'undefined') {
  window.headManager = headManager;
}

// register pages
router.register('/', homePage);
router.register('/categories', categoriesPage);
router.register('/storefront', storefrontPage);

// mount header/footer
const headerRoot = document.getElementById('site-header');
const footerRoot = document.getElementById('site-footer');
renderHeader(headerRoot, {
  onNavigate: (p) => navigate(p),
  onLangChange: async (lng) => {
    await i18n.setLocale(lng);
    router.renderActive(document.getElementById('main'));
    renderHeader(headerRoot, { onNavigate: (p)=>navigate(p), onLangChange: (l)=>i18n.setLocale(l) });
    renderFooter(footerRoot);
  }
});
renderFooter(footerRoot);

// initial render
router.renderActive(document.getElementById('main'));

// re-render on locale change
i18n.onChange(() => {
  renderHeader(headerRoot, { onNavigate: (p)=>navigate(p), onLangChange: (l)=>i18n.setLocale(l) });
  router.renderActive(document.getElementById('main'));
  renderFooter(footerRoot);
});