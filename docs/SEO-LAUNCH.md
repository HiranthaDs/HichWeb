# HICH search launch guide

Reviewed for **https://hichweb.com** on **23 October 2026**. This guide covers deployment checks and the account work that must happen after publication. A local build or ZIP cannot submit a site to a verified Search Console account, create brand recognition, or guarantee a search position.

The build produces 30 full HTML pages, including a noindex error page, plus two redirect aliases. Its sitemap lists the 29 canonical, indexable pages. Every build checks unique titles/descriptions, one primary heading and canonical per page, local asset and page links, the social preview image, and all marked-up FAQ answers against rendered content. It omits unverified publication dates and sitemap `lastmod` dates. These are local acceptance checks; production response codes and indexing still need the checks below.

## 1. Publish one canonical website

- Serve the production build at `https://hichweb.com` with a valid HTTPS certificate.
- Redirect HTTP and `www.hichweb.com` to the equivalent HTTPS, non-www address. Keep the path and query string when appropriate; avoid redirect chains.
- Keep the existing `.html` service and guide URLs, or configure a permanent redirect for every changed URL to its closest equivalent. Do not redirect unrelated missing pages to the homepage.
- Make each canonical page return `200`, permanently moved pages return `301` or `308`, and unknown pages return a genuine `404` response.
- Check one absolute, self-referencing canonical URL per indexable page. Align internal links, redirects and sitemap URLs with that choice. Inspect the live source, not only the browser DOM.
- Remove staging `noindex` directives at launch. Keep the preview or staging copy out of search. Verify the hosting/CDN does not block Googlebot or require a login for public pages.

Canonical tags are signals, not commands. Consistency across URLs, redirects and links helps Google identify the preferred version. [Google: consolidate duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).

## 2. Give HICH a consistent identity

Use **HICH** consistently in the visible brand, homepage heading or introduction, page titles, `og:site_name` and `WebSite` data. Appropriate alternatives are **Hich Web**, **Hich Web Development**, **HichWeb** and **hichweb.com**. Use the same organisation ID, `https://hichweb.com/#organization`, across pages.

The homepage should explain in ordinary visible text that HICH is a web development and digital design studio in Sri Lanka. Keep the email (`info@hichweb.com`), telephone (`+94714112113`), logo and verified profile links consistent. No registered company name or street address is inferred from the supplied project; add these only after confirming they are accurate.

`WebSite` name data communicates the preferred site name, while organisation data helps search systems distinguish the company. Neither provides direct control over Google's spelling suggestions. Google may still interpret a short or unfamiliar query such as “hich” as another word. A clear entity, indexed pages and authentic references to the brand are the practical response. [Google: site names](https://developers.google.com/search/docs/appearance/site-names), [Google: organisation structured data](https://developers.google.com/search/docs/appearance/structured-data/organization).

Confirm that linked social profiles genuinely belong to HICH and point back to the canonical domain. Publish accurate project descriptions, clearly identify concept work and seek real client permission before publishing testimonials or measurable results. Do not invent reviews, awards, clients, local offices or business metrics.

## 3. Verify Search Console and submit the sitemap

