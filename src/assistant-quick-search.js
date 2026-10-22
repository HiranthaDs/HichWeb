import { company, services } from './data.js';

// These displayed quick searches are intentionally answered in the browser.
// Keep each answer self-contained so selecting a suggestion never requires an
// external AI request. Questions outside this list use normal chat routing.
export const siteQuickSearches = [
  {
    question: 'How do I start a project?',
    answer: `Prepare a short brief with:

- **Your business and audience**.
- **The goal** and problem to solve.
- **Essential features** for the first release.
- Existing content, brand assets and connected tools.
- Your **target launch date** and **budget range**.

HICH’s process is **Discover → Design → Develop → Launch & evolve**. Scope, price and schedule are confirmed from the brief.

The **Start a project** page helps prepare it. Your draft stays in your browser until you choose to copy, download, email or open it in WhatsApp.

What are you hoping to build, and who is it for?`,
    sources: [{ title: 'Start a project', href: '/contact.html' }, { title: 'How a HICH project works', href: '/process.html' }],
  },
  {
    question: 'What services do you provide?',
    answer: `HICH helps plan, design, build and maintain digital products. Services include:

${services.map(service => `- **${service.title}**`).join('\n')}

Tell me what customers or your team need to do, and I can suggest a suitable starting point.`,
    sources: [{ title: 'Explore all services', href: '/services.html' }],
  },
  {
    question: 'How do you build e-commerce websites with payment gateways?',
    answer: `HICH starts by defining your products, stock, delivery rules, customers and order workflow. We then design and build the storefront, product catalogue, cart and checkout, and connect an approved payment gateway using the provider’s secure integration.

The build covers successful, failed, pending and duplicate payment states, order confirmation and provider notifications. We test the full checkout in the gateway’s sandbox before launch. The right gateway depends on your business location, currencies, fees, settlement and refund needs. Merchant approval and charges come from the provider, while the exact integration and support are confirmed in your HICH project scope.`,
    sources: [{ title: 'E-commerce solutions', href: '/ecommerce-solutions.html' }],
  },
  {
    question: 'What is your WhatsApp number?',
    answer: `Here is HICH’s WhatsApp number:\n\n**WhatsApp:** ${company.phoneDisplay}\n\nUse the WhatsApp button below to start a conversation.`,
    sources: [{ title: 'Contact HICH', href: '/contact.html' }],
  },
];

const normaliseQuestion = value => String(value || '').toLowerCase().replace(/e-commerce/g, 'ecommerce').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const quickSearchByQuestion = new Map(siteQuickSearches.map(item => [normaliseQuestion(item.question), item]));

export function findSiteQuickSearch(question) {
  return quickSearchByQuestion.get(normaliseQuestion(question)) || null;
}
