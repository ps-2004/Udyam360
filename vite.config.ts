import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // Frontend calls its own FastAPI backend through this development proxy.
      hmr: false,
      watch: null,
      proxy: {
        '/api': { target: process.env.FASTAPI_URL || 'http://127.0.0.1:8000', changeOrigin: true },
        '/health': { target: process.env.FASTAPI_URL || 'http://127.0.0.1:8000', changeOrigin: true },
      },
    },
  };
});
