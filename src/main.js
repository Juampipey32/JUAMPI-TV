import {
  createIcons, House, Radio, Film, Tv, Bookmark, History, ListPlus, Plus, Play, Pause,
  Search, RefreshCw, ArrowDown, ArrowUpRight, X, RotateCw, PictureInPicture2, Maximize,
  ExternalLink, Upload, SkipBack, SkipForward, Volume2, VolumeX, Scaling, Trophy, Info, Sparkles, Flame,
  Server, AlertTriangle
} from 'lucide';

const icons = {
  House, Radio, Film, Tv, Bookmark, History, ListPlus, Plus, Play, Pause,
  Search, RefreshCw, ArrowDown, ArrowUpRight, X, RotateCw, PictureInPicture2, Maximize,
  ExternalLink, Upload, SkipBack, SkipForward, Volume2, VolumeX, Scaling, Trophy, Info, Sparkles, Flame,
  Server, AlertTriangle
};

import { STREAM_PROVIDERS, resolveMediaId } from './providers.js';
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

const catalogs = {
  live: [],
  sports: [],
  movies: [],
  series: []
};

let view = 'home';
let query = '';
let current = null;
let currentPlaylist = [];
let currentIndex = -1;
let currentAspect = 'contain';
let currentVolume = 1;
let isMuted = false;
let hls = null;
let playbackRun = 0;
let timeout = null;
let activeFeatured = null;

const palettes = ['#27372d','#323044','#243d43','#493029','#343b27','#29334b'];
const refreshIcons = () => createIcons({ icons });

function toast(message) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = message;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

const FEATURED_ITEMS = {
  home: {
    id: 'feat-gladiator',
    name: 'Gladiador II (2024)',
    eyebrow: 'ESTRENO DESTACADO · 4K ULTRA HD',
    desc: 'Años después de presenciar la muerte del admirado héroe Máximo, Lucio debe ingresar al Coliseo tras la caída de su hogar en manos de los tiranos emperadores de Roma.',
    poster: 'https://m.media-amazon.com/images/M/MV5BMWYzZTM5ZGQtOGE5My00NmM2LWFlMDEtMGNjYjdmOWM1MzA1XkEyXkFqcGc@._V1_SX300.jpg',
    url: 'http://live.stablechannels.tv:80/movie/E0KEkrd46/q7bFf1Y50/13243.mp4',
    tmdbId: '933260',
    imdbId: 'tt9218128',
    type: 'movie',
    group: 'Estrenos 2024 - 2025'
  },
  movies: {
    id: 'feat-deadpool',
    name: 'Deadpool & Wolverine (2024)',
    eyebrow: 'CINE ON DEMAND · ÉXITO DE TAQUILLA',
    desc: 'Wade Wilson intenta llevar una vida civil tranquila, pero cuando una amenaza existencial pone en jaque su universo, debe convencer a un renuente Wolverine.',
    poster: 'https://m.media-amazon.com/images/M/MV5BZTk5ODY0MmQtMzA3Ni00NGY1LThiYzItZThiNjFiNDM4MTM3XkEyXkFqcGc@._V1_SX300.jpg',
    url: 'http://live.stablechannels.tv:80/movie/E0KEkrd46/q7bFf1Y50/13240.mp4',
    tmdbId: '533535',
    imdbId: 'tt6263850',
    type: 'movie',
    group: 'Acción & Aventura'
  },
  series: {
    id: 'feat-stranger',
    name: 'Stranger Things',
    eyebrow: 'SERIES ON DEMAND · NETFLIX ORIGINALS',
    desc: 'En un pequeño pueblo donde todos se conocen, un incidente desata una serie de acontecimientos que llevan a la desaparición de un niño, revelando experimentos secretos y fuerzas paranormales.',
    poster: 'https://m.media-amazon.com/images/M/MV5BMjEzMDAxOTUyMV5BMl5BanBnXkFtZTgwNzAxMzYzOTE@._V1_SX300.jpg',
    seriesName: 'Stranger Things',
    tmdbId: '66732',
    imdbId: 'tt4574334',
    type: 'series',
    group: 'Ciencia Ficción'
  },
  sports: {
    id: 'feat-tyc',
    name: 'TyC Sports (Señal en vivo)',
    eyebrow: 'FÚTBOL & POLIDEPORTIVO · EN VIVO',
    desc: 'Toda la pasión de la Liga Profesional de Fútbol, la Selección Argentina, Copa Argentina, básquet, vóley y automovilismo las 24 horas.',
    poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/TyC_Sports_logo.svg/512px-TyC_Sports_logo.svg.png',
    url: 'http://45.181.87.106/TYCSPORTSHD/index.m3u8',
    type: 'sports',
    group: 'Deportes Argentina'
  },
  live: {
    id: 'feat-deportv',
    name: 'DeporTV HD',
    eyebrow: 'TELEVISIÓN EN VIVO · SEÑALES ABIERTAS',
    desc: 'Canal público argentino dedicado al deporte federal, torneos nacionales e internacionales en alta definición.',
    poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/DeporTV_%28Argentina%29_logo_2016.png/512px-DeporTV_%28Argentina%29_logo_2016.png',
    url: 'https://5fb24b460df87.streamlock.net/live-cont.ar/deportv/playlist.m3u8',
    type: 'live',
    group: 'Televisión Abierta'
  }
};

