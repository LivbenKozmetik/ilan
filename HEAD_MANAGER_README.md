# Head Manager - Dynamic Title and Meta Tag Management

The head manager is a dependency-free JavaScript module that provides dynamic title and meta tag management for SEO and social sharing optimization.

## Features

- ✅ Dynamic `document.title` updates
- ✅ Meta description management
- ✅ OpenGraph meta tags for social sharing (Facebook, LinkedIn, etc.)
- ✅ Twitter Card meta tags
- ✅ Canonical URL management
- ✅ Support for listing/product pages
- ✅ Support for category pages
- ✅ Support for storefront/vitrin pages
- ✅ Zero dependencies

## Implementation

### Pages Using Head Manager

1. **index.html** (Anasayfa) - Home page with general site information
2. **kategori.html** (Kategoriler) - Categories page with dynamic category titles
3. **ilan-detay.html** - Listing detail pages with product-specific meta tags
4. **src/pages/storefront.js** - Vitrin/storefront functionality

### Usage Examples

#### Basic Page Update
```javascript
window.headManager.updatePage({
  title: 'İş Makineleri & Ekipman İlanları',
  description: 'Satılık ve kiralık iş makineleri, ekipmanlar ve yedek parçalar.',
  ogType: 'website',
  twitterCard: 'summary_large_image'
});
```

#### Listing Detail Page
```javascript
window.headManager.updateForListing({
  title: 'Satılık Forklift - 2018 Model',
  description: 'Geniş açıklama: tüm bakımları yapılmış...',
  price: '95000',
  location: 'İstanbul, Beylikdüzü',
  image: 'https://example.com/forklift.jpg'
});
```

#### Category Page
```javascript
window.headManager.updateForCategory('İnşaat Makineleri', {
  description: 'İnşaat makineleri kategorisindeki güncel ilanları keşfedin.'
});
```

#### Storefront/Vitrin Page
```javascript
window.headManager.updateForStorefront({
  storeName: 'Makine Dünyası',
  description: 'Güvenilir satıcının kaliteli ürünlerini keşfedin.'
});
```

### Meta Tags Generated

The head manager automatically generates all necessary meta tags:

- `<title>` - Page title with site name
- `<meta name="description">` - SEO description
- `<meta property="og:title">` - OpenGraph title
- `<meta property="og:description">` - OpenGraph description
- `<meta property="og:image">` - OpenGraph image
- `<meta property="og:type">` - OpenGraph type (website/product)
- `<meta property="og:url">` - OpenGraph URL
- `<meta name="twitter:card">` - Twitter Card type
- `<meta name="twitter:title">` - Twitter title
- `<meta name="twitter:description">` - Twitter description
- `<meta name="twitter:image">` - Twitter image
- `<link rel="canonical">` - Canonical URL

### Integration

The head manager is integrated into the site as follows:

1. **Module Import**: `<script src="src/head-manager.js" type="module"></script>`
2. **Global Access**: Available as `window.headManager`
3. **Automatic Updates**: Called during page rendering and content changes
4. **Dynamic Updates**: Updates meta tags when listings or categories change

### Benefits

- **SEO Optimization**: Proper titles and descriptions for search engines
- **Social Sharing**: Rich previews when shared on social media
- **User Experience**: Meaningful browser tab titles
- **Performance**: Lightweight, dependency-free implementation
- **Maintenance**: Centralized meta tag management