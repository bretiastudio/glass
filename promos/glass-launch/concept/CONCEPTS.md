# GLASS — launch film · concept round

Target: 30–32 s, 16:9, ending on **POWERED BY BRETÌA**. Built with the onetake skill (see *Licence* below before
any commercial use). Nothing in this folder touches the website.

Boards in this folder (every frame is a crop of the real site or its films, nothing drawn):

- `site-desktop.jpg`: the intro at 0.9 / 1.4 / 2.9 s, the hero with the cursor light, the nav on hover, Atmosfera.
- `site-mobile.jpg`: the mobile hero, the menu open, the video section.
- `storyboard-riflesso.jpg`: the recommended concept, timed.

---

## 1 · What the site actually is (the source of truth)

Read from branch `claude/great-shannon-r0o8rk` (Astro, no UI framework), built and captured at 1920×1080 and
390×844 @3x.

| element | what it really is |
|---|---|
| Logo | `src/assets/brand/glass-logo-original.png` (1080², black on transparent). The site draws a per-letter vector trace of it (`wordmark.ts`, potrace), never a font. The A is an open chevron, **Λ**. |
| Type | **Jost** (OFL), weights 300–460. Display 300 at −0.012 em; labels 11 px, 460, uppercase, +0.24 em. |
| Colour | ink `#08090b` · `#0e1014` · graphite `#111318` · charcoal `#1b1d22` · satin silver `#c5c6c9` · silver-dim `#8f9197` · muted white `#f2f0ed` · **champagne `#b8a68c`, used only as light**. |
| Intro (3.8 s) | Warm light rises (0.1 s, 1.5 s quart-out, drifting left→right) · G-L-Λ-S-S come into focus 110 ms apart (blur 10 px→0, slide from −14 %) · at 2.45 s the logo **grows into the hero's background wordmark** while fading to 7.5 % ("the logo becomes architecture") · nav and copy arrive at +0.45 s, 80 ms apart. |
| Hero | Ghost wordmark across the width at 7.5 %. Eyebrow `COCKTAIL LOUNGE · RENDE`. Headline **"Dove ogni riflesso / diventa atmosfera."** Cue `SCOPRI`. |
| Cursor light | A champagne radial glow (15 % → 0) that trails the mouse on a **critically damped spring, 0.9 s response**, with no overshoot. Fine pointers only; on touch it is a static glow at 72 % / 30 %. |
| Nav | "Satin glass" material (`.material`: 72 % graphite, blur 20 px, grain, 1 px top highlight). Desktop: a centred floating bar `GLASS · ATMOSFERA · CONTATTI · INSTAGRAM ↗` with hover states, and no menu. Mobile: `GLASS · MENU ≡`; tapping opens a panel from the toggle (220 ms, links +40 ms) with `Atmosfera / Contatti / Instagram ↗ / RENDE · CALABRIA`. |
| Atmosfera | `ATMOSFERA` / **"Uno sguardo dentro GLASS."** / "Scopri GLASS, anche fuori dal locale." Two 9:16 panels in an offset editorial grid (01 · 0:17, 02 · 0:08). CTA `SEGUICI SU INSTAGRAM` / **@glass_rende ↗**. |
| Footer | The GLASS wordmark, `Rende · Calabria`, @glass_rende. |

**Where the brief and the site differ**:

- The light is **champagne, not white**. The film follows the site.
- "Soft Liquid Glass" is called *satin glass* in the code, and it covers **only the nav and the menu panel**.
- The desktop nav **doesn't open**. The interaction with a visible cause is the **mobile MENU tap** (and the desktop hovers).
- **"THE GLASS EXPERIENCE" doesn't appear on the site.** The real copy is "Uno sguardo dentro GLASS." and
  "Seguici su Instagram". **"A new perspective on the night"** isn't on the site either (see question 2).

**The two films** (`public/media/`, silent, 720×1280):

- `glass-experience-01.mp4`: exactly the first **17.000 s** (510 f @30). Fully monochrome (max saturation 1.2/255).
  Its last 1.5 s is a ribbed-glass distortion, not a logo.
