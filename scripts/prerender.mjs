import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');
const serverPath = path.join(root, '.ssr', 'entry-server.js');
const origin = 'https://hichweb.com';
const headMarker = '<!--hich-head-->';
const appMarker = '<!--hich-app-->';
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const safeJson = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const plainText = value => String(value).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&#x([a-f\d]+);/gi, (_, number) => String.fromCodePoint(parseInt(number, 16))).replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number))).replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

await access(serverPath).catch(() => { throw new Error('Missing SSR bundle. Run npm run build, or build src/entry-server.jsx with Vite first.'); });
const { render, pagePaths, getPageMeta, getSchema } = await import(pathToFileURL(serverPath).href);
const template = await readFile(path.join(output, 'index.html'), 'utf8');
if (!template.includes(headMarker) || !template.includes(appMarker)) {
  throw new Error('The client template is missing HICH insertion markers. Run the complete npm run build before prerendering again.');
}
if (!Array.isArray(pagePaths) || new Set(pagePaths).size !== pagePaths.length) throw new Error('Page paths must be a unique array.');

// Fail early when a new route silently loses search metadata or its social image.
const titles = new Set(), descriptions = new Set();
for (const urlPath of pagePaths) {
  const meta = getPageMeta(urlPath);
  assert.ok(meta.title?.length > 0 && meta.title.length <= 70, `Write a concise page title for ${urlPath}`);
  assert.ok(meta.description?.length > 0 && meta.description.length <= 170, `Write a concise description for ${urlPath}`);
  assert.ok(!titles.has(meta.title), `Duplicate page title for ${urlPath}`);
  assert.ok(!descriptions.has(meta.description), `Duplicate description for ${urlPath}`);
  titles.add(meta.title);
  descriptions.add(meta.description);
}
await access(path.join(output, 'social-card.png')).catch(() => { throw new Error('Missing public/social-card.png: the social preview image must ship with the build.'); });
await access(path.join(output, 'Logo.png')).catch(() => { throw new Error('Missing public/Logo.png: the organisation logo must ship with the build.'); });

const aliases = new Map([
  ['/i.html', '/'],
  ['/terms.html', '/terms-and-conditions.html'],
]);

function outputPath(urlPath) {
  if (urlPath === '/') return path.join(output, 'index.html');
  if (!/^\/[A-Za-z0-9-]+\.html$/.test(urlPath)) throw new Error(`Unsafe or unsupported page path: ${urlPath}`);
  return path.join(output, urlPath.slice(1));
}

function metadata(urlPath) {
  const meta = getPageMeta(urlPath);
  if (meta.path !== urlPath) throw new Error(`Unexpected canonical for ${urlPath}: ${meta.path}`);
  const url = `${origin}${urlPath}`;
  const is404 = urlPath === '/404.html';
  const lines = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="robots" content="${is404 ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    '<meta property="og:site_name" content="HICH" />',
    `<meta property="og:type" content="${meta.type === 'article' ? 'article' : 'website'}" />`,
    '<meta property="og:locale" content="en_LK" />',
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:image" content="${origin}/social-card.png" />`,
    '<meta property="og:image:type" content="image/png" />',
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta property="og:image:alt" content="HICH — Web development and digital experiences" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${origin}/social-card.png" />`,
    '<meta name="twitter:image:alt" content="HICH — Web development and digital experiences" />',
  ];
  // Publication/update dates are omitted until they are verified and visible
  // on the article itself. Rebuilding must never invent freshness signals.
  if (!is404) lines.push(`<script type="application/ld+json">${safeJson(getSchema(urlPath))}</script>`);
  return lines.join('\n    ');
}

