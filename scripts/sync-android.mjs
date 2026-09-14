import { mkdir, cp } from 'node:fs/promises';
const target = new URL('../android/app/src/main/assets/',import.meta.url);
await mkdir(target,{recursive:true});
await cp(new URL('../dist/',import.meta.url),target,{recursive:true});
console.log('Interfaz y catálogo empaquetados en Android.');
