import { writeFileSync } from 'node:fs';
import { parseM3U } from '../src/playlist.js';

async function fetchM3U(url) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(30000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) JUAMPI-TV/0.5.0'
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    console.warn(`Error al descargar ${url}:`, err.message);
    return '';
  }
}

function detectMovieCategory(name) {
  const n = name.toLowerCase();
  if (/202[4-6]/.test(n)) return 'Estrenos Recientes';
  if (/animaci[oó]n|infantil|niño|kids|disney|pixar|scooby|barbie|d[aá]lmatas|lego|panda|shrek|toy story|minions|mario/i.test(n)) return 'Animación & Infantil';
  if (/terror|horror|miedo|anabelle|conjuro|saw|siniestro|zombie|muerto|demonio|exorcismo|pesadilla|fantasma/i.test(n)) return 'Terror & Suspenso';
  if (/acci[oó]n|action|007|misi[oó]n|batman|spider|avengers|vengadores|r[aá]pido|fast|furia|guerra|combate|soldado|fbi|polic/i.test(n)) return 'Acción & Aventura';
  if (/comedia|comedy|locura|divertido|broma|amigos|boda|fiesta/i.test(n)) return 'Comedia';
  if (/drama|romance|amor|pasi[oó]n|coraz[oó]n|historia|vida|secreto/i.test(n)) return 'Drama & Romance';
  if (/ficci[oó]n|sci-fi|alien|espacio|universo|star|galaxia|futuro|cyber|matrix|robot|terminator/i.test(n)) return 'Ciencia Ficción';
  if (/19[5-9]\d/.test(n)) return 'Cine Clásico';
  return 'Películas Destacadas';
}

