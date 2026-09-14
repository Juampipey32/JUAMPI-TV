import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseM3U} from '../src/playlist.js';
test('lee metadatos, CRLF y deduplica señales',()=>{const result=parseM3U('\uFEFF#EXTM3U\r\n#EXTINF:-1 tvg-name="Canal uno" group-title="Argentina" tvg-country="AR",Uno\r\nhttps://example.com/live.m3u8\r\n#EXTINF:-1,Dos\r\nhttps://example.com/live.m3u8');assert.equal(result.length,1);assert.equal(result[0].country,'AR');assert.equal(result[0].name,'Canal uno');});
test('rechaza esquemas ejecutables y entradas malformadas',()=>{assert.equal(parseM3U('#EXTM3U\n#EXTINF:-1,Peligroso\njavascript:alert(1)').length,0);assert.throws(()=>parseM3U('<html>error</html>'));});
test('distingue proveedores externos de streams HLS',()=>{const list=parseM3U('#EXTM3U\n#EXTINF:-1,YouTube\nhttps://www.youtube.com/@canal/live\n#EXTINF:-1,Directo\nhttps://example.com/live.m3u8');assert.equal(list[0].external,true);assert.equal(list[1].external,false);});
