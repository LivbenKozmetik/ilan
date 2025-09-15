#!/usr/bin/env bash
# diagnostics.sh — proje genel sağlık taraması (lokal)
# Kullanım:
#   chmod +x diagnostics.sh
#   ./diagnostics.sh
set -e
ROOT="$(pwd)"
OUTDIR="$ROOT/diagnostics-output"
mkdir -p "$OUTDIR"

echo "=== DIAGNOSTICS START ==="
echo "Node: $(node -v 2>/dev/null || echo 'not found')"
echo "NPM:  $(npm -v 2>/dev/null || echo 'not found')"
echo "PWD: $ROOT"
echo

if [ ! -f package.json ]; then
  echo "package.json bulunamadı — önce proje kökünde çalıştırdığınızdan emin olun."
  exit 1
fi

echo "1) Paketleri yükleme (npm ci tercih edilir, yoksa npm install)"
if command -v npm >/dev/null 2>&1; then
  if [ -f package-lock.json ]; then
    npm ci --no-audit --no-fund || npm install --no-audit --no-fund
  else
    npm install --no-audit --no-fund
  fi
else
  echo "npm yok — yükleyin ve tekrar çalıştırın."
fi

echo
echo "2) Lint ve Test (varsa) çalıştırılıyor..."
# lint
if npm run | grep -q "lint"; then
  echo "-> npm run lint"
  npm run lint || echo "Lint hatası (çıktıyı diagnostics-output/lint.log inceleyin)" | tee "$OUTDIR/lint.log"
else
  echo "-> lint script yok (package.json içinde 'lint' yok)."
fi

# test
if npm run | grep -q "test"; then
  echo "-> npm test"
  npm test --silent 2>&1 | tee "$OUTDIR/tests.log" || echo "Testlerde hatalar olabilir (logs: diagnostics-output/tests.log)"
else
  echo "-> test script yok."
fi

echo
echo "3) Migration / DB (varsayılana) deneme"
if npm run | grep -q "migrate"; then
  echo "-> npm run migrate"
  npm run migrate 2>&1 | tee "$OUTDIR/migrate.log" || echo "Migration sırasında hata (bak: diagnostics-output/migrate.log)"
else
  echo "-> migrate script yok veya migrations klasörü yoksa manuel kontrol gereklidir."
fi

echo
echo "4) Sunucu kısa süreli başlatma (npm start) ve smoke test"
PORT="${PORT:-3000}"
API_URL="http://localhost:$PORT"
LOG_SERVER="$OUTDIR/server.log"

# Start server in background
echo "Sunucu $PORT portunda başlatılıyor (arka planda) ..."
npm start > "$LOG_SERVER" 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"
sleep 4

# basic smoke checks
echo "Smoke test: kök, /api/listings (varsa)"
curl -sS --max-time 6 "$API_URL/" > "$OUTDIR/root.html" 2>/dev/null || echo "Root endpoint başarısız veya yanıt zayıf."
curl -sS --max-time 10 "$API_URL/api/listings" -o "$OUTDIR/listings.json" 2>/dev/null || echo "/api/listings endpoint yok ya da başarısız (bak: diagnostics-output/listings.json)"

echo
echo "5) Görsel URL kontrolleri (Node script kullancak) — check-images.js çalıştırılıyor"
if command -v node >/dev/null 2>&1 && [ -f ./check-images.js ]; then
  node ./check-images.js "$API_URL" "$OUTDIR/listings.json" > "$OUTDIR/check-images.log" 2>&1 || true
  echo "Görsel kontrolleri tamamlandı, logs: $OUTDIR/check-images.log"
else
  echo "check-images.js bulunamadı veya node yok. Görsel kontrolleri atlandı."
fi

echo
echo "6) Sunucu durduruluyor (PID $SERVER_PID)"
kill $SERVER_PID 2>/dev/null || true
sleep 1

echo "=== DIAGNOSTICS FINISHED ==="
echo "Çıktılar: $OUTDIR dizinini kontrol edin (server.log, tests.log, check-images.log vb)."