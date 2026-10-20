import assert from 'node:assert/strict';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { pagePaths } from '../src/routes.js';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4179';
const failures = [], errors = [], results = [];
await mkdir('qa', { recursive: true });
let server, browser;
const check = async (name, task) => {
  try { await task(); results.push({ name, passed: true }); console.log(`PASS ${name}`); }
  catch (error) { failures.push({ name, message: error.message }); console.error(`FAIL ${name}: ${error.message}`); }
};
const waitForServer = async () => {
  for (let n = 0; n < 80; n++) {
    try { if ((await fetch(base)).ok) return; } catch { /* Wait for local preview. */ }
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error('Preview server did not become available. Run npm run build first.');
};

try {
  if (!process.env.QA_BASE_URL) {
    await access('dist/index.html');
    server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', '4179', '--strictPort'], { stdio: 'ignore', windowsHide: true });
    server.on('error', error => errors.push(error.message));
  }
  await waitForServer();
  browser = await chromium.launch({ channel: process.env.QA_BROWSER || 'chrome', headless: true });
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`${page.url()}: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error') errors.push(`${page.url()}: ${message.text()}`); });

  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 960 });
    for (const path of pagePaths) {
      await check(`${width}px ${path}`, async () => {
        await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
        await page.locator('main h1').waitFor();
        assert.equal(await page.locator('h1').count(), 1, 'One primary page heading');
        const layout = await page.evaluate(() => ({
          width: innerWidth,
          content: document.documentElement.scrollWidth,
          missingAnchors: [...document.querySelectorAll('a[href^="#"]')].filter(a => a.hash.length > 1 && !document.getElementById(decodeURIComponent(a.hash.slice(1)))).map(a => a.hash),
          duplicateIds: [...document.querySelectorAll('[id]')].map(el => el.id).filter((id, i, all) => all.indexOf(id) !== i),
        }));
        assert.ok(layout.content <= layout.width + 2, `Horizontal overflow: ${layout.content} > ${layout.width}`);
        assert.deepEqual(layout.missingAnchors, [], 'Page anchors have a destination');
        assert.deepEqual(layout.duplicateIds, [], 'IDs are unique');
        if (path !== '/404.html') assert.ok((await page.locator('main').innerText()).length > 900, 'Page has substantial content');
      });
    }
  }

  await check('Service FAQs are prerendered with matching structured data', async () => {
    const html = await readFile('dist/brand-content-design.html', 'utf8');
    assert.ok(html.includes('How do you keep the brand consistent after launch?'));
    assert.ok(html.includes('service-experience'));
    assert.ok(html.includes('FAQPage'));
  });

  await check('Terms include payment protections, omit contents and ship the lowercase alias', async () => {
    const html = await readFile('dist/terms-and-conditions.html', 'utf8');
    const alias = await readFile('dist/terms.html', 'utf8');
    assert.ok(html.includes('Payment gateways and online transactions'));
    assert.ok(html.includes('Fraud, refunds, chargebacks and payment compliance'));
    assert.ok(html.includes('terms-hero'));
    assert.ok(!html.includes('<h2>Contents</h2>'));
    assert.ok(alias.includes('url=/terms-and-conditions.html'));
  });

  // Interactive checks are below the route audit so each failure is reported independently.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await check('ERP receipts, approvals and reset keep the dashboard consistent', async () => {
    await page.goto(`${base}/erp-systems.html`);
    await page.getByRole('button', { name: 'Receive 24 units', exact: true }).click();
    assert.match(await page.locator('.sx-metrics').innerText(), /216/);
    await page.getByRole('button', { name: 'Inventory', exact: true }).click();
    assert.match(await page.locator('.sx-stock-row').first().innerText(), /42/);
    await page.getByRole('button', { name: 'Approvals', exact: true }).click();
    await page.getByRole('button', { name: 'Approve', exact: true }).first().click();
    assert.match(await page.locator('.sx-metrics > div').nth(1).innerText(), /1\s*requests/);
    assert.match(await page.locator('.sx-activity').innerText(), /PO-1042 approved/);
    await page.getByRole('button', { name: 'Reset demo' }).click();
    assert.match(await page.locator('.sx-metrics').innerText(), /192/);
    await page.locator('.sx-demo-frame').screenshot({ path: 'qa/erp-prototype-desktop.png' });
  });
  await check('Brand direction and voice change the live creative preview', async () => {
    await page.goto(`${base}/brand-content-design.html`);
    await page.getByRole('button', { name: 'Editorial', exact: true }).click();
    await page.getByRole('button', { name: 'Warm', exact: true }).click();
    assert.ok(await page.locator('.sx-brand-editorial').isVisible());
    assert.match(await page.locator('.sx-brand-poster h3').innerText(), /MORE YOU/);
    assert.equal(await page.getByRole('button', { name: 'Warm', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.locator('.sx-demo-frame').screenshot({ path: 'qa/brand-playground-desktop.png' });
  });
  await check('Commerce variants and quantities update the sample cart', async () => {
    await page.goto(`${base}/ecommerce-solutions.html`);
    await page.getByRole('button', { name: 'Coral', exact: true }).click();
    await page.getByRole('button', { name: 'Increase quantity' }).click();
    await page.getByRole('button', { name: 'Add to bag' }).click();
    assert.match(await page.locator('.sx-cart').innerText(), /2 × Coral/);
    assert.match(await page.locator('.sx-cart').innerText(), /6,400/);
    await page.locator('.sx-cart').getByRole('button', { name: 'Clear' }).click();
    assert.match(await page.locator('.sx-cart').innerText(), /bag \(0\)/);
  });
  await check('Website prototype changes viewport and page content', async () => {
    await page.goto(`${base}/website-development.html`);
    await page.getByRole('button', { name: 'Mobile', exact: true }).click();
    assert.ok(await page.locator('.sx-browser-mobile').isVisible());
    await page.getByRole('button', { name: 'Explore the collection' }).click();
    assert.match(await page.locator('.sx-mini-site h3').innerText(), /LOVELIER/);
  });
  await check('Portal request moves through roles and approval states', async () => {
    await page.goto(`${base}/web-application-development.html`);
    await page.getByRole('button', { name: 'Submit request', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Approve request', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Manager', exact: true }).click();
    await page.getByRole('button', { name: 'Approve request', exact: true }).click();
    assert.match(await page.locator('.sx-app-demo .sx-status').innerText(), /Request approved/);
  });
  await check('UX booking prototype reaches a clear sample review', async () => {
    await page.goto(`${base}/ui-ux-design.html`);
    await page.getByRole('button', { name: 'Design review', exact: true }).click();
    await page.getByRole('button', { name: 'Find a time' }).click();
    await page.getByRole('button', { name: '1:30 PM', exact: true }).click();
    await page.getByRole('button', { name: 'Review session' }).click();
    assert.match(await page.locator('.sx-booking-card').innerText(), /1:30 PM/);
    assert.match(await page.locator('.sx-booking-card').innerText(), /No appointment has been booked/);
  });
  await check('Mobile prototype queues offline work and synchronises on reconnect', async () => {
    await page.goto(`${base}/mobile-app-development.html`);
    await page.getByRole('switch', { name: 'Sample network connection' }).click();
    await page.getByRole('button', { name: /Check the display/ }).click();
    assert.match(await page.locator('.sx-mobile-context .sx-status').innerText(), /1 update queued/);
    await page.getByRole('switch', { name: 'Sample network connection' }).click();
    assert.match(await page.locator('.sx-mobile-context .sx-status').innerText(), /1 task completed and synced/);
  });
  await check('Search appearance preview reflects edited content', async () => {
    await page.goto(`${base}/seo-digital-growth.html`);
    await page.locator('#sx-seo-title').fill('A clearer page title');
    await page.locator('#sx-seo-description').fill('A useful description for a sample page.');
    assert.equal(await page.locator('.sx-search-result h4').innerText(), 'A clearer page title');
    assert.match(await page.locator('.sx-search-result p').innerText(), /sample page/);
  });
  await check('Automation handles failure, retry and reset', async () => {
    await page.goto(`${base}/api-integrations-automation.html`);
    await page.getByRole('checkbox', { name: 'Simulate an inventory service outage' }).check();
    await page.getByRole('button', { name: 'Run sample order' }).click();
    await page.getByRole('button', { name: 'Retry failed step' }).waitFor();
    assert.equal(await page.locator('.sx-workflow-node.complete').count(), 2);
    await page.getByRole('button', { name: 'Retry failed step' }).click();
    await page.getByRole('button', { name: 'Workflow completed' }).waitFor();
    assert.equal(await page.locator('.sx-workflow-node.complete').count(), 4);
    await page.getByRole('button', { name: 'Reset demo' }).click();
    assert.ok(await page.getByRole('button', { name: 'Run sample order' }).isEnabled());
  });
  await check('Support review resolves the outstanding sample issue', async () => {
    await page.goto(`${base}/website-maintenance-support.html`);
    await page.getByRole('button', { name: 'Run sample review' }).click();
    await page.getByRole('button', { name: 'Apply sample update' }).click();
    assert.equal(await page.locator('.sx-check-icon.pass').count(), 3);
  });
  await check('Product strategy choices change the roadmap scope', async () => {
    await page.goto(`${base}/digital-product-strategy.html`);
    await page.getByRole('checkbox', { name: /Email updates/ }).check();
    assert.match(await page.locator('.sx-roadmap').innerText(), /3 capabilities selected/);
    await page.getByRole('button', { name: 'Reset demo' }).click();
    assert.match(await page.locator('.sx-roadmap').innerText(), /2 capabilities selected/);
  });
  await check('Architecture models explain each selected layer', async () => {
    await page.goto(`${base}/technology-stack.html`);
    await page.getByRole('button', { name: 'Operations platform', exact: true }).click();
    await page.getByRole('button', { name: /02 Workflow/ }).click();
    assert.match(await page.locator('.sx-layer-info').innerText(), /Services \+ event processing/);
  });

  await check('Native service section navigation', async () => {
    await page.goto(`${base}/erp-systems.html`);
    await page.getByRole('link', { name: /Your deliverables/ }).click();
    await page.waitForURL('**/erp-systems.html#service-scope');
    assert.ok(await page.locator('#service-scope').isVisible());
    assert.equal(await page.locator('.hich-transition').getAttribute('data-phase'), 'idle');
  });

  await check('Reduced motion follows ordinary page links immediately', async () => {
    await page.locator('.related-services a').first().click();
    await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('.hich-transition').getAttribute('data-phase'), 'idle');
    assert.equal(await page.locator('.hich-transition').evaluate(el => getComputedStyle(el).display), 'none');
  });

  const motion = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: 'no-preference' });
  const animated = await motion.newPage();
  animated.on('pageerror', error => errors.push(`${animated.url()}: ${error.message}`));
  await check('Animated HICH transition preserves destination and browser history', async () => {
    await animated.goto(`${base}/erp-systems.html`);
    await animated.route('**/web-application-development.html', async route => {
      await new Promise(resolve => setTimeout(resolve, 650));
      await route.continue();
    });
    await animated.locator('.related-services a[href="/web-application-development.html"]').click();
    assert.equal(await animated.locator('.hich-transition').getAttribute('data-phase'), 'cover');
    await animated.waitForTimeout(420);
    await animated.screenshot({ path: 'qa/hich-page-transition.png' });
    await animated.waitForURL('**/web-application-development.html');
    await animated.waitForFunction(() => !document.documentElement.hasAttribute('data-hich-arriving') && document.querySelector('.hich-transition')?.dataset.phase === 'idle');
    assert.equal(await animated.locator('.hich-transition').evaluate(el => getComputedStyle(el).visibility), 'hidden');
    await animated.goBack();
    await animated.waitForFunction(() => document.querySelector('.hich-transition')?.dataset.phase === 'idle');
    assert.ok(animated.url().endsWith('/erp-systems.html'));
  });

  await check('Menu and search links work through the branded transition', async () => {
    await animated.goto(`${base}/about.html`);
    await animated.locator('.site-header .menu-trigger').click();
    await animated.locator('.menu-dialog').getByRole('link', { name: 'Capabilities' }).click();
    await animated.waitForURL('**/services.html');
    await animated.waitForFunction(() => document.querySelector('.hich-transition')?.dataset.phase === 'idle');
    await animated.getByRole('button', { name: /Search website/ }).click();
    await animated.getByRole('textbox', { name: 'Search pages and services' }).fill('ERP');
    await animated.locator('.search-results a').first().click();
    await animated.waitForURL('**/erp-systems.html');
    await animated.waitForFunction(() => document.querySelector('.hich-transition')?.dataset.phase === 'idle');
    assert.equal(await animated.evaluate(() => document.body.style.overflow), '');
  });

  await check('Transition retains query strings and cross-page fragments', async () => {
    await animated.evaluate(() => {
      const link = document.createElement('a');
      link.href = '/brand-content-design.html?from=prototype#service-experience';
      link.id = 'qa-transition-target';
      link.textContent = 'Navigation check';
      document.querySelector('main').prepend(link);
    });
    await animated.locator('#qa-transition-target').click();
    await animated.waitForURL('**/brand-content-design.html?from=prototype#service-experience');
    await animated.waitForFunction(() => document.querySelector('.hich-transition')?.dataset.phase === 'idle');
    assert.ok(await animated.locator('#service-experience').isVisible());
  });

  await check('Unavailable browser storage cannot block page navigation', async () => {
    await animated.addInitScript(() => {
      Storage.prototype.setItem = () => { throw new DOMException('Unavailable', 'SecurityError'); };
      Storage.prototype.getItem = () => { throw new DOMException('Unavailable', 'SecurityError'); };
    });
    await animated.goto(`${base}/erp-systems.html`);
    await animated.locator('.related-services a').first().click();
    await animated.waitForURL('**/api-integrations-automation.html');
    await animated.waitForFunction(() => document.querySelector('.hich-transition')?.dataset.phase === 'idle');
  });
  await motion.close();

  await check('No JavaScript errors or hydration failures', async () => {
    assert.deepEqual([...new Set(errors)], []);
  });

  await writeFile('qa/report.json', JSON.stringify({ results, failures, errors }, null, 2));
  console.log(`\n${results.length} checks passed; ${failures.length} failed.`);
  if (failures.length) process.exitCode = 1;
} finally {
  await browser?.close();
  server?.kill();
}
