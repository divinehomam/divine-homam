'use strict';
const esc = value => String(value || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isPujaImage = value => {
  if (typeof value !== 'string') return false;
  if (/^\/assets\/[a-zA-Z0-9._-]+$/.test(value)) return true;
  try { const image = new URL(value); return image.protocol === 'https:' && image.hostname === 'res.cloudinary.com' && /^\/[^/]+\/image\/upload\//.test(image.pathname); } catch { return false; }
};
const listPoints = points => (Array.isArray(points) ? points : []).map(point => `<li><span class="material-symbols-outlined" aria-hidden="true">check_circle</span><span>${esc(point)}</span></li>`).join('');
function card(puja) {
  const images = Array.isArray(puja.image_urls) ? puja.image_urls.filter(isPujaImage) : [];
  const primaryImage = images[0] || (isPujaImage(puja.image_url) ? puja.image_url : '');
  const image = primaryImage ? `<img src="${esc(primaryImage)}" alt="${esc(puja.image_alt || puja.title)}" loading="lazy" decoding="async">` : '<div class="cms-image-placeholder"><span aria-hidden="true">✦</span><small>No images added</small></div>';
  const types = `${/homam/i.test(puja.title) ? 'homam' : ''} ${/family|griha|vratham|pooja|60th|70th/i.test(puja.title) ? 'family' : ''} ${/shanti|dosha|mandala/i.test(puja.title) ? 'shanti' : ''}`.trim();
  return `<article class="pooja-card cms-card" data-type="${types}"><div class="cms-card-image">${image}<span class="cms-badge">${esc(puja.badge_text)}</span></div><div class="cms-card-body"><div class="cms-facts"><span>${esc(puja.package_type)}</span><span>◷ ${esc(puja.duration)}</span></div><h3 class="cms-title">${esc(puja.title)}</h3><p class="cms-tamil" lang="ta">${esc(puja.tamil_subtitle)}</p><p class="cms-description">${esc(puja.short_description)}</p><ul class="cms-points">${listPoints(puja.points)}</ul><div class="cms-package"><span>Package type</span><strong>${esc(puja.package_type)}</strong></div><a class="service-details-link" href="/pooja.html?slug=${encodeURIComponent(puja.slug)}">View details</a><button class="cms-book" type="button" data-book="${esc(puja.title)}">Book This Seva</button></div></article>`;
}
async function loadPujas() {
  const grid = document.querySelector('#poojaGrid');
  if (!grid) return [];
  try {
    const response = await fetch('/api/pujas', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Puja catalog is unavailable');
    const pujas = await response.json();
    if (!Array.isArray(pujas) || !pujas.length) { grid.innerHTML = '<p class="cms-empty">Puja services will be available soon.</p>'; return []; }
    grid.innerHTML = pujas.map(card).join('');
    const select = document.querySelector('#poojaSelect');
    if (select) select.innerHTML = '<option value="" disabled selected>Select a ceremony</option>' + pujas.map(p => `<option value="${esc(p.title)}">${esc(p.title)}</option>`).join('');
    const requested = new URLSearchParams(location.search).get('seva');
    if (select && requested && pujas.some(p => p.title === requested)) select.value = requested;
    const status = document.querySelector('#filterStatus'); if (status) status.textContent = `${pujas.length} ceremonies shown.`;
    return pujas;
  } catch { return []; }
}
document.addEventListener('click', event => {
  const book = event.target.closest('[data-book]');
  if (book && document.querySelector('#poojaBookingForm')) {
    const select = document.querySelector('#poojaSelect'); select.value = book.dataset.book;
    const target = document.querySelector('#booking-form'); target.scrollIntoView({ behavior: 'smooth' });
  }
});
document.querySelectorAll('.tab-btn').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.tab-btn').forEach(tab => { tab.setAttribute('aria-pressed', String(tab === button)); });
  const category = button.dataset.category;
  document.querySelectorAll('.cms-card').forEach(item => { item.hidden = category !== 'all' && !(item.dataset.type || '').split(' ').includes(category); });
}));

