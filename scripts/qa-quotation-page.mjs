import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4183';
const server = process.env.QA_BASE_URL ? null : spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4183', '--strictPort'], { stdio: 'ignore', windowsHide: true });
const failures = [], errors = [];
let browser;

async function check(name, task) {
  try { await task(); console.log(`PASS ${name}`); }
  catch (error) { failures.push({ name, message: error.message }); console.error(`FAIL ${name}: ${error.message}`); }
}

async function session(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce', ...options });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /hydration|Minified React error|didn't match|did not match/i.test(message.text())) errors.push(message.text());
  });
  return { context, page };
}

async function layout(page, label) {
  const result = await page.evaluate(() => {
    const flow = document.querySelector('.quote-flow');
    return { viewport: innerWidth, document: document.documentElement.scrollWidth, flowWidth: flow?.clientWidth, flowScroll: flow?.scrollWidth };
  });
  assert.ok(result.document <= result.viewport + 2, `${label}: document overflow ${JSON.stringify(result)}`);
  assert.ok(result.flowScroll <= result.flowWidth + 2, `${label}: wizard overflow ${JSON.stringify(result)}`);
}

async function accessible(page) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  assert.deepEqual(result.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })), []);
}

async function wizard(page, width) {
  const flow = page.locator('.quote-flow');
  await flow.getByRole('button', { name: 'E-commerce', exact: true }).click();
  assert.equal(await flow.locator('.quote-flow-cost-guide').count(), 0);
  assert.equal(await flow.locator('.quote-flow-package-renewal').count(), 0);
  const card = flow.locator('.quote-flow-package-card').filter({ hasText: 'WhatsApp order checkout' });
  await card.locator('summary').click();
  assert.match(await card.innerText(), /Responsive storefront/);
  await layout(page, `Packages ${width}`);
  await card.getByRole('button', { name: 'Choose package', exact: true }).click();
  await flow.locator('.quote-flow-addon-list > button').filter({ hasText: 'verified callbacks' }).click();
  assert.match(await flow.locator('.quote-flow-running-total').innerText(), /LKR 380,000/);
  assert.match(await flow.locator('.quote-flow-running-total').innerText(), /USD 511/);
  await layout(page, `Add-ons ${width}`);
  await flow.getByRole('button', { name: 'Continue with 1 add-on', exact: true }).click();
  const review = flow.getByRole('button', { name: 'Review quotation', exact: true });
  assert.equal(await review.isDisabled(), true);
  await flow.locator('input[name="name"]').fill('Quotation Page QA');
  await flow.locator('input[name="company"]').fill('Example & Partners');
  await flow.locator('input[name="email"]').fill('not-an-email');
  await flow.locator('input[name="phone"]').fill('+94 77 000 0000');
  await flow.locator('textarea[name="objective"]').fill('Sell books & manage orders.\nDeliver nationwide.');
  await flow.locator('input[name="targetLaunch"]').fill('Flexible');
  await layout(page, `Brief ${width}`);
  await review.click();
  assert.equal(await flow.locator('input[name="email"]').evaluate(element => element.checkValidity()), false);
  await flow.locator('input[name="email"]').fill('qa@example.com');
  await review.click();
  const reference = (await flow.locator('.quote-flow-review').innerText()).match(/HICH-Q-\d+-\d+/)?.[0];
  assert.ok(reference);
  assert.match(await flow.locator('.quote-flow-milestones').innerText(), /Project kickoff/);
  await layout(page, `Review ${width}`);
  await accessible(page);
  await page.screenshot({ path: `qa/quotation-page-review-${width}.png`, fullPage: true });
  await flow.getByRole('button', { name: 'Prepare quotation PDF', exact: true }).click();
  const download = flow.getByRole('link', { name: 'Download PDF', exact: true });
  await download.waitFor();
  const share = flow.getByRole('link', { name: 'Send quotation on WhatsApp', exact: true });
  const message = new URL(await share.getAttribute('href')).searchParams.get('text');
  for (const value of [reference, 'Quotation Page QA', 'Example & Partners', 'qa@example.com', '+94 77 000 0000', 'Sell books & manage orders.', 'Flexible', 'LKR 380,000', 'USD 511', 'Project kickoff', '50%', 'verified callbacks', 'taxes excluded']) assert.ok(message.includes(value), `WhatsApp includes ${value}`);
  const href = await download.getAttribute('href');
  assert.equal(await flow.getByRole('link', { name: 'Open PDF', exact: true }).getAttribute('href'), href);
  const pending = page.waitForEvent('download');
  await download.click();
  const file = await pending;
  assert.equal(await file.failure(), null);
  assert.ok(file.suggestedFilename().includes(reference));
  const pdf = await readFile(await file.path());
  assert.ok(pdf.toString('latin1').startsWith('%PDF-'));
  assert.ok(pdf.length > 1000);
  await layout(page, `PDF ready ${width}`);
  await accessible(page);
  await flow.getByRole('button', { name: 'Edit this quotation', exact: true }).click();
  assert.ok((await flow.locator('.quote-flow-review').innerText()).includes(reference));
  await flow.getByRole('button', { name: 'Edit brief', exact: true }).click();
  assert.equal(await flow.locator('input[name="name"]').inputValue(), 'Quotation Page QA');
  await flow.locator('input[name="company"]').fill('Revised company');
  await review.click();
  assert.ok((await flow.locator('.quote-flow-review').innerText()).includes(reference));
  assert.match(await flow.locator('.quote-flow-review').innerText(), /Revised company/);
  await flow.getByRole('button', { name: 'Prepare quotation PDF', exact: true }).click();
  await download.waitFor();
  await flow.getByRole('button', { name: 'Start a new quotation', exact: true }).click();
  assert.equal(await flow.getByRole('button', { name: 'E-commerce', exact: true }).getAttribute('aria-pressed'), 'false');
}

