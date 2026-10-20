import { company, services, projects, faqs, insights } from './data.js';
import { termsSections } from './termsContent.js';
import { getContactActions } from './assistant-actions.js';
import { practicalKnowledge } from './assistant-practical-knowledge.js';

export const ASSISTANT_MAX_WORDS = 150;

export function limitReplyWords(value, maxWords = ASSISTANT_MAX_WORDS) {
  const text = String(value || '').trim();
  const limit = Math.max(1, Math.min(ASSISTANT_MAX_WORDS, Math.floor(Number(maxWords) || ASSISTANT_MAX_WORDS)));
  const words = [...text.matchAll(/\S+/g)];
  if (words.length <= limit) return text;
  let clipped = text.slice(0, words[limit].index).trimEnd();
  const boundaries = [...clipped.matchAll(/[.!?](?:\*\*)?(?=\s|$)/g)];
  const lastBoundary = boundaries.at(-1);
  if (lastBoundary && lastBoundary.index >= clipped.length * 0.65) {
    clipped = clipped.slice(0, lastBoundary.index + lastBoundary[0].length);
  } else {
    clipped = `${clipped.replace(/[,:;—-]+$/, '')}…`;
  }
  if ((clipped.match(/\*\*/g) || []).length % 2) clipped += '**';
  return clipped;
}