if (document.body.dataset.page === 'pooja') {
  (async () => {
    const slug = new URLSearchParams(location.search).get('slug');
    const main = document.querySelector('#poojaDetail');
    try {
      const response = await fetch('/api/pujas'); if (!response.ok) throw new Error();
      const puja = (await response.json()).find(item => item.slug === slug);
      if (!puja) throw new Error();
      document.title = `${puja.title} | Divine Homam`;
      const images = Array.isArray(puja.image_urls) ? puja.image_urls.filter(isPujaImage) : [];
      if (!images.length && isPujaImage(puja.image_url)) images.push(puja.image_url);
      const gallery = images.length
        ? images.map((url, index) => `<figure class="cms-detail-photo${index === 0 ? ' cms-detail-feature' : ''}"><img src="${esc(url)}" alt="${esc(puja.image_alt || `${puja.title} photo ${index + 1}`)}" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async"></figure>`).join('')
        : '<div class="cms-image-placeholder cms-detail-image"><span aria-hidden="true">✦</span><small>No images added</small></div>';
      main.innerHTML = `<nav class="seva-breadcrumb"><a href="/">Home</a><span>/</span><a href="/#poojas">Sevas</a><span>/</span><span>${esc(puja.title)}</span></nav><section class="seva-detail-hero"><div class="seva-detail-copy"><p class="seva-eyebrow">${esc(puja.badge_text)}</p><h1>${esc(puja.title)}</h1><p class="cms-tamil" lang="ta">${esc(puja.tamil_subtitle)}</p><p class="seva-intro">${esc(puja.short_description)}</p><div class="seva-hero-facts"><div><span>Package type</span><strong>${esc(puja.package_type)}</strong></div><div><span>Duration</span><strong>${esc(puja.duration)}</strong></div></div><a class="seva-button" href="/?seva=${encodeURIComponent(puja.title)}#booking-form">Request this Seva →</a></div><div class="cms-detail-visual"><div class="cms-detail-gallery">${gallery}</div></div></section><section class="seva-information"><div class="seva-information-copy"><p class="seva-eyebrow">About this Seva</p><h2>${esc(puja.title)}</h2><p>${esc(puja.short_description)}</p></div><aside class="seva-inclusions-card"><p class="seva-eyebrow">Ceremony details</p><h2>What is included</h2><ul>${listPoints(puja.points)}</ul><div class="cms-package"><span>Package type</span><strong>${esc(puja.package_type)}</strong></div><div class="cms-package"><span>Duration</span><strong>${esc(puja.duration)}</strong></div></aside></section>`;
    } catch { main.innerHTML = '<section class="cms-not-found"><h1>Puja not found</h1><p>This ceremony may have been removed.</p><a href="/#poojas">Browse all pujas</a></section>'; }
  })();
}
if (document.body.dataset.page === 'admin') {
  const root = document.querySelector('#adminApp');
  const status = (message, error = false) => { const node = document.querySelector('#adminStatus'); node.textContent = message; node.classList.toggle('is-error', error); };
  const request = async (url, options = {}) => { const response = await fetch(url, { credentials: 'same-origin', ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Request failed.'); return data; };
  const escape = esc;
  function renderLogin() { root.innerHTML = `<section class="admin-panel admin-login"><p class="admin-kicker">Divine Homam · CMS</p><h1>Admin sign in</h1><p>Sign in to manage puja services.</p><form id="loginForm"><label>Username<input name="username" autocomplete="username" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label><button class="admin-button">Sign in</button></form><a href="/">← Back to website</a></section>`; root.querySelector('#loginForm').addEventListener('submit', async e => { e.preventDefault(); try { await request('/api/admin/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))) }); await renderDashboard(); } catch (error) { status(error.message, true); } }); }
  function formMarkup(puja = {}) {
    const points = puja.points || ['', '', ''];
    const images = Array.isArray(puja.image_urls) ? puja.image_urls.filter(isPujaImage) : [];
    if (!images.length && isPujaImage(puja.image_url)) images.push(puja.image_url);
    const imageHint = `${images.length} of 5 images in this gallery. Add or remove optional images.`;
    const previews = images.map((url, index) => `<figure><img src="${escape(url)}" alt="Puja image ${index + 1}"><button type="button" data-remove-image="${index}" aria-label="Remove image ${index + 1}">Remove</button></figure>`).join('');
    return `<form id="pujaForm" class="admin-form">
      <input type="hidden" name="slug" value="${escape(puja.slug || '')}">
      <label>Title of the pooja<input name="title" required maxlength="180" value="${escape(puja.title || '')}"></label>
      <label>Tamil subtitle<input name="tamil_subtitle" lang="ta" required maxlength="180" value="${escape(puja.tamil_subtitle || '')}"></label>
      <label>Badge text<input name="badge_text" required maxlength="180" value="${escape(puja.badge_text || '')}"></label>
      <label class="wide">Short description<textarea name="short_description" required maxlength="1200" rows="3">${escape(puja.short_description || '')}</textarea></label>
      ${points.map((point, index) => `<label>Pooja point ${index + 1}<input name="point${index + 1}" required maxlength="180" value="${escape(point)}"></label>`).join('')}
      <label>Type of package<input name="package_type" required maxlength="180" value="${escape(puja.package_type || '')}"></label>
      <label>Duration<input name="duration" required maxlength="180" value="${escape(puja.duration || '')}"></label>
      <label class="wide">Pooja images <span class="admin-optional">Optional · up to 5</span><input id="pujaImageFile" type="file" accept="image/avif,image/jpeg,image/png,image/webp" multiple><small id="imageUploadStatus">${imageHint} Choose AVIF, JPEG, PNG, or WebP images up to 10 MB each.</small></label>
      <input id="pujaImageUrls" name="image_urls" type="hidden" value="${escape(JSON.stringify(images))}">
      <div id="pujaImagePreview" class="admin-image-grid wide">${previews}</div>
      <label class="wide">Image alt text<input name="image_alt" value="${escape(puja.image_alt || '')}"></label>
      <div class="admin-form-actions wide"><button type="submit" class="admin-button">${puja.slug ? 'Save changes' : 'Create puja'}</button><button type="button" class="admin-button admin-button-muted" id="cancelEdit">Cancel</button></div>
    </form>`;
  }
  async function renderDashboard(edit = null) {
    try {
      const pujas = await request('/api/admin/pujas');
      root.innerHTML = `<header class="admin-topbar"><div><p class="admin-kicker">Divine Homam · CMS</p><h1>Puja services</h1></div><button id="logout" class="admin-button admin-button-muted">Sign out</button></header><div class="admin-layout"><section class="admin-panel"><h2>${edit ? 'Edit puja' : 'Create a puja'}</h2>${formMarkup(edit || {})}</section><section class="admin-panel"><h2>Current pujas <span class="admin-count">${pujas.length}</span></h2><div class="admin-list">${pujas.map(p => `<article><div><strong>${escape(p.title)}</strong><span lang="ta">${escape(p.tamil_subtitle)}</span><small>${escape(p.package_type)} · ${escape(p.duration)}</small></div><div class="admin-actions"><button data-edit="${escape(p.slug)}" class="admin-button admin-button-muted">Edit</button><button data-delete="${escape(p.slug)}" class="admin-button admin-delete">Delete</button></div></article>`).join('')}</div></section></div>`;
      root.querySelector('#logout').onclick = async () => { await request('/api/admin/login', { method: 'DELETE' }); renderLogin(); };
      root.querySelector('#cancelEdit').onclick = () => renderDashboard();
      root.querySelectorAll('[data-edit]').forEach(button => button.onclick = () => renderDashboard(pujas.find(p => p.slug === button.dataset.edit)));
      root.querySelectorAll('[data-delete]').forEach(button => button.onclick = async () => { if (!confirm('Delete this puja? This removes it from the public catalog.')) return; try { await request(`/api/admin/pujas?slug=${encodeURIComponent(button.dataset.delete)}`, { method: 'DELETE', body: '{}' }); status('Puja deleted.'); renderDashboard(); } catch (error) { status(error.message, true); } });
      const pujaForm = root.querySelector('#pujaForm');
      const imageInput = root.querySelector('#pujaImageFile');
      const imageStatus = root.querySelector('#imageUploadStatus');
      const imageUrlsInput = root.querySelector('#pujaImageUrls');
      const imagePreview = root.querySelector('#pujaImagePreview');
      const submitButton = pujaForm.querySelector('button[type="submit"]');
      const getImageUrls = () => { try { return JSON.parse(imageUrlsInput.value || '[]'); } catch { return []; } };
      const showImages = urls => {
        imageUrlsInput.value = JSON.stringify(urls);
        imagePreview.innerHTML = urls.map((url, index) => `<figure><img src="${escape(url)}" alt="Puja image ${index + 1}"><button type="button" data-remove-image="${index}" aria-label="Remove image ${index + 1}">Remove</button></figure>`).join('');
        imageStatus.textContent = `${urls.length} of 5 images in this gallery.`;
        imagePreview.querySelectorAll('[data-remove-image]').forEach(button => button.onclick = () => {
          const next = getImageUrls(); next.splice(Number(button.dataset.removeImage), 1); showImages(next);
        });
      };
      showImages(getImageUrls());
      imageInput.addEventListener('change', async () => {
        const files = [...imageInput.files]; if (!files.length) return;
        const urls = getImageUrls();
        if (urls.length + files.length > 5) { imageInput.value = ''; imageStatus.textContent = `This gallery has ${urls.length} images. Select no more than ${5 - urls.length} additional images.`; return; }
        if (files.some(file => !/^image\/(avif|jpeg|png|webp)$/.test(file.type) || file.size > 10 * 1024 * 1024)) { imageInput.value = ''; imageStatus.textContent = 'Choose AVIF, JPEG, PNG, or WebP images no larger than 10 MB each.'; return; }
        submitButton.disabled = true; imageInput.disabled = true; imageStatus.textContent = `Uploading ${files.length} image${files.length === 1 ? '' : 's'} to Cloudinary…`;
        try {
          for (let index = 0; index < files.length; index++) {
            imageStatus.textContent = `Uploading image ${index + 1} of ${files.length} to Cloudinary…`;
            const signed = await request('/api/admin/cloudinary-signature', { method: 'POST' });
            const upload = new FormData(); upload.append('file', files[index]); upload.append('api_key', signed.api_key); upload.append('timestamp', String(signed.timestamp)); upload.append('signature', signed.signature); upload.append('folder', signed.folder); upload.append('allowed_formats', signed.allowed_formats);
            const uploaded = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloud_name)}/image/upload`, { method: 'POST', body: upload });
            const result = await uploaded.json(); if (!uploaded.ok || !result.secure_url || !isPujaImage(result.secure_url)) throw new Error(result.error?.message || 'Cloudinary upload failed.');
            urls.push(result.secure_url); showImages(urls);
          }
          imageInput.value = ''; imageStatus.textContent = `${urls.length} of 5 images uploaded and ready to save.`;
        } catch (error) { imageStatus.textContent = `Upload failed: ${error.message}`; imageInput.value = ''; }
        finally { submitButton.disabled = false; imageInput.disabled = false; }
      });
      pujaForm.addEventListener('submit', async e => {
        e.preventDefault();
        const form = new FormData(e.currentTarget); const data = Object.fromEntries(form);
        data.image_urls = getImageUrls();
        data.points = [1, 2, 3].map(index => data[`point${index}`]);
        for (const key of ['point1', 'point2', 'point3']) delete data[key];
        try { await request(edit ? `/api/admin/pujas?slug=${encodeURIComponent(edit.slug)}` : '/api/admin/pujas', { method: edit ? 'PUT' : 'POST', body: JSON.stringify(data) }); status(edit ? 'Changes saved.' : 'Puja created.'); renderDashboard(); }
        catch (error) { status(error.message, true); }
      });
    } catch (error) { if (error.message.includes('sign in')) renderLogin(); else { renderLogin(); if (error.message !== 'Please sign in to manage pujas.') status(error.message, true); } }
  }
  (async () => { try { await request('/api/admin/pujas'); await renderDashboard(); } catch { renderLogin(); } })();
}
if (document.querySelector('#poojaGrid')) loadPujas();
