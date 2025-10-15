import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://talentism.com',
  output: 'static',
  build: {
    format: 'directory'
  }
});