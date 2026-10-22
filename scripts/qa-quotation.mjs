import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4186';
const server = process.env.QA_BASE_URL ? null : spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4186', '--strictPort'], { stdio: 'ignore', windowsHide: true });
const errors = [];
let browser;

async function layout(page, chat) {
  const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  assert.ok(dimensions.scroll <= dimensions.width + 2, 'No page overflow');
  const transcript = await chat.locator('.assistant-chat-transcript').evaluate(el => ({ width: el.clientWidth, scroll: el.scrollWidth }));
  assert.ok(transcript.scroll <= transcript.width + 2, 'No quotation overflow');
}

try {
  for (let attempt = 0; attempt < 40; attempt++) {
    if (await fetch(base).then(response => response.ok).catch(() => false)) break;
    if (attempt === 39) throw new Error('Local preview did not start');
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  await mkdir('artifacts', { recursive: true });
  browser = await chromium.launch({ headless: true });
  for (const mobile of [false, true]) {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/chat', route => route.fulfill({ status: 503, json: { mode: 'guide' } }));
    if (mobile) {
      await page.route('**/fonts/*.ttf', route => route.abort());
      await page.addInitScript(() => {
        const original = URL.createObjectURL.bind(URL);
        window.failNextPdf = true;
        URL.createObjectURL = blob => {
          if (window.failNextPdf && blob.type === 'application/pdf') { window.failNextPdf = false; throw new Error('Simulated file preparation failure'); }
          return original(blob);
        };
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Clipboard blocked'); } } });
      });
    }
    await page.goto(base, { waitUntil: 'networkidle' });
    if (mobile) await page.getByRole('button', { name: 'Open Chathu', exact: true }).click();
    const chat = page.locator('[data-assistant="site"]');
    if (!mobile) {
      for (const [question, expected] of [['Where are you located?', /Kandana, Sri Lanka/], ['Who is your founder?', /Hirantha Dias/], ['How many staff do you have?', /more than 30/]]) {
        await chat.getByRole('textbox', { name: 'Your message' }).fill(question);
        await chat.getByRole('button', { name: 'Send message', exact: true }).click();
        await chat.locator('[data-message-role="assistant"]').last().filter({ hasText: expected }).waitFor();
        await chat.locator('.assistant-chat-stop').waitFor({ state: 'hidden' });
      }
    }
    await chat.getByRole('button', { name: 'Build quotation', exact: true }).click();
    await chat.getByRole('button', { name: 'E-commerce', exact: true }).click();
    const card = chat.locator('.quote-flow-package-card').filter({ hasText: 'WhatsApp order checkout' });
    await card.locator('summary').click();
    assert.match(await card.innerText(), /Responsive storefront/);
    await card.getByRole('button', { name: 'Choose package', exact: true }).click();
    const gateway = chat.locator('.quote-flow-addon-list>button').filter({ hasText: 'verified callbacks' });
    await gateway.click();
    assert.match(await chat.locator('.quote-flow-running-total').innerText(), /LKR 380,000/);
    assert.match(await chat.locator('.quote-flow-running-total').innerText(), /USD 511/);
    await layout(page, chat);
    await chat.getByRole('button', { name: 'Continue with 1 add-on', exact: true }).click();
    assert.equal(await chat.getByRole('button', { name: 'Review quotation', exact: true }).isDisabled(), true);
    await chat.locator('input[name="name"]').fill('Quotation QA Client');
    await chat.locator('input[name="company"]').fill('Example & Partners');
    await chat.locator('input[name="email"]').fill('not-an-email');
    await chat.locator('input[name="phone"]').fill('+94 77 000 0000');
    await chat.locator('textarea[name="objective"]').fill('Sell books & manage orders.\nDeliver nationwide.');
    await chat.locator('input[name="targetLaunch"]').fill('Flexible');
    await chat.getByRole('button', { name: 'Review quotation', exact: true }).click();
    assert.equal(await chat.locator('input[name="email"]').evaluate(el => el.checkValidity()), false);
    await chat.locator('input[name="email"]').fill('qa@example.com');
    await chat.getByRole('button', { name: 'Review quotation', exact: true }).click();
    const reference = (await chat.locator('.quote-flow-review').innerText()).match(/HICH-Q-\d+-\d+/)[0];
    assert.match(await chat.locator('.quote-flow-milestones').innerText(), /Project kickoff/);
    await chat.getByRole('button', { name: 'Back to chat · Keep this draft', exact: true }).click();
    await chat.getByRole('button', { name: 'Resume quotation', exact: true }).click();
    assert.ok((await chat.locator('.quote-flow-review').innerText()).includes(reference));
    await chat.locator('.assistant-chat-transcript').evaluate(el => el.scrollTop = 0);
    await chat.screenshot({ path: `artifacts/quotation-review-${mobile ? 'mobile' : 'desktop'}.png` });
    await chat.getByRole('button', { name: 'Prepare quotation PDF', exact: true }).click();
    if (mobile) {
      await chat.getByRole('alert').waitFor();
      assert.match(await chat.getByRole('alert').innerText(), /quotation is still here/);
      assert.equal(await chat.getByRole('link', { name: 'Send quotation on WhatsApp', exact: true }).count(), 1, 'Sharing remains available after PDF failure');
      await chat.getByRole('button', { name: 'Prepare quotation PDF', exact: true }).click();
    }
    const download = chat.getByRole('link', { name: 'Download PDF', exact: true });
    await download.waitFor();
    const originalUrl = await download.getAttribute('href');
    assert.equal(await chat.getByRole('link', { name: 'Open PDF', exact: true }).getAttribute('href'), originalUrl);
    for (let count = 0; count < 2; count++) {
      const completed = page.waitForEvent('download');
      await download.click();
      const file = await completed;
      assert.equal(await file.failure(), null);
      assert.ok(file.suggestedFilename().includes(reference));
      const pdf = await readFile(await file.path());
      assert.ok(pdf.toString('latin1').startsWith('%PDF-'));
      assert.ok(pdf.length > 1000);
      assert.equal(await download.getAttribute('href'), originalUrl, 'Repeated downloads reuse one document');
    }
    const share = chat.getByRole('link', { name: 'Send quotation on WhatsApp', exact: true });
    const href = new URL(await share.getAttribute('href'));
    const message = href.searchParams.get('text');
    for (const text of [reference, 'Quotation QA Client', 'Example & Partners', 'qa@example.com', '+94 77 000 0000', 'Sell books & manage orders.', 'Flexible', 'LKR 380,000', 'USD 511', 'Project kickoff', '50%', 'verified callbacks', 'taxes excluded']) assert.ok(message.includes(text), text);
    await chat.locator('.quote-flow-share-preview summary').click();
    assert.equal(await chat.getByRole('textbox', { name: 'Full quotation details' }).inputValue(), message);
    await chat.locator('.quote-flow-share-preview summary').click();
    if (mobile) {
      assert.match(await chat.locator('.quote-flow-finished').innerText(), /standard font/);
      await chat.getByRole('button', { name: 'Copy full quotation', exact: true }).click();
      assert.match(await chat.locator('.quote-flow-copy-status').innerText(), /text is selected/);
      assert.equal(await chat.getByRole('textbox', { name: 'Full quotation details' }).evaluate(el => el.selectionEnd - el.selectionStart), message.length);
      await chat.locator('.quote-flow-share-preview summary').click();
    }
    await layout(page, chat);
    await chat.locator('.assistant-chat-transcript').evaluate(el => el.scrollTop = 0);
    await chat.screenshot({ path: `artifacts/quotation-ready-${mobile ? 'mobile' : 'desktop'}.png` });
    const axe = await new AxeBuilder({ page }).include('[data-assistant="site"]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(axe.violations.map(item => `${item.id}: ${item.description}`), []);
    await chat.getByRole('button', { name: 'Edit this quotation', exact: true }).click();
    assert.ok((await chat.locator('.quote-flow-review').innerText()).includes(reference));
    await chat.getByRole('button', { name: 'Prepare quotation PDF', exact: true }).click();
    await download.waitFor();
    assert.ok((await download.getAttribute('download')).includes(reference));
    await chat.getByRole('button', { name: 'Start a new quotation', exact: true }).click();
    assert.equal(await chat.getByRole('button', { name: 'E-commerce', exact: true }).getAttribute('aria-pressed'), 'false');
    console.log(`PASS ${mobile ? 'Mobile' : 'Desktop'}: full wizard, form validation, live totals, stable draft, PDF repeat download, complete WhatsApp, layout and accessibility${mobile ? ', offline fonts, failed PDF retry and clipboard fallback' : ', company answers'}.`);
    await context.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  server?.kill();
}
