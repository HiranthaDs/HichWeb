// These are illustrative service scenarios, never client results or promised scope.
export const experienceContent = {
  'website-development': {
    eyebrow: 'A WEBSITE WITH SOMEWHERE TO GO', title: ['MORE THAN', 'A FIRST IMPRESSION.'],
    intro: 'Let people understand what you do, feel what makes you different and find their next step. Every page connects the story to a useful action.',
    demoTitle: 'One idea. Every screen.', demoDescription: 'Switch the screen size and explore the sample collection. Content and navigation adapt to the available space.',
    chapters: [
      ['A story with a clear structure', 'We start with the questions your visitors bring: what you offer, who it is for, why it matters and how to begin. A content map gives each page a purpose, connects related information and makes navigation feel predictable.'],
      ['A system your team can use', 'Editable content is planned around real tasks, from publishing a case study to changing a service description. Reusable page sections, image guidance and sensible content limits help future updates stay consistent with the design.'],
      ['Ready for the real world', 'Forms, empty states, long headlines and slower connections deserve the same attention as the homepage. We plan the launch around agreed browser checks, working redirects, search metadata and clear ownership of domains and hosting.'],
    ],
    details: [
      ['When is a rebuild the right move?', 'A rebuild makes sense when the existing structure prevents useful change. We first review content worth keeping, pages that people already find and the tasks that currently break down, so the brief solves a specific problem.'],
      ['What does your team bring?', 'Business information, existing brand assets, access to current platforms and a content approver. We identify missing copy or imagery early and agree whether HICH or your team will create it.'],
      ['What happens after launch?', 'You receive the agreed account access, editing guidance and a record of key decisions. Analytics, content reviews and maintenance can become a separate plan with a named owner and clear cadence.'],
    ],
  },
  'ecommerce-solutions': {
    eyebrow: 'DISCOVERY TO DOORSTEP', title: ['GOOD PRODUCTS.', 'GREAT JOURNEYS.'],
    intro: 'A store is both an experience and an operation. We connect the moment someone discovers a product with the details your team needs to deliver it.',
    demoTitle: 'A little retail therapy.', demoDescription: 'Choose a colour, adjust the quantity and add a sample product to the bag. All prices and products here are fictional.',
    chapters: [
      ['Make a catalogue feel curated', 'Collections, filters and product information should reflect how people shop. We map variants, sizing, imagery and availability so customers can compare options without losing the details that make the product special.'],
      ['Give checkout a clear path', 'We work through guest checkout, addresses, delivery choices, payment status and confirmation. Important costs belong where customers can understand them, and interrupted or declined payments need a helpful route back.'],
      ['Connect the work behind the order', 'An order needs to reach the right people with the right information. Stock reservations, fulfilment statuses, refunds and provider connections are scoped together so the storefront and the operating process stay aligned.'],
    ],
    details: [
      ['How do we choose a commerce platform?', 'We compare catalogue complexity, local payment availability, shipping rules, subscription costs and your team’s operating needs. The best fit may be a configured store, a custom storefront or a more specialised implementation.'],
      ['What about unusual buying journeys?', 'Wholesale accounts, made-to-order items, subscriptions and multi-location stock introduce different rules. We document those paths before committing to a checkout or integration approach.'],
      ['What do we check before opening?', 'The agreed checks include test orders, payment failure, confirmation messages, stock updates and mobile checkout. Provider sandbox tests and production activation are separate steps with clear responsibilities.'],
    ],
  },
  'web-application-development': {
    eyebrow: 'SOFTWARE WITH A HUMAN SIDE', title: ['COMPLEX WORK.', 'CLEAR INTERFACES.'],
    intro: 'A portal should bring the next decision into focus. We turn roles, records and business rules into working products that make sense to the people using them.',
    demoTitle: 'From request to resolution.', demoDescription: 'Act as a team member to submit a sample request, then switch to a manager to approve it. See how the interface changes with responsibility.',
    chapters: [
      ['One complete workflow first', 'We define the start, finish and exceptions for an important task before multiplying features. A focused first release can cover a useful journey with permissions, notifications and a dependable record of what happened.'],
      ['The right view for each role', 'Customers, operators and administrators often need different views of the same information. We map what each role can see, change and approve, then apply those rules to the interface and server-side implementation.'],
      ['Built for change over time', 'Reusable components, clear data boundaries and documented integration contracts help new features fit the existing product. We consider loading, empty and error states alongside the successful path.'],
    ],
    details: [
      ['Can this replace our spreadsheets?', 'Sometimes the best starting point is one recurring spreadsheet workflow with clear ownership. We examine formulas, duplicated records, import requirements and approval habits before designing a replacement.'],
      ['How are access and data handled?', 'Authentication, authorisation, retention and recovery requirements are defined in discovery. The prototype demonstrates a role-based interface; production permissions must also be enforced by the application backend.'],
      ['How do releases stay manageable?', 'We agree acceptance criteria, environments and a release checklist. Features are grouped around complete tasks, with technical documentation and operational handover included in the delivery plan.'],
    ],
  },
  'erp-systems': {
    eyebrow: 'YOUR BUSINESS. JOINED UP.', title: ['LESS CHASING.', 'MORE KNOWING.'],
    intro: 'Inventory, purchasing and approvals should tell the same story. Start with one connected workflow, then build an operational system around how your organisation really works.',
    demoTitle: 'Meet your operations workspace.', demoDescription: 'Explore the modules, receive a stock shipment and approve a purchase. The dashboard updates as you work. Every record is sample data, stored only for this visit.',
    chapters: [
      ['Inventory you can trace', 'A stock total is only useful when the movements behind it are clear. We map items, locations, receipts, reservations and adjustments so teams can understand availability and investigate differences without piecing together separate spreadsheets.'],
      ['Approvals with accountability', 'Purchase requests, spending limits and exceptional cases need explicit rules. We define who submits, who approves, what information a decision requires and how the resulting activity is recorded for the people responsible.'],
      ['Reporting connected to the work', 'Operational dashboards should explain a decision, not simply display numbers. We agree definitions, source records and refresh expectations for each view, connecting summaries to the inventory, orders or approvals that produced them.'],
    ],
    details: [
      ['Where does an ERP project start?', 'With the people doing the work. We map a representative process, identify the system of record and review current spreadsheets or software. A pilot module gives the team something concrete to validate before a wider rollout.'],
      ['How does existing data move across?', 'Migration starts with field mapping, duplicate checks and sample imports. The cutover plan defines a verification owner, a freeze window if needed, and a way to reconcile important balances against the original records.'],
      ['What about branches and different roles?', 'Locations, business units and access boundaries should be designed together. We document shared information, local responsibilities and approval exceptions so the system does not depend on a single administrator’s memory.'],
    ],
  },
  'ui-ux-design': {
    eyebrow: 'EVERY INTERACTION HAS A REASON', title: ['FIND THE FLOW.', 'FEEL THE DIFFERENCE.'],
    intro: 'Design makes complexity easier to navigate. We work through real journeys, test the uncertain moments and turn the resulting decisions into an interface your team can build.',
    demoTitle: 'Three steps. One clear outcome.', demoDescription: 'Try a small booking prototype. Choose a session, select a time and review the result. This is a design example; it does not make a real booking.',
    chapters: [
      ['Understand the friction', 'A useful design brief starts with the task, audience and context. Existing feedback, stakeholder interviews and a journey review help us distinguish a visual issue from a problem in the flow, language or information structure.'],
      ['Make the unknown visible', 'Wireframes and clickable prototypes let the team try an idea before engineering it. We explore the important forks in the journey, content hierarchy and recovery paths, then use feedback to shape the next iteration.'],
      ['Design beyond a single screen', 'A reusable system includes typography, spacing, components and interaction states. Responsive behaviour, keyboard focus, validation and empty states become part of the handover, giving developers decisions they can implement consistently.'],
    ],
    details: [
      ['What can we validate in a prototype?', 'A prototype can reveal whether people understand labels, find the next step and complete a proposed journey. It does not prove backend reliability or production performance; those require a working implementation.'],
      ['Can the existing interface be improved?', 'Yes. An audit can identify high-friction flows and inconsistent patterns, then prioritise focused changes. We agree whether the engagement covers visual refinement, a specific journey or a broader product redesign.'],
      ['What does the development team receive?', 'Agreed deliverables can include design files, component variants, responsive layouts, behaviour notes and an asset library. Design review during implementation helps resolve the details that only become visible in a browser.'],
    ],
  },
  'mobile-app-development': {
    eyebrow: 'SMALL SCREEN. BIG CONSIDERATION.', title: ['MADE TO MOVE', 'WITH YOUR PEOPLE.'],
    intro: 'A mobile product belongs in someone’s day. We design for one hand, interrupted attention, changing networks and the tasks people need to finish wherever they are.',
    demoTitle: 'A field day, without the friction.', demoDescription: 'Turn the sample connection off, complete a task and reconnect. The phone shows how queued changes can become synced activity.',
    chapters: [
      ['Choose the right delivery model', 'A responsive site, progressive web app and native app solve different problems. We assess repeat usage, device features, distribution, update needs and budget before agreeing a practical implementation approach.'],
      ['Design for real conditions', 'Mobile flows need clear priorities and forgiving touch targets. We consider a task interrupted by a call, a weak connection, long content and the moments when a user needs to resume without starting again.'],
      ['Be explicit about offline work', 'Offline support needs rules for cached information, pending changes and conflicting edits. We identify which actions are safe to queue, what requires a connection and how the interface explains the difference.'],
    ],
    details: [
      ['Which devices are included?', 'We agree a representative device and browser matrix, operating-system requirements and any tablet layouts. Features such as camera access or notifications require platform-specific checks before scope is finalised.'],
      ['How do app releases work?', 'Store distribution introduces account setup, review requirements and release ownership. These dependencies are planned alongside implementation; a web-delivered product follows a different publishing and update process.'],
      ['How does a queued action recover?', 'A production design defines retries, duplicate prevention, conflict resolution and a visible status. The sample here illustrates the interface; the final sync rules depend on the data and business process.'],
    ],
  },
  'seo-digital-growth': {
    eyebrow: 'CLEARER CONTENT. STRONGER FOUNDATIONS.', title: ['BE FOUND.', 'BE UNDERSTOOD.'],
    intro: 'Visibility starts with information worth finding. We bring technical structure, useful content and measurement together so your website can explain your expertise clearly.',
    demoTitle: 'Shape your first introduction.', demoDescription: 'Edit a sample page title and description to see how the message could appear. Search engines may display different text; this is a visual preview.',
    chapters: [
      ['Help systems reach the content', 'We review crawling and indexing foundations, including page status, internal links, canonicals and sitemap coverage. The goal is a coherent set of accessible pages with clear signals about which content should be discovered.'],
      ['Answer the useful questions', 'Service pages should explain who a service is for, what the work involves and what affects the next decision. We organise relevant questions and factual business information into readable content without turning the page into a list of keywords.'],
      ['Measure what changes a decision', 'Useful reporting connects discovery with meaningful actions such as enquiries or purchases. We agree the measurement plan, baseline and review cadence so changes can be evaluated without treating a single ranking as the whole story.'],
    ],
    details: [
      ['What can structured data do?', 'Structured data can describe information already visible on a page in a machine-readable format. It must be accurate and appropriate to the content; markup does not guarantee a rich result, ranking or AI citation.'],
      ['How is content prioritised?', 'We consider audience questions, existing page quality, business relevance and available evidence. A focused improvement to a useful page can be a better first step than producing a large number of thin articles.'],
      ['What does a practical review include?', 'An agreed review may combine Search Console observations, technical issues, enquiry data and content opportunities. Findings become a prioritised action list with owners, rather than a report disconnected from implementation.'],
    ],
  },
  'api-integrations-automation': {
    eyebrow: 'CONNECT THE TOOLS. FREE THE PEOPLE.', title: ['LESS COPY.', 'MORE CONNECTED.'],
    intro: 'A useful automation moves the right information to the right place and knows when to ask for help. We design the happy path and the moments when a service does not respond.',
    demoTitle: 'Follow the flow.', demoDescription: 'Run a sample order through a four-step workflow. Simulate an unavailable system to see the process pause, then recover with a retry.',
    chapters: [
      ['Start with data ownership', 'Before connecting two tools, we identify the source of truth for each field. IDs, formats, update rules and required values are mapped explicitly so an integration does not quietly create competing versions of the same record.'],
      ['Connect events to outcomes', 'A new enquiry can create a CRM record, a confirmed payment can release an order, and a stock change can update a catalogue. Each workflow begins with a defined trigger and ends with a result someone can verify.'],
      ['Make failures understandable', 'External systems will sometimes be slow or unavailable. We plan timeouts, safe retries, duplicate prevention and visible logs, giving the operating team a way to understand what happened and recover the affected work.'],
    ],
    details: [
      ['What needs to be checked first?', 'API documentation, account permissions, rate limits, commercial-plan access and test environments. A feasibility review identifies what is supported before the implementation depends on a provider’s capabilities.'],
      ['Can a workflow keep a human approval?', 'Yes. Approval thresholds, exceptions and review queues can be part of the design. Automation should reduce repetitive work while preserving the decisions that require context or accountability.'],
      ['Who owns an integration after launch?', 'We agree responsibility for credentials, monitoring, provider changes and operational recovery. Documentation should cover the data mapping, expected events and the practical steps for investigating a failed run.'],
    ],
  },
  'website-maintenance-support': {
    eyebrow: 'THE NEXT CHAPTER STARTS AT LAUNCH', title: ['KEEP IT HEALTHY.', 'KEEP IT MOVING.'],
    intro: 'A dependable website needs attention after the big reveal. We turn maintenance, small improvements and incident response into an agreed operating rhythm.',
    demoTitle: 'A calmer maintenance routine.', demoDescription: 'Run an illustrative review and inspect the findings. Apply the sample update to see how a maintenance task moves through the workflow.',
    chapters: [
      ['Know what is being looked after', 'We begin with hosting, dependencies, accounts and the current state of the code. A clear inventory makes it easier to define coverage, identify inherited issues and establish which tasks need a separate stabilisation project.'],
      ['Change with a recovery plan', 'Routine updates should have a place to be checked before release. We agree backup expectations, staging access and a recovery process, then document important changes so the next person can understand what was done.'],
      ['Turn feedback into improvements', 'Support requests are more useful when they have context, impact and a clear owner. We separate fixes from new requirements and maintain a prioritised improvement list so the product can evolve without an unclear queue of small requests.'],
    ],
    details: [
      ['What is included in a support plan?', 'Coverage depends on the agreement: the platform, included tasks, working hours, response expectations and escalation route. A response commitment and a resolution target are different, and both should be stated clearly.'],
      ['How are urgent issues handled?', 'We agree how to report an incident, what information to include and who can authorise changes. The first step is to understand the affected journey, severity and available recovery options.'],
      ['Can we bring an existing website?', 'Yes, subject to an initial review. Repository access, hosting details, dependency history and documentation help us understand the system and identify any work needed before ongoing maintenance is practical.'],
    ],
  },
  'digital-product-strategy': {
    eyebrow: 'MAKE THE FIRST MOVE COUNT', title: ['BIG AMBITION.', 'A SMART FIRST STEP.'],
    intro: 'A strong roadmap starts with choices. We help define the audience, test the assumptions and shape a useful first release before the feature list takes over.',
    demoTitle: 'Build a first-release plan.', demoDescription: 'Choose the capabilities that belong in a sample customer portal. Move from a focused foundation to a broader release and see the planning implications.',
    chapters: [
      ['Frame a problem worth solving', 'We bring the audience, current alternatives and desired outcome into one brief. Stakeholder assumptions become explicit questions, helping the team decide what needs evidence before committing to design or development.'],
      ['Prioritise a complete journey', 'A first release should let a specific user achieve something meaningful. We distinguish essential steps from useful additions, then map dependencies and operational requirements that a feature list alone can hide.'],
      ['Build a roadmap around learning', 'A roadmap works best when each phase has a purpose and a decision to inform. We define signals to observe, owners for the work and review points where new evidence can change the next investment.'],
    ],
    details: [
      ['What should we bring to discovery?', 'Your business goal, what you know about the audience, current processes and practical constraints. Early research, examples and access to relevant stakeholders help turn opinions into a more useful set of questions.'],
      ['How are cost and timing discussed?', 'Scope, dependencies and uncertainty shape an estimate. Discovery helps make these visible; implementation pricing and schedules follow a defined brief, rather than being inferred from a sample feature selector.'],
      ['What do we have at the end?', 'An agreed problem statement, prioritised journeys, a first-release scope and a record of assumptions. Depending on the engagement, this can include a prototype, technical recommendations and a phased delivery plan.'],
    ],
  },
  'brand-content-design': {
    eyebrow: 'SAY SOMETHING. LOOK LIKE YOU MEAN IT.', title: ['A CLEAR VOICE.', 'A LASTING FEELING.'],
    intro: 'Your identity lives in the little choices: a headline, a colour, a button, a sentence. We bring them together into a digital presence that feels unmistakably yours.',
    demoTitle: 'Same idea. Different energy.', demoDescription: 'Play with visual direction and tone of voice. See how type, colour and language work together to change the feeling of a fictional brand.',
    chapters: [
      ['Find the point of difference', 'We explore the audience, the offer and the evidence behind it. Positioning becomes a useful message hierarchy: what to say first, what to explain next and which specific details make the promise believable.'],
      ['Make the identity work online', 'A digital direction connects type, colour, imagery and layout with the way people use a website. We consider dense content, small screens and interactive states so the identity has range beyond a single beautiful poster.'],
      ['Give the team a shared language', 'A content system helps different writers sound like the same organisation. Tone examples, page structures, terminology and editing guidance turn a one-off writing exercise into a foundation your team can keep using.'],
    ],
    details: [
      ['What if we already have an identity?', 'We begin with your existing guidelines and approved assets. The work can focus on extending them into a stronger digital system, filling gaps in typography, content hierarchy and interaction without rebuilding the whole brand.'],
      ['How is content written and approved?', 'We agree a factual source, an approver and a review sequence. Drafts develop around the page structure, with business claims verified by your team and the key journeys reviewed in context.'],
      ['What does a useful brand handover contain?', 'Practical guidance: approved type and colour usage, content patterns, voice examples and reusable assets within the agreed scope. The aim is to help the next page, campaign or update feel part of the same story.'],
    ],
  },
  'technology-stack': {
    eyebrow: 'DECISIONS THAT SUPPORT WHAT COMES NEXT', title: ['THE RIGHT STACK.', 'FOR YOUR REALITY.'],
    intro: 'Good architecture balances what the product needs today with what the team can operate tomorrow. We make the choices, dependencies and trade-offs visible.',
    demoTitle: 'Explore the layers.', demoDescription: 'Switch between a content website, a customer portal and an operations platform. Select a layer to explore its role and the decisions it introduces.',
    chapters: [
      ['Requirements before preferences', 'We compare the content model, interactions, data sensitivity, integrations and operating constraints. The architecture follows those needs, including who will maintain the product and which capabilities already exist in the organisation.'],
      ['Draw clear system boundaries', 'Interface, application logic, data and external services need defined responsibilities. We document how information moves between them, where access is checked and how the system behaves when a dependency fails.'],
      ['Plan the life after deployment', 'Environments, release ownership, observability and recovery are architectural decisions too. We consider recurring costs, account access and documentation so the product has an operating model as well as a technology diagram.'],
    ],
    details: [
      ['How are technology options compared?', 'Against the requirements, team skills, ecosystem fit and total operating effort. We document why an option was chosen and the trade-offs accepted, so the decision can be revisited when the product changes.'],
      ['When does a system need to scale?', 'We define likely workloads and the consequences of growth before adding complexity. Performance targets, measurement and a clear path for change are more useful than assuming every project needs a distributed architecture.'],
      ['What makes ownership clear?', 'Repository access, licences, hosting accounts, third-party subscriptions and deployment instructions should have explicit owners. The technical handover documents these responsibilities alongside the system’s key components.'],
    ],
  },
};
