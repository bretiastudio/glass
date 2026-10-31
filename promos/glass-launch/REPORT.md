# GLASS — Riflesso · report del film (bozza verticale 9:16)

Stato: **bozza renderizzata e verificata, in attesa di approvazione.** Il master in risoluzione finale non è stato
renderizzato.

- Film: `out/glass-riflesso-vertical-draft.mp4` (1080×1920, 30 fps, 30,0 s, H.264 + AAC)
- Verifica: `out/verify-vertical.txt` (prove sul video), `out/probe-vertical.txt` (continuità, curve, inquadratura)
- Revisione delle animazioni: `out/animation-review.md` · cartello finale: `out/end-card-original.png`, `out/end-card-mono-study.png`
- Composizione: `comp/comp.html` (verticale). La versione orizzontale precedente resta in `comp/comp-landscape.html`.

## 1 · Concetto: RIFLESSO

> *Un solo riflesso attraversa GLASS, e il nome è l'architettura in cui si muove.*

Il sito stesso è costruito su due idee: il logo dell'intro «diventa architettura» (cresce fino a diventare il grande
wordmark dell'hero) e una luce dietro il vetro satinato. Il titolo dell'hero, *«Dove ogni riflesso diventa
atmosfera»*, è la tesi del film. Scelto come combinazione di A (il marchio) e B (la luce), che avevi indicato.

## 2 · Formato: verticale, solo vista mobile

Il film è in 9:16 e mostra **solo il sito mobile**. L'HTML e il CSS compilati del sito sono montati a una finestra di
telefono di 390×693 px (esattamente 9:16), così sono i breakpoint reali del sito a decidere il layout, e riempiono il
fotogramma 1080×1920. Non c'è un mockup di telefono: il fotogramma *è* il telefono. Non c'è mouse: ogni causa è un
tocco (MENU, *Atmosfera*, gli swipe, l'invito Instagram), mostrato con un indicatore discreto.

## 3 · Direzione del movimento: Hybrid Luxury Cinematic × Apple Motion

Gli stati d'interfaccia mantengono i tempi del sito (sotto i 300 ms, ease-out); i momenti cinematografici (la luce,
la camera, il portale, l'apertura, la firma) sono più lunghi. La luce di GLASS è l'unico elemento ricorrente.

| effetto | come è realizzato |
|---|---|
| 01 Diamond Light Reveal | una fascia di luce attraversa G-L-Λ-S-S mentre l'intro reale del sito mette a fuoco le lettere; ogni lettera passa da argento a bianco quando la luce la supera; il nome si assesta; breve pausa |
| 02 Soft Diamond Refraction | la luce dell'hero è statica su touch, come nel sito; tre riflessi morbidi (2–3 %) nel fondo satinato, sotto testo e grana, scorrono lentamente; il bordo superiore della barra «prende» la luce |
| 03 Liquid Glass Morph | la barra nasce dal suo centro e poi mostra i contenuti sfalsati; il menu si forma dal pulsante MENU in 280 ms, link sfalsati di 45 ms, chiusura in 160 ms |
| 04 Cinematic Video Portal | dopo lo scroll reale dell'àncora la camera si avvicina (1,3 s, ease-in-out) finché il pannello 9:16 del video 01 coincide con il fotogramma: il filmato originale a tutto schermo, senza ritagli; la luce passa sulla cornice mentre si apre |
| 05 Crystal Iris | usato una sola volta: tornando indietro dal video, la pagina si riapre attorno al pannello attraverso un'apertura rettangolare dal bordo di vetro illuminato |
| 06 Tipografia cinetica | «Dove ogni riflesso / diventa atmosfera.» e «Uno sguardo dentro GLASS.» salgono parola per parola da dietro una maschera (70 ms tra le parole), nel carattere del sito |
| 07 Firma BRETÌA | la stessa luce che ha rivelato GLASS rivela BRETÌA: una tendina morbida con un riflesso sul bordo, leggera salita, scala 0,97 → 1, un solo piccolo assestamento |

Camera: ferma nelle tenute, movimenti con un motivo (apertura dell'intro, portale, ritorno, discesa al marchio del
footer); niente scuotimenti, rotazioni o zoom aggressivi. Mentre la camera si muove, il resto è fermo.

## 4 · Come si collegano le scene

| passaggio | cosa sopravvive e si muove |
|---|---|
| nome → hero | il wordmark cresce fino all'architettura dell'hero (il passaggio del sito) |
| hero → menu | il tocco su MENU; il pannello nasce dal pulsante |
| menu → Atmosfera | il tocco su *Atmosfera* e lo scroll reale all'àncora |
| Atmosfera → video 01 | il pannello del video diventa il fotogramma |
| video 01 → pagina | lo stesso pannello torna nella pagina, che si riapre attorno a lui |
| 01 → 02 | uno swipe: 01 si mette in pausa uscendo, 02 parte entrando (comportamento reale del sito, uno alla volta) |
| 02 → Instagram | uno swipe e un tocco su @glass_rende |
| Instagram → GLASS | la pagina finisce sul proprio marchio (footer), che si centra con la luce dietro, identico all'apertura |
| GLASS → BRETÌA | dissolvenza al buio: l'unico stacco dichiarato |

## 5 · Asset originali usati

- Sito: HTML e CSS compilati dal branch `claude/great-shannon-r0o8rk`, non modificati (solo livelli del film sopra).
- Logo GLASS: la vettorializzazione lettera per lettera usata dal sito (non un font).
- Carattere: Jost (OFL), come nel sito.
- Video 01: da 1,0 a ~6,3 s (dopo il lampo bianco iniziale), bianco e nero, nessun filtro, nessun ritaglio.
- Video 02: da 0 a 1,92 s, prima dei lampi a colori del montaggio originale (1,96–2,20 s); nulla oltre i 7 s. Prima di
  partire il pannello mostra un suo fotogramma a 1,0 s invece del poster del sito (preso a 7,2 s).
- Logo BRETÌA: il PNG ufficiale con trasparenza, conservato intatto in `assets/`; nel film una copia rifilata.

## 6 · Sound design

Sintesi originale, nessun campione e nessuna musica di terzi. Una sola stanza. Un pad grave che suona sotto il
movimento e tace nelle tenute; aria che accompagna luce, scroll e swipe; contatti di cristallo solo dove c'è una causa
(i tocchi); un battito basso con il fruscio di uno shaker sotto i video; un sub sotto il passaggio al wordmark e
l'arrivo nel video. Sincronizzati: la luce sul nome (un luccichio che lo attraversa), la nascita della barra, il menu,
il portale, l'apertura, la firma. Silenzi: prima della luce, sull'hero, sul tocco Instagram, sul GLASS finale (un solo
tono di cristallo) e prima di POWERED BY. BRETÌA ha la sua firma: due note di cristallo con un tocco di legno, nella
stessa stanza.

## 7 · Verifica

`verify_promo.py` sul video: **VERDICT PASS**. Cadenza CV 0,80; 46 % di fotogrammi fermi, pausa più lunga 4,3 s;
burst presenti; profilo energetico 1,01; audio con picco −4,5 dBFS, nessun clipping, 30 % di silenzio.

Continuità, curve e inquadratura vengono da `probe.py` lanciato a 1080×1920. `verify_promo.py --comp` sonda la
composizione sempre a 1920×1080, quindi per un film verticale non sarebbe attendibile. Risultati:
- **Continuità:** 1,00 sull'unico confine che il probe rileva (pagina → marchio del footer, portato). Il film è quasi
  un'unica ripresa continua sulla stessa pagina, quindi i confini sono pochi e la continuità degli altri passaggi va
  giudicata a occhio. Dichiarati in `__meta.cuts`: il passaggio dell'intro (il marchio arriva al 7,5 %, sotto la
  soglia del probe) e il cartello finale.
