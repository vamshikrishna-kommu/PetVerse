import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

import os from 'os';

function getBackendTarget() {
  if (process.env.VITE_BACKEND_URL) return process.env.VITE_BACKEND_URL;
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return `http://${iface.address}:3000`;
      }
    }
  }
  return 'http://127.0.0.1:3000';
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@petverse/shared-types': path.resolve(__dirname, '../../packages/shared-types/src/index.ts'),
      '@petverse/shared-constants': path.resolve(
        __dirname,
        '../../packages/shared-constants/src/index.ts'
      ),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: getBackendTarget(),
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react';
          }
          if (id.includes('node_modules/react-router')) return 'router';
          if (id.includes('node_modules/@tanstack')) return 'query';
          if (id.includes('node_modules/framer-motion')) return 'framer';
          if (id.includes('node_modules/lucide-react')) return 'icons';
        },
      },
    },
  },
});
