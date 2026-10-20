// General planning guidance for the local fallback and AI grounding. These are
// not package inclusions, guarantees, prices or promises made by HICH.
export const practicalKnowledge = [
  {
    id: 'domain-hosting', title: 'Domains, hosting and recurring costs', href: '/technology-stack.html',
    aliases: ['domain', 'hosting', 'ssl', 'dns', 'renewals'],
    match: /\b(domains?|hosting|ssl|dns|renewals?)\b/i,
    text: 'A domain is your website address; hosting runs the website. Plan for domain renewals, hosting, HTTPS, backups and any paid platform or email service. Keep account ownership and renewal responsibilities clear. The right hosting depends on whether the site is mostly content, a store or an application. HICH’s included services and recurring fees must be confirmed in the quotation. Do you already own a domain?',
  },
  {
    id: 'booking', title: 'Booking and appointment planning', href: '/web-application-development.html',
    aliases: ['booking', 'appointment', 'hotel', 'reservation', 'salon', 'clinic'],
    match: /\b(bookings?|appointments?|hotels?|reservations?|salons?|clinics?)\b/i,
    text: 'For bookings, define availability, capacity, time zones, confirmation and cancellation rules first. A simple enquiry form suits manually confirmed requests; live reservations need a shared availability source and protection against double bookings. Deposits, reminders and calendar integrations add separate requirements. For a first release, support one complete booking journey before adding extras. Should customers book instantly or wait for your confirmation?',
  },
  {
    id: 'store-payments', title: 'Store payments and checkout', href: '/ecommerce-solutions.html',
    aliases: ['payment gateway', 'checkout', 'cash on delivery', 'online payments', 'card payments', 'payhere', 'stripe'],
    match: /\b(checkout|payments?|payment gateway|cash on delivery|card payments?|payhere|stripe)\b/i,
    text: 'Choose a payment provider that supports your business location, customers, currencies and settlement needs. Confirm merchant approval, fees and refund handling directly with the provider. Plan successful, failed, pending and duplicate payment states; test them before launch. Cash on delivery or bank transfer may be options if they fit your operations. HICH must confirm any integration in the agreed scope. Where is your business registered, and where will customers pay from?',
  },
  {
    id: 'store-catalogue', title: 'Product catalogues and stock', href: '/ecommerce-solutions.html',
    aliases: ['product catalogue', 'product catalog', 'variants', 'sizes', 'stock', 'inventory', 'sku'],
    match: /\b(catalogue|catalog|variants?|sizes?|stock|inventory|skus?)\b/i,
    text: 'Start with consistent product names, photos, descriptions, prices and stock identifiers. Track variants such as size and colour separately when they have different stock. If several sales channels share inventory, choose one source of truth and define when orders reserve or reduce stock. Imports need a clean template and checks for duplicate records. Will stock be managed in the store, a spreadsheet or an existing business system?',
  },
  {
    id: 'shipping-orders', title: 'Delivery and order fulfilment', href: '/ecommerce-solutions.html',
    aliases: ['shipping', 'delivery zones', 'courier', 'fulfilment', 'order tracking'],
    match: /\b(shipping|couriers?|fulfilment|fulfillment|order tracking|delivery zones?|delivery charges?)\b/i,
    text: 'Define delivery areas, rates, pickup options and who prepares each order. Customers should see delivery charges before payment and receive a clear order confirmation. Courier tracking depends on the selected provider and its integration options. Also plan failed deliveries, returns and stock updates so the process works beyond checkout. Are you delivering locally, nationwide or internationally?',
  },
  {
    id: 'seo-foundations', title: 'SEO and search visibility basics', href: '/seo-digital-growth.html',
    aliases: ['seo', 'google', 'ranking', 'rank', 'search visibility', 'aeo', 'indexing'],
    match: /\b(seo|google|ranking|rank|search visibility|aeo|indexing)\b/i,
    text: 'Start with useful service or product pages, descriptive titles, crawlable links, accurate business details and a fast mobile experience. Check indexing in Search Console and measure relevant enquiries, not rankings alone. Structured data should match visible page content. Search engines decide rankings and inclusion in AI answers; neither is guaranteed. For an existing site, investigate indexing and content gaps before adding more pages. Which service or product should customers find first?',
  },
  {
    id: 'security', title: 'Website and application security', href: '/website-maintenance-support.html',
    aliases: ['security', 'secure', 'hacked', 'passwords', 'authentication', 'login', 'permissions'],
    match: /\b(security|secure|hacked|passwords?|authentication|login|permissions?)\b/i,
    text: 'Useful foundations include HTTPS, updated dependencies, strong administrator authentication, least-privilege access, validated input and tested backups. Keep secrets on the server and avoid storing payment-card details yourself. Applications also need checks that each user can access only the correct records. The exact controls depend on the system and data; no website can be promised completely hack-proof. What kind of accounts or sensitive data will your project handle?',
  },
  {
    id: 'performance', title: 'Website speed and performance', href: '/website-development.html',
    aliases: ['speed', 'slow', 'performance', 'core web vitals', 'loading'],
    match: /\b(speed|slow|performance|core web vitals|loading)\b/i,
    text: 'Measure the slow pages on mobile first. Common improvements include smaller correctly sized images, less unused JavaScript, sensible caching, fewer third-party scripts and faster server responses. Prioritise the page’s main content and reserve image space to prevent layout jumps. Test real customer journeys after changes, especially menus, forms and checkout. Is the slowdown on the first page load or during a particular action?',
  },
  {
    id: 'mobile-choice', title: 'Mobile website, PWA or app', href: '/mobile-app-development.html',
    aliases: ['mobile', 'responsive', 'android', 'ios', 'pwa', 'offline', 'app store'],
    match: /\b(mobile|responsive|android|ios|pwa|offline|app store)\b/i,
    text: 'A responsive website is often a sensible starting point for browsing, enquiries and shopping. A PWA can add an installable experience and selected offline behaviour. Native apps may fit deeper device features or app-store distribution. Offline work needs explicit rules for cached data, queued actions and conflicts when reconnecting. Choose around the customer’s task and ongoing maintenance budget. Which feature would require an app instead of a mobile website?',
  },
  {
    id: 'automation-workflows', title: 'Automation and connected workflows', href: '/api-integrations-automation.html',
    aliases: ['automation', 'automate', 'webhook', 'crm', 'notifications', 'whatsapp api', 'email automation'],
    match: /\b(automation|automate|webhooks?|crm|notifications?|whatsapp api|email automation)\b/i,
    text: 'Map one workflow from trigger to result: for example, a website enquiry creates a CRM record and alerts the right person. Define required fields, account permissions, duplicate handling, retries and a visible failure queue. WhatsApp, email and other providers have their own access, consent and usage requirements. Keep a manual recovery path for important actions. Which tools need to connect, and what event should start the automation?',
  },
  {
    id: 'accessibility', title: 'Accessible website experiences', href: '/ui-ux-design.html',
    aliases: ['accessibility', 'accessible', 'screen reader', 'keyboard', 'contrast'],
    match: /\b(accessibility|accessible|screen readers?|keyboard|contrast)\b/i,
    text: 'Plan clear headings, meaningful links, labelled form fields, readable contrast and visible keyboard focus. Menus, dialogs and checkout should work without a mouse, and important images need useful text alternatives. Combine automated checks with keyboard and assistive-technology testing; a scanner alone cannot prove accessibility. Any formal conformance target and audit scope need explicit agreement. Which customer journey should be checked first?',
  },
  {
    id: 'content-cms', title: 'Editing content and CMS handover', href: '/website-development.html',
    aliases: ['cms', 'edit content', 'update content', 'update the website', 'change text', 'wordpress', 'content management'],
    match: /\b(cms|edit (?:the )?(?:content|website|text)|update (?:the )?(?:content|website)|change (?:the )?(?:text|photos|content)|wordpress|content management)\b/i,
    text: 'A CMS can let your team update agreed content such as pages, articles, products and images. Define editor roles, reusable layouts, image guidance and an approval process so updates stay consistent. Ask for a handover covering everyday tasks, backups and who handles technical changes. HICH offers CMS integration when it is included in the agreed scope. What should your team be able to edit without developer help?',
  },
  {
    id: 'migration-redesign', title: 'Redesign and migration planning', href: '/website-development.html',
    aliases: ['redesign', 'rebuild', 'migrate', 'migration', 'existing website', 'redirects'],
    match: /\b(redesign|rebuild|migrate|migration|redirects?)\b/i,
    text: 'Before rebuilding, inventory the current pages, content, search traffic, forms and integrations. Keep useful URLs where possible and map redirects for changed addresses. Plan data migration, backups, testing and a rollback option before switching the live site. A redesign should solve a clear user or business problem, not just change colours. What is the biggest problem with the current website?',
  },
  {
    id: 'analytics-conversion', title: 'Analytics and enquiry measurement', href: '/seo-digital-growth.html',
    aliases: ['analytics', 'conversion', 'tracking', 'leads', 'enquiries', 'measure'],
    match: /\b(analytics|conversion|tracking|leads|enquiries|measure)\b/i,
    text: 'Choose a few useful outcomes such as completed enquiries, booking requests or purchases. Track the steps leading to those outcomes and check where visitors leave. Use clear calls to action, focused pages and short forms, then test improvements against real results. Analytics should avoid unnecessary personal data and follow applicable consent requirements. What action matters most when someone visits your website?',
  },
  {
    id: 'multilingual', title: 'Multilingual websites and content', href: '/website-development.html',
    aliases: ['multilingual', 'translation', 'languages', 'sinhala', 'tamil', 'english'],
    match: /\b(multilingual|translation|languages?|sinhala|tamil|english)\b/i,
    text: 'A multilingual site needs translated content, suitable fonts, a clear language switcher and a plan to keep every version updated. Give each language stable page URLs and language metadata. Human review is useful for names, local phrasing and important policies. Agree which pages and workflows need each language before estimating the work. Which languages do your customers use?',
  },
  {
    id: 'mvp-budget', title: 'A focused first release', href: '/digital-product-strategy.html',
    aliases: ['mvp', 'small budget', 'limited budget', 'first release', 'startup', 'stages', 'phases'],
    match: /\b(mvp|small budget|limited budget|first release|startup|stages|phases)\b/i,
    text: 'Choose one audience, one problem and one complete workflow for the first release. Separate essential features from later ideas, reuse proven tools where they fit and plan a small set of success measures. A smaller scope can reduce initial effort, but hosting, support and provider subscriptions still need a budget. HICH must confirm the actual price and schedule from your brief. What must users be able to finish on day one?',
  },
  {
    id: 'maintenance-backups', title: 'Maintenance, backups and recovery', href: '/website-maintenance-support.html',
    aliases: ['maintenance', 'backup', 'backups', 'support', 'after launch', 'restore', 'downtime'],
    match: /\b(maintenance|backups?|support|after launch|restore|downtime)\b/i,
    text: 'A maintenance plan can cover updates, monitoring, backups, restore checks and agreed support tasks. Clarify who receives alerts, how urgent issues are reported, what response times are agreed and which changes need a separate quote. Keep backups separate from the live system and test recovery. HICH’s support coverage depends on the accepted agreement; do not assume round-the-clock support. Which platform needs care, and what is the main concern?',
  },
  {
    id: 'project-content', title: 'Preparing content for a website', href: '/brand-content-design.html',
    aliases: ['photos', 'images', 'copywriting', 'content', 'logo', 'branding'],
    match: /\b(photos|images|copywriting|content|logo|branding)\b/i,
    text: 'Prepare your business description, service or product details, contact information, brand assets and clear customer calls to action. Use images you own or have permission to publish, and provide real testimonials only with consent. A page-by-page content checklist helps avoid launch delays. Writing, photography and branding responsibilities should be stated in the scope. Do you already have your logo, text and photos ready?',
  },
  {
    id: 'portal-roles', title: 'Customer portals and dashboards', href: '/web-application-development.html',
    aliases: ['portal', 'dashboard', 'user roles', 'customer account'],
    match: /\b(portals?|dashboards?|user roles|customer accounts?)\b/i,
    text: 'Start a portal with its users and their main tasks: viewing orders, submitting requests, sharing documents or managing records. Define roles, permissions, notifications and the data each screen needs. Build one complete workflow first, including validation, empty states and failure handling. Administrative screens need the same care as customer-facing pages. Who will use the portal, and what should each person be allowed to do?',
  },
  {
    id: 'technology-choice', title: 'Choosing a technology stack', href: '/technology-stack.html',
    aliases: ['react', 'framework', 'technology stack', 'backend', 'database', 'shopify'],
    match: /\b(react|framework|technology stack|backend|database|shopify)\b/i,
    text: 'Choose technology around the required workflows, integrations, editing needs, security and the team maintaining it. A hosted platform can simplify common commerce tasks; a CMS suits regular publishing; custom applications support specialised workflows. Compare total operating costs and portability as well as the initial build. HICH’s final recommendation needs a project review. What existing tools or technical requirements must the project work with?',
  },
];
