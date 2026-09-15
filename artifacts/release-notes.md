Versión 0.5.0 de JUAMPI-TV para Google TV, Android TV y Web/PWA — "Netflix Redesign" con navegación fluida por carruseles horizontales, series organizadas por plataforma (Netflix, HBO Max, Disney+, Amazon Prime Video, Anime) con selector de temporadas y episodios, películas agrupadas por año de estreno y género, y deportes argentinos en vivo.

## Novedades de la versión 0.5.0 (Netflix Redesign)

- **Diseño y Experiencia Estilo Netflix:**
  - **Carruseles de Navegación Rápida:** Carruseles horizontales con scroll fluido, snap magnético y navegación D-pad limpia e intuitiva mediante control remoto.
  - **Menú y Filtros Claros y Depurados:** Eliminación total de filtros cruzados y botones redundantes. Dock lateral limpio con: *Inicio*, *Películas*, *Series*, *Deportes*, *En vivo*, *Mi lista* y *Recientes*.
  - **Billboard Destacado Dinámico (Hero):** Presentación cinemática de estrenos y eventos destacados con poster en alta definición, metadata y botones directos de acción (`Reproducir` y `+ Mi lista`).
- **Series Agrupadas por Plataforma de Streaming:**
  - Segmentación por marcas líderes: 🔴 **Netflix Originals**, 🟣 **HBO Max / Max**, 🔵 **Disney+ & Star+**, 🟢 **Amazon Prime Video**, 🎌 **Anime & Crunchyroll**, y grandes producciones de drama, misterio y comedia.
  - **Selector Modal de Temporadas y Episodios:** Al seleccionar una serie se abre una ventana modal con portada oficial, ficha técnica, selector de episodios con numeración clara (T01 E01...) y botón de reproducción directa, evitando saturar la pantalla con miles de episodios individuales.
- **Películas Agrupadas por Año y Género:**
  - **Estrenos 2024 - 2025** con carátulas oficiales en alta resolución.
  - **Aclamadas 2020 - 2023** y Éxitos de los 2010s.
  - Clasificación por categorías: Acción, Ciencia Ficción, Comedia, Terror, Drama y Animación.
- **Deportes Argentinos y Televisión en Directo:**
  - Canales de TV abierta y señales de noticias de Argentina en directo (TyC Sports, DeporTV, TV Pública, TN, C5N, La Nación+, Crónica, etc.).
  - Cobertura polideportiva y fútbol panregional.
- **Soporte Completo de Control Remoto:**
  - Navegación espacial D-pad bidimensional sin saltos en diagonal.
  - Indicador de foco visual de alto contraste y elevación de póster al seleccionar.
- **Compatibilidad y Privacidad:**
  - Soporte de importación de listas M3U / M3U8 privadas almacenadas 100% en local.
  - Reproductor integrado con ExoPlayer nativo en Android y HLS.js en navegadores.

## Instalar en Smart TV

1. Abrí **https://juampipey32.github.io/JUAMPI-TV/** desde la app **Downloader** en tu Smart TV / Chromecast / TV Box y pulsá **Descargar APK**.
2. También podés bajar directamente `JUAMPI-TV.apk` desde los archivos adjuntos a este Release de GitHub.
3. La app incluye todo el catálogo e interfaz sin necesidad de encender la PC ni pagar suscripciones.

## Verificación de Integridad

El archivo `SHA256SUMS.txt` permite comprobar la integridad de la descarga y `SIGNATURE.txt` contiene el certificado público de firma. Todas las compilaciones son validadas con emuladores Android 15 Google TV y pruebas de integración automatizadas (`TvSmokeTest`).
