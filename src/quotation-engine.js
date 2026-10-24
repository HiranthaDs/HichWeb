import catalog from './quotation-catalog.json' with { type: 'json' };

const categoryNames = {
  ecommerce: 'E-commerce', furniture: 'Furniture', tourism: 'Tourism', hospitality: 'Hotel / villa',
  restaurant: 'Restaurant / cafe', beauty: 'Salon / beauty', healthcare: 'Clinic / wellness',
  corporate: 'Corporate website', portfolio: 'Portfolio', education: 'Education', real_estate: 'Real estate',
  automotive: 'Automotive', pos: 'Point of sale', erp: 'ERP', crm: 'CRM', hr: 'HR system',
  finance: 'Finance system', booking: 'Booking system', logistics: 'Logistics', marketplace: 'Marketplace',
  property: 'Property management', saas: 'Custom SaaS',
};

const categoryOrder = [
  'ecommerce', 'corporate', 'tourism', 'hospitality', 'restaurant', 'furniture', 'real_estate',
  'automotive', 'education', 'beauty', 'healthcare', 'portfolio', 'booking', 'pos', 'erp', 'crm',
  'hr', 'finance', 'logistics', 'property', 'marketplace', 'saas',
];

const includedAddonAliases = {
  whatsapp_checkout: 'whatsapp_order_checkout',
  free_invoice_generator: 'professional_invoice_app',
  booking_engine: 'tour_booking_engine',
  booking_email: 'email_automation',
};

const featuredAddonIds = {
  ecommerce: ['full_payment_gateway', 'ecommerce_product_import', 'advanced_seo', 'ai_support_chatbot', 'multilanguage'],
  tourism: ['koko_bnpl', 'advanced_seo', 'multilanguage', 'whatsapp_api_alerts'],
  hospitality: ['booking_engine_general', 'full_payment_gateway', 'advanced_seo', 'multilanguage'],
  restaurant: ['booking_engine_general', 'loyalty', 'full_payment_gateway', 'advanced_seo'],
  furniture: ['ecommerce_product_import', 'advanced_seo', 'full_payment_gateway', 'multilanguage'],
  pos: ['pos_addon_offline_sync', 'pos_addon_ecom_bridge', 'pos_addon_loyalty_sms', 'pos_addon_hardware_setup'],
  erp: ['three_region_backup', 'erp_mod_09_hr_payroll', 'erp_mod_10_crm_leads', 'erp_mod_11_multi_warehouse', 'erp_mod_13_procurement_po'],
  crm: ['mobile_salesman_android', 'multi_branch', 'supplier_rfq', 'analytics_dashboard'],
  logistics: ['mobile_salesman_android', 'mobile_security_android', 'maps_geolocation', 'analytics_dashboard'],
  saas: ['saas_payment_gateway', 'three_region_backup', 'ai_support_chatbot', 'analytics_dashboard'],
};

const fixText = value => String(value || '').replace(/Â·/g, '·').replace(/â€“|â€”/g, '–');

export const quotationCatalog = {
  ...catalog,
  packages: catalog.packages.map(item => ({ ...item, name: fixText(item.name), summary: fixText(item.summary), features: item.features.map(fixText) })),
  addons: catalog.addons.map(item => ({
    ...item,
    name: fixText(item.name),
    description: item.id === 'full_payment_gateway'
      ? 'Full payment processing, verified callbacks, reconciliation and security controls. Requires a client-owned merchant account.'
      : fixText(item.description),
  })),
};

export const projectCategories = categoryOrder
  .filter(category => quotationCatalog.packages.some(item => item.category === category))
  .map(id => ({ id, label: categoryNames[id] || id.replaceAll('_', ' ') }));

export const formatLkr = value => `LKR ${Math.round(Number(value) || 0).toLocaleString('en-LK')}`;
export const formatUsd = value => `USD ${Math.round(Number(value) || 0).toLocaleString('en-US')} / year`;
export const formatUsdMonthly = value => `USD ${Math.round(Number(value) || 0).toLocaleString('en-US')} / month`;
export const packageById = id => quotationCatalog.packages.find(item => item.id === id) || null;
export const addonById = id => quotationCatalog.addons.find(item => item.id === id) || null;
export const packagesForCategory = category => quotationCatalog.packages.filter(item => item.category === category);

