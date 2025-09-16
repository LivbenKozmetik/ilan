```markdown
# İlanPortal - Modular Multilingual Frontend Demo

Bu scaffold:
- Modüler dosya yapısı: src/components, src/pages, src/locales
- Çoklu dil (i18n) JSON dosyaları, dil kutusu her sayfada (boxed select)
- Sayfalar: Anasayfa, Kategoriler, Vitrin, Blog
- Grid: masaüstünde 4 sütun; responsive olarak 3/2/1’e düşer
- Tekrar kullanılabilir header/footer bileşenleri

Çalıştırma (lokal):
1. Bu dosyaları aynı klasöre koyun.
2. Statik sunucu önerilir: `python -m http.server 8000` (projeyi barındırdığınız dizinde)
3. Tarayıcıda `http://localhost:8000` açın.

Gelecek adımlar (önceliklendirelim):
- React/Next.js migration (SSR + SEO) — öneririm.
- Backend: Express + Postgres + dosya storage + ödeme provider (Stripe) entegrasyonu.
- Çoklu dil yönetimi server-side ve içerik yönetimi (CMS).
- Detaylı component-level stil rehberi (design tokens / tailwind / css variables).
```