await mkdir(output, { recursive: true });
let checkedQuestions = 0;
const localReferences = new Set();
for (const urlPath of pagePaths) {
  const html = await render(urlPath);
  if (typeof html !== 'string' || !html.includes('<main')) throw new Error(`Missing rendered page content for ${urlPath}`);
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `Expected one primary heading for ${urlPath}`);
  const visibleText = plainText(html);
  const schema = getSchema(urlPath);
  for (const node of schema['@graph']) {
    if (node['@type'] === 'FAQPage') {
      for (const question of node.mainEntity) {
        assert.ok(visibleText.includes(plainText(question.name)), `FAQ question missing from rendered HTML: ${urlPath}: ${question.name}`);
        assert.ok(visibleText.includes(plainText(question.acceptedAnswer.text)), `FAQ answer missing from rendered HTML: ${urlPath}: ${question.name}`);
        checkedQuestions++;
      }
    }
    if (node['@type'] === 'Service') assert.ok(visibleText.includes(plainText(node.description)), `Service schema does not match page copy: ${urlPath}`);
    if (node['@type'] === 'Article') assert.ok(visibleText.includes(plainText(node.headline)), `Article schema does not match the page headline: ${urlPath}`);
  }
  const result = template.replace(headMarker, () => metadata(urlPath)).replace(appMarker, () => html);
  assert.equal((result.match(/rel="canonical"/g) || []).length, 1, `Expected one canonical for ${urlPath}`);
  assert.equal((result.match(/<title>/g) || []).length, 1, `Expected one title for ${urlPath}`);
  // Validate internal destinations and locally hosted assets after every page
  // has been written, including metadata images that a browser may not fetch.
  for (const match of result.matchAll(/\b(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
    if (!match[1].startsWith('//')) localReferences.add(match[1]);
  }
  await writeFile(outputPath(urlPath), result, 'utf8');
}

// These pages are only a fallback for hosts that ignore the supplied redirects.
// The hosting configurations send real permanent redirects before these files.
for (const [from, to] of aliases) {
  const url = `${origin}${to}`;
  const redirect = `<!doctype html>\n<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page moved | HICH</title><meta name="robots" content="noindex,follow"><link rel="canonical" href="${escapeHtml(url)}"><meta http-equiv="refresh" content="0;url=${escapeHtml(to)}"></head><body><p>This page has moved. <a href="${escapeHtml(to)}">Continue to HICH</a>.</p></body></html>\n`;
  await writeFile(outputPath(from), redirect, 'utf8');
}

for (const reference of localReferences) {
  const destination = reference === '/' ? 'index.html' : decodeURIComponent(reference.slice(1));
  const resolved = path.resolve(output, destination);
  assert.ok(resolved.startsWith(`${output}${path.sep}`), `Reference escapes build output: ${reference}`);
  await access(resolved).catch(() => { throw new Error(`Broken internal page or asset reference: ${reference}`); });
}

const indexablePaths = pagePaths.filter(urlPath => urlPath !== '/404.html');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexablePaths.map(urlPath => `  <url><loc>${escapeHtml(`${origin}${urlPath}`)}</loc></url>`).join('\n')}\n</urlset>\n`;
await writeFile(path.join(output, 'sitemap.xml'), sitemap, 'utf8');
await writeFile(path.join(output, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`, 'utf8');

const llms = `# HICH\n\n> HICH, also known as Hich Web Development, is a digital design and web development studio based in Sri Lanka, working with businesses worldwide.\n\nWebsite: ${origin}/\nEmail: info@hichweb.com\nTelephone: +94714112113\n\nThis optional file is an experimental navigation aid. It is not a search ranking signal, a verification of expertise, or a guarantee of inclusion in AI answers. The linked public pages are the authoritative website content. Concept projects are identified on the work page.\n\n## Pages\n\n${indexablePaths.map(urlPath => { const meta = getPageMeta(urlPath); return `- [${meta.name}](${origin}${urlPath}): ${meta.description.replace(/\s+/g, ' ').trim()}`; }).join('\n')}\n`;
await writeFile(path.join(output, 'llms.txt'), llms, 'utf8');

// Generate concrete route rules instead of catch-all SPA rewrites. In Netlify,
// Pretty URLs must be disabled to retain this site's established .html URLs.
const routeRedirects = indexablePaths.filter(urlPath => urlPath !== '/').map(urlPath => `${urlPath.slice(0, -5)}  ${urlPath}  301!`).join('\n');
const redirects = await readFile(path.join(root, 'public', '_redirects'), 'utf8');
await writeFile(path.join(output, '_redirects'), redirects.replace('# HICH_PAGE_REDIRECTS', routeRedirects), 'utf8');
const headers = await readFile(path.join(root, 'public', '_headers'), 'utf8');
const htmlPaths = ['/', '/index.html', ...pagePaths.filter(p => p !== '/'), ...aliases.keys()];
const htmlCacheRules = htmlPaths.map(urlPath => `${urlPath}\n  Cache-Control: public, max-age=0, must-revalidate`).join('\n\n');
await writeFile(path.join(output, '_headers'), headers.replace('# HICH_HTML_CACHE_RULES', htmlCacheRules), 'utf8');

console.log(`HICH: prerendered ${pagePaths.length} pages, ${aliases.size} redirect aliases and ${indexablePaths.length} sitemap URLs.`);
console.log(`SEO checks passed: unique page metadata, static headings, ${checkedQuestions} visible FAQ answers and ${localReferences.size} internal page/asset references.`);