$('#app').innerHTML = `
<aside class="sidebar">
  <a class="brand" href="#" aria-label="JUAMPI-TV inicio">J<span>↗</span></a>
  <nav aria-label="Navegación principal">
    <button data-view="home" class="active" aria-label="Inicio">${icon('house')}<span>Inicio</span></button>
    <button data-view="movies" aria-label="Películas">${icon('film')}<span>Películas</span></button>
    <button data-view="series" aria-label="Series">${icon('tv')}<span>Series</span></button>
    <button data-view="sports" aria-label="Deportes">${icon('trophy')}<span>Deportes</span></button>
    <button data-view="all" aria-label="TV en vivo">${icon('radio')}<span>En vivo</span></button>
    <button data-view="favorites" aria-label="Mi lista">${icon('bookmark')}<span>Mi lista</span></button>
    <button data-view="history" aria-label="Recientes">${icon('history')}<span>Recientes</span></button>
  </nav>
  <button class="sidebar-import" data-import aria-label="Importar lista M3U">${icon('list-plus')}<span>Tu IPTV</span></button>
  <div class="avatar">J</div>
</aside>

<main>
  <header>
    <div class="header-left">
      <a href="#" class="wordmark">JUAMPI<span>—TV</span><small>STREAMBERT ED. 0.6.0</small></a>
    </div>
    <div class="header-right">
      <label class="search-bar">
        ${icon('search')}
        <input id="search" type="search" placeholder="Buscá películas, series, canales..." aria-label="Buscar contenido"/>
        <kbd>/</kbd>
      </label>
      <button class="quiet" data-import>${icon('plus')} <span>Agregar M3U</span></button>
      <div class="user">J</div>
    </div>
  </header>

  <section class="hero" id="hero">
    <div class="hero-image" id="hero-bg"></div>
    <div class="hero-content">
      <div class="eyebrow" id="hero-eyebrow"><span class="pill">DESTACADO</span> ULTRA HD</div>
      <h1 id="hero-title">TU MUNDO.<br><em>EN VIVO.</em></h1>
      <p id="hero-desc">Cine on-demand, series completas por plataforma, deportes argentinos y TV en vivo.</p>
      <div class="hero-actions">
        <button id="hero-play" class="primary">${icon('play')} Reproducir</button>
        <button id="hero-fav" class="glass">${icon('bookmark')} Mi lista</button>
      </div>
    </div>
  </section>

  <section class="catalog" id="catalog">
    <div class="catalog-heading">
      <h2 id="section-title">Navegación Rápida<span>.</span></h2>
      <span id="catalog-count" class="catalog-count">Cargando catálogo…</span>
    </div>
    <div id="carousels-container" class="carousels-container"></div>
  </section>

  <footer>
    <span class="wordmark">JUAMPI<span>—TV</span></span>
    <p>Tu plataforma integral de entretenimiento · Optimizada para control remoto en Google TV y Android TV</p>
    <span>STREAMBERT UNIVERSAL ENGINE ↗</span>
  </footer>
</main>

<dialog id="series-dialog">
  <div class="series-modal-box">
    <button id="close-series" class="icon-button modal-close" aria-label="Cerrar detalles de serie">${icon('x')}</button>
    <div class="series-modal-hero">
      <div class="series-modal-art">
        <img id="series-modal-img" src="" alt=""/>
      </div>
      <div class="series-modal-info">
        <span id="series-modal-platform" class="pill">NETFLIX</span>
        <h2 id="series-modal-title">Nombre de la Serie</h2>
        <div class="series-modal-meta" id="series-modal-meta">10 episodios • Drama</div>
        <p class="series-modal-desc" id="series-modal-desc">Descripción de la serie en JUAMPI-TV.</p>
        <div class="series-server-row">
          <label for="series-server-select">${icon('server')} Servidor:</label>
          <select id="series-server-select" class="series-server-select" aria-label="Servidor para serie">
            <option value="default">Servidor 1 (HLS Directo)</option>
            <option value="videasy">Servidor 2 (Videasy HD)</option>
            <option value="vidsrc">Servidor 3 (VidSrc Mirror)</option>
            <option value="vidking">Servidor 4 (Vidking Universal)</option>
          </select>
        </div>
        <button id="series-modal-play-first" class="primary">${icon('play')} Reproducir Episodio 1</button>
      </div>
    </div>
    <div class="series-episodes-wrap">
      <h3>Episodios y Temporadas</h3>
      <div class="series-episodes-grid" id="series-episodes-grid"></div>
    </div>
  </div>
</dialog>

<dialog id="player">
  <div class="player-head">
    <div>
      <span class="eyebrow" id="player-category">REPRODUCTOR</span>
      <h2 id="playing-name"></h2>
      <div class="player-sub" id="player-channel-meta">Canal 01</div>
    </div>
    <div class="player-server-box">
      <label for="server-select" class="server-label">${icon('server')} Servidor:</label>
      <select id="server-select" class="server-select" aria-label="Seleccionar servidor de transmisión">
        <option value="default">Servidor 1 (HLS Directo)</option>
        <option value="videasy">Servidor 2 (Videasy HD)</option>
        <option value="vidsrc">Servidor 3 (VidSrc Mirror)</option>
        <option value="vidking">Servidor 4 (Vidking Universal)</option>
      </select>
    </div>
    <button id="close-player" class="icon-button" aria-label="Cerrar reproductor">${icon('x')}</button>
  </div>

  <div class="video-wrap">
    <video id="video" playsinline></video>
    <iframe id="player-embed" class="embed-player" hidden allow="autoplay; fullscreen; encrypted-media; picture-in-picture"></iframe>
  </div>

  <div id="player-failover" class="player-failover" hidden>
    <div class="failover-box">
      <div class="failover-msg">
        <span class="failover-icon">${icon('alert-triangle')}</span>
        <div>
          <strong>¿Problemas con la señal directa?</strong>
          <p>Podés cambiar de inmediato a los servidores universales sin publicidad.</p>
        </div>
      </div>
      <div class="failover-buttons">
        <button id="failover-videasy" class="failover-btn primary">${icon('server')} Servidor 2 (Videasy HD)</button>
        <button id="failover-vidsrc" class="failover-btn glass">${icon('server')} Servidor 3 (VidSrc Mirror)</button>
      </div>
    </div>
  </div>

  <div id="player-status" role="status"></div>

  <div class="player-actions">
    <button id="prev-channel" class="quiet" title="Anterior (◄)">${icon('skip-back')} Anterior</button>
    <button id="play-pause" class="quiet" title="Pausar / Reanudar (Espacio)">${icon('pause')} Pausar</button>
    <button id="next-channel" class="quiet" title="Siguiente (►)">${icon('skip-forward')} Siguiente</button>
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

  <p class="player-note">Teclas de control: <b>◄ / ►</b> Anterior / Siguiente · <b>Espacio</b> Pausa · <b>A</b> Aspecto de pantalla · <b>M</b> Silenciar · <b>F</b> Pantalla completa.</p>
</dialog>

<dialog id="import-dialog">
  <div class="player-head">
    <h2>Tu lista. Tu televisión.</h2>
    <button id="close-import" class="icon-button" aria-label="Cerrar importación">${icon('x')}</button>
  </div>
  <p>Agregá una lista M3U privada de canales, películas o series. Se guarda localmente en este dispositivo.</p>
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

function renderCard(item, idx, type) {
  if (type === 'series') {
    const isSaved = favorites.includes('series:' + item.name);
    return `
      <article class="card poster-card series-card" style="--card-color:${palettes[idx % palettes.length]}">
        <button class="channel-play series-open" data-series-name="${esc(item.name)}" data-play="${esc(item.episodes[0]?.url || item.name)}" aria-label="Serie ${esc(item.name)} (${item.totalEpisodes} episodios)">
          <div class="poster-art ${item.poster ? 'has-poster' : 'no-poster'}">
            <span class="signal platform-tag ${item.platform.toLowerCase().replace(/[^a-z0-9]/g, '-')}">${esc(item.platform)}</span>
            ${item.poster ? `<img class="poster-img" loading="lazy" referrerpolicy="no-referrer" src="${esc(item.poster)}" alt=""/>` : ''}
            <div class="poster-fallback">
              ${icon('tv')}
              <strong>${esc(item.name)}</strong>
            </div>
            <span class="play-circle">${icon('play')}</span>
            <div class="poster-overlay">
              <h4 class="poster-title">${esc(item.name)}</h4>
              <span class="poster-genre">${item.totalEpisodes} eps • ${esc(item.genre)}</span>
            </div>
          </div>
        </button>
        <button class="favorite ${isSaved ? 'saved' : ''}" data-favorite="series:${esc(item.name)}" aria-label="${isSaved ? 'Quitar de' : 'Agregar a'} mi lista: ${esc(item.name)}" aria-pressed="${isSaved}">
          ${icon('bookmark')}
        </button>
      </article>
    `;
  }

  if (type === 'movie') {
    const isSaved = favorites.includes(item.id);
    const posterUrl = (item.logo && /^https?:\/\//.test(item.logo)) ? item.logo : '';
    const cleanGroup = item.group ? item.group.split('•')[0].trim() : 'Cine';
    return `
      <article class="card poster-card movie-card" style="--card-color:${palettes[idx % palettes.length]}">
        <button class="channel-play" data-play="${esc(item.id)}" aria-label="Ver película ${esc(item.name)}">
          <div class="poster-art ${posterUrl ? 'has-poster' : 'no-poster'}">
            <span class="signal">${esc(cleanGroup)}</span>
            ${posterUrl ? `<img class="poster-img" loading="lazy" referrerpolicy="no-referrer" src="${esc(posterUrl)}" alt=""/>` : ''}
            <div class="poster-fallback">
              ${icon('film')}
              <strong>${esc(item.name)}</strong>
            </div>
            <span class="play-circle">${icon('play')}</span>
            <div class="poster-overlay">
              <h4 class="poster-title">${esc(item.name)}</h4>
              <span class="poster-genre">${esc(item.group || 'Película')}</span>
            </div>
          </div>
        </button>
        <button class="favorite ${isSaved ? 'saved' : ''}" data-favorite="${esc(item.id)}" aria-label="${isSaved ? 'Quitar de' : 'Agregar a'} mi lista: ${esc(item.name)}" aria-pressed="${isSaved}">
          ${icon('bookmark')}
        </button>
      </article>
    `;
  }

  // Live TV or Sports compact card
  const isSaved = favorites.includes(item.id);
  const signalLabel = item.external ? 'WEB' : (type === 'sports' ? 'DEPORTE' : 'TV');
  return `
    <article class="card compact-card" style="--card-color:${palettes[idx % palettes.length]}">
      <button class="channel-play" data-play="${esc(item.id)}" aria-label="Ver canal ${esc(item.name)}">
        <div class="channel-art">
          <span class="channel-number">${String(idx + 1).padStart(2, '0')}</span>
          <span class="signal">${signalLabel}</span>
          <div class="logo-box">
            ${item.logo && /^https?:\/\//.test(item.logo) ? `<img loading="lazy" referrerpolicy="no-referrer" src="${esc(item.logo)}" alt=""/>` : ''}
            <strong>${esc(item.name)}</strong>
          </div>
          <span class="play-circle">${icon('play')}</span>
          <div class="art-line"></div>
        </div>
        <div class="channel-info">
          <h3>${esc(item.name)}</h3>
          <p>${esc(item.group)} <span>• ${item.external ? 'Web' : 'En vivo'}</span></p>
        </div>
      </button>
      <button class="favorite ${isSaved ? 'saved' : ''}" data-favorite="${esc(item.id)}" aria-label="${isSaved ? 'Quitar de' : 'Agregar a'} mi lista: ${esc(item.name)}" aria-pressed="${isSaved}">
        ${icon('bookmark')}
      </button>
    </article>
  `;
}

function renderCarouselRow(rowId, title, iconName, items, type) {
  if (!items || !items.length) return '';
  return `
    <section class="carousel-row" data-row-id="${esc(rowId)}">
      <div class="carousel-header">
        <h3 class="carousel-title">${icon(iconName)} <span>${esc(title)}</span> <small class="carousel-count">${items.length}</small></h3>
      </div>
      <div class="carousel-strip" tabindex="-1">
        ${items.map((item, idx) => renderCard(item, idx, type)).join('')}
      </div>
    </section>
  `;
}

function updateHero() {
  const feat = FEATURED_ITEMS[view] || FEATURED_ITEMS.home;
  activeFeatured = feat;
  $('#hero-title').innerHTML = feat.name ? esc(feat.name) : 'TU MUNDO.<br><em>EN VIVO.</em>';
  $('#hero-eyebrow').innerHTML = `<span class="pill">${feat.eyebrow?.split('·')[0] || 'DESTACADO'}</span> ${feat.eyebrow?.split('·').slice(1).join('·') || 'ULTRA HD'}`;
  $('#hero-desc').textContent = feat.desc || '';
  if (feat.poster) {
    $('#hero-bg').style.backgroundImage = `linear-gradient(90deg, #101710f5 0%, #121a14cc 40%, #10121011 85%), linear-gradient(0deg, #101210 0%, transparent 40%), url('${feat.poster}')`;
  } else {
    $('#hero-bg').style.backgroundImage = `linear-gradient(90deg, #101710f5 0%, #121a14cc 40%, #10121011 85%), linear-gradient(0deg, #101210 0%, transparent 40%), url('/patagonia.jpg')`;
  }
}

