import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createChatRuntime, handleChatRequest } from '../server/chat.js';

const origin = 'https://hichweb.com';
const payload = (content = 'What services does HICH offer?') => ({ mode: 'site', messages: [{ role: 'user', content }] });
const request = (body = payload()) => new Request(`${origin}/api/chat`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body),
});
const success = (text = 'Start with a focused website and a clear customer journey.') => Response.json({
  candidates: [{ finishReason: 'STOP', content: { parts: [{ text }] } }],
});
const invoke = (options = {}, body) => handleChatRequest(request(body), {
  env: { GEMINI_API_KEY: 'test-key' }, runtime: createChatRuntime(), fetchImpl: async () => success(), ...options,
});
const events = async response => (await response.text()).split('\n\n').filter(Boolean).map(line => JSON.parse(line.slice(6)));

test('Health reports configuration without making a billable request', async () => {
  for (const env of [{}, { GEMINI_API_KEY: 'test-key' }]) {
    const response = await handleChatRequest(new Request(`${origin}/api/chat`), {
      env, fetchImpl: () => assert.fail('Health must not call Gemini'),
    });
    assert.equal((await response.json()).mode, env.GEMINI_API_KEY ? 'hybrid' : 'guide');
  }
});

test('Missing credentials and greetings use the local guide', async () => {
  const fetchImpl = () => assert.fail('Local answer must not call Gemini');
  assert.deepEqual(await (await invoke({ env: {}, fetchImpl })).json(), { mode: 'guide', reason: 'not_configured' });
  const greeting = await invoke({ fetchImpl }, payload('Hello'));
  assert.equal((await greeting.json()).mode, 'guide');
});

test('Simple company questions use grounded AI and keep canonical contacts', async () => {
  let calls = 0, sent, url;
  const response = await invoke({ fetchImpl: async (target, init) => {
    calls++;
    url = target;
    sent = JSON.parse(init.body);
    assert.equal(init.headers['x-goog-api-key'], 'test-key');
    return success('You can reach HICH on WhatsApp.');
  } }, payload('What is your WhatsApp number?'));
  const stream = await events(response);
  assert.equal(calls, 1);
  assert.match(url, /models\/gemini-3\.5-flash-lite:generateContent$/);
  assert.equal(stream[0].mode, 'ai');
  assert.equal(stream.at(-1).type, 'done');
  assert.equal(stream.find(event => event.type === 'actions').actions[0].href, 'https://wa.me/94714112113');
  assert.equal(sent.generationConfig.maxOutputTokens, 800);
  assert.equal(sent.generationConfig.thinkingConfig.thinkingLevel, 'minimal');
  assert.match(sent.systemInstruction.parts[0].text, /sole source of company facts/);
  assert.match(sent.systemInstruction.parts[0].text, /150 words/);
  assert.match(sent.systemInstruction.parts[0].text, /94714112113/);
  assert.ok(!JSON.stringify(sent).includes('test-key'));
});

test('AI answer is capped at 150 words even if the model ignores the instruction', async () => {
  const text = Array.from({ length: 90 }, () => 'This is a complete useful sentence.').join(' ');
  const stream = await events(await invoke({ fetchImpl: async () => success(text) }));
  const answer = stream.find(event => event.type === 'delta').text;
  assert.ok(answer.split(/\s+/).length <= 150);
  assert.ok(answer.length > 100);
});

test('Excessive output settings and conversation context are bounded', async () => {
  let sent;
  const messages = Array.from({ length: 15 }, (_, index) => ({
    role: index % 2 ? 'assistant' : 'user',
    content: index === 14 ? 'What website approach should I use?' : 'website content '.repeat(120),
  }));
  await invoke({
    env: { GEMINI_API_KEY: 'test-key', GEMINI_MAX_OUTPUT_TOKENS: '90000' },
    fetchImpl: async (url, init) => { sent = JSON.parse(init.body); return success(); },
  }, { mode: 'site', messages });
  assert.equal(sent.generationConfig.maxOutputTokens, 1000);
  assert.ok(sent.contents.length <= 6);
  assert.ok(sent.contents.reduce((sum, turn) => sum + turn.parts[0].text.length, 0) <= 4800);
  assert.equal(sent.contents[0].role, 'user');
  assert.equal(sent.contents.at(-1).role, 'user');
  assert.match(sent.contents.at(-1).parts[0].text, /approach/);
});

