import { company } from './data.js';

const contactActions = {
  whatsapp: { id: 'whatsapp', label: 'WhatsApp', value: company.phoneDisplay, href: `https://wa.me/${company.phone.replace(/\D/g, '')}`, description: 'Chat with the HICH team' },
  call: { id: 'call', label: 'Call HICH', value: company.phoneDisplay, href: `tel:${company.phone}`, description: 'Open your phone dialler' },
  email: { id: 'email', label: 'Email HICH', value: company.email, href: `mailto:${company.email}`, description: 'Write to the HICH team' },
};

const normalise = value => String(value || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9@+.\s-]/g, ' ').replace(/\s+/g, ' ').trim();
const channelPatterns = {
  whatsapp: /\b(?:whats?\s*app?|whatsaap|watsapp)\b/,
  call: /\b(?:call(?:ing)?|phone|telephone|mobile number)\b/,
  email: /\b(?:e[ -]?mail|mail address)\b/,
};
const serviceTopic = /\b(?:apis?|integrat\w*|automat\w*|chatbots?|webhooks?|develop\w*|build|add|features?|notifications?|otp|plugins?|campaigns?|marketing|templates?|verification)\b/;
const contactRequest = /\b(?:contact (?:you|hich|the team)|get in touch|reach (?:you|hich|the team)|(?:talk|speak) to (?:you|hich|the team)|(?:your|hich(?:s)?) (?:contact details|number|email address)|(?:whats?\s*app?|phone|telephone|contact) (?:number|details)|(?:call|email|message) (?:you|hich|the team|me)|(?:give|share|show|send|provide) (?:me )?(?:your )?(?:number|contact details|email address))\b/;

// Treat structured model output as intent only. Destinations, numbers and labels
// always come from the site's own company data, never an arbitrary model URL.
export function cleanContactActions(actions) {
  if (!Array.isArray(actions)) return [];
  const ids = actions.filter(action => action && typeof action === 'object' && Object.hasOwn(contactActions, action.id)).map(action => action.id);
  return [...new Set(ids)].slice(0, 3).map(id => ({ ...contactActions[id] }));
}

export function getContactActions({ messages = [], content = '' } = {}) {
  const questions = (Array.isArray(messages) ? messages : []).filter(message => message?.role === 'user' && typeof message.content === 'string').map(message => normalise(message.content));
  const latest = questions.at(-1) || '';
  if (/\b(?:what (?:should|can|do) i call you|what(?:s| is) your name|who are you|are you chathu)\b/.test(latest)) return [];
  let question = latest;
  const numberFollowup = /\bnumber\b/.test(latest) && latest.split(' ').length <= 7 && !/\b(?:registration|registered|order|invoice|account|product)\b/.test(latest);
  if (numberFollowup && !Object.values(channelPatterns).some(pattern => pattern.test(latest)) && questions.at(-2) && Object.values(channelPatterns).some(pattern => pattern.test(questions.at(-2)))) question = `${questions.at(-2)} ${latest}`;
  const channelQuestion = question
    .replace(/\b(?:whats?\s*app?|e[ -]?mail|phone|call)\s+(?:apis?|integrations?|automation|notifications?|marketing|templates?|features?|verification)\b/g, '')
    .replace(/\bcall to action\b/g, '')
    .replace(/\bcall (?:your|our|the|a|this) (?:company|business|website|app|product)\b/g, '');
  const channels = Object.entries(channelPatterns).filter(([, pattern]) => pattern.test(channelQuestion) && !new RegExp(`\\b(?:not|no|without|instead of|dont want|dont use)\\s+(?:a\\s+)?(?:${pattern.source.replace(/^\\b|\\b$/g, '')})`).test(latest)).map(([id]) => id);
  const direct = contactRequest.test(question);
  const discussingService = serviceTopic.test(question) && !direct;
  if (discussingService) return [];
  if (channels.length) return cleanContactActions(channels.map(id => ({ id })));
  if (direct || /\b(?:contact|contact details|contact number|get in touch|reach out|speak to someone|talk to someone)\b/.test(question)) {
    return cleanContactActions(['whatsapp', 'call', 'email'].map(id => ({ id })));
  }

  // A reply can offer a useful action even without a direct contact question,
  // but a generic mention of the technology is never enough to create a card.
  const reply = normalise(content);
  const mentionsNumber = reply.replace(/\D/g, '').includes(company.phone.replace(/\D/g, ''));
  const ids = [];
  if ((channelPatterns.whatsapp.test(reply) && mentionsNumber) || String(content).includes(contactActions.whatsapp.href)) ids.push('whatsapp');
  if ((channelPatterns.call.test(reply) && mentionsNumber) || String(content).includes(contactActions.call.href)) ids.push('call');
  if (reply.includes(company.email.toLowerCase())) ids.push('email');
  return cleanContactActions(ids.map(id => ({ id })));
}
