// Universal Stream Providers (Streambert architecture)
export const STREAM_PROVIDERS = [
  {
    id: 'default',
    name: 'Servidor 1 (HLS Directo)',
    tag: 'Rápido',
    isEmbed: false
  },
  {
    id: 'videasy',
    name: 'Servidor 2 (Videasy HD)',
    tag: 'Multilenguaje',
    isEmbed: true,
    movieUrl: (id) => `https://player.videasy.to/movie/${id}?overlay=true`,
    tvUrl: (id, season, ep) => `https://player.videasy.to/tv/${id}/${season}/${ep}?overlay=true`
  },
  {
    id: 'vidsrc',
    name: 'Servidor 3 (VidSrc Mirror)',
    tag: 'Espejo 1',
    isEmbed: true,
    movieUrl: (id) => `https://vsembed.su/embed/movie/${id}`,
    tvUrl: (id, season, ep) => `https://vsembed.su/embed/tv/${id}/${season}/${ep}`
  },
  {
    id: 'vidking',
    name: 'Servidor 4 (Vidking Universal)',
    tag: 'Espejo 2',
    isEmbed: true,
    movieUrl: (id) => `https://www.vidking.net/embed/movie/${id}?autoPlay=true`,
    tvUrl: (id, season, ep) => `https://www.vidking.net/embed/tv/${id}/${season}/${ep}?autoPlay=true`
  }
];

