import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {
  CARTOON_ROWS, DESKTOP_COLUMNS, MOBILE_COLUMNS,
  FRAME_MS, CARTOON_FRAME_COUNT, CARTOON_SCENES, makeCartoonFrame,
} from '../src/contribution-cartoon.js';

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

  await check('Contribution cartoon uses a white panel and GitHub light activity colours on Home and About', async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 960 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    watch(page);
    for (const path of ['/', '/about.html']) {
      await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
      const garden = page.locator('.contribution-garden');
      await garden.scrollIntoViewIfNeeded();
      assert.equal(await garden.getAttribute('data-running'), 'false');
      assert.equal(await garden.getAttribute('data-scene'), 'cartoon');
      assert.equal(await garden.locator('.cg-current, .cg-controls').count(), 0, 'Description and technology button bars removed');
      assert.equal(await garden.locator('.cg-panel').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)');
      const colours = await garden.locator('.cg-pixel').evaluateAll(elements => elements.map(el => getComputedStyle(el).backgroundColor));
      const palette = ['rgb(235, 237, 240)', 'rgb(216, 239, 220)', 'rgb(155, 233, 168)', 'rgb(64, 196, 99)', 'rgb(33, 110, 57)'];
      assert.ok(colours.every(colour => palette.includes(colour)), 'Cartoon pixels use light GitHub greens with a softer background level');
      assert.ok(new Set(colours).size >= 3, 'The paused cartoon remains illustrated with several contribution levels');
      assert.equal(await garden.locator('.cg-board').innerText(), '', 'The cartoon board contains no visible words or dates');
      assert.equal(await garden.locator('.cg-mobile-console, .cg-mobile-years, .cg-mobile-feed, .cg-letter-pixel').count(), 0, 'Year chrome, dated feed, and letter pixels are removed');
      assert.match(await garden.locator('.cg-board').getAttribute('aria-label'), /bunny|cartoon/i, 'The wordless artwork has an accessible description');
    }
    await page.locator('.contribution-garden').screenshot({ path: 'qa/contribution-mobile.png' });
    await context.close();
  });

  for (const width of [320, 390, 700, 701, 1440]) {
    await check(`Wordless cartoon grid fits ${width}px with square pixels`, async () => {
      const context = await browser.newContext({ viewport: { width, height: 960 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      watch(page);
      await page.goto(`${base}/about.html`, { waitUntil: 'networkidle' });
      const garden = page.locator('.contribution-garden');
      await garden.scrollIntoViewIfNeeded();
      assert.equal(await garden.locator('.cg-grid').count(), 1, 'Only one responsive cartoon grid is mounted');
      assert.equal(await garden.locator('.cg-board').innerText(), '');
      const geometry = await garden.locator('.cg-grid').evaluate(el => ({
        columns: getComputedStyle(el).gridTemplateColumns.split(' ').length,
        rows: getComputedStyle(el).gridTemplateRows.split(' ').length,
        cells: el.children.length,
        squares: Array.from(el.children).every(cell => Math.abs(cell.offsetWidth - cell.offsetHeight) <= 1),
      }));
      const columns = width <= 700 ? MOBILE_COLUMNS : DESKTOP_COLUMNS;
      assert.deepEqual(geometry, { columns, rows: CARTOON_ROWS, cells: columns * CARTOON_ROWS, squares: true });
      assert.ok(await garden.locator('.cg-graph-scroll').evaluate(el => el.scrollWidth <= el.clientWidth + 2), 'Cartoon fits without horizontal scrolling');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'The responsive cartoon causes no page overflow');
      await context.close();
    });
  }

  for (const width of [390, 1440]) {
    await check(`Cartoon animates stable grid cells, pauses, resumes, and rests offscreen at ${width}px`, async () => {
      const context = await browser.newContext({ viewport: { width, height: 960 }, reducedMotion: 'no-preference' });
      const page = await context.newPage();
      watch(page);
      await page.clock.install({ time: new Date('2026-10-16T12:00:00Z') });
      await page.goto(`${base}/about.html`, { waitUntil: 'networkidle' });
      const garden = page.locator('.contribution-garden');
      const grid = garden.locator('.cg-grid');
      const frame = () => grid.getAttribute('data-frame');
      const appearance = () => grid.locator('.cg-pixel').evaluateAll(elements => elements.map(el => {
        const style = getComputedStyle(el);
        return [style.backgroundColor, style.opacity, style.transform, style.translate, style.scale, style.rotate, style.borderRadius];
      }));
      const geometry = () => grid.evaluate(el => ({
        width: el.clientWidth, height: el.clientHeight,
        cells: Array.from(el.children, cell => [cell.offsetLeft, cell.offsetTop, cell.offsetWidth, cell.offsetHeight]),
      }));
      await garden.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('.contribution-garden')?.dataset.running === 'true');
      const originalGeometry = await geometry();
      const description = await garden.locator('.cg-board').getAttribute('aria-label');
      await grid.evaluate(el => { window.__qaContributionCells = Array.from(el.children); });
      const originalFrame = await frame();
      const originalAppearance = await appearance();
      assert.match(originalFrame, /^\d+$/, 'A numeric cartoon frame is exposed for inspection');
      await page.clock.runFor(720);
      assert.notEqual(await frame(), originalFrame, 'The cartoon advances while visible');
      assert.notDeepEqual(await appearance(), originalAppearance, 'Actual pixel colours change between cartoon frames');
      assert.deepEqual(await geometry(), originalGeometry, 'Animation preserves every cell’s position and size');
      assert.ok(await grid.evaluate(el => Array.from(el.children).every((cell, index) => cell === window.__qaContributionCells[index])), 'Animation reuses the original grid cells');
      assert.equal(await garden.locator('.cg-board').getAttribute('aria-label'), description, 'Animation keeps a stable accessible description');

      await page.getByRole('button', { name: 'Pause pixel animation', exact: true }).click();
      assert.equal(await garden.getAttribute('data-running'), 'false');
      const pausedFrame = await frame();
      const pausedAppearance = await appearance();
      await page.clock.runFor(960);
      assert.equal(await frame(), pausedFrame);
      assert.deepEqual(await appearance(), pausedAppearance, 'Pausing freezes pixel colour and motion');

      await page.getByRole('button', { name: 'Play pixel animation', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('.contribution-garden')?.dataset.running === 'true');
      await page.clock.runFor(720);
      assert.notEqual(await frame(), pausedFrame, 'Play resumes the cartoon');

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
      assert.equal(await frame(), offscreenFrame, 'An offscreen cartoon stops advancing');

      await garden.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('.contribution-garden')?.dataset.running === 'true');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForFunction(() => document.querySelector('.contribution-garden')?.dataset.running === 'false');
      const reducedFrame = await frame();
      const reducedAppearance = await appearance();
      await page.clock.runFor(960);
      assert.equal(await frame(), reducedFrame, 'Reduced motion presents a still cartoon');
      assert.deepEqual(await appearance(), reducedAppearance, 'Reduced motion also freezes the actual pixels');
      await context.close();
    });
  }

  for (const width of [390, 1440]) {
    await check(`Every cartoon chapter plays through a complete 25+ second loop at ${width}px`, async () => {
      const context = await browser.newContext({ viewport: { width, height: 960 }, reducedMotion: 'no-preference' });
      try {
        const page = await context.newPage();
        watch(page);
        await page.clock.install({ time: new Date('2026-10-16T12:00:00Z') });
        await page.goto(`${base}/about.html`, { waitUntil: 'networkidle' });
        const garden = page.locator('.contribution-garden');
        const grid = garden.locator('.cg-grid');
        await garden.scrollIntoViewIfNeeded();
        await page.waitForFunction(() => document.querySelector('.contribution-garden')?.dataset.running === 'true');
        // Freeze after layout and intersection observers settle. runFor executes
        // every interval; fastForward would skip most of this little film.
        await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
        const columns = width <= 700 ? MOBILE_COLUMNS : DESKTOP_COLUMNS;
        const duration = Number(await grid.getAttribute('data-duration-ms'));
        const frameMs = Number(await grid.getAttribute('data-frame-ms'));
        assert.equal(duration, CARTOON_FRAME_COUNT * FRAME_MS);
        assert.equal(frameMs, FRAME_MS);
        assert.ok(duration >= 25_000, 'The actual browser film lasts at least 25 seconds');
        assert.ok(CARTOON_SCENES.length >= 4, 'The film contains several distinct chapters');
        assert.equal(CARTOON_SCENES[0].start, 0);
        assert.equal(CARTOON_SCENES.at(-1).end, CARTOON_FRAME_COUNT);
        for (let index = 1; index < CARTOON_SCENES.length; index++) {
          assert.equal(CARTOON_SCENES[index].start, CARTOON_SCENES[index - 1].end, 'Chapters cover the timeline without gaps');
        }

        const snapshot = () => grid.evaluate(el => ({
          frame: Number(el.dataset.frame),
          scene: el.dataset.cartoonScene,
          pixels: Array.from(el.children, cell => Number(cell.className.match(/cg-level-(\d)/)?.[1])),
          colours: Array.from(el.children, cell => getComputedStyle(cell).backgroundColor).join('|'),
          geometry: {
            width: el.clientWidth, height: el.clientHeight,
            cells: Array.from(el.children, cell => [cell.offsetLeft, cell.offsetTop, cell.offsetWidth, cell.offsetHeight]),
          },
        }));
        const initial = await snapshot();
        await grid.evaluate(el => {
          window.__qaCartoonFrames = [];
          window.__qaCartoonCells = Array.from(el.children);
          let lastFrame = Number(el.dataset.frame);
          window.__qaCartoonObserver = new MutationObserver(() => {
            const frame = Number(el.dataset.frame);
            if (frame === lastFrame) return; // A pause may repaint the same frame.
            lastFrame = frame;
            window.__qaCartoonFrames.push({
              frame,
              scene: el.dataset.cartoonScene,
              pixels: Array.from(el.children, cell => cell.className.match(/cg-level-(\d)/)?.[1]).join(''),
            });
          });
          window.__qaCartoonObserver.observe(el, { attributes: true, attributeFilter: ['data-frame'] });
        });
        const assertRendered = (state, expectedFrame, expectedScene) => {
          assert.equal(state.frame, expectedFrame, 'Playback reaches the expected frame without skipped intervals');
          assert.equal(state.scene, expectedScene, 'The rendered frame belongs to the advertised chapter');
          assert.deepEqual(state.pixels, Array.from(makeCartoonFrame(expectedFrame, columns)), 'Actual browser cells match the complete cartoon artwork');
          assert.ok(state.pixels.filter(level => level >= 2).length >= 12, 'The chapter has a visible foreground illustration');
          assert.deepEqual(state.geometry, initial.geometry, 'The chapter preserves every grid cell position and size');
        };
        // Visit midpoint poses in playback order, starting from whatever frame
        // was visible when the clock stopped; this runs exactly one full loop.
        const checkpoints = CARTOON_SCENES.map(scene => {
          const frame = Math.floor((scene.start + scene.end - 1) / 2);
          return { scene, frame, offset: (frame - initial.frame + CARTOON_FRAME_COUNT) % CARTOON_FRAME_COUNT };
        }).sort((a, b) => a.offset - b.offset);
        let elapsedFrames = 0;
        const chapterColours = new Set();
        for (const checkpoint of checkpoints) {
          await page.clock.runFor((checkpoint.offset - elapsedFrames) * frameMs);
          elapsedFrames = checkpoint.offset;
          const state = await snapshot();
          assertRendered(state, checkpoint.frame, checkpoint.scene.id);
          chapterColours.add(state.colours);

          if (checkpoint.scene === CARTOON_SCENES.at(-1)) {
            await page.getByRole('button', { name: 'Pause pixel animation', exact: true }).click();
            assert.equal(await garden.getAttribute('data-running'), 'false');
            await page.clock.runFor(1200);
            const paused = await snapshot();
            assert.equal(paused.frame, state.frame, 'Pausing late in the story preserves its position');
            assert.equal(paused.colours, state.colours, 'The late chapter remains visually frozen');
            await page.getByRole('button', { name: 'Play pixel animation', exact: true }).click();
            assert.equal(await garden.getAttribute('data-running'), 'true');
            assert.equal((await snapshot()).frame, state.frame, 'Resuming does not restart the story');
          }
        }
        assert.equal(chapterColours.size, CARTOON_SCENES.length, 'Every chapter has a distinct rendered colour arrangement');
        await page.clock.runFor((CARTOON_FRAME_COUNT - elapsedFrames) * frameMs);
        const wrapped = await snapshot();
        assert.equal(wrapped.frame, initial.frame, 'One complete duration returns to the same frame');
        assert.equal(wrapped.colours, initial.colours, 'The complete loop returns to the same artwork');
        assert.deepEqual(wrapped.geometry, initial.geometry);
        const recorded = await page.evaluate(() => window.__qaCartoonFrames);
        assert.equal(recorded.length, CARTOON_FRAME_COUNT, 'The browser paints every frame during one full loop');
        for (const [index, rendered] of recorded.entries()) {
          const expectedFrame = (initial.frame + index + 1) % CARTOON_FRAME_COUNT;
          assert.equal(rendered.frame, expectedFrame, 'No cartoon frame is skipped or repeated');
          assert.equal(rendered.scene, CARTOON_SCENES.find(scene => expectedFrame >= scene.start && expectedFrame < scene.end).id);
          assert.equal(rendered.pixels, Array.from(makeCartoonFrame(expectedFrame, columns)).join(''), `Frame ${expectedFrame} paints every intended pixel`);
          assert.ok((rendered.pixels.match(/[2-4]/g) || []).length >= 12, `Frame ${expectedFrame} never becomes an empty illustration`);
        }
        await page.clock.runFor(frameMs * 3);
        assert.equal((await snapshot()).frame, (initial.frame + 3) % CARTOON_FRAME_COUNT, 'Playback continues after wrapping');
        assert.ok(await grid.evaluate(el => Array.from(el.children).every((cell, index) => cell === window.__qaCartoonCells[index])), 'All chapters reuse the original grid cells');
        await page.evaluate(() => window.__qaCartoonObserver.disconnect());
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
