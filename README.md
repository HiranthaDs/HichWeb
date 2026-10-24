# HICH — Websites for brands that think big

A React website for **https://hichweb.com**, with an editorial design, interactive service demonstrations and a separate touch layout. The production build outputs complete HTML for every public page.

## Run locally

Use Node.js 22.12 or newer (Node 22 LTS recommended).

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. Source files require this development server; opening `index.html` directly from the filesystem will not run the React project.

```sh
npm run build
npm run preview
npm run build:cloudflare
npm run preview:cloudflare
npm test
npm run zip
```

`dist/` is the complete static website to upload to your domain root. Do not upload the project root or `node_modules`. `npm run zip` first creates a fresh production build, then creates a Netlify source archive and a smaller static deploy-only archive inside `delivery/`.

For the recommended Cloudflare deployment, use the complete source repository and run `npm run deploy:cloudflare`. `wrangler.jsonc` serves `dist/` through Workers Static Assets and `worker/index.js` handles `/api/chat`. See the exact domain, secret and verification steps in [deployment instructions](docs/DEPLOYMENT.md#cloudflare).

For a Netlify deployment with the AI function, extract `delivery/HICH-Netlify-Source.zip` and use the extracted folder in Netlify's new-project source flow, or connect the source repository. For an existing site's manual deploy dropzone, extract `delivery/HICH-Deploy-Ready.zip` and drag the extracted folder (or drag `dist/` directly). Do not use the source archive for an existing site's manual deploy: that flow expects already-built files.

Chathu is the homepage and website-wide HICH assistant; the terms view keeps its own conversation. Home uses a popup on screens up to 760px wide and an inline section on desktop. Relevant HICH, project and terms questions try server-side Gemini grounded in local knowledge, with replies targeting 60–120 words and capped at 150. Greetings, identity and unrelated questions stay local. Each eligible question makes at most one provider call, defaulting to 800 output tokens and minimal thinking; quota, output limits or provider failures trigger the local guide. Rate limits and availability cooldowns reduce repeated calls, but are not a global billing cap. Configure the server-only `GEMINI_API_KEY` and deploy the complete project to enable hybrid mode. A static-only upload of `dist/` cannot provide the AI endpoint. The `/api/chat` health response confirms configuration only; a real reply with `"mode":"ai"` confirms generation. See [chat setup](docs/chat-assistants.md). Never put an API key in a `VITE_` variable or in `dist/`.

## Editing the website

The public quotation studio lives at `/quotation.html`, linked from the hamburger menu and the bottom footer. It reuses Chathu's quotation flow, catalog, pricing engine, PDF generation and sharing logic. Its layout uses the main website's typography, blue and pink accents, shared hero/scroll motion and standard page transitions. The builder opens immediately without a loading intro. Quotations remain draft estimates for HICH review; nothing is submitted until the visitor chooses to share.

| Location | Purpose |
| --- | --- |
| `src/App.jsx` | Shared navigation, footer, page layouts and home sections |
| `src/QuotationPage.jsx`, `src/quotation-page.css` | Dedicated quotation workspace and responsive presentation |
| `src/QuotationFlow.jsx`, `src/quotation-engine.js` | Shared quotation workflow and pricing rules |
| `src/data.js` | HICH details, services, portfolio, articles and FAQs |
| `src/ServiceExperience.jsx` | Working demonstrations for each service |
| `src/service-experience-data.js` | Service-specific editorial content |
| `src/CommerceExperience.jsx` | Payment brands and order fulfilment experience |
| `src/PageDepth.jsx` | Additional page-specific sections and planning tools |
| `src/ProjectPlanner.jsx` | Accessible project enquiry builder |
| `src/PageTransition.jsx` | Branded document transitions with native history |
| `src/ServicesGitTransition.jsx` | Services-only Git/commit navigation handoff |
| `src/ContributionGarden.jsx` | Responsive, wordless pixel cartoon inside a GitHub-style contribution grid |
| `src/contribution-cartoon.js` | 32-second, eight-scene pixel film: bunny, butterfly, magical garden, rocket and stars |
| `src/IdentityScene.jsx` | Lazy desktop WebGL identity, with static mobile fallback |
| `src/styles.css`, `src/refinements.css` | Shared responsive design system |
| `src/routes.js` | Routes, unique metadata and truthful structured data |
| `scripts/prerender.mjs` | Static HTML, sitemap, robots and hosting configuration |
| `public/` | Self-hosted fonts, project images and brand assets |

The previous standalone root HTML/CSS/JS files have been retired. Edit the React source and rebuild; equivalent pages such as `dist/brand-content-design.html` and `dist/404.html` are generated automatically. Existing public `.html` URLs remain intact.

## Before launch

Read [deployment instructions](docs/DEPLOYMENT.md) and the [SEO launch checklist](docs/SEO-LAUNCH.md). Confirm HICH's existing phone, email and portfolio links. The enquiry builder opens an email or WhatsApp draft for the visitor to send; it does not silently submit to a backend. Service tools and payment workflows are explicitly marked demonstrations.

Search metadata and HTML are implemented, but indexing, rankings, AI citations and Google's spelling suggestions depend on deployment and search engines. Submit the sitemap and verify ownership in Google Search Console after launch.

The visual direction follows the requested Ignite reference with HICH content and original assets. Anton and Inter are open-license, self-hosted alternatives to the reference's commercial fonts. See [reference and technology audit](docs/REFERENCE-AUDIT.md), [feature guide](docs/FEATURES.md), and bundled font licences under `public/fonts/`.