function getRowsForView() {
  if (query.trim()) {
    const q = query.toLowerCase();
    const movieMatches = catalogs.movies.filter(m => m.name.toLowerCase().includes(q));
    const seriesMatches = catalogs.series.filter(s => s.name.toLowerCase().includes(q));
    const sportMatches = catalogs.sports.filter(s => s.name.toLowerCase().includes(q));
    const liveMatches = catalogs.live.filter(c => c.name.toLowerCase().includes(q));
    return [
      { id: 'search-movies', title: `Películas coincidentes con "${query}"`, icon: 'film', type: 'movie', items: movieMatches },
      { id: 'search-series', title: `Series coincidentes con "${query}"`, icon: 'tv', type: 'series', items: seriesMatches },
      { id: 'search-sports', title: `Deportes coincidentes con "${query}"`, icon: 'trophy', type: 'sports', items: sportMatches },
      { id: 'search-live', title: `Canales de TV coincidentes con "${query}"`, icon: 'radio', type: 'live', items: liveMatches }
    ];
  }

  if (view === 'home') {
    return [
      { id: 'home-sports', title: 'Fútbol Argentino & Deportes en Vivo', icon: 'trophy', type: 'sports', items: catalogs.sports },
      { id: 'home-estrenos', title: 'Estrenos de Cine 2024 - 2025', icon: 'sparkles', type: 'movie', items: catalogs.movies.filter(m => m.group?.includes('2024') || m.group?.includes('2025')).slice(0, 32) },
      { id: 'home-netflix', title: 'Series Destacadas de Netflix', icon: 'flame', type: 'series', items: catalogs.series.filter(s => s.platform === 'Netflix') },
      { id: 'home-hbo', title: 'Series Aclamadas de HBO Max', icon: 'tv', type: 'series', items: catalogs.series.filter(s => s.platform === 'HBO Max') },
      { id: 'home-disney', title: 'Favoritos de Disney+ & Star+', icon: 'tv', type: 'series', items: catalogs.series.filter(s => s.platform === 'Disney+') },
      { id: 'home-prime', title: 'Producciones de Amazon Prime Video', icon: 'tv', type: 'series', items: catalogs.series.filter(s => s.platform === 'Amazon Prime Video') },
      { id: 'home-live-ar', title: 'Televisión Argentina en Vivo', icon: 'radio', type: 'live', items: catalogs.live.filter(c => c.country === 'AR').slice(0, 32) },
      { id: 'home-action', title: 'Cine de Acción y Adrenalina', icon: 'film', type: 'movie', items: catalogs.movies.filter(m => m.group?.includes('Acción')).slice(0, 32) },
      { id: 'home-comedy', title: 'Películas de Comedia Populares', icon: 'film', type: 'movie', items: catalogs.movies.filter(m => m.group?.includes('Comedia')).slice(0, 32) }
    ];
  }

  if (view === 'movies') {
    return [
      { id: 'mov-2025', title: 'Estrenos 2024 - 2025', icon: 'sparkles', type: 'movie', items: catalogs.movies.filter(m => m.group?.includes('2024') || m.group?.includes('2025')).slice(0, 48) },
      { id: 'mov-2020', title: 'Aclamadas 2020 - 2023', icon: 'film', type: 'movie', items: catalogs.movies.filter(m => m.group?.includes('2020')).slice(0, 48) },
      { id: 'mov-action', title: 'Acción & Aventura', icon: 'flame', type: 'movie', items: catalogs.movies.filter(m => m.group?.includes('Acción')).slice(0, 48) },
      { id: 'mov-scifi', title: 'Ciencia Ficción & Fantasía', icon: 'film', type: 'movie', items: catalogs.movies.filter(m => m.group?.includes('Ficción')).slice(0, 48) },
      { id: 'mov-terror', title: 'Terror & Suspenso', icon: 'film', type: 'movie', items: catalogs.movies.filter(m => m.group?.includes('Terror')).slice(0, 48) },
      { id: 'mov-comedy', title: 'Comedias para Reír', icon: 'film', type: 'movie', items: catalogs.movies.filter(m => m.group?.includes('Comedia')).slice(0, 48) },
      { id: 'mov-anim', title: 'Animación & Familiar', icon: 'film', type: 'movie', items: catalogs.movies.filter(m => m.group?.includes('Animación')).slice(0, 48) },
      { id: 'mov-classics', title: 'Clásicos y Recuerdos', icon: 'history', type: 'movie', items: catalogs.movies.filter(m => m.group?.includes('Clásico') || m.group?.includes('2010')).slice(0, 48) },
      { id: 'mov-drama', title: 'Drama & Romance', icon: 'film', type: 'movie', items: catalogs.movies.filter(m => m.group?.includes('Drama')).slice(0, 48) }
    ];
  }

  if (view === 'series') {
    return [
      { id: 'ser-pop', title: 'Series Populares On Demand', icon: 'sparkles', type: 'series', items: catalogs.series.slice(0, 32) },
      { id: 'ser-netflix', title: '🔴 Netflix Originals', icon: 'tv', type: 'series', items: catalogs.series.filter(s => s.platform === 'Netflix') },
      { id: 'ser-hbo', title: '🟣 HBO Max / Max', icon: 'tv', type: 'series', items: catalogs.series.filter(s => s.platform === 'HBO Max') },
      { id: 'ser-disney', title: '🔵 Disney+ & Star+', icon: 'tv', type: 'series', items: catalogs.series.filter(s => s.platform === 'Disney+') },
      { id: 'ser-prime', title: '🟢 Amazon Prime Video', icon: 'tv', type: 'series', items: catalogs.series.filter(s => s.platform === 'Amazon Prime Video') },
      { id: 'ser-anime', title: '🎌 Anime & Crunchyroll', icon: 'flame', type: 'series', items: catalogs.series.filter(s => s.platform === 'Anime & Crunchyroll') },
      { id: 'ser-comedy', title: 'Comedias & Sitcoms', icon: 'tv', type: 'series', items: catalogs.series.filter(s => s.genre?.includes('Comedia')) },
      { id: 'ser-crime', title: 'Crimen, Misterio & Drama', icon: 'tv', type: 'series', items: catalogs.series.filter(s => s.genre?.includes('Crimen') || s.genre?.includes('Drama')) },
      { id: 'ser-other', title: 'Otras Grandes Producciones', icon: 'tv', type: 'series', items: catalogs.series.filter(s => s.platform === 'Otras Producciones') }
    ];
  }

  if (view === 'sports') {
    return [
      { id: 'spo-ar', title: 'Fútbol Argentino & Señales Nacionales', icon: 'trophy', type: 'sports', items: catalogs.sports.filter(s => s.country === 'AR') },
      { id: 'spo-pan', title: 'Cadenas Panregionales (DSports, Fox, ESPN)', icon: 'trophy', type: 'sports', items: catalogs.sports.filter(s => s.group?.includes('Panregional') || s.group?.includes('Cadenas')) },
      { id: 'spo-combat', title: 'Combate & Deportes Extremos', icon: 'flame', type: 'sports', items: catalogs.sports.filter(s => s.group?.includes('Combate') || s.group?.includes('Extremos')) },
      { id: 'spo-auto', title: 'Automovilismo & Polideportivo', icon: 'trophy', type: 'sports', items: catalogs.sports.filter(s => s.group?.includes('Automovilismo') || s.group?.includes('Polideportivo')) }
    ];
  }

  if (view === 'live' || view === 'all') {
    return [
      { id: 'live-ar', title: 'Canales de Argentina en Directo', icon: 'radio', type: 'live', items: catalogs.live.filter(c => c.country === 'AR').slice(0, 48) },
      { id: 'live-news', title: 'Noticias 24/7 en Vivo', icon: 'radio', type: 'live', items: catalogs.live.filter(c => c.group?.includes('Noticias')).slice(0, 48) },
      { id: 'live-ent', title: 'Entretenimiento & Variedades', icon: 'radio', type: 'live', items: catalogs.live.filter(c => c.group?.includes('Entretenimiento')).slice(0, 48) },
      { id: 'live-music', title: 'Música en Directo', icon: 'radio', type: 'live', items: catalogs.live.filter(c => c.group?.includes('Música')).slice(0, 48) },
      { id: 'live-es', title: 'España & Europa', icon: 'radio', type: 'live', items: catalogs.live.filter(c => c.country === 'ES').slice(0, 48) },
      { id: 'live-latam', title: 'México & Estados Unidos', icon: 'radio', type: 'live', items: catalogs.live.filter(c => ['MX', 'US'].includes(c.country)).slice(0, 48) }
    ];
  }

  if (view === 'favorites') {
    const favMovies = catalogs.movies.filter(m => favorites.includes(m.id));
    const favSports = catalogs.sports.filter(s => favorites.includes(s.id));
    const favLive = catalogs.live.filter(c => favorites.includes(c.id));
    const favSeries = catalogs.series.filter(s => favorites.includes('series:' + s.name));
    return [
      { id: 'fav-series', title: 'Series en Mi Lista', icon: 'bookmark', type: 'series', items: favSeries },
      { id: 'fav-movies', title: 'Películas en Mi Lista', icon: 'bookmark', type: 'movie', items: favMovies },
      { id: 'fav-sports', title: 'Deportes en Mi Lista', icon: 'bookmark', type: 'sports', items: favSports },
      { id: 'fav-live', title: 'Canales en Mi Lista', icon: 'bookmark', type: 'live', items: favLive }
    ];
  }

  if (view === 'history') {
    const histItems = history.map(id => {
      return catalogs.movies.find(m => m.id === id) ||
             catalogs.sports.find(s => s.id === id) ||
             catalogs.live.find(c => c.id === id);
    }).filter(Boolean);
    return [
      { id: 'hist-row', title: 'Vistos Recientemente', icon: 'history', type: 'movie', items: histItems }
    ];
  }

  return [];
}

