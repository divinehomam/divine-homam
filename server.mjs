import http from 'node:http';
import { readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.join(root, 'public');
const dataRoot = path.resolve(process.env.BOOKINGS_DIR || path.join(root, 'data', 'bookings'));
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.ico': 'image/x-icon' };
const page = await readFile(path.join(publicRoot, 'index.html'), 'utf8');
const allowedOptions = {};
for (const name of ['poojaSelect', 'muhurthamTime', 'citySelect']) {
  const select = page.match(new RegExp(`<select[^>]*id="${name}"[^>]*>([\\s\\S]*?)</select>`))[1];
  allowedOptions[name] = [...select.matchAll(/value="([^"]+)"/g)].map(match => match[1].replaceAll('&amp;', '&'));
}
const inflight = new Map();
function json(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(value));
}
async function saveBooking(id, booking) {
  await mkdir(dataRoot, { recursive: true });
  const file = path.join(dataRoot, `${id}.json`);
  try {
    const existing = JSON.parse(await readFile(file, 'utf8'));
    if (JSON.stringify(existing.details) !== JSON.stringify(booking)) throw Object.assign(new Error('Please refresh the form and submit again.'), { status: 409 });
    return existing;
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const record = { reference: `VP-${id.slice(0, 8).toUpperCase()}`, id, createdAt: new Date().toISOString(), status: 'pending', details: booking };
  await writeFile(file, JSON.stringify(record, null, 2), { flag: 'wx', mode: 0o600 });
  return record;
}
const server = http.createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('X-Frame-Options', 'SAMEORIGIN');
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname === '/api/bookings' && request.method === 'POST') {
      if (request.headers.origin && new URL(request.headers.origin).host !== request.headers.host) return json(response, 403, { error: 'Please submit from this website.' });
      if (!request.headers['content-type']?.startsWith('application/json')) return json(response, 415, { error: 'Please submit a valid booking form.' });
      let body = '';
      for await (const chunk of request) { body += chunk; if (Buffer.byteLength(body) > 16384) return json(response, 413, { error: 'Your request is too large.' }); }
      let input; try { input = JSON.parse(body); } catch { return json(response, 400, { error: 'Please submit a valid booking form.' }); }
      if (!input || typeof input !== 'object') return json(response, 400, { error: 'Please complete the booking form.' });
      const fields = ['fullName', 'phone', 'poojaSelect', 'muhurthamTime', 'ceremonyDate', 'citySelect', 'notes'];
      const details = Object.fromEntries(fields.map(field => [field, typeof input[field] === 'string' ? input[field].trim() : '']));
      const localDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      const parsedDate = new Date(`${details.ceremonyDate}T00:00:00Z`);
      const validDate = /^\d{4}-\d{2}-\d{2}$/.test(details.ceremonyDate) && !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === details.ceremonyDate && details.ceremonyDate >= localDate;
      if (details.fullName.length < 2 || details.fullName.length > 100 || !/^[6-9]\d{9}$/.test(details.phone) || !validDate || details.notes.length > 2000 || Object.entries(allowedOptions).some(([field, options]) => !options.includes(details[field]))) {
        return json(response, 422, { error: 'Please check your name, mobile number, ceremony, and future date, then try again.' });
      }
      const id = request.headers['idempotency-key'];
      if (typeof id !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id)) return json(response, 400, { error: 'Please reload the page and try again.' });
      if (inflight.has(id)) await inflight.get(id);
      const saving = saveBooking(id, details); inflight.set(id, saving);
      try { const saved = await saving; return json(response, 201, { reference: saved.reference, status: saved.status }); }
      finally { inflight.delete(id); }
    }
    if (!['GET', 'HEAD'].includes(request.method)) return json(response, 405, { error: 'Method not allowed.' });
    if (url.pathname.startsWith('/api/')) return json(response, 404, { error: 'Not found.' });
    if (url.pathname === '/favicon.ico') { response.writeHead(204); response.end(); return; }
    const file = path.resolve(publicRoot, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!file.startsWith(publicRoot + path.sep)) return json(response, 403, { error: 'Forbidden.' });
    let info; try { info = await stat(file); if (!info.isFile()) throw new Error(); } catch { return json(response, 404, { error: 'Not found.' }); }
    const headers = { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': file.endsWith('.html') ? 'no-cache' : 'public, max-age=3600', 'Accept-Ranges': 'bytes' };
    const range = request.headers.range;
    if (range) {
      const match = /^bytes=(\d+)-(\d*)$/.exec(range);
      const start = match ? Number(match[1]) : NaN;
      const end = match?.[2] ? Math.min(Number(match[2]), info.size - 1) : info.size - 1;
      if (!Number.isFinite(start) || start > end || start >= info.size) { response.writeHead(416, { 'Content-Range': `bytes */${info.size}` }); response.end(); return; }
      response.writeHead(206, { ...headers, 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${info.size}` });
      if (request.method === 'HEAD') response.end(); else createReadStream(file, { start, end }).pipe(response);
      return;
    }
    response.writeHead(200, headers);
    if (request.method === 'HEAD') response.end(); else createReadStream(file).pipe(response);
  } catch (error) {
    if (!response.headersSent) json(response, error.status || 500, { error: error.status ? error.message : 'Your request could not be saved. Please try again.' });
    else response.end();
    if (!error.status) console.error('Request failed:', error.code || error.name);
  }
});
server.listen(port, host, () => console.log(`Divine Homam is ready at http://${host}:${port}`));
