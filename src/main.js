import {
  createIcons, House, Radio, Film, Tv, Bookmark, History, ListPlus, Plus, Play, Pause,
  Search, RefreshCw, ArrowDown, ArrowUpRight, X, RotateCw, PictureInPicture2, Maximize,
  ExternalLink, Upload, SkipBack, SkipForward, Volume2, VolumeX, Scaling, Trophy
} from 'lucide';

const icons = {
  House, Radio, Film, Tv, Bookmark, History, ListPlus, Plus, Play, Pause,
  Search, RefreshCw, ArrowDown, ArrowUpRight, X, RotateCw, PictureInPicture2, Maximize,
  ExternalLink, Upload, SkipBack, SkipForward, Volume2, VolumeX, Scaling, Trophy
};

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
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = name => `<i data-lucide="${name}"></i>`;
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { toast('Almacenamiento lleno.'); } };

let favorites = read('jtv-favorites', []);
let history = read('jtv-history', []);
let imported = read('jtv-imported', []);
if (!Array.isArray(favorites)) favorites = [];
if (!Array.isArray(history)) history = [];
if (!Array.isArray(imported)) imported = [];

const CATALOGS = {
  live: { id: 'live', name: 'En vivo', title: 'Televisión en vivo', file: '/catalog.m3u8', remote: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8', icon: 'radio' },
  sports: { id: 'sports', name: 'Deportes', title: 'Deportes Argentina & Latam', file: '/sports.m3u8', remote: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8', icon: 'trophy' },
  movies: { id: 'movies', name: 'Películas', title: 'Cine y Películas On Demand', file: '/movies.m3u8', remote: 'https://iptv-org.github.io/iptv/categories/movies.m3u', icon: 'film' },
  series: { id: 'series', name: 'Series', title: 'Series de TV On Demand', file: '/series.m3u8', remote: 'https://iptv-org.github.io/iptv/categories/series.m3u', icon: 'tv' }
};

const CATEGORY_SHORTCUTS = {
  live: ['Todos', 'Noticias', 'Deportes', 'Música', 'Documentales', 'Entretenimiento', 'Infantil'],
  sports: ['Todos', 'Fútbol', 'Argentina', 'Polideportivo', 'Automovilismo', 'Noticias Deportivas'],
  movies: ['Todos', 'Acción', 'Comedia', 'Drama', 'Terror', 'Ciencia Ficción', 'Animación', 'Suspenso', 'Romance', 'Clásicos'],
  series: ['Todos', 'Drama', 'Comedia', 'Acción', 'Crimen', 'Animación', 'Sci-Fi', 'Documental']
};

let currentCatalog = 'live';
let channels = [];
let view = 'home';
let country = 'all';
let category = 'all';
let query = '';
let limit = 48;
let current = null;
let currentPlaylist = [];
let currentIndex = -1;
let currentAspect = 'contain';
let currentVolume = 1;
let isMuted = false;
let hls = null;
let playbackRun = 0;
let timeout = null;
let sourceName = 'Free-TV / IPTV';

const palettes = ['#27372d','#323044','#243d43','#493029','#343b27','#29334b'];
const refreshIcons = () => createIcons({ icons });

function toast(message) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = message;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

$('#app').innerHTML = `
<aside class="sidebar">
  <a class="brand" href="#" aria-label="JUAMPI-TV inicio">J<span>↗</span></a>
  <nav aria-label="Navegación principal">
    <button data-view="home" class="active" aria-label="Inicio">${icon('house')}<span>Inicio</span></button>
    <button data-view="all" aria-label="TV en vivo">${icon('radio')}<span>En vivo</span></button>
    <button data-view="sports" aria-label="Deportes">${icon('trophy')}<span>Deportes</span></button>
    <button data-view="movies" aria-label="Películas">${icon('film')}<span>Películas</span></button>
    <button data-view="series" aria-label="Series">${icon('tv')}<span>Series</span></button>
    <button data-view="favorites" aria-label="Mi lista">${icon('bookmark')}<span>Mi lista</span></button>
    <button data-view="history" aria-label="Recientes">${icon('history')}<span>Recientes</span></button>
  </nav>
  <button class="sidebar-import" data-import aria-label="Importar lista">${icon('list-plus')}<span>Tu IPTV</span></button>
  <div class="avatar">J</div>
</aside>

<main>
  <header>
    <a href="#" class="wordmark">JUAMPI<span>—TV</span><small>BETA 0.4.0</small></a>
    <div class="header-right">
      <span class="live-label"><b></b> TELEVISIÓN SIN FRONTERAS</span>
      <button class="quiet" data-catalog-switch="sports">${icon('trophy')} Deportes</button>
      <button class="quiet" data-catalog-switch="movies">${icon('film')} Películas</button>
      <button class="quiet" data-catalog-switch="series">${icon('tv')} Series</button>
      <button class="quiet" data-import>${icon('plus')} Agregar lista</button>
      <div class="user">J</div>
    </div>
  </header>

  <section class="hero">
    <div class="hero-image"></div>
    <div class="hero-content">
      <div class="eyebrow"><span class="pill">MAGIS EDITION · CINE · SERIES · DEPORTES</span> EN VIVO Y ON DEMAND</div>
      <h1>TU MUNDO.<br><em>EN VIVO.</em></h1>
      <p>Cine on-demand, series completas, canales de deportes de Argentina y televisión en directo.<br>Directo en tu televisor, sin suscripción ni dejar la PC prendida.</p>
      <div class="hero-actions">
        <button id="explore" class="primary">${icon('play')} Explorar canales</button>
        <button data-view="sports" class="glass">${icon('trophy')} Deportes AR</button>
        <button data-view="movies" class="glass">${icon('film')} Películas VOD</button>
        <button data-view="series" class="glass">${icon('tv')} Series VOD</button>
        <button data-view="favorites" class="glass">${icon('bookmark')} Mi lista</button>
      </div>
      <div class="hero-meta">
        <span>01 / CATÁLOGO COMPLETO</span><span class="line"></span><span>PELÍCULAS · SERIES · DEPORTES ARGENTINA · TV</span>
      </div>
    </div>
    <div class="scene-caption">EXPLORÁ SIN LÍMITES <span>MÁS DE 10.000 TÍTULOS Y SEÑALES</span><small>Ambientación JUAMPI-TV</small></div>
    <div class="vertical-label">MENOS SCROLL. MÁS MUNDO.</div>
  </section>

  <section class="catalog" id="catalog">
    <div class="catalog-top">
      <div>
        <div class="eyebrow muted">SINTONIZÁ TU PRÓXIMO MOMENTO</div>
        <h2 id="section-title">Descubrí en vivo<span>.</span></h2>
      </div>
      <label class="search">${icon('search')}<input id="search" type="search" placeholder="Buscá un canal, película o país" aria-label="Buscar canales"/><kbd>/</kbd></label>
    </div>

    <div class="catalog-switcher">
      <button class="cat-tab selected" data-cat-tab="live">${icon('radio')} Canales de TV</button>
      <button class="cat-tab" data-cat-tab="sports">${icon('trophy')} Deportes AR</button>
      <button class="cat-tab" data-cat-tab="movies">${icon('film')} Cine & Películas</button>
      <button class="cat-tab" data-cat-tab="series">${icon('tv')} Series de TV</button>
    </div>

    <div class="category-pills" id="category-pills" role="region" aria-label="Filtro por género"></div>

    <div class="filters">
      <div class="chips">
        <button class="selected" data-country="all">Todos los países</button>
        <button data-country="AR">Argentina</button>
        <button data-country="ES">España</button>
        <button data-country="MX">México</button>
        <button data-country="US">Estados Unidos</button>
      </div>
      <select id="countries" aria-label="Filtrar por país"><option value="all">Todos los países</option></select>
    </div>

    <div class="results-info">
      <span id="count" role="status">Cargando señales…</span>
      <button id="refresh" class="text-button">${icon('refresh-cw')} Actualizar fuente</button>
    </div>

    <div id="grid" class="grid"></div>
    <button id="more" class="more" hidden>Mostrar más canales ${icon('arrow-down')}</button>

    <div class="source-line">
      <span id="source">Fuente: Free-TV / IPTV</span>
      <a href="https://github.com/Free-TV/IPTV" target="_blank" rel="noopener">Proyecto original ${icon('arrow-up-right')}</a>
    </div>
  </section>

  <footer>
    <span class="wordmark">JUAMPI<span>—TV</span></span>
    <p>Tu lugar para ver el mundo · Diseñado para Google TV / Android TV y Web</p>
    <span>HECHO PARA CURIOSOS ↗</span>
  </footer>
</main>

<dialog id="player">
  <div class="player-head">
    <div>
      <span class="eyebrow" id="player-category">REPRODUCTOR EN VIVO</span>
      <h2 id="playing-name"></h2>
      <div class="player-sub" id="player-channel-meta">Canal 01 / 48</div>
    </div>
    <button id="close-player" class="icon-button" aria-label="Cerrar reproductor">${icon('x')}</button>
  </div>

  <div class="video-wrap">
    <video id="video" playsinline></video>
  </div>

  <div id="player-status" role="status"></div>

  <div class="player-actions">
    <button id="prev-channel" class="quiet" title="Canal anterior (◄)">${icon('skip-back')} Anterior</button>
    <button id="play-pause" class="quiet" title="Pausar / Reanudar (Espacio)">${icon('pause')} Pausar</button>
    <button id="next-channel" class="quiet" title="Canal siguiente (►)">${icon('skip-forward')} Siguiente</button>
    <button id="aspect-ratio" class="quiet" title="Relación de aspecto (A)">${icon('scaling')} Aspecto: Ajustar</button>
    <button id="mute-toggle" class="quiet" title="Silenciar (M)">${icon('volume-2')}</button>
    <input id="volume-slider" type="range" min="0" max="1" step="0.05" value="1" aria-label="Volumen" />
    <select id="quality" aria-label="Calidad de reproducción"><option value="-1">Calidad automática</option></select>
    <select id="audio-tracks" aria-label="Pistas de audio" hidden><option value="-1">Audio principal</option></select>
    <button id="retry" class="quiet">${icon('rotate-cw')} Reintentar</button>
    <button id="pip" class="quiet">${icon('picture-in-picture-2')} Mini reproductor</button>
    <button id="fullscreen" class="quiet">${icon('maximize')} Pantalla completa</button>
    <a id="external" class="quiet" target="_blank" rel="noopener noreferrer">Abrir fuente ${icon('external-link')}</a>
  </div>

  <p class="player-note">Teclas de control: <b>◄ / ►</b> Canal anterior / siguiente · <b>Espacio</b> Pausa · <b>A</b> Aspecto de pantalla · <b>M</b> Silenciar · <b>F</b> Pantalla completa.</p>
</dialog>

<dialog id="import-dialog">
  <div class="player-head">
    <h2>Tu lista. Tu televisión.</h2>
    <button id="close-import" class="icon-button" aria-label="Cerrar importación">${icon('x')}</button>
  </div>
  <p>Agregá una lista M3U de canales, películas o series que tengas autorización para ver. Se guarda en este navegador / TV.</p>
  <label class="upload">${icon('upload')}<strong>Elegí un archivo .m3u o .m3u8</strong><input id="file" type="file" accept=".m3u,.m3u8,text/plain"/></label>
  <div class="or">O PEGÁ LA URL DE TU LISTA</div>
  <form id="import-form">
    <input id="playlist-url" type="url" placeholder="https://ejemplo.com/lista.m3u" required aria-label="URL de lista M3U"/>
    <button class="primary">Importar</button>
  </form>
  <p id="import-status" role="status"></p>
  <button id="reset-source" class="text-button">Volver al catálogo oficial</button>
</dialog>

<div id="toast" role="status"></div>
`;

function renderCategoryPills() {
  const container = $('#category-pills');
  if (!container) return;
  const shortcuts = CATEGORY_SHORTCUTS[currentCatalog] || ['Todos'];
  container.innerHTML = shortcuts.map(cat => {
    const key = cat === 'Todos' ? 'all' : cat;
    const active = category === key ? 'selected' : '';
    return `<button class="cat-pill ${active}" data-pill="${esc(key)}">${esc(cat)}</button>`;
  }).join('');
}

function filtered() {
  return channels.filter(c => {
    const cGroup = (c.group || '').toLowerCase();
    const matchCountry = country === 'all' || (c.country || c.group) === country;
    const matchCategory = category === 'all' || cGroup.includes(category.toLowerCase());
    const matchQuery = !query || `${c.name} ${c.group} ${c.country}`.toLowerCase().includes(query.toLowerCase());
    const matchFav = view !== 'favorites' || favorites.includes(c.id);
    const matchHist = view !== 'history' || history.includes(c.id);
    return matchCountry && matchCategory && matchQuery && matchFav && matchHist;
  }).sort((a,b) => {
    if (view === 'history') return history.indexOf(a.id) - history.indexOf(b.id);
    if (currentCatalog === 'live' || currentCatalog === 'sports') return (a.country === 'AR' ? -1 : 0) - (b.country === 'AR' ? -1 : 0);
    return 0;
  });
}

function render() {
  const focused = document.activeElement;
  const focusId = focused?.dataset?.favorite || focused?.dataset?.play;
  const focusKind = focused?.hasAttribute?.('data-favorite') ? 'favorite' : 'play';
  const list = filtered();
  currentPlaylist = list;
  const isVod = currentCatalog === 'movies' || currentCatalog === 'series';

  $('#count').textContent = `${list.length.toLocaleString('es-AR')} ${isVod ? 'títulos' : 'canales'} · ${sourceName}`;
  const titleMap = {
    home: 'Descubrí en vivo',
    all: 'Canales de TV en vivo',
    live: 'Canales de TV en vivo',
    sports: 'Deportes Argentina & Latam',
    movies: 'Cine y Películas On Demand',
    series: 'Series de TV On Demand',
    favorites: 'Mi lista de favoritos',
    history: 'Vistos recientemente'
  };
  $('#section-title').innerHTML = (titleMap[view] || 'Canales') + '<span>.</span>';
  $('.hero').hidden = view !== 'home';

  document.querySelectorAll('nav [data-view]').forEach(b => {
    const bView = b.dataset.view;
    const isActive = bView === view || (bView === 'all' && view === 'live');
    b.classList.toggle('active', isActive);
  });

  document.querySelectorAll('[data-cat-tab]').forEach(b => {
    b.classList.toggle('selected', b.dataset.catTab === currentCatalog);
  });

  document.querySelectorAll('[data-country]').forEach(b => {
    b.classList.toggle('selected', b.dataset.country === country);
  });

  document.querySelectorAll('[data-pill]').forEach(b => {
    b.classList.toggle('selected', b.dataset.pill === category);
  });

  const gridEl = $('#grid');
  gridEl.className = isVod ? 'grid poster-grid' : 'grid compact-grid';

  gridEl.innerHTML = list.length ? list.slice(0, limit).map((c, i) => {
    if (isVod) {
      const typeLabel = currentCatalog === 'movies' ? 'CINE' : 'SERIE';
      const fallbackIcon = currentCatalog === 'movies' ? 'film' : 'tv';
      const posterUrl = (c.logo && /^https?:\/\//.test(c.logo)) ? c.logo : '';
      return `
        <article class="card poster-card" style="--card-color:${palettes[i % palettes.length]}">
          <button class="channel-play" data-play="${esc(c.id)}" aria-label="Ver ${esc(c.name)}">
            <div class="poster-art ${posterUrl ? '' : 'no-poster'}">
              <span class="signal">${typeLabel}</span>
              ${posterUrl ? `<img class="poster-img" loading="lazy" referrerpolicy="no-referrer" src="${esc(posterUrl)}" alt=""/>` : ''}
              <div class="poster-fallback">
                ${icon(fallbackIcon)}
                <strong>${esc(c.name)}</strong>
              </div>
              <span class="play-circle">${icon('play')}</span>
              <div class="poster-overlay">
                <h3 class="poster-title">${esc(c.name)}</h3>
                <span class="poster-genre">${esc(c.group || typeLabel)}</span>
              </div>
            </div>
          </button>
          <button class="favorite ${favorites.includes(c.id) ? 'saved' : ''}" data-favorite="${esc(c.id)}" aria-label="${favorites.includes(c.id) ? 'Quitar de' : 'Agregar a'} mi lista: ${esc(c.name)}" aria-pressed="${favorites.includes(c.id)}">
            ${icon('bookmark')}
          </button>
        </article>
      `;
    }

    const signalLabel = c.external ? 'WEB' : (currentCatalog === 'sports' ? 'DEPORTE' : 'TV');
    return `
      <article class="card compact-card" style="--card-color:${palettes[i % palettes.length]}">
        <button class="channel-play" data-play="${esc(c.id)}" aria-label="Ver ${esc(c.name)}">
          <div class="channel-art">
            <span class="channel-number">${String(i + 1).padStart(2, '0')}</span>
            <span class="signal">${signalLabel}</span>
            <div class="logo-box">
              ${c.logo && /^https?:\/\//.test(c.logo) ? `<img loading="lazy" referrerpolicy="no-referrer" src="${esc(c.logo)}" alt=""/>` : ''}
              <strong>${esc(c.name)}</strong>
            </div>
            <span class="play-circle">${icon('play')}</span>
            <div class="art-line"></div>
          </div>
          <div class="channel-info">
            <h3>${esc(c.name)}</h3>
            <p>${esc(c.group)} <span>• ${c.external ? 'Fuente externa' : 'En vivo'}</span></p>
          </div>
        </button>
        <button class="favorite ${favorites.includes(c.id) ? 'saved' : ''}" data-favorite="${esc(c.id)}" aria-label="${favorites.includes(c.id) ? 'Quitar de' : 'Agregar a'} mi lista: ${esc(c.name)}" aria-pressed="${favorites.includes(c.id)}">
          ${icon('bookmark')}
        </button>
      </article>
    `;
  }).join('') : `
    <div class="empty">
      ${icon(view === 'favorites' ? 'bookmark' : 'search')}
      <h3>${view === 'favorites' ? 'Tu próxima señal favorita te espera' : view === 'history' ? 'Todavía no abriste ningún contenido' : 'No encontramos resultados'}</h3>
      <p>${view === 'favorites' ? 'Guardá contenido con el ícono de marcador.' : view === 'history' ? 'Lo que reproduzcas va a aparecer acá.' : 'Probá otra búsqueda o seleccioná otra categoría o país.'}</p>
    </div>
  `;

  $('#more').hidden = list.length <= limit;
  $('#source').textContent = `Fuente: ${sourceName}`;

  gridEl.querySelectorAll('.poster-img').forEach(img => {
    img.onload = () => img.closest('.poster-art')?.classList.add('has-poster');
    img.onerror = () => {
      img.closest('.poster-art')?.classList.add('no-poster');
      img.remove();
    };
  });
  gridEl.querySelectorAll('.logo-box img').forEach(img => {
    img.onload = () => img.parentElement?.classList.add('has-logo');
    img.onerror = () => img.remove();
  });
  refreshIcons();

  if (isTV && focusId) {
    const target = [...document.querySelectorAll(`[data-${focusKind}]`)].find(el => el.dataset[focusKind] === focusId);
    (target || document.querySelector('nav .active'))?.focus({ preventScroll: true });
  }
}

function setupCatalog() {
  renderCategoryPills();
  const groups = [...new Map(channels.map(c => [c.country || c.group, c.group || c.country])).entries()]
    .filter(([id]) => Boolean(id))
    .sort((a,b) => a[1].localeCompare(b[1]));

  $('#countries').innerHTML = '<option value="all">Todos los países</option>' +
    groups.map(([id, name]) => `<option value="${esc(id)}">${esc(name)}</option>`).join('');

  country = 'all';
  category = 'all';
  limit = 48;
  render();
}

async function loadCatalog(catalogKey = 'live', fresh = false) {
  currentCatalog = catalogKey;
  const def = CATALOGS[catalogKey] || CATALOGS.live;
  sourceName = def.name;
  $('#refresh').disabled = true;

  try {
    const url = fresh ? def.remote : def.file;
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const parsed = parseM3U(text);
    if (!parsed.length) throw new Error('Lista vacía');
    channels = parsed;
    setupCatalog();
    if (fresh) toast(`Catálogo de ${def.name} actualizado.`);
  } catch (err) {
    // If local catalog fails or is empty, try the other or keep current
    if (!channels.length) {
      $('#grid').innerHTML = `<div class="empty"><h3>No pudimos cargar ${def.name}</h3><p>Usá Actualizar fuente para reintentar.</p></div>`;
    }
    toast(`No se pudo cargar ${def.name}.`);
  } finally {
    $('#refresh').disabled = false;
  }
}

function stop() {
  playbackRun++;
  clearTimeout(timeout);
  hls?.destroy();
  hls = null;
  const video = $('#video');
  if (video) {
    video.pause();
    video.removeAttribute('src');
    video.load();
  }
}

async function play(channel) {
  if (!channel) return;
  const list = filtered();
  currentPlaylist = list;
  currentIndex = list.findIndex(c => c.id === channel.id);
  if (currentIndex < 0) currentIndex = 0;

  history = [channel.id, ...history.filter(id => id !== channel.id)].slice(0, 50);
  save('jtv-history', history);

  if (isTV && window.JuampiNative && !channel.external) {
    window.JuampiNative.postMessage(JSON.stringify({
      action: 'play',
      url: channel.url,
      name: channel.name,
      group: channel.group || sourceName,
      index: currentIndex + 1,
      total: list.length
    }));
    return;
  }

  stop();
  current = channel;
  const video = $('#video');
  const catLabel = currentCatalog === 'sports'
    ? 'DEPORTES EN VIVO'
    : (currentCatalog === 'movies'
      ? 'PELÍCULA / CINE'
      : (currentCatalog === 'series' ? 'SERIE / EPISODIO' : 'TELEVISIÓN EN VIVO'));
  $('#player-category').textContent = catLabel;
  const isVod = currentCatalog === 'movies' || currentCatalog === 'series';
  $('#player-channel-meta').textContent = `${isVod ? 'Título' : 'Canal'} ${currentIndex + 1} de ${list.length} · ${channel.group || sourceName}`;
  $('#external').href = channel.url;
  $('#quality').innerHTML = '<option value="-1">Calidad automática</option>';
  $('#quality').disabled = true;
  $('#audio-tracks').hidden = true;

  video.style.objectFit = currentAspect;
  video.volume = isMuted ? 0 : currentVolume;

  if (!$('#player').open) $('#player').showModal();

  if (channel.external) {
    $('#retry').hidden = true;
    $('#pip').hidden = true;
    $('#fullscreen').hidden = true;
    $('#quality').hidden = true;
    $('#prev-channel').hidden = true;
    $('#next-channel').hidden = true;
    $('#play-pause').hidden = true;
    $('#aspect-ratio').hidden = true;
    $('.video-wrap').hidden = true;
    $('#external').focus();
    $('#player-status').textContent = 'Este canal se ve en la web de su proveedor. Elegí “Abrir fuente”.';
    return;
  }

  $('#retry').hidden = false;
  $('#pip').hidden = false;
  $('#fullscreen').hidden = false;
  $('#quality').hidden = false;
  $('#prev-channel').hidden = false;
  $('#next-channel').hidden = false;
  $('#play-pause').hidden = false;
  $('#aspect-ratio').hidden = false;
  $('.video-wrap').hidden = false;
  $('#player-status').textContent = 'Conectando con la señal…';

  timeout = setTimeout(() => {
    $('#player-status').textContent = 'La señal no está respondiendo. Podés reintentar o probar el siguiente canal.';
  }, 20000);

  const start = () => video.play().catch(() => {
    $('#player-status').textContent = 'Tocá Reproducir para iniciar.';
  });

  const run = playbackRun;
  let Hls;
  try {
    Hls = (await import('hls.js')).default;
  } catch {
    if (run === playbackRun) {
      clearTimeout(timeout);
      $('#player-status').textContent = 'No se pudo cargar el motor HLS.';
    }
    return;
  }
  if (run !== playbackRun) return;

  if (Hls.isSupported()) {
    hls = new Hls({ maxBufferLength: 30 });
    hls.loadSource(channel.url);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
      $('#quality').innerHTML = '<option value="-1">Calidad automática</option>' +
        data.levels.map((l, i) => `<option value="${i}">${l.height ? l.height + 'p' : Math.round(l.bitrate / 1000) + ' kbps'}</option>`).join('');
      $('#quality').disabled = false;

      if (hls.audioTracks && hls.audioTracks.length > 1) {
        $('#audio-tracks').hidden = false;
        $('#audio-tracks').innerHTML = hls.audioTracks.map((t, i) => `<option value="${i}">${t.name || t.lang || `Audio ${i + 1}`}</option>`).join('');
      }
      start();
    });

    hls.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) {
        clearTimeout(timeout);
        $('#player-status').textContent = 'No se pudo reproducir esta señal. Puede estar caída o limitada por región.';
        hls?.destroy();
        hls = null;
      }
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = channel.url;
    start();
  } else {
    clearTimeout(timeout);
    $('#player-status').textContent = 'Tu navegador no admite esta señal directamente.';
  }
}

