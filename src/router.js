// small hash router
const routes = {};
export const router = {
  register(path, renderFn){ routes[path] = renderFn; },
  async renderActive(container){
    const hash = (location.hash.replace('#','') || '/');
    const path = hash.split('?')[0];
    const fn = routes[path] || routes['/'];
    if(fn) await fn(container);
    else container.innerHTML = '<div class="card">Sayfa bulunamadı</div>';
  }
};
export function navigate(path){
  location.hash = path;
  router.renderActive(document.getElementById('main'));
}
window.addEventListener('hashchange', ()=> router.renderActive(document.getElementById('main')));