test('Token exhaustion falls back once without a second billable generation', async () => {
  let calls = 0;
  const response = await invoke({ fetchImpl: async () => {
    calls++;
    return Response.json({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: 'Incomplete' }] } }] });
  } });
  assert.equal(calls, 1);
  assert.deepEqual(await response.json(), { mode: 'guide', reason: 'answer_limit' });
});

test('Quota exhaustion skips more calls across visitors, then recovers after Retry-After', async () => {
  let time = 100000, calls = 0;
  const runtime = createChatRuntime();
  const options = { runtime, now: () => time, fetchImpl: async () => {
    calls++;
    return calls === 1 ? new Response('{}', { status: 429, headers: { 'Retry-After': '45' } }) : success();
  } };
  const first = await invoke(options);
  assert.deepEqual(await first.json(), { mode: 'guide', reason: 'ai_quota', retryAfterSeconds: 45 });
  time += 10000;
  const next = await invoke({ ...options, clientId: 'another-visitor' });
  assert.equal((await next.json()).retryAfterSeconds, 35);
  assert.equal(calls, 1, 'Cooldown must prevent another provider call');
  time += 35001;
  assert.equal((await events(await invoke(options)))[0].mode, 'ai');
  assert.equal(calls, 2);
});

test('Provider RetryInfo and default quota cooldowns are respected', async () => {
  for (const [detail, delay] of [
    [{ error: { details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '12.5s' }] } }, 13],
    [{ error: { message: 'Quota exceeded' } }, 60],
  ]) {
    const response = await invoke({ fetchImpl: async () => Response.json(detail, { status: 429 }) });
    assert.equal((await response.json()).retryAfterSeconds, delay);
  }
});

test('Provider errors and invalid responses fall back without automatic retries', async () => {
  for (const status of [403, 503, 200]) {
    let calls = 0;
    const response = await invoke({ fetchImpl: async () => {
      calls++;
      return Response.json(status === 200 ? { candidates: [] } : { error: 'unavailable' }, { status });
    } });
    assert.equal(calls, 1);
    assert.equal((await response.json()).reason, 'provider_unavailable');
  }
});

test('Changing a provider key escapes a configuration cooldown', async () => {
  const runtime = createChatRuntime();
  await invoke({ runtime, fetchImpl: async () => new Response('{}', { status: 403 }) });
  const response = await invoke({ runtime, env: { GEMINI_API_KEY: 'replacement-test-key' } });
  assert.equal((await events(response))[0].mode, 'ai');
});

test('Visitor request limit uses local answers and resets after one minute', async () => {
  let time = 100000, calls = 0;
  const options = { runtime: createChatRuntime(), now: () => time, fetchImpl: async () => { calls++; return success(); } };
  for (let i = 0; i < 6; i++) await invoke(options);
  assert.equal((await (await invoke(options)).json()).reason, 'ai_rate_limited');
  assert.equal(calls, 6);
  time += 60001;
  assert.equal((await events(await invoke(options)))[0].mode, 'ai');
  assert.equal(calls, 7);
});

test('Visitor cancellation does not create a provider cooldown for other visitors', async () => {
  const runtime = createChatRuntime(), controller = new AbortController();
  const req = new Request(request(), { signal: controller.signal });
  const response = await handleChatRequest(req, {
    env: { GEMINI_API_KEY: 'test-key' }, runtime,
    fetchImpl: async () => { controller.abort(); throw new DOMException('Stopped', 'AbortError'); },
  });
  assert.equal((await response.json()).reason, 'cancelled');
  assert.equal(runtime.providers.size, 0);
  assert.equal((await events(await invoke({ runtime })))[0].mode, 'ai');
});

test('Cross-site and malformed requests never reach Gemini', async () => {
  const req = new Request(`${origin}/api/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://attacker.example' },
    body: JSON.stringify(payload()),
  });
  const response = await handleChatRequest(req, { fetchImpl: () => assert.fail('Invalid request reached provider') });
  assert.equal(response.status, 403);
  assert.equal((await invoke({}, { mode: 'invalid', messages: [] })).status, 400);
});