// Zapping and aspect functions exposed globally
window.juampiNextChannel = () => {
  if (!currentPlaylist.length) currentPlaylist = filtered();
  if (!currentPlaylist.length) return false;
  currentIndex = (currentIndex + 1) % currentPlaylist.length;
  play(currentPlaylist[currentIndex]);
  return true;
};

window.juampiPrevChannel = () => {
  if (!currentPlaylist.length) currentPlaylist = filtered();
  if (!currentPlaylist.length) return false;
  currentIndex = (currentIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
  play(currentPlaylist[currentIndex]);
  return true;
};

window.juampiToggleAspect = () => {
  const modes = ['contain', 'cover', 'fill'];
  const labels = { contain: 'Ajustar', cover: 'Rellenar (Zoom)', fill: 'Estirar (16:9)' };
  const next = modes[(modes.indexOf(currentAspect) + 1) % modes.length];
  currentAspect = next;
  const video = $('#video');
  if (video) video.style.objectFit = next;
  const btn = $('#aspect-ratio');
  if (btn) btn.innerHTML = `${icon('scaling')} Aspecto: ${labels[next]}`;
  refreshIcons();
  toast(`Aspecto: ${labels[next]}`);
  return true;
};

// Event listeners for player video
$('#video').addEventListener('playing', () => {
  clearTimeout(timeout);
  $('#player-status').textContent = '● En reproducción';
  $('#play-pause').innerHTML = `${icon('pause')} Pausar`;
  refreshIcons();
});

$('#video').addEventListener('pause', () => {
  $('#play-pause').innerHTML = `${icon('play')} Reanudar`;
  refreshIcons();
});

$('#video').addEventListener('error', () => {
  if (current) {
    clearTimeout(timeout);
    $('#player-status').textContent = 'Error al reproducir el video. Podés reintentar o pasar al siguiente canal.';
  }
});

// Player Action Controls
$('#prev-channel').onclick = () => window.juampiPrevChannel();
$('#next-channel').onclick = () => window.juampiNextChannel();
$('#aspect-ratio').onclick = () => window.juampiToggleAspect();

$('#play-pause').onclick = () => {
  const v = $('#video');
  if (v.paused) v.play(); else v.pause();
};

$('#mute-toggle').onclick = () => {
  const v = $('#video');
  isMuted = !isMuted;
  v.muted = isMuted;
  $('#mute-toggle').innerHTML = icon(isMuted ? 'volume-x' : 'volume-2');
  refreshIcons();
};

$('#volume-slider').oninput = e => {
  const v = $('#video');
  currentVolume = Number(e.target.value);
  isMuted = currentVolume === 0;
  v.volume = currentVolume;
  v.muted = isMuted;
  $('#mute-toggle').innerHTML = icon(isMuted ? 'volume-x' : 'volume-2');
  refreshIcons();
};

$('#quality').onchange = e => {
  if (hls) hls.currentLevel = Number(e.target.value);
};

$('#audio-tracks').onchange = e => {
  if (hls) hls.audioTrack = Number(e.target.value);
};

$('#retry').onclick = () => current && play(current);
$('#pip').onclick = async () => {
  try {
    if (document.pictureInPictureElement) await document.exitPictureInPicture();
    else await $('#video').requestPictureInPicture();
  } catch {
    toast('Mini reproductor no disponible en este dispositivo.');
  }
};
$('#fullscreen').onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await $('#video').requestFullscreen();
  } catch {
    toast('No se pudo activar pantalla completa.');
  }
};
$('#close-player').onclick = () => $('#player').close();
$('#player').addEventListener('close', () => {
  stop();
  current = null;
  if (view === 'history') render();
});