export function compatibleAddons(selectedPackage) {
  if (!selectedPackage) return [];
  const includedIds = new Set((selectedPackage.includes || []).map(id => includedAddonAliases[id] || id));
  if (selectedPackage.category === 'erp') {
    for (const id of quotationCatalog.erp_core_included_ids || []) includedIds.add(id);
  }
  const featured = featuredAddonIds[selectedPackage.category] || [];
  return quotationCatalog.addons
    .filter(addon => Number.isFinite(addon.price_lkr) && !includedIds.has(addon.id))
    .filter(addon => !addon.allowed_categories?.length || addon.allowed_categories.includes(selectedPackage.category))
    .map(addon => ({ ...addon, featured: featured.length ? featured.includes(addon.id) : addon.allowed_categories?.includes(selectedPackage.category) }))
    .sort((a, b) => Number(b.featured) - Number(a.featured) || featured.indexOf(a.id) - featured.indexOf(b.id) || a.name.localeCompare(b.name));
}

export function calculateAnnualRenewal(selectedPackage, selectedAddons = []) {
  if (!selectedPackage) return { hasGateway: false, renewalBase: 0, renewalUplift: 0, renewalUsd: 0 };
  const renewalPolicy = quotationCatalog.policy.consolidated_renewal;
  const hasGateway = selectedAddons.some(addon => addon.id === 'full_payment_gateway' || addon.uses_gateway_renewal);
  const hosting = renewalPolicy.hosting_usd_year_by_tier[selectedPackage.renewal_hosting_tier]
    || renewalPolicy.hosting_usd_year_by_tier.basic;
  const packageRenewal = Number(selectedPackage.annual_renewal_usd);
  const renewalBase = hasGateway
    ? renewalPolicy.gateway_base_total_usd_year
    : Number.isFinite(packageRenewal) && packageRenewal > 0
      ? packageRenewal
      : renewalPolicy.domain_allowance_usd_year + renewalPolicy.service_fee_usd_year + hosting;
  const renewalUplift = selectedAddons.reduce((sum, addon) => sum + (Number(addon.estimated_annual_operating_uplift_usd) || 0), 0);
  return { hasGateway, renewalBase, renewalUplift, renewalUsd: renewalBase + renewalUplift };
}

function localDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export function createQuoteReference(now = new Date()) {
  const stamp = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('');
  let suffix = Math.floor(Math.random() * 9000) + 1000;
  try {
    const value = new Uint16Array(1);
    crypto.getRandomValues(value);
    suffix = 1000 + (value[0] % 9000);
  } catch { /* Math.random is sufficient for a human-readable proposal reference. */ }
  return `HICH-Q-${stamp}-${suffix}`;
}

export function buildQuotation({ packageId, addonIds = [], client = {}, now = new Date(), reference } = {}) {
  const selectedPackage = packageById(packageId);
  if (!selectedPackage) throw new Error('Choose a project package before generating the quotation.');
  const allowed = new Map(compatibleAddons(selectedPackage).map(addon => [addon.id, addon]));
  const selectedAddons = [...new Set(addonIds)].map(id => allowed.get(id)).filter(Boolean);
  const basePrice = Number(selectedPackage.base_price_lkr) || 0;
  const addonsTotal = selectedAddons.reduce((total, addon) => total + (Number(addon.price_lkr) || 0), 0);
  const subtotal = basePrice + addonsTotal;
  const discountPct = 0;
  const discount = 0;
  const total = subtotal;
  const { hasGateway, renewalBase, renewalUplift, renewalUsd } = calculateAnnualRenewal(selectedPackage, selectedAddons);
  const milestoneSet = total >= quotationCatalog.milestones.large.from_lkr ? quotationCatalog.milestones.large : quotationCatalog.milestones.small;
  const milestones = milestoneSet.stages.map(stage => ({
    ...stage,
    amount: Math.round(total * stage.percentage / 100),
  }));
  const createdAt = now instanceof Date ? now : new Date(now);
  const validUntil = new Date(createdAt);
  validUntil.setDate(validUntil.getDate() + quotationCatalog.policy.quote_validity_days);
  const approvalRequired = selectedPackage.pricing_status.includes('approval')
    || selectedAddons.some(addon => addon.pricing_status.includes('approval'))
    || selectedPackage.renewal_hosting_tier !== 'basic';

  return {
    reference: reference || createQuoteReference(createdAt),
    date: localDate(createdAt),
    year: createdAt.getFullYear(),
    validUntil: localDate(validUntil),
    package: selectedPackage,
    addons: selectedAddons,
    client: {
      name: String(client.name || '').trim(),
      company: String(client.company || '').trim(),
      email: String(client.email || '').trim(),
      phone: String(client.phone || '').trim(),
      objective: String(client.objective || '').trim(),
      targetLaunch: String(client.targetLaunch || '').trim(),
    },
    basePrice,
    addonsTotal,
    subtotal,
    discountPct,
    discount,
    total,
    renewalBase,
    renewalUplift,
    renewalUsd,
    milestones,
    approvalRequired,
    hasGateway,
  };
}