- `glass-experience-02.mp4`: the site keeps **7.800 s** (195 f @25), longer than the 7 s in the brief. The extra
  0.6 s (from **7.20 s**) is the martini-and-candle shot, which is also the site's poster. The film uses **0–7.0 s only**.
- **Film 02 isn't entirely black and white.** It has four amber colour flashes from the original edit, 2–4 frames each, at
  **1.96–2.00, 2.12–2.16, 4.84–4.96 and 5.12–5.24 s**. The film picks in and out points that avoid them, so it stays
  monochrome without any filter.

**How the site appears in the film.** The composition mounts the site's **own built HTML and CSS** in a shadow root
and drives its state from `__seek(t)`: the intro's real keyframes, the light's real spring, the menu's real
transitions, and the films at a set `currentTime`. Tested: identical to the live page at 1920×1080 except for the light
position, which the film drives. It's sharp at 4K and deterministic, with no screen-recording artefacts and no rebuilt
replica. The mobile instance gets the 390-px layout through the site's own breakpoints.

---

## 2 · Three concepts

### A · IL MARCHIO È L'ARCHITETTURA (the brand reveal)

- **Idea:** one element, the GLASS wordmark, is followed through every place it really appears: intro → the hero's
  ghost wordmark → the nav mark → the mobile bar → the footer → the end.
- **Opening frame:** black, a single Λ filling the frame edge to edge, at 7.5 % white, so it reads as architecture before it reads as a letter.
- **Mechanism:** scale. Every boundary is the same letters changing size (`morphRect`, a screen-keyed `camera` through
  1× → 12× → 0.3×, as in the *clearing* film).
