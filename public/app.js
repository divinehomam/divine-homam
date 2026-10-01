'use strict';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
$$('.material-symbols-outlined').forEach(icon => icon.setAttribute('aria-hidden', 'true'));
const header = $('header');
const hero = $('#hero');
const video = $('#heroVideo');
let heroVisible = true;
let dialogReturnFocus;

// Native dialogs provide focus containment and an inert background.
function openDialog(dialog, opener = document.activeElement) {
  if (dialog.open) return;
  dialogReturnFocus = opener;
  dialog.classList.remove('closing');
  dialog.showModal();
  document.body.style.overflow = 'hidden';
}
document.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const dialog = $('dialog[open]');
  if (!dialog) return;
  const focusable = [...dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')].filter(element => element.getClientRects().length > 0);
  if (!focusable.length) { event.preventDefault(); dialog.focus(); return; }
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
});
function closeDialog(dialog) {
  if (!dialog.open || dialog.classList.contains('closing')) return;
  const finish = () => {
    dialog.close();
    dialog.classList.remove('closing');
    document.body.style.overflow = '';
    $('#mobileMenuBtn').setAttribute('aria-expanded', 'false');
    dialogReturnFocus?.focus({ preventScroll: true });
  };
  if (reducedMotion.matches) return finish();
  dialog.classList.add('closing');
  setTimeout(finish, 180);
}
$$('dialog').forEach(dialog => {
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(dialog); });
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) closeDialog(dialog);
  });
});
$('#mobileMenuBtn').addEventListener('click', () => {
  openDialog($('#drawerOverlay'));
  $('#mobileMenuBtn').setAttribute('aria-expanded', 'true');
  $('#closeDrawerBtn').focus();
});
$('#closeDrawerBtn').addEventListener('click', () => closeDialog($('#drawerOverlay')));
$('#closeModalBtn').addEventListener('click', () => closeDialog($('#bookingModal')));

function navigateTo(target) {
  const top = target.getBoundingClientRect().top + window.scrollY - header.offsetHeight - 20;
  window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}
$$('a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    const hash = link.getAttribute('href');
    if (hash === '#' && link.closest('footer')) {
      event.preventDefault();
      const dialog = document.createElement('dialog');
      dialog.className = 'policy-dialog';
      const title = document.createElement('h2'); title.textContent = link.textContent;
      const content = document.createElement('p'); content.textContent = 'This policy has not been published yet. Please contact the Divine Homam coordinator for details before confirming your ceremony.';
      const close = document.createElement('button'); close.textContent = 'Close';
      dialog.append(title, content, close); document.body.append(dialog);
      close.addEventListener('click', () => dialog.close());
      dialog.addEventListener('close', () => { document.body.style.overflow = ''; link.focus(); dialog.remove(); });
      openDialog(dialog, link);
      return;
    }
    const target = hash === '#' ? $('#top') : document.getElementById(hash.slice(1));
    if (!target) return;
    event.preventDefault();
    if ($('#drawerOverlay').open) {
      closeDialog($('#drawerOverlay'));
      setTimeout(() => navigateTo(target), reducedMotion.matches ? 0 : 190);
    } else navigateTo(target);
    history.replaceState(null, '', hash === '#' ? location.pathname : hash);
  });
});

