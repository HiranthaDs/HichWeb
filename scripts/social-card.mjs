import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';

// Render the site's own typography into a widely supported social preview PNG.
const font = (await readFile('public/fonts/anton.ttf')).toString('base64');
const browser = await chromium.launch({ channel: process.env.QA_BROWSER || 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<style>@font-face{font-family:Anton;src:url(data:font/ttf;base64,${font})}*{box-sizing:border-box}body{margin:0;background:#fff;color:#080808;padding:48px 65px;font-family:Arial,sans-serif}.top{display:flex;align-items:center;justify-content:space-between}.brand{font-family:Anton;font-size:62px;line-height:1}.dot{color:#ff3454}.meta{font-size:13px;letter-spacing:.12em}h1{font:118px/.99 Anton;margin:55px 0 35px;letter-spacing:-.01em}.blue{color:#1043f9}.bottom{display:flex;justify-content:space-between;align-items:center;font-size:17px}.pill{background:#ff3454;border-radius:50px;padding:18px 25px;display:inline-block;font-size:15px}.spark{position:absolute;right:76px;top:260px;color:#ff3454;font:150px Arial}</style><div class="top"><span class="brand">HICH<span class="dot">.</span></span><span class="meta">SRI LANKA · WORLDWIDE</span></div><h1>WEBSITES FOR BRANDS<br />THAT <span class="blue">THINK BIG.</span></h1><svg class="spark" width="135" height="135" viewBox="0 0 100 100" fill="none"><path d="M50 4v92M4 50h92M17.5 17.5l65 65M17.5 82.5l65-65" stroke="currentColor" stroke-width="5" /></svg><div class="bottom"><span class="pill">Design. Build. Grow.</span><span>hichweb.com</span></div>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'public/social-card.png' });
  console.log('Created public/social-card.png (1200 × 630).');
} finally { await browser.close(); }
