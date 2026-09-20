import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'sync-dist-to-root',
      closeBundle() {
        try {
          const webDist = path.resolve(__dirname, 'dist');
          const rootDist = path.resolve(__dirname, '../../dist');
          if (fs.existsSync(webDist)) {
            fs.cpSync(webDist, rootDist, { recursive: true, force: true });
            console.log('⚡ [Vite] Production bundle synced to root /dist for Vercel');
          }
        } catch (err) {
          console.error('[Vite] Failed to sync dist to root:', err);
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@resqgrid/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    },
  },
});
