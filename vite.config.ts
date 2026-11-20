import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 5000,
    host: '0.0.0.0',
    allowedHosts: true,
    // Teams renders the app in an iframe; these hosts must be allowed to frame it.
    headers: {
      'Content-Security-Policy':
        "frame-ancestors 'self' https://teams.microsoft.com https://*.teams.microsoft.com https://*.skype.com",
    },
    proxy: {
      // Forward /api calls to the Express backend so the browser never needs a
      // cross-origin URL. Set VITE_API_URL="" to enable live mode once the
      // backend is running.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
