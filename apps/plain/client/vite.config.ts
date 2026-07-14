import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import eslint from "@nabla/vite-plugin-eslint";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), eslint()],
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
});
