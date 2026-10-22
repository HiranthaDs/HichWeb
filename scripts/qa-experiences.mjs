import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {
  CARTOON_ROWS, DESKTOP_COLUMNS, MOBILE_COLUMNS, FRAME_MS,
  STORY_DURATION_MS, STORY_FRAME_COUNT, makeStoryFrame,
} from '../src/contribution-story.js';

const base = 'http://127.0.0.1:4182';
const results = [], errors = [];
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', '4182', '--strictPort'], { stdio: 'ignore', windowsHide: true });
let browser;
const check = async (name, task) => {
  try { await task(); results.push({ name, passed: true }); console.log(`PASS ${name}`); }
  catch (error) { results.push({ name, passed: false, message: error.message }); console.error(`FAIL ${name}: ${error.message}`); }
};
const watch = page => page.on('pageerror', error => errors.push(error.message));

try {
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(base)).ok) break; } catch { /* Wait for the local build preview. */ }
    if (attempt === 59) throw new Error('Preview did not start');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  await mkdir('qa', { recursive: true });
  browser = await chromium.launch({ channel: process.env.QA_BROWSER || 'chrome', headless: true });

  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 960 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    watch(page);
    for (const path of ['/', '/about.html']) {
      await check(`New sections fit ${width}px ${path}`, async () => {
        await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
        assert.equal(await page.locator('h1').count(), 1);
        assert.equal(await page.locator('.motion-playground').count(), 0, 'The replaced motion playground is absent');
        assert.equal(await page.locator('.contribution-garden').count(), 1, 'One contribution grid per page');
        if (path === '/') {
          assert.equal(await page.locator('.contribution-garden').evaluate(el => el.nextElementSibling?.id), 'work', 'The contribution grid sits directly before selected work');
        }
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'No page overflow');
        assert.ok((await page.locator('main').innerText()).includes('4,882'));
        if (path === '/about.html') {
          assert.equal(await page.locator('.about-story').count(), 1);
          await page.getByText('How do we choose the technology?', { exact: true }).click();
          assert.equal(await page.locator('.about-story details').nth(1).getAttribute('open'), '');
        }
      });
    }
    await context.close();
  }

  // Date checks use Colombo month boundaries even when the visitor is elsewhere.
  for (const [date, enabled] of [
    ['2026-10-16T12:00:00Z', false],
    ['2026-11-30T18:29:59Z', false],
    ['2026-11-30T18:30:00Z', true],
    ['2026-12-25T12:00:00Z', true],
    ['2026-12-31T18:29:59Z', true],
    ['2026-12-31T18:30:00Z', false],
  ]) {
    await check(`Snow ${enabled ? 'on' : 'off'} at ${date}`, async () => {
      const context = await browser.newContext({ reducedMotion: 'no-preference', timezoneId: 'America/New_York' });
      const page = await context.newPage();
      watch(page);
      await page.clock.setFixedTime(new Date(date));
      await page.goto(`${base}/about.html`, { waitUntil: 'networkidle' });
      assert.equal(await page.locator('.seasonal-snow-canvas').count(), enabled ? 1 : 0);
      assert.equal(await page.locator('.seasonal-snow-toggle').count(), enabled ? 1 : 0);
      await context.close();
    });
  }

  await check('December snow pauses, persists, resumes and responds to reduced motion', async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    watch(page);
    await page.clock.setFixedTime(new Date('2026-12-15T12:00:00Z'));
    await page.goto(base, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('.seasonal-snow-canvas').evaluate(el => getComputedStyle(el).pointerEvents), 'none');
    const toggleBounds = await page.locator('.seasonal-snow-toggle').boundingBox();
    const dockBounds = await page.locator('.mobile-dock').boundingBox();
    assert.ok(toggleBounds.y + toggleBounds.height < dockBounds.y, 'Control clears the mobile dock');
    await page.getByRole('button', { name: 'Pause December snowfall', exact: true }).click();
    assert.equal(await page.locator('.seasonal-snow-canvas').count(), 0);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('.seasonal-snow-canvas').count(), 0);
    await page.getByRole('button', { name: 'Resume December snowfall', exact: true }).click();
    await page.locator('.seasonal-snow-canvas').waitFor();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('.seasonal-snow-toggle').waitFor({ state: 'detached' });
    assert.equal(await page.locator('.seasonal-snow-canvas').count(), 0);
    await context.close();
  });

  await check('An open page follows the December and January calendar boundaries', async () => {
    const context = await browser.newContext({ reducedMotion: 'no-preference' });
    const page = await context.newPage();
    watch(page);
    await page.clock.install({ time: new Date('2026-11-30T18:29:30Z') });
    await page.goto(`${base}/privacy-policy.html`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('.seasonal-snow-canvas').count(), 0);
    await page.clock.fastForward(61_000);
    await page.locator('.seasonal-snow-canvas').waitFor();
    await page.clock.setFixedTime(new Date('2027-01-01T00:00:00Z'));
    await page.clock.fastForward(61_000);
    await page.locator('.seasonal-snow-canvas').waitFor({ state: 'detached' });
    await context.close();
  });

  await check('Snow controls still work when browser storage is disabled', async () => {
    const context = await browser.newContext({ reducedMotion: 'no-preference' });
    await context.addInitScript(() => {
      for (const method of ['getItem', 'setItem']) Storage.prototype[method] = () => { throw new Error('Storage unavailable'); };
    });
    const page = await context.newPage();
    watch(page);
    await page.clock.setFixedTime(new Date('2026-12-15T12:00:00Z'));
    await page.goto(`${base}/privacy-policy.html`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Pause December snowfall', exact: true }).click();
    await page.getByRole('button', { name: 'Resume December snowfall', exact: true }).click();
    await page.locator('.seasonal-snow-canvas').waitFor();
    await context.close();
  });

  await check('Contribution story is drawn entirely inside GitHub grid cells on Home and About', async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 960 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    watch(page);
    for (const path of ['/', '/about.html']) {
      await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
      const garden = page.locator('.contribution-garden');
      await garden.scrollIntoViewIfNeeded();
      assert.equal(await garden.getAttribute('data-running'), 'false');
      assert.equal(await garden.getAttribute('data-scene'), 'ocean-waves');
      assert.equal(await garden.locator('.cg-current, .cg-controls').count(), 0, 'Description and technology button bars removed');
      assert.equal(await garden.locator('.cg-panel').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)');
      const colours = await garden.locator('.cg-pixel').evaluateAll(elements => elements.map(el => getComputedStyle(el).backgroundColor));
      const palette = ['rgb(235, 237, 240)', 'rgb(216, 239, 220)', 'rgb(155, 233, 168)', 'rgb(64, 196, 99)', 'rgb(33, 110, 57)'];
      assert.ok(colours.every(colour => palette.includes(colour)), 'All story pixels use GitHub activity colours');
      assert.ok(new Set(colours).size >= 3, 'The pixel illustration uses several activity levels');
      assert.equal(await garden.locator('.cg-board').innerText(), '', 'The story contains no visible words or dates');
      assert.equal(await garden.locator('.cg-mobile-console, .cg-mobile-years, .cg-mobile-feed, .cg-letter-pixel').count(), 0, 'Year chrome, dated feed, and letter pixels are removed');
      assert.equal(await garden.locator('.cg-board').getAttribute('role'), 'img');
      const description = await garden.locator('.cg-board').getAttribute('aria-label');
      assert.match(description, /ocean wave/i, 'The accessible description identifies the ocean wave');
      assert.doesNotMatch(description, /cat|dog|dinosaur|animal/i, 'No animal is described');
      assert.equal(await garden.locator('.cg-board > *').count(), 1, 'The contribution grid is the only artwork layer');
      assert.equal(await garden.locator('.cg-board > .cg-grid').count(), 1);
      assert.equal(await garden.locator('.cg-board svg, .cg-board canvas, .cg-board img, .cg-board video, .cg-story-art').count(), 0, 'No separate cartoon overlay is rendered');
      assert.ok(await garden.locator('.cg-grid').evaluate(el => getComputedStyle(el).opacity === '1'
        && Array.from(el.children).every(cell => cell.tagName === 'SPAN' && cell.childElementCount === 0 && getComputedStyle(cell).opacity === '1')), 'Full-opacity square spans are the only drawing elements');
      assert.ok(await garden.locator('.cg-pixel').evaluateAll(elements => elements.every(cell => parseFloat(getComputedStyle(cell).borderRadius) <= 3)), 'Cells use GitHub-style rounded square corners');
    }
    await page.locator('.contribution-garden').screenshot({ path: 'qa/contribution-mobile.png' });
    await context.close();
  });

  for (const width of [320, 390, 700, 701, 1440]) {
    await check(`Contribution story fits ${width}px with square grid cells`, async () => {
      const context = await browser.newContext({ viewport: { width, height: 960 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      watch(page);
      await page.goto(`${base}/about.html`, { waitUntil: 'networkidle' });
      const garden = page.locator('.contribution-garden');
      await garden.scrollIntoViewIfNeeded();
      assert.equal(await garden.locator('.cg-grid').count(), 1, 'Only one responsive contribution grid is mounted');
      assert.equal(await garden.locator('.cg-board').innerText(), '');
      const geometry = await garden.locator('.cg-grid').evaluate(el => ({
        columns: getComputedStyle(el).gridTemplateColumns.split(' ').length,
        rows: getComputedStyle(el).gridTemplateRows.split(' ').length,
        cells: el.children.length,
        squares: Array.from(el.children).every(cell => Math.abs(cell.offsetWidth - cell.offsetHeight) <= 1),
      }));
      const columns = width <= 700 ? MOBILE_COLUMNS : DESKTOP_COLUMNS;
      assert.deepEqual(geometry, { columns, rows: CARTOON_ROWS, cells: columns * CARTOON_ROWS, squares: true });
      assert.equal(await garden.locator('.cg-board').getAttribute('data-grid-layout'), width <= 700 ? 'mobile' : 'desktop');
      if (width <= 700) assert.ok(MOBILE_COLUMNS < DESKTOP_COLUMNS, 'Mobile uses its own shorter activity grid');
      assert.ok(await garden.locator('.cg-graph-scroll').evaluate(el => el.scrollWidth <= el.clientWidth + 2), 'The story fits without horizontal scrolling');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'The responsive story causes no page overflow');
      await context.close();
    });
  }

  for (const width of [390, 1440]) {
    await check(`Grid pixels animate, pause, resume, and rest offscreen at ${width}px`, async () => {
      const context = await browser.newContext({ viewport: { width, height: 960 }, reducedMotion: 'no-preference' });
      const page = await context.newPage();
      watch(page);
      await page.clock.install({ time: new Date('2026-10-16T12:00:00Z') });
      await page.goto(`${base}/about.html`, { waitUntil: 'networkidle' });
      const garden = page.locator('.contribution-garden');
      const grid = garden.locator('.cg-grid');
      const board = garden.locator('.cg-board');
      const frame = () => board.getAttribute('data-frame');
      const appearance = () => grid.locator('.cg-pixel').evaluateAll(elements => elements.map(el => el.className).join('|'));
      const geometry = () => grid.evaluate(el => ({
        width: el.clientWidth, height: el.clientHeight,
        cells: Array.from(el.children, cell => [cell.offsetLeft, cell.offsetTop, cell.offsetWidth, cell.offsetHeight]),
      }));
      await garden.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('.contribution-garden')?.dataset.running === 'true');
      await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
      const originalGeometry = await geometry();
      const description = await board.getAttribute('aria-label');
      await grid.evaluate(el => { window.__qaContributionCells = Array.from(el.children); });
      const originalFrame = await frame();
      const originalAppearance = await appearance();
      assert.match(originalFrame, /^\d+$/, 'A numeric animation frame is exposed for inspection');
      await page.clock.runFor(FRAME_MS * 7);
      assert.notEqual(await frame(), originalFrame, 'The story advances while visible');
      assert.notEqual(await appearance(), originalAppearance, 'Actual contribution cell colours draw the moving story');
      assert.deepEqual(await geometry(), originalGeometry, 'Animation preserves every contribution cell position and size');
      assert.ok(await grid.evaluate(el => Array.from(el.children).every((cell, index) => cell === window.__qaContributionCells[index])), 'Animation reuses the original grid cells');
      assert.equal(await board.getAttribute('aria-label'), description, 'Animation keeps a stable accessible description');

      await page.getByRole('button', { name: 'Pause animation', exact: true }).click();
      assert.equal(await garden.getAttribute('data-running'), 'false');
      const pausedFrame = await frame();
      const pausedAppearance = await appearance();
      await page.clock.runFor(960);
      assert.equal(await frame(), pausedFrame);
      assert.equal(await appearance(), pausedAppearance, 'Pausing freezes the ocean wave');

      await page.getByRole('button', { name: 'Play animation', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('.contribution-garden')?.dataset.running === 'true');
      await page.clock.runFor(720);
      assert.notEqual(await frame(), pausedFrame, 'Play resumes the story');

      // Simulate the Page Visibility API notification without changing browser focus.
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await page.waitForFunction(() => document.querySelector('.contribution-garden')?.dataset.running === 'false');
      const hiddenFrame = await frame();
      await page.clock.runFor(960);
      assert.equal(await frame(), hiddenFrame, 'A hidden tab stops advancing');
      await page.evaluate(() => {
        delete document.visibilityState;
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await page.waitForFunction(() => document.querySelector('.contribution-garden')?.dataset.running === 'true');

      await page.locator('h1').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('.contribution-garden')?.dataset.running === 'false');
      const offscreenFrame = await frame();
      await page.clock.runFor(960);
      assert.equal(await frame(), offscreenFrame, 'An offscreen story stops advancing');

      await garden.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('.contribution-garden')?.dataset.running === 'true');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForFunction(() => document.querySelector('.contribution-garden')?.dataset.running === 'false');
      const reducedFrame = await frame();
      const reducedAppearance = await appearance();
      await page.clock.runFor(960);
      assert.equal(await frame(), reducedFrame, 'Reduced motion presents a still illustration');
      assert.equal(await appearance(), reducedAppearance, 'Reduced motion freezes the ocean wave');
      await context.close();
    });
  }

  await check('A paused pixel story survives desktop and mobile breakpoint changes', async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: 'no-preference' });
    try {
      const page = await context.newPage();
      watch(page);
      await page.clock.install({ time: new Date('2026-10-16T12:00:00Z') });
      await page.goto(`${base}/about.html`, { waitUntil: 'networkidle' });
      const garden = page.locator('.contribution-garden');
      const board = garden.locator('.cg-board');
      await garden.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('.contribution-garden')?.dataset.running === 'true');
      await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
      await page.getByRole('button', { name: 'Pause animation', exact: true }).click();
      const pausedFrame = Number(await board.getAttribute('data-frame'));
      for (const width of [700, 701, 320, 1440]) {
        const columns = width <= 700 ? MOBILE_COLUMNS : DESKTOP_COLUMNS;
        await page.setViewportSize({ width, height: 960 });
        await page.waitForFunction(count => document.querySelectorAll('.cg-pixel').length === count, columns * CARTOON_ROWS);
        assert.equal(Number(await board.getAttribute('data-frame')), pausedFrame, 'Resizing preserves the paused story position');
        const pixels = await garden.locator('.cg-pixel').evaluateAll(elements => elements.map(el => Number(el.className.match(/cg-level-(\d)/)?.[1])));
        assert.deepEqual(pixels, Array.from(makeStoryFrame(pausedFrame, columns)), `The ${width}px grid redraws the same scene at its new resolution`);
        assert.ok(await garden.locator('.cg-pixel').evaluateAll(elements => elements.every(el => Math.abs(el.offsetWidth - el.offsetHeight) <= 1)), 'Resized pixels stay square');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'Resizing causes no horizontal overflow');
        assert.equal(await garden.getAttribute('data-running'), 'false', 'Resizing respects the pause control');
      }
    } finally {
      await context.close();
    }
  });

  for (const width of [390, 1440]) {
    await check(`Ocean wave plays through a complete loop at ${width}px`, async () => {
      const context = await browser.newContext({ viewport: { width, height: 960 }, reducedMotion: 'no-preference' });
      try {
        const page = await context.newPage();
        watch(page);
        await page.clock.install({ time: new Date('2026-10-16T12:00:00Z') });
        await page.goto(`${base}/about.html`, { waitUntil: 'networkidle' });
        const garden = page.locator('.contribution-garden');
        const grid = garden.locator('.cg-grid');
        const board = garden.locator('.cg-board');
        await garden.scrollIntoViewIfNeeded();
        await page.waitForFunction(() => document.querySelector('.contribution-garden')?.dataset.running === 'true');
        // runFor executes every interval, exercising the browser's actual
        // playback controller without skipping the scenes between checkpoints.
        await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
        const duration = Number(await board.getAttribute('data-duration-ms'));
        assert.equal(duration, STORY_DURATION_MS);
        assert.equal(duration, STORY_FRAME_COUNT * FRAME_MS);
        assert.ok(duration >= 10_000, 'The wave moves at a calm, readable pace');
        const columns = width <= 700 ? MOBILE_COLUMNS : DESKTOP_COLUMNS;

        const snapshot = () => board.evaluate(el => {
          const grid = el.querySelector('.cg-grid');
          return {
            frame: Number(el.dataset.frame),
            time: Number(el.dataset.timeMs),
            scene: el.dataset.waveState,
            pixels: Array.from(grid.children, cell => Number(cell.className.match(/cg-level-(\d)/)?.[1])),
            geometry: {
              width: grid.clientWidth, height: grid.clientHeight,
              cells: Array.from(grid.children, cell => [cell.offsetLeft, cell.offsetTop, cell.offsetWidth, cell.offsetHeight]),
            },
          };
        });
        const initial = await snapshot();
        await board.evaluate(el => { window.__qaStoryCells = Array.from(el.querySelector('.cg-grid').children); });
        const checkpoints = [3_000, 6_000, 9_000].map(time => ({
          time,
          offset: (time - initial.time + duration) % duration,
        })).sort((a, b) => a.offset - b.offset);
        let elapsed = 0;
        const chapterPictures = new Set();
        for (const checkpoint of checkpoints) {
          await page.clock.runFor(checkpoint.offset - elapsed);
          elapsed = checkpoint.offset;
          const state = await snapshot();
          assert.equal(state.scene, 'ocean-wave', 'Playback remains an ocean-only animation');
          assert.ok(Math.abs(state.time - checkpoint.time) <= FRAME_MS, 'The animation follows elapsed time within one pixel frame');
          assert.deepEqual(state.geometry, initial.geometry, 'Chapters preserve the contribution grid geometry');
          assert.deepEqual(state.pixels, Array.from(makeStoryFrame(state.frame, columns)), 'The wave is painted into the actual contribution cells');
          assert.ok(state.pixels.filter(level => level >= 2).length >= 12, 'The wave contains visible green pixel artwork');
          chapterPictures.add(state.pixels.join(''));
        }
        assert.equal(chapterPictures.size, checkpoints.length, 'The swell changes throughout the loop');
        await page.getByRole('button', { name: 'Pause animation', exact: true }).click();
        const paused = await snapshot();
        await page.clock.runFor(1200);
        assert.deepEqual((await snapshot()).pixels, paused.pixels, 'Pausing freezes the wave');
        await page.getByRole('button', { name: 'Play animation', exact: true }).click();
        await page.clock.runFor(duration - elapsed);
        const wrapped = await snapshot();
        const wrapDifference = Math.min(Math.abs(wrapped.time - initial.time), duration - Math.abs(wrapped.time - initial.time));
        assert.ok(wrapDifference <= FRAME_MS, 'One complete duration returns to the original story position');
        assert.equal(wrapped.scene, initial.scene, 'The story loops back to its opening chapter');
        assert.deepEqual(wrapped.geometry, initial.geometry);
        await page.clock.runFor(128);
        assert.notEqual((await snapshot()).time, wrapped.time, 'Playback continues after wrapping');
        assert.ok(await grid.evaluate(el => Array.from(el.children).every((cell, index) => cell === window.__qaStoryCells[index])), 'All chapters reuse the original grid cells');
      } finally {
        await context.close();
      }
    });
  }

  await check('Contribution hover is local, elastic and enabled only for desktop mouse input', async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    watch(page);
    await page.goto(base, { waitUntil: 'networkidle' });
    const grid = page.locator('.cg-grid');
    await grid.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('.cg-grid')?.dataset.hoverEnabled === 'true');
    const bounds = await grid.boundingBox();
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.waitForFunction(() => [...document.querySelectorAll('.cg-pixel')].some(el => parseFloat(el.style.getPropertyValue('--hover-scale')) > 1.001));
    assert.equal(await grid.getAttribute('data-hover-active'), 'true');
    const affected = await grid.locator('.cg-pixel').evaluateAll(elements => elements.filter(el => parseFloat(el.style.getPropertyValue('--hover-scale')) > 1.001).length);
    assert.ok(affected > 0 && affected < await grid.locator('.cg-pixel').count(), 'Only cells near the cursor respond');
    await page.mouse.move(10, 10);
    await page.waitForFunction(() => document.querySelector('.cg-grid')?.dataset.hoverActive === 'false');
    await page.waitForFunction(() => [...document.querySelectorAll('.cg-pixel')].every(el => !el.style.getPropertyValue('--hover-scale')));
    await grid.dispatchEvent('pointermove', { pointerType: 'touch', clientX: bounds.x + bounds.width / 2, clientY: bounds.y + bounds.height / 2 });
    assert.equal(await grid.getAttribute('data-hover-active'), 'false', 'Touch input does not start hover on a desktop');
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.waitForFunction(() => document.querySelector('.cg-grid')?.dataset.hoverActive === 'true');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.querySelector('.cg-grid')?.dataset.hoverEnabled === 'false');
    assert.ok(await grid.locator('.cg-pixel').evaluateAll(elements => elements.every(el => !el.style.getPropertyValue('--hover-scale'))), 'Reduced motion clears the hover deformation');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(() => document.querySelector('.cg-grid')?.dataset.hoverEnabled === 'true');
    await page.setViewportSize({ width: 820, height: 1100 });
    await page.waitForFunction(() => document.querySelector('.cg-grid')?.dataset.hoverEnabled === 'false');
    assert.ok(await grid.locator('.cg-pixel').evaluateAll(elements => elements.every(el => !el.style.getPropertyValue('--hover-scale'))), 'Narrow layouts clear the hover deformation');
    await context.close();

    for (const width of [390, 1440]) {
      const touchContext = await browser.newContext({ viewport: { width, height: 960 }, hasTouch: true, reducedMotion: 'no-preference' });
      const touchPage = await touchContext.newPage();
      watch(touchPage);
      await touchPage.goto(base, { waitUntil: 'networkidle' });
      const touchGrid = touchPage.locator('.cg-grid');
      await touchGrid.scrollIntoViewIfNeeded();
      await touchPage.waitForFunction(() => document.querySelector('.contribution-garden')?.dataset.running === 'true');
      assert.equal(await touchGrid.getAttribute('data-hover-enabled'), 'false', `Touch-only input is excluded at ${width}px`);
      const touchBounds = await touchGrid.boundingBox();
      await touchPage.mouse.move(touchBounds.x + touchBounds.width / 2, touchBounds.y + touchBounds.height / 2);
      assert.ok(await touchGrid.locator('.cg-pixel').evaluateAll(elements => elements.every(el => !el.style.getPropertyValue('--hover-scale'))), 'Touch-only screens retain a steady grid');
      await touchContext.close();
    }
  });

  await check('New content has no automated accessibility violations at desktop and mobile sizes', async () => {
    for (const width of [1440, 390, 320]) {
      const context = await browser.newContext({ viewport: { width, height: 960 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      watch(page);
      for (const path of ['/', '/about.html']) {
        await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
        const selectors = path === '/' ? ['.contribution-garden'] : ['.about-story', '.contribution-garden'];
        const audit = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']);
        for (const selector of selectors) audit.include(selector);
        const report = await audit.analyze();
        assert.deepEqual(report.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, reason: n.failureSummary })) })), [], `${width}px ${path}`);
      }
      if (width === 1440) await page.locator('.contribution-garden').screenshot({ path: 'qa/contribution-desktop.png' });
      await page.locator('.about-story').screenshot({ path: `qa/about-story-${width}.png` });
      await context.close();
    }
  });

  await check('No uncaught browser errors or hydration failures', async () => assert.deepEqual(errors, []));
  await writeFile('qa/experiences-report.json', JSON.stringify({ results, errors }, null, 2));
  const failed = results.filter(result => !result.passed);
  console.log(`${results.length - failed.length} checks passed; ${failed.length} failed.`);
  if (failed.length) process.exitCode = 1;
} finally {
  await browser?.close();
  server.kill();
}
