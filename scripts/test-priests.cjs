const assert = require('node:assert/strict');
const { test } = require('node:test');

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
process.env.CLOUDINARY_CLOUD_NAME = 'testcloud';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_SESSION_SECRET = 'test-secret-for-priest-cms';

const { token } = require('../api/_cms.cjs');
const publicHandler = require('../api/priests.js');
const adminHandler = require('../api/admin/priests.js');
const photo = 'https://res.cloudinary.com/testcloud/image/upload/v1/priest.jpg';

async function call(handler, method, url, body, authenticated = false) {
  let status;
  let output;
  const req = { method, url, body, headers: authenticated ? { cookie: `admin_session=${token('admin')}` } : {} };
  const res = { writeHead(code) { status = code; }, end(value) { output = JSON.parse(value); } };
  await handler(req, res);
  return { status, output };
}

test('public endpoint returns database priest profiles', async () => {
  global.fetch = async () => new Response(JSON.stringify([{ id: 'one', name: 'Priest One', years_experience: 12, description: 'Experienced priest', photo_url: photo }]), { status: 200 });
  const result = await call(publicHandler, 'GET', '/api/priests');
  assert.equal(result.status, 200);
  assert.equal(result.output[0].name, 'Priest One');
});

test('admin endpoint requires a session', async () => {
  const result = await call(adminHandler, 'GET', '/api/admin/priests');
  assert.equal(result.status, 401);
});

test('admin can create and update a valid profile', async () => {
  const requests = [];
  global.fetch = async (url, options) => { requests.push({ url, options }); return new Response(JSON.stringify([{ id: '1', ...JSON.parse(options.body) }]), { status: 200 }); };
  const data = { name: 'Priest One', years_experience: 12, description: 'Guides family ceremonies with care.', photo_url: photo };
  const created = await call(adminHandler, 'POST', '/api/admin/priests', data, true);
  assert.equal(created.status, 201);
  assert.equal(requests[0].options.method, 'POST');
  assert.equal(JSON.parse(requests[0].options.body).years_experience, 12);
  const updated = await call(adminHandler, 'PUT', '/api/admin/priests?id=123e4567-e89b-12d3-a456-426614174000', { ...data, years_experience: 13 }, true);
  assert.equal(updated.status, 200);
  assert.equal(requests[1].options.method, 'PATCH');
});

test('admin rejects a photo outside the configured Cloudinary account', async () => {
  const result = await call(adminHandler, 'POST', '/api/admin/priests', { name: 'Priest One', years_experience: 12, description: 'Guides family ceremonies with care.', photo_url: 'https://res.cloudinary.com/another/image/upload/v1/photo.jpg' }, true);
  assert.equal(result.status, 422);
});

test('admin can delete an existing profile', async () => {
  global.fetch = async () => new Response(JSON.stringify([{ id: '123e4567-e89b-12d3-a456-426614174000' }]), { status: 200 });
  const result = await call(adminHandler, 'DELETE', '/api/admin/priests?id=123e4567-e89b-12d3-a456-426614174000', null, true);
  assert.equal(result.status, 200);
  assert.equal(result.output.ok, true);
});
