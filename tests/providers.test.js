import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STREAM_PROVIDERS, resolveMediaId } from '../src/providers.js';
import { parseM3U } from '../src/playlist.js';

test('proveedores universales de Streambert están registrados y tienen URLs válidas', () => {
  assert.equal(STREAM_PROVIDERS.length, 4);
  const ids = STREAM_PROVIDERS.map(p => p.id);
  assert.deepEqual(ids, ['default', 'videasy', 'vidsrc', 'vidking']);

  const videasy = STREAM_PROVIDERS.find(p => p.id === 'videasy');
  assert.equal(videasy.movieUrl('tt12345'), 'https://player.videasy.to/movie/tt12345?overlay=true');
  assert.equal(videasy.tvUrl('tt12345', 1, 2), 'https://player.videasy.to/tv/tt12345/1/2?overlay=true');

  const vidsrc = STREAM_PROVIDERS.find(p => p.id === 'vidsrc');
  assert.equal(vidsrc.movieUrl('tt12345'), 'https://vsembed.su/embed/movie/tt12345');
  assert.equal(vidsrc.tvUrl('tt12345', 2, 5), 'https://vsembed.su/embed/tv/tt12345/2/5');

  const vidking = STREAM_PROVIDERS.find(p => p.id === 'vidking');
  assert.equal(vidking.movieUrl('tt12345'), 'https://www.vidking.net/embed/movie/tt12345?autoPlay=true');
  assert.equal(vidking.tvUrl('tt12345', 3, 1), 'https://www.vidking.net/embed/tv/tt12345/3/1?autoPlay=true');
});

test('resolveMediaId resuelve títulos destacados instantáneamente desde ID_OVERRIDES', async () => {
  const predatorId = await resolveMediaId('Depredador: tierras salvajes (2025) CAM', 'movie');
  assert.equal(predatorId, 'tt31252150');

  const strangerId = await resolveMediaId('Stranger Things', 'series');
  assert.equal(strangerId, 'tt4574334');

  const gladiatorId = await resolveMediaId('Gladiador II', 'movie');
  assert.equal(gladiatorId, 'tt9218128');
});

test('parseM3U parsea atributos tmdb-id e imdb-id correctamente', () => {
  const raw = `#EXTM3U
#EXTINF:-1 tvg-name="Prueba VOD" tmdb-id="9999" imdb-id="tt9999999" group-title="Cine",Prueba VOD
https://example.com/movie.mp4`;
  const parsed = parseM3U(raw);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].tmdbId, '9999');
  assert.equal(parsed[0].imdbId, 'tt9999999');
});
