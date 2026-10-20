import assert from 'node:assert/strict';
import { test } from 'node:test';

const originalFetch = globalThis.fetch;
const originalMatchMedia = globalThis.matchMedia;
const originalNow = Date.now;
let instance = 0;
const client = () => import(`../src/chat-client.js?test=${++instance}`);
const messages = [{ role: 'user', content: 'What services does HICH offer?' }];
const aiResponse = () => new Response('data: {"type":"mode","mode":"ai"}\n\ndata: {"type":"delta","text":"A tailored recommendation for your website."}\n\ndata: {"type":"done"}\n\n', {
  headers: { 'Content-Type': 'text/event-stream' },
});
const run = async (api, options = {}) => {
  const events = [];
  await api.streamAssistantReply({ messages, onEvent: event => events.push(event), ...options });
  return events;
};

// The reveal animation is separately tested; make these transport checks instant.
globalThis.matchMedia = () => ({ matches: true });
try {
  await test('Ordinary relevant questions use AI before local knowledge', async () => {
    let calls = 0;
    globalThis.fetch = async () => { calls++; return aiResponse(); };
    const events = await run(await client());
    assert.equal(calls, 1);
    assert.equal(events.find(event => event.type === 'mode').mode, 'ai');
  });
  await test('Quota cooldown shares fallback across chats and retries after recovery', async () => {
    let calls = 0, time = 100000;
    Date.now = () => time;
    globalThis.fetch = async () => ++calls === 1
      ? Response.json({ mode: 'guide', reason: 'ai_quota', retryAfterSeconds: 60 })
      : aiResponse();
    const api = await client();
    for (let i = 0; i < 2; i++) {
      const events = await run(api);
      assert.equal(events.find(event => event.type === 'mode').mode, 'guide');
      assert.ok(events.find(event => event.type === 'delta').text.length > 30);
    }
    assert.equal(calls, 1);
    time += 60001;
    assert.equal((await run(api)).find(event => event.type === 'mode').mode, 'ai');
    assert.equal(calls, 2);
    Date.now = originalNow;
  });
  await test('Missing endpoints, invalid JSON, empty streams and network failure use local answers', async () => {
    for (const fetchImpl of [
      async () => new Response('not found', { status: 404 }),
      async () => new Response('<html>static site</html>', { headers: { 'Content-Type': 'text/html' } }),
      async () => new Response('{broken', { headers: { 'Content-Type': 'application/json' } }),
      async () => new Response('', { headers: { 'Content-Type': 'text/event-stream' } }),
      async () => { throw new TypeError('Network error'); },
    ]) {
      globalThis.fetch = fetchImpl;
      const events = await run(await client());
      assert.equal(events.findLast(event => event.type === 'mode').mode, 'guide');
      assert.equal(events.at(-1).type, 'done');
    }
  });
  await test('Token-limited fallback does not suppress the next different question', async () => {
    let calls = 0;
    globalThis.fetch = async () => ++calls === 1 ? Response.json({ mode: 'guide', reason: 'answer_limit' }) : aiResponse();
    const api = await client();
    await run(api);
    assert.equal((await run(api)).find(event => event.type === 'mode').mode, 'ai');
  });
  await test('Stopping a request never inserts a fallback answer', async () => {
    const controller = new AbortController();
    globalThis.fetch = async () => { controller.abort(); throw new DOMException('Stopped', 'AbortError'); };
    await assert.rejects(run(await client(), { signal: controller.signal }), { name: 'AbortError' });
  });
  await test('An interrupted partial AI answer is not mixed with a second local answer', async () => {
    globalThis.fetch = async () => new Response('data: {"type":"delta","text":"Partial AI answer"}\n\n', { headers: { 'Content-Type': 'text/event-stream' } });
    await assert.rejects(run(await client()), /before it was complete/);
  });
} finally {
  globalThis.fetch = originalFetch;
  globalThis.matchMedia = originalMatchMedia;
  Date.now = originalNow;
}
