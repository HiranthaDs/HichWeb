import { formatLkr, formatUsd, quotationCatalog } from './quotation-engine.js';

// These are the canonical HICH website tokens from styles.css.
export const QUOTATION_PDF_THEME = Object.freeze({
  ink: [8, 8, 8],
  blue: [16, 67, 249],
  pink: [255, 52, 84],
  paper: [245, 245, 243],
  muted: [104, 104, 104],
  line: [222, 222, 219],
  white: [255, 255, 255],
  softBlue: [238, 242, 255],
});

export const QUOTATION_DRAFT_NOTICE = 'VALIDATE WITH THE HICH TEAM. THIS IS NOT A FINAL QUOTATION OR PROPOSAL.';

const FONT_ASSETS = [
  ['/fonts/anton.ttf', 'anton.ttf', 'Anton', 'normal'],
  ['/fonts/inter-regular.ttf', 'inter-regular.ttf', 'Inter', 'normal'],
  ['/fonts/inter-semibold.ttf', 'inter-semibold.ttf', 'Inter', 'bold'],
];

const MM_PER_POINT = 0.352778;

async function fontAsBase64(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Font unavailable: ${url}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

async function registerBrandFonts(doc) {
  try {
    const encoded = await Promise.all(FONT_ASSETS.map(([url]) => fontAsBase64(url)));
    FONT_ASSETS.forEach(([, filename, family, style], index) => {
      doc.addFileToVFS(filename, encoded[index]);
      doc.addFont(filename, family, style);
    });
    return true;
  } catch {
    // A network or cache failure should not prevent the client receiving the document.
    return false;
  }
}

export async function generateQuotationPdf(quote) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true, putOnlyUsedFonts: true });
  const fontsReady = await registerBrandFonts(doc);
  const COLORS = QUOTATION_PDF_THEME;
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const contentBottom = 269;
  const footerTop = 275;
  const bodyFont = fontsReady ? 'Inter' : 'helvetica';
  const displayFont = fontsReady ? 'Anton' : 'helvetica';
  const website = String(quotationCatalog.company.website || 'https://hichweb.com').replace(/^https?:\/\//, '').replace(/\/$/, '');

  doc.setProperties({
    title: `HICH draft quotation ${quote.reference}`,
    subject: 'Indicative project quotation requiring validation by the HICH team',
    author: quotationCatalog.company.name,
    creator: 'Chathu Quotation Chatbot',
    keywords: 'HICH, draft quotation, website, development, proposal',
  });

  const setText = (size, color = COLORS.ink, style = 'normal', family = 'body', tracking = 0) => {
    doc.setFont(family === 'display' ? displayFont : bodyFont, family === 'display' ? 'normal' : style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.setCharSpace(tracking);
  };

  const splitLines = (value, width, options = {}) => {
    setText(options.size || 9, options.color || COLORS.ink, options.style || 'normal', options.family || 'body', options.tracking || 0);
    return doc.splitTextToSize(String(value || ''), width);
  };

  const lineHeight = (size, factor = 1.45) => size * MM_PER_POINT * factor;

  const wrapped = (value, x, y, width, options = {}) => {
    const size = options.size || 9;
    const factor = options.lineHeightFactor || 1.45;
    const lines = splitLines(value, width, options);
    doc.text(lines, x, y, { lineHeightFactor: factor, align: options.align || 'left' });
    return y + Math.max(lines.length, 1) * lineHeight(size, factor);
  };

  const rule = (y, x1 = margin, x2 = pageWidth - margin, color = COLORS.line, width = 0.28) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(width);
    doc.line(x1, y, x2, y);
  };

  const drawSpark = (x, y, radius = 4, color = COLORS.pink) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(Math.max(0.45, radius * 0.12));
    doc.line(x, y - radius, x, y + radius);
    doc.line(x - radius, y, x + radius, y);
    doc.line(x - radius * 0.7, y - radius * 0.7, x + radius * 0.7, y + radius * 0.7);
    doc.line(x + radius * 0.7, y - radius * 0.7, x - radius * 0.7, y + radius * 0.7);
  };

  const drawWordmark = (x, y, { inverse = false, scale = 1 } = {}) => {
    const primary = inverse ? COLORS.white : COLORS.ink;
    setText(20 * scale, primary, 'normal', 'display');
    doc.text('HICH', x, y);
    const nameWidth = doc.getTextWidth('HICH');
    setText(20 * scale, COLORS.pink, 'normal', 'display');
    doc.text('.', x + nameWidth + 0.2 * scale, y);
    const dotWidth = doc.getTextWidth('.');
    const captionX = x + nameWidth + dotWidth + 1.7 * scale;
    const captionColor = inverse ? [210, 210, 207] : COLORS.ink;
    setText(Math.max(2.6, 3.2 * scale), captionColor, 'bold', 'body', 0.08 * scale);
    doc.text('WEB', captionX, y - 4.5 * scale);
    doc.text('DEVELOPMENT', captionX, y - 1.45 * scale);
  };

  const drawFooter = (number, pages) => {
    doc.setFillColor(...COLORS.ink);
    doc.rect(0, footerTop, pageWidth, pageHeight - footerTop, 'F');
    drawWordmark(margin, 288.3, { inverse: true, scale: 0.62 });
    setText(5.7, COLORS.pink, 'bold', 'body', 0.18);
    doc.text('DRAFT ESTIMATE / TEAM VALIDATION REQUIRED', 50, 282.4);
    setText(6.4, COLORS.white, 'bold', 'body', 0.03);
    doc.text('VALIDATE WITH THE HICH TEAM.', 50, 287.1);
    setText(6.1, [190, 190, 187], 'normal', 'body', 0.02);
    doc.text('THIS IS NOT A FINAL QUOTATION OR PROPOSAL.', 50, 291.4);
    setText(6.4, COLORS.white, 'bold');
    doc.text(`${String(number).padStart(2, '0')} / ${String(pages).padStart(2, '0')}`, pageWidth - margin, 287.2, { align: 'right' });
  };

  const drawPageHeader = label => {
    drawWordmark(margin, 15.4, { scale: 0.64 });
    setText(6.3, COLORS.blue, 'bold', 'body', 0.18);
    doc.text('DRAFT QUOTATION', pageWidth - margin, 10.5, { align: 'right' });
    setText(6.2, COLORS.muted, 'normal', 'body', 0.06);
    doc.text(label.toUpperCase(), pageWidth - margin, 15, { align: 'right' });
    rule(21.5);
    setText(6.4, COLORS.muted, 'normal', 'body', 0.05);
    doc.text(quote.reference, margin, 27.2);
    doc.text(`ISSUED ${quote.date.toUpperCase()}  /  VALID UNTIL ${quote.validUntil.toUpperCase()}`, pageWidth - margin, 27.2, { align: 'right' });
    return 39;
  };

  const sectionTitle = (number, title, y) => {
    doc.setFillColor(...COLORS.blue);
    doc.roundedRect(margin, y - 4.8, 10, 7.2, 3.6, 3.6, 'F');
    setText(6.5, COLORS.white, 'bold', 'body', 0.03);
    doc.text(String(number).padStart(2, '0'), margin + 5, y - 0.05, { align: 'center' });
    setText(18, COLORS.ink, 'normal', 'display');
    doc.text(title.toUpperCase(), margin + 15, y + 2.1);
    rule(y + 8.2);
    return y + 17;
  };

  const continuationTitle = (number, title, y) => {
    setText(6.8, COLORS.blue, 'bold', 'body', 0.17);
    doc.text(`${String(number).padStart(2, '0')} / ${title.toUpperCase()} — CONTINUED`, margin, y);
    rule(y + 5);
    return y + 13;
  };

  const valueOrFallback = value => String(value || '').trim() || 'Not provided';
  let y;
  let currentPageLabel = '';

  const startContentPage = label => {
    doc.addPage();
    currentPageLabel = label;
    y = drawPageHeader(label);
  };

  const ensureSpace = (height, continuation) => {
    if (y + height <= contentBottom) return false;
    startContentPage(currentPageLabel);
    if (continuation) y = continuationTitle(continuation.number, continuation.title, y);
    return true;
  };

  // Cover: a direct translation of the website's editorial hero and wordmark.
  drawWordmark(margin, 19.5);
  setText(6.3, COLORS.ink, 'bold', 'body', 0.16);
  doc.text('DESIGN + TECHNOLOGY', pageWidth - margin, 14.4, { align: 'right' });
  setText(6.1, COLORS.muted, 'normal', 'body', 0.12);
  doc.text('A LITTLE EXTRAORDINARY.', pageWidth - margin, 19.1, { align: 'right' });
  rule(27.5);

  doc.setFillColor(...COLORS.pink);
  doc.roundedRect(margin, 35, 39, 8, 4, 4, 'F');
  setText(6.4, COLORS.white, 'bold', 'body', 0.16);
  doc.text(`DRAFT / ${quote.year}`, margin + 19.5, 40.2, { align: 'center' });
  setText(42, COLORS.ink, 'normal', 'display');
  doc.text('PROJECT', margin, 66.5);
  setText(42, COLORS.blue, 'normal', 'display');
  doc.text('QUOTATION', margin, 86.5);
  drawSpark(181.5, 64, 7.3);
  setText(9.2, COLORS.ink, 'bold', 'body');
  const packageLines = doc.splitTextToSize(quote.package.name.toUpperCase(), 160).slice(0, 2);
  doc.text(packageLines, margin, 99.5, { lineHeightFactor: 1.2 });

  const panelY = 112;
  const panelHeight = 56;
  const investmentWidth = 59;
  doc.setFillColor(...COLORS.ink);
  doc.rect(margin, panelY, contentWidth - investmentWidth, panelHeight, 'F');
  doc.setFillColor(...COLORS.blue);
  doc.rect(pageWidth - margin - investmentWidth, panelY, investmentWidth, panelHeight, 'F');
  setText(6.4, [185, 185, 182], 'bold', 'body', 0.16);
  doc.text('PREPARED FOR', margin + 7, panelY + 11);
  setText(18.5, COLORS.white, 'normal', 'display');
  const preparedFor = valueOrFallback(quote.client.company || quote.client.name).toUpperCase();
  const clientLines = doc.splitTextToSize(preparedFor, contentWidth - investmentWidth - 17).slice(0, 2);
  doc.text(clientLines, margin + 7, panelY + 25, { lineHeightFactor: 1.05 });
  setText(7.2, [185, 185, 182], 'normal', 'body');
  const contactName = quote.client.company && quote.client.name ? quote.client.name : 'Prepared with Chathu';
  doc.text(contactName, margin + 7, panelY + 47, { maxWidth: contentWidth - investmentWidth - 17 });
  setText(6.2, [222, 229, 255], 'bold', 'body', 0.12);
  doc.text('INDICATIVE INVESTMENT', pageWidth - margin - investmentWidth + 7, panelY + 11);
  setText(14, COLORS.white, 'bold', 'body');
  doc.text(formatLkr(quote.total), pageWidth - margin - investmentWidth + 7, panelY + 26, { maxWidth: investmentWidth - 14 });
  setText(6.5, [222, 229, 255], 'normal', 'body');
  doc.text('ONE-TIME DEVELOPMENT', pageWidth - margin - investmentWidth + 7, panelY + 39);
  doc.text('TAXES EXCLUDED', pageWidth - margin - investmentWidth + 7, panelY + 45);

  const metaY = 181;
  const metaItems = [
    ['REFERENCE', quote.reference],
    ['ISSUED', quote.date],
    ['VALID UNTIL', quote.validUntil],
  ];
  const metaWidth = contentWidth / 3;
  metaItems.forEach(([label, value], index) => {
    const x = margin + index * metaWidth;
    if (index) {
      doc.setDrawColor(...COLORS.line);
      doc.setLineWidth(0.28);
      doc.line(x, metaY - 4, x, metaY + 14);
    }
    setText(6.2, COLORS.muted, 'bold', 'body', 0.13);
    doc.text(label, x + (index ? 6 : 0), metaY);
    setText(8.2, COLORS.ink, 'bold');
    doc.text(value, x + (index ? 6 : 0), metaY + 8);
  });
  rule(metaY + 17);

  setText(6.6, COLORS.blue, 'bold', 'body', 0.17);
  doc.text('A CLEAR STARTING POINT', margin, 210);
  const intro = `A focused ${quote.package.name.toLowerCase()} shaped around the requirements shared with Chathu. This document brings the proposed scope, selected enhancements, indicative investment, delivery milestones and ongoing service estimate into one clear starting point.`;
  wrapped(intro, margin, 220, contentWidth, { size: 9.5, color: COLORS.ink, lineHeightFactor: 1.52 });

  doc.setFillColor(...COLORS.paper);
  doc.roundedRect(margin, 246, contentWidth, 23, 2.5, 2.5, 'F');
  doc.setFillColor(...COLORS.pink);
  doc.rect(margin, 246, 2.5, 23, 'F');
  setText(6.3, COLORS.pink, 'bold', 'body', 0.14);
  doc.text('TEAM VALIDATION REQUIRED', margin + 7, 253.5);
  setText(7.5, COLORS.ink, 'bold');
  doc.text(QUOTATION_DRAFT_NOTICE, margin + 7, 260.3, { maxWidth: 119 });
  setText(6.8, COLORS.muted);
  doc.text(`${quotationCatalog.company.phone}  /  ${quotationCatalog.company.email}  /  ${website}`, pageWidth - margin - 7, 266, { align: 'right' });

  // Project brief and selected foundation.
  startContentPage('Brief, scope & investment');
  y = sectionTitle(1, 'Project brief', y);

  setText(11.5, COLORS.ink, 'bold');
  const foundationName = doc.splitTextToSize(quote.package.name, 116);
  setText(7.7, COLORS.muted);
  const foundationSummary = doc.splitTextToSize(quote.package.summary || '', 116);
  const foundationHeight = Math.max(34, 12 + foundationName.length * lineHeight(11.5, 1.25) + foundationSummary.length * lineHeight(7.7, 1.42));
  doc.setFillColor(...COLORS.paper);
  doc.roundedRect(margin, y, contentWidth, foundationHeight, 3, 3, 'F');
  setText(6.3, COLORS.blue, 'bold', 'body', 0.14);
  doc.text('SELECTED FOUNDATION', margin + 7, y + 8);
  setText(11.5, COLORS.ink, 'bold');
  doc.text(foundationName, margin + 7, y + 17, { lineHeightFactor: 1.25 });
  const summaryY = y + 18 + foundationName.length * lineHeight(11.5, 1.25);
  setText(7.7, COLORS.muted);
  doc.text(foundationSummary, margin + 7, summaryY, { lineHeightFactor: 1.42 });
  setText(10, COLORS.ink, 'bold');
  doc.text(formatLkr(quote.basePrice), pageWidth - margin - 7, y + 17, { align: 'right' });
  setText(6.2, COLORS.muted, 'normal', 'body', 0.08);
  doc.text('BASE PROJECT PRICE', pageWidth - margin - 7, y + 24, { align: 'right' });
  y += foundationHeight + 8;

  const clientValue = quote.client.company ? `${quote.client.company}\n${quote.client.name}` : valueOrFallback(quote.client.name);
  const contactValue = [quote.client.email, quote.client.phone].filter(Boolean).join('\n') || 'Not provided';
  const launchValue = valueOrFallback(quote.client.targetLaunch);
  const infoValues = [clientValue, contactValue, launchValue];
  const infoLabels = ['PREPARED FOR', 'CONTACT', 'TARGET LAUNCH'];
  const infoWidth = contentWidth / 3;
  const infoLineSets = infoValues.map(value => splitLines(value, infoWidth - 12, { size: 8.1, style: 'bold' }));
  const infoHeight = Math.max(26, 13 + Math.max(...infoLineSets.map(lines => lines.length)) * lineHeight(8.1, 1.4));
  ensureSpace(infoHeight + 8, { number: 1, title: 'Project brief' });
  rule(y);
  infoValues.forEach((value, index) => {
    const x = margin + index * infoWidth;
    if (index) {
      doc.setDrawColor(...COLORS.line);
      doc.setLineWidth(0.28);
      doc.line(x, y, x, y + infoHeight);
    }
    setText(6.1, COLORS.muted, 'bold', 'body', 0.13);
    doc.text(infoLabels[index], x + (index ? 6 : 0), y + 8);
    setText(8.1, COLORS.ink, 'bold');
    doc.text(infoLineSets[index], x + (index ? 6 : 0), y + 17, { lineHeightFactor: 1.4 });
  });
  rule(y + infoHeight);
  y += infoHeight + 8;

  const objective = valueOrFallback(quote.client.objective || quote.package.summary);
  const objectiveLines = splitLines(objective, contentWidth - 14, { size: 9.2 });
  const objectiveHeight = 17 + objectiveLines.length * lineHeight(9.2, 1.52);
  ensureSpace(objectiveHeight + 8, { number: 1, title: 'Project brief' });
  doc.setFillColor(...COLORS.paper);
  doc.roundedRect(margin, y, contentWidth, objectiveHeight, 3, 3, 'F');
  doc.setFillColor(...COLORS.pink);
  doc.rect(margin, y, 2.5, objectiveHeight, 'F');
  setText(6.2, COLORS.pink, 'bold', 'body', 0.14);
  doc.text('PROJECT OBJECTIVE', margin + 7, y + 8);
  setText(9.2, COLORS.ink);
  doc.text(objectiveLines, margin + 7, y + 16, { lineHeightFactor: 1.52 });
  y += objectiveHeight + 10;

  ensureSpace(30);
  y = sectionTitle(2, 'Included scope', y);
  y = wrapped('The selected project foundation includes the following core deliverables.', margin, y, contentWidth, { size: 8.4, color: COLORS.muted, lineHeightFactor: 1.45 }) + 5;
  const features = quote.package.features || [];
  for (let index = 0; index < features.length; index += 2) {
    const pair = features.slice(index, index + 2);
    const gap = 8;
    const columnWidth = (contentWidth - gap) / 2;
    const pairLines = pair.map(feature => splitLines(feature, columnWidth - 15, { size: 8.5, style: 'bold' }));
    const rowHeight = Math.max(14, 7 + Math.max(...pairLines.map(lines => lines.length)) * lineHeight(8.5, 1.35));
    ensureSpace(rowHeight, { number: 2, title: 'Included scope' });
    pair.forEach((feature, pairIndex) => {
      const featureIndex = index + pairIndex;
      const x = margin + pairIndex * (columnWidth + gap);
      doc.setDrawColor(...COLORS.blue);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y + 3.6, 8, 6, 3, 3, 'S');
      setText(5.8, COLORS.blue, 'bold');
      doc.text(String(featureIndex + 1).padStart(2, '0'), x + 4, y + 7.7, { align: 'center' });
      setText(8.5, COLORS.ink, 'bold');
      doc.text(pairLines[pairIndex], x + 12, y + 7.8, { lineHeightFactor: 1.35 });
      rule(y + rowHeight, x, x + columnWidth);
    });
    y += rowHeight;
  }
  y += 10;

  ensureSpace(28);
  y = sectionTitle(3, quote.addons.length ? 'Selected enhancements' : 'Enhancements', y);
  if (!quote.addons.length) {
    const emptyHeight = 24;
    ensureSpace(emptyHeight, { number: 3, title: 'Enhancements' });
    doc.setFillColor(...COLORS.paper);
    doc.roundedRect(margin, y, contentWidth, emptyHeight, 3, 3, 'F');
    setText(8.8, COLORS.ink, 'bold');
    doc.text('No optional enhancements selected.', margin + 7, y + 10);
    setText(7.8, COLORS.muted);
    doc.text('Additional requirements can be reviewed and priced by the HICH team before the final quotation.', margin + 7, y + 17);
    y += emptyHeight + 9;
  } else {
    y = wrapped('These additions were selected in Chathu and are included in the indicative total below.', margin, y, contentWidth, { size: 8.4, color: COLORS.muted }) + 5;
    quote.addons.forEach((addon, index) => {
      const textWidth = 119;
      const addonNameLines = splitLines(addon.name, textWidth, { size: 8.9, style: 'bold' });
      const addonDescriptionLines = splitLines(addon.description || 'Selected project enhancement.', textWidth, { size: 7.3, color: COLORS.muted });
      const rowHeight = Math.max(20, 8 + addonNameLines.length * lineHeight(8.9, 1.3) + addonDescriptionLines.length * lineHeight(7.3, 1.4));
      ensureSpace(rowHeight, { number: 3, title: 'Selected enhancements' });
      if (index % 2 === 0) {
        doc.setFillColor(...COLORS.paper);
        doc.rect(margin, y, contentWidth, rowHeight, 'F');
      }
      setText(6.1, COLORS.blue, 'bold');
      doc.text(String(index + 1).padStart(2, '0'), margin + 5, y + 8);
      setText(8.9, COLORS.ink, 'bold');
      doc.text(addonNameLines, margin + 17, y + 8, { lineHeightFactor: 1.3 });
      const addonDescriptionY = y + 9 + addonNameLines.length * lineHeight(8.9, 1.3);
      setText(7.3, COLORS.muted);
      doc.text(addonDescriptionLines, margin + 17, addonDescriptionY, { lineHeightFactor: 1.4 });
      setText(8.5, addon.price_lkr ? COLORS.ink : COLORS.blue, 'bold');
      doc.text(addon.price_lkr ? formatLkr(addon.price_lkr) : 'INCLUDED', pageWidth - margin - 6, y + 8, { align: 'right' });
      rule(y + rowHeight);
      y += rowHeight;
    });
    y += 9;
  }

  // Keep pricing with a short enhancements page; otherwise begin a clean investment spread.
  if (y + 137 > contentBottom) startContentPage('Investment & ongoing service');
  y = sectionTitle(4, 'Investment summary', y);
  const investmentRows = [
    ['Project foundation', formatLkr(quote.basePrice)],
    ['Selected enhancements', formatLkr(quote.addonsTotal)],
  ];
  investmentRows.forEach(([label, value], index) => {
    if (index % 2 === 0) {
      doc.setFillColor(...COLORS.paper);
      doc.rect(margin, y, contentWidth, 12, 'F');
    }
    setText(8.4, COLORS.muted);
    doc.text(label, margin + 6, y + 7.7);
    setText(8.7, COLORS.ink, 'bold');
    doc.text(value, pageWidth - margin - 6, y + 7.7, { align: 'right' });
    y += 12;
  });
  doc.setFillColor(...COLORS.ink);
  doc.roundedRect(margin, y + 2, contentWidth, 22, 3, 3, 'F');
  setText(6.4, [190, 190, 187], 'bold', 'body', 0.13);
  doc.text('INDICATIVE TOTAL / TAXES EXCLUDED', margin + 7, y + 10);
  setText(11, COLORS.white, 'bold');
  doc.text('TOTAL PROJECT INVESTMENT', margin + 7, y + 18);
  setText(15, COLORS.pink, 'bold');
  doc.text(formatLkr(quote.total), pageWidth - margin - 7, y + 18, { align: 'right' });
  y += 36;

  y = sectionTitle(5, 'Ongoing service', y);
  doc.setFillColor(...COLORS.blue);
  doc.roundedRect(margin, y, contentWidth, 43, 3, 3, 'F');
  setText(6.2, [222, 229, 255], 'bold', 'body', 0.14);
  doc.text('CONSOLIDATED ANNUAL RENEWAL ESTIMATE', margin + 8, y + 10);
  setText(20, COLORS.white, 'normal', 'display');
  doc.text(formatUsd(quote.renewalUsd).toUpperCase(), margin + 8, y + 25);
  wrapped('Configured domain allowance, hosting and standard service are combined into one planning estimate. Provider pricing, usage and the validated production architecture may change the final renewal.', 102, y + 10, 86, { size: 7.4, color: [230, 235, 255], lineHeightFactor: 1.45 });
  y += 56;

  if (y + 52 <= contentBottom) {
    setText(6.4, COLORS.pink, 'bold', 'body', 0.14);
    doc.text('PLANNING BASIS', margin, y);
    y += 7;
    const planningNotes = [
      ['ONE-TIME', 'Development and selected enhancements are shown in LKR.'],
      ['ANNUAL', 'The renewal estimate is separate from project investment.'],
      ['VALIDATE', 'Taxes, third-party fees and final architecture need team review.'],
    ];
    const planningGap = 5;
    const planningWidth = (contentWidth - planningGap * 2) / 3;
    planningNotes.forEach(([title, copy], index) => {
      const x = margin + index * (planningWidth + planningGap);
      doc.setFillColor(...COLORS.paper);
      doc.roundedRect(x, y, planningWidth, 38, 3, 3, 'F');
      setText(9.5, COLORS.ink, 'normal', 'display');
      doc.text(title, x + 6, y + 12);
      wrapped(copy, x + 6, y + 21, planningWidth - 12, { size: 7.1, color: COLORS.muted, lineHeightFactor: 1.38 });
    });
  }

  // Delivery and the path from an automated draft to an approved quotation.
  startContentPage('Delivery & finalisation');
  y = sectionTitle(6, 'Delivery & payments', y);
  y = wrapped('Delivery dates are confirmed after HICH validates the scope, content readiness and technical dependencies. The indicative payment stages are shown below.', margin, y, contentWidth, { size: 8.8, color: COLORS.muted, lineHeightFactor: 1.5 }) + 7;
  const milestoneGap = 4;
  const milestoneWidth = (contentWidth - milestoneGap * (quote.milestones.length - 1)) / quote.milestones.length;
  const milestoneHeight = 40;
  quote.milestones.forEach((stage, index) => {
    const x = margin + index * (milestoneWidth + milestoneGap);
    doc.setFillColor(...(index === 0 ? COLORS.softBlue : COLORS.paper));
    doc.roundedRect(x, y, milestoneWidth, milestoneHeight, 3, 3, 'F');
    setText(18, index === 0 ? COLORS.blue : COLORS.ink, 'normal', 'display');
    doc.text(`${stage.percentage}%`, x + 5, y + 12);
    setText(7.6, COLORS.ink, 'bold');
    const milestoneTitle = doc.splitTextToSize(stage.title, milestoneWidth - 10).slice(0, 2);
    doc.text(milestoneTitle, x + 5, y + 21, { lineHeightFactor: 1.3 });
    setText(7.2, COLORS.muted);
    doc.text(formatLkr(stage.amount), x + 5, y + 34);
  });
  y += milestoneHeight + 13;

  ensureSpace(70);
  y = sectionTitle(7, 'From draft to final', y);
  const finalSteps = [
    ['01', 'REVIEW', 'Check requirements, content and selected enhancements.'],
    ['02', 'VALIDATE', 'Confirm scope, pricing, timeline and dependencies with HICH.'],
    ['03', 'FINALISE', 'Receive the final quotation and project agreement before payment.'],
  ];
  const stepGap = 5;
  const stepWidth = (contentWidth - stepGap * 2) / 3;
  finalSteps.forEach(([number, title, copy], index) => {
    const x = margin + index * (stepWidth + stepGap);
    doc.setFillColor(...COLORS.paper);
    doc.roundedRect(x, y, stepWidth, 38, 3, 3, 'F');
    setText(6.3, index === 1 ? COLORS.pink : COLORS.blue, 'bold', 'body', 0.12);
    doc.text(number, x + 6, y + 8);
    setText(10.5, COLORS.ink, 'normal', 'display');
    doc.text(title, x + 6, y + 17);
    wrapped(copy, x + 6, y + 24, stepWidth - 12, { size: 7.1, color: COLORS.muted, lineHeightFactor: 1.35 });
  });
  y += 49;
  doc.setFillColor(...COLORS.ink);
  doc.roundedRect(margin, y, contentWidth, 45, 3, 3, 'F');
  setText(6.2, COLORS.pink, 'bold', 'body', 0.14);
  doc.text('BEFORE WORK STARTS', margin + 8, y + 10);
  setText(16.5, COLORS.white, 'normal', 'display');
  doc.text('VALIDATE. APPROVE. THEN BUILD.', margin + 8, y + 24);
  setText(7.4, [205, 205, 201]);
  doc.text('The HICH team will confirm the final document, responsibilities and kickoff payment.', margin + 8, y + 34);
  setText(7.4, COLORS.white, 'bold');
  doc.text(`${quotationCatalog.company.phone}  /  ${quotationCatalog.company.email}`, margin + 8, y + 40.5);
  drawSpark(pageWidth - margin - 13, y + 22.5, 6.5, COLORS.pink);

  // Commercial notes deliberately live on a calm final page rather than competing with pricing.
  startContentPage('Commercial notes & validation');
  y = sectionTitle(8, 'Commercial notes', y);
  const notes = [
    `This automated draft is available for planning until ${quote.validUntil}; HICH must revalidate all details before issuing a final quotation.`,
    'Taxes are excluded unless they are expressly included in the final written quotation or agreement.',
    'Merchant, messaging and other third-party accounts, subscriptions and transaction fees are supplied or paid by the client unless agreed otherwise.',
    'Work begins only after the final scope and agreement are approved, the applicable kickoff payment is received, and the required content and access are available.',
    'Requests outside the validated scope are reviewed and quoted through a written variation before implementation.',
    'The annual renewal is an indicative bundled estimate. Usage, exchange rates, provider prices and production architecture may change the final amount.',
    quote.approvalRequired
      ? 'This selection includes custom, managed-service or infrastructure items that require HICH management and technical approval.'
      : 'Final delivery dates, responsibilities and warranty details are confirmed in the project agreement issued by HICH.',
    'This PDF is generated from details supplied in Chathu. It is not a contract, acceptance document, final quotation or final proposal.',
  ];
  notes.forEach((note, index) => {
    const noteLines = splitLines(note, contentWidth - 19, { size: 8.2, color: COLORS.muted });
    const noteHeight = Math.max(12, 5 + noteLines.length * lineHeight(8.2, 1.42));
    ensureSpace(noteHeight, { number: 8, title: 'Commercial notes' });
    doc.setDrawColor(...(index === notes.length - 1 ? COLORS.pink : COLORS.blue));
    doc.setLineWidth(0.35);
    doc.roundedRect(margin, y + 2.5, 8, 6, 3, 3, 'S');
    setText(5.8, index === notes.length - 1 ? COLORS.pink : COLORS.blue, 'bold');
    doc.text(String(index + 1).padStart(2, '0'), margin + 4, y + 6.6, { align: 'center' });
    setText(8.2, COLORS.muted);
    doc.text(noteLines, margin + 14, y + 7, { lineHeightFactor: 1.42 });
    rule(y + noteHeight);
    y += noteHeight;
  });

  ensureSpace(65, { number: 8, title: 'Commercial notes' });
  y += 8;
  doc.setFillColor(...COLORS.ink);
  doc.roundedRect(margin, y, contentWidth, 53, 3, 3, 'F');
  setText(6.4, COLORS.pink, 'bold', 'body', 0.15);
  doc.text('VALIDATION REQUIRED', margin + 8, y + 11);
  setText(19, COLORS.white, 'normal', 'display');
  doc.text('LET’S MAKE IT FINAL.', margin + 8, y + 25);
  setText(7.5, [205, 205, 201]);
  doc.text('Review this draft with the HICH team before signing, approving or paying.', margin + 8, y + 34);
  setText(8, COLORS.white, 'bold');
  doc.text(`${quotationCatalog.company.phone}  /  ${quotationCatalog.company.email}  /  ${website}`, margin + 8, y + 44);
  drawSpark(pageWidth - margin - 13, y + 25, 7, COLORS.pink);

  const pages = doc.getNumberOfPages();
  for (let number = 1; number <= pages; number += 1) {
    doc.setPage(number);
    drawFooter(number, pages);
  }

  const safeClient = (quote.client.company || quote.client.name || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 44);
  const filename = `HICH-draft-quotation-${safeClient || 'client'}-${quote.reference}.pdf`;
  doc.save(filename);
  return { filename, pages, draft: true };
}
