import { company, services, insights, faqs } from './data.js';

export const base = 'https://hichweb.com';

const pages = {
  '/quotation.html': ['Create Your Project Quotation | HICH', 'Build your HICH project estimate: compare packages, tailor your scope, review costs and payment stages, then download a PDF quotation or share your brief.', 'Quotation studio'],
  '/': ['HICH | Web Development & Digital Design in Sri Lanka', 'HICH (Hich Web Development) designs and builds websites, online stores, apps and business systems in Sri Lanka for businesses worldwide.', 'Home'],
  '/services.html': ['Our Capabilities — Websites, Apps & Digital Systems | HICH', 'Explore HICH web development, UI/UX design, e-commerce, ERP, automation and digital growth services.', 'Capabilities'],
  '/allprojects.html': ['Selected Websites & Digital Projects | HICH', 'Explore HICH website, commerce and digital product work, with concept projects clearly identified.', 'Selected work'],
  '/about.html': ['Meet HICH — A Digital Studio in Sri Lanka', 'Get to know HICH: a Sri Lanka-based digital studio bringing strategy, design and engineering together for businesses worldwide.', 'The studio'],
  '/process.html': ['Our Process — From First Idea to Launch | HICH', 'How HICH plans, designs, builds and launches websites and digital products with clear milestones and collaborative reviews.', 'Our process'],
  '/insights.html': ['Web Development Guides & Digital Insights | HICH', 'Practical HICH guides to website planning, e-commerce, ERP, redesigns and choosing the right digital product.', 'Insights'],
  '/contact.html': ['Start a Project — Contact HICH Web Development', 'Tell HICH about your website, store, app or business system. Create your project brief and connect by email, phone or WhatsApp.', 'Start a project'],
  '/privacy-policy.html': ['Privacy Policy | HICH', 'How this HICH website handles project drafts, contact enquiries, external links and browser data.', 'Privacy policy'],
  '/terms-and-conditions.html': ['Website Terms | HICH', 'Terms for using the HICH website and preparing a project enquiry.', 'Website terms'],
  '/job.html': ['Careers & Collaborations | HICH', 'Introduce your design or development work to HICH. Contact the studio about future collaboration opportunities.', 'Careers'],
  '/404.html': ['Page Not Found | HICH', 'This page could not be found. Explore HICH services, work and guides or start a project.', 'Page not found'],
};
// Search summaries are deliberately separate from long introductory page copy.
// Their concise length is an editorial choice, not a ranking requirement.
const serviceDescriptions = {
  'website-development': 'HICH builds responsive business websites with clear content, distinctive design, CMS options and technical SEO. Based in Sri Lanka, working worldwide.',
  'ecommerce-solutions': 'Plan and build an online store with HICH: product discovery, checkout, payment integrations and order workflows shaped around your business.',
  'web-application-development': 'HICH designs and develops customer portals, dashboards and web applications with clear user roles, useful workflows and connected data.',
  'erp-systems': 'Connect inventory, approvals, reporting and everyday operations with ERP systems planned around your business by HICH in Sri Lanka.',
  'ui-ux-design': 'HICH turns complex requirements into clear user flows, interactive prototypes and distinctive desktop and mobile interfaces.',
  'mobile-app-development': 'Plan mobile websites, progressive web apps and app experiences with HICH, built around touch, device needs and the tasks your users complete.',
  'seo-digital-growth': 'Improve search foundations with HICH: technical SEO, useful content, clear business information, structured data and measurement for ongoing growth.',
  'api-integrations-automation': 'Connect websites, business applications and external services with HICH API integrations, data mapping and practical workflow automation.',
  'website-maintenance-support': 'Keep your website useful with HICH maintenance and support: agreed updates, fixes, monitoring, performance reviews and planned improvements.',
  'digital-product-strategy': 'Turn an early idea into a practical product plan with HICH discovery, audience research, feature priorities, first-release scope and roadmaps.',
  'brand-content-design': 'Build a recognisable digital identity with HICH brand and content design, connecting positioning, messaging, visual direction and website content.',
  'technology-stack': 'Choose a practical technology stack with HICH. Compare frontend, backend, data, integrations, deployment and ownership against your requirements.',
};

const articleTitles = {
  'website-redesign-checklist': 'Website Redesign Checklist | HICH',
  'web-app-vs-website-vs-mobile-app': 'Website vs Web App vs Mobile App | HICH',
  'ecommerce-website-requirements-guide': 'E-commerce Website Requirements Guide | HICH',
  'custom-erp-vs-off-the-shelf': 'Custom ERP vs Off-the-Shelf Software | HICH',
  'website-cost-factors-sri-lanka': 'Website Cost Factors in Sri Lanka | HICH',
  'website-project-brief-template': 'Website Project Brief Template | HICH',
};

