// app.js — Production-ready CDN integration for livben.com
// S3+CloudFront static image hosting with responsive images support
// Maintains existing vanilla JS architecture and is non-breaking for demo mode

(function () {
  'use strict';

  // IMAGE_CDN Configuration
  const IMAGE_CDN = {
    provider: 's3',
    baseUrl: 'https://livben.com/images'
  };

  // Supported widths for responsive images
  const SUPPORTED_WIDTHS = [320, 480, 800, 1200];

  /**
   * Build srcsets for S3 naming convention: {base}/{imageBase}-{width}.{ext}
   * @param {string} imageBase - Base name of the image (without extension)
   * @returns {Object} Object containing avifSrc, webpSrc, jpgSrc, and fallback
   */
  function buildSrcsets(imageBase) {
    if (!imageBase || typeof imageBase !== 'string') {
      // Return fallback for invalid input
      return {
        avifSrc: '',
        webpSrc: '',
        jpgSrc: '',
        fallback: 'https://via.placeholder.com/800x450?text=No+Image'
      };
    }

    // Check if this is a demo/placeholder image
    if (imageBase.includes('placeholder.com') || imageBase.includes('via.placeholder')) {
      return {
        avifSrc: '',
        webpSrc: '',
        jpgSrc: '',
        fallback: imageBase
      };
    }

    // Extract the base name without extension
    let baseName = imageBase;
    let extension = 'jpg';
    
    // Handle full URLs - extract the filename
    if (imageBase.includes('/')) {
      const urlParts = imageBase.split('/');
      baseName = urlParts[urlParts.length - 1];
    }
    
    // Remove extension if present
    const lastDotIndex = baseName.lastIndexOf('.');
    if (lastDotIndex > 0) {
      extension = baseName.substring(lastDotIndex + 1).toLowerCase();
      baseName = baseName.substring(0, lastDotIndex);
    }

    // Build URLs for different formats and sizes
    const buildSrcset = (ext) => {
      return SUPPORTED_WIDTHS
        .map(width => `${IMAGE_CDN.baseUrl}/${baseName}-${width}.${ext} ${width}w`)
        .join(', ');
    };

    return {
      avifSrc: buildSrcset('avif'),
      webpSrc: buildSrcset('webp'),
      jpgSrc: buildSrcset('jpg'),
      fallback: `${IMAGE_CDN.baseUrl}/${baseName}-800.jpg` // Default fallback size
    };
  }

  /**
   * Create a modern picture element with responsive images and format fallbacks
   * @param {string} imageBase - Base name of the image
   * @param {string} alt - Alt text for the image
   * @param {string} className - CSS classes to apply
   * @param {boolean} loading - Whether to use lazy loading (default: true)
   * @returns {HTMLElement} Picture element with optimized sources
   */
  function createPictureElement(imageBase, alt = '', className = '', loading = true) {
    const srcsets = buildSrcsets(imageBase);
    
    const picture = document.createElement('picture');
    
    // AVIF source (most efficient, modern browsers)
    if (srcsets.avifSrc) {
      const avifSource = document.createElement('source');
      avifSource.srcset = srcsets.avifSrc;
      avifSource.type = 'image/avif';
      picture.appendChild(avifSource);
    }
    
    // WebP source (widely supported, good compression)
    if (srcsets.webpSrc) {
      const webpSource = document.createElement('source');
      webpSource.srcset = srcsets.webpSrc;
      webpSource.type = 'image/webp';
      picture.appendChild(webpSource);
    }
    
    // JPEG source (universal fallback)
    if (srcsets.jpgSrc) {
      const jpgSource = document.createElement('source');
      jpgSource.srcset = srcsets.jpgSrc;
      jpgSource.type = 'image/jpeg';
      picture.appendChild(jpgSource);
    }
    
    // Fallback img element
    const img = document.createElement('img');
    img.src = srcsets.fallback;
    img.alt = alt;
    if (className) {
      img.className = className;
    }
    if (loading) {
      img.loading = 'lazy';
    }
    
    // Add error handling to fallback to placeholder if CDN fails
    img.addEventListener('error', function(e) {
      if (!this.src.includes('placeholder.com')) {
        console.warn('[CDN] Failed to load image:', this.src, 'falling back to placeholder');
        this.src = 'https://via.placeholder.com/800x450?text=Image+Not+Found';
      }
    });
    
    picture.appendChild(img);
    
    return picture;
  }

  /**
   * Enhanced renderListingCard that uses CDN-optimized images
   * This replaces the image handling in the existing renderListingCard function
   * @param {Object} item - Listing item data
   * @returns {DocumentFragment} Card element
   */
  function renderListingCard(item) {
    const tpl = document.getElementById('listingTpl');
    if (!tpl) return document.createElement('div');
    
    const node = tpl.content.cloneNode(true);
    const art = node.querySelector('article');
    const imgContainer = node.querySelector('.relative.h-48'); // Image container
    const existingImg = node.querySelector('img');
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

    // Replace the existing img with optimized picture element
    if (existingImg && imgContainer) {
      const imageBase = (item.images && item.images.length) ? item.images[0] : null;
      const picture = createPictureElement(
        imageBase || 'placeholder',
        item.title || 'ilan resim',
        'object-cover w-full h-full transition-transform duration-300 group-hover:scale-105'
      );
      
      // Replace the img with the picture element
      existingImg.replaceWith(picture);
    }

    // Continue with existing card rendering logic
    title.textContent = item.title || '';
    desc.textContent = item.description || '';
    price.textContent = item.price ? Number(item.price).toLocaleString() + ' ₺' : 'Fiyat için iletişin';
    if (loc) loc.textContent = item.location || '—';
    if (date) { 
      const d = item.created_at ? new Date(item.created_at) : new Date(); 
      date.textContent = d.toLocaleDateString(); 
      date.setAttribute('datetime', d.toISOString()); 
    }

    // tags (mock)
    const tags = item.tags || (item.category ? [item.category] : []);
    if (tagsWrap) { 
      tagsWrap.innerHTML = ''; 
      tags.forEach(t => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = t;
        tagsWrap.appendChild(span);
      });
    }

    // actions
    if (detailLink) { 
      detailLink.href = `ilan-detay.html?id=${item.id}`; 
      detailLink.setAttribute('aria-label', `${item.title} detay`); 
    }
    if (favBtn) { 
      favBtn.addEventListener('click', (e) => { 
        e.stopPropagation(); 
        // Call existing toggleFavorite if available
        if (window.ilansite && window.ilansite.toggleFavorite) {
          window.ilansite.toggleFavorite(Number(item.id));
        }
        favBtn.classList.toggle('fav-active'); 
        // Call existing showToast if available
        if (window.ilansite && window.ilansite.showToast) {
          window.ilansite.showToast('Favorilere eklendi', 'success');
        }
      }); 
    }
    if (shareBtn) { 
      shareBtn.addEventListener('click', async (e) => { 
        e.stopPropagation(); 
        const url = `${location.origin}/ilan-detay.html?id=${item.id}`; 
        try { 
          if (navigator.share) await navigator.share({title: item.title, url}); 
          else { 
            await navigator.clipboard.writeText(url); 
            if (window.ilansite && window.ilansite.showToast) {
              window.ilansite.showToast('Link panoya kopyalandı');
            }
          } 
        } catch { 
          if (window.ilansite && window.ilansite.showToast) {
            window.ilansite.showToast('Paylaşım yapılamadı', 'error');
          }
        }
      }); 
    }
    if (contactBtn) { 
      contactBtn.addEventListener('click', (e) => { 
        e.stopPropagation(); 
        // Call existing openContactModal if available
        if (window.ilansite && window.ilansite.openContactModal) {
          window.ilansite.openContactModal({ 
            template: `Merhaba,\n${item.title} ilanıyla ilgileniyorum. Detay paylaşabilir misiniz?` 
          });
        }
      }); 
    }

    // clicking whole card opens detail
    art.addEventListener('click', () => { window.location.href = `ilan-detay.html?id=${item.id}`; });

    return node;
  }

  /**
   * Enhanced detail rendering with CDN-optimized images
   * @param {Object} item - Listing item data
   */
  function renderDetailWithCDN(item) {
    const container = document.getElementById('detailContainer');
    if (!container) return;
    
    // seller mock (in real app fetch owner)
    const seller = item.owner || { name: 'İlan Sahibi', rating: 4.6, since: '2021' };
    const images = item.images && item.images.length ? item.images : ['placeholder'];
    
    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <div id="mainImageContainer" class="bg-gray-100 rounded overflow-hidden">
            <!-- Main image will be inserted here -->
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
    
    // Create optimized main image
    const mainImageContainer = document.getElementById('mainImageContainer');
    const mainPicture = createPictureElement(
      images[0],
      item.title,
      'object-contain w-full h-64',
      false // Don't lazy load the main image
    );
    mainPicture.id = 'mainGalleryImg';
    mainImageContainer.appendChild(mainPicture);
    
    // Create optimized thumbnails
    const thumbsEl = document.getElementById('thumbs');
    images.forEach((src, i) => {
      const thumbPicture = createPictureElement(
        src,
        `thumb-${i}`,
        'h-16 w-28 object-cover rounded cursor-pointer border'
      );
      thumbPicture.addEventListener('click', () => {
        // Replace main image
        const newMainPicture = createPictureElement(
          src,
          item.title,
          'object-contain w-full h-64',
          false
        );
        newMainPicture.id = 'mainGalleryImg';
        mainImageContainer.innerHTML = '';
        mainImageContainer.appendChild(newMainPicture);
      });
      thumbsEl.appendChild(thumbPicture);
    });
    
    // Continue with existing review and contact logic
    // mock reviews
    const reviews = item.reviews || [
      { id:1, name:'Ahmet', rating:5, text:'Gayet temiz, sorunsuz.' },
      { id:2, name:'Mehmet', rating:4, text:'Hızlı iletişim, tavsiye ederim.' }
    ];
    const reviewsWrap = document.getElementById('reviewsWrap');
    reviewsWrap.innerHTML = '';
    reviews.forEach(r => {
      const elR = document.createElement('div');
      elR.className = 'p-3 border rounded';
      elR.innerHTML = `
        <div class="flex items-center justify-between">
          <div><strong>${r.name}</strong></div>
          <div class="text-sm text-yellow-600">${'★'.repeat(r.rating)}</div>
        </div>
        <p class="text-sm text-gray-700 mt-2">${r.text}</p>
      `;
      reviewsWrap.appendChild(elR);
    });
    
    // contact owner wiring
    const contactOwnerBtn = document.getElementById('contactOwner');
    if (contactOwnerBtn) {
      contactOwnerBtn.addEventListener('click', () => {
        if (window.ilansite && window.ilansite.openContactModal) {
          window.ilansite.openContactModal({ 
            template: `Merhaba,\n${item.title} ile ilgileniyorum. Detay verebilir misiniz?` 
          });
        }
      });
    }
    
    // related - simple: render few similar items if global loader available
    renderRelated(item);
  }

  /**
   * Render related listings with CDN-optimized images
   * @param {Object} item - Current listing item
   */
  function renderRelated(item) {
    // attempt to use window._allListings if available (set by initial loader)
    const all = window._allListings || [];
    const related = all.filter(x => x.id !== item.id && x.category === item.category).slice(0,4);
    if (!related.length) return;
    
    const container = document.getElementById('detailContainer');
    const relWrap = document.createElement('section');
    relWrap.className = 'mt-8';
    
    const title = document.createElement('h3');
    title.className = 'font-semibold mb-3';
    title.textContent = 'Benzer İlanlar';
    relWrap.appendChild(title);
    
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-3';
    
    related.forEach(r => {
      const relatedCard = renderListingCard(r);
      grid.appendChild(relatedCard);
    });
    
    relWrap.appendChild(grid);
    container.appendChild(relWrap);
  }

  // Expose functions globally for integration with existing scripts
  window.appCDN = {
    IMAGE_CDN,
    buildSrcsets,
    createPictureElement,
    renderListingCard,
    renderDetailWithCDN
  };

  // Auto-replace existing renderListingCard and renderDetail if scripts.js is loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Check if we should override the existing renderListingCard
    if (window.ilansite) {
      // Save original renderListingCard as fallback
      window.ilansite._originalRenderListingCard = window.renderListingCard;
      // Override with CDN-enabled version
      window.renderListingCard = renderListingCard;
    }
    
    // Also override window.renderCard for seed-listings.js compatibility
    window.renderCard = function(item) {
      const grid = document.getElementById('listingsGrid');
      if (!grid) return null;
      
      const cardNode = renderListingCard(item);
      if (cardNode) {
        grid.appendChild(cardNode);
        return true;
      }
      return false;
    };
    
    // Override renderDetail with CDN-enabled version
    window.renderDetail = renderDetailWithCDN;
  });

  console.log('[app.js] CDN integration loaded - S3 provider:', IMAGE_CDN.baseUrl);

})();