// Filtering keeps keyboard focus on the selected control and announces results.
const cards = $$('.pooja-card');
$$('.tab-btn').forEach(button => {
  button.setAttribute('aria-pressed', String(button.dataset.category === 'all'));
  button.addEventListener('click', () => {
    $$('.tab-btn').forEach(tab => {
      tab.setAttribute('aria-pressed', String(tab === button));
      tab.classList.remove('bg-primary-container', 'text-on-primary');
      tab.classList.add('text-primary');
    });
    const category = button.dataset.category;
    cards.forEach(card => {
      card.hidden = category !== 'all' && !card.dataset.type.split(' ').includes(category);
      if (!card.hidden) {
        card.classList.remove('reveal-pending'); card.classList.add('reveal-visible');
        if (!reducedMotion.matches) card.animate([{ opacity: .4, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'ease-out' });
      }
    });
    $('#filterStatus').textContent = `${cards.filter(card => !card.hidden).length} ceremonies shown.`;
  });
});
$$('[data-book]').forEach(button => button.addEventListener('click', () => {
  $('#poojaSelect').value = button.dataset.book;
  navigateTo($('#booking-form'));
}));

// Accordion uses measured layout via grid; closed content is absent from the accessibility tree.
$$('.faq-toggle').forEach((toggle, index) => {
  const content = toggle.nextElementSibling;
  content.classList.remove('hidden');
  const panel = document.createElement('div');
  panel.className = 'faq-panel'; panel.id = `faq-panel-${index}`;
  panel.setAttribute('role', 'region'); panel.setAttribute('aria-labelledby', `faq-toggle-${index}`);
  panel.setAttribute('aria-hidden', 'true'); panel.inert = true;
  const inner = document.createElement('div');
  content.before(panel); inner.append(content); panel.append(inner);
  toggle.id = `faq-toggle-${index}`;
  toggle.setAttribute('aria-controls', panel.id); toggle.setAttribute('aria-expanded', 'false');
  toggle.addEventListener('click', () => {
    const opening = toggle.getAttribute('aria-expanded') !== 'true';
    $$('.faq-toggle').forEach(other => other.setAttribute('aria-expanded', 'false'));
    $$('.faq-panel').forEach(other => { other.classList.remove('open'); other.setAttribute('aria-hidden', 'true'); other.inert = true; });
    if (opening) { toggle.setAttribute('aria-expanded', 'true'); panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); panel.inert = false; }
  });
});

const dateInput = $('#ceremonyDate');
const today = new Date();
dateInput.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
const form = $('#poojaBookingForm');
const submitButton = form.querySelector('[type="submit"]');
const requestedSeva = new URLSearchParams(location.search).get('seva');
if (requestedSeva && [...$('#poojaSelect').options].some(option => option.value === requestedSeva)) {
  $('#poojaSelect').value = requestedSeva;
}
let requestId = crypto.randomUUID();
form.addEventListener('input', () => { requestId = crypto.randomUUID(); });
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (form.getAttribute('aria-busy') === 'true') return;
  const data = Object.fromEntries(new FormData(form));
  data.phone = data.phone.replace(/\D/g, '');
  if (data.phone.length === 12 && data.phone.startsWith('91')) data.phone = data.phone.slice(2);
  const error = $('#formError'); error.hidden = true;
  if (!/^[6-9]\d{9}$/.test(data.phone)) {
    error.textContent = 'Please enter a valid 10-digit Indian mobile number.'; error.hidden = false; $('#phone').focus(); return;
  }
  const whatsappMessage = [
    'Divine Homam — Muhurtham & Priest Confirmation Request',
    '',
    `Full name: ${data.fullName.trim()}`,
    `WhatsApp / mobile: +91 ${data.phone}`,
    `Pooja / Homam: ${data.poojaSelect}`,
    `Preferred Muhurtham: ${data.muhurthamTime}`,
    `Preferred date: ${data.ceremonyDate}`,
    `City / location: ${data.citySelect}`,
    `Special notes: ${data.notes.trim() || 'None'}`
  ].join('\n');
  window.open(`https://wa.me/918940308309?text=${encodeURIComponent(whatsappMessage)}`, '_blank', 'noopener,noreferrer');
  form.setAttribute('aria-busy', 'true'); submitButton.disabled = true;
  const submitLabel = submitButton.lastElementChild;
  const originalLabel = submitLabel.textContent;
  submitLabel.textContent = 'Saving your seva request…';
  try {
    const response = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': requestId }, body: JSON.stringify(data), signal: AbortSignal.timeout(15000) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Your request could not be saved. Please try again.');
    $('#modalConfirmationText').textContent = `Vanakkam ${data.fullName.trim()}. Your request for ${data.poojaSelect} has been saved. Reference: ${result.reference}. Priest availability and Muhurtham are awaiting confirmation; this is not a confirmed booking.`;
    openDialog($('#bookingModal'), submitButton);
    form.reset(); requestId = crypto.randomUUID();
  } catch (reason) {
    error.textContent = reason.name === 'TimeoutError' ? 'The connection took too long. Please retry; your request will not be duplicated.' : reason.message === 'Failed to fetch' ? 'Unable to connect. Please check your connection and try again. Your details are still here.' : reason.message;
    error.hidden = false; error.focus();
  } finally {
    form.setAttribute('aria-busy', 'false'); submitButton.disabled = false; submitLabel.textContent = originalLabel;
  }
});

