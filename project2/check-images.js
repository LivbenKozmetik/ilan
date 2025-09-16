// check-images.js
// Kullanım: node check-images.js [API_BASE_URL] [OPTIONAL_LISTINGS_JSON]
// - API_BASE_URL: örn http://localhost:3000
// - OPTIONAL_LISTINGS_JSON: önceden curl ile çekilmiş listings.json yolu (diagnostics.sh üretir)
//
// Çıktı olarak her imaj URL'i için durum (OK/404/403/ERROR), response status ve CORS header bilgisi (Access-Control-Allow-Origin).

const fs = require('fs');
const path = require('path');
const fetch = global.fetch || require('node-fetch');

async function loadListings(apiBase, listingsPath) {
  if (listingsPath && fs.existsSync(listingsPath)) {
    try { return JSON.parse(fs.readFileSync(listingsPath, 'utf8')); } catch (e) { console.warn('Local listings json parse hatası', e.message); }
  }
  // try API
  try {
    const url = `${apiBase.replace(/\/$/, '')}/api/listings`;
    const r = await fetch(url, { method: 'GET', redirect: 'follow', timeout: 8000 });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    // Normalize: if API returns {data: [...]}
    if (Array.isArray(j)) return j;
    if (j && Array.isArray(j.data)) return j.data;
    // if object with meta
    return j.listings || j.items || [];
  } catch (e) {
    console.error('API listings çekilemedi:', e.message);
    return [];
  }
}

async function headCheck(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow', timeout: 8000 });
    return { ok: res.ok, status: res.status, cors: res.headers.get('access-control-allow-origin') || null };
  } catch (e) {
    // Try GET as fallback (some servers block HEAD)
    try {
      const r = await fetch(url, { method: 'GET', redirect: 'follow', timeout: 10000 });
      return { ok: r.ok, status: r.status, cors: r.headers.get('access-control-allow-origin') || null };
    } catch (err) {
      return { ok: false, status: 'ERR', error: err.message };
    }
  }
}

(async () => {
  const apiBase = process.argv[2] || 'http://localhost:3000';
  const listingsPath = process.argv[3];
  console.log('check-images: apiBase=', apiBase, 'listingsPath=', listingsPath || '(none)');
  const listings = await loadListings(apiBase, listingsPath);
  console.log(`Toplam ilan: ${Array.isArray(listings) ? listings.length : 0}`);

  const imageURLs = new Set();
  (listings || []).forEach(item => {
    if (!item) return;
    // common fields: images, image, photos, thumbnail
    const collect = [];
    if (Array.isArray(item.images)) collect.push(...item.images);
    if (item.image) collect.push(item.image);
    if (item.thumbnail) collect.push(item.thumbnail);
    if (item.photos && Array.isArray(item.photos)) collect.push(...item.photos);
    collect.forEach(u => { if (u && typeof u === 'string') imageURLs.add(u); });
  });

  console.log(`Bulunan görsel URL sayısı: ${imageURLs.size}`);
  const results = [];
  for (const url of Array.from(imageURLs)) {
    // normalize protocol-relative URLs
    let testUrl = url;
    if (url.startsWith('//')) testUrl = 'https:' + url;
    if (!/^https?:\/\//i.test(testUrl)) {
      // may be relative; make absolute using apiBase origin
      try {
        const base = new URL(apiBase);
        testUrl = new URL(testUrl, base).href;
      } catch {}
    }
    process.stdout.write(`Checking ${testUrl} ... `);
    const r = await headCheck(testUrl);
    if (r.ok) { console.log(`OK ${r.status} CORS:${r.cors}`); }
    else if (r.status === 'ERR') { console.log(`ERROR ${r.error}`); }
    else { console.log(`FAIL ${r.status} CORS:${r.cors}`); }
    results.push({ url: testUrl, status: r.status, ok: r.ok, cors: r.cors, error: r.error || null });
  }

  // Save results
  const outPath = path.join(process.cwd(), 'diagnostics-output', 'images-report.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log('Rapor kaydedildi:', outPath);
})();