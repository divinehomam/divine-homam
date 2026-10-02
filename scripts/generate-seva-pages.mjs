import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const services = JSON.parse(await readFile(path.join(root, 'src', 'sevas.json'), 'utf8'));
const output = path.join(root, 'public', 'sevas');
const homePagePath = path.join(root, 'public', 'index.html');
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const siteUrl = 'https://www.divinehomam.com';
const jsonLd = value => JSON.stringify(value).replaceAll('<', '\\u003c');
const seoDescription = summary => {
  const suffix = ' Discuss this ceremony with Divine Homam.';
  const maxSummaryLength = 160 - suffix.length;
  if (summary.length <= maxSummaryLength) return `${summary}${suffix}`;
  const shortened = summary.slice(0, maxSummaryLength - 1).replace(/\s+\S*$/, '');
  return `${shortened.trim()}…${suffix}`;
};

await mkdir(output, { recursive: true });
let homePage = await readFile(homePagePath, 'utf8');
const eol = homePage.includes('\r\n') ? '\r\n' : '\n';

for (const seva of services) {
  const title = escapeHtml(seva.title);
  const summary = escapeHtml(seva.summary);
  const metaDescription = escapeHtml(seoDescription(seva.summary));
  const rawPageTitle = `${seva.title} | Divine Homam`;
  const pageTitle = escapeHtml(rawPageTitle.length <= 60 ? rawPageTitle : seva.title);
  const bookingValue = seva.bookingValue || seva.title;
  const detailMarker = `data-seva-detail="${seva.slug}"`;
  if (!homePage.includes(detailMarker)) {
    const buttonPattern = new RegExp(`<button\\b(?=[^>]*\\bdata-book="${escapeRegExp(escapeHtml(bookingValue))}")[^>]*>[\\s\\S]*?<\\/button>`);
    if (!buttonPattern.test(homePage)) throw new Error(`Could not find the home page booking button for ${seva.title}.`);
    const detailLink = `<a class="service-details-link" ${detailMarker} href="/sevas/${seva.slug}.html" aria-label="View details for ${title}">View details</a>${eol}`;
    homePage = homePage.replace(buttonPattern, `${detailLink}$&`);
  }
  const bookingUrl = `/?seva=${encodeURIComponent(bookingValue)}#booking-form`;
  const placeholders = [
    ['02', 'Preparation and samagri', ''],
    ['03', 'Priest and ritual details', ''],
    ['04', 'Family ceremony moment', '']
  ].map(([number, caption, modifier]) => `
        <figure class="seva-gallery-item ${modifier}">
          <div class="seva-photo-placeholder" role="img" aria-label="Photo ${number} placeholder: ${escapeHtml(caption)}">
            <span class="seva-photo-number">${number}</span>
            <span class="material-symbols-outlined" aria-hidden="true">add_photo_alternate</span>
            <span class="seva-photo-note">Photo to be added</span>
          </div>
          <figcaption>${escapeHtml(caption)}</figcaption>
        </figure>`).join('');
  const feature = seva.image
    ? `
        <figure class="seva-gallery-item seva-gallery-feature">
          <img class="seva-gallery-photo" src="${escapeHtml(seva.image)}" alt="${escapeHtml(seva.imageAlt || title)}" width="1200" height="896" loading="lazy" decoding="async">
          <figcaption>Main ceremony photograph</figcaption>
        </figure>`
    : `
        <figure class="seva-gallery-item seva-gallery-feature">
          <div class="seva-photo-placeholder" role="img" aria-label="Photo 01 placeholder: Main ceremony photograph">
            <span class="seva-photo-number">01</span>
            <span class="material-symbols-outlined" aria-hidden="true">add_photo_alternate</span>
            <span class="seva-photo-note">Photo to be added</span>
          </div>
          <figcaption>Main ceremony photograph</figcaption>
        </figure>`;
  const slots = `${feature}${placeholders}`;
  const inclusions = seva.inclusions.map(item => `
            <li><span class="material-symbols-outlined" aria-hidden="true">check_circle</span><span>${escapeHtml(item)}</span></li>`).join('');
  const description = (seva.description || []).map(paragraph => `
        <p>${escapeHtml(paragraph)}</p>`).join('');
  const benefits = (seva.benefits || []).map(item => `
          <li><span class="material-symbols-outlined" aria-hidden="true">check_circle</span><span>${escapeHtml(item)}</span></li>`).join('');
  const benefitsSection = benefits ? `
    <section class="seva-benefits" aria-labelledby="benefits-title">
      <div class="seva-benefits-heading">
        <p class="seva-eyebrow">Traditional Significance</p>
        <h2 id="benefits-title">${escapeHtml(seva.benefitsTitle || 'Key Benefits')}</h2>
        <p>Shared by devotees who request this seva, and offered as prayers during the ceremony.</p>
      </div>
      <ul class="seva-benefits-list">${benefits}
      </ul>
    </section>` : '';
  const canonicalUrl = `${siteUrl}/puja/${seva.slug}`;
  const pageSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Service', '@id': `${canonicalUrl}#service`, name: seva.title, serviceType: seva.title, description: seva.summary, provider: { '@id': `${siteUrl}/#organization` }, areaServed: { '@type': 'AdministrativeArea', name: 'Tamil Nadu, India' }, url: canonicalUrl, image: seva.image ? `${siteUrl}${seva.image}` : undefined },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
        { '@type': 'ListItem', position: 2, name: 'Poojas and Homams', item: `${siteUrl}/#poojas` },
        { '@type': 'ListItem', position: 3, name: seva.title, item: canonicalUrl }
      ] }
    ]
  };
  const page = `<!doctype html>
<html lang="en-IN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${metaDescription}">
  <meta name="theme-color" content="#fffdf7">
  <title>${pageTitle}</title>
  <link rel="canonical" href="${canonicalUrl}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Divine Homam">
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${metaDescription}">
  <meta property="og:url" content="${canonicalUrl}">
  ${seva.image ? `<meta property="og:image" content="${siteUrl}${escapeHtml(seva.image)}">` : ''}
  <meta name="twitter:card" content="${seva.image ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${pageTitle}">
  <meta name="twitter:description" content="${metaDescription}">
  <script type="application/ld+json">${jsonLd(pageSchema)}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&amp;family=Plus+Jakarta+Sans:wght@400;500;600;700&amp;family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css?v=11">
</head>
<body class="seva-page">
  <a class="skip-link" href="#main-content">Skip to content</a>
  <header class="seva-header">
    <div class="seva-header-inner">
      <a class="seva-brand" href="/" aria-label="Divine Homam home">
        <img src="/assets/2ccbd3bd79574693815c8369c836bcad.svg?v=3" width="280" height="60" alt="Divine Homam">
      </a>
      <div class="seva-header-actions">
        <a class="seva-back-link" href="/#poojas">All Sevas</a>
        <a class="seva-button seva-button-small" href="${escapeHtml(bookingUrl)}">Request this Seva</a>
      </div>
    </div>
  </header>
  <main id="main-content" class="seva-main">
    <nav class="seva-breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a><span aria-hidden="true">/</span><a href="/#poojas">Sevas</a><span aria-hidden="true">/</span><span aria-current="page">${title}</span>
    </nav>
    <section class="seva-detail-hero" aria-labelledby="seva-title">
      <div class="seva-detail-copy">
        <p class="seva-eyebrow"><span aria-hidden="true"></span> Divine Homam · Seva Guide</p>
        <h1 id="seva-title">${title}</h1>
        <p class="seva-intro">${summary}</p>
        <div class="seva-hero-facts" aria-label="Seva summary">
          <div><span>Typical duration</span><strong>${escapeHtml(seva.duration)}</strong></div>
          <div><span>Dakshina guidance</span><strong>${escapeHtml(seva.dakshina)}</strong></div>
        </div>
        <div class="seva-hero-actions">
          <a class="seva-button" href="${escapeHtml(bookingUrl)}">Request this Seva <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></a>
          <a class="seva-text-link" href="/#poojas">Browse all Sevas</a>
        </div>
      </div>
      <div class="seva-gallery" aria-label="${title} photo gallery">
        ${slots}
      </div>
    </section>
    <section class="seva-information" aria-labelledby="about-seva">
      <div class="seva-information-copy">
        <p class="seva-eyebrow">About this Seva</p>
        <h2 id="about-seva">A ceremony planned around your family</h2>
        <p>${summary}</p>${description}
        <p>Share your preferred date, location, Muhurtham window, and any family or tradition notes. The coordinator will confirm priest availability, the final timing, and samagri arrangements with you.</p>
      </div>
      <aside class="seva-inclusions-card" aria-labelledby="included-title">
        <p class="seva-eyebrow">Ceremony details</p>
        <h2 id="included-title">What is included</h2>
        <ul>${inclusions}
        </ul>
      </aside>
    </section>${benefitsSection}
    <section class="seva-planning" aria-labelledby="planning-title">
      <div class="seva-planning-heading">
        <p class="seva-eyebrow">From request to confirmation</p>
        <h2 id="planning-title">Plan your ceremony with clarity</h2>
        <p>Use the request form to share the details the Vedic coordinator needs to prepare a plan for your family.</p>
      </div>
      <ol class="seva-planning-steps">
        <li><span>01</span><div><h3>Share your details</h3><p>Choose a preferred date and Muhurtham window, and add your city and family notes.</p></div></li>
        <li><span>02</span><div><h3>Discuss the arrangements</h3><p>The coordinator will follow up about priest availability, ceremony details, and samagri.</p></div></li>
        <li><span>03</span><div><h3>Confirm the plan</h3><p>Review the agreed arrangements and timing with the coordinator before the ceremony.</p></div></li>
      </ol>
    </section>
    <section class="seva-bottom-cta" aria-labelledby="request-seva-title">
      <div><p class="seva-eyebrow">Begin with a request</p><h2 id="request-seva-title">Discuss ${title} with our coordinator</h2><p>Share your preferred date and ceremony details. Priest availability and Muhurtham are confirmed personally.</p></div>
      <a class="seva-button seva-button-light" href="${escapeHtml(bookingUrl)}">Request Muhurtham <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></a>
    </section>
  </main>
  <footer class="seva-footer">
    <a href="/">Divine Homam</a><span>Traditional Tamil Nadu Homam &amp; Pooja Seva</span>
    <a href="tel:+918940308309">Call +91 89403 08309</a>
  </footer>
</body>
</html>
`;
  await writeFile(path.join(output, `${seva.slug}.html`), page, 'utf8');
}

await writeFile(homePagePath, homePage, 'utf8');