// Content is visible by default. Reveals are enabled only after JS initializes.
const revealTargets = $$('main section:not(#hero) h2, .pooja-card, #why-divinehomam .brass-border, #acharyas .brass-border, #how-it-works .brass-border');
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.remove('reveal-pending'); entry.target.classList.add('reveal-visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: .06, rootMargin: '0px 0px 24px 0px' });
if (!reducedMotion.matches) revealTargets.forEach(target => {
  if (target.getBoundingClientRect().top > innerHeight) target.classList.add('reveal-pending');
  revealObserver.observe(target);
});
$$('main section h2').forEach(heading => {
  const ornament = document.createElement('span'); ornament.className = 'section-ornament'; ornament.setAttribute('aria-hidden', 'true');
  ornament.append(document.createElement('span')); heading.append(ornament);
});
$$('img[loading="lazy"]').forEach(img => img.addEventListener('load', () => img.classList.add('loaded'), { once: true }));

function updateMotion() {
  const disabled = reducedMotion.matches;
  document.documentElement.classList.toggle('motion-paused', disabled);
  if (heroVisible && !document.hidden) {
    video.play().catch(() => {});
  } else video.pause();
  if (disabled) { $('.hero-depth').style.removeProperty('--tilt-x'); $('.hero-depth').style.removeProperty('--tilt-y'); }
}
video.addEventListener('playing', () => video.classList.add('ready'));
video.addEventListener('error', () => video.classList.remove('ready'));
new IntersectionObserver(entries => {
  heroVisible = entries[0].isIntersecting; hero.classList.toggle('is-in-view', heroVisible); updateMotion();
}, { threshold: .05 }).observe(hero);
document.addEventListener('visibilitychange', updateMotion);
window.addEventListener('resize', updateMotion, { passive: true });
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) { revealObserver.disconnect(); revealTargets.forEach(target => target.classList.remove('reveal-pending')); }
  updateMotion();
});
let tiltFrame = 0;
$('.hero-visual').addEventListener('pointermove', event => {
  if (reducedMotion.matches || !finePointer.matches) return;
  cancelAnimationFrame(tiltFrame);
  tiltFrame = requestAnimationFrame(() => {
    const rect = $('.hero-visual').getBoundingClientRect();
    $('.hero-depth').style.setProperty('--tilt-x', `${-(event.clientY - rect.top - rect.height / 2) / rect.height * 3}deg`);
    $('.hero-depth').style.setProperty('--tilt-y', `${(event.clientX - rect.left - rect.width / 2) / rect.width * 3}deg`);
  });
});
$('.hero-visual').addEventListener('pointerleave', () => {
  cancelAnimationFrame(tiltFrame); $('.hero-depth').style.removeProperty('--tilt-x'); $('.hero-depth').style.removeProperty('--tilt-y');
});
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    $$('header nav a').forEach(link => {
      if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
$$('main section[id]').forEach(section => sectionObserver.observe(section));
const topObserver = new IntersectionObserver(entries => header.classList.toggle('scrolled', !entries[0].isIntersecting));
topObserver.observe(document.body.children[1]);
updateMotion();
