/**
 * The /visita tour: one 360° panorama, turned by scrolling, with a stop per section.
 *
 * PROTOTYPE. The panorama is not GLASS: it is a free test image (CC0) that stands in
 * until the venue is photographed. The texts marked `placeholder` describe what the
 * owner should write there; they are not facts about GLASS.
 *
 * Headings: `yaw` turns right as it grows (0 = centre of the panorama image),
 * `pitch` looks up as it grows. Both in degrees. Yaw must keep growing from stop to
 * stop so the room always turns the same way; the tour ends at `endYaw`, so a full
 * turn is `stops[0].yaw + 360`.
 *
 * With a new panorama: run tools/tour/prepare_pano.py, then retune the headings
 * here (open /visita?hud to read the current heading while scrolling).
 */
export interface TourStop {
  id: string;
  label: string;
  title: string;
  text: string;
  yaw: number;
  pitch: number;
  placeholder: boolean;
}

export const TOUR = {
  panorama: {
    small: '/tour/pano-2048.jpg',
    large: '/tour/pano-4096.jpg',
    posterPortrait: '/tour/poster-portrait.webp',
    posterLandscape: '/tour/poster-landscape.webp',
    credit: {
      name: 'Cowboy Town Saloon',
      author: 'Dimitrios Savva, Jarod Guest',
      source: 'Poly Haven',
      url: 'https://polyhaven.com/a/cowboy_town_saloon',
      licence: 'CC0',
    },
  },
  /** Heading at the very end of the page: one full turn after the first stop. */
  endYaw: 210,
  stops: [
    {
      id: 'chi-siamo',
      label: 'Chi siamo',
      title: 'Le persone dietro il bancone.',
      text: 'Chi è GLASS, chi lo guida e che cosa lo rende diverso. Due o tre frasi, con la voce del locale.',
      yaw: -95,
      pitch: 2,
      placeholder: true,
    },
    {
      id: 'storia',
      label: 'La nostra storia',
      title: 'Come è nato GLASS.',
      text: "Quando avete aperto, perché, che cosa è cambiato da allora. Un momento che racconta il posto meglio di un elenco.",
      yaw: -10,
      pitch: 0,
      placeholder: true,
    },
    {
      id: 'bancone',
      label: 'Il bancone',
      title: 'Dove nasce ogni drink.',
      text: 'La mixology: i cocktail della casa, gli ingredienti, il modo di lavorare. Qui può comparire anche un link al menu.',
      yaw: 110,
      pitch: 3,
      placeholder: true,
    },
    {
      id: 'atmosfera',
      label: 'Atmosfera',
      title: 'Dove ogni riflesso diventa atmosfera.',
      text: 'Com’è una serata da GLASS: la luce, la musica, il momento migliore per venire.',
      yaw: 195,
      pitch: 4,
      placeholder: true,
    },
  ] satisfies TourStop[],
  /** The opening view, before the first stop. */
  start: { yaw: -150, pitch: 0 },
} as const;
