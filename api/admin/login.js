const { send, readBody, safeEqual, token, authenticated } = require('../_cms.cjs');
module.exports = async function handler(req, res) {
  if (req.method === 'DELETE') {
    const host = (req.headers.host || '').split(':')[0];
    const secure = req.headers['x-forwarded-proto'] === 'https' || !['localhost', '127.0.0.1'].includes(host);
    return send(res, 200, { ok: true }, { 'Set-Cookie': `admin_session=; Path=/; HttpOnly; ${secure ? 'Secure; ' : ''}SameSite=Strict; Max-Age=0` });
  }
  if (req.method === 'GET') return send(res, 200, { authenticated: authenticated(req) });
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed.' }, { Allow: 'GET, POST, DELETE' });
  try {
    const body = await readBody(req);
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) return send(res, 503, { error: 'Set ADMIN_USERNAME, ADMIN_PASSWORD, and ADMIN_SESSION_SECRET to enable admin access.' });
    if (!safeEqual(body.username || '', process.env.ADMIN_USERNAME) || !safeEqual(body.password || '', process.env.ADMIN_PASSWORD)) return send(res, 401, { error: 'Incorrect username or password.' });
    const host = (req.headers.host || '').split(':')[0];
    const secure = req.headers['x-forwarded-proto'] === 'https' || !['localhost', '127.0.0.1'].includes(host);
    return send(res, 200, { ok: true }, { 'Set-Cookie': `admin_session=${token(process.env.ADMIN_USERNAME)}; Path=/; HttpOnly; ${secure ? 'Secure; ' : ''}SameSite=Strict; Max-Age=28800` });
  } catch (error) { return send(res, error.status || 400, { error: error.message }); }
};
