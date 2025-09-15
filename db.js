// db.js - Postgres pool helper
const { Pool } = require('pg');
const connectionString = process.env.DATABASE_URL || null;

if (!connectionString) {
  console.warn('DATABASE_URL not set — DB-disabled mode (server will fallback to JSON file).');
}

const pool = connectionString ? new Pool({ connectionString }) : null;

async function query(text, params) {
  if (!pool) throw new Error('DB pool not configured (set DATABASE_URL)');
  const res = await pool.query(text, params);
  return res;
}

module.exports = { pool, query };