// Catalog / Tab switching
async function switchCatalog(cat) {
  if (cat === currentCatalog && channels.length) return;
  await loadCatalog(cat);
}

// Global click handling
document.addEventListener('click', async e => {
  const b = e.target.closest('button');
  if (!b) return;

  // View navigation in sidebar
  if (b.dataset.view) {
    const v = b.dataset.view;
    if (v === 'sports') {
      view = 'sports';
      await switchCatalog('sports');
    } else if (v === 'movies') {
      view = 'movies';
      await switchCatalog('movies');
    } else if (v === 'series') {
      view = 'series';
      await switchCatalog('series');
    } else if (v === 'all') {
      view = 'live';
      await switchCatalog('live');
    } else {
      view = v;
      if (['home', 'live'].includes(v) && currentCatalog !== 'live') {
        await switchCatalog('live');
      }
    }
    limit = 48;
    render();
  }

  // Header quick catalog buttons
  if (b.dataset.catalogSwitch) {
    const target = b.dataset.catalogSwitch;
    view = target;
    await switchCatalog(target);
    limit = 48;
    render();
  }

  // Catalog tab buttons
  if (b.dataset.catTab) {
    const target = b.dataset.catTab;
    view = target;
    await switchCatalog(target);
    limit = 48;
    render();
  }

  // Category pills
  if (b.dataset.pill) {
    category = b.dataset.pill;
    limit = 48;
    render();
  }

  // Country filter chips
  if (b.dataset.country) {
    country = b.dataset.country;
    $('#countries').value = country;
    limit = 48;
    render();
  }

  // Import dialog
  if (b.hasAttribute('data-import')) {
    $('#import-dialog').showModal();
  }

  // Play channel
  if (b.dataset.play) {
    const ch = channels.find(c => c.id === b.dataset.play);
    if (ch) play(ch);
  }

  // Favorite toggle
  if (b.dataset.favorite) {
    const id = b.dataset.favorite;
    favorites = favorites.includes(id) ? favorites.filter(x => x !== id) : [...favorites, id];
    save('jtv-favorites', favorites);
    render();
  }
});

