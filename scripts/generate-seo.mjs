import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteUrl = 'https://www.divinehomam.com';
const services = JSON.parse(await readFile(path.join(root, 'src', 'sevas.json'), 'utf8'));
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const jsonLd = value => JSON.stringify(value).replaceAll('<', '\\u003c');

const indexPath = path.join(root, 'public', 'index.html');
let home = await readFile(indexPath, 'utf8');
const title = 'Homam & Pooja Services in Tamil Nadu | Divine Homam';
const description = 'Book traditional homams and poojas in Tamil Nadu with Divine Homam. Explore ceremony details, discuss your preferred Muhurtham, and request a Vedic priest.';
const organizationId = `${siteUrl}/#organization`;
const homeSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: 'Divine Homam',
      url: `${siteUrl}/`,
      logo: `${siteUrl}/assets/2ccbd3bd79574693815c8369c836bcad.svg`,
      telephone: '+91-89403-08309',
      areaServed: { '@type': 'AdministrativeArea', name: 'Tamil Nadu, India' },
      contactPoint: { '@type': 'ContactPoint', telephone: '+91-89403-08309', contactType: 'customer service', areaServed: 'IN', availableLanguage: ['English', 'Tamil'] }
    },
    { '@type': 'WebSite', '@id': `${siteUrl}/#website`, url: `${siteUrl}/`, name: 'Divine Homam', inLanguage: 'en-IN', publisher: { '@id': organizationId } },
    { '@type': 'WebPage', '@id': `${siteUrl}/#webpage`, url: `${siteUrl}/`, name: title, description, isPartOf: { '@id': `${siteUrl}/#website` }, about: { '@id': organizationId }, inLanguage: 'en-IN' },
    { '@type': 'Service', '@id': `${siteUrl}/#homam-pooja-service`, name: 'Homam and Pooja Services', serviceType: 'Traditional Hindu homam and pooja ceremonies', provider: { '@id': organizationId }, areaServed: { '@type': 'AdministrativeArea', name: 'Tamil Nadu, India' } }
  ]
};
const homeHead = `<!-- SEO META START -->
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${siteUrl}/">
<meta name="theme-color" content="#fffdf7">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Divine Homam">
<meta property="og:locale" content="en_IN">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${siteUrl}/">
<meta property="og:image" content="${siteUrl}/assets/2e71a214000f40a2ac8d5eb090f599c0.png">
<meta property="og:image:alt" content="Vedic homam ceremony performed by a Tamil Nadu priest">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${siteUrl}/assets/2e71a214000f40a2ac8d5eb090f599c0.png">
<script type="application/ld+json">${jsonLd(homeSchema)}</script>
<!-- SEO META END -->`;
home = home.replace(/<!-- SEO META START -->[\s\S]*?<!-- SEO META END -->/g, '');
home = home
  .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
  .replace(/<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/gi, '')
  .replace(/<meta\b(?=[^>]*\bname=["']theme-color["'])[^>]*>/gi, '')
  .replace(/<\/head>/i, `${homeHead}\n</head>`);
await writeFile(indexPath, home, 'utf8');

const urls = [`${siteUrl}/`, ...services.map(service => `${siteUrl}/puja/${encodeURIComponent(service.slug)}`)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${escapeHtml(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
await writeFile(path.join(root, 'public', 'sitemap.xml'), sitemap, 'utf8');

const robots = `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${siteUrl}/sitemap.xml\n`;
await writeFile(path.join(root, 'public', 'robots.txt'), robots, 'utf8');

const llms = `# Divine Homam\n\n> Traditional homam and pooja ceremony requests across Tamil Nadu, India.\n\n## Main pages\n- [Home](${siteUrl}/): Ceremony catalog, booking request, and service information.\n\n## Ceremony guides\n${services.map(service => `- [${service.title}](${siteUrl}/puja/${service.slug}): ${service.summary}`).join('\n')}\n\n## Contact\n- Phone: +91 89403 08309\n- Service area: Chennai, Coimbatore, Madurai, Trichy, and other locations in Tamil Nadu.\n`;
await writeFile(path.join(root, 'public', 'llms.txt'), llms, 'utf8');
