import { createIcons, House, Radio, Bookmark, History, ListPlus, Plus, Play, Search, RefreshCw, ArrowDown, ArrowUpRight, X, RotateCw, PictureInPicture2, Maximize, ExternalLink, Upload } from 'lucide';
const icons = {House, Radio, Bookmark, History, ListPlus, Plus, Play, Search, RefreshCw, ArrowDown, ArrowUpRight, X, RotateCw, PictureInPicture2, Maximize, ExternalLink, Upload};
import { parseM3U } from './playlist.js';
import './style.css';
import './tv.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import { installTVNavigation } from './tv-navigation.js';
const isTV = new URLSearchParams(location.search).has('tv') || /JuampiTV/.test(navigator.userAgent);
if (isTV) document.documentElement.classList.add('tv');

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = name => `<i data-lucide="${name}"></i>`;
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
let favorites = read('jtv-favorites', []), history = read('jtv-history', []), imported = read('jtv-imported', []);
if (!Array.isArray(favorites)) favorites = []; if (!Array.isArray(history)) history = []; if (!Array.isArray(imported)) imported = [];
let playbackRun = 0;
let channels = [], view = 'home', country = 'all', query = '', limit = 48, current = null, hls = null, timeout = null, source = 'Free-TV / IPTV';
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { toast('No se pudo guardar: el almacenamiento está lleno.'); } };
const refreshIcons = () => createIcons({icons});
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('show'); setTimeout(() => $('#toast').classList.remove('show'), 4000); }
$('#app').innerHTML = `
<aside class="sidebar"><a class="brand" href="#" aria-label="JUAMPI-TV inicio">J<span>↗</span></a><nav aria-label="Navegación principal"><button data-view="home" class="active" aria-label="Inicio">${icon('house')}<span>Inicio</span></button><button data-view="all" aria-label="TV en vivo">${icon('radio')}<span>En vivo</span></button><button data-view="favorites" aria-label="Mi lista">${icon('bookmark')}<span>Mi lista</span></button><button data-view="history" aria-label="Recientes">${icon('history')}<span>Recientes</span></button></nav><button class="sidebar-import" data-import aria-label="Importar lista">${icon('list-plus')}<span>Tu IPTV</span></button><div class="avatar">J</div></aside>
<main><header><a href="#" class="wordmark">JUAMPI<span>—TV</span><small>BETA</small></a><div class="header-right"><span class="live-label"><b></b> TELEVISIÓN SIN FRONTERAS</span><button class="quiet" data-import>${icon('plus')} Agregar lista</button><div class="user">J</div></div></header>
<section class="hero"><div class="hero-image"></div><div class="hero-content"><div class="eyebrow"><span class="pill">LIVE TV</span> CONECTÁ CON ALGO NUEVO</div><h1>TU MUNDO.<br><em>EN VIVO.</em></h1><p>Historias, lugares y momentos.<br>La tele que te gusta, a tu manera.</p><div class="hero-actions"><button id="explore" class="primary">${icon('play')} Explorar canales</button><button data-view="favorites" class="glass">${icon('bookmark')} Mi lista</button></div><div class="hero-meta"><span>01 / DESCUBRÍ</span><span class="line"></span><span>EL MUNDO NO PAUSA</span></div></div><div class="scene-caption">EXPLORÁ SIN LÍMITES <span>SIEMPRE HAY ALGO POR DESCUBRIR</span><small>Imagen de ambientación</small></div><div class="vertical-label">MENOS SCROLL. MÁS MUNDO.</div></section>
<section class="catalog" id="catalog"><div class="catalog-top"><div><div class="eyebrow muted">SINTONIZÁ TU PRÓXIMO MOMENTO</div><h2 id="section-title">Descubrí en vivo<span>.</span></h2></div><label class="search">${icon('search')}<input id="search" type="search" placeholder="Buscá un canal o país" aria-label="Buscar canales"/><kbd>/</kbd></label></div>
<div class="filters"><div class="chips"><button class="selected" data-country="all">Todos</button><button data-country="AR">Argentina</button><button data-country="ES">España</button><button data-country="MX">México</button><button data-country="US">Estados Unidos</button></div><select id="countries" aria-label="Filtrar por país"><option value="all">Todos los países</option></select></div><div class="results-info"><span id="count" role="status">Cargando señales…</span><button id="refresh" class="text-button">${icon('refresh-cw')} Actualizar fuente</button></div><div id="grid" class="grid"></div><button id="more" class="more" hidden>Mostrar más canales ${icon('arrow-down')}</button><div class="source-line"><span id="source">Fuente: Free-TV / IPTV</span><a href="https://github.com/Free-TV/IPTV" target="_blank" rel="noopener">Proyecto original ${icon('arrow-up-right')}</a></div></section><footer><span class="wordmark">JUAMPI<span>—TV</span></span><p>Tu lugar para ver el mundo.</p><span>HECHO PARA CURIOSOS ↗</span></footer></main>
<dialog id="player"><div class="player-head"><div><span class="eyebrow">REPRODUCTOR</span><h2 id="playing-name"></h2></div><button id="close-player" class="icon-button" aria-label="Cerrar reproductor">${icon('x')}</button></div><div class="video-wrap"><video id="video" controls playsinline></video></div><div id="player-status" role="status"></div><div class="player-actions"><button id="retry" class="quiet">${icon('rotate-cw')} Reintentar</button><button id="pip" class="quiet">${icon('picture-in-picture-2')} Mini reproductor</button><button id="fullscreen" class="quiet">${icon('maximize')} Pantalla completa</button><select id="quality" aria-label="Calidad de reproducción"><option value="-1">Calidad automática</option></select><a id="external" class="quiet" target="_blank" rel="noopener noreferrer">Abrir fuente ${icon('external-link')}</a></div><p class="player-note">Algunas señales tienen restricciones regionales o no permiten reproducción en navegador.</p></dialog>
<dialog id="import-dialog"><div class="player-head"><h2>Tu lista. Tu televisión.</h2><button id="close-import" class="icon-button" aria-label="Cerrar importación">${icon('x')}</button></div><p>Agregá una lista M3U de canales que tengas autorización para ver. Se guarda en este navegador.</p><label class="upload">${icon('upload')}<strong>Elegí un archivo .m3u o .m3u8</strong><input id="file" type="file" accept=".m3u,.m3u8,text/plain"/></label><div class="or">O PEGÁ LA URL DE TU LISTA</div><form id="import-form"><input id="playlist-url" type="url" placeholder="https://ejemplo.com/lista.m3u" required aria-label="URL de lista M3U"/><button class="primary">Importar</button></form><p id="import-status" role="status"></p><button id="reset-source" class="text-button">Volver al catálogo Free-TV</button></dialog><div id="toast" role="status"></div>`;

