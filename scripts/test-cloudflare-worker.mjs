import assert from 'node:assert/strict';
import worker from '../worker/index.js';

let assetRequests = 0;
const env = {
  ASSETS: {
    fetch(request) {
      assetRequests += 1;
      return new Response(`asset:${new URL(request.url).pathname}`, { status: 200 });
    },
  },
};

const health = await worker.fetch(new Request('https://hichweb.com/api/chat'), env);
assert.equal(health.status, 200);
assert.deepEqual(await health.json(), { ok: true, mode: 'guide' });
assert.equal(assetRequests, 0, 'The chat API must not fall through to static assets');

const page = await worker.fetch(new Request('https://hichweb.com/about.html'), env);
assert.equal(await page.text(), 'asset:/about.html');
assert.equal(assetRequests, 1, 'Non-API requests must use the static asset binding');

console.log('Cloudflare Worker passed: /api/chat is dynamic and site requests use static assets.');
