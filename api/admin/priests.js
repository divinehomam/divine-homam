const { db, send, readBody, authenticated, isCloudinaryImage } = require('../_cms.cjs');

function validate(input) {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const years = input.years_experience === '' || input.years_experience == null ? NaN : Number(input.years_experience);
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  const photo = typeof input.photo_url === 'string' ? input.photo_url.trim() : '';
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (name.length < 2 || name.length > 120) throw Object.assign(new Error('Enter a name between 2 and 120 characters.'), { status: 422 });
  if (!Number.isInteger(years) || years < 0 || years > 80) throw Object.assign(new Error('Enter years of experience from 0 to 80.'), { status: 422 });
  if (description.length < 10 || description.length > 1000) throw Object.assign(new Error('Enter a description between 10 and 1000 characters.'), { status: 422 });
  if (!isCloudinaryImage(photo) || !cloudName || new URL(photo).pathname.split('/')[1] !== cloudName) throw Object.assign(new Error('Upload a priest photo to the configured Cloudinary account.'), { status: 422 });
  return { name, years_experience: years, description, photo_url: photo, updated_at: new Date().toISOString() };
}

module.exports = async function handler(req, res) {
  if (!authenticated(req)) return send(res, 401, { error: 'Please sign in to manage priests.' });
  try {
    if (req.method === 'GET') return send(res, 200, await db('priests?select=*&order=created_at.asc', { method: 'GET' }));
    if (req.method === 'POST') return send(res, 201, (await db('priests', { method: 'POST', body: JSON.stringify(validate(await readBody(req))) }))[0]);
    if (!['PUT', 'DELETE'].includes(req.method)) return send(res, 405, { error: 'Method not allowed.' }, { Allow: 'GET, POST, PUT, DELETE' });
    const id = new URL(req.url, 'http://localhost').searchParams.get('id');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '')) return send(res, 400, { error: 'A valid priest ID is required.' });
    if (req.method === 'PUT') {
      const updated = await db(`priests?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(validate(await readBody(req))) });
      return updated.length ? send(res, 200, updated[0]) : send(res, 404, { error: 'Priest not found.' });
    }
    const deleted = await db(`priests?id=eq.${id}`, { method: 'DELETE' });
    return deleted.length ? send(res, 200, { ok: true }) : send(res, 404, { error: 'Priest not found.' });
  } catch (error) { return send(res, error.status || 500, { error: error.message || 'Could not update priest.' }); }
};
