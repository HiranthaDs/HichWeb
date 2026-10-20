import { serviceQuestions } from './service-questions.js';

// HICH's public content. Existing project names, destinations and media are
// retained from index.html, home-next.js and allprojects.html. Concept work is
// labelled explicitly; no performance results, awards or endorsements are implied.
export const company = {
  name: 'HICH',
  fullName: 'Hich Web Development',
  legalName: null,
  isRegistered: true,
  registrationStatus: 'HICH is a registered company in Sri Lanka.',
  email: 'info@hichweb.com',
  phone: '+94714112113',
  phoneDisplay: '+94 714 112 113',
  location: 'Sri Lanka',
  domain: 'https://hichweb.com',
  description: 'HICH is a registered web development and digital design company in Sri Lanka, creating websites, online stores, applications and connected business systems for businesses worldwide.',
  alternateNames: ['Hich Web', 'Hich Web Development', 'HichWeb', 'hichweb.com'],
  social: [
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/hichweb/' },
    { name: 'Facebook', url: 'https://www.facebook.com/share/1LaDRLP7Db/?mibextid=wwXIfr' },
    { name: 'WhatsApp', url: 'https://wa.me/94714112113' },
  ],
};

export const services = [
  {
    slug: 'website-development', title: 'Website development', short: 'A presence with purpose.', category: 'Development',
    description: 'Your website should make your business immediately understandable and give people a clear next move. We bring content, expressive design and careful engineering together in a fast, accessible experience for every screen.',
    tags: ['React', 'Responsive design', 'CMS', 'Technical SEO'],
    deliverables: ['Site structure and content plan', 'Distinct desktop and mobile layouts', 'Responsive frontend development', 'CMS integration when required', 'Accessibility and performance checks', 'Search foundations and launch handover'],
    faqs: [
      { question: 'Can HICH rebuild an existing website?', answer: 'Yes. We review the existing content, URLs and customer journeys before planning the new experience. Useful material is retained, and URL changes are mapped so existing links can be redirected.' },
      { question: 'Can we update the website ourselves?', answer: 'Yes, when a content management system is part of the agreed scope. We identify what your team needs to edit, define access and provide a handover for those workflows.' },
    ],
  },
  {
    slug: 'ecommerce-solutions', title: 'E-commerce solutions', short: 'Make every step count.', category: 'Commerce',
    description: 'A considered store connects beautiful product discovery with the practical details of buying. We design the catalogue, product pages and checkout around your customers, then plan how orders move through your business.',
    tags: ['Storefronts', 'Checkout', 'Payments', 'Order management'],
    deliverables: ['Catalogue and product structure', 'Storefront and product page design', 'Cart and checkout journeys', 'Payment provider integration', 'Order and fulfilment workflows', 'Commerce testing and administrator handover'],
    faqs: [
      { question: 'Which e-commerce platform should we use?', answer: 'The choice depends on products, payment availability, fulfilment, integrations, budget and who will run the store. We compare those requirements before recommending a hosted platform or custom implementation.' },
      { question: 'Can you connect our store to inventory or delivery systems?', answer: 'Integrations can be included after reviewing each provider’s API, account access, data model and operational requirements. The scope should also cover failure handling and reconciliation.' },
    ],
  },
  {
    slug: 'web-application-development', title: 'Web applications', short: 'Turn complexity into clarity.', category: 'Development',
    description: 'Build a product around the way people actually work. From a customer portal to an operational dashboard, we connect useful interfaces, clear permissions and dependable data flows in software that can evolve.',
    tags: ['Portals', 'Dashboards', 'APIs', 'Product engineering'],
    deliverables: ['User roles and workflow mapping', 'Interactive product prototypes', 'Frontend and backend implementation', 'Authentication and permission design', 'Data and API integration', 'Testing, deployment and technical handover'],
    faqs: [
      { question: 'What is the difference between a website and a web application?', answer: 'A website mainly helps people discover information and take a simple next step. A web application supports ongoing tasks such as managing records, collaborating, placing complex orders or viewing personalised information.' },
      { question: 'Can we release the product in stages?', answer: 'Yes. We can define an initial release around one complete workflow, then sequence additional features. Each phase needs clear acceptance criteria, dependencies and responsibilities.' },
    ],
  },
  {
    slug: 'erp-systems', title: 'ERP systems', short: 'Connect the moving parts.', category: 'Systems',
    description: 'Give your team a clearer view of the work behind the business. We map the processes, roles and data that matter, then shape connected operational tools for inventory, approvals, reporting and everyday decisions.',
    tags: ['Operations', 'Inventory', 'Approvals', 'Reporting'],
    deliverables: ['Operational discovery and process maps', 'Module and data architecture', 'Role-based workflows and approvals', 'Inventory and reporting interfaces', 'Migration and integration planning', 'User acceptance testing and training'],
    faqs: [
      { question: 'Do we need a custom ERP?', answer: 'Not always. A configured off-the-shelf product may fit standard processes well. Custom development is worth considering when critical workflows, integrations or ownership requirements cannot be met sensibly by an existing product.' },
      { question: 'Can we start with one operational module?', answer: 'Yes. A focused module can be a practical first step, provided shared data, permissions and future connections are designed before implementation.' },
    ],
  },
  {
    slug: 'ui-ux-design', title: 'UI/UX design', short: 'Designed to feel effortless.', category: 'Design',
    description: 'Great interfaces make the next step feel natural. We translate business needs into clear journeys, expressive visual systems and prototypes that expose the difficult questions before development begins.',
    tags: ['UX research', 'Prototypes', 'Design systems', 'Mobile UX'],
    deliverables: ['UX review and discovery', 'Information architecture and user flows', 'Wireframes and interactive prototypes', 'Desktop and mobile interface design', 'Reusable component and interaction guidance', 'Developer handover and design review'],
    faqs: [
      { question: 'Can HICH design a product our own developers will build?', answer: 'Yes. A design engagement can include flows, responsive layouts, component states and implementation notes. We agree the handover format and review process with your development team.' },
      { question: 'Do you design mobile separately?', answer: 'We design around mobile tasks, touch targets, content priority and navigation. That can mean a different arrangement and interaction pattern while keeping the same brand and essential content.' },
    ],
  },
  {
    slug: 'mobile-app-development', title: 'Mobile experiences', short: 'Made for life in motion.', category: 'Development',
    description: 'Small screens deserve their own thinking. We plan mobile experiences around touch, movement and the tasks people need to finish, choosing a responsive web, progressive web app or app approach to suit the product.',
    tags: ['Mobile UX', 'PWA', 'App planning', 'Device workflows'],
    deliverables: ['Mobile product requirements', 'Touch-first flows and prototypes', 'Platform and delivery assessment', 'Responsive or app implementation scope', 'Device and network testing', 'Release and ongoing support planning'],
    faqs: [
      { question: 'Do I need an app or a mobile website?', answer: 'Start with the task. A responsive website is often suitable for discovery and enquiries. Repeat workflows, offline requirements, device integrations or app-store distribution can justify an app.' },
      { question: 'Will every feature work offline?', answer: 'Offline behaviour must be designed explicitly. We identify which data and actions can be available without a connection, how they synchronise and what happens when information conflicts.' },
    ],
  },
  {
    slug: 'seo-digital-growth', title: 'SEO, AEO & growth', short: 'Be easier to discover.', category: 'Growth',
    description: 'Make your expertise easier for people and search systems to understand. We connect crawlable pages, clear brand information, useful answers and purposeful measurement so visibility work has a solid foundation.',
    tags: ['Technical SEO', 'Structured data', 'Content', 'Measurement'],
    deliverables: ['Crawlability and indexability review', 'Metadata and canonical URL planning', 'Structured data matched to page content', 'Search-led content and answer guidance', 'Search Console setup guidance', 'Performance and enquiry measurement plan'],
    faqs: [
      { question: 'Can you guarantee first place on Google?', answer: 'No. Search engines control ranking and indexing. We can improve technical foundations, content clarity and measurement, then use evidence to guide further work.' },
      { question: 'What does AEO mean for a business website?', answer: 'Answer engine optimisation means helping systems find and understand useful answers about your business. Clear service descriptions, accessible content, consistent company details and accurate structured data support this work; inclusion in an AI answer is not guaranteed.' },
    ],
  },
  {
    slug: 'api-integrations-automation', title: 'Integrations & automation', short: 'Less repetition. More flow.', category: 'Systems',
    description: 'Help your tools work together. We connect websites, business applications and external services around defined workflows, with attention to data quality, permissions and the moments when something needs a human decision.',
    tags: ['APIs', 'Webhooks', 'Workflow automation', 'Data mapping'],
    deliverables: ['Workflow and integration discovery', 'API feasibility and access review', 'Data mapping and ownership rules', 'Integration and automation development', 'Error handling and operational logging', 'Monitoring and maintenance documentation'],
    faqs: [
      { question: 'Can every business tool be integrated?', answer: 'It depends on the tool’s API, permissions, commercial plan and data access. We assess those constraints before promising an integration or choosing an alternative workflow.' },
      { question: 'What happens if an external service is unavailable?', answer: 'The design should define timeouts, safe retries, duplicate prevention and a clear recovery route. Critical workflows may also need alerts and a manual fallback.' },
    ],
  },
  {
    slug: 'website-maintenance-support', title: 'Maintenance & support', short: 'Keep moving after launch.', category: 'Support',
    description: 'A launch is the start of an operating product. Keep it useful with an agreed plan for updates, fixes, content changes and performance reviews, and a clear route for turning new requirements into the next release.',
    tags: ['Updates', 'Monitoring', 'Backups', 'Improvement'],
    deliverables: ['Maintenance scope and ownership review', 'Update and dependency planning', 'Backup and recovery requirements', 'Issue triage and agreed fixes', 'Performance and accessibility reviews', 'Prioritised improvement backlog'],
    faqs: [
      { question: 'Is ongoing support included with every project?', answer: 'Support coverage is agreed in the project proposal. The agreement should state the handover period, included tasks, response expectations and how additional work is quoted.' },
      { question: 'Can you maintain a website another team built?', answer: 'Potentially. We first review the code, hosting, dependencies, documentation and account access to understand what can be maintained and whether stabilisation work is needed.' },
    ],
  },
  {
    slug: 'digital-product-strategy', title: 'Digital product strategy', short: 'Find the right first move.', category: 'Strategy',
    description: 'Turn a promising idea into a practical direction. We bring the audience, business goal, constraints and opportunities into focus, then define a first release that can answer real questions and create room for progress.',
    tags: ['Discovery', 'Product direction', 'MVP', 'Roadmaps'],
    deliverables: ['Stakeholder and product discovery', 'Audience and problem definition', 'Feature priorities and assumptions', 'First-release scope', 'Delivery dependencies and roadmap', 'Measures of success and next decisions'],
    faqs: [
      { question: 'What if our idea is still early?', answer: 'That is a useful time for discovery. Bring the problem, the people it affects and the constraints you already know. We can help identify what needs to be learned before committing to a build.' },
      { question: 'What does an MVP actually include?', answer: 'A minimum viable product should complete a useful journey for a defined audience. The scope depends on the assumption being tested, rather than a fixed number of screens or features.' },
    ],
  },
  {
    slug: 'brand-content-design', title: 'Brand & content design', short: 'Give your ideas a voice.', category: 'Design',
    description: 'Create a digital identity people can recognise and understand. We connect positioning, language and visual direction so your website tells a coherent story, from the first headline to the last call to action.',
    tags: ['Positioning', 'Messaging', 'Visual direction', 'Content systems'],
    deliverables: ['Brand and audience discovery', 'Positioning and message hierarchy', 'Digital visual direction', 'Website content structure', 'Key page copy and content guidance', 'Reusable brand and editorial guidelines'],
    faqs: [
      { question: 'Can you work with our existing brand?', answer: 'Yes. We can extend an existing identity into a coherent digital system, using your approved assets and identifying any gaps in typography, imagery, components or content guidance.' },
      { question: 'Who provides the website content?', answer: 'We agree content ownership during planning. Your team provides accurate business facts and approvals; writing, editing, image sourcing and migration can be scoped around that material.' },
    ],
  },
  {
    slug: 'technology-stack', title: 'Technology architecture', short: 'Built on the right decisions.', category: 'Strategy',
    description: 'Choose technology that fits the product and the people who will run it. We consider the interface, data, integrations, deployment and ongoing costs together, making architectural decisions clear before they become expensive to change.',
    tags: ['Architecture', 'Frontend', 'Data', 'Deployment'],
    deliverables: ['Requirements and technical constraints review', 'Platform and stack evaluation', 'Frontend, backend and data architecture', 'Integration and security boundaries', 'Deployment and environment plan', 'Technical documentation and ownership handover'],
    faqs: [
      { question: 'Does every project need React?', answer: 'No. React can be useful for interactive interfaces and component-based products. A simpler static site or an established content platform may better suit a different project. We choose against the requirements.' },
      { question: 'Will we own our code and accounts?', answer: 'Ownership, licences, repository access and hosting accounts should be explicit in the agreement. We plan the handover around those terms so the operating responsibilities are clear.' },
    ],
  },
].map(service => ({ ...service, faqs: [...service.faqs, ...(serviceQuestions[service.slug] || [])] }));

