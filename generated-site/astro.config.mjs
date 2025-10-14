import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://viral-strategies.com',
  compressHTML: true,
  build: {
    inlineStylesheets: 'always'
  }
});