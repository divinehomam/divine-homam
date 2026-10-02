const { list } = require('./_cms.cjs');

const siteUrl = 'https://www.divinehomam.com';
const pageTitle = name => { const titled = `${name} | Divine Homam`; return titled.length <= 60 ? titled : name; };
const pageDescription = summary => {
  const suffix = ' Discuss this ceremony with Divine Homam.';
  const maxSummaryLength = 160 - suffix.length;
  if (summary.length <= maxSummaryLength) return `${summary}${suffix}`;
  return `${summary.slice(0, maxSummaryLength - 1).replace(/\s+\S*$/, '').trim()}…${suffix}`;
};
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const safeImage = value => {
  if (typeof value !== 'string') return '';
  if (/^\/assets\/[a-zA-Z0-9._-]+$/.test(value)) return value;
  try {
    const image = new URL(value);
    return image.protocol === 'https:' && image.hostname === 'res.cloudinary.com' && /^\/[^/]+\/image\/upload\//.test(image.pathname) ? image.href : '';
  } catch { return ''; }
};
const sendHtml = (res, status, html, cacheControl = 'no-store') => {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': cacheControl, 'X-Robots-Tag': status === 200 ? 'index, follow' : 'noindex, follow' });
  res.end(html);
};
const errorPage = (title, message, status) => `<!doctype html><html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,follow"><title>${escapeHtml(title)} | Divine Homam</title><link rel="stylesheet" href="/styles.css?v=11"></head><body class="seva-page"><main class="seva-main cms-not-found"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p><a href="/">Return to Divine Homam</a></main></body></html>`;

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return sendHtml(res, 405, errorPage('Method not allowed', 'Use a standard page request.', 405));
  const slug = String(req.query?.slug || new URL(req.url, siteUrl).searchParams.get('slug') || '');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return sendHtml(res, 404, errorPage('Pooja not found', 'This ceremony may have been removed.', 404));
  try {
    const puja = (await list()).find(item => item.slug === slug);
    if (!puja) return sendHtml(res, 404, errorPage('Pooja not found', 'This ceremony may have been removed.', 404));
    const url = `${siteUrl}/puja/${encodeURIComponent(puja.slug)}`;
    const title = pageTitle(puja.title);
    const description = pageDescription(puja.short_description);
    const image = safeImage((Array.isArray(puja.image_urls) ? puja.image_urls.find(safeImage) : '') || puja.image_url) || `${siteUrl}/assets/2e71a214000f40a2ac8d5eb090f599c0.png`;
    const points = (Array.isArray(puja.points) ? puja.points : []).map(point => `<li>${escapeHtml(point)}</li>`).join('');
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Service', '@id': `${url}#service`, name: puja.title, serviceType: puja.title, description: puja.short_description, provider: { '@id': `${siteUrl}/#organization` }, areaServed: { '@type': 'AdministrativeArea', name: 'Tamil Nadu, India' }, url, image },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Poojas and Homams', item: `${siteUrl}/#poojas` },
          { '@type': 'ListItem', position: 3, name: puja.title, item: url }
        ] }
      ]
    };
    const html = `<!doctype html>
<html lang="en-IN"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}"><meta name="theme-color" content="#fffdf7">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website"><meta property="og:site_name" content="Divine Homam">
  <meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${url}"><meta property="og:image" content="${escapeHtml(image)}">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${escapeHtml(image)}">
  <title>${escapeHtml(title)}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&amp;family=Plus+Jakarta+Sans:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css?v=11"><script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>
</head><body class="seva-page"><a class="skip-link" href="#main-content">Skip to content</a>
  <header class="seva-header"><div class="seva-header-inner"><a class="seva-brand" href="/" aria-label="Divine Homam home"><img src="/assets/2ccbd3bd79574693815c8369c836bcad.svg" width="280" height="60" alt="Divine Homam"></a><a class="seva-back-link" href="/#poojas">All Pujas</a></div></header>
  <main id="main-content" class="seva-main"><nav class="seva-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/#poojas">Poojas and Homams</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(puja.title)}</span></nav>
    <section class="seva-detail-hero"><div class="seva-detail-copy"><p class="seva-eyebrow">${escapeHtml(puja.badge_text)}</p><h1>${escapeHtml(puja.title)}</h1><p class="cms-tamil" lang="ta">${escapeHtml(puja.tamil_subtitle)}</p><p class="seva-intro">${escapeHtml(puja.short_description)}</p>
      <div class="seva-hero-facts"><div><span>Package type</span><strong>${escapeHtml(puja.package_type)}</strong></div><div><span>Duration</span><strong>${escapeHtml(puja.duration)}</strong></div></div>
      <a class="seva-button" href="/?seva=${encodeURIComponent(puja.title)}#booking-form">Request this Seva</a></div>
      <div class="cms-detail-visual"><img class="cms-detail-image" src="${escapeHtml(image)}" alt="${escapeHtml(puja.image_alt || puja.title)}" fetchpriority="high" decoding="async"></div></section>
    <section class="seva-information"><div class="seva-information-copy"><p class="seva-eyebrow">About this Seva</p><h2>${escapeHtml(puja.title)}</h2><p>${escapeHtml(puja.short_description)}</p><p>Share your preferred date, location, Muhurtham window, and family notes when requesting this ceremony. Priest availability, the confirmed date, and arrangements are discussed with you before your booking is final.</p></div>
      <aside class="seva-inclusions-card"><p class="seva-eyebrow">Ceremony details</p><h2>What is included</h2><ul>${points}</ul><div class="cms-package"><span>Package type</span><strong>${escapeHtml(puja.package_type)}</strong></div><div class="cms-package"><span>Duration</span><strong>${escapeHtml(puja.duration)}</strong></div></aside></section>
  </main><footer class="seva-footer"><a href="/">Divine Homam</a><span>Traditional Tamil Nadu Homam &amp; Pooja Seva</span><a href="tel:+918940308309">Call +91 89403 08309</a></footer>
</body></html>`;
    if (req.method === 'HEAD') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300', 'X-Robots-Tag': 'index, follow' }); return res.end(); }
    return sendHtml(res, 200, html, 'public, max-age=60, stale-while-revalidate=300');
  } catch (error) {
    return sendHtml(res, error.status || 503, errorPage('Pooja temporarily unavailable', 'Ceremony details could not be loaded. Please return to the catalog or contact Divine Homam.', error.status || 503));
  }
};
