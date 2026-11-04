/**
 * Single source of truth for business information.
 * Only verified data goes here. A `null` value is rendered nowhere on the site,
 * so missing information never turns into invented content.
 */
export const SITE = {
  name: 'GLASS',
  tagline: 'Cocktail lounge',
  city: 'Rende',
  region: 'Calabria',
  locale: 'it_IT',
  instagram: {
    handle: 'glass_rende',
    url: 'https://www.instagram.com/glass_rende',
  },
  // TODO(owner): provide verified details. Each one appears automatically once set.
  contact: {
    address: null as string | null,
    phone: null as string | null,
    email: null as string | null,
  },
  // TODO(owner): required by Italian law on a business website (art. 35 DPR 633/1972).
  legal: {
    companyName: null as string | null,
    vatNumber: null as string | null,
  },
} as const;