const normalise = value => String(value || '').toLowerCase().replace(/e-commerce/g, 'ecommerce').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const stopWords = new Set('a an the and or of to for in on with is are was be been can could would should will do does did you your i my me we our us it this that these those they them have has had what which who where when why how about more tell please need want get know help hich website project'.split(' '));
const tokens = value => [...new Set(normalise(value).split(' ').filter(word => word.length > 2 && !stopWords.has(word)).map(word => word.replace(/(?:ing|es|s)$/, '')))];
const serviceAliases = {
  'website-development': ['website', 'websites', 'redesign', 'rebuild', 'cms', 'business site', 'landing page', 'wordpress'],
  'ecommerce-solutions': ['ecommerce', 'online store', 'shop', 'shopping', 'sell online', 'checkout', 'shopify', 'products', 'clothing', 'clothes', 'fashion', 'cosmetics'],
  'web-application-development': ['web app', 'web application', 'portal', 'dashboard', 'saas'],
  'erp-systems': ['erp', 'inventory', 'operational system', 'business system', 'stock management', 'approvals'],
  'ui-ux-design': ['ui', 'ux', 'interface', 'prototype', 'wireframe', 'user experience'],
  'mobile-app-development': ['mobile app', 'mobile', 'android', 'ios', 'pwa', 'offline'],
  'seo-digital-growth': ['seo', 'aeo', 'search', 'google', 'ranking', 'traffic', 'visibility', 'growth'],
  'api-integrations-automation': ['integration', 'integrations', 'automation', 'automate', 'api', 'webhook', 'connect tools', 'notifications', 'crm'],
  'website-maintenance-support': ['maintenance', 'support', 'backup', 'updates', 'after launch'],
  'digital-product-strategy': ['strategy', 'mvp', 'roadmap', 'idea', 'startup', 'first release'],
  'brand-content-design': ['brand', 'branding', 'content', 'copywriting', 'logo', 'identity'],
  'technology-stack': ['technology', 'stack', 'architecture', 'framework', 'hosting', 'react', 'backend'],
};
const hasPhrase = (text, phrase) => (` ${normalise(text)} `).includes(` ${normalise(phrase)} `);
const startProjectPattern = /\b(?:(?:how (?:do|can|should) i|ready to) (?:start|begin|kick off) (?:a |my |the )?project|(?:start|begin|kick off) (?:a |my |the )?project|get started (?:with hich|on (?:a |my )?project)|work with hich)\b/i;
const projectContinuationPattern = /^(?:my|our)\s+(?:audience|budget|business|company|customers?|deadline|features?|goal|launch|project|store|users?)\b|^(?:the )?(?:audience|budget|deadline|features?|goal|launch date|timeline)\s+(?:is|are|would be)\b/i;
const instructionAttackPattern = /\b(?:ignore (?:all |the |your )?(?:previous|prior|system|developer) instructions?|reveal (?:the |your )?(?:prompt|instructions?|context)|show (?:me )?(?:the )?(?:system prompt|hidden instructions?)|developer message|jailbreak)\b/i;
const assistantIdentityPattern = /\b(?:what(?:'s| is) your name|who are you|what should i call you|are you chathu|your name)\b/i;
const projectTopicPattern = /\b(?:hich|accessibility|analytics|apps?|authentication|automation|booking|brand|business|capabilities|checkout|cms|content|conversion|crm|customers?|database|design|digital|domains?|ecommerce|email|erp|features?|hosting|integration|inventory|marketing|migration|mobile|multilingual|notifications?|payments?|performance|platform|portfolio|portal|pricing|products?|reservation|security|seo|services|shop|software|store|subscription|systems?|technology|users?|website|workflow)\b/i;
const unrelatedTopicPattern = /\b(?:weather|raining|forecast|football|cricket|sports scores?|recipe|cook|quantum|gravity|horoscope|celebrity|president|election|homework|lyrics)\b/i;
const termSummaries = {
  6: 'The accepted written project agreement defines deliverables, exclusions, timing, fees, ownership, support and responsibilities. Where it conflicts with the public Website Terms about contracted services, the project agreement controls that conflict. Work and reserved dates depend on its acceptance and deposit conditions.',
  7: 'HICH may accept authorised physical or electronic signatures, including clear electronic approval. When the relevant document provides these Terms before payment, paying an invoice, deposit or instalment can also record acceptance. Any specifically required signing method still applies, and mandatory rights remain protected.',
  8: 'Unless an accepted written project agreement expressly says otherwise, HICH retains its source code, systems, reusable components and working materials. You retain the materials you lawfully supply. After full payment, your rights to final deliverables are the licence or rights stated in that agreement; payment or admin access alone does not transfer source-code ownership.',
  9: 'A handover, source-code licence, migration or work by another developer needs written agreement on the permitted materials, access, scope, fees and support consequences. Permission to update ordinary client content does not by itself permit reuse or modification of HICH-owned code. Rights expressly granted by your agreement or mandatory law still apply.',
  10: 'HICH covers modifications and support it performs or approves in writing under an active agreement. Unauthorised changes can affect support or warranties for the changed parts; inspection and restoration may need a new scope and fee. HICH remains responsible for its own agreed work and obligations required by law.',
  19: 'The Terms point to the Privacy Policy for information handling. Device storage and external communication services have their own controls. Check the current Privacy Policy for how project drafts and assistant conversations are handled.',
  21: 'Fees, deposits, payment dates and taxes come from your quotation, invoice or project agreement. A deposit is refundable only where that agreement allows it, HICH materially fails to provide the agreed service, or applicable law requires a refund. Completed work and committed costs may be non-refundable, subject to mandatory rights.',
  22: 'Payment integrations depend on the approved provider, account access and agreed project scope. Provider approval, settlement, payment security and operational responsibilities must be confirmed with the provider and in the project agreement.',
  23: 'Customer refunds and chargebacks are handled by the client through its payment provider. A dispute over a payment to HICH does not automatically cancel the agreement or an undisputed invoice. For a duplicate or missing payment, contact HICH with the invoice and transaction reference; never send card numbers, security codes or passwords.',
  27: 'HICH performs the SEO tasks in the written scope. Search engines control crawling, indexing and ranking, so specific positions, traffic, enquiries or sales are not guaranteed. The client supplies accurate content, approvals and relevant account access; mandatory rights and HICH’s agreed obligations remain in place.',
  35: 'The published Terms name Sri Lankan law and ask for a good-faith attempt to resolve disputes through written notice and discussion for at least thirty days. Send the issue and requested resolution to info@hichweb.com. Mandatory rights, urgent relief and any different project dispute procedure still apply.',
  37: 'The Terms do not remove rights or protections that applicable law does not allow the parties to exclude. Whether a specific protection applies depends on your circumstances; HICH can clarify the agreement, while a qualified adviser can assess your legal position.',
};
const termRules = [
  [8, /\b(own|owns|ownership|source|code|licen[cs]e|intellectual property)\b/i],
  [9, /\b(handover|copy|copying|clone|migration|another developer|third.party developer|different developer|other developer)\b/i],
  [10, /\b(modif\w*|maintenance|support|change[ds]?|updates?|broken|fix)\b/i],
  [6, /\b(scope|deliverables?|delivery|deadline|proposal|precedence|contract|agreement)\b/i],
  [7, /\b(sign\w*|accept\w*|electronic|wet.ink)\b/i],
  [21, /\b(fees?|pay|payments?|paid|deposits?|instalments?|invoices?|tax|refunds?|cost|price)\b/i],
  [22, /\b(gateway|settlement|payment provider|checkout)\b/i],
  [23, /\b(fraud|chargeback|charged twice|duplicate payment|missing payment|customer refund)\b/i],
  [19, /\b(privacy|storage|personal data|cookies?)\b/i],
  [27, /\b(seo|ranking|rank|search|google|traffic|results|visibility)\b/i],
  [35, /\b(dispute|law|court|jurisdiction|governing)\b/i],
  [37, /\b(mandatory|consumer|statutory)\b/i],
];

const siteRecords = [
  { id: 'about', kind: 'page', title: 'About HICH', href: '/about.html', aliases: ['about hich', 'about the studio', 'who are you', 'who is hich', 'what do you call your company', 'company name', 'sri lanka', 'international', 'worldwide', 'location'], text: `${company.description} ${faqs[1].answer}` },
  { id: 'registration', kind: 'page', title: 'HICH company registration', href: '/about.html', aliases: ['registered', 'registered company', 'registration', 'regested', 'regestered', 'registred', 'legitimate', 'legit'], text: `${company.registrationStatus} The website does not publish a registration number, registered legal name or registration certificate. Contact HICH directly if you need those details for procurement or verification.` },
  { id: 'contact', kind: 'page', title: 'Talk to HICH', href: '/contact.html', aliases: ['contact', 'email', 'phone', 'whatsapp', 'call', 'get in touch', 'start a project', 'enquiry', 'quote'], text: `Contact HICH at ${company.email}, call ${company.phoneDisplay}, or use WhatsApp at the same number. The contact page has a project brief builder. Share your business goal, audience, features, target launch date and budget range. You choose when to send your prepared brief.` },
  { id: 'process', kind: 'page', title: 'How a HICH project works', href: '/process.html', aliases: ['process', 'steps', 'workflow', 'how do you work', 'how does it work', 'get started'], text: '1. **Discover** — clarify the business, audience, goals and project brief.\n2. **Design** — review journeys, wireframes and visual direction.\n3. **Develop** — build the approved design, connect systems and check across devices.\n4. **Launch & evolve** — complete content, accessibility and performance checks, then agree handover and ongoing support.' },
  { id: 'cost', kind: 'page', title: 'Project pricing', href: '/website-cost-factors-sri-lanka.html', aliases: ['cost', 'price', 'pricing', 'budget', 'how much', 'rate', 'charge', 'quote'], text: `${faqs[4].answer} The site does not publish fixed package prices. Include recurring hosting, domains, platform subscriptions and support when comparing costs.` },
  { id: 'timing', kind: 'page', title: 'Planning delivery', href: '/process.html', aliases: ['timeline', 'how long', 'how soon', 'deadline', 'duration', 'weeks', 'days', 'delivery', 'launch date'], text: 'There is no universal delivery time published. Timing is agreed around the scope, content readiness, integrations, review rounds and client approvals. Include your target launch date in the brief so HICH can confirm a realistic plan and any staged release.' },
  { id: 'careers', kind: 'page', title: 'Collaborate with HICH', href: '/job.html', aliases: ['career', 'job', 'jobs', 'work with you', 'join', 'hiring', 'collaborate'], text: 'The Collaborate page is the place to introduce your work and interest in working with HICH. Show the problem you solved, your role and a useful example of the result. Published collaboration information is not a promise of an available role.' },
  { id: 'privacy', kind: 'page', title: 'Privacy policy', href: '/privacy-policy.html', aliases: ['privacy', 'cookies', 'personal data', 'chat history', 'save chats'], text: 'Check the Privacy Policy for how this website handles project drafts, assistant conversations and external providers. Avoid sending passwords, payment details or confidential project material in chat.' },
];

export const knowledgeRecords = [
  ...siteRecords,
  ...practicalKnowledge.map(record => ({ ...record, kind: 'guidance' })),
  ...services.map(service => ({ id: service.slug, kind: 'service', title: service.title, href: `/${service.slug}.html`, aliases: serviceAliases[service.slug] || [], text: `${service.description}\n\n${service.deliverables.map(item => `- ${item}`).join('\n')}\n\n${service.faqs.map(item => `${item.question} ${item.answer}`).join('\n')}`, service })),
  ...projects.map(project => ({ id: project.slug, kind: 'project', title: project.name, href: '/allprojects.html', aliases: [project.name, project.slug.replace(/-/g, ' ')], text: `${project.name} — ${project.type}${project.concept ? ' (concept work)' : ''}. ${project.description} Services: ${project.services.join(', ')}. No measured commercial results are published.`, project })),
  ...insights.map(item => ({ id: item.slug, kind: 'insight', title: item.title, href: `/${item.slug}.html`, aliases: [item.slug.replace(/-/g, ' ')], text: `${item.excerpt}\n${item.body.map(section => `${section.heading}: ${section.text}`).join('\n')}` })),
  ...termsSections.map((section, index) => ({ id: `term-${index + 1}`, number: index + 1, kind: 'terms', title: section.title, href: `/terms-and-conditions.html#term-${index + 1}`, aliases: [], text: [...section.paragraphs, ...(section.bullets || [])].join('\n'), summary: termSummaries[index + 1] })),
].map(record => ({ ...record, searchTokens: tokens(`${record.title} ${record.text}`), titleTokens: tokens(record.title) }));

export function resolveQuestion(messages) {
  const questions = (Array.isArray(messages) ? messages : []).filter(message => message?.role === 'user' && typeof message.content === 'string').map(message => message.content.trim());
  const question = questions.at(-1) || '';
  const isContinuation = value => /^(and\b|what about\b|how about\b|tell me more\b|more details\b|yes\b|why\b)|\b(it|that|those|them|same|simpler|shorter|summari[sz]e|example)\b/i.test(value) || projectContinuationPattern.test(value) || /^(?:cost|price|pricing|budget|timeline|how much|how long|which one|what next|more)\W*$/i.test(value);
  const followUp = isContinuation(question) && !(unrelatedTopicPattern.test(question) && !projectTopicPattern.test(question));
  const earlier = questions.slice(0, -1).reverse();
  const prior = earlier.find(value => tokens(value).length > 0 && !isContinuation(value)) || earlier.find(value => tokens(value).length > 0) || '';
  return { question, query: followUp && prior ? `${question} ${prior}` : question, prior: followUp ? prior : '' };
}

export function retrieveKnowledge({ mode = 'site', messages = [] }) {
  const { question, query } = resolveQuestion(messages);
  const queryTokens = tokens(query);
  const latestTokens = tokens(question);
  const explicitTerms = /\b(terms|agreement|contract|ownership|source code|refunds?|signature|chargeback|legal|licen[cs]e|deposit)\b/i.test(query);
  const useTerms = mode === 'terms' || explicitTerms;
  const rules = useTerms ? termRules.filter(([, pattern]) => pattern.test(query)).map(([number]) => number) : [];
  return knowledgeRecords.map(record => {
    let score = queryTokens.reduce((sum, token) => sum + (record.titleTokens.includes(token) ? 5 : record.searchTokens.includes(token) ? 1 : 0), 0);
    score += latestTokens.reduce((sum, token) => sum + (record.titleTokens.includes(token) ? 5 : 0), 0);
    score += record.aliases.reduce((sum, alias) => sum + (hasPhrase(query, alias) ? 10 + alias.split(' ').length : 0), 0);
    if (record.kind === 'guidance' && record.match.test(question)) score += 45;
    if (record.kind === 'terms') score = useTerms ? score + (rules.includes(record.number) ? 30 : 0) : 0;
    if (record.kind === 'insight') score *= 0.6;
    if (mode === 'terms' && record.kind !== 'terms') score *= 0.4;
    if (/\b(section|clause|term)\s*(\d{1,2})\b/i.test(question) && record.number === Number(question.match(/\b(?:section|clause|term)\s*(\d{1,2})\b/i)[1])) score += 100;
    return { ...record, score };
  }).filter(record => record.score >= 4).sort((a, b) => b.score - a.score).slice(0, 8);
}

const sourceOf = record => ({ title: record.title, href: record.href });
const uniqueSources = records => [...new Map(records.map(record => [record.href, sourceOf(record)])).values()].slice(0, 4);
const shortExtract = (text, query) => {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const queryTokens = tokens(query);
  const ranked = sentences.map((sentence, index) => ({ sentence, index, score: queryTokens.filter(token => tokens(sentence).includes(token)).length }));
  const selected = ranked.sort((a, b) => b.score - a.score).slice(0, 2).sort((a, b) => a.index - b.index);
  return selected.map(item => item.sentence).join(' ');
};

function buildGuideReply({ mode = 'site', messages = [] }) {
  const { question, query, prior } = resolveQuestion(messages);
  if (instructionAttackPattern.test(question) || (unrelatedTopicPattern.test(question) && !projectTopicPattern.test(question))) return { text: 'I can help with HICH, websites, online stores, applications and project planning. Ask about a feature, a technical choice or the published project terms, and I’ll focus on that.', sources: [] };
  if (/^(hi|hello|hey|good (morning|afternoon|evening))[!.\s]*$/i.test(question)) return { text: mode === 'terms' ? 'Hello! I’m Chathu. Ask me a question about HICH’s published terms, and I’ll find the relevant clauses and explain the wording in context.' : 'Hello! I’m Chathu. I can help you explore HICH’s services, selected work, project process and terms. What are you hoping to build?', sources: [] };
  if (/^(thanks|thank you|great|perfect|ok|okay)[!.\s]*$/i.test(question)) return { text: 'You’re welcome. You can ask a follow-up, or tell me what you would like to explore next.', sources: [] };
  if (assistantIdentityPattern.test(question)) return { text: mode === 'terms' ? 'I’m **Chathu**, HICH’s website assistant. Here, I can help you understand HICH’s published terms and find the relevant clauses.' : 'I’m **Chathu**, HICH’s website assistant. I can answer questions about HICH, help shape your project idea, explain services and connect you with the team.', sources: [] };
  if (mode !== 'terms' && startProjectPattern.test(question)) {
    return {
      text: `Prepare a short brief with:\n\n- **Your business and audience**.\n- **The goal** and problem to solve.\n- **Essential features** for the first release.\n- Existing content, brand assets and connected tools.\n- Your **target launch date** and **budget range**.\n\nHICH’s process is **Discover → Design → Develop → Launch & evolve**. Scope, price and schedule are confirmed from the brief.\n\nThe **Start a project** page helps prepare it. Your draft stays in your browser until you choose to copy, download, email or open it in WhatsApp.\n\nWhat are you hoping to build, and who is it for?`,
      sources: [{ title: 'Start a project', href: '/contact.html' }, { title: 'How a HICH project works', href: '/process.html' }],
    };
  }
  const registrationQuestion = /\b(?:registered|registration|registeration|regested|regestered|registred|legitimate|legit)\b/i.test(question) && !/\b(?:user|account|login|form|signup|sign up|domain)\b/i.test(question);
  if (registrationQuestion) {
    const wantsDetails = /\b(?:number|certificate|proof|document|legal name|verify|verification)\b/i.test(question);
    return { text: `Yes. **HICH is a registered company in Sri Lanka**, providing web development and digital design services.${wantsDetails ? `\n\nA registration number, registered legal name and certificate are not published on this website. Email ${company.email} to request the details you need directly from the team.` : ''}`, sources: [{ title: 'About HICH', href: '/about.html' }] };
  }
  const contactActions = getContactActions({ messages });
  if (contactActions.length) {
    const contactLines = contactActions.map(action => `**${action.label}:** ${action.value}`);
    const intro = /\b(?:call me|send (?:me )?(?:an? )?(?:email|message)|message me)\b/i.test(question) ? 'I can help you reach the team, but I cannot place calls or send messages for you.' : contactActions.length === 1 ? `Here is HICH’s ${contactActions[0].id === 'call' ? 'phone number' : contactActions[0].id === 'email' ? 'email address' : 'WhatsApp number'}:` : 'You can reach the HICH team here:';
    return { text: `${intro}\n\n${contactLines.join('\n')}\n\n${contactActions.length === 1 && contactActions[0].id === 'whatsapp' ? 'Use the WhatsApp button below to start a conversation.' : contactActions.length === 1 && contactActions[0].id === 'call' ? 'Use the call button below to open your phone dialler.' : contactActions.length === 1 ? 'Use the email button below to open a message to the team.' : 'Choose a contact option below to get in touch.'}`, sources: [{ title: 'Contact HICH', href: '/contact.html' }] };
  }
  const records = retrieveKnowledge({ mode, messages });
  const sections = records.filter(record => record.kind === 'terms');
  const explicitTerms = /\b(terms|agreement|contract|ownership|source code|refunds?|signature|chargeback|licen[cs]e|deposit)\b/i.test(query);
  if ((mode === 'terms' || explicitTerms) && sections.length) {
    const selected = sections.slice(0, /\b(and|also|both)\b/i.test(question) ? 3 : 2);
    const simple = /\b(simpler|shorter|summary|summari[sz]e|brief)\b/i.test(question);
    const perSection = selected.length > 2 ? 27 : selected.length > 1 ? 43 : 95;
    const text = selected.map(record => `**${record.title}**\n${limitReplyWords(simple ? shortExtract(record.summary || record.text, query) : record.summary || shortExtract(record.text, query), perSection)}`).join('\n\n');
    return { text: `${prior ? 'For the point we were discussing:\n\n' : ''}${text}\n\nThis explains the published wording. Your accepted project agreement and any mandatory rights determine how it applies to your project.`, sources: uniqueSources(selected) };
  }
  if (mode === 'terms') return { text: 'I couldn’t find a clear match in the published terms. Try describing the agreement point in a little more detail, or include a clause number. For a project-specific answer, contact HICH at info@hichweb.com with the relevant agreement wording.', sources: [{ title: 'Read the terms', href: '/terms-and-conditions.html' }, { title: 'Contact HICH', href: '/contact.html' }] };

  // Match the latest question first so a new topic does not repeat the service
  // paragraph from an earlier turn. These records are explicitly general advice.
  const practicalMatches = records.filter(record => record.kind === 'guidance' && record.match.test(question));
  if (practicalMatches.length) {
    const selected = practicalMatches.slice(0, /\b(and|also|both)\b/i.test(question) ? 2 : 1);
    const text = selected.length === 1 ? selected[0].text : selected.map(record => `**${record.title}**\n${limitReplyWords(record.text.replace(/\s+[^.!?]*\?$/, ''), 58)}`).join('\n\n');
    return { text: `General guidance:\n\n${text}`, sources: uniqueSources(selected) };
  }

  let directServices = services.filter(service => (serviceAliases[service.slug] || []).some(alias => hasPhrase(query, alias)));
  // A store or portal is usually the actual requirement when someone asks for
  // an "ecommerce website" or "website with a customer portal".
  if (directServices.some(service => ['ecommerce-solutions', 'web-application-development'].includes(service.slug)) && !/\b(?:both|separate)\b/i.test(question)) directServices = directServices.filter(service => service.slug !== 'website-development');
  const chosen = [];
  const blocks = [];
  const include = record => { if (record && !chosen.some(item => item.id === record.id)) { chosen.push(record); return true; } return false; };
  const namedProjects = records.filter(record => record.kind === 'project' && record.aliases.some(alias => hasPhrase(query, alias)));
  const wantsProjects = namedProjects.length || /\b(portfolio|examples|case studies|selected work|show.*projects|projects.*built)\b/i.test(question);
  if (wantsProjects) {
    const selection = namedProjects.length ? namedProjects : knowledgeRecords.filter(record => record.kind === 'project' && (!directServices.length || record.project.services.some(title => directServices.some(service => service.title === title)))).slice(0, 3);
    if (selection.length) {
      selection.forEach(include);
      blocks.push(`Here are ${selection.length === 1 ? 'the published details' : 'a few relevant examples'} from HICH’s selected work:\n\n${selection.map(record => `- **${record.title}${record.project.concept ? ' (concept)' : ''}** — ${record.project.description}`).join('\n')}\n\nConcept work is labelled separately in the portfolio. The site does not publish measured results for these projects.`);
    }
  }
  if (/\b(services|capabilities|what (can|do) you (do|offer)|what do you build)\b/i.test(question) && !directServices.length) {
    blocks.push(`HICH helps plan, design, build and maintain digital products. Services include:\n\n${services.map(service => `- **${service.title}**`).join('\n')}\n\nWhat do you need customers or your team to do? I can suggest a suitable starting point.`);
    include({ id: 'services', title: 'Explore all services', href: '/services.html' });
  }
  const price = /\b(cost|price|pricing|budget|how much|rate|quote)\b/i.test(question);
  const timing = /\b(timeline|how long|how soon|deadline|duration|weeks|days|delivery|launch date)\b/i.test(question);
  if (directServices.length && (price || timing)) blocks.push(`For **${directServices[0].title.toLowerCase()}**, here’s what the site confirms:`);
  for (const service of directServices.slice(0, 2)) {
    if (price || timing || wantsProjects) continue;
    const record = knowledgeRecords.find(item => item.id === service.slug);
    if (include(record)) {
      const faqQuery = tokens(question);
      const bestFaq = service.faqs.map(faq => ({ ...faq, score: faqQuery.filter(token => tokens(faq.question).includes(token)).length })).sort((a, b) => b.score - a.score)[0];
      const answer = bestFaq?.score >= 2 ? bestFaq.answer : /\b(simpler|shorter|summari[sz]e|brief)\b/i.test(question) ? service.description : `${service.description}\n\nTypical scope can include:\n${service.deliverables.slice(0, 4).map(item => `- ${item}`).join('\n')}`;
      blocks.push(`**${service.title}**\n${answer}`);
    }
  }
  for (const record of siteRecords) {
    if (record.id === 'registration' || record.id === 'contact') continue;
    if ((record.id === 'cost' && price) || (record.id === 'timing' && timing) || (!['cost', 'timing'].includes(record.id) && record.aliases.some(alias => hasPhrase(question, alias)))) {
      if (include(record)) blocks.push(`**${record.title}**\n${record.text}`);
    }
  }
  const fallbackRecord = records.find(record => !['contact', 'registration'].includes(record.id));
  if (!blocks.length && fallbackRecord?.score >= 5) {
    const record = fallbackRecord;
    if (include(record)) blocks.push(`**${record.title}**\n${shortExtract(record.text, query)}`);
  }
  if (!blocks.length) return { text: 'I don’t have a reliable answer to that in HICH’s published content. I can help with services, portfolio examples, project planning, pricing factors, contact details and the terms. Tell me a little more about the website or business task you have in mind.', sources: [{ title: 'Explore HICH', href: '/services.html' }, { title: 'Ask the studio', href: '/contact.html' }] };
  const followups = {
    'website-development': 'Is this a new website, or a redesign of an existing one?',
    'ecommerce-solutions': 'What will you sell, and do you already have a product catalogue?',
    'web-application-development': 'Who will use the application, and what is the main task they need to complete?',
    'erp-systems': 'Which workflow should the system handle first: inventory, sales, approvals, or something else?',
    'ui-ux-design': 'Are we improving an existing experience, or designing a new product?',
    'mobile-app-development': 'What do users need to do in the app, and do they need offline access or device features?',
    'seo-digital-growth': 'Do you have an existing website, and which services or products do you want people to find?',
    'api-integrations-automation': 'Which tools need to connect, and what information should pass between them?',
    'website-maintenance-support': 'Which website or platform needs support, and what is the main issue?',
    'digital-product-strategy': 'Who is the first release for, and what single problem should it solve?',
    'brand-content-design': 'Do you already have a brand identity and content, or are we starting from the beginning?',
    'technology-stack': 'What does the product need to do, and does it have to work with any existing systems?',
  };
  if (directServices.length && !wantsProjects && !/\b(simpler|shorter|summari[sz]e|brief)\b/i.test(question)) blocks.push(price ? 'What are the essential features for the first release, and do you have a budget range in mind?' : timing ? 'What is your target launch date, and is the content ready?' : followups[directServices[0].slug]);
  return { text: blocks.join('\n\n'), sources: uniqueSources(chosen) };
}

export function createGuideReply(options = {}) {
  const reply = buildGuideReply(options);
  const text = limitReplyWords(reply.text);
  return { ...reply, text, actions: getContactActions({ messages: options.messages || [], content: text }) };
}

// Give relevant questions to grounded AI whenever the server budget permits.
// Greetings and unrelated requests still have useful zero-token local answers.
export function chooseAssistantEngine({ mode = 'site', messages = [] } = {}) {
  const { question, query } = resolveQuestion(messages);
  if (!question) return { engine: 'guide', reason: 'empty' };
  if (/^(hi|hello|hey|good (morning|afternoon|evening)|thanks|thank you|great|perfect|ok|okay)[!.\s]*$/i.test(question)) return { engine: 'guide', reason: 'conversation' };
  if (assistantIdentityPattern.test(question)) return { engine: 'guide', reason: 'identity' };
  if (instructionAttackPattern.test(question)) return { engine: 'guide', reason: 'outside_scope' };
  if (unrelatedTopicPattern.test(question) && !projectTopicPattern.test(question)) return { engine: 'guide', reason: 'outside_scope' };
  if (startProjectPattern.test(question) || getContactActions({ messages }).length || /\b(?:registered|registration|registeration|regested|regestered|registred|legitimate|legit)\b/i.test(question)) return { engine: 'ai', reason: 'grounded_answer' };

  const records = retrieveKnowledge({ mode, messages });
  const termsRecords = records.filter(record => record.kind === 'terms');
  const projectContext = projectTopicPattern.test(query);

  if (mode === 'terms') {
    return termsRecords.length ? { engine: 'ai', reason: 'terms_answer' } : { engine: 'guide', reason: 'terms_unknown' };
  }

  const hasRelevantHichContent = records.some(record => record.score >= 5);
  if (!projectContext && !hasRelevantHichContent) return { engine: 'guide', reason: 'outside_scope' };
  return { engine: 'ai', reason: 'grounded_answer' };
}

export function buildGrounding({ mode, messages }) {
  const records = retrieveKnowledge({ mode, messages });
  const selected = records.slice(0, 5);
  const compactText = record => {
    if (record.kind === 'service') {
      const queryTokens = tokens(resolveQuestion(messages).question);
      const relevantFaq = record.service.faqs.map(faq => ({ ...faq, score: queryTokens.filter(token => tokens(faq.question).includes(token)).length })).sort((a, b) => b.score - a.score)[0];
      return `${record.service.description}\nTypical scope: ${record.service.deliverables.slice(0, 4).join('; ')}.${relevantFaq?.score ? `\nFAQ: ${relevantFaq.question} ${relevantFaq.answer}` : ''}`;
    }
    if (record.kind === 'terms' && record.summary) return record.summary;
    return record.text.slice(0, 850);
  };
  const base = `${company.description}\nCompany registration: ${company.registrationStatus} No registration number, certificate, registered legal name, incorporation date or company suffix is supplied; do not invent those details.\nCanonical contact details: WhatsApp ${company.phoneDisplay} (https://wa.me/${company.phone.replace(/\D/g, '')}); telephone ${company.phoneDisplay} (tel:${company.phone}); email ${company.email} (mailto:${company.email}). Never substitute other contact details or claim to have placed a call or sent a message.\nHICH services: ${services.map(service => `${service.title} — ${service.short}`).join('; ')}.\nNo fixed prices or universal delivery time is published. Concept portfolio work must be identified as concept work.\n${siteRecords.find(record => record.id === 'process').text}`;
  const grounding = `${base}\n\nLOCAL KNOWLEDGE\nRecords marked GENERAL GUIDANCE are planning advice, not published HICH promises, package inclusions or verified provider availability. Published facts come from HICH site records. Answer the latest question directly using only relevant context; do not repeat a service overview on every follow-up.`;
  let context = grounding;
  const included = [];
  for (const record of selected) {
    const block = `\n\nSOURCE: ${record.title}\nKIND: ${record.kind === 'guidance' ? 'GENERAL GUIDANCE' : `PUBLISHED HICH ${record.kind.toUpperCase()}`}\nURL: ${record.href}\n${compactText(record)}`;
    if (context.length + block.length > 6000) continue;
    context += block;
    included.push(record);
  }
  return { context, sources: uniqueSources(included) };
}
