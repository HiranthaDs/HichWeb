# Chathu — HICH hybrid chat assistant

The homepage, floating assistant and terms view use Chathu’s shared chat interface. Chathu is retrieval-first:

- **HICH knowledge** answers greetings, HICH facts, contact requests, services, portfolio, pricing factors and straightforward terms questions directly in the browser. These replies do not call an AI provider or consume model tokens.
- **AI assistant** uses Gemini for complex, in-scope recommendations across websites, ecommerce, apps, UX, accessibility, SEO, analytics, content, integrations, automation, architecture, performance, security and maintenance.

Unrelated general-knowledge questions stay in HICH knowledge and receive a scoped response instead of being sent to Gemini. Chathu routes known questions locally before making a network request. If the Worker/function or Gemini is unavailable, misconfigured, timed out or over quota, Chathu quietly falls back to bundled HICH knowledge. Contact cards always use canonical HICH data, and no reply can claim that a call or message was placed.

The Gemini request contains only limited recent conversation and compact, retrieved HICH records. The model may use broad professional knowledge for general digital-project advice, but must treat the supplied content as the sole source of claims about HICH. This is runtime grounding, not model fine-tuning.

## Enable the hybrid assistant on Cloudflare

The repository now includes the complete Cloudflare runtime: `wrangler.jsonc`, `worker/index.js`, and an automated Cloudflare build step.

1. Keep `GEMINI_API_KEY` in the ignored `.env.local` for local development. Never use a `VITE_` prefix.
2. Install and preview the production-style Worker:

   ```sh
   npm ci
   npm run preview:cloudflare
   ```

3. Open the printed local `/api/chat` URL. It must report `"mode":"hybrid"`.
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

7. Test one simple contact question and one detailed project recommendation in the visible chatbot. The simple question should be instant and local; the detailed question should make one `POST /api/chat` request and remain usable if that request fails.

The optional tuning values are already non-secret `vars` in `wrangler.jsonc`. `gemini-3.5-flash-lite` is the low-latency, lower-cost default. Change `GEMINI_MODEL` to `gemini-3.5-flash` and `GEMINI_THINKING_LEVEL` to `medium` if answer quality matters more than latency and cost, then redeploy. The server caps output at 2,400 tokens and retries once at that ceiling if Gemini reports a token-limited response, so visitors never receive a knowingly truncated answer.

See [Cloudflare deployment](DEPLOYMENT.md#cloudflare) for custom-domain, HTTPS, www redirect, cache and production verification steps.

## Enable the hybrid assistant on Netlify

1. Deploy the complete source project through a connected repository or Netlify's source-build flow. Keep `netlify.toml` at the deployment root. A manual upload of `dist/` cannot deploy `netlify/functions/chat.mjs`, so Chathu will still answer from bundled HICH knowledge but cannot use Gemini.
2. Revoke any API key that has appeared in chat, source code, screenshots or another public location. Create a replacement Gemini API key.
3. In **Netlify → Project configuration → Environment variables**, create a secret named `GEMINI_API_KEY`. Paste only the replacement value. Give it the **Functions** scope (or all scopes) and the **Production** deploy context. Never use a `VITE_` prefix.
4. Add these optional server-only settings:

   ```text
   GEMINI_MODEL=gemini-3.5-flash-lite
   GEMINI_MAX_OUTPUT_TOKENS=1600
   GEMINI_THINKING_LEVEL=low
   ```

   `gemini-3.5-flash-lite` is the default low-cost model. `low` gives complex requests some reasoning while limiting latency and token use; use `minimal` for the smallest reasoning budget. The larger completion allowance prevents reasoning tokens from cutting off the concise visible answer. The server caps output at 2,400 tokens even if a larger value is configured.
5. Remove obsolete `OPENAI_*` variables from Netlify so the project configuration is unambiguous.
6. Trigger a fresh production deploy after saving the variables.
7. Open `https://YOUR-DOMAIN/api/chat`. A configured deployment returns:

   ```json
   { "ok": true, "mode": "hybrid", "provider": "gemini", "model": "gemini-3.5-flash-lite" }
   ```

   `"mode":"guide"` means the function is running without `GEMINI_API_KEY`. HTML or a 404 means the function was not deployed.

Google recommends keeping Gemini keys in server-side environment variables and using a backend proxy for browser applications: [Gemini API key security](https://ai.google.dev/gemini-api/docs/api-key).

## Local development

Copy `.env.example` to `.env.local`, add a replacement server-only key, and run `npm run dev`. Do not commit `.env.local`.

Run the focused checks with:

```sh
npm run test:chat-server
npm run test:chat-unit
npm run test:chat
```

The server applies same-origin checks, payload and history limits, per-instance AI rate limiting, a 30-second provider timeout, one retry for transient provider failures, compact retrieval grounding and a conservative output cap. Provider errors are recorded in Worker/function logs without exposing the key or breaking the guide.

Company facts and retrieval live in `src/assistant-knowledge.js`, the provider proxy in `server/chat.js`, canonical contact actions in `src/assistant-actions.js`, the Cloudflare entrypoint in `worker/index.js`, and the Netlify entrypoint in `netlify/functions/chat.mjs`.
