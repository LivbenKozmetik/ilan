// Enhanced hash router with head management
import { headManager } from './utils/head-manager.js';

const routes = {};
let currentPageName = null;

export const router = {
  register(path, renderFn, options = {}){ 
    routes[path] = { renderFn, pageName: options.pageName || path.slice(1) || 'home' };
  },
  async renderActive(container, i18n = null){
    const hash = (location.hash.replace('#','') || '/');
    const path = hash.split('?')[0];
    const route = routes[path] || routes['/'];
    
    if(route) {
      currentPageName = route.pageName;
      await route.renderFn(container);
      
      // Update head tags if i18n is available
      if (i18n) {
        this.updateHead(i18n);
      }
    } else {
      container.innerHTML = '<div class="card">Sayfa bulunamadı</div>';
    }
  },
  updateHead(i18n) {
    if (!currentPageName || !i18n) return;
    
    const pageConfig = headManager.getPageConfig(currentPageName, i18n);
    const currentUrl = window.location.href;
    const locale = i18n.getLocale();
    const localeMap = { tr: 'tr_TR', en: 'en_US' };
    
    headManager.updateHead({
      title: pageConfig.title,
      description: pageConfig.description,
      keywords: pageConfig.keywords,
      url: currentUrl,
      locale: localeMap[locale] || 'tr_TR'
    });
  },
  getCurrentPageName() {
    return currentPageName;
  }
};

export function navigate(path){
  location.hash = path;
  router.renderActive(document.getElementById('main'));
}

// Remove the hashchange listener - it will be handled in app.js