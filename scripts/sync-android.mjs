import { mkdir, cp } from 'node:fs/promises';
const target = new URL('../android/app/src/main/assets/',import.meta.url);
await mkdir(target,{recursive:true});
await cp(new URL('../dist/',import.meta.url),target,{recursive:true});
const licenses = new URL('licenses/',target);
await mkdir(licenses,{recursive:true});
for (const [name,path] of Object.entries({hls:'hls.js',lucide:'lucide','dm-sans':'@fontsource/dm-sans','barlow-condensed':'@fontsource/barlow-condensed'})) {
    await cp(new URL(`../node_modules/${path}/LICENSE`,import.meta.url),new URL(`${name}.txt`,licenses));
}
console.log('Interfaz y catálogo empaquetados en Android.');