export function normalizePath(input = '/') {
  const path = input.split(/[?#]/, 1)[0] || '/';
  if (['/index.html', '/i.html'].includes(path)) return '/';
  if (['/terms.html', '/terms', '/terms/'].includes(path)) return '/terms-and-conditions.html';
  if (path !== '/' && !path.includes('.')) return `${path.replace(/\/$/, '')}.html`;
  return path;
}
export const pagePaths = [...Object.keys(pages), ...services.map(s => `/${s.slug}.html`), ...insights.map(s => `/${s.slug}.html`)];
export function getPageMeta(input) {
  const path = normalizePath(input);
  const service = services.find(s => path === `/${s.slug}.html`);
  const article = insights.find(s => path === `/${s.slug}.html`);
  const found = pages[path];
  if (service) return { path, title: `${service.title} in Sri Lanka | HICH`, description: serviceDescriptions[service.slug], name: service.title, type: 'service', item: service };
  if (article) return { path, title: articleTitles[article.slug] || `${article.title} | HICH`, description: article.excerpt, name: article.title, type: 'article', item: article };
  if (found) return { path, title: found[0], description: found[1], name: found[2], type: path === '/' ? 'home' : 'page' };
  return { path: '/404.html', title: pages['/404.html'][0], description: pages['/404.html'][1], name: 'Page not found', type: 'page' };
}
export function getSchema(path) {
  const meta = getPageMeta(path);
  if (meta.path === '/404.html') return { '@context': 'https://schema.org', '@graph': [] };
  const url = `${base}${meta.path}`;
  const orgId = `${base}/#organization`;
  const websiteId = `${base}/#website`;
  const webpageId = `${url}#webpage`;
  const org = {
    '@type': 'Organization', '@id': orgId,
    name: company.name, alternateName: company.alternateNames,
    url: `${base}/`, logo: `${base}/logo.svg`, description: company.description,
    email: company.email, telephone: company.phone,
    areaServed: [{ '@type': 'Country', name: company.location }, { '@type': 'Place', name: 'Worldwide' }],
    // Identity profiles belong here; a WhatsApp conversation action does not.
    sameAs: company.social.filter(profile => profile.name === 'LinkedIn').map(profile => profile.url),
  };
  const webpage = {
    '@type': meta.path === '/contact.html' ? 'ContactPage' : meta.path === '/about.html' ? 'AboutPage' : 'WebPage',
    '@id': webpageId, url, name: meta.title, description: meta.description,
    isPartOf: { '@id': websiteId }, about: { '@id': orgId }, inLanguage: 'en-LK',
  };
  const graph = [
    org,
    {
      '@type': 'WebSite', '@id': websiteId, name: company.name,
      alternateName: ['Hich Web', 'Hich Web Development', 'hichweb.com'],
      url: `${base}/`, publisher: { '@id': orgId }, inLanguage: 'en-LK',
    },
    webpage,
  ];
  if (meta.path !== '/') {
    webpage.breadcrumb = { '@id': `${url}#breadcrumb` };
    graph.push({
      '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${base}/` },
        { '@type': 'ListItem', position: 2, name: meta.name, item: url },
      ],
    });
  }
  if (meta.type === 'service') {
    webpage.mainEntity = { '@id': `${url}#service` };
    graph.push({
      '@type': 'Service', '@id': `${url}#service`, name: meta.name,
      description: meta.item.description, url, provider: { '@id': orgId },
      areaServed: 'Worldwide', serviceType: meta.name,
      mainEntityOfPage: { '@id': webpageId },
    });
  }
  if (meta.type === 'article') {
    webpage.mainEntity = { '@id': `${url}#article` };
    graph.push({
      '@type': 'Article', '@id': `${url}#article`, url,
      headline: meta.name, description: meta.description, articleSection: meta.item.category,
      mainEntityOfPage: { '@id': webpageId }, isPartOf: { '@id': webpageId },
      author: { '@id': orgId }, publisher: { '@id': orgId }, inLanguage: 'en-LK',
      // No invented date: the current article design does not display one.
    });
  }
  const questions = meta.type === 'home' ? faqs : meta.type === 'service' ? meta.item.faqs : null;
  if (questions?.length) graph.push({
    '@type': 'FAQPage', '@id': `${url}#faq`, url: `${url}#faq`, isPartOf: { '@id': webpageId },
    mainEntity: questions.map(question => ({
      '@type': 'Question', name: question.question,
      acceptedAnswer: { '@type': 'Answer', text: question.answer },
    })),
  });
  return { '@context': 'https://schema.org', '@graph': graph };
}
