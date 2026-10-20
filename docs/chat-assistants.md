# Chathu — HICH hybrid chat assistant

The homepage, floating assistant and terms view use Chathu’s shared chat interface. On screens up to 760px wide, the homepage uses the floating popup without a dedicated chat section. Desktop home keeps the inline section. Site conversation history is shared across these views; the terms conversation stays separate.

Chathu tries grounded AI first for relevant HICH, project and terms questions, including basic service, contact and pricing questions:

- **Gemini + HICH** combines relevant local records with Gemini’s reasoning to answer the actual question and recent follow-ups. General digital-project guidance is distinguished from confirmed company facts.
- **HICH knowledge** supplies a local reply when the API key is missing, the endpoint or provider is unavailable, a limit is reached, or an availability cooldown is active. Greetings, assistant identity and unrelated general-knowledge questions are handled locally without a provider request.

Contact cards always use canonical HICH data, and no reply can claim that a call or message was placed. Company facts, planning guidance and fallback answers live in `src/assistant-knowledge.js`. This is local knowledge and runtime grounding, not model fine-tuning.

## Reply and usage limits

Replies target 60–120 words, with a maximum of 150 words. The default provider completion allowance is 800 tokens with `minimal` thinking; configured output allowances are clamped to 256–1,000 tokens. Token counts and visible word counts are different limits.

Each eligible question makes at most one provider call. There is no automatic retry and no larger token allowance on a retry. If Gemini reports `MAX_TOKENS`, the endpoint returns `reason: "answer_limit"` and the browser supplies local knowledge instead of the incomplete answer. Other provider errors also fall back locally. A visitor can ask again or regenerate after a cooldown expires.

Provider input includes up to 6,000 characters of retrieved HICH context and at most six recent messages totaling 4,800 characters. The proxy limits AI requests to six per client per minute within each running instance.

There is no separate quota-balance check before every answer. The app first checks its local rate limit and known provider availability, then tries the generation request. A quota response (`429`) starts a cooldown using `Retry-After` or Google’s `RetryInfo` delay, or 60 seconds if neither is provided. Retry delays are bounded to 1–3,600 seconds. Provider outages default to 15 seconds; configuration errors such as `400`, `401`, `403` or `404` default to 300 seconds. The server shares availability within its running instance, and the browser remembers it for the current page session.

During cooldowns, visitors continue receiving local answers without repeatedly calling Gemini. After expiry, the next relevant question can try AI again. These guards reduce usage but are not a global hard billing cap: separate Worker/function instances and other applications can share the API key. Google’s project quota remains authoritative.

## Enable the hybrid assistant on Cloudflare

The repository now includes the complete Cloudflare runtime: `wrangler.jsonc`, `worker/index.js`, and an automated Cloudflare build step.

1. Keep `GEMINI_API_KEY` in the ignored `.env.local` for local development. Never use a `VITE_` prefix.
2. Install and preview the production-style Worker:

   ```sh
   npm ci
   npm run preview:cloudflare
   ```

3. Open the printed local `/api/chat` URL. It must report `"mode":"hybrid"`. This confirms a key is configured; it does not test the key, model, quota or a live generation.
4. Authenticate and create the Worker:

   ```sh
   npx wrangler login
   npm run deploy:cloudflare
   ```

5. Add the encrypted production secret:

   ```sh
   npx wrangler secret put GEMINI_API_KEY
   ```

6. Open the deployed `/api/chat` endpoint and confirm this shape:

   ```json
   { "ok": true, "mode": "hybrid", "provider": "gemini", "model": "gemini-3.5-flash-lite" }
   ```

7. Test a contact question and a project recommendation in the visible chatbot. Both should try one `POST /api/chat` request when AI is available. In the browser Network panel, a successful AI reply has `Content-Type: text/event-stream` and an event containing `{"type":"mode","mode":"ai"}`. The visible assistant and every answer are labeled only as **Chathu**; provider and fallback modes remain internal. If the request fails or returns guide mode, the chat remains usable with a local answer.

The non-secret `vars` in `wrangler.jsonc` default to `GEMINI_MODEL=gemini-3.5-flash-lite`, `GEMINI_MAX_OUTPUT_TOKENS=800` and `GEMINI_THINKING_LEVEL=minimal`. Redeploy after changing them. The server enforces the limits described above even if a larger output allowance is configured.

See [Cloudflare deployment](DEPLOYMENT.md#cloudflare) for custom-domain, HTTPS, www redirect, cache and production verification steps.

## Enable the hybrid assistant on Netlify

1. Deploy the complete source project through a connected repository or Netlify's source-build flow. Keep `netlify.toml` at the deployment root. A manual upload of `dist/` cannot deploy `netlify/functions/chat.mjs`, so Chathu will still answer from bundled HICH knowledge but cannot use Gemini.
2. Revoke any API key that has appeared in chat, source code, screenshots or another public location. Create a replacement Gemini API key.
3. In **Netlify → Project configuration → Environment variables**, create a secret named `GEMINI_API_KEY`. Paste only the replacement value. Give it the **Functions** scope (or all scopes) and the **Production** deploy context. Never use a `VITE_` prefix.
4. Add these optional server-only settings:

   ```text
   GEMINI_MODEL=gemini-3.5-flash-lite
   GEMINI_MAX_OUTPUT_TOKENS=800
   GEMINI_THINKING_LEVEL=minimal
   ```

   These are the same defaults used by Cloudflare and local development. The server clamps output allowances to 256–1,000 tokens and limits visible replies to 150 words. Increasing thinking can consume more of the completion allowance; a token-limited result uses the local fallback without another generation.
5. Remove obsolete `OPENAI_*` variables from Netlify so the project configuration is unambiguous.
6. Trigger a fresh production deploy after saving the variables.
7. Open `https://YOUR-DOMAIN/api/chat`. A configured deployment returns:

   ```json
   { "ok": true, "mode": "hybrid", "provider": "gemini", "model": "gemini-3.5-flash-lite" }
   ```

   `"mode":"guide"` on this health endpoint means the function is running without `GEMINI_API_KEY`. HTML or a 404 means the chat endpoint is not available at that URL. `"mode":"hybrid"` only confirms configuration. Verify an actual chatbot `POST` returns the AI stream event described above to confirm a working generation.

Google recommends keeping Gemini keys in server-side environment variables and using a backend proxy for browser applications: [Gemini API key security](https://ai.google.dev/gemini-api/docs/api-key).

## Local development

Copy `.env.example` to `.env.local`, add a replacement server-only key, and run `npm run dev`. Do not commit `.env.local`.

Run the focused checks with:

```sh
npm run test:chat-server
npm run test:chat-unit
npm run test:chat
```

The server applies same-origin checks, payload and history limits, per-instance AI rate limiting, a 30-second provider timeout, availability cooldowns, compact retrieval grounding and reply caps. It never automatically retries a generation. Provider errors are recorded in Worker/function logs without exposing the key or breaking the guide.

Company facts and retrieval live in `src/assistant-knowledge.js`; the additional practical Q&A records live in `src/assistant-practical-knowledge.js`. The provider proxy is in `server/chat.js`, canonical contact actions in `src/assistant-actions.js`, the Cloudflare entrypoint in `worker/index.js`, and the Netlify entrypoint in `netlify/functions/chat.mjs`.
