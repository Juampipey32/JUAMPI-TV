export function parseM3U(text) {
  if (!text.replace(/^\uFEFF/, '').trimStart().startsWith('#EXTM3U')) throw new Error('El archivo no es una lista M3U válida.');
  const channels = []; const seen = new Set(); let info = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('#EXTINF:')) {
      const attrs = Object.fromEntries([...line.matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
      info = {
        name: attrs['tvg-name'] || line.slice(line.lastIndexOf(',') + 1) || 'Canal sin nombre',
        logo: attrs['tvg-logo'] || '',
        group: attrs['group-title'] || 'Mi lista',
        country: attrs['tvg-country'] || '',
        guideId: attrs['tvg-id'] || '',
        tmdbId: attrs['tmdb-id'] || '',
        imdbId: attrs['imdb-id'] || ''
      };
    } else if (line && !line.startsWith('#') && info) {
      try {
        const u = new URL(line);
        if (['https:', 'http:'].includes(u.protocol) && !seen.has(u.href)) {
          seen.add(u.href);
          channels.push({
            ...info,
            id: u.href,
            url: u.href,
            external: /(^|\.)(youtube\.com|youtu\.be|twitch\.tv|dailymotion\.com)$/.test(u.hostname)
          });
        }
      } catch {}
      info = null;
    }
  }
  return channels;
}
