import { i18n } from '../i18n.js';

const links = [
  { path: '/', labelKey: 'nav.home' },
  { path: '/categories', labelKey: 'nav.categories' },
  { path: '/storefront', labelKey: 'nav.storefront' }
];

export function renderHeader(root, { onNavigate, onLangChange } = {}) {
  root.innerHTML = '';
  const inner = document.createElement('div');
  inner.className = 'site-header-inner site-shell';

  // brand
  const brand = document.createElement('div');
  brand.className = 'brand';
  brand.innerHTML = `<div class="logo">IP</div>
    <div><div class="title">İlanPortal</div><div class="small muted">Profesyonel İlan & Mağaza</div></div>`;
  inner.appendChild(brand);

  // nav
  const nav = document.createElement('nav');
  nav.className = 'nav';
  links.forEach(l=>{
    const a = document.createElement('a');
    a.href = `#${l.path}`;
    a.dataset.path = l.path;
    a.textContent = i18n.t(l.labelKey);
    a.addEventListener('click', (e)=>{ e.preventDefault(); onNavigate && onNavigate(l.path); });
    nav.appendChild(a);
  });
  inner.appendChild(nav);

  // language box
  const langBox = document.createElement('div');
  langBox.className = 'lang-box';
  const select = document.createElement('select');
  select.className = 'lang-select';
  select.innerHTML = `<option value="tr">Türkçe</option><option value="en">English</option>`;
  select.value = i18n.getLocale();
  select.addEventListener('change', async (e)=>{
    const lng = e.target.value;
    await i18n.setLocale(lng);
    onLangChange && onLangChange(lng);
  });
  langBox.appendChild(select);
  inner.appendChild(langBox);

  root.appendChild(inner);

  // highlight active link on locale changes or navigation
  function setActive(){
    const path = (location.hash.replace('#','') || '/').split('?')[0];
    nav.querySelectorAll('a').forEach(a=> a.classList.toggle('active', a.dataset.path === path));
  }
  setActive();
  window.addEventListener('hashchange', setActive);

  // update labels on locale change
  i18n.onChange(()=> {
    nav.querySelectorAll('a').forEach((a, idx) => a.textContent = i18n.t(links[idx].labelKey));
  });
}