function render() {
  updateHero();

  // Navigation sidebar active state
  document.querySelectorAll('nav [data-view]').forEach(b => {
    const bView = b.dataset.view;
    const isActive = bView === view || (bView === 'all' && view === 'live');
    b.classList.toggle('active', isActive);
  });

  const titleMap = {
    home: 'Descubrí en JUAMPI-TV',
    all: 'Canales de TV en Vivo',
    live: 'Canales de TV en Vivo',
    movies: 'Cine & Películas On Demand',
    series: 'Series de TV por Plataforma',
    sports: 'Deportes Argentina & Latam',
    favorites: 'Mi Lista de Contenido',
    history: 'Vistos Recientemente'
  };
  $('#section-title').innerHTML = (titleMap[view] || 'Catálogo') + '<span>.</span>';

  const rows = getRowsForView();
  const totalItems = rows.reduce((acc, r) => acc + (r.items ? r.items.length : 0), 0);
  $('#catalog-count').textContent = query ? `${totalItems} resultados encontrados` : `${totalItems.toLocaleString('es-AR')} títulos y señales`;

  const container = $('#carousels-container');
  if (!rows.length || totalItems === 0) {
    container.innerHTML = `
      <div class="empty">
        ${icon(view === 'favorites' ? 'bookmark' : 'search')}
        <h3>${view === 'favorites' ? 'Tu lista está vacía' : 'No encontramos contenido'}</h3>
        <p>${view === 'favorites' ? 'Guardá series, películas o canales con el ícono de marcador.' : 'Probá otra búsqueda o cambiá de sección.'}</p>
      </div>
    `;
  } else {
    container.innerHTML = rows.map(r => renderCarouselRow(r.id, r.title, r.icon, r.items, r.type)).join('');
  }

  // Bind image loads
  container.querySelectorAll('.poster-img').forEach(img => {
    img.onload = () => img.closest('.poster-art')?.classList.add('has-poster');
    img.onerror = () => {
      img.closest('.poster-art')?.classList.add('no-poster');
      img.remove();
    };
  });
  container.querySelectorAll('.logo-box img').forEach(img => {
    img.onload = () => img.parentElement?.classList.add('has-logo');
    img.onerror = () => img.remove();
  });

  refreshIcons();
}

