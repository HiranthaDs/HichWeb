# HICH Google measurement setup

The website code is ready for Google Analytics 4 (GA4), but it deliberately does not contain somebody else's or a placeholder property ID. The Google account owner must create or choose the property and supply its real Measurement ID.

Analytics measures discovery and outcomes; it does not directly improve rankings. Use GA4 for behaviour and conversions, and Google Search Console for indexing, search queries, impressions and clicks.

## 1. Connect GA4

1. In Google Analytics, create or select the HICH GA4 property.
2. Create a Web data stream for `https://hichweb.com`.
3. Copy the Measurement ID, which looks like `G-XXXXXXXXXX`.
4. Set `VITE_GA_MEASUREMENT_ID` in the production build environment, then rebuild and deploy. Vite values are compiled into the browser bundle, so changing the host variable without a new build is not enough.

For a local production build, copy `.env.example` to `.env.local` and set:

```dotenv
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Do not commit `.env.local`. A GA Measurement ID is public by design, but keeping environment-specific configuration outside source prevents accidental cross-property reporting.

The implementation uses basic Consent Mode v2. Until a visitor chooses **Allow analytics**, the Google tag is not requested and analytics storage remains denied. Advertising storage, advertising user data, personalisation and Google signals stay disabled. Visitors can reopen **Privacy choices** at any time.

## 2. What is measured

| Event | Purpose |
| --- | --- |
| `page_view` | Canonical page, title, path and broad page type |
| `generate_lead` | Email, telephone or WhatsApp contact intent, with its broad on-site source |
| `select_content` | Privacy-safe site-search results and quotation project/package choices |
| `site_search`, `site_search_open` | Search use, trigger and result count without the visitor's search text |
| `file_download`, `share` | Quotation/project-plan downloads and sharing methods without filenames or document contents |
| `cta_click` | Important internal calls to action |
| `outbound_click` | External destination domain and non-sensitive link label |
| `form_start` | Start of the quotation brief, project planner or assistant composer without field values |
| `quotation_progress`, `quotation_addon_update` | Quotation step direction and broad selection counts |
| `quotation_pdf_started`, `quotation_complete`, `quotation_action` | PDF preparation, successful completion, copy, restart and share actions |
| `planner_progress`, `planner_complete`, `planner_action` | Project-planner funnel milestones without names, contact details or notes |
| `assistant_open`, `assistant_message`, `assistant_response` | Assistant funnel and response engine without questions or answer text |
| `scroll_depth` | 25%, 50%, 75% and 90% page depth |
| `web_vital` | FCP, LCP, CLS, INP and TTFB field measurements where supported |
| `exception` | Broad runtime failure category without error messages or entered content |

The tracker does not send form values, names, email addresses, telephone numbers, quotation content, site-search text or WhatsApp message URLs.

In GA4 Admin:

- Mark `generate_lead` as a key event.
- Optionally mark `quotation_complete` and `planner_complete` as secondary key events. They are completed planning tools, not confirmed enquiries, so keep them separate from `generate_lead`.
- Create event-scoped custom dimensions only for reports you will use: `method`, `lead_source`, `page_type`, `content_type`, `step_name`, `direction`, `project_type`, `package_id`, `action_name`, `file_context`, `response_engine`, `percent_scrolled`, `metric_name` and `metric_rating`.
- Create a custom metric for `metric_value` if Core Web Vitals reporting is needed inside GA4.
- Configure internal-traffic filtering for the HICH team after testing it in the Testing state.
- Review data retention and access permissions with the business owner.

Useful GA4 Explorations:

- Quotation: `select_content` (project type) -> `select_content` (package) -> `quotation_pdf_started` -> `quotation_complete` -> `generate_lead` where `lead_source` is `quotation_builder`.
- Project planner: `form_start` where `form_name` is `project_planner` -> `planner_progress` -> `planner_complete` -> `generate_lead`.
- Assistant: `assistant_open` -> `assistant_message` -> `assistant_response` -> `generate_lead` where `lead_source` is `assistant`.

GA4 Enhanced Measurement can remain enabled. Its standard outbound-click, download and 90% scroll events are separate from HICH's more specific event names.

## 3. Test without polluting production

For local DebugView testing only, add:

```dotenv
VITE_GA_ENABLE_DEV=true
VITE_GA_DEBUG=true
```

Run the site, choose **Allow analytics**, and inspect GA4 **Admin → DebugView**. Confirm that no Google Analytics request appears before consent and that declining prevents collection. Remove both debug settings after the test. In production, use Realtime and the browser network panel to confirm the deployed Measurement ID.

## 4. Connect Search Console

The preferred setup is a Search Console **Domain property** for `hichweb.com`, verified with the DNS TXT record supplied by Google. Then submit:

```text
https://hichweb.com/sitemap.xml
```

If HTML-tag verification is required instead, set `GOOGLE_SITE_VERIFICATION` to the `content` value only, rebuild and deploy. The build adds the verification meta tag to the homepage. Keep the token deployed while the property is in use.

After both products collect data, link Search Console from **GA4 Admin → Product links → Search Console links**. This account-level connection cannot be completed from website source code.

## 5. Evaluate visibility

Use Search Console to establish a baseline for branded queries (`HICH`, `Hich Web`, `Hich Web Development`) and service queries. Review indexing first, then impressions, click-through rate and landing pages over comparable periods. Use GA4 to measure whether those visits reach contact and quotation actions. Rankings and meaningful trend data take time; repeatedly changing tags or resubmitting the sitemap does not create instant visibility.
