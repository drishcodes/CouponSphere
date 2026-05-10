import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-redux', '@reduxjs/toolkit'],
          charts: ['recharts'],
          motion: ['framer-motion'],
          realtime: ['socket.io-client', 'axios', '@tanstack/react-query']
        }
      }
    }
  },
  server: {
    port: 5173
  }
});