const palettes = ['#27372d','#323044','#243d43','#493029','#343b27','#29334b'];
function filtered() { return channels.filter(c => (country === 'all' || (c.country || c.group) === country) && `${c.name} ${c.group} ${c.country}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()) && (view !== 'favorites' || favorites.includes(c.id)) && (view !== 'history' || history.includes(c.id))).sort((a,b) => view === 'history' ? history.indexOf(a.id)-history.indexOf(b.id) : (a.country === 'AR' ? -1 : 0)-(b.country === 'AR' ? -1 : 0)); }
function render() {
  const focused = document.activeElement;
  const focusId = focused?.dataset?.favorite || focused?.dataset?.play;
  const focusKind = focused?.hasAttribute?.('data-favorite') ? 'favorite' : 'play';
  const list = filtered(); $('#count').textContent = `${list.length.toLocaleString('es-AR')} canales · ${source}`;
  $('#section-title').innerHTML = ({home:'Descubrí en vivo',all:'Todos los canales',favorites:'Mi lista',history:'Vistos recientemente'}[view]) + '<span>.</span>';
  $('.hero').hidden = view !== 'home';
  document.querySelectorAll('nav [data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  document.querySelectorAll('[data-country]').forEach(b => b.classList.toggle('selected', b.dataset.country === country));
  $('#grid').innerHTML = list.length ? list.slice(0,limit).map((c,i) => `<article class="card" style="--card-color:${palettes[i%palettes.length]}"><button class="channel-play" data-play="${esc(c.id)}" aria-label="Ver ${esc(c.name)}"><div class="channel-art"><span class="channel-number">${String(i+1).padStart(2,'0')}</span><span class="signal">${c.external ? 'WEB' : 'TV'}</span><div class="logo-box">${c.logo && /^https?:\/\//.test(c.logo) ? `<img loading="lazy" referrerpolicy="no-referrer" src="${esc(c.logo)}" alt=""/>` : ''}<strong>${esc(c.name)}</strong></div><span class="play-circle">${icon('play')}</span><div class="art-line"></div></div><div class="channel-info"><h3>${esc(c.name)}</h3><p>${esc(c.group)} <span>• ${c.external ? 'Fuente externa' : 'Señal en vivo'}</span></p></div></button><button class="favorite ${favorites.includes(c.id)?'saved':''}" data-favorite="${esc(c.id)}" aria-label="${favorites.includes(c.id)?'Quitar de':'Agregar a'} mi lista: ${esc(c.name)}" aria-pressed="${favorites.includes(c.id)}">${icon('bookmark')}</button></article>`).join('') : `<div class="empty">${icon(view==='favorites'?'bookmark':'search')}<h3>${view==='favorites'?'Tu próxima señal favorita te espera':view==='history'?'Todavía no abriste ningún canal':'No encontramos canales'}</h3><p>${view==='favorites'?'Guardá canales con el ícono de marcador.':view==='history'?'Los canales que abras van a aparecer acá.':'Probá otra búsqueda o cambiá el país.'}</p></div>`;
  $('#more').hidden = list.length <= limit; $('#source').textContent = `Fuente: ${source}`;
  $('#grid').querySelectorAll('img').forEach(img => { img.onload = () => img.parentElement.classList.add('has-logo'); img.onerror = () => img.remove(); }); refreshIcons();
  if (isTV && focusId) { const target = [...document.querySelectorAll(`[data-${focusKind}]`)].find(el => el.dataset[focusKind] === focusId); (target || document.querySelector('nav .active'))?.focus({preventScroll:true}); }
}
function setupCatalog() { const groups = [...new Map(channels.map(c => [c.country || c.group, c.group])).entries()].sort((a,b)=>a[1].localeCompare(b[1])); $('#countries').innerHTML = '<option value="all">Todos los países</option>' + groups.map(([id,name]) => `<option value="${esc(id)}">${esc(name)}</option>`).join(''); country='all'; limit=48; render(); }
async function loadCatalog(fresh=false) { $('#refresh').disabled=true; try { const response=await fetch(fresh?'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8':'/catalog.m3u8',{signal:AbortSignal.timeout(20000)}); if(!response.ok) throw Error(); const parsed=parseM3U(await response.text()); if(!parsed.length) throw Error(); channels=parsed; source='Free-TV / IPTV'; setupCatalog(); if(fresh) toast('Catálogo actualizado desde GitHub.'); } catch { if(!channels.length) $('#grid').innerHTML='<div class="empty"><h3>No pudimos cargar el catálogo</h3><p>Usá Actualizar fuente para reintentar.</p></div>'; toast('No se pudo cargar la fuente. Revisá tu conexión.'); } finally { $('#refresh').disabled=false; } }
function stop() { playbackRun++; clearTimeout(timeout); hls?.destroy(); hls=null; $('#video').pause(); $('#video').removeAttribute('src'); $('#video').load(); }
async function play(channel) {
  if (!channel) return;
  if (isTV && window.JuampiNative && !channel.external) {
    history=[channel.id,...history.filter(id=>id!==channel.id)].slice(0,50); save('jtv-history',history);
    window.JuampiNative.postMessage(JSON.stringify({action:'play',url:channel.url,name:channel.name}));
    return;
  }
  stop(); current=channel; const video=$('#video'); $('#playing-name').textContent=channel.name; $('#external').href=channel.url; $('#quality').innerHTML='<option value="-1">Calidad automática</option>'; $('#quality').disabled=true;
  if(!$('#player').open) $('#player').showModal(); history=[channel.id,...history.filter(id=>id!==channel.id)].slice(0,50); save('jtv-history',history);
  if(channel.external) { $('#retry').hidden=true; $('#pip').hidden=true; $('#fullscreen').hidden=true; $('#quality').hidden=true; $('.video-wrap').hidden=true; $('#external').focus(); $('#player-status').textContent='Este canal se ve en la web de su proveedor. Elegí “Abrir fuente”.'; return; }
  $('#retry').hidden=false; $('#pip').hidden=false; $('#fullscreen').hidden=false; $('#quality').hidden=false; $('.video-wrap').hidden=false;
  $('#player-status').textContent='Conectando con la señal…';
  timeout=setTimeout(()=> { $('#player-status').textContent='La señal no está respondiendo. Podés reintentar o abrir la fuente.'; },20000);
  const start=()=>video.play().catch(()=> { $('#player-status').textContent='Tocá reproducir en el video para comenzar.'; });
  const run = playbackRun; let Hls;
  try { Hls = (await import('hls.js')).default; } catch { if(run === playbackRun) { clearTimeout(timeout); $('#player-status').textContent='No se pudo cargar el reproductor. Reintentá.'; } return; }
  if(run !== playbackRun) return;
  if(Hls.isSupported()) { hls=new Hls({maxBufferLength:30}); hls.loadSource(channel.url); hls.attachMedia(video); hls.on(Hls.Events.MANIFEST_PARSED,(_,data)=>{ $('#quality').innerHTML='<option value="-1">Calidad automática</option>'+data.levels.map((l,i)=>`<option value="${i}">${l.height ? l.height+'p' : Math.round(l.bitrate/1000)+' kbps'}</option>`).join(''); $('#quality').disabled=false; start(); }); hls.on(Hls.Events.ERROR,(_,data)=>{if(data.fatal) { clearTimeout(timeout); $('#player-status').textContent='No se pudo reproducir esta señal. Puede estar caída, bloqueada por región o por el proveedor.'; hls?.destroy(); hls=null; }}); }
  else if(video.canPlayType('application/vnd.apple.mpegurl')) { video.src=channel.url; start(); }
  else { clearTimeout(timeout); $('#player-status').textContent='Tu navegador no admite esta señal. Probá abrir la fuente en un reproductor compatible.'; }
}
$('#video').addEventListener('playing',()=>{clearTimeout(timeout); $('#player-status').textContent='● Reproduciendo en vivo';});
$('#video').addEventListener('error',()=>{if(current){clearTimeout(timeout);$('#player-status').textContent='No se pudo reproducir el video. Reintentá o abrí la fuente.';}});
document.addEventListener('click', e=> { const b=e.target.closest('button'); if(!b) return; if(b.dataset.view) {view=b.dataset.view;limit=48;render();} if(b.hasAttribute('data-import')){$('#import-dialog').showModal();} if(b.dataset.country){country=b.dataset.country;$('#countries').value=country;limit=48;render();} if(b.dataset.play) play(channels.find(c=>c.id===b.dataset.play)); if(b.dataset.favorite){const id=b.dataset.favorite; favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];save('jtv-favorites',favorites);render();} });
document.querySelectorAll('.brand,.wordmark[href]').forEach(a=>a.onclick=e=>{e.preventDefault();view='home';render();window.scrollTo({top:0,behavior:'smooth'});});
$('#search').oninput=e=>{query=e.target.value;limit=48;render();}; $('#countries').onchange=e=>{country=e.target.value;limit=48;render();}; $('#more').onclick=()=>{limit+=48;render();}; $('#refresh').onclick=()=>loadCatalog(true);
$('#explore').onclick=()=>$('#catalog').scrollIntoView({behavior:'smooth'});
$('#close-player').onclick=()=>$('#player').close(); $('#player').addEventListener('close',()=>{stop();current=null;if(view==='history')render();}); $('#retry').onclick=()=>current&&play(current);
$('#quality').onchange=e=>{if(hls)hls.currentLevel=Number(e.target.value);};
$('#pip').onclick=async()=>{try{if(document.pictureInPictureElement) await document.exitPictureInPicture();else await $('#video').requestPictureInPicture();}catch{toast('Mini reproductor no disponible para esta señal o navegador.');}};
$('#fullscreen').onclick=async()=>{try{await $('#video').requestFullscreen();}catch{toast('Usá el botón de pantalla completa del video.');}};
$('#close-import').onclick=()=>$('#import-dialog').close();
async function importText(text){const parsed=parseM3U(text);if(!parsed.length)throw Error('La lista no contiene canales HTTP o HTTPS.');imported=parsed;save('jtv-imported',imported);channels=parsed;source='Mi lista IPTV';view='all';query='';$('#search').value='';setupCatalog();$('#import-dialog').close();toast(`${parsed.length} canales importados.`);}
$('#file').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>10*1024*1024)throw Error('La lista debe pesar menos de 10 MB.');await importText(await f.text());}catch(err){$('#import-status').textContent=err.message;}finally{e.target.value='';}};
$('#import-form').onsubmit=async e=>{e.preventDefault();$('#import-status').textContent='Importando…';try{const url=new URL($('#playlist-url').value);if(!['http:','https:'].includes(url.protocol))throw Error();const r=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error();await importText(await r.text());$('#import-status').textContent='';}catch{$('#import-status').textContent='No pudimos importar esa URL. Si el proveedor bloquea el navegador, descargá la lista y subí el archivo.';}};
$('#reset-source').onclick=()=>{imported=[];save('jtv-imported',[]);$('#import-dialog').close();loadCatalog();};
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)&&!$('dialog[open]')){e.preventDefault();$('#search').focus();}});
refreshIcons(); if(imported.length){channels=imported;source='Mi lista IPTV';setupCatalog();}else loadCatalog();

if (isTV) installTVNavigation();
window.juampiNativeClosed = () => { if(view==='history') render(); };
window.juampiBack = () => { const dialog = document.querySelector('dialog[open]'); if(dialog){dialog.close();return true;} if(document.activeElement?.tagName==='INPUT'){document.activeElement.blur();document.querySelector('nav .active')?.focus();return true;} if(query || country!=='all'){query='';country='all';$('#search').value='';$('#countries').value='all';render();document.querySelector('nav .active')?.focus();return true;} if(view!=='home'||window.scrollY>30){view='home';render();window.scrollTo(0,0);$('#explore').focus({preventScroll:true});return true;} return false; };
$('#external').addEventListener('click',event=>{if(isTV&&window.JuampiNative){event.preventDefault();window.JuampiNative.postMessage(JSON.stringify({action:'external',url:event.currentTarget.href}));}});
