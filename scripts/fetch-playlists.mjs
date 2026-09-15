import { writeFileSync } from 'node:fs';
import { parseM3U } from '../src/playlist.js';

async function fetchM3U(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    console.warn(`Error al descargar ${url}:`, err.message);
    return '';
  }
}

async function main() {
  console.log('Descargando listas de películas...');
  const [iptvMovies, freeTvMovies] = await Promise.all([
    fetchM3U('https://iptv-org.github.io/iptv/categories/movies.m3u'),
    fetchM3U('https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_zz_movies.m3u8')
  ]);

  const combinedMovies = (freeTvMovies + '\n' + iptvMovies).trim();
  const parsedMovies = parseM3U(combinedMovies);
  console.log(`Películas obtenidas: ${parsedMovies.length} canales`);

  let movieM3U = '#EXTM3U\n';
  for (const c of parsedMovies) {
    movieM3U += `#EXTINF:-1 tvg-name="${c.name.replace(/"/g, '')}" tvg-logo="${c.logo}" tvg-country="${c.country || ''}" group-title="${c.group || 'Películas'}",${c.name}\n${c.url}\n`;
  }
  writeFileSync(new URL('../public/movies.m3u8', import.meta.url), movieM3U, 'utf8');

  console.log('Descargando listas de series...');
  const iptvSeries = await fetchM3U('https://iptv-org.github.io/iptv/categories/series.m3u');
  const parsedSeries = parseM3U(iptvSeries);
  console.log(`Series obtenidas: ${parsedSeries.length} canales`);

  let seriesM3U = '#EXTM3U\n';
  for (const c of parsedSeries) {
    seriesM3U += `#EXTINF:-1 tvg-name="${c.name.replace(/"/g, '')}" tvg-logo="${c.logo}" tvg-country="${c.country || ''}" group-title="${c.group || 'Series'}",${c.name}\n${c.url}\n`;
  }
  writeFileSync(new URL('../public/series.m3u8', import.meta.url), seriesM3U, 'utf8');

  console.log('Listas guardadas en public/movies.m3u8 y public/series.m3u8.');
}

main().catch(console.error);