document.querySelectorAll('.brand,.wordmark[href]').forEach(a => a.onclick = e => {
  e.preventDefault();
  view = 'home';
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

$('#search').oninput = e => {
  query = e.target.value;
  limit = 48;
  render();
};

$('#countries').onchange = e => {
  country = e.target.value;
  limit = 48;
  render();
};

$('#more').onclick = () => {
  limit += 48;
  render();
};

$('#refresh').onclick = () => loadCatalog(currentCatalog, true);
$('#explore').onclick = () => $('#catalog').scrollIntoView({ behavior: 'smooth' });

// Import list handling
$('#close-import').onclick = () => $('#import-dialog').close();

async function importText(text) {
  const parsed = parseM3U(text);
  if (!parsed.length) throw new Error('La lista no contiene canales válidos.');
  imported = parsed;
  save('jtv-imported', imported);
  channels = parsed;
  sourceName = 'Mi lista IPTV';
  view = 'all';
  query = '';
  $('#search').value = '';
  setupCatalog();
  $('#import-dialog').close();
  toast(`${parsed.length} canales importados.`);
}

$('#file').onchange = async e => {
  try {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 15 * 1024 * 1024) throw new Error('La lista debe pesar menos de 15 MB.');
    await importText(await f.text());
  } catch (err) {
    $('#import-status').textContent = err.message;
  } finally {
    e.target.value = '';
  }
};

$('#import-form').onsubmit = async e => {
  e.preventDefault();
  $('#import-status').textContent = 'Importando…';
  try {
    const url = new URL($('#playlist-url').value);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('URL no válida');
    const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    await importText(await r.text());
    $('#import-status').textContent = '';
  } catch {
    $('#import-status').textContent = 'No pudimos importar esa URL. Si el proveedor bloquea el acceso desde navegador, descargá el archivo .m3u y cargalo arriba.';
  }
};

$('#reset-source').onclick = () => {
  imported = [];
  save('jtv-imported', []);
  $('#import-dialog').close();
  loadCatalog('live');
};

// Global keyboard navigation & shortcuts
document.addEventListener('keydown', e => {
  if ($('#player').open && !['INPUT', 'SELECT'].includes(e.target.tagName)) {
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      $('#play-pause').click();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      window.juampiPrevChannel();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      window.juampiNextChannel();
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      $('#mute-toggle').click();
    } else if (e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      window.juampiToggleAspect();
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      $('#fullscreen').click();
    }
    return;
  }

  if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) && !$('dialog[open]')) {
    e.preventDefault();
    $('#search').focus();
  }
});

