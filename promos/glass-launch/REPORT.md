# GLASS — Riflesso · report del film (bozza 1080p30, v2)

Stato: **bozza renderizzata e verificata, in attesa di approvazione.** Il master 4K60 non è stato renderizzato.

File: `out/glass-riflesso-draft-v2.mp4` (1920×1080, 30 fps, 31,5 s, H.264 + AAC) · provini: `out/contact-sheet-v1.png` ·
verifica: `out/verify-v2.txt` · cartello finale: `out/end-card-original.png`, `out/end-card-mono-study.png` ·
sonoro: `out/sfx.wav`.

## 1 · Concetto scelto: RIFLESSO

> *Un solo riflesso attraversa GLASS, e il nome è l'architettura in cui si muove.*

È la combinazione di B (la luce come filo conduttore) e A (il marchio come punto fermo) che avevi indicato, scelta
per una ragione precisa: il sito stesso è costruito su queste due idee. Il logo dell'intro «diventa architettura»
(cresce fino a diventare il grande wordmark sullo sfondo dell'hero) e una luce dietro il vetro satinato segue il
visitatore. Il titolo dell'hero, *«Dove ogni riflesso diventa atmosfera»*, è la tesi del film. Il film non aggiunge
effetti: usa le due invenzioni del sito.

Scartati: **C** (attraversare superfici satinate) gonfia un materiale che il sito usa solo su navigazione e menu,
non si ferma mai e sfoca l'interfaccia; **A** da solo si interrompe sui video, che non contengono il logo.

## 2 · Come viene presentato il sito

Il sito non è registrato né ricostruito: il suo **HTML e CSS compilati** (`npm run build`, branch
`claude/great-shannon-r0o8rk`) sono montati dentro la composizione e pilotati fotogramma per fotogramma
(`tools/build_site.py`). Ogni stato mostrato esiste nel sito e usa le sue durate e curve:

| momento | sorgente nel sito |
|---|---|
| intro (luce, lettere a fuoco, passaggio al wordmark dell'hero) | `src/scripts/intro.ts`, stessi keyframe e curve (verificati sui valori calcolati dal browser) |
| luce che segue il cursore | `src/scripts/light.ts`: molla criticamente smorzata, risposta 0,9 s, quiete sotto 0,25 px |
| hover della navigazione | CSS: colore e sfondo in 160 ms, `ease` |
| menu mobile | `src/scripts/menu.ts` + CSS: apertura 220 ms, link sfalsati di 40 ms, chiusura 160 ms |
| video | `src/scripts/films.ts`: autoplay quando il pannello è visibile, uno solo alla volta (01 si mette in pausa quando si avvia 02) |
| invito Instagram | CSS: freccia che si sposta di 2 px in hover, opacità 0,6 alla pressione |

Il testo a schermo è solo quello del sito, in italiano. «A new perspective on the night» e «The GLASS Experience»
non compaiono, perché non esistono nel sito.

## 3 · Tecniche visive e libreria onetake

- **Camera** `OM.camera` + `OM.view`: macro 1,6× sull'intro, apertura insieme al passaggio al wordmark (sulla
  stessa curva del sito), inseguimento della luce, **scatto** sulla navigazione (`expoInOut`, atterraggio chiavato
  prima), carrellata verso l'invito Instagram (`quintInOut`), discesa sul marchio del footer (`cubicInOut`).
  Mai oltre i bordi della pagina.
- **Carry** `OM.morphRect` (barra → telefono, pannello del telefono → fotogramma → posto nella griglia desktop),
  spinta nel video come `zoomThrough` (scala logaritmica, `expoInOut`).
- **Entrate**: `OM.wordRise` (POWERED BY), `OM.swiftSpring` .smooth senza rimbalzo (logo BRETÌA).
- **Mano**: il puntatore compare solo quando causa qualcosa (la luce, gli hover, il clic su 02, l'invito
  Instagram); sul telefono, un tocco. Percorso su `OM.spline`, pressione da `OM.cursor`.
- **Otturatore reale** (render.py, 180°, campioni dimensionati da `__motion`): i movimenti veloci sfumano invece
  di sdoppiarsi.
- Esclusi di proposito: `letterDrop` (atterraggio da cartone, inadatto al marchio), `iris`, `gather`, `seal`,
  particelle, neon, oggetti 3D, scuotimenti di camera.

## 4 · Come si collegano le scene

| confine | cosa sopravvive e si muove |
|---|---|
| nome → hero | il wordmark cresce fino all'architettura dell'hero (il passaggio del sito) |
| hero → navigazione | il puntatore, e la luce che lo segue sotto il vetro della barra |
| navigazione → telefono | **la barra**: si restringe alla larghezza della barra mobile, scambia i link con MENU e il telefono cresce da lei |
| telefono → video | il tocco su *Atmosfera*, lo scroll reale, poi il pannello del video diventa il fotogramma |
| video → griglia editoriale | lo stesso pannello scende nel suo posto della griglia desktop |
| griglia → Instagram | il puntatore che ha avviato 02 va all'invito |
| Instagram → GLASS | la pagina finisce sul proprio marchio (footer), che si centra |
| GLASS → BRETÌA | dissolvenza al buio: l'unico stacco dichiarato |

L'ultima inquadratura di GLASS è identica alla prima (stessa dimensione, stessa luce): il film si chiude dove il sito
comincia.

## 5 · La versione mobile

Il layout mobile reale (390 px, gli stessi breakpoint del sito) dentro un telefono sobrio: corpo grafite, bordo
satinato, nessun modello riconoscibile, nessun contenuto inventato. Si vedono l'hero mobile con la sua luce statica
(sul touch il sito non la fa seguire), le proporzioni del logo, il tocco su **MENU** (il pannello si apre dal
pulsante), il tocco su **Atmosfera**, lo scroll all'àncora e l'avvio automatico del video.

## 6 · Asset originali usati

- Logo GLASS: la vettorializzazione lettera per lettera del PNG originale che il sito stesso usa
  (`src/assets/brand/wordmark.ts`); non è stato ridisegnato né sostituito con un font.
- Carattere: Jost (OFL), lo stesso del sito.
- Video 01: `glass-experience-01.mp4` del sito (primi 17,000 s), usato da 1,0 a 5,7 s (dopo il lampo bianco
  iniziale). Interamente in bianco e nero, senza filtri né ritagli (pannello 9:16 intero).
- Video 02: `glass-experience-02.mp4`, usato da 0 a 1,92 s, cioè **prima** dei lampi a colori del montaggio
  originale (1,96–2,20 s e 4,84–5,24 s). Nessun filtro: resta in bianco e nero perché quei fotogrammi non vengono
  mostrati. Il file del sito dura 7,8 s; il film non usa nulla oltre i 7 s, e per questo il pannello 02 attende su
  un suo fotogramma a 1,0 s invece del poster del sito (preso a 7,2 s).
- Logo BRETÌA: il PNG ufficiale con trasparenza (1983×793), conservato intatto come master in `assets/`; il film
  usa una copia rifilata, senza alcuna modifica di colori o proporzioni.

## 7 · Firma BRETÌA

Sequenza: GLASS si posa al centro con la luce dietro → pausa → la luce cala e GLASS arretra nel buio (opacità → 0,
scala 0,97) → **POWERED BY** in maiuscolo piccolo, spaziatura 0,34 em, argento attenuato → il logo emerge dal buio
con una molla morbida senza rimbalzo (scala 0,955 → 1, 14 px di salita) → un'unica lama di luce passa sul logo →
tenuta ferma fino alla fine. Il contrasto tra il monocromo di GLASS e il blu di BRETÌA è voluto: il cliente e lo studio.

Due trattamenti a confronto (`out/end-card-original.png`, `out/end-card-mono-study.png`): **originale** e **studio
monocromatico** con il blu mantenuto. Il logo è già blu, bianco e nero, quindi lo studio cambia solo la freccia lime
in grigio: la differenza è minima e toglie un dettaglio riconoscibile. **Nel film è usato l'originale.**

## 8 · Sound design

Sintesi originale, nessun campione e nessuna musica di terzi (nessuna licenza da documentare). Una sola stanza
(riverbero sintetico, T60 1,3 s), cinque materiali:

- un pad grave a voci aperte che cambia accordo una volta per sezione e **si ferma** nelle tenute;
- aria filtrata che segue la velocità della luce e i movimenti di camera;
- contatti di cristallo attenuati **solo dove c'è una causa** (i tre hover, i tocchi, i clic);
- un sub sotto i due momenti architettonici (il passaggio al wordmark, la spinta nel video);
- sotto i video, un battito basso con il fruscio di uno shaker in levare: il bancone, non una batteria.

Silenzi: prima della luce, sulla tenuta del titolo, sulle tenute del telefono e del menu, sull'invito Instagram, sul
GLASS finale (un solo tono di cristallo) e prima di POWERED BY. BRETÌA ha una firma propria: due note di cristallo
con un tocco di legno (La5 → Mi6), più brillanti, nella stessa stanza.

## 9 · Risultati della verifica

`verify_promo.py` sulla bozza v2: **VERDICT PASS**, tutte le prove superate (`out/verify-v2.txt`).

| prova | risultato |
|---|---|
| cadenza | lunghezze delle inquadrature da 0,4 a 3,4 s, CV 0,63 (minimo 0,25) |
| pause | 48,9 % di fotogrammi fermi, pausa più lunga 6,4 s |
| burst | presente (21,8–22,0 s) |
| profilo energetico | 0,58 (indicativo, minimo 0,35) |
| audio | picco −4,5 dBFS, nessun clipping, 22 % di silenzio; −18 LUFS circa |
| continuità | 1,00 sui 3 confini che il probe considera, tutti *portati* (barra → telefono, crescita del telefono, pagina → marchio del footer). Due confini sono dichiarati in `__meta.cuts`: il passaggio dell'intro a 3,6 s (il marchio arriva al 7,5 % di opacità, sotto la soglia 0,15 del probe, ma per l'occhio è portato) e il cartello finale a 28,1 s. |
| curve | picco 466 px/fotogramma (lo scatto verso la navigazione), con otturatore reale 180° |
| inquadratura | puntatore, telefono, video 01, marchio del footer e logo BRETÌA sempre interi nel fotogramma |

