# GLASS

Sito ufficiale di GLASS, cocktail lounge a Rende (Calabria).

Sito statico costruito con [Astro](https://astro.build), senza framework UI né librerie di animazione:
CSS, Web Animations API e pochi script TypeScript.

## Sviluppo

Richiede Node.js 22.22 o successivo.

```bash
npm install
npm run dev       # server di sviluppo su http://localhost:4321
npm run check     # controllo dei tipi
npm run build     # sito statico in dist/
npm run preview   # anteprima della build
```

`dist/` è un sito statico: si può pubblicare su qualunque hosting (Netlify, Vercel, Cloudflare Pages,
hosting tradizionale via FTP).

## Struttura

| Percorso | Contenuto |
| --- | --- |
| `src/config/site.ts` | Dati dell'attività. Un valore `null` non compare sul sito: niente dati inventati. |
| `src/styles/global.css` | Design token (colori, tipografia, spazi, raggi, easing) e materiale «satin glass». |
| `src/components/` | Intro, navigazione, hero, sezione video, footer, logo. |
| `src/scripts/` | Intro, menu mobile, luce che segue il cursore, video. |
| `src/pages/` | Home, privacy policy e cookie policy (bozze, `noindex`). |
| `src/assets/brand/` | Logo originale (PNG) e sua vettorializzazione lettera per lettera. |
| `public/media/` | Video tagliati e ottimizzati, con poster. |

## Asset

- **Logo**: `src/assets/brand/glass-logo-original.png` è il file originale, non modificato.
  `glass-wordmark.svg` e `wordmark.ts` ne sono il ricalco vettoriale (potrace). Da sostituire con il
  vettoriale del designer quando disponibile.
- **Carattere**: Jost (SIL Open Font License, `public/fonts/jost-OFL.txt`), ospitato localmente.
  Frontage Pro non è incluso: serve una licenza webfont.
- **Video**: ricavati dai due video Instagram, senza audio.
  - `glass-experience-01.mp4`: primi 17,000 s (510 fotogrammi a 30 fps)
  - `glass-experience-02.mp4`: primi 7,800 s (195 fotogrammi a 25 fps)

Per rigenerarli dai file originali:

```bash
ffmpeg -i ORIGINALE_01.mp4 -t 17.000 -an -map_metadata -1 -vf "scale=720:1280:flags=lanczos,format=yuv420p" -c:v libx264 -profile:v high -level 4.0 -preset veryslow -crf 25 -g 50 -movflags +faststart public/media/glass-experience-01.mp4
```

```bash
ffmpeg -i ORIGINALE_02.mp4 -t 7.800 -an -map_metadata -1 -vf "scale=720:1280:flags=lanczos,format=yuv420p" -c:v libx264 -profile:v high -level 4.0 -preset veryslow -crf 24 -g 50 -movflags +faststart public/media/glass-experience-02.mp4
```

## Visita a 360° (prototipo)

`/visita` è una pagina a parte (`noindex`): un panorama a 360° fisso dietro la pagina, che gira mentre si
scorre e si ferma a ogni sezione. Lo scroll resta quello nativo del browser. Il panorama è disegnato in WebGL
senza librerie (`src/scripts/tour.ts`).

**Il panorama di oggi non è GLASS**: è [Cowboy Town Saloon](https://polyhaven.com/a/cowboy_town_saloon)
di Poly Haven (CC0), usato solo per provare l'effetto. Anche i testi delle tappe sono segnaposto e indicano
cosa scriverci.

| Percorso | Contenuto |
| --- | --- |
| `src/config/tour.ts` | Tappe: testi e direzione della camera (`yaw`, `pitch`) per ognuna. |
| `src/components/Tour.astro` | Pagina della visita: panorama, bussola, schede delle tappe. |
| `src/scripts/tour.ts` | Shader, scroll → rotazione, versione «riduci movimento». |
| `tools/tour/prepare_pano.py` | Prepara un panorama nuovo (formati e immagini di attesa). |
| `public/tour/` | Panorama in due misure e le due immagini di attesa. |

Con la foto vera del locale (un'immagine equirettangolare 2:1, quella di qualunque fotocamera 360°):

```bash
python3 -I tools/tour/prepare_pano.py percorso/della/foto.jpg --yaw -150
```

Poi si regolano le direzioni delle tappe in `src/config/tour.ts`: `/visita?hud` mostra in basso a sinistra
la direzione attuale mentre si scorre. `/visita?colore` mostra il panorama a colori invece che in bianco e nero.

## Da completare

Vedi i `TODO(owner)` in `src/config/site.ts` e i campi tra parentesi quadre nelle pagine legali.
