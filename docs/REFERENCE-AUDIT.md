# IGNITE reference audit

Inspected 5 October 2026 at <https://igniteagency.com/>. This records public browser observations and asset evidence, not access to the agency's internal systems. It is an implementation reference for HICH, not a statement that HICH uses IGNITE's branding or client credentials.

## Visual system

| Element | Public reference |
| --- | --- |
| Primary surfaces | Pure white and black, large high-contrast sections |
| Brand pink | `#ff3454` |
| Electric blue | `#1043f9` |
| Secondary accents | Green `#34ff48`; purple `#e64aff` |
| Neutral rules | `#ccc`; light surface `#eee` |
| Display font | Söhne Schmal Halbfett, weight 600, very condensed uppercase |
| Body font | PP Neue Montreal, regular 400 and medium 500 |
| Display rhythm | Approximately `.85` line height and `-.01em` tracking |
| Page gutters | `5vw` |
| CTA | Solid pink pill, white text, simple arrow |
| Grid | 12 columns desktop, 8 tablet, 4 mobile in reference inline CSS |

The reference font files are publicly delivered custom fonts. Public availability is not evidence of a redistribution license. HICH should ship licensed/open-license alternatives or separately supplied licensed originals. Client photography, logos, testimonials, and work examples should remain HICH's own.

## Homepage sequence

1. White full-viewport hero: large wordmark, pink Get Started CTA and condensed MENU at top; short introductory body paragraph; enormous uppercase multiline heading with rotating industry word and colored reveal; grayscale client-logo marquee beneath.
2. Full black pinned introduction: reflective red 3D lightning bolt, scroll-controlled rotation and large body-text statements progressively revealed over it. Roughly five desktop screens of scroll distance.
3. White featured work: oversized looping display-type marquee; ruled project rows with plain sans-serif titles, outlined category pills, and hover video previews/case-study controls.
4. Three full-screen animated benefit scenes covering lead generation, user experience, and editing/CMS.
5. Black team section: sticky explanatory text at left, two columns of large rounded portrait cutouts and short biographies to the right.
6. Industry tabs and a split lead-magnet layout, including an email field and illustrated guide.
7. Large pinned testimonial presentation using client logos and editorial quote typography.
8. Blog section with a large sticky display label and article links.
9. Dark contact section: name, organisation, email, optional phone, multi-choice interests, project message, prominent booking CTA.
10. Oversized closing type, utility navigation, contact information, copyright, and a next-page prompt.

The full-screen menu is black with four enormous numbered white links in the left portion, smaller utility columns at right, agency statement at bottom-left, copyright at bottom-right, pink CTA and white CLOSE at top-right. Text links animate by letter/line staggering. A small pink custom cursor is present on desktop.

At 390px width the reference removes the header CTA, retains wordmark/MENU, uses a tall hero and narrower heading, and largely stacks the desktop material. HICH's requested mobile experience should intentionally prioritize tap targets, shorter scroll distances, explicit project controls, and navigation within thumb reach rather than relying on hover/pinned desktop scenes.

## Publicly confirmed technology

| Technology | Evidence and scope |
| --- | --- |
| Webflow | `data-wf-*` markup, generated CSS/JS, website-files CDN, Webflow CMS classes and forms |
| jQuery 3.5.1 | Explicit script URL |
| GSAP 3.15.0 | Explicit scripts for core, ScrollTrigger, SplitText, ScrollSmoother, CustomEase |
| Lenis | Bundled in custom `global.js`; fine-pointer initialization; referenced stylesheet `lenis@1.2.3` |
| Three.js / WebGL | Bundled renderer in lazy `components/3d-bolt.js` |
| Vimeo player | Project iframe sources and bundled player API |
| Custom JavaScript | GitHub/jsDelivr-delivered entry, global, homepage, loader, 3D and benefit modules |
| Scroll Timeline polyfill | `flackr.github.io/scroll-timeline/dist/scroll-timeline.js` requested |
| Forms/spam protection | Webflow markup and Cloudflare Turnstile script |
| Marketing/analytics | Runtime requests for Google Tag Manager/Analytics/Ads, HubSpot, Microsoft Clarity, Hotjar and Meta Pixel |

No React or Tailwind evidence was found in the delivered reference. React and Tailwind are HICH's requested implementation choices. The reference's trackers and account identifiers are not required to reproduce its interface and should never be copied into HICH. Private server code, CMS setup, CRM workflows, hosting account configuration, and all internal integrations cannot be established from a public inspection.

## Source URLs

- Reference: <https://igniteagency.com/>
- Shared CSS: <https://cdn.prod.website-files.com/66260e4321c76d6302aa74e5/css/igniteagencycom.shared.1a8759ab9.min.css>
- Homepage CSS/tokens: <https://cdn.prod.website-files.com/66260e4321c76d6302aa74e5/css/igniteagencycom.66260e4321c76d6302aa74e4.eac88463d.opt.min.css>
- Custom loader: <https://cdn.jsdelivr.net/gh/igniteagency/igniteagency-webflow-site/dist/prod/entry.js>
- Global interactions: <https://cdn.jsdelivr.net/gh/igniteagency/igniteagency-webflow-site/dist/prod/global.js>
- Homepage interactions: <https://cdn.jsdelivr.net/gh/igniteagency/igniteagency-webflow-site/dist/prod/pages/home.js>
- 3D component: <https://cdn.jsdelivr.net/gh/igniteagency/igniteagency-webflow-site/dist/prod/components/3d-bolt.js>

Runtime inspection used Chrome at 1440 x 1000 and 390 x 844. Temporary screenshots and captured source are in the system temp folder `hich-reference-audit`; they are research artifacts, not HICH production assets. Web content and versioned CDN URLs may change after this inspection.
