// server.js — Express API using Postgres, JWT auth, presigned S3 uploads
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const Joi = require('joi');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { query } = require('./db');

const app = express();

// CORS setup for admin frontend
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting - more strict for auth endpoints
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

app.use(limiter);
app.use('/api/auth', authLimiter);

// Local fallback storage (only for dev)
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// JWT secrets and configuration
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'dev-refresh-secret';
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES = '7d';
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

// Auth helper functions
function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role }, 
    JWT_SECRET, 
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email }, 
    REFRESH_SECRET, 
    { expiresIn: REFRESH_TOKEN_EXPIRES }
  );
}

async function storeRefreshToken(userId, token) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await query(
    'INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)',
    [token, userId, expiresAt]
  );
}

async function removeRefreshToken(token) {
  await query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
}

// Audit logging function
async function logAuditEvent(userId, action, entityType, entityId, details, req) {
  try {
    await query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        userId,
        action,
        entityType,
        entityId,
        details ? JSON.stringify(details) : null,
        req.ip,
        req.get('User-Agent')
      ]
    );
  } catch (err) {
    console.error('Audit log error:', err);
  }
}
// Auth middleware
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

// Role-based access control middleware
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const roleHierarchy = { admin: 3, manager: 2, user: 1 };
    const userRole = roleHierarchy[req.user.role] || 0;
    const requiredRole = roleHierarchy[role] || 0;
    
    if (userRole < requiredRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
  const { error, value } = userSchema.validate(req.body);
  if (error) return res.status(400).json({ error: 'Validation failed', details: error.details.map(d => d.message) });
  const { email, password, name } = value;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const ins = await query(
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1,$2,$3,$4) RETURNING id,email,name,role', 
      [email, hashed, name || null, 'user']
    );
    const user = ins.rows[0];
    
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    await storeRefreshToken(user.id, refreshToken);
    
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    await logAuditEvent(user.id, 'USER_REGISTER', 'user', user.id, { email }, req);
    
    res.json({ user, accessToken });
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
    const r = await query('SELECT id, email, password_hash, name, role FROM users WHERE email = $1', [email]);
    if (!r.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = r.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    await storeRefreshToken(user.id, refreshToken);
    
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    await logAuditEvent(user.id, 'USER_LOGIN', 'user', user.id, { email }, req);
    
    res.json({ 
      user: { id: user.id, email: user.email, name: user.name, role: user.role }, 
      accessToken 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });
  
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    
    // Check if token exists in database
    const tokenResult = await query('SELECT user_id FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()', [refreshToken]);
    if (!tokenResult.rows.length) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    // Get user data
    const userResult = await query('SELECT id, email, name, role FROM users WHERE id = $1', [decoded.id]);
    if (!userResult.rows.length) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Generate new tokens
    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);
    
    // Replace refresh token in database
    await removeRefreshToken(refreshToken);
    await storeRefreshToken(user.id, newRefreshToken);
    
    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({ 
      user: { id: user.id, email: user.email, name: user.name, role: user.role }, 
      accessToken: newAccessToken 
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    await removeRefreshToken(refreshToken);
  }
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
});

// File upload endpoint
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

