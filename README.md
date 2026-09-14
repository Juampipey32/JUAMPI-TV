# JUAMPI-TV

Reproductor IPTV web con identidad propia, inspirado en la navegación de plataformas de streaming. Primera versión local, en español, creada el 14 de septiembre de 2026.

## Abrir

Con Node.js 22 o superior: ejecutar `iniciar_juampi_tv.bat` y abrir http://localhost:5178. También se puede usar `npm install` y `npm run dev`.

En otro dispositivo de la misma red, usar la IP de esta PC y el puerto 5178. El firewall de Windows debe permitir esa conexión. El servidor de desarrollo no es un despliegue público.

## Incluido

- Catálogo inicial de 2.049 URLs únicas de Free-TV/IPTV, con prioridad visual para Argentina. Es cantidad de entradas, no cantidad de señales verificadas.
- Reproducción HLS, selección de calidad cuando la señal ofrece variantes, controles nativos, pantalla completa y Picture-in-Picture donde el navegador lo admite.
- Búsqueda por nombre o país, filtros, carga incremental, favoritos e historial local de canales abiertos.
- Importación de archivos M3U/M3U8 y URLs accesibles mediante CORS. Persistencia en el navegador; no hay cuentas ni sincronización entre dispositivos.
- Distinción de enlaces web a YouTube, Twitch y Dailymotion, que se abren en el proveedor.
- Interfaz adaptable a escritorio y celular, foco de teclado, navegación con Tab y acceso a búsqueda con `/`.

## Fuente y recursos

El proyecto fuente solicitado es [Free-TV/IPTV](https://github.com/Free-TV/IPTV), un catálogo M3U, no una aplicación tipo Netflix. JUAMPI-TV implementa su propia interfaz y reproductor. `public/catalog.m3u8` es una instantánea descargada el 14/09/2026 desde https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8. El botón Actualizar fuente consulta ese archivo original.

Los nombres, logotipos y señales pertenecen a sus respectivos titulares. No se retransmite ni se aloja video; el navegador solicita la señal al proveedor. Los logotipos se cargan desde las URLs de la lista. La disponibilidad depende de región, servidor, codecs, HTTPS y CORS. No se implementan mecanismos para eludir restricciones del proveedor.

Fotografía ambiental: [Unsplash](https://images.unsplash.com/photo-1464822759023-fed622ff2c3b), guardada localmente como `public/patagonia.jpg`; no representa contenido emitido ni una ubicación verificada. Fuentes: DM Sans y Barlow Condensed mediante Google Fonts. Íconos: Lucide. Motor: HLS.js. Dependencias y versiones exactas en `package-lock.json`.

## Verificación

`npm test` ejecuta pruebas de parsing M3U, deduplicación, proveedores externos y rechazo de protocolos inseguros. `npm run build` produce `dist/`.

Con el servidor activo y Python Playwright instalado: `python tests/browser_smoke.py`. Usa Chrome headless y prueba búsqueda, filtros, favoritos tras recarga, historial, importación persistente, restauración, cierre del video y viewport 390 × 844 sin desborde horizontal. Las capturas quedan en `artifacts/`.

En la sesión inicial se verificó Canal 26: video de 1920 px, readyState 4, reproducción activa y fotogramas decodificados. Cine.AR falló desde esta conexión y se verificó el mensaje de error. No se comprobaron todas las señales. Picture-in-Picture y pantalla completa están implementados, pero no certificados en dispositivos físicos.

## Alcance pendiente

Es una beta local. No incluye todavía guía EPG, cuentas, sincronización, Chromecast, app nativa Smart TV, aplicación instalable offline, VOD ni despliegue público. La estética “2027” es una dirección visual, no una certificación técnica. Para una siguiente versión, priorizar EPG con fuente validada, navegación con control remoto y pruebas en el dispositivo objetivo.
