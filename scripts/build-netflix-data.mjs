import { readFileSync, writeFileSync } from 'node:fs';
import { POSTER_OVERRIDES } from './poster-overrides.mjs';
import { parseM3U } from '../src/playlist.js';

async function fetchWithTimeout(url, ms = 20000) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(ms),
      headers: { 'User-Agent': 'Mozilla/5.0 JUAMPI-TV/0.5.0' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    console.warn(`Error al descargar ${url}:`, err.message);
    return '';
  }
}

async function searchCinemeta(title, type = 'movie') {
  const clean = title.toLowerCase().replace(/[#🎥\[\]]/g, '').replace(/\s*\(\d+\).*/, '').trim();
  if (POSTER_OVERRIDES[clean]) return POSTER_OVERRIDES[clean];

  for (const [key, poster] of Object.entries(POSTER_OVERRIDES)) {
    if (clean.includes(key) || key.includes(clean)) return poster;
  }

  try {
    const q = encodeURIComponent(clean);
    const endpoint = type === 'series'
      ? `https://v3-cinemeta.strem.io/catalog/series/top/search=${q}.json`
      : `https://v3-cinemeta.strem.io/catalog/movie/top/search=${q}.json`;
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(4000) });
    const data = await res.json();
    return data.metas?.[0]?.poster || '';
  } catch {
    return '';
  }
}

function detectMovieYearGroup(name) {
  const m = name.match(/\((19\d\d|20\d\d)\)/);
  if (m) {
    const y = parseInt(m[1]);
    if (y >= 2024) return 'Estrenos 2024 - 2025';
    if (y >= 2020) return 'Aclamadas 2020 - 2023';
    if (y >= 2010) return 'Éxitos 2010 - 2019';
    return 'Cine Clásico';
  }
  if (/202[4-6]/.test(name)) return 'Estrenos 2024 - 2025';
  if (/202[0-3]/.test(name)) return 'Aclamadas 2020 - 2023';
  if (/201\d/.test(name)) return 'Éxitos 2010 - 2019';
  if (/19[5-9]\d/.test(name)) return 'Cine Clásico';
  return 'Películas Populares';
}

function detectMovieGenre(name) {
  const n = name.toLowerCase();
  if (/animaci[oó]n|infantil|niño|kids|disney|pixar|scooby|barbie|d[aá]lmatas|lego|panda|shrek|toy story|minions|mario/i.test(n)) return 'Animación & Infantil';
  if (/terror|horror|miedo|anabelle|conjuro|saw|siniestro|zombie|muerto|demonio|exorcismo|pesadilla|fantasma/i.test(n)) return 'Terror & Suspenso';
  if (/acci[oó]n|action|007|misi[oó]n|batman|spider|avengers|vengadores|r[aá]pido|fast|furia|guerra|combate|soldado|fbi|polic/i.test(n)) return 'Acción & Aventura';
  if (/comedia|comedy|locura|divertido|broma|amigos|boda|fiesta/i.test(n)) return 'Comedia';
  if (/drama|romance|amor|pasi[oó]n|coraz[oó]n|historia|vida|secreto/i.test(n)) return 'Drama & Romance';
  if (/ficci[oó]n|sci-fi|alien|espacio|universo|star|galaxia|futuro|cyber|matrix|robot|terminator/i.test(n)) return 'Ciencia Ficción';
  return 'Películas Destacadas';
}

function detectSeriesPlatform(name) {
  const n = name.toLowerCase();
  if (/dark|stranger|por trece|13 reasons|altered carbon|black lightning|sabrina|hill house|perdidos en el espacio|luis miguel|maniac|desencanto|\(des\)encanto|good girls|narcos|ozark|squid|calamar|merlina|wednesday|casa de papel|money heist|witcher|peaky|cobra kai|breaking bad|better call saul|umbrella academy|the crown|sex education|sense8|the oa|scream|el chapo|kingdom|el reemplazante|end of the f|r[aá]pidos y furiosos.*esp[ií]as/i.test(n)) {
    return 'Netflix';
  }
  if (/trono|tronos|game of thrones|soprano|band of brothers|arrow|gotham|rick.*morty|chernobyl|last of us|house of the dragon|succession|euphoria|the wire|flash|supergirl|big bang|teoria del big bang|westworld|ballers|true detective|avenue 5|true blood|crisis on infinite/i.test(n)) {
    return 'HBO Max';
  }
  if (/malcolm|padre de familia|family guy|mandalorian|loki|wandavision|bones|iron fist|defenders|daredevil|simpson|futurama|grey|bear|luke cage|punisher|c[oó]mo conoc[ií]|cosmos/i.test(n)) {
    return 'Disney+';
  }
  if (/the boys|boys|invincible|fallout|walking dead|anillos de poder|reacher|jack ryan|fleabag|mr\. robot|robot|viking|dr\. house|house|good doctor|12 monkeys/i.test(n)) {
    return 'Amazon Prime Video';
  }
  if (/see|ted lasso|severance|morning show|silo|foundation/i.test(n)) {
    return 'Apple TV+';
  }
  if (/titan|titanes|shingeki|dragon ball|one piece|demon slayer|naruto|death note/i.test(n)) {
    return 'Anime & Crunchyroll';
  }
  return 'Otras Producciones';
}

function detectSeriesGenre(name) {
  const n = name.toLowerCase();
  if (/titan|dragon ball|rick.*morty|padre de familia|family guy|desencanto|animaci[oó]n/i.test(n)) return 'Animación & Anime';
  if (/malcolm|padre de familia|rick.*morty|good girls|comedia/i.test(n)) return 'Comedia';
  if (/dark|hill house|maldici[oó]n|niebla|walking dead|terror/i.test(n)) return 'Terror & Misterio';
  if (/trono|arrow|gotham|iron fist|defenders|the boys|mandalorian|altered carbon|acci[oó]n/i.test(n)) return 'Acción & Aventura';
  if (/breaking bad|soprano|narcos|bones|crimen/i.test(n)) return 'Crimen & Drama';
  return 'Drama & Series';
}

