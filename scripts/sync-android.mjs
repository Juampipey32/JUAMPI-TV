import { mkdir, cp, writeFile } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url);
const androidTarget = new URL('../android/app/src/main/assets/', import.meta.url);
const docsTarget = new URL('../docs/', import.meta.url);

// 1. Sincronizar hacia assets de Android
await mkdir(androidTarget, { recursive: true });
await cp(dist, androidTarget, { recursive: true });

const licenses = new URL('licenses/', androidTarget);
await mkdir(licenses, { recursive: true });
for (const [name, path] of Object.entries({
  hls: 'hls.js',
  lucide: 'lucide',
  'dm-sans': '@fontsource/dm-sans',
  'barlow-condensed': '@fontsource/barlow-condensed'
})) {
  await cp(new URL(`../node_modules/${path}/LICENSE`, import.meta.url), new URL(`${name}.txt`, licenses));
}

// 2. Sincronizar hacia docs/ (GitHub Pages)
await mkdir(docsTarget, { recursive: true });
await cp(dist, docsTarget, { recursive: true });
// Asegurar .nojekyll para GitHub Pages
await writeFile(new URL('.nojekyll', docsTarget), '');

console.log('Interfaz y catálogo empaquetados exitosamente en Android y GitHub Pages (docs/).');
