import { ZipArchive } from 'archiver';
import { createWriteStream } from 'node:fs';
import { access, mkdir, readFile, writeFile, stat, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';

await access('dist/index.html');
await rm('delivery', { recursive: true, force: true });
await mkdir('delivery', { recursive: true });
async function zip(name, entries) {
  const file = `delivery/${name}`;
  const archive = new ZipArchive({ zlib: { level: 9 } });
  const output = createWriteStream(file);
  const done = new Promise((resolve, reject) => { output.on('close', resolve); output.on('error', reject); archive.on('error', reject); archive.on('warning', reject); });
  archive.pipe(output);
  for (const [source, target] of entries) {
    if ((await stat(source)).isDirectory()) archive.directory(source, target);
    else archive.file(source, { name: target });
  }
  await archive.finalize();
  await done;
  const data = await readFile(file);
  return { file: name, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') };
}
const source = ['src','server','netlify','public','scripts','docs','index.html','package.json','package-lock.json','vite.config.js','netlify.toml','.nvmrc','.gitignore','.env.example','README.md'];
const files = [];
files.push(await zip('HICH-Netlify-Source.zip', source.map(file => [file, file])));
await writeFile('delivery/checksums.json', JSON.stringify(files, null, 2));
console.log(JSON.stringify(files, null, 2));