- **Camera:** locked to the mark. The world moves around it and never cuts.
- **Connections:** the mark always survives. Weak spot: the **films have no logo in them**, so the Atmosfera section
  breaks the thread, or forces a cheat (the word "GLASS" in Jost from the heading isn't the logo).
- **Type / colour:** the mark and the site's copy only. Strictly monochrome, almost no warm light. Contrast comes from scale.
- **Sound:** dry and architectural: air on every scale move, a sub on every landing, one sustained tone that bends with scale.
- **Signature:** GLASS shrinks to a point at the centre; BRETÌA grows out of that point.
- **Rules out:** a hand, a light as subject, any cut.

### B · LUCE IN MOVIMENTO (light in motion)

- **Idea:** one warm light is the only subject. It wakes the name, becomes the cursor light, crosses the satin
  glass, lights the phone, lands on the steel of the shaker, and settles behind the name.
- **Opening frame:** pure black with a single point of champagne light low in the frame.
- **Mechanism:** the light reveals. Where it passes, things exist (`lightField`, a radial glow on a spring).
- **Camera:** chases the light, trailing it ~0.1 s on `sineInOut`, and stops dead when the light stops.
- **Connections:** the light survives every boundary. Weak spot: on its own, the light is too faint to *carry* the
  UI-heavy middle (nav, phone), and it risks looking like a generic glow.
- **Type / colour:** site copy only. Near-black, graphite, champagne light.
- **Sound:** a room after hours. A low pad that breathes with the light's brightness and air that follows its speed.
- **Signature:** the light dims, GLASS goes dark with it, and BRETÌA appears where the light was.

### C · ATTRAVERSO LA SUPERFICIE (through the surface)

- **Idea:** one continuous dolly forward through panes of the site's satin glass. Each pane is frosted until the
  camera reaches it, then clears onto the next section.
- **Opening frame:** a full-frame frosted pane, with GLASS only a blurred silhouette behind it.
- **Mechanism:** depth and defocus (`view` parallax, `dof`), with a `zoomThrough` at every pane.
- **Camera:** one long move with speed changes, accelerating through each pane and slowing at each section.
- **Connections:** everything is a pass-through, so every boundary carries.
- **Type / colour:** graphite and frosted silver, more glass than the site has.
- **Sound:** continuous camera air driven by speed (as in *clearing*), with a glass resonance at each pass.
- **Signature:** a final pane frosts over GLASS and clears onto BRETÌA.
- **Honest weakness:** it inflates a material the site uses on two components into the whole world, which is exactly
  the exaggerated glassmorphism the brief forbids. A continuous dolly is never still (onetake's rest leg fails, and it
  reads as a screensaver), the UI is blurred half the time, and nothing *causes* anything.

---

## 3 · Recommendation: **RIFLESSO**, B as the spine and A's mark as the anchors

> *A single reflection travels through GLASS, and the name is the architecture it moves through.*

Your instinct (A + B) is right, and the site itself says why. It is built on exactly these two ideas: **the logo
becomes architecture** (the intro hand-off) and **a light behind frosted glass that follows you** (the hero). Its
headline is the film's thesis: *Dove ogni riflesso diventa atmosfera*, where every reflection becomes atmosphere.
So the film isn't made of effects; it's made of the site's own two inventions.

What makes it work where B alone wouldn't:

- **The light has a cause.** On the site, the visitor's pointer moves it. The pointer in the film is that cause, not
  decoration: it appears only when it drives something (the light, the hovers, the CTA). On mobile, the cause is a tap.
- **The mark anchors every place the light can't carry:** the intro, the hero's ghost mark, the nav's mark, the
  footer's mark, the end.
- **It bookends.** The same light rises behind the same name at 0.5 s and at 25.4 s.
- **It differs from onetake's case films** (paper, tabletop, dusk, ember…). The look is the site's own tokens.

### Beat sheet (31.5 s)

| t (s) | beat | what moves | what is still | carries into the next beat |
|---|---|---|---|---|
| 0.00–0.50 | black | nothing (silence) | everything | — |
| 0.50–1.90 | **IL NOME** | champagne light rises and drifts left→right; each letter resolves as the light reaches it (the site's intro curve) | camera, 1.7× macro | the wordmark |
| 1.90–2.60 | hold | — | **GLASS, dead still** | the wordmark |
| 2.60–3.70 | the hand-off | the site's real hand-off: the mark grows into the ghost wordmark and fades to 7.5 %; camera 1.7×→1.0× | — | the wordmark (scale) |
| 3.05–4.40 | the page arrives | nav settles, eyebrow / headline / cue rise (real timings) | ghost mark | the light |
| 4.40–7.90 | **LA LUCE HA UNA MANO** | pointer enters; the light trails it on the site's 0.9 s spring; camera trails the light, pushes 1.0→1.15× toward the headline | type | pointer + light |
| 7.90–9.30 | **hold on the headline** | — | everything: *Dove ogni riflesso / diventa atmosfera.* | the pointer |
| 9.30–10.30 | to the nav | pointer rises; camera snaps up and in, 1.15→2.4× (`expoInOut`, landing keyed first) | — | the nav |
| 10.30–11.40 | **three hovers** | ATMOSFERA · CONTATTI · INSTAGRAM ↗ light up 0.3 s apart (real states); the light glows through the frosted bar | camera | the bar |
| 11.40–12.80 | **LO STESSO VETRO, IN MANO** | `morphRect`: the desktop bar becomes the real mobile bar; the frame closes into the phone screen as the camera pulls out | — | the bar |
| 12.80–13.60 | phone hold | — | the real mobile hero | the MENU toggle |
| 13.60–15.20 | **MENU** | tap (the cause) → the real panel opens; 0.7 s hold; tap *Atmosfera* → it closes and the page scrolls | phone | the film panel |
| 15.20–16.20 | into the film | `zoomThrough` the mobile panel 01 until it is a large 9:16 frame | — | panel 01 |
| 16.20–18.80 | **FILM 01** | film 01 plays (the pour into the shaker) | camera | panel 01 |
| 18.80–20.00 | editorial | panel 01 `morphRect`s to its desktop slot; panel 02 rises; heading `maskRise` | — | panel 02 |
| 20.00–22.40 | **FILM 02** | both films play (02 inside 0–7 s, avoiding the colour flashes) | camera | the CTA |
| 22.40–24.20 | **INSTAGRAM** | camera glides to the CTA; pointer hovers @glass_rende (real arrow nudge) | — | the page |
| 24.20–25.40 | to the footer | the page scrolls to its footer mark; everything else falls to black; the mark centres | — | the mark |
| 25.40–27.40 | **GLASS** | the light rises behind it (bookend), then **dead still** | GLASS | the dark |
| 27.40–28.30 | recede | light dims; GLASS recedes (opacity → 0, scale .97) | — | end card (the one bare cut, declared in `__meta.cuts`) |
| 28.30–29.60 | **POWERED BY BRETÌA** | `POWERED BY` (site label style, small, silver-dim) rises; the original logo emerges from the dark (`swiftSpring` .smooth, no bounce, 8 px rise, .94→1) | — | — |
| 29.80–30.40 | sweep | one soft light sweep across the logo (optional, judged in the draft) | — | — |
| 30.40–31.50 | **final hold** | — | the whole signature | — |

Rhythm: shots run from 0.3 s (the hovers) to 3.5 s, about 12×. There's one burst (the three hovers), and holds at 1.9,
7.9, 12.8, 14.3, 25.4 and 30.4 s. Target ≥ 25 % dead-still frames, to be tuned with `probe.py` and `verify_promo.py`. Carry is
designed at every boundary except the end card.

Moves: the site's own keyframes for the intro; `camera` (+ `shake` only on the snap to the nav, no shake near type);
`morphRect` (bar → phone, panel → slot, mark → centre); `zoomThrough` (into film 01); `maskRise` (heading); `wordRise`
(POWERED BY); `swiftSpring` (BRETÌA); `lightField` / a spring for the light. **Not** `letterDrop`: its squash is a
cartoon landing that the GLASS mark shouldn't have.

### Sound (original synthesis only, no licensed music needed)

One room: a lounge after hours. Five things play, and nothing else:

- a low pad that breathes with the light's brightness;
- soft air that follows the light's speed and the camera's moves;
- muted crystal contacts **only on causes**: the three hovers, the two taps, the films' ice;
- a sub under the hand-off and under the final GLASS;
- **silence** at 0–0.5 s, on the headline hold, and for 0.6 s before POWERED BY.

BRETÌA gets its own short, brighter two-note glass-and-mallet signature in the same room. It is not the "vibraphone
chord + crotale" onetake retired as a stock ending.

### BRETÌA end card: two treatments to compare once the file is here

1. **Original (preferred):** the untouched PNG, full colour, centred. Its thick black outline sits naturally on the
   near-black ground, so the blue and white read with no box around it. If the file has a white background, a
   transparent working copy is derived by flood-filling only the outer white from the edges (the letters' own white is
   enclosed by the outline). The master isn't touched.
2. **Monochrome study:** the same artwork mapped to the GLASS greys, with the original blue kept on the mascot and
   the B only. Shown for comparison; the original is expected to win.

---

## 4 · Open questions

1. **Concept**: A, B, C, or **RIFLESSO** (recommended)?
2. **On-screen copy**: "A new perspective on the night" isn't on the site. Options: (a) only the site's own Italian
   copy (recommended, consistent with "the website is the source of truth"); (b) add the English line once, under GLASS
   at 25.4 s.
3. **BRETÌA logo file**: the image came through the chat only; the container has no file. Please commit
   `Logo 3D BRETÌA con Mascotte Blu.png` (the original PNG, ideally with transparency) to
   `promos/glass-launch/assets/` on this branch.
4. **onetake licence**: see below.

## 5 · Licence: onetake

onetake is under **PolyForm Noncommercial 1.0.0** (`Required Notice: Copyright (c) 2026 Patrick. onetake is free for
noncommercial use only.`). A promotional film for a client (GLASS) and for a studio (BRETÌA) is a commercial purpose,
so it is **not covered**. The author offers a commercial licence as **onetake Pro** (https://onetakemotion.com); the
alternative is written permission from the author. This is **not cleared**. It needs your decision before onetake's
library and scripts are used to build this film.
