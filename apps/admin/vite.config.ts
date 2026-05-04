/** Do not add `vite.config.js` here — Vite prefers `.js` over `.ts` and would skip this proxy. */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, '');
  const apiProxyTarget = env.VITE_DEV_API_PROXY || 'http://127.0.0.1:4000';

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(root, './src') },
    },
    server: {
      port: 5174,
      strictPort: false,
      host: true,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, '') || '/',
        },
      },
    },
    preview: {
      port: 5174,
      strictPort: false,
      host: true,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, '') || '/',
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  };
});
