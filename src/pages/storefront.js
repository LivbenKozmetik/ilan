import { i18n } from '../i18n.js';
export async function storefrontPage(container){
  // Update head manager for storefront
  if (typeof window !== 'undefined' && window.headManager) {
    window.headManager.updateForStorefront({
      title: 'Vitrin',
      description: 'Mağazalar ve öne çıkan ürünler. Güvenilir satıcıların kaliteli ürünlerini keşfedin.'
    });
  }
  
  container.innerHTML = '';
  const left = document.createElement('aside');
  left.className = 'card';
  left.innerHTML = `<h3>${i18n.t('storefront.header') || 'Vitrin'}</h3><p class="muted">Mağazalar ve öne çıkan ürünler.</p>`;
  const main = document.createElement('section');
  main.innerHTML = `<div class="card"><h2>${i18n.t('storefront.header') || 'Vitrin'}</h2></div>
                    <div style="margin-top:1rem" class="grid" id="storeGrid"></div>`;
  container.appendChild(left);
  container.appendChild(main);

  const grid = main.querySelector('#storeGrid');
  for(let i=1;i<=8;i++){
    const s = document.createElement('div');
    s.className = 'card card-ad';
    s.innerHTML = `<div class="ad-media" aria-hidden="true"></div>
                   <div class="ad-body"><div class="ad-title">Mağaza ${i}</div><div class="muted">Mağaza açıklaması</div></div>`;
    grid.appendChild(s);
  }
}