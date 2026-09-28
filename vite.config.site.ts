import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte({
      configFile: resolve(import.meta.dirname, 'svelte.config.js'),
    }),
  ],
  base: process.env.BASE_PATH || './',
  root: resolve(import.meta.dirname, 'src/site'),
  publicDir: resolve(import.meta.dirname, 'public'),
  build: {
    outDir: resolve(import.meta.dirname, 'dist-site'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'src/site/index.html'),
        notfound: resolve(import.meta.dirname, 'src/site/404.html'),
      },
    },
  },
});
