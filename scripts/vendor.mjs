/** Copy the pinned browser libraries and their license texts into the app. */
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'assets', 'vendor');

async function copyLibrary(name, browserFile, outputFile, licenseFile) {
  const source = join(root, 'node_modules', name);
  const metadata = JSON.parse(await readFile(join(source, 'package.json'), 'utf8'));
  // Source maps are not shipped; remove only the optional developer-tools hint.
  const code = (await readFile(join(source, browserFile), 'utf8')).replace(/^\/\/# sourceMappingURL=.*$/gm, '');
  await writeFile(join(target, outputFile), code);
  await copyFile(join(source, licenseFile), join(target, `${name}.LICENSE`));
  return { name, version: metadata.version, license: metadata.license, file: outputFile, sha256: createHash('sha256').update(code).digest('hex') };
}

await mkdir(target, { recursive: true });
const libraries = [
  await copyLibrary('marked', 'lib/marked.umd.js', 'marked.umd.js', 'LICENSE'),
  await copyLibrary('dompurify', 'dist/purify.min.js', 'purify.min.js', 'LICENSE'),
];
await copyFile(join(root, 'node_modules/dompurify/LICENSE-MPL'), join(target, 'dompurify.LICENSE-MPL'));
await writeFile(join(target, 'versions.json'), JSON.stringify(libraries, null, 2) + '\n');
console.log(JSON.stringify({ vendored: libraries.map(({ name, version }) => ({ name, version })) }));
