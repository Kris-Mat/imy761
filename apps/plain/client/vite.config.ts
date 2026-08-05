import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { reactRouter } from '@react-router/dev/vite';
import eslint from "@nabla/vite-plugin-eslint";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // @nabla/vite-plugin-eslint sets apply: 'serve' internally, but its ESLint
  // worker_threads.Worker is never terminated anywhere in the plugin. Under
  // this project's vite@8 (Rolldown-Vite), that apply guard isn't honored
  // during `vite build`, so the untorn-down worker keeps the process alive
  // forever after the build itself finishes. Gate it here instead so it's
  // never added to the plugin list outside dev.
  plugins: [reactRouter(), ...(command === 'serve' ? [eslint()] : [])],
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('../../shared', import.meta.url)),
      '@plain-client': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 4001,
    strictPort: true
  }
}));
