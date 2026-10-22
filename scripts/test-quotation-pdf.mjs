import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { jsPDF } from 'jspdf';
import {
  buildQuotation, compatibleAddons, packageById,
} from '../src/quotation-engine.js';
import {
  generateQuotationPdf, QUOTATION_DRAFT_NOTICE, QUOTATION_PDF_THEME,
} from '../src/quotation-pdf.js';

let activeTrace = null;

jsPDF.API.events.push(['initialized', function instrumentQuotationPdf() {
  const trace = activeTrace;
  if (!trace) return;

  const originalText = this.text.bind(this);
  this.text = (value, ...args) => {
    trace.text.push({
      page: this.getCurrentPageInfo().pageNumber,
      value: Array.isArray(value) ? value.join('\n') : String(value),
    });
    return originalText(value, ...args);
  };

  const originalImage = this.addImage.bind(this);
  this.addImage = (...args) => {
    trace.images += 1;
    return originalImage(...args);
  };

  const originalAddFont = this.addFont.bind(this);
  this.addFont = (...args) => {
    trace.fonts.push(args.slice(1, 3));
    return originalAddFont(...args);
  };

  this.save = filename => {
    trace.filename = filename;
    trace.pdf = Buffer.from(this.output('arraybuffer'));
  };
}]);

const nativeFetch = globalThis.fetch;
globalThis.fetch = async input => {
  const url = String(input);
  if (url.startsWith('/fonts/')) {
    const bytes = await readFile(path.join('public', url.slice(1)));
    return new Response(bytes, { status: 200 });
  }
  return nativeFetch(input);
};

async function render(quote) {
  const trace = { text: [], fonts: [], images: 0, filename: '', pdf: null };
  activeTrace = trace;
  try {
    const result = await generateQuotationPdf(quote);
    return { result, trace };
  } finally {
    activeTrace = null;
  }
}

function assertPdfContract({ result, trace }) {
  assert.equal(result.draft, true);
  assert.equal(result.filename, trace.filename);
  assert.match(result.filename, /^HICH-draft-quotation-.+\.pdf$/);
  assert.ok(trace.pdf.length > 100_000, 'Embedded brand fonts produce a substantive PDF');

  const source = trace.pdf.toString('latin1');
  assert.equal(source.startsWith('%PDF-'), true);
  assert.ok(/\/MediaBox \[0 0 595\.2\d+ 841\.8\d+\]/.test(source), 'Page size is A4');
  assert.equal((source.match(/\/Type \/Page\b/g) || []).length, result.pages);
  assert.match(source, /Anton/);
  assert.match(source, /Inter/);
  assert.doesNotMatch(source, /\/Subtype \/Image/, 'The PDF uses the text wordmark, not a raster logo');
  assert.equal(trace.images, 0);
  assert.deepEqual(trace.fonts, [
    ['Anton', 'normal'],
    ['Inter', 'normal'],
    ['Inter', 'bold'],
  ]);

  const footerLine = trace.text.filter(item => item.value === 'THIS IS NOT A FINAL QUOTATION OR PROPOSAL.');
  assert.deepEqual(footerLine.map(item => item.page), Array.from({ length: result.pages }, (_, index) => index + 1));
  assert.equal(trace.text.filter(item => item.value === 'VALIDATE WITH THE HICH TEAM.').length, result.pages);
  assert.ok(trace.text.filter(item => item.value === 'HICH').length >= result.pages, 'The HICH text wordmark is repeated throughout');
  assert.ok(trace.text.some(item => item.value.includes('+94 71 411 2113') && item.value.includes('info@hichweb.com')));
}

test('quotation PDF uses the exact HICH brand system and an every-page draft notice', async () => {
  assert.deepEqual(QUOTATION_PDF_THEME, {
    ink: [8, 8, 8],
    blue: [16, 67, 249],
    pink: [255, 52, 84],
    paper: [245, 245, 243],
    muted: [104, 104, 104],
    line: [222, 222, 219],
    white: [255, 255, 255],
    softBlue: [238, 242, 255],
  });
  assert.equal(QUOTATION_DRAFT_NOTICE, 'VALIDATE WITH THE HICH TEAM. THIS IS NOT A FINAL QUOTATION OR PROPOSAL.');

  const quote = buildQuotation({
    packageId: 'ecommerce_whatsapp',
    now: new Date('2026-10-22T00:00:00Z'),
    reference: 'HICH-Q-PDF-0001',
    client: {
      name: 'PDF Test Client',
      company: 'HICH Test Company',
      email: 'client@example.com',
      phone: '+94 77 123 4567',
      objective: 'Create a fast, manageable storefront with a clear WhatsApp ordering journey.',
      targetLaunch: 'January 2027',
    },
  });
  const rendered = await render(quote);
  assertPdfContract(rendered);
  assert.equal(rendered.result.pages, 5);
});

test('maximum client copy and all 40 ERP enhancements paginate without losing the footer', async () => {
  const selectedPackage = packageById('erp_enterprise');
  const addonIds = compatibleAddons(selectedPackage).map(item => item.id);
  assert.equal(addonIds.length, 40);

  const quote = buildQuotation({
    packageId: selectedPackage.id,
    addonIds,
    now: new Date('2026-10-22T00:00:00Z'),
    reference: 'HICH-Q-PDF-0040',
    client: {
      name: 'Hirantha Dias Senior Digital Transformation and Enterprise Operations Director',
      company: 'International Manufacturing Distribution and Customer Experience Holdings Private Limited',
      email: 'digital.transformation.and.enterprise.operations@example-international-holdings.com',
      phone: '+94 71 411 2113 extension 204',
      objective: 'Build a secure, scalable and operationally complete enterprise platform that connects manufacturing, warehousing, procurement, field sales, finance, customer service, delivery teams and senior management. The system should reduce manual work, provide trustworthy live reporting, preserve a clear audit trail, support role-based access across many branches, and create a practical foundation for future mobile workflows, customer experiences and third-party integrations. '.repeat(2).slice(0, 500),
      targetLaunch: 'Phased rollout beginning in the first quarter of 2027, subject to discovery',
    },
  });
  const rendered = await render(quote);
  assertPdfContract(rendered);
  assert.ok(rendered.result.pages >= 9, 'The complete scope is preserved across continuation pages');
  assert.ok(rendered.trace.text.some(item => item.value.includes('40') && item.page > 2), 'All enhancement rows reach the PDF');
});
