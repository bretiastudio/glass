/**
 * The /visita tour: one 360° panorama with a checkpoint per point of interest.
 * The camera stays still on a place and, when the next checkpoint is reached,
 * turns to it in one quick move.
 *
 * PROTOTYPE. The panorama is not GLASS: it is a free test image (CC0) that stands in
 * until the venue is photographed. The texts marked `placeholder` describe what the
 * owner should write there; they are not facts about GLASS.
 *
 * Directions are compass bearings in degrees, clockwise from north: 0 north (the bar),
 * 90 east, 180 south, -90 west. They are not wrapped: the camera turns from one number
 * to the next, so going from -90 (west) to 90 (east) sweeps past the bar at 0.
 * `north` says where north is in the panorama image (its yaw; 0 = centre of the image).
 * `pitch` looks up as it grows; `zoom` below 1 moves closer.
 *
 * With a new panorama: run tools/tour/prepare_pano.py, set `north` to the bar, then
 * fine-tune the bearings (open /visita?hud to read them while scrolling).
 */
export type CompassPoint = 'N' | 'E' | 'S' | 'O';

export interface TourStop {
  id: string;
  point: CompassPoint;
  label: string;
  title: string;
  text: string;
  bearing: number;
  pitch: number;
  zoom: number;
  placeholder: boolean;
}

export const POINT_NAMES: Record<CompassPoint, string> = { N: 'Nord', E: 'Est', S: 'Sud', O: 'Ovest' };

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
  /** Yaw of north (the bar) in the panorama image. */
  north: 110,
  /** The opening view, behind the wordmark. */
  start: { point: 'N' as CompassPoint, bearing: 0, pitch: 2, zoom: 1 },
  stops: [
    {
      id: 'bancone',
      point: 'N',
      label: 'Il bancone',
      title: 'Dove nasce ogni drink.',
      text: 'La mixology: i cocktail della casa, gli ingredienti, il modo di lavorare. Qui può comparire anche un link al menu.',
      bearing: 0,
      pitch: 3,
      zoom: 0.86,
      placeholder: true,
    },
    {
      id: 'sala-ovest',
      point: 'O',
      label: 'Sala ovest',
      title: 'La sala ovest.',
      text: 'Com’è questa sala e per che cosa è pensata: i tavoli, i posti, la luce. Qui può andare anche «Chi siamo».',
      bearing: -90,
      pitch: 0,
      zoom: 1,
      placeholder: true,
    },
    {
      id: 'sala-est',
      point: 'E',
      label: 'Sala est',
      title: 'La sala est.',
      text: 'Che cosa la distingue dall’altra sala, e quando è il momento giusto per sedersi qui. Qui può andare anche «La nostra storia».',
      bearing: 90,
      pitch: 2,
      zoom: 1,
      placeholder: true,
    },
    {
      id: 'fuori',
      point: 'S',
      label: 'Fuori, i divanetti',
      title: 'Fuori, sui divanetti.',
      text: 'Lo spazio all’aperto: i divanetti, le serate d’estate, quanti posti ci sono e se si può prenotare.',
      bearing: 180,
      pitch: 0,
      zoom: 1,
      placeholder: true,
    },
  ] satisfies TourStop[],
} as const;