- **Curve:** picco ≈ 200 px/fotogramma (lo scroll reale dell'àncora), con otturatore reale 180°.
- **Inquadratura:** menu, video 01, video 02, marchio del footer e logo BRETÌA sempre interi nel fotogramma.

Controllo a occhio sul file codificato: i movimenti veloci si sfumano senza copie a scatti; il testo è leggibile nelle
tenute.

## 8 · Limiti

- La luce dell'hero è statica, come nel sito su touch: la sensazione di movimento viene dai riflessi lenti nel fondo,
  che sono un'aggiunta del film.
- Gli elementi neri del logo BRETÌA (contorni, piccoli segni, ©) si fondono con il fondo scuro; blu, bianco, corona e
  freccia lime restano chiari.
- Il wordmark GLASS è la vettorializzazione usata dal sito, non il vettoriale del designer.
- Questa è una bozza 1080×1920 a 30 fps. Il master finale va renderizzato dopo la tua approvazione, con
  `render.py comp/comp.html --width 1080 --height 1920 --final`, che dà 2160×3840 a 60 fps.

## 9 · Licenza onetake

onetake è distribuito con **PolyForm Noncommercial 1.0.0**: l'uso commerciale non è coperto. Per questo film la
licenza commerciale (onetake Pro) o un permesso scritto dell'autore **non risultano ottenuti**: si è proceduto su tua
decisione. La nota di licenza obbligatoria è in `comp/ONETAKE-NOTICE.md`.