export const projects = [
  {
    slug: 'jnet-printing', name: 'JNET Printing Solutions', category: 'Websites', type: 'Corporate website',
    description: 'A digital home for printing services, product discovery and direct project enquiries.',
    image: '/images/project/optimized/Jnet.webp', alt: 'JNET Printing Solutions website interface',
    url: 'https://jnet-220.netlify.app/', services: ['Website development', 'UI/UX design'],
    tags: ['Service catalogue', 'Responsive design', 'Enquiry flow'], color: '#d8e9e8', featured: true, concept: false,
  },
  {
    slug: 'dsign-productions', name: 'Dsign Productions', category: 'Creative', type: 'Creative portfolio',
    description: 'A cinematic portfolio bringing wedding films and visual stories into focus.',
    image: '/images/project/optimized/Dsign.webp', alt: 'Dsign Productions wedding portfolio interface',
    url: 'https://dsignproductions.com/wedding', services: ['Website development', 'UI/UX design'],
    tags: ['Visual storytelling', 'Portfolio', 'Responsive design'], color: '#e7dcd2', featured: true, concept: false,
  },
  {
    slug: 'creative-manicure', name: 'Creative Manicure Studio', category: 'Creative', type: 'Service website concept',
    description: 'An expressive studio concept built around treatments, visual inspiration and appointment enquiries.',
    image: '/images/project/optimized/project1.webp', alt: 'Creative Manicure Studio concept website',
    url: 'https://hiraaaan.netlify.app/', services: ['UI/UX design', 'Website development'],
    tags: ['Service design', 'Booking journey', 'Mobile UX'], color: '#e4cbd8', featured: true, concept: true,
  },
  {
    slug: 'automotive-marketplace', name: 'Automotive Marketplace', category: 'Platforms', type: 'Marketplace concept',
    description: 'A vehicle discovery concept with clear listings, useful browsing patterns and seller enquiry paths.',
    image: '/images/project/optimized/project5.webp', alt: 'Automotive Marketplace vehicle listings concept',
    url: 'https://hichcar016.netlify.app/', services: ['UI/UX design', 'Web applications'],
    tags: ['Vehicle listings', 'Search UX', 'Enquiries'], color: '#cbd6e4', featured: true, concept: true,
  },
  {
    slug: 'editorial-bridal', name: 'Editorial Bridal Campaign', category: 'Creative', type: 'Campaign concept',
    description: 'An editorial website concept combining occasion photography, confident typography and a focused booking journey.',
    image: '/images/project/optimized/project2.webp', alt: 'Editorial Bridal Campaign interface concept',
    url: '/images/project/optimized/project2.webp', services: ['UI/UX design', 'Brand & content design'],
    tags: ['Art direction', 'Campaign design', 'Editorial'], color: '#e7ddd0', concept: true, previewOnly: true,
  },
  {
    slug: 'autoxo', name: 'Autoxo', category: 'Platforms', type: 'Automotive marketplace',
    description: 'An automotive marketplace bringing together vehicle inventory, brand discovery and import enquiries.',
    image: null, alt: '', identity: 'AX',
    url: 'https://autoxolk.com/', services: ['Web applications', 'UI/UX design'],
    tags: ['Inventory', 'Vehicle discovery', 'Import enquiries'], color: '#dde0e3', concept: false,
  },
  {
    slug: 'miss-piumi', name: 'Miss Piumi', category: 'Commerce', type: 'Cosmetics storefront',
    description: 'A cosmetics shopping experience centred on product discovery, ingredients and the customer journey.',
    image: null, alt: '', identity: 'MP',
    url: 'https://misspiumi.com/', services: ['E-commerce solutions', 'UI/UX design'],
    tags: ['Cosmetics', 'Product content', 'Storefront'], color: '#dfdfc8', concept: false,
  },
  {
    slug: 'automotive-discovery', name: 'Automotive Discovery', category: 'Platforms', type: 'Marketplace concept',
    description: 'An alternative direction for browsing vehicles, comparing listing information and making contact.',
    image: '/images/project/optimized/project6.webp', alt: 'Automotive Discovery marketplace concept',
    url: 'https://hichcar012.netlify.app/', services: ['UI/UX design', 'Website development'],
    tags: ['Discovery', 'Comparison', 'Responsive UI'], color: '#d9dfd8', concept: true,
  },
  {
    slug: 'bridal-dressing', name: 'Bridal Dressing', category: 'Creative', type: 'Service website concept',
    description: 'A visual service concept connecting bridal looks, galleries and appointment enquiries.',
    image: '/images/project/optimized/project7.webp', alt: 'Bridal Dressing service website concept',
    url: 'https://hiraaaaan1.netlify.app/', services: ['Website development', 'UI/UX design'],
    tags: ['Gallery', 'Service content', 'Booking journey'], color: '#e2d1c9', concept: true,
  },
  {
    slug: 'clothing-brand-store', name: 'Clothing Brand Store', category: 'Commerce', type: 'Fashion storefront concept',
    description: 'A fashion store concept built around collections, product filtering and a straightforward shopping journey.',
    image: '/images/project/optimized/project8.webp', alt: 'Clothing Brand Store e-commerce concept',
    url: 'https://wv2025test3.netlify.app/', services: ['E-commerce solutions', 'UI/UX design'],
    tags: ['Fashion', 'Catalogue', 'Commerce UX'], color: '#dcd7ed', concept: true,
  },
  {
    slug: 'janu-auto-garage', name: 'Janu Auto Garage', category: 'Websites', type: 'Service website concept',
    description: 'A workshop website concept presenting vehicle care services and a direct route to booking.',
    image: '/images/project/optimized/project9.webp', alt: 'Janu Auto Garage service website concept',
    url: 'https://janu001.netlify.app/', services: ['Website development', 'UI/UX design'],
    tags: ['Automotive', 'Service website', 'Mobile UX'], color: '#d6deeb', concept: true,
  },
];

