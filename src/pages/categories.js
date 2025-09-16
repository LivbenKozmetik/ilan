import { PRODUCTS, CATEGORIES } from '../data/products.js';
import { i18n } from '../i18n.js';

function createProductCard(p){
  const el = document.createElement('div');
  el.className = 'card card-ad';
  el.innerHTML = `<div class="ad-media" aria-hidden="true"></div>
                  <div class="ad-body">
                    <div style="display:flex;align-items:center;gap:0.5rem">
                      <div class="ad-title">${escapeHtml(p.title)}</div>
                      <div class="badge-price">${p.price ? Number(p.price).toLocaleString('tr-TR') + ' ₺' : ''}</div>
                    </div>
                    <div class="ad-meta"><div class="muted">${escapeHtml(p.category)}</div><div style="margin-left:auto" class="muted">${escapeHtml(p.store)}</div></div>
                    <div style="margin-top:0.5rem" class="muted small">Kısa açıklama örneği.</div>
                  </div>`;
  return el;
}
function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }

export async function categoriesPage(container){
  // Update head manager for categories page
  if (typeof window !== 'undefined' && window.headManager) {
    window.headManager.updateForCategory(null, {
      title: 'Kategoriler',
      description: 'Kategoriye göre ilanları keşfedin. Filtreleme, arama ve sonsuz kaydırma destekli.'
    });
  }
  
  container.innerHTML = '';
  // left filters
  const left = document.createElement('aside');
  left.className = 'card filters';
  left.innerHTML = `<div class="heading">${i18n.t('home.filters')}</div>
                    <div class="muted small">${i18n.t('home.filterHint') || ''}</div>
                    <div style="margin-top:0.75rem">
                      <div style="margin-bottom:0.5rem;font-weight:700">Kategoriler</div>
                      <div id="catChips" class="chips"></div>
                    </div>
                    <div style="margin-top:1rem">
                      <div style="margin-bottom:0.5rem;font-weight:700">Ara</div>
                      <input id="searchInput" class="input" placeholder="Ürün ara..." />
                    </div>
                    <div style="margin-top:1rem">
                      <div style="margin-bottom:0.5rem;font-weight:700">Fiyat aralığı (₺)</div>
                      <input id="minPrice" type="number" class="input" placeholder="Min" />
                      <input id="maxPrice" type="number" class="input" placeholder="Max" style="margin-top:0.5rem" />
                    </div>`;
  // main list
  const main = document.createElement('section');
  main.innerHTML = `<div class="card"><h2>${i18n.t('categories.header') || 'Kategoriler'}</h2></div>
                    <div style="margin-top:1rem" id="productsWrap" class="grid"></div>`;
  container.appendChild(left);
  container.appendChild(main);

  // populate category chips
  const catChips = left.querySelector('#catChips');
  const allBtn = document.createElement('button');
  allBtn.className = 'chip active';
  allBtn.textContent = 'Tümü';
  allBtn.dataset.cat = '';
  catChips.appendChild(allBtn);

  CATEGORIES.forEach(c=>{
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = c;
    b.dataset.cat = c;
    catChips.appendChild(b);
  });

  // product render
  const productsWrap = main.querySelector('#productsWrap');
  function renderProducts(filter = {}) {
    productsWrap.innerHTML = '';
    const q = (filter.q||'').toLowerCase();
    const minP = filter.min != null ? Number(filter.min) : null;
    const maxP = filter.max != null ? Number(filter.max) : null;
    const cat = filter.cat || '';
    
    // Update head manager when category changes
    if (cat && typeof window !== 'undefined' && window.headManager) {
      window.headManager.updateForCategory(cat);
    } else if (!cat && typeof window !== 'undefined' && window.headManager) {
      window.headManager.updateForCategory(null, {
        title: 'Kategoriler',
        description: 'Kategoriye göre ilanları keşfedin. Filtreleme, arama ve sonsuz kaydırma destekli.'
      });
    }
    
    const filtered = PRODUCTS.filter(p=>{
      if(cat && p.category !== cat) return false;
      if(q && !(p.title + ' ' + p.store).toLowerCase().includes(q)) return false;
      if(minP != null && p.price != null && Number(p.price) < minP) return false;
      if(maxP != null && p.price != null && Number(p.price) > maxP) return false;
      return true;
    });
    if(filtered.length === 0){
      productsWrap.innerHTML = '<div class="card muted" style="padding:1rem">Sonuç bulunamadı.</div>';
      return;
    }
    filtered.forEach(p => productsWrap.appendChild(createProductCard(p)));
  }

  // initial render
  renderProducts({});

  // events: category chips
  catChips.addEventListener('click', (e)=>{
    const b = e.target.closest('button');
    if(!b) return;
    catChips.querySelectorAll('button').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    const cat = b.dataset.cat || '';
    const qv = left.querySelector('#searchInput').value;
    const min = left.querySelector('#minPrice').value;
    const max = left.querySelector('#maxPrice').value;
    renderProducts({cat, q: qv, min: min ? Number(min) : null, max: max ? Number(max) : null});
  });

  // search / price filters
  left.querySelector('#searchInput').addEventListener('input', (e)=>{
    const cat = catChips.querySelector('button.active')?.dataset.cat || '';
    const min = left.querySelector('#minPrice').value;
    const max = left.querySelector('#maxPrice').value;
    renderProducts({cat, q: e.target.value, min: min ? Number(min) : null, max: max ? Number(max) : null});
  });
  left.querySelector('#minPrice').addEventListener('input', ()=>{
    const cat = catChips.querySelector('button.active')?.dataset.cat || '';
    const qv = left.querySelector('#searchInput').value;
    const min = left.querySelector('#minPrice').value;
    const max = left.querySelector('#maxPrice').value;
    renderProducts({cat, q: qv, min: min ? Number(min) : null, max: max ? Number(max) : null});
  });
  left.querySelector('#maxPrice').addEventListener('input', ()=>{
    const cat = catChips.querySelector('button.active')?.dataset.cat || '';
    const qv = left.querySelector('#searchInput').value;
    const min = left.querySelector('#minPrice').value;
    const max = left.querySelector('#maxPrice').value;
    renderProducts({cat, q: qv, min: min ? Number(min) : null, max: max ? Number(max) : null});
  });
}