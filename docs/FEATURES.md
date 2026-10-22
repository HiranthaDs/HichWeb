# HICH website: features and source guide

This React website brings the reference's bold agency direction into HICH's own content and identity: oversized condensed typography, white and black editorial sections, electric blue accents, pink calls to action, project imagery and purposeful motion. It does not represent the reference agency's clients, staff, testimonials or proprietary work as HICH's.

## Pages and content

The route catalogue contains 29 page routes, including the dedicated 404 page:

- Homepage with introduction, selected projects, capabilities, interface demonstrations, process, business-needs tabs, studio information, FAQs and practical guides.
- Capabilities index and 12 individual service/capability pages.
- Project archive with 11 entries, category filtering and project-detail dialogs. Design concepts are explicitly labelled.
- Studio, process, contact, insights index and six individual planning guides.
- Careers/collaboration, privacy, website terms and 404 pages.

Project names, images and destinations are retained from the supplied HICH material. External project availability remains under those sites' owners. Business services described on these pages are offerings; their presence in the copy does not mean that this marketing site contains a checkout, ERP system or customer account application.

## Desktop and mobile experiences

Desktop uses wide editorial compositions, a full-screen navigation menu, large project presentations and a decorative 3D HICH identity scene. Mobile has a separate navigation arrangement: a persistent thumb-accessible dock for Explore, Work, Services and starting a project. The homepage project area uses horizontal swipe browsing with an explicit swipe hint, while project archive filters remain available for deliberate browsing.

The mobile project builder changes desktop selection cards into compact full-width rows, uses larger form text and touch controls, and stacks sharing actions. Contact options remain direct links to email, telephone and WhatsApp. Essential information is shared across layouts so a mobile visitor does not lose access to services or project details.

The 3D module is not initialized at mobile widths, when reduced motion is requested, or when the browser reports a data-saving preference. A designed typographic H fallback remains visible. Native mobile scrolling is preserved; optional smooth scrolling is limited to a desktop-sized viewport with a fine pointer and no reduced-motion preference.

## Working interactions

The expanded service pages include a section navigator, service-specific headlines,
practical scope chapters, detailed planning questions and related capabilities.
`src/ServiceExperience.jsx` supplies a distinct interactive prototype for each of
the 12 services; `src/service-experience-data.js` holds the supporting copy.

| Service prototype | What visitors can try |
| --- | --- |
| ERP workspace | Switch Overview, Inventory and Approvals; receive stock; approve purchases; inspect the activity history; reset sample records. |
| Brand playground | Combine three visual directions with three tones of voice and see the poster, typography and copy change. |
| Commerce | Select a product colour and quantity, add variants to a sample bag, inspect the subtotal and clear the bag. |
| Website | Switch desktop/mobile compositions and explore a sample collection page. |
| Web application | Submit an equipment request as a team member, then review it as a manager. |
| UX design | Step through a sample session-selection and review journey. No appointment is booked. |
| Mobile | Simulate a lost connection, complete tasks and reconnect to resolve queued demo updates. |
| SEO | Edit a title and description in an illustrative search appearance preview. |
| Automation | Run a sample order workflow, simulate a failed inventory step and retry without restarting completed steps. |
| Maintenance | Run a sample review, inspect findings and resolve an illustrative dependency update. |
| Product strategy | Choose first-release features and see the corresponding roadmap change. |
| Architecture | Compare product models and explore the responsibilities of individual system layers. |

These prototypes use fictional records and local React state. They do not contact
business systems, scan a visitor's website, book appointments or create orders.
Reloading the page resets their state. The mobile connection switch simulates a
workflow; it does not change the browser's network connection or implement a
service worker.

`src/PageDepth.jsx` adds route-specific editorial chapters across the remaining
pages: a business-priority selector, delivery milestones, guided reading paths,
practical article exercises, preparation checklists and collaboration guidance.
Checklist choices stay on the current page and can be reset. Legal and utility
pages include practical navigation and explanations of existing functionality.

`src/service-questions.js` extends the service FAQs. The rendered questions and
their structured metadata both read the same data.

| Feature | Behaviour |
| --- | --- |
| Navigation menu | Native modal dialog with clear close control and Escape support. |
| Site search | Local search across navigation destinations, capabilities and guides; open through the search button or Control/Command + K. No query is sent to a search service. |
| Project archive | Category buttons filter the visible projects. Each project opens a detail dialog with description, service tags and the supplied destination. |
| Capabilities | Expandable service descriptions with links to complete service pages. |
| Process tabs | Four stages with click/tap and Left/Right/Home/End keyboard navigation. |
| Business-needs tabs | Three different business contexts with matching descriptions and service links; keyboard tab controls are supported. |
| FAQs | Native disclosure controls that expand and collapse answers. |
| Interface demonstrations | Selectable experience preferences, a small content-editing preview and a pause control for demonstration motion. The editing preview is illustrative; it is not a CMS. |
| Article contents | On-page links jump to the guide's individual sections. |
| Project planner | Validated four-step brief builder with review, sharing, optional preference storage and reset. |

