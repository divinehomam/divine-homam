const crypto = require('node:crypto');

const TABLE = 'pujas';
const fields = ['slug', 'title', 'tamil_subtitle', 'badge_text', 'short_description', 'points', 'package_type', 'duration', 'image_urls', 'image_url', 'image_alt', 'active'];

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw Object.assign(new Error('CMS storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'), { status: 503 });
  return { url: url.replace(/\/$/, ''), key };
}

async function db(path, options = {}) {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/${path}`, { ...options, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: options.prefer || 'return=representation', ...options.headers } });
  const body = await response.text();
  if (!response.ok) {
    let detail = body;
    try { const parsed = JSON.parse(body); detail = parsed.message || parsed.error || parsed.hint || body; } catch {}
    throw Object.assign(new Error(`Supabase ${options.method || 'GET'} failed (${response.status}): ${String(detail).slice(0, 240) || 'unknown database error'}`), { status: response.status >= 500 ? 502 : response.status });
  }
  return body ? JSON.parse(body) : [];
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a)); const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function cloudinarySignature(timestamp) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw Object.assign(new Error('Image uploads are not configured. Set the Cloudinary keys in .env.'), { status: 503 });
  const params = `allowed_formats=avif,jpg,png,webp&folder=pujas&timestamp=${timestamp}`;
  const signature = crypto.createHash('sha1').update(`${params}${apiSecret}`).digest('hex');
  return { cloud_name: cloudName, api_key: apiKey, timestamp, signature, folder: 'pujas', allowed_formats: 'avif,jpg,png,webp' };
}
function secret() { return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || ''; }
function sign(value) { return crypto.createHmac('sha256', secret()).update(value).digest('base64url'); }
function token(username) { const payload = Buffer.from(JSON.stringify({ username, exp: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url'); return `${payload}.${sign(payload)}`; }
function authenticated(req) {
  if (!secret()) return false;
  const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map(c => c.trim().split('=').map(decodeURIComponent)).filter(p => p.length === 2));
  const [payload, signature] = (cookies.admin_session || '').split('.');
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return false;
  try { const session = JSON.parse(Buffer.from(payload, 'base64url').toString()); return session.exp > Date.now() && session.username === process.env.ADMIN_USERNAME; } catch { return false; }
}
function send(res, status, value, headers = {}) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }); res.end(JSON.stringify(value)); }
function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve, reject) => { let data = ''; req.on('data', chunk => { data += chunk; if (data.length > 20000) reject(Object.assign(new Error('Request too large.'), { status: 413 })); }); req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { reject(Object.assign(new Error('Invalid JSON.'), { status: 400 })); } }); req.on('error', reject); });
}
function validate(input) {
  const out = {};
  for (const field of fields) if (field !== 'slug' && field !== 'active') out[field] = input[field];
  for (const key of ['title', 'tamil_subtitle', 'badge_text', 'short_description', 'package_type', 'duration']) {
    if (typeof out[key] !== 'string' || !out[key].trim() || out[key].trim().length > (key === 'short_description' ? 1200 : 180)) throw Object.assign(new Error(`Please provide a valid ${key.replaceAll('_', ' ')}.`), { status: 422 });
    out[key] = out[key].trim();
  }
  if (!Array.isArray(out.points) || out.points.length !== 3 || out.points.some(point => typeof point !== 'string' || !point.trim() || point.trim().length > 180)) throw Object.assign(new Error('Enter exactly three valid pooja points.'), { status: 422 });
  out.points = out.points.map(point => point.trim());
  const urls = Array.isArray(input.image_urls) ? input.image_urls : (typeof input.image_url === 'string' && input.image_url ? [input.image_url] : []);
  if (urls.length > 5 || urls.some(value => typeof value !== 'string' || !isCloudinaryImage(value))) throw Object.assign(new Error('Use the upload control to add up to five Cloudinary images.'), { status: 422 });
  out.image_urls = urls;
  out.image_url = urls[0] || '';
  out.image_alt = typeof out.image_alt === 'string' ? out.image_alt.trim() : out.title;
  out.active = input.active !== false;
  return out;
}
function isCloudinaryImage(value) {
  try { const image = new URL(value); return image.protocol === 'https:' && image.hostname === 'res.cloudinary.com' && /^\/[^/]+\/image\/upload\//.test(image.pathname); }
  catch { return false; }
}
function slugify(value) { return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70); }
async function list() { return db(`${TABLE}?select=${fields.join(',')}&active=eq.true&order=created_at.asc`, { method: 'GET' }); }
module.exports = { db, fields, list, send, readBody, validate, slugify, authenticated, token, safeEqual, cloudinarySignature };
