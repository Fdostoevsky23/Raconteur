import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'http://localhost:4321', // ← Change to your real domain when you deploy (e.g., 'https://raconteur.stories')
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [sitemap()],
    vite: {
    build: {
      cssMinify: false
    },
    server: {
      watch: { usePolling: true, interval: 500 }
    }
  }
});