Versión 0.6.0 de JUAMPI-TV para Google TV, Android TV y Web/PWA — "Streambert Universal Engine Edition" con arquitectura de múltiples servidores de reproducción, bloqueo nativo de anuncios y popups en Android, selector de servidor y conmutación por error (failover) automático.

## Novedades de la versión 0.6.0 (Streambert Universal Engine)

- **Arquitectura Multi-Servidor Universal (Inspirada en Streambert):**
  - **Servidor 1 (HLS Directo):** Transmisión directa de alta velocidad optimizada para ExoPlayer en Android y HLS nativo.
  - **Servidor 2 (Videasy HD):** Servidor universal embebido con soporte multilingüe y alta estabilidad para películas y series.
  - **Servidor 3 (VidSrc Mirror):** Espejo de respaldo alternativo de alta disponibilidad.
  - **Servidor 4 (Vidking Universal):** Servidor de redundancia universal.
- **Bloqueo Nativo de Anuncios y Popups en Android TV (`MainActivity.java`):**
  - Intercepción proactiva en WebView de más de 35 redes de anuncios, rastreadores y minería de datos (PopAds, Adsterra, Bet365, PropellerAds, Monetag, etc.).
  - Supresión automática de ventanas emergentes (`setSupportMultipleWindows(false)`, `setJavaScriptCanOpenWindowsAutomatically(false)`).
  - Bloqueo de redirecciones no deseadas sin interrumpir la reproducción.
- **Selector de Servidores y Conmutación por Error (Failover):**
  - **Selector de Servidor en el Reproductor:** Selector directo de servidor en la barra de control del reproductor.
  - **Selector de Servidor en Selector de Series:** Posibilidad de preseleccionar el servidor deseado para los episodios de una serie.
  - **Cartel de Conmutación Inmediata:** Si una señal directa experimenta fallos o restricciones geográficas, aparece automáticamente una tarjeta con botones de 1 clic para cambiar a Servidor 2 (Videasy) o Servidor 3 (VidSrc).
- **Mapeo y Enriquecimiento de Metadatos:**
  - Enriquecimiento automático de identificadores IMDb y TMDB para los títulos principales y catálogo de series/películas.
  - Resolución dinámica con Cinemeta para títulos adicionales sin necesidad de claves API.
- **Control Remoto y Zapping Mejorado:**
  - Control de canal anterior y siguiente (`⏮ / ⏭`) compatible con mandos de TV.
  - Pantalla completa adaptable tanto para video nativo como para reproductores embebidos.

## Instalar en Smart TV

1. Abrí **https://juampipey32.github.io/JUAMPI-TV/** desde la app **Downloader** en tu Smart TV / Chromecast / TV Box y pulsá **Descargar APK**.
2. También podés bajar directamente `JUAMPI-TV.apk` desde los archivos adjuntos a este Release de GitHub.
3. La app incluye todo el catálogo e interfaz sin necesidad de encender la PC ni pagar suscripciones.

## Verificación de Integridad

El archivo `SHA256SUMS.txt` permite comprobar la integridad de la descarga y `SIGNATURE.txt` contiene el certificado público de firma. Todas las compilaciones son validadas con emuladores Android 15 Google TV y pruebas de integración automatizadas (`TvSmokeTest`).
