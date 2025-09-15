```markdown
# İlanSite — Tam Yol Haritası: DB, Auth, S3 Upload, CI & Tests

Bu güncelleme ile demo proje şu ek özelliklere kavuştu:
- Postgres veritabanı (listings + users)
- JWT tabanlı auth (register/login)
- Presigned S3 PUT upload endpoint (/api/presign) — tarayıcı doğrudan S3'e PUT yapar
- API-first frontend: scripts.js artık /api/listings ile çalışır; fallback static JSON var
- Basic tests (jest + supertest) ve GitHub Actions CI workflow
- Güvenlik: helmet, express-rate-limit, Joi validation, multer fallback

Hızlı başlatma (lokal geliştirme):
1. Ortam değişkenleri (örnek .env):
   DATABASE_URL=postgres://user:pass@localhost:5432/dbname
   JWT_SECRET=your-jwt-secret
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=eu-central-1
   S3_BUCKET=your-bucket-name

2. DB migration:
   - PostgreSQL çalıştırın.
   - npm install
   - npm run migrate (psql komutunu çalıştırır; veya elle psql -f migrations/init.sql)

3. Server:
   - npm start (veya npm run dev)

4. Frontend:
   - Statik dosyaları /public veya doğrudan root ile sunabilirsiniz.
   - Eğer server'ı 4000'de çalıştırdıysanız, frontend fetch'leri /api/* adresine gider.

Notlar:
- server.js örnek amaçlıdır; production için TLS, CORS restrict, input sanitization, logging ve rate limits iyileştirin.
- Tests: tests/api.test.js örnek iskelettir. En doğru test için server.js'i app olarak export edip test içinde require edip kapatmanız gerekir.

```