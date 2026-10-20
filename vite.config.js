import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { chatMiddleware } from './server/vite-chat.js';
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  return {
  plugins: [react(), tailwindcss(), {
    name: 'hich-development-pages',
    configureServer(server) {
      server.middlewares.use(chatMiddleware(env));
      server.middlewares.use((req, res, next) => {
        if (req.url && /\.html(?:\?|$)/.test(req.url) && !req.url.startsWith('/public/')) req.url = '/index.html';
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(chatMiddleware(env));
    },
  }],
  build: { outDir: 'dist', target: 'es2020', sourcemap: false },
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
  };
});
