import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextTarget } from '../src/tv-navigation.js';
const rect = (left,top,width=100,height=80)=>({left,top,width,height,right:left+width,bottom:top+height});
test('control remoto sigue la fila y la columna, no salta en diagonal',()=>{
 const from=rect(120,100); const candidates=[{element:'right',rect:rect(240,100)},{element:'below',rect:rect(120,210)},{element:'left',rect:rect(0,100)},{element:'diagonal',rect:rect(225,195)}];
 assert.equal(nextTarget(from,candidates,'ArrowRight'),'right');assert.equal(nextTarget(from,candidates,'ArrowDown'),'below');assert.equal(nextTarget(from,candidates,'ArrowLeft'),'left');assert.equal(nextTarget(from,candidates,'ArrowUp'),null);
});
