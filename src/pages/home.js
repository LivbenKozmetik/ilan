import { i18n } from '../i18n.js';
export async function homePage(container){
  // Update head manager for home page
  if (typeof window !== 'undefined' && window.headManager) {
    window.headManager.updatePage({
      title: 'İş Makineleri & Ekipman İlanları',
      description: 'Satılık ve kiralık iş makineleri, ekipmanlar ve yedek parçalar. Hızlı arama, güvenli ilan yönetimi.',
      ogType: 'website',
      twitterCard: 'summary_large_image'
    });
  }
  
  container.innerHTML = '';
  const left = document.createElement('aside');
  left.className = 'card filters';
  left.innerHTML = `<div class="heading" data-i18n="home.filters">${i18n.t('home.filters')}</div>
                    <div class="muted small" data-i18n="home.filterHint">${i18n.t('home.filterHint') || ''}</div>`;
  const main = document.createElement('section');
  main.innerHTML = `<div class="card"><h2 data-i18n="home.heroTitle">${i18n.t('home.heroTitle')}</h2><div class="muted" data-i18n="home.heroSubtitle">${i18n.t('home.heroSubtitle')}</div></div>
                    <div style="margin-top:1rem" class="grid" id="homeGrid"></div>`;
  container.appendChild(left);
  container.appendChild(main);

  // sample cards
  const grid = main.querySelector('#homeGrid');
  for(let i=1;i<=8;i++){
    const c = document.createElement('div');
    c.className = 'card card-ad';
    c.innerHTML = `<div class="ad-media" aria-hidden="true"></div>
                   <div class="ad-body"><div class="ad-title">Örnek Ürün ${i}</div>
                   <div class="muted">Kısa açıklama örneği burada yer alır.</div>
                   <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
                     <div class="badge-price">${(Math.floor(Math.random()*15000)+1000).toLocaleString('tr-TR')} ₺</div>
                     <button class="btn ghost" style="margin-left:auto">Görüntüle</button>
                   </div></div>`;
    grid.appendChild(c);
  }
}