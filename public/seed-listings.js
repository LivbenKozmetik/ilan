// seed-listings.js — non-invasive; index.html içindeki <template id="listingTpl"> kullanılarak listeyi doldurur.
// Include this after scripts.js and after your image-fix script (defer).

(function () {
  async function loadData() {
    // öncelik: API /api/listings; değilse /data/listings.json; değilse inline fallback
    const candidates = [
      '/api/listings',
      '/data/listings.json'
    ];
    for (const url of candidates) {
      try {
        const res = await fetch(url, { method: 'GET', credentials: 'same-origin' });
        if (!res.ok) { console.debug('[seed] fetch', url, 'status', res.status); continue; }
        const j = await res.json();
        // normalize array
        if (Array.isArray(j)) return j;
        if (j && Array.isArray(j.data)) return j.data;
        if (j && Array.isArray(j.listings)) return j.listings;
      } catch (e) {
        console.debug('[seed] fetch error', url, e && e.message);
      }
    }
    // fallback inline
    return [
      {"id":101,"title":"Örnek İlan - Demo","description":"Demo açıklama","price":12345,"category":"Demo","location":"Demo Şehir","created_at":new Date().toISOString(),"images":["https://via.placeholder.com/800x450?text=Demo"]}
    ];
  }

  function renderCard(item) {
    const tpl = document.getElementById('listingTpl');
    const grid = document.getElementById('listingsGrid');
    if (!tpl || !grid) return null;
    const node = tpl.content.cloneNode(true);
    const art = node.querySelector('article');
    const img = node.querySelector('img');
    const title = node.querySelector('h3');
    const desc = node.querySelector('p');
    const price = node.querySelector('.price');
    const loc = node.querySelector('.location-badge');
    const date = node.querySelector('.post-date');
    const tagsWrap = node.querySelector('.tags-wrap');
    const detailLink = node.querySelector('.detail-link');

    img.src = (item.images && item.images.length) ? item.images[0] : 'https://via.placeholder.com/800x450?text=No+Image';
    img.alt = item.title || 'ilan resim';
    title.textContent = item.title || '';
    desc.textContent = item.description || '';
    price.textContent = item.price ? Number(item.price).toLocaleString() + ' ₺' : 'Fiyat için iletişin';
    if (loc) loc.textContent = item.location || '—';
    if (date) { const d = item.created_at ? new Date(item.created_at) : new Date(); date.textContent = d.toLocaleDateString(); date.setAttribute('datetime', d.toISOString()); }
    if (tagsWrap) { tagsWrap.innerHTML = ''; if (item.category) tagsWrap.appendChild(Object.assign(document.createElement('span'), { className: 'tag', textContent: item.category })); }
    if (detailLink) detailLink.href = `ilan-detay.html?id=${item.id}`;

    // Avoid interfering with existing click handlers: only append
    grid.appendChild(node);
    return true;
  }

  async function init() {
    const data = await loadData();
    if (!data || !data.length) return;
    // clear possible loader
    const grid = document.getElementById('listingsGrid');
    if (!grid) return;
    grid.innerHTML = ''; // replace whatever was there
    window._allListings = data;
    data.forEach(item => renderCard(item));
    console.info('[seed] listings rendered:', data.length);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();