## Project enquiry builder

`src/ProjectPlanner.jsx` collects information in four steps:

1. Choose a website, e-commerce, web application or ERP/automation project.
2. Select at least one goal and optionally add project notes.
3. Optionally give a budget range and timing preference.
4. Add a required name and valid email, plus an optional company name.

The review screen displays the prepared plain-text brief and provides these explicit actions:

- **Open email draft:** opens a `mailto:` draft addressed to `info@hichweb.com` in the visitor's configured email application.
- **Open WhatsApp:** opens a prepared draft to `+94 714 112 113` through WhatsApp.
- **Copy brief:** uses the browser clipboard, with manual text selection if clipboard access is unavailable.
- **Download .txt:** creates a local plain-text file in the browser.
- **Edit details / Start over:** return to editing or clear the current brief and saved preferences.

There is no form-submission server, automatic message delivery, email API, CRM integration or fabricated submission-success state. Visitors must send the prepared message themselves. Email handoff depends on an available email application; copy and download provide alternatives. Opening the WhatsApp link passes the prepared text to WhatsApp in its URL before the visitor chooses whether to send the message to HICH.

No personal information is stored in local storage by the builder. The optional **Remember project preferences** control stores only project type, selected goals, budget and timing under `hich-project-preferences-v1`. Name, email, company and free-text notes remain in the current page's React state. Preferences are restored after the initial render, keeping server-rendered HTML hydration consistent. Storage failure does not prevent completing the brief.

The builder uses native radio buttons, checkboxes and form controls, labelled inputs, required-field error messages, focus management and a polite status announcement. It does not require an account.

## Motion, technology and performance

Page navigation uses `src/PageTransition.jsx` and `src/page-transition.css` for a
brief pink-and-black curtain with an animated HICH wordmark. Normal browser URLs
and document history are retained. Same-page anchors, modified clicks, downloads,
external links and contact links keep their native behavior. A short-lived session
storage handoff coordinates the arrival animation; it contains only the next URL
and timestamp and is removed on arrival. Storage failure does not block navigation.
Recovery timers and a back/forward-cache reset prevent the curtain staying open.
Entering or leaving the capabilities overview uses the isolated
`ServicesGitTransition` instead: a light Git workflow merges Discover, Design,
Build and Launch through a terminal command, branch line, commit nodes and a
fast-forward completion state. Phones transpose the path vertically and retain
the same white, gray and GitHub-green palette. Both controllers align their
handoff to rendered animation events and preserve reduced-motion native
navigation.

`src/useMotion.js` progressively loads GSAP and observes elements as they enter the
viewport. It adds staggered entrances, scroll-linked typography, dialog and tab
entrances, and restrained pointer depth on suitable desktop devices. Content
remains visible without the animation library. The system responds to changes in
the reduced-motion preference and cleans up its observers, listeners and timers.
Reduced motion also bypasses the page curtain and demo animation styles.

- **React / React DOM:** component state, interactive controls and hydration of the production HTML.
- **Vite:** development server and production bundles.
- **Tailwind CSS:** installed through the Vite plugin alongside the custom editorial stylesheet.
- **GSAP / ScrollTrigger:** heading entrances, element reveals, scroll-positioned marquee movement and the introduction's text colour progression.
- **Lenis:** dynamically loaded smooth scrolling for suitable desktop devices.
- **Three.js:** dynamically loaded decorative extruded H scene with a reflective material and gentle pointer response.
- **Lucide React:** interface icons.
- **Self-hosted Anton and Inter:** open-license display and body typography. These are alternatives to the reference's proprietary fonts, not identical copies.

## Verification

Run `npm run build` followed by `npm test`. The browser suite starts a local Vite
preview and checks the prerendered route catalogue at desktop and mobile widths,
page structure, internal anchors, horizontal overflow, all 12 service prototypes,
page transitions, native navigation, storage failure and browser history. Reports
and screenshots are written to `qa/`. It uses an installed Chrome by default;
set `QA_BROWSER=msedge` to use an installed Edge instead.

The editable source for the current website is `src/`. The top-level legacy
service HTML files are historical material; Vite serves the React route in
development and the production build generates the current HTML in `dist/`.

The decorative 3D scene initializes near its section, pauses rendering when offscreen or when the document is hidden, caps device pixel ratio and releases GPU resources when it is disabled or unmounted. WebGL or import failure retains the fallback. Project images include dimensions and use lazy loading where appropriate. Motion preference handling is built into the animation code and styles.

These implementation choices are not a universal performance score or a guarantee on every device. Measure the final hosted domain under representative mobile network conditions.

## Search and answer-engine foundations