async function main() {
  console.log('--- Construyendo catálogo enriquecido estilo Netflix ---');

  // 1. SERIES CATALOG
  console.log('1. Descargando series completas y organizando por plataforma...');
  const seriesRaw = await fetchWithTimeout('https://raw.githubusercontent.com/kyp126/IPTV/master/SERIES.m3u');
  const rickRaw = await fetchWithTimeout('https://raw.githubusercontent.com/rb1223/masterapp/main/serierick.m3u');
  const combinedSeries = [seriesRaw, rickRaw].join('\n');

  const seriesLines = combinedSeries.split('\n');
  const seriesMap = new Map();
  let currentExtinf = '';

  for (const line of seriesLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#EXTINF:')) {
      currentExtinf = trimmed;
    } else if (trimmed.startsWith('http') && currentExtinf) {
      const titleMatch = currentExtinf.match(/#EXTINF:[^,]*,(.*)/);
      const rawTitle = titleMatch ? titleMatch[1].trim() : '';

      // Match series base name: e.g. "Por trece razones S01 E01" -> "Por trece razones"
      const seriesRegex = /^(.*?)(?:\s+(?:S|T)(\d+)\s*(?:E|Cap|Ep)?(\d+)|$)/i;
      const m = rawTitle.match(seriesRegex);
      const baseName = (m && m[1] ? m[1].trim() : rawTitle).replace(/[#🎥\[\]]/g, '').trim();
      const season = m && m[2] ? parseInt(m[2]) : 1;
      const episode = m && m[3] ? parseInt(m[3]) : 1;

      if (baseName && baseName.length > 2) {
        if (!seriesMap.has(baseName)) {
          seriesMap.set(baseName, {
            name: baseName,
            platform: detectSeriesPlatform(baseName),
            genre: detectSeriesGenre(baseName),
            episodes: []
          });
        }
        seriesMap.get(baseName).episodes.push({
          title: rawTitle,
          season,
          episode,
          url: trimmed
        });
      }
      currentExtinf = '';
    }
  }

  console.log(`Encontradas ${seriesMap.size} series completas.`);

  // Enrich series with posters
  const seriesList = [];
  let seriesM3U = '#EXTM3U\n';

  for (const [name, data] of seriesMap.entries()) {
    const poster = POSTER_OVERRIDES[name.toLowerCase()] || await searchCinemeta(name, 'series');
    data.poster = poster;
    // Sort episodes by season then episode
    data.episodes.sort((a, b) => (a.season - b.season) || (a.episode - b.episode));
    data.totalEpisodes = data.episodes.length;
    seriesList.push(data);

    // Also output the first episode or all episodes into series.m3u8 for compatibility
    for (const ep of data.episodes) {
      seriesM3U += `#EXTINF:-1 tvg-name="${name} S${String(ep.season).padStart(2,'0')}E${String(ep.episode).padStart(2,'0')}" tvg-logo="${poster}" group-title="${data.platform}",${ep.title}\n${ep.url}\n`;
    }
  }

  writeFileSync(new URL('../public/series.m3u8', import.meta.url), seriesM3U, 'utf8');
  writeFileSync(new URL('../public/series-catalog.json', import.meta.url), JSON.stringify(seriesList, null, 2), 'utf8');
  console.log(`Catálogo de series guardado con ${seriesList.length} series estructuradas.`);

  // 2. MOVIES CATALOG
  console.log('2. Procesando catálogo de películas y asignando años/géneros...');
  const existingMoviesText = readFileSync(new URL('../public/movies.m3u8', import.meta.url), 'utf8');
  const parsedMovies = parseM3U(existingMoviesText);

  let movieM3U = '#EXTM3U\n';
  let enrichedCount = 0;

  // Process top movies to ensure they have posters
  const enrichedMovies = [];
  for (let i = 0; i < parsedMovies.length; i++) {
    const c = parsedMovies[i];
    const cleanName = c.name.replace(/[#🎥\[\]]/g, '').trim();
    const yearGroup = detectMovieYearGroup(cleanName);
    const genre = detectMovieGenre(cleanName);

    let logo = c.logo;
    const cleanLower = cleanName.toLowerCase().replace(/\s*\(\d+\).*/, '').trim();

    if (!logo || logo === '') {
      if (POSTER_OVERRIDES[cleanLower]) {
        logo = POSTER_OVERRIDES[cleanLower];
        enrichedCount++;
      } else if (i < 120 || yearGroup === 'Estrenos 2024 - 2025') {
        // Query Cinemeta for top releases
        logo = await searchCinemeta(cleanName, 'movie');
        if (logo) enrichedCount++;
      }
    }

    const groupTitle = `${yearGroup} • ${genre}`;
    movieM3U += `#EXTINF:-1 tvg-name="${cleanName.replace(/"/g, '')}" tvg-logo="${logo || ''}" group-title="${groupTitle}",${cleanName}\n${c.url}\n`;

    enrichedMovies.push({
      id: c.id,
      name: cleanName,
      logo: logo || '',
      url: c.url,
      yearGroup,
      genre
    });
  }

  writeFileSync(new URL('../public/movies.m3u8', import.meta.url), movieM3U, 'utf8');
  console.log(`Catálogo de películas actualizado con ${parsedMovies.length} películas y ${enrichedCount} carátulas enriquecidas.`);
  console.log('--- Catálogos preparados con éxito ---');
}

main().catch(console.error);
