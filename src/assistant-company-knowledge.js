import { company } from './data.js';

// Owner-supplied facts. Do not infer a street address, office hours, job titles,
// exact headcount or developer-only headcount from these records.
const hich = '(?:hich(?: web development)?|your(?: company)?|the company)';
const location = new RegExp(`\\b(?:where (?:are you|is hich(?: web development)?|is your (?:office|hq|headquarters|company))|${hich} (?:hq|headquarters|head office|office|location|address)|(?:hq|headquarters|head office|location|address) (?:of|for) hich|where (?:are|is) (?:you|hich) (?:based|located)|are you (?:based |located )?in)\\b|^(?:location|address|hq|headquarters)\\W*$`, 'i');
const founder = new RegExp(`\\b(?:(?:who (?:is|was) )?(?:the )?founder of ${hich}|${hich} founder|who (?:founded|started|established) (?:hich(?: web development)?|your company|the company)|who is hirantha dias)\\b|^(?:who is (?:the )?founder|founder(?: name)?)\\W*$`, 'i');
const team = /\b(?:(?:how many|number of)\s+(?:(?:developers?|development|staff|team|employees?|people|members?|work|working|do you|does hich|are|in|the|your|have|at)\s*)+|(?:how (?:big|large) is|size of) (?:your|the|hich(?:'s)?) (?:team|staff|company)|(?:your|hich(?:'s)?) (?:team size|headcount)|tell me about (?:your|the hich) team)\b/i;

export const companyKnowledge = [
  {
    id: 'headquarters', kind: 'fact', title: 'HICH headquarters', href: '/contact.html',
    aliases: ['headquarters', 'hq', 'kandana', 'office location', 'where are you located'],
    match: question => location.test(question),
    text: `HICH’s headquarters (HQ) is in **${company.headquarters}**. We work with businesses in Sri Lanka and internationally. If you would like to visit, contact the team first to confirm the exact meeting location and availability.`,
  },
  {
    id: 'founder', kind: 'fact', title: 'Founder of HICH Web Development', href: '/about.html',
    aliases: ['founder', 'founded', 'hirantha dias'],
    match: question => founder.test(question),
    text: `**${company.founder}** is the founder of **HICH Web Development**. HICH creates websites, online stores, applications and connected business systems.`,
  },
  {
    id: 'team', kind: 'fact', title: 'The HICH team', href: '/about.html',
    aliases: ['team size', 'staff', 'headcount', 'employees', 'how many developers'],
    match: question => team.test(question) && !/\b(?:my|our|i need|should i|do i|can i hire|for my|for our)\b/i.test(question),
    text: `HICH has **${company.teamSize}**. That is the overall team size, not a confirmed count of developers alone. The team can confirm the people and roles assigned to your particular project.`,
  },
  {
    id: 'visits', kind: 'fact', title: 'Meeting the HICH team', href: '/contact.html',
    aliases: ['office hours', 'visit your office', 'meet the team', 'opening hours'],
    match: question => /\b(?:your office hours|(?:office|opening|working|business) hours|visit (?:you|your office|hich)|meet (?:you|your team|the team)|street address|exact address)\b/i.test(question),
    text: `Our HQ is in **${company.headquarters}**. A street address, opening hours and appointment availability are not supplied here. Please contact HICH to arrange a visit or discuss a remote meeting; I cannot book an appointment or promise availability.`,
  },
];

export const matchedCompanyFacts = question => companyKnowledge.filter(record => record.match(question));