try {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (await fetch(base).then(response => response.ok).catch(() => false)) break;
    if (attempt === 49) throw new Error('Preview did not start; build the website first.');
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  await mkdir('qa', { recursive: true });
  browser = await chromium.launch({ channel: process.env.QA_BROWSER || 'chrome', headless: true });

  for (const entry of ['menu', 'footer']) {
    await check(`Shared page transition through quotation ${entry} link`, async () => {
      const { context, page } = await session({ reducedMotion: 'no-preference', viewport: { width: entry === 'menu' ? 390 : 1440, height: 960 } });
      try {
        await page.goto(base + '/contact.html', { waitUntil: 'networkidle' });
        if (entry === 'menu') await page.getByRole('button', { name: 'MENU', exact: true }).click();
        const link = page.locator(entry === 'menu' ? '.mobile-quotation-link' : '.footer-bottom a[href="/quotation.html"]');
        assert.equal(await link.getAttribute('data-no-transition'), null);
        await link.click();
        assert.equal(await page.locator('.hich-transition').getAttribute('data-phase'), 'cover');
        await page.waitForURL('**/quotation.html');
        await page.waitForFunction(() => document.querySelector('.hich-transition')?.dataset.phase === 'idle');
        assert.equal(await page.locator('.quotation-intro, .quotation-intro-canvas').count(), 0);
        assert.equal(await page.locator('.quotation-page-content').getAttribute('inert'), null);
        await page.locator('.quotation-start').click();
        await page.locator('.quote-flow').getByRole('button', { name: 'E-commerce', exact: true }).click();
        await page.getByRole('heading', { name: 'Choose your starting point.', exact: true }).waitFor();
      } finally { await context.close(); }
    });
  }

  for (const width of [320, 390, 768, 1440]) {
    await check(`Route, entry points and responsive first step at ${width}px`, async () => {
      const { context, page } = await session({ viewport: { width, height: 960 } });
      try {
        const response = await page.goto(`${base}/quotation.html`, { waitUntil: 'networkidle' });
        assert.equal(response.status(), 200);
        assert.equal(await page.locator('h1').count(), 1);
        assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://hichweb.com/quotation.html');
        assert.equal(await page.locator('.footer-bottom a[href="/quotation.html"]').count(), 1);
        assert.equal(await page.locator('.site-header a[href="/quotation.html"], .mobile-dock a[href="/quotation.html"]').count(), 0);
        await page.locator('.quote-flow').getByRole('button', { name: 'E-commerce', exact: true }).waitFor();
        await layout(page, `First step ${width}`);
        await accessible(page);
        await page.screenshot({ path: `qa/quotation-page-${width}.png`, fullPage: true });
        await page.getByRole('button', { name: 'MENU', exact: true }).click();
        assert.equal(await page.locator('.mobile-quotation-link').isVisible(), true);
        assert.equal(await page.locator('nav[aria-label="Main menu"] a[href="/quotation.html"]').count(), 0);
        await page.keyboard.press('Escape');
        await page.keyboard.press('Control+k');
        await page.getByRole('textbox', { name: 'Search pages and services', exact: true }).fill('quotation');
        assert.equal(await page.locator('.search-results a[href="/quotation.html"]').count(), 0);
        await page.keyboard.press('Escape');
        if ([390, 1440].includes(width)) await wizard(page, width);
      } finally { await context.close(); }
    });
  }

  await check('Custom SaaS, Company ERP and restaurant pricing are clear and usable', async () => {
    const { context, page } = await session({ viewport: { width: 1440, height: 1100 } });
    try {
      await page.goto(`${base}/quotation.html`, { waitUntil: 'networkidle' });
      const flow = page.locator('.quote-flow');

      await flow.getByRole('button', { name: 'Custom SaaS', exact: true }).click();
      const saas = flow.locator('.quote-flow-package-card').filter({ hasText: 'Custom SaaS multi-tenant platform' });
      assert.match(await saas.innerText(), /LKR 490,000/);
      assert.match(await saas.innerText(), /12 included features/);
      await saas.getByRole('button', { name: 'Choose package', exact: true }).click();
      const saasGateway = flow.locator('.quote-flow-addon-list > button').filter({ hasText: 'SaaS payment gateway and subscription billing' });
      const saasBackup = flow.locator('.quote-flow-addon-list > button').filter({ hasText: 'Three independent backup destinations' });
      assert.match(await saasGateway.innerText(), /Starting at\s+LKR 480,000/);
      assert.match(await saasBackup.innerText(), /LKR 400,000/);
      assert.match(await saasBackup.innerText(), /USD 140 \/ month/);
      assert.match(await saasBackup.innerText(), /USD 1,680 \/ year/);
      await saasBackup.click();
      assert.match(await flow.locator('.quote-flow-running-total').innerText(), /LKR 890,000/);
      assert.match(await flow.locator('.quote-flow-running-total').innerText(), /USD 2,003/);

      await flow.getByRole('button', { name: 'Project', exact: true }).click();
      await flow.getByRole('button', { name: 'ERP', exact: true }).click();
      const companyErp = flow.locator('.quote-flow-package-card').filter({ hasText: 'Company ERP' });
      assert.match(await companyErp.innerText(), /LKR 535,000/);
      await companyErp.getByRole('button', { name: 'Choose package', exact: true }).click();
      assert.match(await flow.locator('.quote-flow-addon-list > button').filter({ hasText: 'Three independent backup destinations' }).innerText(), /LKR 400,000/);

      await flow.getByRole('button', { name: 'Project', exact: true }).click();
      await flow.getByRole('button', { name: 'Restaurant / cafe', exact: true }).click();
      const restaurant = flow.locator('.quote-flow-package-card').filter({ hasText: 'Restaurant table, QR and kitchen ordering system' });
      assert.match(await restaurant.innerText(), /LKR 419,000/);
      assert.doesNotMatch(await restaurant.innerText(), /USD 400 \/ year/);
      await restaurant.locator('summary').click();
      assert.match(await restaurant.innerText(), /Unique QR code for every table/);
      assert.match(await restaurant.innerText(), /Live kitchen screen for new orders/);
      assert.match(await restaurant.innerText(), /Automatic invoice/);
      await restaurant.getByRole('button', { name: 'Choose package', exact: true }).click();
      assert.match(await flow.locator('.quote-flow-running-total').innerText(), /LKR 419,000/);
      assert.match(await flow.locator('.quote-flow-running-total').innerText(), /USD 400/);
      await layout(page, 'Updated commercial journeys');
      await accessible(page);
    } finally { await context.close(); }
  });

  await check('No-JavaScript visitors can read the page and reach contact details', async () => {
    const { context, page } = await session({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    try {
      await page.goto(`${base}/quotation.html`, { waitUntil: 'networkidle' });
      assert.equal(await page.locator('h1').isVisible(), true);
      assert.match(await page.locator('main').innerText(), /JavaScript/i);
      assert.ok(await page.locator('main a[href="/contact.html"], main a[href^="mailto:"]').count());
      await layout(page, 'No JavaScript');
    } finally { await context.close(); }
  });

  await check('No runtime or hydration errors', async () => assert.deepEqual(errors, []));
  assert.deepEqual(failures, []);
} finally {
  await browser?.close();
  server?.kill();
}