let currentProvider = 'default';

function openSeriesModal(series) {
  const dialog = $('#series-dialog');
  if (!dialog) return;

  $('#series-modal-img').src = series.poster || '';
  $('#series-modal-platform').textContent = series.platform.toUpperCase();
  $('#series-modal-title').textContent = series.name;
  $('#series-modal-meta').textContent = `${series.totalEpisodes} episodios • ${series.genre}`;
  $('#series-modal-desc').textContent = `Disfrutá de todas las temporadas y episodios de ${series.name} en JUAMPI-TV sin cortes ni publicidad.`;

  let selectedServer = 'default';
  const serverSelect = $('#series-server-select');
  if (serverSelect) {
    serverSelect.value = 'default';
    serverSelect.onchange = (e) => {
      selectedServer = e.target.value;
    };
  }

  const playFirstBtn = $('#series-modal-play-first');
  playFirstBtn.onclick = () => {
    dialog.close();
    if (series.episodes[0]) {
      play({
        ...series.episodes[0],
        name: series.episodes[0].title,
        seriesName: series.name,
        tmdbId: series.tmdbId,
        imdbId: series.imdbId,
        type: 'series',
        group: series.name
      }, selectedServer);
    }
  };

  const grid = $('#series-episodes-grid');
  grid.innerHTML = series.episodes.map(ep => `
    <button class="episode-item" data-play-ep="${esc(ep.url)}" aria-label="Reproducir ${esc(ep.title)}">
      <span class="ep-num">T${String(ep.season).padStart(2,'0')} E${String(ep.episode).padStart(2,'0')}</span>
      <span class="ep-title">${esc(ep.title)}</span>
      <span class="ep-play-btn">${icon('play')}</span>
    </button>
  `).join('');

  grid.querySelectorAll('[data-play-ep]').forEach(btn => {
    btn.onclick = () => {
      dialog.close();
      const ep = series.episodes.find(e => e.url === btn.dataset.playEp);
      if (ep) {
        play({
          ...ep,
          name: ep.title,
          seriesName: series.name,
          tmdbId: series.tmdbId,
          imdbId: series.imdbId,
          type: 'series',
          group: series.name
        }, selectedServer);
      }
    };
  });

  refreshIcons();
  dialog.showModal();
}

