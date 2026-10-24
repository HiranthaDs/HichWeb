import { formatLkr, formatUsd, formatUsdMonthly, quotationCatalog } from './quotation-engine.js';

const addonRecurringLine = addon => addon.estimated_monthly_operating_uplift_usd > 0
  ? `\n   Ongoing service: +${formatUsdMonthly(addon.estimated_monthly_operating_uplift_usd)}, billed annually as ${formatUsd(addon.estimated_annual_operating_uplift_usd)}`
  : addon.estimated_annual_operating_uplift_usd > 0
    ? `\n   Annual renewal addition: +${formatUsd(addon.estimated_annual_operating_uplift_usd)}`
    : '';

// One complete text representation for WhatsApp, copying and the visible preview.
// Never truncate a large quote: switch to copy-and-paste when a URL is too long.
export function quotationMessage(quote) {
  const { client } = quote;
  return [
    'Hello HICH, please review my draft quotation.',
    '', '*HICH DRAFT QUOTATION*',
    `Reference: ${quote.reference}`, `Prepared: ${quote.date}`, `Planning validity: ${quote.validUntil}`,
    '', '*CLIENT & BRIEF*',
    `Name: ${client.name}`, `Business: ${client.company || 'Not supplied'}`,
    `Email: ${client.email || 'Not supplied'}`, `Phone: ${client.phone || 'Not supplied'}`,
    `Goal: ${client.objective}`, `Target launch (requested, not confirmed): ${client.targetLaunch || 'To be discussed'}`,
    '', '*PACKAGE & SCOPE*', `${quote.package.name} — ${formatLkr(quote.basePrice)}`,
    quote.package.summary, ...quote.package.features.map(feature => `• ${feature}`),
    '', '*SELECTED ADD-ONS*',
    ...(quote.addons.length ? quote.addons.map((addon, index) => `${index + 1}. ${addon.name} — ${addon.price_label ? `${addon.price_label} ` : ''}${formatLkr(addon.price_lkr)}\n   ${addon.description}${addonRecurringLine(addon)}`) : ['No optional add-ons selected.']),
    '', '*INDICATIVE INVESTMENT*',
    `Package: ${formatLkr(quote.basePrice)}`, `Add-ons: ${formatLkr(quote.addonsTotal)}`,
    `Project total: ${formatLkr(quote.total)} (taxes excluded)`,
    `Separate consolidated annual renewal estimate: ${formatUsd(quote.renewalUsd)}`,
    `Annual base hosting and service: ${formatUsd(quote.renewalBase)}`,
    ...(quote.renewalUplift ? [`Selected ongoing services added annually: ${formatUsd(quote.renewalUplift)}`] : []),
    'Annual renewal is usage-dependent and subject to provider prices and final architecture. It is not added to the LKR project total.',
    '', '*PROPOSED PAYMENT STAGES*',
    ...quote.milestones.map(stage => `${stage.title}: ${stage.percentage}% — ${formatLkr(stage.amount)}`),
    '', '*VALIDATION & COMMERCIAL NOTES*',
    'Draft estimate only — not a contract, final quotation or approval to begin work. HICH must confirm scope, price, timeline and terms before approval or payment.',
    quote.approvalRequired ? 'Custom / managed-service items need technical and management review.' : 'Final delivery dates, responsibilities and warranty details require written agreement.',
    quotationCatalog.policy.consolidated_renewal.third_party_fees,
    'Client supplies the required merchant, messaging and other third-party accounts unless agreed otherwise.',
    'Work starts after the final agreement, applicable kickoff payment and required content/access. Out-of-scope work needs a written variation.',
    'Terms: https://hichweb.com/terms-and-conditions.html',
    'Please confirm this draft with me. No PDF is attached automatically.',
  ].join('\n');
}

export function quotationWhatsApp(quote) {
  const text = quotationMessage(quote);
  const destination = `https://wa.me/${quotationCatalog.company.whatsapp}`;
  const fullHref = `${destination}?text=${encodeURIComponent(text)}`;
  const requiresCopy = fullHref.length > 8000;
  return { text, requiresCopy, href: requiresCopy ? destination : fullHref };
}
