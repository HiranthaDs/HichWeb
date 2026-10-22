import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildQuotation, compatibleAddons, packageById, projectCategories, quotationCatalog,
} from '../src/quotation-engine.js';

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