export const insights = [
  {
    slug: 'website-redesign-checklist', title: 'A better website starts before the redesign.', category: 'Websites',
    excerpt: 'A practical website redesign checklist: protect what works, find the friction and plan a launch your team can own.',
    readTime: '4 min', date: '2026-10-05',
    body: [
      { heading: 'Start with the reason to change', text: 'A redesign brief needs more than a new visual direction. Identify the business problem: visitors cannot understand the offer, the mobile journey is difficult, content takes too long to update, or the site no longer reflects the company. Choose a small set of outcomes that will let you assess whether the new site helps.' },
      { heading: 'Take an inventory before replacing anything', text: 'Record existing URLs, important pages, downloads, forms, integrations and content owners. Review available search and enquiry data to find pages that already bring value. Mark each page to keep, improve, combine or retire. When an address changes, map the old URL to the most relevant new destination.' },
      { heading: 'Design the journey on each screen', text: 'Write down the main tasks people need to complete. Test the order of information, navigation and calls to action at narrow widths as well as on a large display. Mobile visitors may need shorter introductory content and more immediate contact options, while the core information remains accessible.' },
      { heading: 'Build quality into the acceptance criteria', text: 'Agree how the team will review keyboard navigation, readable contrast, forms, reduced-motion preferences, loading behaviour and real content. Check both successful and unsuccessful form paths. Review search titles, canonical URLs, social previews and redirects alongside the interface.' },
      { heading: 'Plan the day after launch', text: 'Assign responsibility for the domain, hosting, content, code repository and third-party accounts. Confirm how issues are reported and who approves changes. After launch, inspect live pages and forms, submit the sitemap, monitor errors and compare the agreed outcomes over a meaningful period.' },
    ],
  },
  {
    slug: 'web-app-vs-website-vs-mobile-app', title: 'Website, web app or mobile app?', category: 'Product strategy',
    excerpt: 'Choose the right product by looking at the work people need to do, how often they do it and where they do it.',
    readTime: '4 min', date: '2026-10-05',
    body: [
      { heading: 'Choose the job before the format', text: 'A website generally explains, demonstrates and helps a visitor take a next step. A web application supports repeated, personalised work in a browser. A mobile app can suit recurring tasks that benefit from device features or app distribution. These categories overlap, so begin with the user journey rather than a technology preference.' },
      { heading: 'When a website is enough', text: 'A business presenting its services, work and contact details may need a well-designed website. Editorial content, search discovery and accessible enquiry paths are often the priorities. Adding an account system or install requirement without a clear purpose can make a simple task harder.' },
      { heading: 'When a web application makes sense', text: 'Consider a web application when users manage information, collaborate, view personal records or complete multi-step work. Define roles, permissions, data ownership and error states early. The interface is only one part of the product; administration, recovery and support also need a place in the scope.' },
      { heading: 'When to investigate an app', text: 'An app may be useful when frequent use, device capabilities, offline behaviour or distribution requirements matter to the product. Confirm those needs with real workflows. A progressive web app can sometimes meet parts of the requirement, but feature availability and platform behaviour should be checked for the intended devices.' },
      { heading: 'Compare the operating commitment', text: 'Estimate ongoing content work, hosting, testing, support and release responsibilities for each option. Write one complete journey for the first release and compare how each format supports it. A smaller product that solves that journey is a more useful starting point than several unfinished channels.' },
    ],
  },
  {
    slug: 'ecommerce-website-requirements-guide', title: 'Plan the whole store. Not just the storefront.', category: 'Commerce',
    excerpt: 'An e-commerce requirements guide covering products, payments, delivery and the operational decisions behind every order.',
    readTime: '5 min', date: '2026-10-05',
    body: [
      { heading: 'Define who buys and what they buy', text: 'Describe your customers, selling regions and product types. Record variants, stock rules, bundles, price differences and the information someone needs before purchasing. Build a sample catalogue with real products; it will reveal content and administrative needs that a blank design can hide.' },
      { heading: 'Map the checkout decisions', text: 'Agree guest checkout, account requirements, contact information and payment options. Confirm payment-provider availability, account approval and supported currencies directly with the provider. Make space for payment failures, abandoned attempts, confirmation messages and the customer support route.' },
      { heading: 'Follow an order through the business', text: 'Document what happens after payment: stock allocation, packing, dispatch, delivery notifications and order status changes. Include cancellations, returns and refunds in the operational brief. Identify who is allowed to perform each action and which system holds the authoritative order and stock records.' },
      { heading: 'Scope the connections', text: 'List accounting, inventory, shipping and marketing tools. For each integration, identify required data, sync direction, timing, permissions and the fallback when a service is unavailable. Test a realistic order across the connected systems before launch, including an unsuccessful transaction and a refund.' },
      { heading: 'Prepare for a real launch', text: 'Assign owners for product information, photography, customer-facing policies and ongoing catalogue updates. Test navigation, search, product options and checkout on actual mobile devices. Verify order emails and administration access. Define how enquiries and errors will be monitored when the first customers arrive.' },
    ],
  },
  {
    slug: 'custom-erp-vs-off-the-shelf', title: 'Custom ERP or an existing platform?', category: 'Business systems',
    excerpt: 'Compare process fit, implementation effort, data ownership and the cost of change before choosing an operational system.',
    readTime: '4 min', date: '2026-10-05',
    body: [
      { heading: 'Map the process you actually have', text: 'Document the work, people, approvals and information moving through the business. Distinguish essential requirements from habits that could change. Use real examples, including corrections and unusual transactions, rather than a list of desired modules alone.' },
      { heading: 'Evaluate existing products with scenarios', text: 'An established platform can offer useful standard workflows and a maintained product ecosystem. Ask vendors to demonstrate your complete scenarios, including permissions, reporting and data export. Record what works through configuration, what needs extensions and what would require a change in your process.' },
      { heading: 'Understand the custom development commitment', text: 'Custom software can be shaped around important workflows and integrations, but it brings responsibility for specification, testing, maintenance and future change. The initial interface is only part of the investment. Include documentation, operational support and the ability for another team to understand the system.' },
      { heading: 'Compare the full operating picture', text: 'Evaluate subscription and licence terms, implementation work, migration, training, infrastructure, integrations and change requests. Check how easily data can be exported and whether external developers can work on the system. Record the assumptions behind each estimate so options remain comparable.' },
      { heading: 'Reduce uncertainty with a focused trial', text: 'Use one representative workflow to test the strongest option before committing to a full rollout. Include the people who will use and manage it. Define acceptance criteria, migration checks and a fallback plan. A staged rollout can make training and operational changes more manageable.' },
    ],
  },
  {
    slug: 'website-cost-factors-sri-lanka', title: 'What really shapes the cost of a website?', category: 'Planning',
    excerpt: 'For businesses in Sri Lanka, a useful website estimate starts with scope, content, integrations and ownership.',
    readTime: '4 min', date: '2026-10-05',
    body: [
      { heading: 'There is no useful price without a scope', text: 'Website estimates can differ because the underlying work differs. A small brochure site, a store and a customer portal are not equivalent projects. Begin with the audience, main journeys, page types, editing needs and launch requirements. A clear brief helps agencies estimate the same work.' },
      { heading: 'Count the content work', text: 'Writing, editing, photography, translation and content migration take time. Identify what already exists, what can be reused and who will create or approve the missing material. A site with a few carefully produced pages can require more content work than a larger site using ready, structured material.' },
      { heading: 'Describe the interactions and integrations', text: 'Simple enquiry forms differ from account dashboards, conditional applications or connected checkout flows. List external systems and describe the data moving between them. Include administration, validation, permission rules and failure handling, because those details affect both implementation and testing.' },
      { heading: 'Compare inclusions and ongoing costs', text: 'Ask what the estimate includes for discovery, design revisions, development, content entry, testing and handover. Separate initial work from recurring hosting, domain, platform, integration and support costs. Confirm who owns accounts and how future changes are requested.' },
      { heading: 'Use priorities to shape a sensible first release', text: 'If the scope exceeds the available budget, identify the smallest release that still completes a useful customer journey. Defer enhancements with clear dependencies, rather than removing essential quality checks. Request a written scope with assumptions, exclusions and acceptance criteria before agreeing the project.' },
    ],
  },
  {
    slug: 'website-project-brief-template', title: 'A project brief that moves things forward.', category: 'Planning',
    excerpt: 'Capture the essential decisions in a practical website project brief, even when the idea is still taking shape.',
    readTime: '4 min', date: '2026-10-05',
    body: [
      { heading: '1. The business and the change', text: 'Describe the business in plain language. State what needs to change, why the timing matters and what a useful outcome looks like. Include the current website address and any existing brand or content material. Separate confirmed requirements from assumptions and open questions.' },
      { heading: '2. The people and their journeys', text: 'List the main audiences and what each should be able to do. For every important journey, describe the starting point, needed information and desired next action. Include the internal team members who will edit content, respond to enquiries or manage orders.' },
      { heading: '3. The content and capabilities', text: 'Outline page types, languages, content sources and editing requirements. List forms, search, accounts, payments, bookings or other features. Identify integrations, data migration and any existing systems that need to remain in use. Name the owner of each input and approval.' },
      { heading: '4. The constraints and decisions', text: 'Share the target launch date, budget range, stakeholders and external dependencies. Include hosting or procurement requirements and the people authorised to make decisions. If the date is fixed, explain why so scope and sequencing can be planned around it.' },
      { heading: '5. The launch and ongoing responsibility', text: 'Define how the work will be reviewed, which journeys must pass before launch and who signs off. Record ownership of the domain, hosting and accounts. Agree training, documentation, issue reporting and maintenance expectations. Bring the incomplete brief to the first conversation; unanswered questions are useful inputs too.' },
    ],
  },
];

