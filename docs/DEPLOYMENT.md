# Deploying HICH

This is a React website that produces a complete HTML document for every public page at build time. React adds interactions after the HTML loads. Production hosting only needs to serve static files; no Node.js server, database or server-side React runtime is required after building.

## Build and preview

Use a current Node.js 22 release (22.12 or newer) or Node.js 24.

```sh
npm ci
npm run build
npm run preview
```

Open the local address printed by the preview command. `npm run dev` starts development mode. Use an HTTP server rather than opening HTML with `file://`, because JavaScript modules and root-relative asset paths need a server.

The build creates `dist/` with page HTML, hashed client assets, local fonts and media, `robots.txt`, `sitemap.xml`, `llms.txt`, `.htaccess`, `_headers` and `_redirects`. Upload the **contents of `dist/`**, with hidden files included. Source files, `node_modules`, `.ssr` and development documentation are not required on a static host. The site assumes the root of `hichweb.com`, not a subfolder.

The sitemap omits aliases and the 404 page. `i.html` and `terms.html` are small redirect documents for hosts that ignore the supplied server redirect configuration; the preferred configuration returns real HTTP 301 redirects before those files are served.

## Apache or cPanel

1. Back up the existing live files and confirm the domain's document root in cPanel.
2. Upload all files **inside** `dist/` to that root, commonly `public_html`. Enable “show hidden files” so `.htaccess` is included.
3. Install or enable a valid TLS certificate covering `hichweb.com` and `www.hichweb.com`. Point both hosts to this site.
4. Ensure Apache allows the supplied `.htaccess` rules and has `mod_rewrite` and `mod_headers` enabled. A host administrator may need to configure `AllowOverride`.
5. Test the homepage, a service URL, `/contact.html`, `/i.html`, `/terms.html`, `/about` and a made-up URL. The last should show the HICH error page with a **404 status**, while the aliases should redirect permanently.

