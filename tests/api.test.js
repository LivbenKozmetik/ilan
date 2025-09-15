// tests/api.test.js — basic supertest skeleton (expand with more cases)
const request = require('supertest');
const fs = require('fs');
const path = require('path');

let server;
beforeAll(() => {
  // start server via child process or require server.js if exported as app (this server.js starts listening directly)
  // For more robust testing you'd refactor server.js to export the app without listening.
  server = require('../server'); // ensure server.js is test-friendly (may need refactor)
});

afterAll(async () => {
  // close server if needed
  try { server && server.close && server.close(); } catch {}
});

test('healthz should return ok', async () => {
  const res = await request('http://localhost:4000').get('/healthz');
  expect(res.status).toBe(200);
  expect(res.body.status).toBe('ok');
});

// Add more tests: auth register/login, create listing (mock S3 or bypass), GET listings...