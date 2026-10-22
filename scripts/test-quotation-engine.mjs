import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildQuotation, compatibleAddons, formatLkr, formatUsd, packageById, projectCategories, quotationCatalog,
} from '../src/quotation-engine.js';
import { quotationMessage, quotationWhatsApp } from '../src/quotation-share.js';

const client = { name: 'Test Client', objective: 'Launch a reliable online store.' };
const date = new Date('2026-10-22T12:00:00Z');

test('the complete quotation catalog is available', () => {
  assert.equal(quotationCatalog.packages.length, 36);
  assert.equal(quotationCatalog.addons.length, 58);
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
  assert.equal(quote.total, 282000);
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
