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

## Da completare

Vedi i `TODO(owner)` in `src/config/site.ts` e i campi tra parentesi quadre nelle pagine legali.