app.post('/api/upload', authMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const fileUrls = req.files.map(file => {
      return `/uploads/${file.filename}`;
    });
    
    await logAuditEvent(req.user.id, 'FILES_UPLOAD', 'file', null, { count: req.files.length }, req);
    
    res.json({ urls: fileUrls });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Admin endpoints
app.get('/api/admin/users', authMiddleware, requireRole('manager'), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const per = Math.min(50, Math.max(1, parseInt(req.query.per || '10', 10)));
    const search = req.query.search || '';
    
    let whereClause = '';
    let params = [];
    
    if (search) {
      whereClause = 'WHERE email ILIKE $1 OR name ILIKE $1';
      params.push(`%${search}%`);
    }
    
    const totalRes = await query(`SELECT count(*) FROM users ${whereClause}`, params);
    const total = Number(totalRes.rows[0].count || 0);
    
    const offset = (page - 1) * per;
    const usersRes = await query(
      `SELECT id, email, name, role, created_at FROM users ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      params.concat([per, offset])
    );
    
    res.json({ page, per, total, users: usersRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.patch('/api/admin/users/:id/role', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;
    
    if (!['user', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const result = await query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, name, role',
      [role, userId]
    );
    
    if (!result.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await logAuditEvent(req.user.id, 'USER_ROLE_CHANGE', 'user', userId, { newRole: role }, req);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/audit', authMiddleware, requireRole('manager'), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const per = Math.min(50, Math.max(1, parseInt(req.query.per || '20', 10)));
    const action = req.query.action || '';
    const entityType = req.query.entityType || '';
    
    let whereClause = '';
    let params = [];
    let paramIndex = 1;
    
    if (action) {
      whereClause += `${whereClause ? ' AND ' : 'WHERE '}action = $${paramIndex++}`;
      params.push(action);
    }
    
    if (entityType) {
      whereClause += `${whereClause ? ' AND ' : 'WHERE '}entity_type = $${paramIndex++}`;
      params.push(entityType);
    }
    
    const totalRes = await query(`SELECT count(*) FROM audit_logs ${whereClause}`, params);
    const total = Number(totalRes.rows[0].count || 0);
    
    const offset = (page - 1) * per;
    const logsRes = await query(
      `SELECT al.*, u.email as user_email FROM audit_logs al 
       LEFT JOIN users u ON al.user_id = u.id 
       ${whereClause} ORDER BY al.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params.concat([per, offset])
    );
    
    res.json({ page, per, total, logs: logsRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
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
    
    await logAuditEvent(req.user.id, 'LISTING_CREATE', 'listing', ins.rows[0].id, { title }, req);
    
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

// Admin listing management endpoints
app.put('/api/admin/listings/:id', authMiddleware, requireRole('manager'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { error, value } = listingSchema.validate(req.body);
    if (error) return res.status(400).json({ error: 'Validation failed', details: error.details.map(d => d.message) });
    
    const { title, description, price, category, location, images } = value;
    
    const result = await query(
      'UPDATE listings SET title = $1, description = $2, price = $3, category = $4, location = $5, images = $6, updated_at = NOW() WHERE id = $7 RETURNING *',
      [title, description, price, category, location, images || [], id]
    );
    
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    await logAuditEvent(req.user.id, 'LISTING_UPDATE', 'listing', id, { title }, req);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/listings/:id', authMiddleware, requireRole('manager'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const result = await query('DELETE FROM listings WHERE id = $1 RETURNING title', [id]);
    
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    await logAuditEvent(req.user.id, 'LISTING_DELETE', 'listing', id, { title: result.rows[0].title }, req);
    
    res.json({ message: 'Listing deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/listings/bulk-delete', authMiddleware, requireRole('manager'), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty ids array' });
    }
    
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const result = await query(`DELETE FROM listings WHERE id IN (${placeholders}) RETURNING id, title`, ids);
    
    await logAuditEvent(req.user.id, 'LISTING_BULK_DELETE', 'listing', null, { count: result.rowCount, ids }, req);
    
    res.json({ deleted: result.rowCount, listings: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/listings/export', authMiddleware, requireRole('manager'), async (req, res) => {
  try {
    const result = await query(`
      SELECT l.id, l.title, l.description, l.price, l.category, l.location, 
             l.created_at, u.email as owner_email
      FROM listings l 
      LEFT JOIN users u ON l.owner_id = u.id 
      ORDER BY l.created_at DESC
    `);
    
    await logAuditEvent(req.user.id, 'LISTING_EXPORT', 'listing', null, { count: result.rowCount }, req);
    
    res.json({ listings: result.rows });
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