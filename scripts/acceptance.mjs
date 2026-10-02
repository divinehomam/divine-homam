import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const output = path.resolve('test-results');
const runId = new Date().toISOString().replace(/[:.]/g, '-');
const bookingDir = path.join(output, `bookings-${runId}`);
await mkdir(output, { recursive: true });
const server = spawn(process.execPath, ['server.mjs'], { env: { ...process.env, PORT: '3100', BOOKINGS_DIR: bookingDir }, stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((resolve, reject) => { server.stdout.on('data', data => { if (data.toString().includes('ready')) resolve(); }); server.on('error', reject); server.on('exit', code => reject(new Error(`Server exited: ${code}`))); });
const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const report = { browser: await browser.version(), url: 'http://127.0.0.1:3100', checks: [], viewports: [], errors: [] };
const pass = name => { report.checks.push(name); console.log(`PASS ${name}`); };
try {
  for (const [name, width, height] of [['desktop', 1440, 900], ['laptop', 1280, 720], ['tablet', 768, 1024], ['mobile', 390, 844], ['small-mobile', 360, 800]]) {
    if (process.env.TEST_VIEWPORTS && !process.env.TEST_VIEWPORTS.split(',').includes(name)) continue;
    const context = await browser.newContext({ viewport: { width, height }, isMobile: width < 600, hasTouch: width < 600 });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(`${name}: ${error.message}`));
    page.on('console', message => { if (message.type() === 'error') report.errors.push(`${name}: ${message.text()}`); });
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__cls += entry.value; }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(report.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${name} overflows`);
    await page.screenshot({ path: path.join(output, `${name}-hero.png`) });
    if (width < 600) {
      await page.waitForFunction(() => { const video = document.querySelector('#heroVideo'); return video.readyState >= 2 && !video.paused; }, { timeout: 15000 });
      assert.equal(await page.locator('#heroVideo').evaluate(video => video.loop && video.muted && video.playsInline && !video.controls), true);
      await page.locator('#mobileMenuBtn').click();
      assert.equal(await page.locator('#drawerOverlay').evaluate(dialog => dialog.open), true);
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(output, `${name}-menu.png`) });
      // Native dialog must contain tab focus.
      for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => !!document.activeElement.closest('#drawerOverlay')), true); }
      await page.keyboard.press('Escape'); await page.waitForTimeout(220);
      assert.equal(await page.locator('#mobileMenuBtn').evaluate(button => button === document.activeElement), true);
      await page.locator('#mobileMenuBtn').click();
      await page.locator('#mobileDrawer a[href="#poojas"]').click();
      await page.waitForTimeout(900);
      assert.equal(await page.locator('#drawerOverlay').evaluate(dialog => dialog.open), false);
      pass(`${name}: menu, keyboard containment, Escape and section navigation`);
    } else await page.waitForFunction(() => { const video = document.querySelector('#heroVideo'); return video.readyState >= 2 && !video.paused; }, { timeout: 15000 });
    assert.equal(await page.locator('#heroVideo').evaluate(video => video.loop && video.muted && video.playsInline && !video.controls), true);
    pass(`${name}: muted, inline, autoplaying, looping video with no controls`);
    // Scroll every section into the viewport to exercise one-time reveal behavior.
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += height * .7) { await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y); await page.waitForTimeout(90); }
    await page.waitForTimeout(600);
    assert.equal(await page.locator('.reveal-pending').count(), 0);
    assert.equal(await page.locator('video').evaluate(video => video.paused), true);
    assert.equal(await page.evaluate(() => [...document.images].every(img => img.complete && img.naturalWidth > 0)), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: path.join(output, `${name}-full.png`), fullPage: true });
    for (const [category, count] of [['homam', 6], ['family', 6], ['shanti', 6], ['all', 11]]) {
      await page.locator(`[data-category="${category}"]`).click();
      assert.equal(await page.locator('.pooja-card:visible').count(), count);
    }
    await page.waitForTimeout(550);
    await page.screenshot({ path: path.join(output, `${name}-catalog.png`) });
    for (const button of await page.locator('[data-book]').all()) {
      const expected = await button.getAttribute('data-book');
      await button.click();
      assert.equal(await page.locator('#poojaSelect').inputValue(), expected);
      await page.waitForTimeout(700);
    }
    await page.locator('.faq-toggle').first().click(); await page.waitForTimeout(300);
    assert.equal(await page.locator('.faq-toggle').first().getAttribute('aria-expanded'), 'true');
    assert.equal(await page.locator('.faq-panel.open').count(), 1);
    await page.locator('.faq-toggle').nth(2).click(); await page.waitForTimeout(300);
    assert.equal(await page.locator('.faq-panel.open').count(), 1);
    assert.equal(await page.locator('.faq-toggle').first().getAttribute('aria-expanded'), 'false');
    await page.screenshot({ path: path.join(output, `${name}-faq.png`) });
    const cls = await page.evaluate(() => window.__cls);
    report.viewports.push({ name, width, height, layoutShift: cls });
    pass(`${name}: no overflow, images, reveals, offscreen pause, all filters, all eleven booking links, FAQs`);
    await context.close();
  }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(report.url, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('.reveal-pending').count(), 0);
  await page.waitForFunction(() => { const video = document.querySelector('#heroVideo'); return video.readyState >= 2 && !video.paused; }, { timeout: 15000 });
  assert.equal(await page.locator('video').evaluate(video => video.loop && video.muted && video.playsInline && !video.controls), true);
  assert.equal(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length), 0);
  await page.locator('#mobileMenuBtn').click(); await page.keyboard.press('Escape');
  assert.equal(await page.locator('#drawerOverlay').evaluate(dialog => dialog.open), false);
  pass('Reduced motion: content visible, decorative animations disabled, muted hero video autoplaying, working menu');
  await page.locator('[data-book]').first().click();
  await page.locator('#fullName').fill('QA Test Family');
  await page.locator('#phone').fill('90000 00000');
  const future = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  await page.locator('#ceremonyDate').fill(future);
  await page.locator('#notes').fill('Automated local verification. Do not contact.');
  // Failure keeps input intact and communicates the error.
  await page.route('**/api/bookings', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Temporarily unavailable. Please try again.' }) }));
  await page.locator('button[type="submit"]').click();
  await page.locator('#formError').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#fullName').inputValue(), 'QA Test Family');
  await page.screenshot({ path: path.join(output, 'mobile-booking-error.png') });
  await page.unroute('**/api/bookings');
  const responsePromise = page.waitForResponse('**/api/bookings');
  await page.locator('button[type="submit"]').click();
  const response = await responsePromise;
  assert.equal(response.status(), 201);
  await page.locator('#bookingModal').waitFor({ state: 'visible' });
  await page.screenshot({ path: path.join(output, 'mobile-confirmation.png') });
  const files = await readdir(bookingDir);
  assert.equal(files.length, 1);
  const record = JSON.parse(await readFile(path.join(bookingDir, files[0]), 'utf8'));
  assert.equal(record.details.phone, '9000000000');
  assert.equal(record.status, 'pending');
  const headers = { 'Content-Type': 'application/json', 'Idempotency-Key': record.id };
  const duplicate = await context.request.post(`${report.url}/api/bookings`, { headers, data: record.details });
  assert.equal(duplicate.status(), 201);
  assert.equal((await readdir(bookingDir)).length, 1);
  const invalid = await context.request.post(`${report.url}/api/bookings`, { headers, data: { ...record.details, ceremonyDate: '2020-01-01' } });
  assert.equal(invalid.status(), 422);
  const privateRequest = await context.request.get(`${report.url}/data/bookings/${record.id}.json`);
  assert.equal(privateRequest.status(), 404);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('button[type="submit"]').evaluate(button => button === document.activeElement), true);
  pass('Booking: error recovery, successful persistence, phone normalization, reference, duplicate prevention, date validation, private storage, focus restoration');
  await context.close();
  assert.deepEqual(report.errors, [], 'Browser runtime/console errors');
  pass('No browser runtime or console errors across all viewports');
} catch (error) {
  report.failure = error.stack;
  process.exitCode = 1;
  console.error(error);
} finally {
  await writeFile(path.join(output, 'acceptance.json'), JSON.stringify(report, null, 2));
  await browser.close(); server.kill();
}
