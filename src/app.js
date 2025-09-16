// Entry point: render header/footer, register routes, bootstrap pages
import { renderHeader } from './components/header.js';
import { renderFooter } from './components/footer.js';
import { router, navigate } from './router.js';
import { homePage } from './pages/home.js';
import { categoriesPage } from './pages/categories.js';
import { storefrontPage } from './pages/storefront.js';
import { i18n } from './i18n.js';

async function initApp() {
  // Initialize i18n first
  await i18n.init();

  // register pages with page names for head management
  router.register('/', homePage, { pageName: 'home' });
  router.register('/categories', categoriesPage, { pageName: 'categories' });
  router.register('/storefront', storefrontPage, { pageName: 'storefront' });

  // mount header/footer
  const headerRoot = document.getElementById('site-header');
  const footerRoot = document.getElementById('site-footer');

  async function renderPage() {
    await router.renderActive(document.getElementById('main'), i18n);
  }

  renderHeader(headerRoot, {
    onNavigate: (p) => navigate(p),
    onLangChange: async (lng) => {
      await i18n.setLocale(lng);
      await renderPage();
      renderHeader(headerRoot, { onNavigate: (p)=>navigate(p), onLangChange: (l)=>i18n.setLocale(l) });
      renderFooter(footerRoot);
    }
  });
  renderFooter(footerRoot);

  // initial render
  await renderPage();

  // Handle hashchange events with i18n context
  window.addEventListener('hashchange', async () => {
    await renderPage();
  });

  // re-render on locale change
  i18n.onChange(async () => {
    renderHeader(headerRoot, { onNavigate: (p)=>navigate(p), onLangChange: (l)=>i18n.setLocale(l) });
    await renderPage();
    renderFooter(footerRoot);
  });
}

// Initialize the application
initApp().catch(console.error);