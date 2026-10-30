// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Set to the production domain once it is known (used for canonical/OG URLs).
  // site: 'https://www.example.it',
  build: {
    // The whole stylesheet is small; inlining removes a render-blocking request.
    inlineStylesheets: 'always',
  },
});