$('#close-series').onclick = () => $('#series-dialog').close();

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
    video.hidden = false;
  }
  const embed = $('#player-embed');
  if (embed) {
    embed.src = 'about:blank';
    embed.hidden = true;
  }
  $('#player-failover')?.setAttribute('hidden', '');
}

async function play(channel, providerId = 'default') {
  if (!channel) return;
  if (channel.id) {
    history = [channel.id, ...history.filter(id => id !== channel.id)].slice(0, 50);
    save('jtv-history', history);
  }

  current = channel;
  currentProvider = providerId;
  stop();

  const titleName = channel.name || channel.title || 'Reproduciendo';
  $('#playing-name').textContent = titleName;
  $('#player-category').textContent = (channel.group || 'REPRODUCCIÓN').toUpperCase();
  $('#player-channel-meta').textContent = `${titleName} · JUAMPI-TV`;
  $('#external').href = channel.url || '#';
  $('#quality').innerHTML = '<option value="-1">Calidad automática</option>';
  $('#quality').disabled = true;
  $('#audio-tracks').hidden = true;
  $('#player-failover')?.setAttribute('hidden', '');
  if ($('#server-select')) $('#server-select').value = providerId;

  const isEmbedProvider = providerId !== 'default';
  const provider = STREAM_PROVIDERS.find(p => p.id === providerId) || STREAM_PROVIDERS[0];

  // Android TV native ExoPlayer for direct HLS/MP4 streams
  if (!isEmbedProvider && isTV && window.JuampiNative && !channel.external) {
    window.JuampiNative.postMessage(JSON.stringify({
      action: 'play',
      url: channel.url,
      name: titleName,
      group: channel.group || 'JUAMPI-TV',
      index: 1,
      total: 1
    }));
    return;
  }

  if (!$('#player').open) $('#player').showModal();

  const video = $('#video');
  const embed = $('#player-embed');

  if (isEmbedProvider) {
    video.hidden = true;
    embed.hidden = false;
    $('#retry').hidden = false;
    $('#pip').hidden = true;
    $('#fullscreen').hidden = false;
    $('#quality').hidden = true;
    $('#prev-channel').hidden = true;
    $('#next-channel').hidden = true;
    $('#play-pause').hidden = true;
    $('#aspect-ratio').hidden = true;
    $('#volume-slider').hidden = true;
    $('#mute-toggle').hidden = true;
    $('.video-wrap').hidden = false;
    $('#player-status').textContent = `Conectando con ${provider.name}…`;

    let mediaId = channel.imdbId || channel.tmdbId;
    const mediaType = (channel.type === 'series' || channel.season !== undefined) ? 'series' : 'movie';
    const queryTitle = channel.seriesName || channel.name || channel.title;

    if (!mediaId) {
      $('#player-status').textContent = `Buscando título en ${provider.name}…`;
      mediaId = await resolveMediaId(queryTitle, mediaType);
    }

    if (!mediaId) {
      $('#player-status').textContent = `No se encontró identificación universal para "${titleName}".`;
      $('#player-failover')?.removeAttribute('hidden');
      return;
    }

    let embedUrl = '';
    if (mediaType === 'series') {
      const s = channel.season || 1;
      const e = channel.episode || 1;
      embedUrl = provider.tvUrl(mediaId, s, e);
    } else {
      embedUrl = provider.movieUrl(mediaId);
    }

    embed.src = embedUrl;
    $('#player-status').textContent = `● Reproduciendo en ${provider.name} (${provider.tag})`;
    return;
  }

  // Provider 'default' (Direct HLS/MP4)
  embed.hidden = true;
  embed.src = 'about:blank';
  video.hidden = false;
  video.style.objectFit = currentAspect;
  video.volume = isMuted ? 0 : currentVolume;
  $('#volume-slider').hidden = false;
  $('#mute-toggle').hidden = false;

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
    $('#player-status').textContent = 'Este contenido se abre externamente. Elegí “Abrir fuente”.';
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
  $('#player-status').textContent = 'Conectando con el contenido…';

  timeout = setTimeout(() => {
    $('#player-status').textContent = 'La señal no responde. Podés reintentar o cambiar de servidor.';
    $('#player-failover')?.removeAttribute('hidden');
  }, 12000);

  const start = () => video.play().catch(() => {
    $('#player-status').textContent = 'Tocá Reproducir para iniciar el video.';
  });

  const run = playbackRun;
  let Hls;
  try {
    Hls = (await import('hls.js')).default;
  } catch {
    if (run === playbackRun) {
      clearTimeout(timeout);
      $('#player-status').textContent = 'No se pudo cargar el reproductor HLS.';
      $('#player-failover')?.removeAttribute('hidden');
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
        $('#player-status').textContent = 'No se pudo reproducir este stream directo.';
        $('#player-failover')?.removeAttribute('hidden');
        hls?.destroy();
        hls = null;
      }
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = channel.url;
    start();
  } else {
    clearTimeout(timeout);
    $('#player-status').textContent = 'Formato directo no admitido en este navegador.';
    $('#player-failover')?.removeAttribute('hidden');
  }
}