export const faqs = [
  { question: 'What is HICH?', answer: 'HICH, also known as Hich Web Development, is a registered digital design and web development company based in Sri Lanka. We work on websites, online stores, web applications, business systems and the strategy and design around them.' },
  { question: 'Do you work with businesses outside Sri Lanka?', answer: 'Yes. We work with local and international businesses through a remote collaboration process, with scope, feedback and delivery responsibilities agreed at the start.' },
  { question: 'Can you redesign our existing website?', answer: 'Yes. We review the current experience, content and technical setup, then plan improvements to design, usability, speed and search foundations. Valuable existing URLs and content are considered in the migration.' },
  { question: 'Will our website have a dedicated mobile experience?', answer: 'Yes. Mobile navigation, content order, layouts and interactions are designed for touch and smaller screens. The result keeps the same brand while making the experience useful in its own right.' },
  { question: 'How much does a project cost?', answer: 'The price depends on scope, content, integrations, platform and ongoing needs. Share your goals, timing and a budget range so we can define a useful first release and prepare a scoped proposal.' },
  { question: 'Can you help with SEO and AI search visibility?', answer: 'We plan crawlable content, clear company and service information, metadata, structured data and useful answers. These support discoverability, but search engines and AI platforms decide what to index, rank and cite.' },
  { question: 'What happens after launch?', answer: 'We agree handover and ongoing support as part of the project. That can include documentation, updates, fixes, content changes and a plan for continued improvement.' },
];