Controllo a occhio sul file codificato: nella v1 il motion blur sui testi in movimento rapido si spezzava in copie
visibili (lo scroll nel telefono, la spinta nel video, la carrellata verso Instagram). Corretto nella v2: `__motion`
ora misura anche il movimento della pagina dentro il telefono e durante gli scroll, e il render usa campioni a 2,5 px.

## 10 · Limiti

- **La luce del cursore è sottile**, come nel sito (15 % di champagne al centro). Nel film è leggibile, ma su schermi
  piccoli o con forte compressione si percepisce appena. Non l'ho intensificata per non alterare il sito.
- **Gli elementi neri del logo BRETÌA** (contorni, scarabocchi, ©) si fondono con il fondo scuro: il logo resta
  pienamente riconoscibile (blu, bianco, corona, lime), ma quei dettagli si vedono appena.
- Il wordmark GLASS è la vettorializzazione potrace usata dal sito, non il vettoriale del designer.
- Il video 01 parte da 1,0 s (il sito lo fa partire da 0); il pannello 02 attende su un suo fotogramma invece del
  poster del sito (vedi §6).
- La bozza è 1080p30. Il 4K60 (`render.py --final`) va renderizzato solo dopo la tua approvazione.

## 11 · Licenza onetake

onetake è distribuito con **PolyForm Noncommercial 1.0.0**: l'uso commerciale non è coperto. Per questo film la
licenza commerciale (onetake Pro, https://onetakemotion.com) o un permesso scritto dell'autore **non risultano
ottenuti**: si è proceduto su tua decisione. La nota di licenza obbligatoria è in `comp/ONETAKE-NOTICE.md`.