function getActivePlaylist() {
  if (current?.type === 'series') return [];
  if (view === 'movies') return catalogs.movies;
  if (view === 'sports') return catalogs.sports;
  return catalogs.live;
}

window.juampiNextChannel = () => {
  const list = getActivePlaylist();
  if (!list.length || !current) return false;
  const idx = list.findIndex(x => x.id === current.id || x.url === current.url);
  const next = list[(idx + 1) % list.length];
  if (next) { play(next, currentProvider); return true; }
  return false;
};

window.juampiPrevChannel = () => {
  const list = getActivePlaylist();
  if (!list.length || !current) return false;
  const idx = list.findIndex(x => x.id === current.id || x.url === current.url);
  const prev = list[(idx - 1 + list.length) % list.length];
  if (prev) { play(prev, currentProvider); return true; }
  return false;
};

// Aspect ratio toggle
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

// Player event listeners
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
  if (current && currentProvider === 'default') {
    clearTimeout(timeout);
    $('#player-status').textContent = 'Error al reproducir la señal directa.';
    $('#player-failover')?.removeAttribute('hidden');
  }
});

$('#play-pause').onclick = () => {
  const v = $('#video');
  if (v.paused) v.play(); else v.pause();
};

$('#prev-channel').onclick = () => window.juampiPrevChannel();
$('#next-channel').onclick = () => window.juampiNextChannel();
$('#aspect-ratio').onclick = () => window.juampiToggleAspect();

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

$('#server-select').onchange = e => {
  if (current) play(current, e.target.value);
};