The supplied `.htaccess` uses `DirectoryIndex index.html`, a real 404 document, canonical HTTPS/non-www redirects and extensionless-to-`.html` redirects only when the matching file exists. Its HTTPS redirect only applies to the named HICH production domains, keeping localhost and unrelated preview hosts untouched. Query strings are retained. [Apache: redirects and remapping](https://httpd.apache.org/docs/2.4/rewrite/remapping.html).

If a CDN proxies the site, use encrypted origin connections such as Cloudflare **Full (strict)**. A proxy that reports every origin request as HTTP can cause a redirect loop. In that topology, ask the host to configure trusted proxy HTTPS detection at server level or let the CDN enforce HTTPS and remove only the origin HTTP-to-HTTPS rule. Do not trust an arbitrary client-supplied `X-Forwarded-Proto` header in `.htaccess`.

## Netlify

For a repository-based deployment, use `npm run build` as the build command and `dist` as the publish directory; the checked-in `netlify.toml` already supplies both settings, pins a compatible Node version and ensures build dependencies are installed even if the Netlify project has `NODE_ENV=production`. The AI assistant requires this source-build path because Netlify must bundle `netlify/functions/chat.mjs`. `delivery/HICH-Netlify-Source.zip` is a root-correct source archive; extract it before selecting or dragging its folder in Netlify's new-project source flow.

For a static-only manual drag-and-drop deployment, run `npm run zip`, extract `delivery/HICH-Deploy-Ready.zip`, and drag the extracted folder (or drag `dist/` directly). Static upload keeps the built-in website guide but cannot deploy the AI function. Do not use the source archive, project root or `node_modules` for an existing site's manual deploy dropzone. Set `hichweb.com` as the primary custom domain, attach `www.hichweb.com` as an alias and enable HTTPS.

If Netlify reports `Deploy directory 'dist' does not exist`, look earlier in the deploy log for the first build error. Then clear the Netlify build cache and retry. Also remove any project-level `NODE_ENV=production` variable if possible; the checked-in `NPM_FLAGS=--include=dev` is a fallback that keeps Vite installed. Confirm that **Base directory** is empty (the repository root), **Build command** is `npm run build`, and **Publish directory** is `dist`.

**Disable Pretty URLs** under **Project configuration → Developer settings → Post processing → Pretty URLs** before publishing. This site intentionally retains its existing `.html` addresses. Pretty URLs can send those addresses to extensionless paths, which conflicts with the supplied redirects back to `.html`. Netlify documents this normalisation and the setting location. [Netlify: redirect options](https://docs.netlify.com/manage/routing/redirects/redirect-options/).

Keep the generated `_headers` and `_redirects` files in the publish root. The `301!` rules force canonical redirects even when an alias file exists. No `/* /index.html 200` rule is needed: every route has its own HTML, and the supplied `404.html` is used for missing files. Apply `X-Robots-Tag: noindex` to non-production previews through your hosting settings if they are publicly reachable.

## Cloudflare

Use **Cloudflare Workers with Static Assets**, not a Cloudflare Pages direct upload. The checked-in `wrangler.jsonc` keeps the site's established `.html` URLs, serves the prerendered `dist/` files at the edge, and sends only `/api/*` through `worker/index.js`. That Worker runs Chathu's server-side Gemini proxy; the key never enters browser JavaScript or the uploaded static assets. [Workers static asset bindings](https://developers.cloudflare.com/workers/static-assets/binding/), [Workers HTML handling](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/).

### 1. Build and test locally

```sh
npm ci
npm run build:cloudflare
npm run preview:cloudflare
```

`build:cloudflare` creates the normal production build and safely converts the generated redirects to Cloudflare syntax. The preview command starts Wrangler so both the website and `/api/chat` use the production-style Worker. Wrangler reads the existing ignored `.env.local` for local development. Do not also create `.dev.vars`; Cloudflare recommends choosing one local secret-file format, not both.

Check these local URLs before publishing:

- `/` returns the homepage.
- `/about` returns a 301 to `/about.html`.
- `/does-not-exist` returns the designed page with status 404.
- `/api/chat` returns JSON with `"mode":"hybrid"`. `"mode":"guide"` means `GEMINI_API_KEY` was not loaded.

### 2. Authenticate and create the Worker

```sh
npx wrangler login
npm run deploy:cloudflare
```

The first deploy may report guide mode until the production secret is added. `GEMINI_MODEL`, `GEMINI_MAX_OUTPUT_TOKENS` and `GEMINI_THINKING_LEVEL` are non-secret Worker variables already defined in `wrangler.jsonc`.

For automatic Git deployments, first create the Worker once as above, then connect its repository under **Worker -> Settings -> Builds**. Use the repository root, production branch, build command `npm run build:cloudflare`, and deploy command `npx wrangler deploy`. Keep build caching enabled. Workers Builds uses the pinned Wrangler version from `package.json`; runtime secrets belong in the Worker's Variables and Secrets settings, not in build variables. [Cloudflare Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).

### 3. Add the production Gemini secret

```sh
npx wrangler secret put GEMINI_API_KEY
```

Paste only the key value at the prompt. Do not put it under `vars`, do not prefix it with `VITE_`, and do not commit it. `wrangler secret put` creates and deploys a Worker version containing the encrypted binding. Cloudflare also supports **Worker -> Settings -> Variables and Secrets -> Add -> Secret**. [Cloudflare Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/).

Verify the deployed Workers URL:

```text
https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev/api/chat
```

It should return `{"ok":true,"mode":"hybrid","provider":"gemini",...}`. Then open the site, ask Chathu for a project recommendation, and confirm the browser Network panel shows `POST /api/chat` with status 200 and an `text/event-stream` response.

### 4. Connect hichweb.com

The domain must be an active zone in the same Cloudflare account. In **Workers & Pages -> hich-web -> Domains -> Add Domain**, add `hichweb.com` for production. A Worker Custom Domain cannot replace an existing conflicting CNAME, so remove or change that record only after confirming it points at the old host. Cloudflare provisions TLS for the Worker Custom Domain. [Cloudflare Worker Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

Add `www.hichweb.com` to Cloudflare DNS as a proxied record, then create **Rules -> Redirect Rules -> Single Redirect**:

- Match: wildcard `http*://www.hichweb.com/*`
- Target: `https://hichweb.com/${2}`
- Status: `301`
- Preserve query string: enabled

Enable **SSL/TLS -> Edge Certificates -> Always Use HTTPS**. The redirect keeps paths and query strings intact. [Cloudflare's hostname redirect example](https://developers.cloudflare.com/rules/url-forwarding/examples/redirect-all-different-hostname/).

### 5. Production checks and updates

Run `npm run deploy:cloudflare` after each source change. Do not run plain `npm run build` followed by `wrangler deploy`, because the Cloudflare redirect preparation is part of `build:cloudflare`.

After deployment, verify:

- `https://hichweb.com/api/chat` reports hybrid mode without exposing the secret.
- A complex project-planning question produces an AI answer; contact and simple HICH questions still answer instantly from the bundled guide.
- The browser console has no failed `/api/chat`, JavaScript, font or image requests.
- `/about` and the legacy aliases return 301; a made-up URL returns 404.
- `www` and HTTP requests redirect once to the same path on `https://hichweb.com`.
- HTML revalidates, while hashed `/assets/*` responses have the immutable cache policy supplied in `_headers`.

For account-level abuse protection, add a Cloudflare WAF rate-limiting rule for `POST /api/chat` after observing normal traffic. The Worker already validates same-origin JSON requests, limits payload/history size, applies a short per-instance AI limit and makes at most one capped Gemini call per question. Quota and provider errors activate a cooldown with local knowledge replies; later questions can try AI again after it expires. Avoid caching `/api/chat`; its responses already use `Cache-Control: no-store`.

## What the contact experience does

The project planner prepares a brief in the browser. Email and WhatsApp actions open the visitor's own application with that brief; the visitor completes the send there. The website has **no form-processing backend and does not independently deliver an email**. It also offers a way to copy or download the brief. If your workflow needs submissions stored or delivered automatically, connect an approved backend, configure abuse protection and publish the corresponding privacy information before enabling it.

## Fonts, content and changes

The build uses locally hosted **Anton** for bold display type and **Inter** for body text, with system fallbacks. These are intentionally available alternatives, not a claim that Ignite Agency's proprietary font files, assets or full source stack have been copied. Retain the supplied font licence files when redistributing the source.

Update company information, service copy, project links and guides in `src/data.js`; page metadata and schema live in `src/routes.js`. Rebuild after changes. Keep concept labels and publish factual claims only. Review the contact information and business policies before production launch.

## Live checks and search setup

- Confirm the domain resolves, HTTPS works and www/HTTP redirects preserve the destination path.
- Inspect source on the homepage and a service/article page to verify real page content, a unique title, absolute canonical, social preview metadata and structured data are present before JavaScript runs.
- Check missing paths return 404; aliases redirect; CSS, JavaScript, images and fonts load without errors.
- Test desktop and mobile navigation, motion preferences, project filters and the contact brief workflow. Verify email/WhatsApp destinations in an actual supported application.
- Confirm that hashed `/assets/` files receive immutable caching, while HTML revalidates. The supplied security policy restricts framing, object embedding and base URLs without blocking the site's animation code.
- Follow [SEO-LAUNCH.md](./SEO-LAUNCH.md) to verify ownership, submit the sitemap and monitor indexing. A website build cannot perform DNS verification or guarantee that Google will select HICH for a particular search.

The ZIP is a delivery artifact. It does not publish the website, purchase hosting, change DNS or sign into Search Console.
