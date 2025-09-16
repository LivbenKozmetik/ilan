// Head Manager - Dynamic title and meta tag management for SEO and social sharing
export class HeadManager {
  constructor() {
    this.defaultTitle = 'İlanPortal — Modüler Demo';
    this.defaultDescription = 'Modüler, rem-based örnek: Header, Footer, 3 sayfa, kategori filtresi ve ürün listesi.';
    this.siteName = 'İlanPortal';
    this.baseUrl = window.location.origin;
    this.defaultImage = `${this.baseUrl}/images/og-default.jpg`;
  }

  updateHead(options = {}) {
    const {
      title,
      description,
      image,
      url,
      type = 'website',
      keywords,
      locale
    } = options;

    // Update page title
    this.updateTitle(title);
    
    // Update meta description
    this.updateMetaDescription(description);
    
    // Update Open Graph tags
    this.updateOpenGraphTags({
      title: title || this.defaultTitle,
      description: description || this.defaultDescription,
      image: image || this.defaultImage,
      url: url || window.location.href,
      type,
      locale: locale || document.documentElement.lang || 'tr_TR'
    });
    
    // Update Twitter Card tags
    this.updateTwitterCardTags({
      title: title || this.defaultTitle,
      description: description || this.defaultDescription,
      image: image || this.defaultImage
    });
    
    // Update keywords if provided
    if (keywords) {
      this.updateKeywords(keywords);
    }
    
    // Update canonical URL
    this.updateCanonicalUrl(url || window.location.href);
    
    // Update html lang attribute if locale is provided
    if (locale) {
      this.updateHtmlLang(locale);
    }
  }

  updateTitle(title) {
    if (title) {
      document.title = `${title} | ${this.siteName}`;
    } else {
      document.title = this.defaultTitle;
    }
  }

  updateMetaDescription(description) {
    const metaDesc = this.getOrCreateMeta('description');
    metaDesc.setAttribute('content', description || this.defaultDescription);
  }

  updateOpenGraphTags(og) {
    this.setMetaProperty('og:title', og.title);
    this.setMetaProperty('og:description', og.description);
    this.setMetaProperty('og:image', og.image);
    this.setMetaProperty('og:url', og.url);
    this.setMetaProperty('og:type', og.type);
    this.setMetaProperty('og:site_name', this.siteName);
    this.setMetaProperty('og:locale', og.locale);
  }

  updateTwitterCardTags(twitter) {
    this.setMetaName('twitter:card', 'summary_large_image');
    this.setMetaName('twitter:title', twitter.title);
    this.setMetaName('twitter:description', twitter.description);
    this.setMetaName('twitter:image', twitter.image);
    this.setMetaName('twitter:site', '@ilanportal');
  }

  updateKeywords(keywords) {
    if (Array.isArray(keywords)) {
      this.setMetaName('keywords', keywords.join(', '));
    } else if (typeof keywords === 'string') {
      this.setMetaName('keywords', keywords);
    }
  }

  updateCanonicalUrl(url) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }

  updateHtmlLang(locale) {
    // Convert locale to language code (tr_TR -> tr, en_US -> en)
    const langCode = locale.split('_')[0];
    document.documentElement.lang = langCode;
  }

  // Helper methods
  getOrCreateMeta(name) {
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.head.appendChild(meta);
    }
    return meta;
  }

  setMetaProperty(property, content) {
    let meta = document.querySelector(`meta[property="${property}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', property);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  }

  setMetaName(name, content) {
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', name);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  }

  // Page-specific configurations
  getPageConfig(pageName, i18n) {
    const configs = {
      home: {
        title: i18n.t('home.metaTitle') || i18n.t('nav.home'),
        description: i18n.t('home.metaDescription') || (i18n.t('home.heroSubtitle') + ' - ' + i18n.t('home.heroTitle')),
        keywords: ['ilan', 'anasayfa', 'öne çıkan', 'güncel', 'güvenilir', 'listings', 'home', 'featured']
      },
      categories: {
        title: i18n.t('categories.metaTitle') || i18n.t('categories.title'),
        description: i18n.t('categories.metaDescription') || (i18n.t('categories.subtitle') + ' - ' + i18n.t('categories.header')),
        keywords: ['kategoriler', 'kategori', 'sınıflandırma', 'categories', 'classification', 'browse']
      },
      storefront: {
        title: i18n.t('storefront.metaTitle') || i18n.t('storefront.title'),
        description: i18n.t('storefront.metaDescription') || (i18n.t('storefront.hint') + ' - ' + i18n.t('storefront.header')),
        keywords: ['vitrin', 'mağaza', 'storefront', 'showcase', 'shop', 'store']
      },
      blog: {
        title: i18n.t('blog.metaTitle') || i18n.t('blog.title'),
        description: i18n.t('blog.metaDescription') || (i18n.t('blog.hint') + ' - ' + i18n.t('blog.header')),
        keywords: ['blog', 'yazı', 'makale', 'güncellemeler', 'posts', 'articles', 'updates']
      }
    };

    return configs[pageName] || {
      title: this.defaultTitle,
      description: this.defaultDescription,
      keywords: []
    };
  }
}

// Export a singleton instance
export const headManager = new HeadManager();