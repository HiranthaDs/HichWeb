import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const measurementId = process.env.ANALYTICS_TEST_MEASUREMENT_ID || 'G-HICHTEST01';
const useExistingBuild = process.env.ANALYTICS_TEST_USE_EXISTING_BUILD === 'true';
const base = 'http://127.0.0.1:4186';
if (!useExistingBuild) {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error('Run this check through npm run test:analytics.');
  const build = spawnSync(process.execPath, [npmCli, 'run', 'build'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      VITE_GA_MEASUREMENT_ID: measurementId,
      VITE_GA_ENABLE_DEV: 'false',
      VITE_GA_DEBUG: 'false',
      GOOGLE_SITE_VERIFICATION: 'hich_test_verification_token',
    },
    encoding: 'utf8',
  });
  if (build.status !== 0) throw new Error(build.stderr || build.stdout || 'Analytics test build failed.');
}

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4186', '--strictPort'], { stdio: 'ignore', windowsHide: true });
let browser;

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt++) {
    try { if ((await fetch(base)).ok) return; } catch { /* Preview is starting. */ }
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error('Analytics preview server did not start.');
}

try {
  await waitForServer();
  browser = await chromium.launch({ channel: process.env.QA_BROWSER || 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  await context.route('https://www.googletagmanager.com/**', route => route.fulfill({ contentType: 'application/javascript', body: '/* blocked by HICH analytics QA */' }));
  const page = await context.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });

  assert.equal(await page.locator('script[data-hich-analytics]').count(), 0, 'Google tag must not load before consent');
  await page.getByRole('dialog', { name: 'Analytics privacy choices' }).waitFor();
  let commands = await page.evaluate(() => window.dataLayer || []);
  assert.ok(commands.some(command => command[0] === 'consent' && command[1] === 'default' && command[2].analytics_storage === 'denied'), 'Consent defaults to denied');

  await page.getByRole('button', { name: 'Allow analytics' }).click();
  await page.locator(`script[data-hich-analytics="${measurementId}"]`).waitFor({ state: 'attached' });
  assert.equal(await page.evaluate(() => localStorage.getItem('hich.analytics-consent.v1')), 'granted');
  commands = await page.evaluate(() => window.dataLayer);
  assert.ok(commands.some(command => command[0] === 'consent' && command[1] === 'update' && command[2].analytics_storage === 'granted'), 'Consent updates to granted');
  assert.ok(commands.some(command => command[0] === 'config' && command[1] === measurementId && command[2].send_page_view === false), 'GA4 is configured without an automatic duplicate page view');
  assert.ok(commands.some(command => command[0] === 'event' && command[1] === 'page_view' && command[2].page_location === 'https://hichweb.com/'), 'A canonical page view is queued');

  await page.evaluate(() => {
    const link = document.querySelector('a[href^="mailto:"]');
    link.addEventListener('click', event => event.preventDefault(), { once: true });
    link.click();
  });
  commands = await page.evaluate(() => window.dataLayer);
  const lead = commands.findLast(command => command[0] === 'event' && command[1] === 'generate_lead');
  assert.equal(lead?.[2]?.method, 'email');
  assert.equal(lead?.[2]?.lead_source, 'navigation_menu');
  assert.ok(!JSON.stringify(lead).includes('info@hichweb.com'), 'Lead event does not contain an email address');

  await page.getByRole('button', { name: /Search website/ }).click();
  await page.locator('#site-search').fill('website');
  await page.waitForTimeout(500);
  commands = await page.evaluate(() => window.dataLayer);
  const search = commands.findLast(command => command[0] === 'event' && command[1] === 'site_search');
  assert.equal(typeof search?.[2]?.results_count, 'number');
  assert.ok(!JSON.stringify(search).includes('website'), 'Site-search text is not sent to Analytics');
  await page.locator('.search-results a').first().evaluate(element => element.addEventListener('click', event => event.preventDefault(), { once: true }));
  await page.locator('.search-results a').first().click();
  commands = await page.evaluate(() => window.dataLayer);
  assert.ok(commands.some(command => command[0] === 'event' && command[1] === 'select_content' && command[2].content_type === 'site_search_result'), 'Search result selection is measured');

  await page.evaluate(() => {
    const link = document.createElement('a');
    link.href = 'blob:analytics-download-check';
    link.download = 'private-reference.pdf';
    link.addEventListener('click', event => event.preventDefault(), { once: true });
    document.body.append(link);
    link.click();
    link.remove();
  });
  commands = await page.evaluate(() => window.dataLayer);
  const download = commands.findLast(command => command[0] === 'event' && command[1] === 'file_download');
  assert.equal(download?.[2]?.file_extension, 'pdf');
  assert.ok(!JSON.stringify(download).includes('private-reference'), 'Download events avoid high-cardinality filenames');

  await page.evaluate(() => {
    const link = document.createElement('a');
    link.href = 'https://example.com/privacy-check';
    link.textContent = 'private.person@example.com';
    link.addEventListener('click', event => event.preventDefault(), { once: true });
    document.body.append(link);
    link.click();
    link.remove();
  });
  commands = await page.evaluate(() => window.dataLayer);
  const outbound = commands.findLast(command => command[0] === 'event' && command[1] === 'outbound_click');
  assert.equal(outbound?.[2]?.link_label, '[redacted]', 'PII-looking event parameter values are redacted');

  await page.goto(`${base}/quotation.html`, { waitUntil: 'networkidle' });
  await page.locator('.quote-flow-category-grid > button').first().click();
  await page.locator('.quote-flow-package-action').first().click();
  commands = await page.evaluate(() => window.dataLayer);
  assert.ok(commands.some(command => command[0] === 'event' && command[1] === 'quotation_progress'), 'Quotation funnel progress is measured');
  assert.ok(commands.filter(command => command[0] === 'event' && command[1] === 'select_content').length >= 2, 'Quotation project and package selections are measured');

  await page.getByRole('button', { name: 'Privacy choices' }).click();
  await page.getByRole('button', { name: 'Decline' }).click();
  const beforeBlockedClick = await page.evaluate(() => window.dataLayer.length);
  await page.evaluate(() => {
    const link = document.querySelector('a[href^="tel:"]');
    link.addEventListener('click', event => event.preventDefault(), { once: true });
    link.click();
  });
  assert.equal(await page.evaluate(() => window.dataLayer.length), beforeBlockedClick, 'Events stop after consent is withdrawn');

  if (!useExistingBuild) {
    const html = await (await fetch(base)).text();
    assert.match(html, /name="google-site-verification" content="hich_test_verification_token"/);
  }
  console.log(`PASS consent-gated GA4 and privacy-safe lead events${useExistingBuild ? '' : ' with Search Console verification'}`);
} finally {
  await browser?.close();
  server.kill();
}
