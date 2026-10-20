// Practical scope questions, shared by the visible FAQs and generated metadata.
export const serviceQuestions = {
  'website-development': [
    { question: 'What should we prepare before a website project starts?', answer: 'Bring your current website, the main tasks visitors need to complete, an outline of your services and any approved brand assets. We identify missing copy, photography, account access and reviewers during discovery. A content checklist gives each page an owner and a clear approval point.' },
    { question: 'How do you approach replacing an existing website?', answer: 'We review the current pages and useful URLs before changing the structure. The release plan can include a content inventory, redirect mapping, form testing and an agreed launch window. Domain access, hosting ownership and a rollback route should be confirmed before the old site is replaced.' },
  ],
  'ecommerce-solutions': [
    { question: 'What needs to be decided beyond the storefront design?', answer: 'Product variants, stock ownership, delivery areas, taxes, discounts and returns all affect the buying journey. We also map what your team does when an order arrives, a payment is delayed or an item is unavailable. These decisions become checkout rules, operational screens and test scenarios.' },
    { question: 'How are payments and test orders handled before launch?', answer: 'A payment provider and the necessary merchant account must be agreed first. Where the provider offers a test environment, the scope can cover successful, cancelled and failed payment journeys, order notifications and duplicate callbacks. Live activation and a final controlled order are coordinated with the account owner.' },
  ],
  'web-application-development': [
    { question: 'How do you make sure users only see the right information?', answer: 'We start with a role and permission matrix: which records each role can view, create, edit, approve or export. Those rules need to be enforced by the application server, with interface states that explain unavailable actions. Testing includes attempts to access records outside the permitted role.' },
    { question: 'What happens between a prototype and a usable first release?', answer: 'The prototype establishes the journey; delivery adds the data model, authentication, validation, integrations and operational behaviour. We agree acceptance examples for the main flow and its failure states, then review working increments with the people who will use the product.' },
  ],
  'erp-systems': [
    { question: 'Can our spreadsheet data move into the new system?', answer: 'Migration starts by identifying the source of truth for products, customers, suppliers and opening balances. Sample data is checked for duplicates, missing fields and inconsistent units before an import is designed. A trial migration and reconciled totals should be reviewed by an operational owner before cutover.' },
    { question: 'How do approvals and audit history fit into an ERP?', answer: 'Approval rules should reflect real authority: who can request, who can approve and when a second review is needed. We can scope a history of relevant changes, reasons for rejection and visible status updates. The exact events, retention period and permissions are agreed for each module.' },
  ],
  'ui-ux-design': [
    { question: 'What will our developers receive at handover?', answer: 'The agreed handover can include responsive layouts, reusable components, spacing and typography guidance, interaction notes and a list of open decisions. Empty, loading, error and permission states are considered alongside the main screens so the implementation has more than a polished happy path.' },
    { question: 'How do you check whether the design makes sense to users?', answer: 'We define a few important tasks and review whether a representative user can find and complete them. Depending on scope, this can include guided prototype sessions, an expert review or a structured internal walkthrough. Findings are prioritised by the friction they create, then folded into the next design iteration.' },
  ],
  'mobile-app-development': [
    { question: 'How are smaller screens and unreliable connections considered?', answer: 'We prioritise the main mobile tasks, readable text and comfortable touch controls before adding secondary information. Loading, retry and interrupted-session states are part of the flow. If offline use is required, we define which actions are available and how users see pending synchronisation.' },
    { question: 'What needs planning for a mobile release?', answer: 'Distribution depends on whether the product is a website, progressive web app or store-distributed application. The release scope identifies the device test range, account ownership, permissions, release assets and support responsibilities. Store review timing and third-party approvals remain outside the development team’s direct control.' },
  ],
  'seo-digital-growth': [
    { question: 'What should an initial search improvement plan contain?', answer: 'A useful first plan separates technical access issues, unclear or missing content and measurement gaps. Each item should identify the affected pages, the proposed change and a way to assess it. Priorities follow the site’s goals and evidence from available search data, rather than a generic checklist of keywords.' },
    { question: 'How will we know which enquiries came from search?', answer: 'We can plan meaningful events around completed enquiries and other business actions, subject to the tracking tools and consent approach you choose. Reporting should separate visibility, visits and actual outcomes. Attribution has limits, so a traffic increase alone should not be presented as proof of additional revenue.' },
  ],
  'api-integrations-automation': [
    { question: 'How do you prevent the same event creating duplicate records?', answer: 'The integration needs an agreed record identity and a way to recognise events it has already processed. Depending on the APIs, this can use stable external IDs, idempotency keys or an event log. We also define how conflicting changes are resolved and how a failed event can be replayed safely.' },
    { question: 'Can someone review an automated action before it happens?', answer: 'Yes. A workflow can pause for a human decision before a sensitive action, such as approving a purchase or publishing a change. The scope should cover the reviewer, the information shown, expiry or escalation behaviour and what happens when the request is declined.' },
  ],
  'website-maintenance-support': [
    { question: 'What information helps you investigate an issue?', answer: 'Share the page URL, what you expected, what happened and the steps that reproduce it. A browser and device name, an approximate time and a screenshot of the problem can help. Avoid sharing passwords or private customer records; any necessary account access should use an agreed secure method.' },
    { question: 'How should updates and backups be managed?', answer: 'The maintenance plan should name the owner of each system, the update review process and the backup schedule. For higher-risk changes, a staging check and a rollback route may be appropriate. A backup only becomes a dependable recovery option when restoration has been checked against the agreed needs.' },
  ],
  'digital-product-strategy': [
    { question: 'What can we use after a discovery engagement?', answer: 'Agreed outputs can include a problem statement, key user journeys, a prioritised opportunity list, assumptions to test and a proposed first-release boundary. A decision log explains why choices were made. This material can support an internal investment discussion or a more accurate design and development brief.' },
    { question: 'What if discovery shows that the idea needs to change?', answer: 'That is a useful outcome when it happens before a large build. We make the evidence and remaining assumptions visible, then compare options such as a smaller pilot, a different workflow or using an existing tool. The next investment should follow what has been learned.' },
  ],
  'brand-content-design': [
    { question: 'How does the message become actual website pages?', answer: 'We connect the audience’s questions to a page structure: what visitors need to understand first, what evidence supports the message and what action follows. Key page outlines can then become draft copy, navigation labels, calls to action and reusable patterns for future publishing.' },
    { question: 'How do you keep the brand consistent after launch?', answer: 'A practical guide can document tone, preferred terminology, headline examples, image direction and component usage. It should also explain who approves factual claims and which content needs periodic review. Useful examples help future writers and designers apply the system to new material.' },
  ],
  'technology-stack': [
    { question: 'How do you compare technology choices fairly?', answer: 'We assess the actual product requirements, team familiarity, integration needs, hosting options and expected operating effort. A short decision record describes the options considered, the tradeoffs and the conditions that might justify a different choice later. Popularity alone is not a sufficient reason to add complexity.' },
    { question: 'What belongs in the technical handover?', answer: 'The agreed package can include repository access, environment setup, deployment steps, data model notes and integration ownership. Configuration and secrets need appropriate handling outside public documentation. Monitoring, recovery, licences and responsibility for future dependency updates should have named owners.' },
  ],
};
