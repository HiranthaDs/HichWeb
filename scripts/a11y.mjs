import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.A11Y_BASE_URL || process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const paths = ['/', '/contact.html', '/terms-and-conditions.html', '/ecommerce-solutions.html', '/erp-systems.html', '/brand-content-design.html'];
const report = { base, generatedAt: new Date().toISOString(), reducedMotion: 'reduce', pages: [], keyboard: [], errors: [] };
await mkdir('qa', { recursive: true });
const browser = await chromium.launch({ channel: process.env.QA_BROWSER || 'chrome', headless: true });

async function keyboardCheck(name, task) {
  try {
    await task(); report.keyboard.push({ name, passed: true }); console.log(`PASS keyboard: ${name}`);
  } catch (error) {
    report.keyboard.push({ name, passed: false, message: error.message }); console.error(`FAIL keyboard: ${name}: ${error.message}`);
  }
}

try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 960 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push({ width, url: page.url(), message: error.message }));
    for (const path of paths) {
      await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
      await page.locator('main h1').waitFor();
      await page.evaluate(() => document.fonts.ready);
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze();
      const violations = result.violations.map(({ id, impact, description, help, helpUrl, nodes }) => ({
        id, impact, description, help, helpUrl,
        nodes: nodes.map(({ target, html, failureSummary, any, all, none }) => ({
          target, html, failureSummary,
          checks: [...any, ...all, ...none].map(({ id: check, message, data }) => ({ check, message, data })),
        })),
      }));
      report.pages.push({ path, width, passes: result.passes.length, incomplete: result.incomplete.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map(n => n.target) })), violations });
      console.log(`${width}px ${path}: ${violations.length} rules, ${violations.reduce((n, v) => n + v.nodes.length, 0)} affected nodes`);
      for (const violation of violations) console.log(`  ${violation.impact}: ${violation.id} — ${violation.nodes.length} nodes: ${violation.nodes.slice(0, 3).map(n => n.target.join(' ')).join('; ')}`);
    }

    await page.goto(base, { waitUntil: 'networkidle' });
    await keyboardCheck(`${width}px skip link moves focus to content`, async () => {
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('skip-link')), true);
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'main');
    });
    await keyboardCheck(`${width}px menu opens by keyboard, contains focus, and Escape restores trigger`, async () => {
      await page.evaluate(() => document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close()));
      await page.locator('.site-header .menu-trigger').focus();
      await page.keyboard.press('Enter');
      await page.locator('.menu-dialog[open]').waitFor();
      for (let i = 0; i < 22; i += 1) {
        // Native dialogs allow Tab to browser chrome (activeElement === body).
        // The defect to detect is focus reaching an inert background control.
        assert.equal(await page.evaluate(() => document.activeElement === document.body || Boolean(document.activeElement?.closest('.menu-dialog'))), true, `Focus reached background content at Tab ${i}`);
        await page.keyboard.press('Tab');
      }
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.menu-dialog[open]').count(), 0);
      assert.equal(await page.evaluate(() => document.activeElement?.matches('.site-header .menu-trigger')), true);
    });
    await keyboardCheck(`${width}px search shortcut focuses input and Escape restores trigger`, async () => {
      await page.evaluate(() => document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close()));
      await page.locator('.search-trigger').focus();
      await page.keyboard.press('Control+k');
      await page.locator('.search-dialog[open]').waitFor();
      await page.waitForFunction(() => document.activeElement?.id === 'site-search');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.search-dialog[open]').count(), 0);
      assert.equal(await page.evaluate(() => document.activeElement?.matches('.search-trigger')), true);
    });
    await context.close();
  }
} catch (error) {
  report.errors.push({ message: error.stack || error.message });
  console.error(error.message);
} finally {
  await browser.close();
  report.summary = {
    pages: report.pages.length,
    violationRules: report.pages.reduce((n, p) => n + p.violations.length, 0),
    seriousOrCriticalNodes: report.pages.reduce((n, p) => n + p.violations.filter(v => ['serious', 'critical'].includes(v.impact)).reduce((m, v) => m + v.nodes.length, 0), 0),
    contrastNodes: report.pages.reduce((n, p) => n + p.violations.filter(v => v.id === 'color-contrast').reduce((m, v) => m + v.nodes.length, 0), 0),
    keyboardFailures: report.keyboard.filter(k => !k.passed).length,
    errors: report.errors.length,
  };
  await writeFile('qa/a11y-report.json', `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report.summary, null, 2));
  if (report.summary.seriousOrCriticalNodes || report.summary.keyboardFailures || report.summary.errors) process.exitCode = 1;
}
