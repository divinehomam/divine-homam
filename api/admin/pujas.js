const { db, send, readBody, validate, slugify, authenticated } = require('../_cms.cjs');
module.exports = async function handler(req, res) {
  if (!authenticated(req)) return send(res, 401, { error: 'Please sign in to manage pujas.' });
  try {
    if (req.method === 'GET') return send(res, 200, await db('pujas?select=*&order=created_at.asc', { method: 'GET' }));
    const body = await readBody(req);
    if (req.method === 'POST') {
      const values = validate(body); values.slug = slugify(body.slug || values.title);
      if (!values.slug) return send(res, 422, { error: 'Title must contain English letters or numbers to create a page URL.' });
      return send(res, 201, (await db('pujas', { method: 'POST', body: JSON.stringify(values) }))[0]);
    }
    const slug = slugify(decodeURIComponent(new URL(req.url, 'http://localhost').searchParams.get('slug') || ''));
    if (!slug) return send(res, 400, { error: 'Puja slug is required.' });
    if (req.method === 'PUT') {
      const values = validate(body); values.slug = slugify(body.slug || values.title);
      if (!values.slug) return send(res, 422, { error: 'Title must contain English letters or numbers to create a page URL.' });
      const updated = await db(`pujas?slug=eq.${encodeURIComponent(slug)}`, { method: 'PATCH', body: JSON.stringify(values) });
      return updated.length ? send(res, 200, updated[0]) : send(res, 404, { error: 'Puja not found.' });
    }
    if (req.method === 'DELETE') { await db(`pujas?slug=eq.${encodeURIComponent(slug)}`, { method: 'DELETE', prefer: 'return=minimal' }); return send(res, 200, { ok: true }); }
    return send(res, 405, { error: 'Method not allowed.' }, { Allow: 'GET, POST, PUT, DELETE' });
  } catch (error) { return send(res, error.status || 500, { error: error.message || 'Could not update puja.' }); }
};
