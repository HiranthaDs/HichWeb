import assert from 'node:assert/strict';
import { setTimeout as pause } from 'node:timers/promises';
import { createTextReveal } from '../src/chat-reveal.js';

const text = 'A clear next step. **WhatsApp** +94 714 112 113. Hello 👋 — ආයුබෝවන්!';
let shown = '';
let calls = 0;
const paced = createTextReveal({ onText: value => { shown += value; calls++; } });
paced.push(text);
assert.equal(shown, '', 'Network bursts do not render in one immediate jump');
await paced.finish();
assert.equal(shown, text, 'Pacing preserves all content and formatting');
assert.ok(calls > 1, 'A large packet is revealed across multiple updates');
paced.dispose();

shown = '';
const reduced = createTextReveal({ onText: value => { shown += value; }, immediate: () => true });
reduced.push('Hello \uD83D');
assert.equal(shown, 'Hello ', 'A split emoji waits for its second surrogate');
reduced.push('\uDC4B');
assert.equal(shown, 'Hello 👋', 'Reduced motion renders without artificial pacing');
await reduced.finish();
reduced.dispose();

shown = '';
const abort = new AbortController();
const stopped = createTextReveal({ onText: value => { shown += value; }, signal: abort.signal });
stopped.push(text.repeat(20));
const draining = stopped.finish();
await pause(60);
abort.abort();
const snapshot = shown;
await assert.rejects(draining, { name: 'AbortError' });
await pause(80);
assert.equal(shown, snapshot, 'Stop prevents delayed text from appearing');
assert.ok(shown.length < text.length * 20, 'Stop discards queued text');
stopped.dispose();
console.log('Chat reveal passed: paced bursts, exact text, split emoji, reduced motion and cancellation.');
