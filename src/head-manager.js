/**
 * HeadManager - Dynamic title and meta tag management
 * Dependency-free module for updating document.title and meta tags at runtime
 * Supports SEO and social sharing meta tags (OpenGraph, Twitter)
 */

class HeadManager {
  constructor() {
    this.defaultConfig = {
      siteName: 'İlanSite',
      baseTitle: 'İlanSite — İş Makineleri & Ekipman İlanları',
      baseDescription: 'Satılık ve kiralık iş makineleri, ekipmanlar ve yedek parçalar. Hızlı arama, güvenli ilan yönetimi.',
      url: window.location.origin,
      image: '/icons/og-image.png',
      locale: 'tr_TR',
      type: 'website'
    };
    this.currentConfig = { ...this.defaultConfig };
  }

  /**
   * Update the document title
   * @param {string} title - New title
   * @param {boolean} append - Whether to append site name
   */
  setTitle(title, append = true) {
    if (!title) {
      document.title = this.defaultConfig.baseTitle;
      return;
    }
    
    document.title = append ? `${title} — ${this.defaultConfig.siteName}` : title;
    this.currentConfig.title = document.title;
  }

  /**
   * Update meta description
   * @param {string} description - Meta description content
   */
  setDescription(description) {
    const desc = description || this.defaultConfig.baseDescription;
    this.setMetaTag('name', 'description', desc);
    this.currentConfig.description = desc;
  }

  /**
   * Set a meta tag
   * @param {string} attribute - 'name' or 'property'
   * @param {string} key - Meta tag key
   * @param {string} content - Meta tag content
   */
  setMetaTag(attribute, key, content) {
    if (!content) return;
    
    const selector = `meta[${attribute}="${key}"]`;
    let meta = document.querySelector(selector);
    
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attribute, key);
      document.head.appendChild(meta);
    }
    
    meta.setAttribute('content', content);
  }

  /**
   * Update OpenGraph meta tags for social sharing
   * @param {Object} options - OG options
   */
  setOpenGraph(options = {}) {
    const og = {
      title: options.title || this.currentConfig.title || this.defaultConfig.baseTitle,
      description: options.description || this.currentConfig.description || this.defaultConfig.baseDescription,
      image: options.image || this.defaultConfig.image,
      url: options.url || window.location.href,
      type: options.type || this.defaultConfig.type,
      siteName: options.siteName || this.defaultConfig.siteName,
      locale: options.locale || this.defaultConfig.locale
    };

    this.setMetaTag('property', 'og:title', og.title);
    this.setMetaTag('property', 'og:description', og.description);
    this.setMetaTag('property', 'og:image', this.resolveUrl(og.image));
    this.setMetaTag('property', 'og:url', og.url);
    this.setMetaTag('property', 'og:type', og.type);
    this.setMetaTag('property', 'og:site_name', og.siteName);
    this.setMetaTag('property', 'og:locale', og.locale);
  }

  /**
   * Update Twitter Card meta tags
   * @param {Object} options - Twitter card options
   */
  setTwitterCard(options = {}) {
    const twitter = {
      card: options.card || 'summary_large_image',
      title: options.title || this.currentConfig.title || this.defaultConfig.baseTitle,
      description: options.description || this.currentConfig.description || this.defaultConfig.baseDescription,
      image: options.image || this.defaultConfig.image,
      site: options.site || '@ilansite'
    };

    this.setMetaTag('name', 'twitter:card', twitter.card);
    this.setMetaTag('name', 'twitter:title', twitter.title);
    this.setMetaTag('name', 'twitter:description', twitter.description);
    this.setMetaTag('name', 'twitter:image', this.resolveUrl(twitter.image));
    if (twitter.site) {
      this.setMetaTag('name', 'twitter:site', twitter.site);
    }
  }

  /**
   * Set canonical URL
   * @param {string} url - Canonical URL
   */
  setCanonical(url) {
    const canonical = url || window.location.href;
    let link = document.querySelector('link[rel="canonical"]');
    
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    
    link.setAttribute('href', canonical);
  }

  /**
   * Update all meta tags for a page
   * @param {Object} config - Page configuration
   */
  updatePage(config = {}) {
    // Update title
    this.setTitle(config.title, config.appendSiteName !== false);
    
    // Update description
    this.setDescription(config.description);
    
    // Update OpenGraph tags
    this.setOpenGraph({
      title: config.ogTitle || config.title,
      description: config.ogDescription || config.description,
      image: config.ogImage || config.image,
      url: config.url,
      type: config.ogType || config.type
    });
    
    // Update Twitter Card tags
    this.setTwitterCard({
      title: config.twitterTitle || config.title,
      description: config.twitterDescription || config.description,
      image: config.twitterImage || config.image,
      card: config.twitterCard,
      site: config.twitterSite
    });
    
    // Update canonical URL
    this.setCanonical(config.canonical || config.url);
    
    // Store current config
    this.currentConfig = { ...this.defaultConfig, ...config };
  }

  /**
   * Generate meta tags for listing/product pages
   * @param {Object} listing - Listing data
   */
  updateForListing(listing) {
    if (!listing) return;
    
    const title = listing.title || listing.name;
    const description = listing.description || listing.summary;
    const image = listing.image || listing.images?.[0];
    const price = listing.price ? ` - ${listing.price}` : '';
    const location = listing.location ? ` | ${listing.location}` : '';
    
    this.updatePage({
      title: `${title}${price}${location}`,
      description: description ? description.substring(0, 160) : undefined,
      image: image,
      ogType: 'product',
      twitterCard: 'summary_large_image',
      url: window.location.href
    });
  }

  /**
   * Generate meta tags for category pages
   * @param {string} categoryName - Category name
   * @param {Object} options - Additional options
   */
  updateForCategory(categoryName, options = {}) {
    const title = categoryName ? `${categoryName} Kategorisi` : 'Kategoriler';
    const description = options.description || 
      (categoryName ? 
        `${categoryName} kategorisindeki güncel ilanları keşfedin. Filtreleme ve arama seçenekleri ile kolayca bulun.` :
        'Kategoriye göre ilanları keşfedin. Filtreleme, arama ve sonsuz kaydırma destekli.');
    
    this.updatePage({
      title: title,
      description: description,
      url: window.location.href,
      ...options
    });
  }

  /**
   * Generate meta tags for storefront/vitrin pages
   * @param {Object} options - Storefront options
   */
  updateForStorefront(options = {}) {
    const title = options.storeName ? `${options.storeName} Mağazası` : 'Vitrin';
    const description = options.description || 
      'Mağazalar ve öne çıkan ürünler. Güvenilir satıcıların kaliteli ürünlerini keşfedin.';
    
    this.updatePage({
      title: title,
      description: description,
      url: window.location.href,
      ...options
    });
  }

  /**
   * Reset to default meta tags
   */
  reset() {
    this.updatePage(this.defaultConfig);
  }

  /**
   * Resolve relative URLs to absolute URLs
   * @param {string} url - URL to resolve
   */
  resolveUrl(url) {
    if (!url || url.startsWith('http')) return url;
    if (url.startsWith('//')) return `${window.location.protocol}${url}`;
    if (url.startsWith('/')) return `${window.location.origin}${url}`;
    return `${window.location.origin}/${url}`;
  }

  /**
   * Get current configuration
   */
  getCurrentConfig() {
    return { ...this.currentConfig };
  }
}

// Create singleton instance
const headManager = new HeadManager();

// Export for both ES6 modules and global use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = headManager;
} else if (typeof window !== 'undefined') {
  window.headManager = headManager;
}

export default headManager;