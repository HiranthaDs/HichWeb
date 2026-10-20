import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

// Real retrieval is exercised first. A deterministic streaming fixture then tests
// response rendering, cancellation and retry without needing provider credentials.
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4185';
const checkFilter = process.env.QA_CHAT_FILTER ? new RegExp(process.env.QA_CHAT_FILTER, 'i') : null;
const results = [], errors = [];
const bannedLabels = ['Code & ownership', 'Signing & payments', 'Changes & support', 'SEO & results', 'Scope & delivery'];
const chatFor = (page, mode) => page.locator(`[data-assistant="${mode}"]`);
const messageFor = chat => chat.locator('[data-message-role="assistant"]').last();
let browser, server;

async function check(name, task) {
  if (checkFilter && !checkFilter.test(name)) return;
  try { await task(); results.push({ name, passed: true }); console.log(`PASS ${name}`); }
  catch (error) { results.push({ name, passed: false, message: error.message }); console.error(`FAIL ${name}: ${error.message}`); }
}

async function contextFor(width = 1440, height = 1000, reducedMotion = 'reduce') {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`${page.url()}: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error' && /hydration|hydrating|React error|unique.*key/i.test(message.text())) errors.push(`${page.url()}: ${message.text()}`);
  });
  page.setDefaultTimeout(10000);
  return { context, page };
}

async function send(chat, question) {
  await chat.getByRole('textbox', { name: 'Your message' }).fill(question);
  await chat.getByRole('button', { name: 'Send message', exact: true }).click();
}

async function settled(chat, pattern) {
  if (pattern) await messageFor(chat).filter({ hasText: pattern }).waitFor();
  await chat.getByRole('button', { name: 'Stop response', exact: true }).waitFor({ state: 'hidden', timeout: 20000 });
  assert.ok((await messageFor(chat).innerText()).trim().length > 35, 'Reply contains a useful answer');
}

async function checkLayout(page, chat) {
  const layout = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
  assert.ok(layout.content <= layout.viewport + 2, `Horizontal page overflow: ${layout.content} > ${layout.viewport}`);
  const box = await chat.boundingBox();
  assert.ok(box && box.width > 200 && box.x >= -1 && box.x + box.width <= layout.viewport + 2, 'Chat fits the viewport');
  const input = await chat.getByRole('textbox', { name: 'Your message' }).boundingBox();
  assert.ok(input.width > 120, 'Composer remains usable on a narrow viewport');
}

async function checkContacts(reply, expected) {
  const cards = reply.locator('.assistant-chat-contact-card');
  const actual = await cards.evaluateAll(links => links.map(link => link.dataset.contactAction).sort());
  assert.deepEqual(actual, [...expected].sort(), 'Only the requested contact actions are offered');
  const hrefs = { whatsapp: 'https://wa.me/94714112113', call: 'tel:+94714112113', email: 'mailto:info@hichweb.com' };
  for (const action of expected) {
    const card = reply.locator(`.assistant-chat-contact-card[data-contact-action="${action}"]`);
    assert.ok(await card.locator('svg[aria-hidden="true"]').count() > 0, `${action} has a decorative SVG icon`);
    assert.equal(await card.getAttribute('href'), hrefs[action], `${action} opens the correct destination`);
    const label = await card.innerText();
    assert.ok(action === 'email' ? label.includes('info@hichweb.com') : label.replace(/\D/g, '').includes('94714112113'), `${action} displays the contact detail`);
  }
}

async function fixture(page, { delay = 40, text = '## A clear starting point\n\n**Start with your customer journey.**\n\n- Map the product catalogue.\n- Connect checkout and fulfilment.\n\nRead the [commerce service](/ecommerce-solutions.html) for details.', failFirst = false, burst = false, actions = [] } = {}) {
  await page.addInitScript(({ delay, text, failFirst, burst, actions }) => {
    const realFetch = window.fetch.bind(window);
    window.__chatRequests = [];
    window.__chatStreamsFinished = 0;
    window.fetch = async (input, init = {}) => {
      const url = typeof input === 'string' ? input : input?.url;
      if (!url || !new URL(url, location.href).pathname.endsWith('/api/chat')) return realFetch(input, init);
      const payload = JSON.parse(init.body);
      window.__chatRequests.push(payload);
      if (failFirst && window.__chatRequests.length === 1) return new Response(JSON.stringify({ error: 'The assistant is temporarily unavailable. Please try again.' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
      const encoder = new TextEncoder();
      const chunks = text.match(/[\s\S]{1,20}/g) || [];
      let timer, closed = false;
      const body = new ReadableStream({
        start(controller) {
          const push = event => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          push({ type: 'mode', mode: 'ai' });
          if (actions.length) push({ type: 'actions', actions });
          const finish = () => {
            push({ type: 'sources', sources: [{ title: 'Commerce service', href: '/ecommerce-solutions.html' }] });
            push({ type: 'done' }); closed = true; controller.close();
            window.__chatStreamsFinished += 1;
          };
          if (burst) { push({ type: 'delta', text }); finish(); return; }
          let index = 0;
          const tick = () => {
            if (closed) return;
            if (index < chunks.length) { push({ type: 'delta', text: chunks[index++] }); timer = setTimeout(tick, delay); }
            else finish();
          };
          timer = setTimeout(tick, delay);
          init.signal?.addEventListener('abort', () => {
            if (closed) return;
            closed = true; clearTimeout(timer); controller.error(new DOMException('Aborted', 'AbortError'));
          }, { once: true });
        },
        cancel() { closed = true; clearTimeout(timer); },
      });
      return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } });
    };
  }, { delay, text, failFirst, burst, actions });
}

try {
  await mkdir('qa', { recursive: true });
  if (!process.env.QA_BASE_URL) {
    server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', '4185', '--strictPort'], { stdio: 'ignore', windowsHide: true });
    server.on('error', error => errors.push(error.message));
  }
  for (let attempt = 0; attempt < 80; attempt++) {
    try { if ((await fetch(base)).ok) break; } catch { /* Wait for the test server. */ }
    if (attempt === 79) throw new Error('Chat QA server did not start.');
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  browser = await chromium.launch({ channel: process.env.QA_BROWSER || 'chrome', headless: true });

  for (const width of [1440, 390, 320]) {
    const { context, page } = await contextFor(width);
    // Force the real client retrieval path, even when a developer has a model key.
    await page.route('**/api/chat', route => route.fulfill({ json: { mode: 'guide' } }));
    await check(`${width}px home assistant answers, remembers context and shows sources`, async () => {
      await page.goto(`${base}/`, { waitUntil: 'networkidle' });
      const chat = chatFor(page, 'site');
      await chat.scrollIntoViewIfNeeded();
      await checkLayout(page, chat);
      await send(chat, 'I need an online store with checkout and inventory. What can HICH build?');
      await settled(chat, /store|commerce|checkout/i);
      assert.ok(await messageFor(chat).locator('.assistant-chat-sources a').count() > 0, 'Answer cites a website source');
      await send(chat, 'What about the cost?');
      await settled(chat, /cost|price|budget|scope|quote/i);
      assert.match(await messageFor(chat).innerText(), /store|commerce|checkout|catalogue|product/i, 'Follow-up retains the store context');
      await send(chat, 'And how long would that take?');
      await settled(chat, /timing|delivery|scope|launch/i);
      assert.match(await messageFor(chat).innerText(), /store|commerce|checkout|catalogue|product/i, 'A second follow-up retains the original store context');
      assert.equal(await chat.locator('[data-message-role="user"]').count(), 3);
      await checkLayout(page, chat);
      await chat.screenshot({ path: `qa/chat-site-${width}.png` });
    });
    await check(`${width}px contact requests show the right icon, number and action`, async () => {
      await page.goto(`${base}/`, { waitUntil: 'networkidle' });
      const chat = chatFor(page, 'site');
      await chat.getByRole('button', { name: 'New chat', exact: true }).click();
      for (const [question, actions] of [
        ['What is your WhatsApp number?', ['whatsapp']],
        ['What phone number can I call?', ['call']],
        ['Show me your WhatsApp number and phone number so I can call you.', ['whatsapp', 'call']],
      ]) {
        await send(chat, question);
        await settled(chat);
        await checkContacts(messageFor(chat), actions);
        await checkLayout(page, chat);
      }
      const cards = messageFor(chat).locator('.assistant-chat-contact-card');
      for (const card of await cards.all()) {
        const box = await card.boundingBox();
        const replyBox = await messageFor(chat).boundingBox();
        assert.ok(box.width > 160 && box.x >= replyBox.x - 1 && box.x + box.width <= replyBox.x + replyBox.width + 1, 'Contact card fits inside the reply');
      }
      await chat.screenshot({ path: `qa/chat-contacts-${width}.png` });
      const axe = await new AxeBuilder({ page }).include('[data-assistant="site"]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.deepEqual(axe.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), [], 'Contact cards are accessible');
    });
    await check(`${width}px terms assistant removes category labels and answers a question`, async () => {
      await page.goto(`${base}/terms-and-conditions.html`, { waitUntil: 'networkidle' });
      const chat = chatFor(page, 'terms');
      await chat.scrollIntoViewIfNeeded();
      for (const label of bannedLabels) assert.equal(await page.getByText(label, { exact: true }).count(), 0, `Removed ${label}`);
      await send(chat, 'Can another developer change my website after launch?');
      await settled(chat, /change|developer|modif|support/i);
      assert.ok(await messageFor(chat).locator('.assistant-chat-sources a').count() > 0, 'Terms answer cites a relevant clause');
      for (const href of await messageFor(chat).locator('.assistant-chat-sources a').evaluateAll(links => links.map(link => link.getAttribute('href')))) {
        const hash = new URL(href, page.url()).hash;
        if (hash) assert.equal(await page.locator(`[id="${decodeURIComponent(hash.slice(1))}"]`).count(), 1, `Source ${hash} exists`);
      }
      await checkLayout(page, chat);
      await chat.screenshot({ path: `qa/chat-terms-${width}.png` });
      const axe = await new AxeBuilder({ page }).include('[data-assistant="terms"]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.deepEqual(axe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, reason: n.failureSummary })) })), [], 'Terms chat accessibility');
    });
    await context.close();
  }

  await check('Company answers confirm registration and do not invent a registration number', async () => {
    const { context, page } = await contextFor();
    try {
      await page.route('**/api/chat', route => route.fulfill({ json: { mode: 'guide' } }));
      await page.goto(base, { waitUntil: 'networkidle' });
      const chat = chatFor(page, 'site');
      await send(chat, 'What is your name?');
      await settled(chat, /Chathu/);
      assert.match(await messageFor(chat).innerText(), /HICH.s website assistant/i);
      assert.equal(await messageFor(chat).locator('.assistant-chat-contact-card').count(), 0, 'An identity question does not create a phone action');
      await send(chat, 'Is HICH a registered company?');
      await settled(chat, /registered/i);
      assert.match(await messageFor(chat).innerText(), /(?:is|are|yes|HICH).{0,60}registered/i, 'The supplied company registration fact is used');
      await send(chat, 'What is your company registration number?');
      await settled(chat, /registration/i);
      const answer = await messageFor(chat).innerText();
      assert.match(answer, /not.{0,50}(?:provid|publish|availab|list|suppli)|don.t have|hasn.t|request|ask.{0,40}team/i, 'Missing legal details are acknowledged or referred to the team');
      assert.doesNotMatch(answer, /(?:registration|company|BR|PV)\s*(?:number|no[.:]?|#)\s*[:\-]?\s*[A-Z]{0,4}[\-/ ]?\d{3,}/i, 'No invented legal registration identifier');
    } finally { await context.close(); }
  });

  await check('Starting a project returns the complete brief and HICH workflow without AI', async () => {
    const { context, page } = await contextFor();
    try {
      let networkRequests = 0;
      await page.route('**/api/chat', route => { networkRequests += 1; return route.fulfill({ json: { mode: 'guide' } }); });
      await page.goto(base, { waitUntil: 'networkidle' });
      const chat = chatFor(page, 'site');
      await send(chat, 'How do I start a project?');
      await settled(chat, /Discover.*Design.*Develop.*Launch & evolve/is);
      const answer = await messageFor(chat).innerText();
      for (const expected of ['business and audience', 'essential features', 'target launch date', 'budget range', 'stays in your browser']) assert.match(answer, new RegExp(expected, 'i'));
      assert.equal((await messageFor(chat).locator('.assistant-chat-sources a').evaluateAll(links => links.map(link => link.getAttribute('href')))).join(','), '/contact.html,/process.html');
      assert.match(await messageFor(chat).locator('.assistant-chat-answer-mode').innerText(), /HICH knowledge/i);
      assert.equal(networkRequests, 0, 'Known HICH questions are answered without Netlify or Gemini');
    } finally { await context.close(); }
  });

  await check('A burst response is paced after streaming completes and finishes with usable actions', async () => {
    const { context, page } = await contextFor(1440, 1000, 'no-preference');
    const text = 'A thoughtful website plan starts with your goals, audience, and the way customers reach you. '.repeat(14) + 'Your complete project plan is ready. 👋 ශ්‍රී ලංකා — HICH.';
    try {
      await fixture(page, { burst: true, text, actions: [{ id: 'whatsapp', href: 'https://attacker.example', label: 'fake', value: '123' }, { id: 'call' }] });
      await page.goto(base, { waitUntil: 'networkidle' });
      const chat = chatFor(page, 'site');
      await send(chat, 'Help me plan my next website.');
      await page.waitForFunction(() => window.__chatStreamsFinished === 1);
      await chat.locator('.assistant-chat-stream-cursor').waitFor();
      assert.equal(await chat.getAttribute('data-generating'), 'true', 'The assistant stays busy while text is being revealed');
      const partial = await messageFor(chat).locator('.assistant-chat-markdown').innerText();
      assert.ok(partial.length > 0 && partial.length < text.length, 'A network burst is revealed progressively');
      assert.equal(await messageFor(chat).locator('.assistant-chat-contact-card').count(), 0, 'Contact actions wait for the answer to finish');
      await chat.screenshot({ path: 'qa/chat-streaming-desktop.png' });
      await settled(chat, /Your complete project plan is ready\./);
      assert.equal(await messageFor(chat).locator('.assistant-chat-markdown').innerText(), text, 'Animation preserves the complete response, emoji and Sinhala text');
      assert.notEqual(await chat.getAttribute('data-generating'), 'true');
      assert.equal(await chat.locator('.assistant-chat-stream-cursor').count(), 0, 'The generation cursor clears on completion');
      assert.equal(await messageFor(chat).getByRole('button', { name: 'Copy response', exact: true }).count(), 1);
      await checkContacts(messageFor(chat), ['whatsapp', 'call']);
      assert.equal(await chat.locator('a[href*="attacker.example"]').count(), 0, 'Streamed action metadata cannot replace trusted contact destinations');
    } finally { await context.close(); }
  });

  await check('Stop and new chat cancel queued animation without late messages', async () => {
    const { context, page } = await contextFor(390, 780, 'no-preference');
    try {
      await fixture(page, { burst: true, text: 'A practical website starts with your audience and a clear next step. '.repeat(24), actions: [{ id: 'whatsapp' }, { id: 'call' }] });
      await page.goto(base, { waitUntil: 'networkidle' });
      const chat = chatFor(page, 'site');
      await send(chat, 'Plan my website.');
      await page.waitForFunction(() => window.__chatStreamsFinished === 1);
      await chat.locator('.assistant-chat-stream-cursor').waitFor();
      assert.equal(await messageFor(chat).locator('.assistant-chat-contact-card').count(), 0, 'Pending action cards stay hidden during animation');
      await chat.getByRole('button', { name: 'Stop response', exact: true }).click();
      const stopped = await messageFor(chat).innerText();
      await page.waitForTimeout(450);
      assert.equal(await messageFor(chat).innerText(), stopped, 'Queued characters do not appear after Stop');
      assert.notEqual(await chat.getAttribute('data-generating'), 'true');
      assert.equal(await messageFor(chat).locator('.assistant-chat-contact-card').count(), 0, 'Stopping does not reveal queued action cards');
      await send(chat, 'Make a fresh plan.');
      await page.waitForFunction(() => window.__chatStreamsFinished === 2);
      await chat.locator('.assistant-chat-stream-cursor').waitFor();
      await chat.getByRole('button', { name: 'New chat', exact: true }).click();
      await page.waitForTimeout(450);
      assert.equal(await chat.locator('[data-message-role]').count(), 0, 'New chat discards the queue and the prior conversation');
      assert.notEqual(await chat.getAttribute('data-generating'), 'true');
      await send(chat, 'A third conversation.');
      await chat.getByRole('button', { name: 'Stop response', exact: true }).waitFor();
      assert.equal(await chat.locator('[data-message-role="user"]').count(), 1, 'A new request works after the animation is cancelled');
      await chat.getByRole('button', { name: 'Stop response', exact: true }).click();
    } finally { await context.close(); }
  });

  await check('Reduced motion displays a completed network burst without typewriter pacing', async () => {
    const { context, page } = await contextFor();
    const text = 'Start with the people who will use your website and the task they need to complete. '.repeat(18);
    try {
      await fixture(page, { burst: true, text });
      await page.goto(base, { waitUntil: 'networkidle' });
      const chat = chatFor(page, 'site');
      await send(chat, 'Give me a website plan.');
      await page.waitForFunction(() => window.__chatStreamsFinished === 1);
      await chat.getByRole('button', { name: 'Stop response', exact: true }).waitFor({ state: 'hidden', timeout: 1500 });
      assert.equal((await messageFor(chat).locator('.assistant-chat-markdown').innerText()).trim(), text.trim(), 'Reduced motion receives the entire response immediately');
      assert.notEqual(await chat.getAttribute('data-generating'), 'true');
    } finally { await context.close(); }
  });

  await check('Enter sends, Shift+Enter adds a line, streamed results render Markdown and copy', async () => {
    const { context, page } = await contextFor();
    try {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await fixture(page);
      await page.goto(base, { waitUntil: 'networkidle' });
      const chat = chatFor(page, 'site');
      const input = chat.getByRole('textbox', { name: 'Your message' });
      await input.fill('Plan an online store.');
      await input.press('Shift+Enter');
      await input.press('End');
      await input.type('Include delivery.');
      assert.match(await input.inputValue(), /\n/);
      assert.equal(await chat.locator('[data-message-role="user"]').count(), 0, 'Shift+Enter does not send');
      await input.press('Enter');
      await chat.getByRole('button', { name: 'Stop response', exact: true }).waitFor();
      assert.equal(await input.inputValue(), '', 'Sending clears the composer');
      await settled(chat, /fulfilment/);
      const reply = messageFor(chat);
      assert.ok(await reply.getByRole('heading', { name: 'A clear starting point' }).count() > 0, 'Markdown heading is semantic');
      assert.ok(await reply.locator('strong').count() > 0, 'Markdown bold is rendered');
      assert.equal(await reply.getByRole('listitem').count(), 2, 'Markdown bullets are rendered');
      assert.equal(await reply.getByRole('link', { name: 'commerce service', exact: true }).getAttribute('href'), '/ecommerce-solutions.html');
      await reply.getByRole('button', { name: 'Copy response', exact: true }).click();
      assert.match(await page.evaluate(() => navigator.clipboard.readText()), /customer journey/);
      const requests = await page.evaluate(() => window.__chatRequests);
      assert.equal(requests[0].mode, 'site');
      assert.match(requests[0].messages.at(-1).content, /Include delivery/);
      const axe = await new AxeBuilder({ page }).include('[data-assistant="site"]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.deepEqual(axe.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), [], 'Formatted site chat accessibility');
    } finally { await context.close(); }
  });

  await check('Stop freezes partial output; new chat clears history and allows another request', async () => {
    const { context, page } = await contextFor();
    try {
      await fixture(page, { delay: 100, text: 'A practical plan starts with your products and the people buying them. '.repeat(16) });
      await page.goto(base, { waitUntil: 'networkidle' });
      const chat = chatFor(page, 'site');
      await send(chat, 'Help me plan my store');
      await messageFor(chat).filter({ hasText: /A practical plan/ }).waitFor();
      await chat.getByRole('button', { name: 'Stop response', exact: true }).click();
      const stopped = await messageFor(chat).innerText();
      await page.waitForTimeout(350);
      assert.equal(await messageFor(chat).innerText(), stopped, 'No late chunks after cancellation');
      assert.ok(stopped.length < 500, 'Stopping keeps only the partial reply');
      await chat.getByRole('button', { name: 'New chat', exact: true }).click();
      assert.equal(await chat.locator('[data-message-role="user"]').count(), 0, 'New chat removes prior questions');
      await send(chat, 'Help me plan an ecommerce store and inventory automation for a clothing business.');
      await chat.getByRole('button', { name: 'Stop response', exact: true }).waitFor();
      assert.equal(await chat.locator('[data-message-role="user"]').count(), 1);
      await chat.getByRole('button', { name: 'Stop response', exact: true }).click();
    } finally { await context.close(); }
  });

  await check('Provider errors fall back to HICH knowledge and regeneration can try Gemini again', async () => {
    const { context, page } = await contextFor();
    try {
      await fixture(page, { failFirst: true });
      await page.goto(base, { waitUntil: 'networkidle' });
      const chat = chatFor(page, 'site');
      await send(chat, 'How should I start my online store?');
      await settled(chat, /commerce|online store|products|catalogue/i);
      assert.equal(await chat.getByRole('button', { name: 'Retry response', exact: true }).count(), 0, 'Provider failure does not leave Chathu unusable');
      assert.match(await messageFor(chat).locator('.assistant-chat-answer-mode').innerText(), /HICH knowledge/i);
      assert.equal(await chat.locator('[data-message-role="user"]').count(), 1);
      assert.equal(await page.evaluate(() => window.__chatRequests.length), 1);
      await chat.getByRole('button', { name: 'Regenerate response', exact: true }).click();
      await settled(chat, /fulfilment/);
      assert.equal(await chat.locator('[data-message-role="user"]').count(), 1);
      assert.equal(await page.evaluate(() => window.__chatRequests.length), 2);
      assert.match(await messageFor(chat).locator('.assistant-chat-answer-mode').innerText(), /Gemini \+ HICH/i);
    } finally { await context.close(); }
  });

  await check('Site chat persists across pages and modal close/reopen while terms stay separate', async () => {
    const { context, page } = await contextFor(390, 780);
    try {
      await page.route('**/api/chat', route => route.fulfill({ json: { mode: 'guide' } }));
      await page.goto(base, { waitUntil: 'networkidle' });
      await send(chatFor(page, 'site'), 'Tell me about HICH and where you work');
      await settled(chatFor(page, 'site'), /Sri Lanka|HICH/i);
      await send(chatFor(page, 'site'), 'Show me your WhatsApp number and phone number so I can call you.');
      await settled(chatFor(page, 'site'));
      await checkContacts(messageFor(chatFor(page, 'site')), ['whatsapp', 'call']);
      await page.goto(`${base}/services.html`, { waitUntil: 'networkidle' });
      const trigger = page.getByRole('button', { name: 'Open Chathu', exact: true });
      await trigger.click();
      await page.locator('.site-chat-dialog[open]').waitFor();
      const chat = chatFor(page, 'site');
      assert.match(await chat.innerText(), /Tell me about HICH and where you work/);
      await checkContacts(messageFor(chat), ['whatsapp', 'call']);
      await checkLayout(page, chat);
      assert.equal(await chat.getByRole('textbox', { name: 'Your message' }).evaluate(el => el === document.activeElement), true, 'Opening focuses the composer');
      await page.keyboard.press('Escape');
      await page.locator('.site-chat-dialog[open]').waitFor({ state: 'hidden' });
      assert.equal(await trigger.evaluate(el => el === document.activeElement), true, 'Escape restores launcher focus');
      await trigger.click();
      assert.match(await chat.innerText(), /Tell me about HICH and where you work/);
      await checkContacts(messageFor(chat), ['whatsapp', 'call']);
      await chat.getByRole('button', { name: 'Close assistant', exact: true }).click();
      await page.goto(`${base}/terms-and-conditions.html`, { waitUntil: 'networkidle' });
      assert.equal(await chatFor(page, 'terms').locator('[data-message-role="user"]').count(), 0, 'Terms thread is independent');
      await page.getByRole('button', { name: 'Open Chathu', exact: true }).click();
      assert.match(await chatFor(page, 'site').innerText(), /Tell me about HICH and where you work/);
      await checkContacts(messageFor(chatFor(page, 'site')), ['whatsapp', 'call']);
      await page.locator('.site-chat-dialog').screenshot({ path: 'qa/chat-mobile-dialog.png' });
    } finally { await context.close(); }
  });

  await check('Unavailable browser storage does not block either assistant', async () => {
    const { context, page } = await contextFor();
    try {
      await page.addInitScript(() => {
        Storage.prototype.setItem = () => { throw new DOMException('Unavailable', 'SecurityError'); };
        Storage.prototype.getItem = () => { throw new DOMException('Unavailable', 'SecurityError'); };
        Storage.prototype.removeItem = () => { throw new DOMException('Unavailable', 'SecurityError'); };
      });
      await page.route('**/api/chat', route => route.fulfill({ json: { mode: 'guide' } }));
      for (const [path, mode, question] of [['/', 'site', 'How can I contact HICH?'], ['/terms-and-conditions.html', 'terms', 'Who owns my source code?']]) {
        await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
        await send(chatFor(page, mode), question);
        await settled(chatFor(page, mode));
      }
    } finally { await context.close(); }
  });

  await check('No uncaught JavaScript errors or hydration failures', async () => assert.deepEqual([...new Set(errors)], []));
} catch (error) {
  results.push({ name: 'Chat QA setup', passed: false, message: error.stack || error.message });
  console.error(error);
} finally {
  await browser?.close();
  server?.kill();
  await writeFile('qa/chat-report.json', `${JSON.stringify({ base, results, errors }, null, 2)}\n`);
  const failed = results.filter(result => !result.passed);
  console.log(`${results.length - failed.length} chat checks passed; ${failed.length} failed.`);
  if (failed.length) process.exitCode = 1;
}
