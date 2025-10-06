// server.js — Express API using Postgres, JWT auth, presigned S3 uploads
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { query } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use(limiter);

// Local fallback storage (only for dev)
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const S3_BUCKET = process.env.S3_BUCKET;
const AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;

// AWS S3 client if env present
let s3client = null;
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && S3_BUCKET) {
  s3client = new S3Client({ region: AWS_REGION });
}

// Joi schemas
const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().allow('', null)
});
const listingSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().allow('').max(5000),
  price: Joi.number().min(0).required(),
  category: Joi.string().allow('').max(100),
  location: Joi.string().allow('').max(200),
  images: Joi.array().items(Joi.string().uri()).optional()
});

// Auth helpers
function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Unauthorized' });
  const parts = header.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Unauthorized' });
  const token = parts[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Simple endpoints: register / login
app.post('/api/auth/register', async (req, res) => {
  const { error, value } = userSchema.validate(req.body);
  if (error) return res.status(400).json({ error: 'Validation failed', details: error.details.map(d => d.message) });
  const { email, password, name } = value;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const ins = await query('INSERT INTO users (email, password_hash, name) VALUES ($1,$2,$3) RETURNING id,email,name', [email, hashed, name || null]);
    const user = ins.rows[0];
    const token = signToken(user);
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
  try {
    const r = await query('SELECT id, email, password_hash, name FROM users WHERE email = $1', [email]);
    if (!r.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = r.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken(user);
    res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Presign PUT URL for direct browser upload to S3
app.get('/api/presign', async (req, res) => {
  const filename = req.query.filename;
  if (!filename) return res.status(400).json({ error: 'filename required' });
  if (!s3client) return res.status(400).json({ error: 'S3 not configured' });

  const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2,8)}-${path.basename(filename)}`;
  const cmd = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: req.query.contentType || 'application/octet-stream',
    ACL: 'public-read'
  });
  try {
    const url = await getSignedUrl(s3client, cmd, { expiresIn: 60 }); // 60s
    res.json({ url, key, publicUrl: `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}` });
  } catch (err) {
    console.error('presign', err);
    res.status(500).json({ error: 'Failed to presign' });
  }
});

// Create listing (authenticated); expects images[] of public URLs (from S3) or none
app.post('/api/listings', authMiddleware, async (req, res) => {
  const { error, value } = listingSchema.validate(req.body);
  if (error) return res.status(400).json({ error: 'Validation failed', details: error.details.map(d => d.message) });
  const { title, description, price, category, location, images } = value;
  try {
    const ins = await query(
      'INSERT INTO listings (title, description, price, category, location, images, owner_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [title, description, price, category, location, images || [], req.user.id]
    );
    res.status(201).json(ins.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET listings with filtering & pagination
app.get('/api/listings', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const per = Math.min(50, Math.max(1, parseInt(req.query.per || '8', 10)));
  const category = req.query.category || '';
  const q = (req.query.q || '').toLowerCase();
  const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
  const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
  const sort = req.query.sort || 'newest';

  try {
    // build where clauses
    const where = [];
    const params = [];
    let idx = 1;
    if (category) { where.push(`LOWER(category)=LOWER($${idx++})`); params.push(category); }
    if (q) { where.push(`(LOWER(title) LIKE '%' || LOWER($${idx++}) || '%' OR LOWER(description) LIKE '%' || LOWER($${idx-1}) || '%')`); params.push(q); }
    if (minPrice !== null) { where.push(`price >= $${idx++}`); params.push(minPrice); }
    if (maxPrice !== null) { where.push(`price <= $${idx++}`); params.push(maxPrice); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // total count
    const totalRes = await query(`SELECT count(*) FROM listings ${whereSql}`, params);
    const total = Number(totalRes.rows[0].count || 0);

    // ordering
    let orderBy = 'created_at DESC';
    if (sort === 'price_asc') orderBy = 'price ASC';
    if (sort === 'price_desc') orderBy = 'price DESC';

    const offset = (page - 1) * per;
    const itemsRes = await query(`SELECT * FROM listings ${whereSql} ORDER BY ${orderBy} LIMIT $${idx++} OFFSET $${idx++}`, params.concat([per, offset]));
    res.json({ page, per, total, items: itemsRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single listing
app.get('/api/listings/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const r = await query('SELECT * FROM listings WHERE id = $1', [id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve uploads for dev fallback and static public folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/', express.static(path.join(__dirname, 'public')));

// Health
app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API server listening on ${port}`));