// Initialization
refreshIcons();
if (imported.length) {
  channels = imported;
  sourceName = 'Mi lista IPTV';
  setupCatalog();
} else {
  loadCatalog('live');
}

if (isTV) installTVNavigation();

window.juampiNativeClosed = () => {
  if (view === 'history') render();
};

window.juampiBack = () => {
  const dialog = document.querySelector('dialog[open]');
  if (dialog) {
    dialog.close();
    return true;
  }
  if (document.activeElement?.tagName === 'INPUT') {
    document.activeElement.blur();
    document.querySelector('nav .active')?.focus();
    return true;
  }
  if (query || country !== 'all' || category !== 'all') {
    query = '';
    country = 'all';
    category = 'all';
    $('#search').value = '';
    $('#countries').value = 'all';
    render();
    document.querySelector('nav .active')?.focus();
    return true;
  }
  if (view !== 'home' || window.scrollY > 30) {
    view = 'home';
    render();
    window.scrollTo(0, 0);
    $('#explore').focus({ preventScroll: true });
    return true;
  }
  return false;
};

$('#external').addEventListener('click', event => {
  if (isTV && window.JuampiNative) {
    event.preventDefault();
    window.JuampiNative.postMessage(JSON.stringify({
      action: 'external',
      url: event.currentTarget.href
    }));
  }
});
