const { db, send } = require('./_cms.cjs');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed.' }, { Allow: 'GET' });
  try {
    const priests = await db('priests?select=id,name,years_experience,description,photo_url&order=created_at.asc', { method: 'GET' });
    return send(res, 200, priests, { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' });
  } catch (error) { return send(res, error.status || 500, { error: 'Could not load priests.' }); }
};