$('#failover-videasy').onclick = () => {
  if (current) play(current, 'videasy');
};

$('#failover-vidsrc').onclick = () => {
  if (current) play(current, 'vidsrc');
};

$('#retry').onclick = () => current && play(current, currentProvider);

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
    const target = (currentProvider !== 'default' && $('#player-embed')) ? $('#player-embed') : $('.video-wrap');
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (target.requestFullscreen) await target.requestFullscreen();
    else if ($('#video').requestFullscreen) await $('#video').requestFullscreen();
  } catch {
    toast('No se pudo activar pantalla completa.');
  }
};

$('#close-player').onclick = () => $('#player').close();
$('#player').addEventListener('close', () => {
  stop();
  current = null;
  currentProvider = 'default';
  if (view === 'history') render();
});

// Hero button actions
$('#hero-play').onclick = () => {
  if (activeFeatured) {
    if (activeFeatured.seriesName) {
      const s = catalogs.series.find(x => x.name === activeFeatured.seriesName);
      if (s) openSeriesModal(s);
    } else {
      play(activeFeatured);
    }
  }
};

$('#hero-fav').onclick = () => {
  if (!activeFeatured) return;
  const key = activeFeatured.seriesName ? 'series:' + activeFeatured.seriesName : activeFeatured.id;
  favorites = favorites.includes(key) ? favorites.filter(x => x !== key) : [...favorites, key];
  save('jtv-favorites', favorites);
  toast(favorites.includes(key) ? 'Agregado a tu lista' : 'Eliminado de tu lista');
  render();
};

// Global click delegation
document.addEventListener('click', async e => {
  const b = e.target.closest('button');
  if (!b) return;

  // View navigation in sidebar
  if (b.dataset.view) {
    const v = b.dataset.view;
    view = (v === 'all' ? 'live' : v);
    query = '';
    $('#search').value = '';
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  // Series card click -> open episode picker
  if (b.dataset.seriesName) {
    const sName = b.dataset.seriesName;
    const series = catalogs.series.find(s => s.name === sName);
    if (series) {
      openSeriesModal(series);
      return;
    }
  }

  // Play button on movie or live channel
  if (b.dataset.play) {
    const id = b.dataset.play;
    const movie = catalogs.movies.find(m => m.id === id);
    if (movie) {
      play({ ...movie, type: 'movie' });
      return;
    }
    const sport = catalogs.sports.find(s => s.id === id);
    if (sport) {
      play({ ...sport, type: 'sports' });
      return;
    }
    const live = catalogs.live.find(c => c.id === id);
    if (live) {
      play({ ...live, type: 'live' });
      return;
    }
  }

  // Favorite toggle
  if (b.dataset.favorite) {
    const id = b.dataset.favorite;
    favorites = favorites.includes(id) ? favorites.filter(x => x !== id) : [...favorites, id];
    save('jtv-favorites', favorites);
    render();
    return;
  }

  // Import dialog open
  if (b.hasAttribute('data-import')) {
    $('#import-dialog').showModal();
    return;
  }
});

document.querySelectorAll('.brand,.wordmark[href]').forEach(a => a.onclick = e => {
  e.preventDefault();
  view = 'home';
  query = '';
  $('#search').value = '';
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

$('#search').oninput = e => {
  query = e.target.value;
  render();
};

// Import custom M3U
$('#close-import').onclick = () => $('#import-dialog').close();

async function importText(text) {
  const parsed = parseM3U(text);
  if (!parsed.length) throw new Error('La lista no contiene canales válidos.');
  imported = parsed;
  save('jtv-imported', imported);
  catalogs.live = parsed;
  view = 'live';
  query = '';
  $('#search').value = '';
  $('#import-dialog').close();
  render();
  toast(`${parsed.length} canales importados a Tu IPTV.`);
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
  $('#import-status').textContent = 'Importando lista…';
  try {
    const url = new URL($('#playlist-url').value);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('URL no válida');
    const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    await importText(await r.text());
    $('#import-status').textContent = '';
  } catch {
    $('#import-status').textContent = 'No se pudo descargar la lista. Si tiene restricciones CORS, descargá el archivo .m3u y cargalo arriba.';
  }
};

$('#reset-source').onclick = async () => {
  imported = [];
  save('jtv-imported', []);
  $('#import-dialog').close();
  await loadAllCatalogs();
  render();
  toast('Restablecido al catálogo oficial.');
};

// Keyboard navigation
document.addEventListener('keydown', e => {
  if ($('#player').open && !['INPUT', 'SELECT'].includes(e.target.tagName)) {
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      $('#play-pause').click();
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

// Load all catalogs asynchronously
async function loadAllCatalogs() {
  const tasks = [
    // Sports
    fetch('/sports.m3u8').then(r => r.text()).then(t => { catalogs.sports = parseM3U(t); }).catch(() => {}),
    // Movies
    fetch('/movies.m3u8').then(r => r.text()).then(t => { catalogs.movies = parseM3U(t); }).catch(() => {}),
    // Series
    fetch('/series-catalog.json').then(r => r.json()).then(data => { catalogs.series = data; }).catch(() => {}),
    // Live
    fetch('/catalog.m3u8').then(r => r.text()).then(t => { catalogs.live = parseM3U(t); }).catch(() => {})
  ];

  await Promise.all(tasks);
  if (imported.length) {
    catalogs.live = imported;
  }
  render();
}

// Initialization
refreshIcons();
loadAllCatalogs();

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
  if (query) {
    query = '';
    $('#search').value = '';
    render();
    document.querySelector('nav .active')?.focus();
    return true;
  }
  if (view !== 'home' || window.scrollY > 30) {
    view = 'home';
    render();
    window.scrollTo(0, 0);
    $('#hero-play')?.focus({ preventScroll: true });
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
