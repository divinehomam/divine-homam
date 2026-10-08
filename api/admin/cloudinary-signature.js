const { send, authenticated, cloudinarySignature } = require('../_cms.cjs');

module.exports = async function handler(req, res) {
  if (!authenticated(req)) return send(res, 401, { error: 'Please sign in to upload images.' });
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed.' }, { Allow: 'POST' });
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = new URL(req.url, 'http://localhost').searchParams.get('folder') || 'pujas';
    return send(res, 200, cloudinarySignature(timestamp, folder));
  } catch (error) { return send(res, error.status || 500, { error: error.message || 'Could not prepare image upload.' }); }
};
