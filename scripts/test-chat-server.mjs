import assert from 'node:assert/strict';
import { handleChatRequest } from '../server/chat.js';

const origin = 'https://hichweb.com';
const request = (method, body) => new Request(`${origin}/api/chat`, {
  method,
  headers: method === 'POST' ? { 'Content-Type': 'application/json', Origin: origin } : undefined,
  ...(body ? { body: JSON.stringify(body) } : {}),
});
const synthesisPayload = { mode: 'site', messages: [{ role: 'user', content: 'Help me plan the best ecommerce website and automation approach for a clothing business.' }] };

const healthGuide = await handleChatRequest(request('GET'), { env: {} });
assert.equal(healthGuide.status, 200);
assert.deepEqual(await healthGuide.json(), { ok: true, mode: 'guide' });

const healthHybrid = await handleChatRequest(request('GET'), { env: { GEMINI_API_KEY: 'test-key' } });
assert.deepEqual(await healthHybrid.json(), { ok: true, mode: 'hybrid', provider: 'gemini', model: 'gemini-3.5-flash-lite' });

const guide = await handleChatRequest(request('POST', synthesisPayload), { env: {}, clientId: 'guide-test' });
assert.deepEqual(await guide.json(), { mode: 'guide', reason: 'not_configured' });

let localFetches = 0;
const local = await handleChatRequest(request('POST', {
  mode: 'site', messages: [{ role: 'user', content: 'What is your WhatsApp number?' }],
}), {
  env: { GEMINI_API_KEY: 'test-key' }, clientId: 'local-test',
  fetchImpl: async () => { localFetches += 1; throw new Error('Gemini must not be called'); },
});
assert.equal(localFetches, 0, 'Known HICH questions stay in the local guide');
assert.deepEqual(await local.json(), { mode: 'guide', reason: 'contact' });

let attempts = 0;
let modelRequest;
let modelUrl;
const fetchImpl = async (url, init) => {
  attempts += 1;
  modelUrl = url;
  modelRequest = init;
  if (attempts === 1) return new Response('temporary', { status: 503 });
  return Response.json({ candidates: [{ content: { parts: [{ text: 'Start with a focused commerce experience, then automate the highest-value operational handoffs.' }] } }] });
};
const ai = await handleChatRequest(request('POST', synthesisPayload), {
  env: { GEMINI_API_KEY: 'test-key', GEMINI_MODEL: 'gemini-3.5-flash-lite', GEMINI_MAX_OUTPUT_TOKENS: '640', GEMINI_THINKING_LEVEL: 'medium' },
  clientId: 'ai-test',
  fetchImpl,
});
assert.equal(ai.status, 200);
assert.match(ai.headers.get('content-type'), /text\/event-stream/);
const streamed = await ai.text();
assert.match(streamed, /"mode":"ai"/);
assert.match(streamed, /focused commerce experience/);
assert.match(streamed, /"type":"sources"/);
assert.match(streamed, /"type":"done"/);
assert.equal(attempts, 2, 'Retries one transient provider failure');
assert.match(modelUrl, /generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-3\.5-flash-lite:generateContent$/);
assert.equal(modelRequest.headers['x-goog-api-key'], 'test-key');
const submitted = JSON.parse(modelRequest.body);
assert.equal(submitted.generationConfig.maxOutputTokens, 640);
assert.equal(submitted.generationConfig.thinkingConfig.thinkingLevel, 'medium');
assert.deepEqual(Object.keys(submitted.generationConfig).sort(), ['maxOutputTokens', 'thinkingConfig']);
assert.equal('candidateCount' in submitted.generationConfig, false, 'Gemini 3.x does not support candidateCount');
assert.equal('store' in submitted, false, 'GenerateContent receives only supported request fields');
assert.ok(submitted.systemInstruction.parts[0].text.includes('PUBLISHED HICH CONTENT'));
assert.ok(submitted.systemInstruction.parts[0].text.includes('sole source of company facts'));
assert.ok(submitted.systemInstruction.parts[0].text.includes('broad professional knowledge'));
assert.ok(submitted.contents.some(content => content.parts[0].text.includes('clothing business')));
assert.equal(submitted.contents.at(-1).role, 'user', 'Gemini 3.x requests must not end with a prefilled model turn');
assert.ok(!modelRequest.body.includes('test-key'), 'API key never enters the request body');

let completionCalls = 0;
const completionTokenLimits = [];
const completed = await handleChatRequest(request('POST', synthesisPayload), {
  env: { GEMINI_API_KEY: 'test-key', GEMINI_MAX_OUTPUT_TOKENS: '600' },
  clientId: 'completion-test',
  fetchImpl: async (url, init) => {
    completionCalls += 1;
    completionTokenLimits.push(JSON.parse(init.body).generationConfig.maxOutputTokens);
    return completionCalls === 1
      ? Response.json({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: 'Incomplete' }] } }] })
      : Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'A complete, visitor-ready recommendation.' }] } }] });
  },
});
const completedStream = await completed.text();
assert.equal(completionCalls, 2, 'A token-limited answer is retried once');
assert.deepEqual(completionTokenLimits, [600, 2400]);
assert.match(completedStream, /complete, visitor-ready recommendation/);
assert.doesNotMatch(completedStream, /Incomplete/);

const unavailable = await handleChatRequest(request('POST', synthesisPayload), {
  env: { GEMINI_API_KEY: 'test-key' }, clientId: 'unavailable-test',
  fetchImpl: async () => new Response('{"error":"denied"}', { status: 403 }),
});
assert.equal(unavailable.status, 200);
assert.deepEqual(await unavailable.json(), { mode: 'guide', reason: 'provider_unavailable' });

const empty = await handleChatRequest(request('POST', synthesisPayload), {
  env: { GEMINI_API_KEY: 'test-key' }, clientId: 'empty-test',
  fetchImpl: async () => Response.json({ candidates: [] }),
});
assert.deepEqual(await empty.json(), { mode: 'guide', reason: 'provider_unavailable' });

const crossSite = new Request(`${origin}/api/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: 'https://attacker.example' },
  body: JSON.stringify(synthesisPayload),
});
const forbidden = await handleChatRequest(crossSite, { env: { GEMINI_API_KEY: 'test-key' }, clientId: 'cross-site-test', fetchImpl });
assert.equal(forbidden.status, 403);

console.log('Chat server passed: hybrid routing, Gemini grounding, retries, safe fallback, response streaming and origin checks.');
