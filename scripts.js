// scripts.js — zenginleştirme: modal, toast, contact flow, detayta reviews & seller blok, ilan-ekle validation, card tags & meta
// Bu dosya önceki API-first scripts.js üzerine ek/düzeltme olarak çalışır.
// (Basit ve client-side mock veriler ile çalışır; gerçek backend varsa API'yi kullanın.)

(function () {
  // küçük yardımcılar
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  function el(tag, props = {}, children = []) {
    const e = document.createElement(tag);
    Object.entries(props).forEach(([k,v]) => { if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); });
    children.forEach(c => e.append(typeof c === 'string' ? document.createTextNode(c) : c));
    return e;
  }

  // TOAST sistemi
  function showToast(message, type = 'default', timeout = 3500) {
    const wrap = $('#toastWrap');
    if (!wrap) return;
    const node = el('div', { class: `toast ${type === 'success' ? 'success' : type === 'error' ? 'error' : ''}` }, [message]);
    wrap.appendChild(node);
    setTimeout(() => node.classList.add('visible'), 50);
    setTimeout(() => { node.remove(); }, timeout);
  }

  // MODAL: contact
  function openContactModal(context = {}) {
    const backdrop = $('#modalBackdrop');
    const modal = $('#contactModal');
    if (!backdrop || !modal) return;
    backdrop.classList.add('active');
    backdrop.setAttribute('aria-hidden', 'false');
    // prefill message
    const name = $('#contactName');
    const email = $('#contactEmail');
    const msg = $('#contactMessage');
    if (name) name.value = context.name || '';
    if (email) email.value = context.email || '';
    if (msg) msg.value = context.message || (`${context.template || ''}`);
    // focus first input
    setTimeout(() => { (name || email || msg || modal).focus(); }, 100);
  }
  function closeContactModal() {
    const backdrop = $('#modalBackdrop');
    if (!backdrop) return;
    backdrop.classList.remove('active');
    backdrop.setAttribute('aria-hidden', 'true');
  }

  // modal events
  document.addEventListener('click', (e) => {
    if (e.target.matches('#modalCancel')) { closeContactModal(); }
    if (e.target.matches('#modalBackdrop')) { closeContactModal(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('#modalBackdrop')?.classList.contains('active')) closeContactModal();
  });
  // contact submit
  const contactForm = $('#contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      // simple client-side check
      const name = $('#contactName').value.trim();
      const email = $('#contactEmail').value.trim();
      const message = $('#contactMessage').value.trim();
      if (!name || !email || !message) { showToast('Lütfen tüm alanları doldurun.', 'error'); return; }
      // send to backend or simulate
      // example: fetch('/api/contact', {method:'POST', body: JSON.stringify({name,email,message})})
      closeContactModal();
      showToast('Mesaj gönderildi — ilan sahibi en kısa sürede yanıtlayacaktır.', 'success');
    });
  }

  // Card rendering helpers (used by API loader)
  function renderListingCard(item) {
    const tpl = document.getElementById('listingTpl');
    if (!tpl) return document.createElement('div');
    const node = tpl.content.cloneNode(true);
    const art = node.querySelector('article');
    const img = node.querySelector('img');
    const title = node.querySelector('h3');
    const desc = node.querySelector('p');
    const price = node.querySelector('.price');
    const loc = node.querySelector('.location-badge');
    const date = node.querySelector('.post-date');
    const tagsWrap = node.querySelector('.tags-wrap');
    const favBtn = node.querySelector('.favorite-btn');
    const shareBtn = node.querySelector('.share-btn');
    const contactBtn = node.querySelector('.contact-btn');
    const detailLink = node.querySelector('.detail-link');

    img.src = (item.images && item.images.length) ? item.images[0] : 'https://via.placeholder.com/800x450?text=No+Image';
    img.alt = item.title || 'ilan resim';
    title.textContent = item.title || '';
    desc.textContent = item.description || '';
    price.textContent = item.price ? Number(item.price).toLocaleString() + ' ₺' : 'Fiyat için iletişin';
    if (loc) loc.textContent = item.location || '—';
    if (date) { const d = item.created_at ? new Date(item.created_at) : new Date(); date.textContent = d.toLocaleDateString(); date.setAttribute('datetime', d.toISOString()); }

    // tags (mock)
    const tags = item.tags || (item.category ? [item.category] : []);
    if (tagsWrap) { tagsWrap.innerHTML = ''; tags.forEach(t => tagsWrap.appendChild(el('span',{class:'tag'}, [t]))); }

    // actions
    if (detailLink) { detailLink.href = `ilan-detay.html?id=${item.id}`; detailLink.setAttribute('aria-label', `${item.title} detay`); }
    if (favBtn) { favBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFavorite(Number(item.id)); favBtn.classList.toggle('fav-active'); showToast('Favorilere eklendi', 'success'); }); }
    if (shareBtn) { shareBtn.addEventListener('click', async (e) => { e.stopPropagation(); const url = `${location.origin}/ilan-detay.html?id=${item.id}`; try { if (navigator.share) await navigator.share({title: item.title, url}); else { await navigator.clipboard.writeText(url); showToast('Link panoya kopyalandı'); } } catch { showToast('Paylaşım yapılamadı', 'error'); } }); }
    if (contactBtn) { contactBtn.addEventListener('click', (e) => { e.stopPropagation(); openContactModal({ template: `Merhaba,\n${item.title} ilanıyla ilgileniyorum. Detay paylaşabilir misiniz?` }); }); }

    // clicking whole card opens detail
    art.addEventListener('click', () => { window.location.href = `ilan-detay.html?id=${item.id}`; });

    return node;
  }

  // Favorites (simple)
  function toggleFavorite(id) {
    const key = 'ilansite:favs';
    const cur = JSON.parse(localStorage.getItem(key) || '[]');
    const set = new Set(cur);
    if (set.has(id)) set.delete(id); else set.add(id);
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  }

  // When listings loaded via other script, call attachUIExtras
  function attachUIExtras() {
    // ensure modal/backdrop exist across pages
    if (!$('#modalBackdrop') && document.body) {
      // could dynamically inject modal if missing
    }
  }

  // detay sayfası zenginleştirme: seller & reviews & related
  function renderDetail(item) {
    const container = $('#detailContainer');
    if (!container) return;
    // seller mock (in real app fetch owner)
    const seller = item.owner || { name: 'İlan Sahibi', rating: 4.6, since: '2021' };
    const images = item.images && item.images.length ? item.images : ['https://via.placeholder.com/800x450?text=No+Image'];
    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <div class="bg-gray-100 rounded overflow-hidden">
            <img id="mainGalleryImg" src="${images[0]}" alt="${item.title}" class="object-contain w-full h-64" />
          </div>
          <div id="thumbs" class="flex gap-2 mt-3"></div>
          <h1 class="text-2xl font-bold mt-4">${item.title}</h1>
          <p class="text-gray-700 mt-2">${item.description}</p>

          <section class="mt-6">
            <h3 class="font-semibold mb-2">Yorumlar</h3>
            <div id="reviewsWrap" class="space-y-3"></div>
          </section>
        </div>
        <aside class="bg-white p-4 rounded-lg shadow">
          <div class="text-xl font-bold text-green-600">${item.price ? Number(item.price).toLocaleString() + ' ₺' : 'Fiyat için iletişin'}</div>
          <div class="text-sm text-gray-500 mt-2">${item.category || '—'} • ${item.location || '—'}</div>
          <div class="mt-4">
            <div class="flex items-center gap-3">
              <div>
                <div class="font-semibold">${seller.name}</div>
                <div class="text-sm text-gray-500">Üye: ${seller.since}</div>
              </div>
              <div class="stars">${'★'.repeat(Math.round(seller.rating))}</div>
            </div>
            <div class="mt-4">
              <button id="contactOwner" class="px-4 py-2 bg-blue-600 text-white rounded-md">İlan Sahibiyle İletişime Geç</button>
            </div>
          </div>
        </aside>
      </div>
    `;
    // thumbs
    const thumbsEl = $('#thumbs');
    images.forEach((src,i) => {
      const im = el('img',{class:'h-16 w-28 object-cover rounded cursor-pointer border', src, alt:`thumb-${i}`});
      im.addEventListener('click', () => { $('#mainGalleryImg').src = src; });
      thumbsEl.appendChild(im);
    });
    // mock reviews
    const reviews = item.reviews || [
      { id:1, name:'Ahmet', rating:5, text:'Gayet temiz, sorunsuz.' },
      { id:2, name:'Mehmet', rating:4, text:'Hızlı iletişim, tavsiye ederim.' }
    ];
    const reviewsWrap = $('#reviewsWrap');
    reviewsWrap.innerHTML = '';
    reviews.forEach(r => {
      const elR = el('div',{class:'p-3 border rounded'}, [
        el('div',{class:'flex items-center justify-between'}, [
          el('div',{}, [ el('strong',{}, [r.name]) ]),
          el('div',{class:'text-sm text-yellow-600'}, [ '★'.repeat(r.rating) ])
        ]),
        el('p',{class:'text-sm text-gray-700 mt-2'}, [r.text])
      ]);
      reviewsWrap.appendChild(elR);
    });
    // contact owner wiring
    $('#contactOwner') && $('#contactOwner').addEventListener('click', () => openContactModal({ template:`Merhaba,\n${item.title} ile ilgileniyorum. Detay verebilir misiniz?` }));
    // related - simple: render few similar items if global loader available
    renderRelated(item);
  }

  function renderRelated(item) {
    // attempt to use window._allListings if available (set by initial loader)
    const all = window._allListings || [];
    const related = all.filter(x => x.id !== item.id && x.category === item.category).slice(0,4);
    if (!related.length) return;
    const container = $('#detailContainer');
    const relWrap = el('section',{class:'mt-8'}, [ el('h3',{class:'font-semibold mb-3'}, ['Benzer İlanlar']), el('div',{class:'grid grid-cols-1 sm:grid-cols-2 gap-3'}, []) ]);
    related.forEach(r => relWrap.querySelector('div').appendChild(renderListingCard(r)));
    container.appendChild(relWrap);
  }

  // İlan ekle: client-side validation + preview hooks
  function initIlanForm() {
    const form = $('#ilanForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = $('#title').value.trim();
      const desc = $('#description').value.trim();
      const price = $('#price').value.trim();
      const category = $('#category').value.trim();
      const location = $('#location').value.trim();
      if (!title || !desc || !price || !category || !location) { showToast('Lütfen tüm zorunlu alanları doldurun.', 'error'); return; }
      // simple positive price check
      if (Number(price) < 0) { showToast('Fiyat negatif olamaz.', 'error'); return; }
      // simulate save or call API
      showToast('İlan kaydediliyor...', 'success', 2000);
      setTimeout(() => { showToast('İlanınız oluşturuldu.', 'success'); form.reset(); }, 1000);
    });
  }

  // Public init: attach to pages
  document.addEventListener('DOMContentLoaded', () => {
    attachUIExtras();
    initIlanForm();
    populateLanguageSelector();

    // If detail page with item id, fetch and render (uses existing API or fallback)
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id && $('#detailContainer')) {
      // try API
      fetch(`/api/listings/${id}`).then(r => r.ok ? r.json() : null).then(data => {
        if (data) { renderDetail(data); return; }
        // fallback static
        fetch('/data/listings.json').then(r=>r.json()).then(arr => {
          const it = arr.find(x=>String(x.id)===String(id)) || arr[0];
          window._allListings = arr;
          renderDetail(it);
        });
      }).catch(() => {
        fetch('/data/listings.json').then(r=>r.json()).then(arr => { const it=arr.find(x=>String(x.id)===String(id))||arr[0]; window._allListings = arr; renderDetail(it); });
      });
    }

    // if index or kategori, we expect outer loader to append items; we can intercept after load to enhance UI
    // Add simple mutation observer to enhance cards when added dynamically
    const grid = $('#listingsGrid');
    if (grid) {
      const mo = new MutationObserver(() => {
        // mark all articles that don't have enhancements applied yet
        grid.querySelectorAll('article').forEach(a => {
          if (a.dataset.enhanced) return;
          a.dataset.enhanced = '1';
          // add keyboard role
          a.setAttribute('tabindex','0');
        });
      });
      mo.observe(grid, { childList: true, subtree: false });
    }
  });

  // Language selector population
  function populateLanguageSelector() {
    // Available languages based on locale files
    const languages = [
      { code: 'tr', name: 'Türkçe' },
      { code: 'en', name: 'English' }
    ];
    
    // Get current language from localStorage or default to 'tr'
    const currentLang = localStorage.getItem('lang') || 'tr';
    
    // Find all language selectors on the page
    const selectors = document.querySelectorAll('#langSelect');
    
    selectors.forEach(select => {
      // Clear existing options
      select.innerHTML = '';
      
      // Add language options
      languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.code;
        option.textContent = lang.name;
        option.selected = lang.code === currentLang;
        select.appendChild(option);
      });
      
      // Add change event listener
      select.addEventListener('change', function(e) {
        const selectedLang = e.target.value;
        localStorage.setItem('lang', selectedLang);
        
        // Reload to apply new language (simple approach)
        window.location.reload();
      });
    });
  }

  // expose some helpers globally for other scripts
  window.ilansite = window.ilansite || {};
  window.ilansite.showToast = showToast;
  window.ilansite.openContactModal = openContactModal;
  window.ilansite.toggleFavorite = toggleFavorite;
  window.ilansite.populateLanguageSelector = populateLanguageSelector;
})();