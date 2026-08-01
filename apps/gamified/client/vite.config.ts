import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { reactRouter } from '@react-router/dev/vite';
import eslint from "@nabla/vite-plugin-eslint";

// https://vite.dev/config/
export default defineConfig({
  plugins: [reactRouter(), eslint()],
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('../../shared', import.meta.url)),
      '@gamified-client': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 4002,
    strictPort: true
  }
});
