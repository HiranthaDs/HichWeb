import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildQuotation, compatibleAddons, formatLkr, formatUsd, formatUsdMonthly, packageById, projectCategories, quotationCatalog,
} from '../src/quotation-engine.js';
import { quotationMessage, quotationWhatsApp } from '../src/quotation-share.js';

const client = { name: 'Test Client', objective: 'Launch a reliable online store.' };
const date = new Date('2026-10-22T12:00:00Z');

test('the complete quotation catalog is available', () => {
  assert.equal(quotationCatalog.packages.length, 37);
  assert.equal(quotationCatalog.addons.length, 59);
  assert.equal(projectCategories.length, 22);
});

test('basic pricing, renewal and validity are deterministic', () => {
  const quote = buildQuotation({ packageId: 'ecommerce_whatsapp', client, now: date, reference: 'TEST' });
  assert.equal(quote.total, 40000);
  assert.equal(quote.renewalUsd, 63);
  assert.equal(quote.validUntil, '01 Nov 2026');
  assert.deepEqual(quote.milestones.map(stage => stage.percentage), [50, 50]);
  assert.equal(quote.discount, 0, 'Catalog policy must not apply a discount automatically');
});

test('gateway renewal replaces normal hosting and adds explicit operating uplifts', () => {
  const quote = buildQuotation({
    packageId: 'ecommerce_whatsapp',
    addonIds: ['full_payment_gateway', 'ai_support_chatbot'],
    client,
    now: date,
    reference: 'TEST',
  });
  assert.equal(quote.total, 469000);
  assert.equal(quote.renewalUsd, 607);
  assert.deepEqual(quote.milestones.map(stage => stage.percentage), [30, 40, 20, 10]);
});

test('incompatible and already included add-ons cannot enter a quotation', () => {
  const erp = packageById('erp_manufacturing');
  const compatible = compatibleAddons(erp).map(addon => addon.id);
  assert.ok(!compatible.includes('full_payment_gateway'));
  assert.ok(!compatible.includes('erp_mod_07_user_roles'));
  const quote = buildQuotation({
    packageId: erp.id,
    addonIds: ['full_payment_gateway', 'erp_mod_09_hr_payroll'],
    client,
    reference: 'TEST',
  });
  assert.deepEqual(quote.addons.map(addon => addon.id), ['erp_mod_09_hr_payroll']);
  assert.equal(quote.total, 327000);
});

test('every ERP package includes the requested LKR 45,000 price increase', () => {
  assert.deepEqual(
    quotationCatalog.packages.filter(item => item.category === 'erp').map(item => [item.id, item.base_price_lkr]),
    [
      ['erp_spare_parts', 270000],
      ['erp_manufacturing', 285000],
      ['erp_sales_distribution', 290000],
      ['erp_enterprise', 535000],
    ],
  );
});

test('restaurant table and QR ordering uses the exact project and annual hosting prices', () => {
  const quote = buildQuotation({ packageId: 'restaurant_table_qr_ordering', client, now: date, reference: 'RESTAURANT' });
  assert.equal(quote.total, 419000);
  assert.equal(quote.renewalBase, 400);
  assert.equal(quote.renewalUplift, 0);
  assert.equal(quote.renewalUsd, 400);
  assert.match(quote.package.features.join(' '), /QR code/i);
  assert.match(quote.package.features.join(' '), /kitchen screen/i);
  assert.match(quote.package.features.join(' '), /invoice/i);
});

test('Custom SaaS exposes gateway and three-destination backup with clear recurring pricing', () => {
  const selectedPackage = packageById('custom_saas');
  const compatible = compatibleAddons(selectedPackage);
  const gateway = compatible.find(item => item.id === 'saas_payment_gateway');
  const backup = compatible.find(item => item.id === 'three_region_backup');
  assert.equal(gateway.price_lkr, 480000);
  assert.equal(gateway.price_label, 'Starting at');
  assert.equal(backup.price_lkr, 400000);
  assert.equal(backup.estimated_monthly_operating_uplift_usd, 140);
  assert.equal(backup.estimated_annual_operating_uplift_usd, 1680);
  assert.equal(formatUsdMonthly(backup.estimated_monthly_operating_uplift_usd), 'USD 140 / month');

  const quote = buildQuotation({
    packageId: selectedPackage.id,
    addonIds: [gateway.id, backup.id],
    client,
    now: date,
    reference: 'SAAS',
  });
  assert.equal(quote.total, 1370000);
  assert.equal(quote.renewalBase, 511);
  assert.equal(quote.renewalUplift, 1680);
  assert.equal(quote.renewalUsd, 2191);
  assert.equal(quote.hasGateway, true);
});

test('Company ERP offers the same three-destination backup price as Custom SaaS', () => {
  const companyErp = packageById('erp_enterprise');
  const backup = compatibleAddons(companyErp).find(item => item.id === 'three_region_backup');
  assert.equal(companyErp.name.startsWith('Company ERP'), true);
  assert.equal(backup.price_lkr, 400000);
  assert.equal(backup.estimated_monthly_operating_uplift_usd, 140);
  const quote = buildQuotation({ packageId: companyErp.id, addonIds: [backup.id], client, reference: 'ERP-BACKUP' });
  assert.equal(quote.total, 935000);
  assert.equal(quote.renewalUsd, 2003);
});

test('WhatsApp contains the complete quotation, not only its reference', () => {
  const quote = buildQuotation({ packageId: 'ecommerce_whatsapp', addonIds: ['full_payment_gateway'], reference: 'TEST-SHARE', now: date,
    client: { name: 'Client & partner', company: 'Café / සිංහල', email: 'client@example.com', phone: '+94770000000', objective: 'Sell books & manage orders\nShip nationwide.', targetLaunch: 'Flexible' } });
  const share = quotationWhatsApp(quote);
  assert.equal(share.requiresCopy, false);
  assert.equal(new URL(share.href).hostname, 'wa.me');
  assert.equal(new URL(share.href).pathname, '/94714112113');
  assert.equal(new URL(share.href).searchParams.get('text'), share.text);
  for (const value of [quote.reference, quote.date, quote.validUntil, ...Object.values(quote.client), quote.package.name, quote.package.summary, ...quote.package.features, ...quote.addons.flatMap(addon => [addon.name, addon.description, formatLkr(addon.price_lkr)]), formatLkr(quote.total), formatUsd(quote.renewalUsd), ...quote.milestones.flatMap(stage => [stage.title, `${stage.percentage}%`, formatLkr(stage.amount)])]) assert.ok(share.text.includes(value), value);
  assert.match(share.text, /taxes excluded/);
  assert.match(share.text, /not a contract, final quotation/);
  assert.doesNotMatch(share.text, /undefined|NaN/);
});

test('large quotations use copy-and-paste without dropping any scope or pricing', () => {
  const pkg = packageById('erp_enterprise');
  const quote = buildQuotation({ packageId: pkg.id, addonIds: compatibleAddons(pkg).map(item => item.id), client, reference: 'LARGE' });
  const share = quotationWhatsApp(quote);
  assert.equal(share.requiresCopy, true);
  assert.equal(share.href, 'https://wa.me/94714112113');
  assert.equal(share.text, quotationMessage(quote));
  for (const addon of quote.addons) assert.ok(share.text.includes(addon.description), addon.id);
  assert.ok(share.text.includes(formatLkr(quote.total)));
  assert.ok(share.text.includes('technical and management review'));
});
