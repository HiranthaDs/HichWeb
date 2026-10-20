import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const [route = '/brand-content-design.html', name = 'capture', width = '1440', target] = process.argv.slice(2);
await mkdir('qa', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: Number(width), height: 1000 }, reducedMotion: 'reduce' });
  await page.goto(`${process.env.QA_BASE_URL || 'http://127.0.0.1:5173'}${route}`);
  await page.locator('h1').waitFor();
  await page.evaluate(() => document.fonts.ready);
  if (target) await page.locator(target).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `qa/${name}.png`, fullPage: !target });
  console.log(JSON.stringify({ title: await page.title(), width: Number(width), file: `qa/${name}.png` }));
} finally {
  await browser.close();
}