export const ID_OVERRIDES = {
  // Películas
  'depredador: tierras salvajes': { tmdbId: '1249289', imdbId: 'tt31252150' },
  'frankenstein': { tmdbId: '1064028', imdbId: 'tt13411444' },
  'tron: ares': { tmdbId: '1054865', imdbId: 'tt6604188' },
  'gladiador ii': { tmdbId: '933260', imdbId: 'tt9218128' },
  'gladiator ii': { tmdbId: '933260', imdbId: 'tt9218128' },
  'deadpool & wolverine': { tmdbId: '533535', imdbId: 'tt6263850' },
  'dune: parte dos': { tmdbId: '693134', imdbId: 'tt15239678' },
  'intensamente 2': { tmdbId: '1022789', imdbId: 'tt22022452' },
  'inside out 2': { tmdbId: '1022789', imdbId: 'tt22022452' },
  'oppenheimer': { tmdbId: '872585', imdbId: 'tt15398776' },
  'barbie': { tmdbId: '346698', imdbId: 'tt1517268' },
  'avatar: el sentido del agua': { tmdbId: '76600', imdbId: 'tt1630029' },
  'spider-man: cruzando el multiverso': { tmdbId: '569094', imdbId: 'tt9362722' },
  'super mario bros': { tmdbId: '502356', imdbId: 'tt6718170' },
  'john wick 4': { tmdbId: '603692', imdbId: 'tt10366206' },
  'top gun: maverick': { tmdbId: '361743', imdbId: 'tt1745960' },
  'the batman': { tmdbId: '414906', imdbId: 'tt1877830' },
  'alien: romulus': { tmdbId: '945961', imdbId: 'tt18412256' },
  'furiosa: a mad max saga': { tmdbId: '786892', imdbId: 'tt12037194' },
  'beetlejuice beetlejuice': { tmdbId: '917496', imdbId: 'tt2049403' },
  'twisters': { tmdbId: '718821', imdbId: 'tt12584954' },
  'godzilla x kong: the new empire': { tmdbId: '823464', imdbId: 'tt14539740' },
  'kung fu panda 4': { tmdbId: '1011985', imdbId: 'tt21692408' },
  'culpa nuestra': { tmdbId: '1156593', imdbId: 'tt28532431' },
  'la maquina': { tmdbId: '1311550', imdbId: 'tt33096645' },
  'la larga marcha': { tmdbId: '556108', imdbId: 'tt8540710' },

  // Series
  'stranger things': { tmdbId: '66732', imdbId: 'tt4574334' },
  'breaking bad': { tmdbId: '1396', imdbId: 'tt0903747' },
  'dark': { tmdbId: '70523', imdbId: 'tt5753856' },
  'juego de tronos': { tmdbId: '1399', imdbId: 'tt0944947' },
  'game of thrones': { tmdbId: '1399', imdbId: 'tt0944947' },
  'the boys': { tmdbId: '76479', imdbId: 'tt1190634' },
  'the mandalorian': { tmdbId: '82856', imdbId: 'tt8111088' },
  'los soprano': { tmdbId: '1398', imdbId: 'tt0141842' },
  'the sopranos': { tmdbId: '1398', imdbId: 'tt0141842' },
  'por trece razones': { tmdbId: '66788', imdbId: 'tt1837492' },
  '13 reasons why': { tmdbId: '66788', imdbId: 'tt1837492' },
  'malcolm el de en medio': { tmdbId: '262', imdbId: 'tt0212671' },
  'malcolm in the middle': { tmdbId: '262', imdbId: 'tt0212671' },
  'severance': { tmdbId: '95557', imdbId: 'tt11280740' },
  'peaky blinders': { tmdbId: '60574', imdbId: 'tt2442560' },
  'la casa de papel': { tmdbId: '71446', imdbId: 'tt6468322' },
  'money heist': { tmdbId: '71446', imdbId: 'tt6468322' },
  'the last of us': { tmdbId: '100088', imdbId: 'tt3581920' },
  'house of the dragon': { tmdbId: '94997', imdbId: 'tt11198330' },
  'fallout': { tmdbId: '106379', imdbId: 'tt12637874' },
  'rick and morty': { tmdbId: '60625', imdbId: 'tt2861424' },
  'padre de familia': { tmdbId: '1434', imdbId: 'tt0182576' },
  'family guy': { tmdbId: '1434', imdbId: 'tt0182576' },
  'ataque de los titanes (shingeki no kyojin)': { tmdbId: '1429', imdbId: 'tt2560140' },
  'dragon ball gt': { tmdbId: '12697', imdbId: 'tt0142242' },
  'arrow': { tmdbId: '1412', imdbId: 'tt2193021' },
  'gotham': { tmdbId: '60708', imdbId: 'tt3749900' },
  'better call saul': { tmdbId: '60059', imdbId: 'tt3032476' },
  'the crown': { tmdbId: '65494', imdbId: 'tt4786824' },
  'chernobyl': { tmdbId: '87108', imdbId: 'tt7366338' },
  'succession': { tmdbId: '76331', imdbId: 'tt7660850' },
  'black mirror': { tmdbId: '42009', imdbId: 'tt2085059' },
  'los simpson': { tmdbId: '456', imdbId: 'tt0096697' },
  'futurama': { tmdbId: '615', imdbId: 'tt0149460' },
  'south park': { tmdbId: '2190', imdbId: 'tt0121955' },
  'friends': { tmdbId: '1668', imdbId: 'tt0108778' },
  'vikings': { tmdbId: '44217', imdbId: 'tt2306299' },
  'the walking dead': { tmdbId: '1402', imdbId: 'tt1520211' },
  'dexter': { tmdbId: '1405', imdbId: 'tt0773262' },
  'prison break': { tmdbId: '2288', imdbId: 'tt0455275' },
  'arcane': { tmdbId: '94605', imdbId: 'tt11126994' },
  'death note': { tmdbId: '13916', imdbId: 'tt0877057' },
  'demon slayer': { tmdbId: '85937', imdbId: 'tt9335498' },
  'jujutsu kaisen': { tmdbId: '95479', imdbId: 'tt12343534' },
  'one piece': { tmdbId: '37854', imdbId: 'tt0388629' },
  'naruto': { tmdbId: '46260', imdbId: 'tt0409591' }
};

const idCache = new Map();

export async function resolveMediaId(name, type = 'movie') {
  if (!name) return null;
  const clean = name.toLowerCase().replace(/[#🎥\[\]]/g, '').replace(/\s*\(\d+\).*/, '').trim();

  if (ID_OVERRIDES[clean]) {
    return ID_OVERRIDES[clean].imdbId || ID_OVERRIDES[clean].tmdbId;
  }
  for (const [key, val] of Object.entries(ID_OVERRIDES)) {
    if (clean.includes(key) || key.includes(clean)) {
      return val.imdbId || val.tmdbId;
    }
  }

  if (idCache.has(clean)) return idCache.get(clean);

  try {
    const q = encodeURIComponent(clean);
    const endpoint = type === 'series'
      ? `https://v3-cinemeta.strem.io/catalog/series/top/search=${q}.json`
      : `https://v3-cinemeta.strem.io/catalog/movie/top/search=${q}.json`;
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(3500) });
    if (!res.ok) return null;
    const data = await res.json();
    const id = data.metas?.[0]?.imdb_id || null;
    if (id) idCache.set(clean, id);
    return id;
  } catch {
    return null;
  }
}