The build is configured to produce route-specific HTML rather than relying on a blank client-only page. Route metadata supplies titles and descriptions for the canonical `https://hichweb.com` domain. The structured-data graph contains consistent HICH organisation and website information, page identity, breadcrumbs, service or article information, and FAQs where matching answers are visible.

Clear HICH naming, distinct service pages, practical answer-oriented guides and consistent contact information give search systems factual content to interpret. Publication, DNS/HTTPS configuration, Search Console ownership, sitemap submission and ongoing real business references are separate launch tasks. No code can guarantee a search position, force Google's spelling interpretation of “hich”, or ensure inclusion in an AI answer.

See [SEO-LAUNCH.md](SEO-LAUNCH.md) for the account and deployment work, and [REFERENCE-AUDIT.md](REFERENCE-AUDIT.md) for the reference observations and technology evidence.

## Source map

### Interactive studio additions

The Home and About pages share `ContributionGarden`, a 48-second wordless cartoon above a GitHub-style contribution backdrop. A cat licks its paw and walks to meet a dog arriving from the opposite side. They touch paws, play with a ball, chase each other offscreen and return. A curling ocean wave rolls in and retreats; a friendly dinosaur arrives with an offline-style symbol, then all three run and jump past cacti before returning to the opening. Shaded vector characters, rounded forms, layered terrain and soft shadows give the artwork a 3D feel without downloading video or requiring WebGL. A responsive SVG stage keeps the animals readable on phones; the background retains 53 by 13 squares on desktop and 25 by 13 on mobile. A single animation clock updates SVG transforms without rerendering React. A small icon pauses playback. Reduced motion shows a still illustration of the friends, and playback stops offscreen or in a hidden tab. Desktop mouse hover retains a local spring response. The displayed **4,882** annual total was supplied by the studio; individual daily contribution records were not supplied. The pattern is explicitly labelled illustrative and does not connect to a GitHub account.

`AboutStory` expands the About page with studio background, design and engineering disciplines, technology choices, collaboration and handover details.

`SeasonalSnow` is mounted across the website. It checks the current month in **Asia/Colombo** after the browser loads, so a build produced in October still displays snow in December. The date is rechecked every minute and when tab visibility changes. Snow is absent outside December and when reduced motion is requested. Its pause/resume control remembers the visitor's choice in tab-scoped session storage (`hich:seasonal-snow`); storage failure does not prevent the control from working. The decorative canvas does not intercept clicks, has a bounded particle count and stops drawing in a hidden tab. The Privacy Policy describes this preference storage.

Each component imports its own stylesheet. Motion preferences and visibility checks keep animations from running unnecessarily. No additional animation or network dependencies are required.

| File | Responsibility |
| --- | --- |
| `src/App.jsx` | Shared header/footer, page layouts, navigation/search dialogs, project archive and dialogs, tabs, capabilities, FAQs, contact composition and legal notices. |
| `src/data.js` | HICH identity/contact data, capabilities, projects, guide content and FAQ answers. |
| `src/routes.js` | Route catalogue, aliases, page metadata, canonical base domain and JSON-LD graph. |
| `src/main.jsx` | Browser entry; hydrates existing page HTML or creates a client render; imports styles. |
| `src/entry-server.jsx` | React server-rendering entry used for producing route HTML. |
| `src/styles.css` | Visual system, desktop/mobile layouts, navigation, sections, interactions and motion preferences. |
| `src/useMotion.js` | GSAP/ScrollTrigger effects and optional desktop Lenis scrolling. |
| `src/IdentityScene.jsx` | Lazy 3D identity scene, fallback, visibility handling and GPU cleanup. |
| `src/ProjectPlanner.jsx` | Enquiry steps, validation, review, sharing and optional preference storage. |
| `src/planner.css` | Isolated builder styles, focus treatment and mobile-specific controls. |
| `vite.config.js` | React/Tailwind build setup and development handling for page URLs. |
| `package.json` / `package-lock.json` | Commands and the reproducible dependency tree. |
| `docs/REFERENCE-AUDIT.md` | Reference-site observations, confirmed technology and differences. |
| `docs/SEO-LAUNCH.md` | Publication, branded-search and indexing launch guidance. |

Keep both the visible contact details in `App.jsx` and the planner destinations in `ProjectPlanner.jsx` aligned with `company` in `data.js` when changing the studio's contact information. Rebuild production output after any source or content change.

## Focused planner verification

The planner was checked independently with a production JSX compilation and a 390px-wide Playwright flow: required-field errors, project/goal selection, optional-step continuation, review content, correct email-draft payload, consent-only storage, exclusion of personal data from storage, restoration and reset. The reviewed mobile screen had no horizontal overflow or browser errors; the review screen produced no axe accessibility violations in that focused test. Full-site QA remains a separate verification of the integrated layout and routes.