async function main() {
  console.log('1. Descargando catálogos VOD de Películas...');
  const [vodPelis2, vodPelis1, vox2025, vox90] = await Promise.all([
    fetchM3U('https://raw.githubusercontent.com/kyp126/IPTV/master/PELICULAS2.m3u'),
    fetchM3U('https://raw.githubusercontent.com/kyp126/IPTV/master/PELICULAS.m3u'),
    fetchM3U('https://raw.githubusercontent.com/rb1223/masterapp/main/vox12pls2025.m3u'),
    fetchM3U('https://raw.githubusercontent.com/rb1223/masterapp/main/vox12pls90.m3u')
  ]);

  const rawMovies = [vox2025, vodPelis2, vodPelis1, vox90].join('\n');
  const parsedMovies = parseM3U(rawMovies.startsWith('#EXTM3U') ? rawMovies : '#EXTM3U\n' + rawMovies);
  console.log(`Películas totales parseadas: ${parsedMovies.length}`);

  let movieM3U = '#EXTM3U\n';
  const seenMovies = new Set();
  for (const c of parsedMovies) {
    const cleanName = c.name.replace(/[#🎥\[\]]/g, '').trim();
    if (!cleanName || cleanName.length < 2 || seenMovies.has(cleanName.toLowerCase())) continue;
    seenMovies.add(cleanName.toLowerCase());

    const group = (c.group && !c.group.toLowerCase().includes('mi lista') && !c.group.toLowerCase().includes('default'))
      ? c.group
      : detectMovieCategory(cleanName);

    movieM3U += `#EXTINF:-1 tvg-name="${cleanName.replace(/"/g, '')}" tvg-logo="${c.logo}" group-title="${group}",${cleanName}\n${c.url}\n`;
  }
  writeFileSync(new URL('../public/movies.m3u8', import.meta.url), movieM3U, 'utf8');
  console.log(`Catálogo de películas generado con ${seenMovies.size} películas únicas.`);

  console.log('2. Descargando catálogos VOD de Series...');
  const [vodSeries2, vodSeries1, seriesRick] = await Promise.all([
    fetchM3U('https://raw.githubusercontent.com/kyp126/IPTV/master/SERIES2.m3u'),
    fetchM3U('https://raw.githubusercontent.com/kyp126/IPTV/master/SERIES.m3u'),
    fetchM3U('https://raw.githubusercontent.com/rb1223/masterapp/main/serierick.m3u')
  ]);

  const rawSeries = [seriesRick, vodSeries2, vodSeries1].join('\n');
  const parsedSeries = parseM3U(rawSeries.startsWith('#EXTM3U') ? rawSeries : '#EXTM3U\n' + rawSeries);
  console.log(`Episodios de series totales parseados: ${parsedSeries.length}`);

  let seriesM3U = '#EXTM3U\n';
  const seenSeries = new Set();
  for (const c of parsedSeries) {
    const cleanName = c.name.replace(/[#🎥\[\]]/g, '').trim();
    if (!cleanName || cleanName.length < 2 || seenSeries.has(c.url)) continue;
    seenSeries.add(c.url);

    let group = 'Series Populares';
    if (/rick.*morty/i.test(cleanName)) group = 'Animación & Comedia';
    else if (/ragnarok/i.test(cleanName)) group = 'Acción & Mitología';
    else if (/trece razones|13 reasons/i.test(cleanName)) group = 'Drama Juvenil';
    else if (/stranger/i.test(cleanName)) group = 'Ciencia Ficción';

    seriesM3U += `#EXTINF:-1 tvg-name="${cleanName.replace(/"/g, '')}" tvg-logo="${c.logo}" group-title="${group}",${cleanName}\n${c.url}\n`;
  }
  writeFileSync(new URL('../public/series.m3u8', import.meta.url), seriesM3U, 'utf8');
  console.log(`Catálogo de series generado con ${seenSeries.size} episodios.`);

  console.log('3. Creando catálogo dedicado de Deportes de Argentina & Latam...');
  const sportsList = [
    // Señales deportivas argentinas
    { name: 'TyC Sports (Señal en vivo)', url: 'http://45.181.87.106/TYCSPORTSHD/index.m3u8', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/TyC_Sports_logo.svg/512px-TyC_Sports_logo.svg.png', group: 'Deportes Argentina', country: 'AR' },
    { name: 'DeporTV HD', url: 'https://5fb24b460df87.streamlock.net/live-cont.ar/deportv/playlist.m3u8', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/DeporTV_%28Argentina%29_logo_2016.png/512px-DeporTV_%28Argentina%29_logo_2016.png', group: 'Deportes Argentina', country: 'AR' },
    { name: 'Televisión Pública Deportes', url: 'https://www.youtube.com/user/TVPublicaArgentina/live', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Televisi%C3%B3n_P%C3%BAblica_Argentina_%28logo%29.png/512px-Televisi%C3%B3n_P%C3%BAblica_Argentina_%28logo%29.png', group: 'Deportes Argentina', country: 'AR' },
    { name: 'Canal Showsport (Córdoba)', url: 'https://unlimited1-us.dps.live/showsport/showsport.smil/playlist.m3u8', logo: 'https://i.imgur.com/0L9tW3Z.png', group: 'Deportes Argentina', country: 'AR' },
    { name: 'CnAr Deportes', url: 'https://stmv1.cnarlatam.com/cnardeportes2/cnardeportes2/playlist.m3u8', logo: 'https://i.imgur.com/07ki2df.png', group: 'Deportes Argentina', country: 'AR' },

    // Cadenas internacionales y latinoamericanas
    { name: 'DSports Panregional', url: 'http://138.121.113.175:8000/play/a0cj/index.m3u8', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/DirecTV_Sports_Latin_America_%282018%29.png/512px-DirecTV_Sports_Latin_America_%282018%29.png', group: 'Fútbol & Panregional', country: 'US' },
    { name: 'DSports 2', url: 'http://138.121.113.175:8000/play/a0ca/index.m3u8', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/DIRECTV_Sports_2_Latin_America_%282018%29.svg/512px-DIRECTV_Sports_2_Latin_America_%282018%29.svg.png', group: 'Fútbol & Panregional', country: 'US' },
    { name: 'Fox Sports en Español', url: 'https://apollo.production-public.tubi.io/live/fox-sports-esp', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/FOX_Deportes_logo.png/512px-FOX_Deportes_logo.png', group: 'Cadenas Deportivas', country: 'US' },
    { name: 'ESPN Deportes', url: 'https://apollo.production-public.tubi.io/live/espn-deportes', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/ESPN_Deportes.svg/512px-ESPN_Deportes.svg.png', group: 'Cadenas Deportivas', country: 'US' },
    { name: 'Claro Sports México & Latam', url: 'https://live-clarosports.akamaized.net/live/clarosports/index.m3u8', logo: 'https://i.imgur.com/n0kd17r.png', group: 'Polideportivo', country: 'MX' },
    { name: 'Azteca Deportes Network', url: 'http://181.119.66.28:8081/AZTECA-DEPORTES-HD/index.m3u8', logo: 'https://match-images.icdb.tv/5913207f2494844101287828e87625eb.jpg', group: 'Polideportivo', country: 'MX' },
    { name: 'FIFA+ Hispanic America', url: 'https://d3qs3d2rkhfqrt.cloudfront.net/out/v1/fifa-latam/index.m3u8', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/FIFA%2B_(2025).svg/512px-FIFA%2B_(2025).svg.png', group: 'Fútbol Internacional', country: 'INT' },
    { name: 'DAZN Combat Rakuten', url: 'https://dazn-combat-rakuten.amagi.tv/hls/amagi_hls_data_rakutenAA-dazn-combat-rakuten/CDN/master.m3u8', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/DAZN_logo.svg/512px-DAZN_logo.svg.png', group: 'Combate & Boxeo', country: 'INT' },
    { name: 'Red Bull TV Deportes Extremos', url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8', logo: 'https://resources.redbull.com/logos/redbullcom/v3/redbullcom-logo.svg', group: 'Deportes Extremos', country: 'INT' },
    { name: 'Motorvision TV', url: 'https://motorvision-samsungau.amagi.tv/playlist.m3u8', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Motorvision_TV_Logo.png/512px-Motorvision_TV_Logo.png', group: 'Automovilismo', country: 'INT' }
  ];

  let sportsM3U = '#EXTM3U\n';
  for (const s of sportsList) {
    sportsM3U += `#EXTINF:-1 tvg-name="${s.name}" tvg-logo="${s.logo}" tvg-country="${s.country}" group-title="${s.group}",${s.name}\n${s.url}\n`;
  }
  writeFileSync(new URL('../public/sports.m3u8', import.meta.url), sportsM3U, 'utf8');
  console.log(`Catálogo de deportes generado con ${sportsList.length} canales.`);

  console.log('Proceso completado exitosamente.');
}

main().catch(console.error);
