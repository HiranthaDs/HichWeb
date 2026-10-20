import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const redirectsPath = path.join(root, 'dist', '_redirects');
const source = await readFile(redirectsPath, 'utf8');
const rules = source
  .split(/\r?\n/)
  .filter(line => !/^https?:\/\//.test(line.trim()))
  .map(line => line.replace(/\s301!\s*$/, '  301'))
  .join('\n')
  .replace(/^\/\s+\/index\.html\s+301\s*$/m, '');

await writeFile(redirectsPath, `/  /index.html  200\n${rules.trim()}\n`, 'utf8');
console.log('HICH: prepared dist/_redirects for Cloudflare Workers Static Assets.');