1. Sign into the Google account that should own the business property.
2. Add a **Domain property** for `hichweb.com` and complete Google's DNS TXT verification through the domain's DNS provider. Keep the record after verification.
3. Open `https://hichweb.com/robots.txt` and verify the production sitemap is declared. Check `https://hichweb.com/sitemap.xml` is reachable and contains only canonical, indexable production URLs.
4. Submit that sitemap in Search Console. Use real content modification dates if emitting `lastmod`; do not refresh dates merely because a build ran.
5. Use URL Inspection on the homepage and representative service and guide pages. Check rendered content, crawl access, canonical selection and any indexing exclusions. Request indexing when appropriate.
6. Monitor Page Indexing, HTTPS, Core Web Vitals, Manual Actions and Security Issues after launch. Save a baseline for branded and service queries before evaluating changes.
7. In **Settings → Search generative AI**, confirm the property's inclusion choice permits its links and content to appear in Search generative AI features. Inclusion is Google's default; check inheritance if a parent property controls the setting. This is an account setting, not a tag added by the website. [Google: Search generative AI control](https://support.google.com/webmasters/answer/16908024).

A sitemap helps discovery; submission does not guarantee indexing. Requests for recrawling can take time and repeated submissions do not accelerate the process. [Google: build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [Google: request a recrawl](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl), [Google: verify site ownership](https://support.google.com/webmasters/answer/9008080).

## 4. Validate the deployed pages

- View page source with JavaScript disabled: page-specific headings, service information, navigation and contact information should remain meaningful.
- Check unique, descriptive titles and descriptions, a coherent heading structure, crawlable anchor links and useful image alternative text.
- Inspect the homepage plus one service, one article, contact and the real 404 route on a phone and desktop. Check keyboard navigation, forms, focus visibility, reduced motion and image loading.
- Validate structured data against the content users can see. Test supported rich-result types with Google's Rich Results Test and the overall graph with Schema.org Validator. Site-name data is not supported by the Rich Results Test.
- Retain only factual `Organization`, `WebSite`, `WebPage`, `BreadcrumbList` and appropriate article/service data. Do not add ratings, review totals or fabricated author credentials. A valid schema graph does not itself promise a rich result.
- Run PageSpeed Insights against the deployed domain. Prioritise actual loading delays, input responsiveness and layout shifts; measure real user data when sufficient traffic is available.

Page titles and summaries are tailored to each service or guide. A short metadata description is a useful summary, not a fixed ranking formula, and Google can choose a different search snippet. Keep long service introductions in the visible page rather than copying them wholesale into metadata. The organisation graph links the actual LinkedIn identity; an action URL that starts a WhatsApp chat is not used as an identity profile.

Google's JavaScript documentation explains why search needs accessible, renderable content and correct status codes. Its structured-data policies require markup to represent visible, accurate content. [Google: JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [Google: structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

## 5. Treat AEO as useful content and accessible information

Keep concise answers to actual customer questions alongside substantive service details, examples and planning guidance. Make the answers visible as text and link related topics naturally. Review factual statements, authorship and update dates; change dates only after meaningful editorial work.

For Google AI Overviews and AI Mode, the established SEO foundations still apply: public, crawlable pages, useful original information and accurate structured data. There is no special AEO schema or AI text file that guarantees inclusion. An optional `llms.txt` file is not a ranking mechanism. Eligibility does not guarantee crawling, indexing or citation. [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features), [Google: generative AI search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

Publish first-hand details from real HICH work over time: the problem, constraints, design decisions and verified outcome. Describe only what the business can substantiate. Keep helpful FAQs for visitors. The site retains accurate `FAQPage` semantic data, but **Google retired FAQ rich results in May 2026**; this markup does not unlock a Google FAQ display. [Google: Search documentation updates](https://developers.google.com/search/updates).

## 6. Measure progress after launch

Follow [`GOOGLE-ANALYTICS-SETUP.md`](./GOOGLE-ANALYTICS-SETUP.md) to add the real GA4 Measurement ID, verify consent behaviour, define the lead key event and link the GA4 property to Search Console. The source intentionally loads no Google tag while the ID is absent.

Track impressions, clicks and landing pages for `HICH`, `Hich Web`, `Hich Web Development`, `hichweb.com` and relevant service searches in Search Console. Compare equivalent periods and locations. Record enquiries separately so search traffic is connected to actual business value.

Use Search Console's **Generative AI performance report** to review AI-feature impressions by page, country, date and device when the report has sufficient data. An absent report or a small sample is not evidence that the frontend needs a special AI file or schema. [Google: Generative AI performance report](https://support.google.com/webmasters/answer/16984139).

Review indexing problems before rewriting everything. If the homepage is indexed but “hich” still triggers a spelling interpretation, continue consistent brand publishing and authentic references; no frontend tag can force Google to disable that behaviour. Assess trends over time instead of using a single personal search as proof of success.

**Owner actions still required:** deploy the production build, connect the domain, verify DNS/Search Console, submit the sitemap and review live indexing. These account and hosting steps are distinct from implementing the website.
