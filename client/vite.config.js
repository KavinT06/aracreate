import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.VITE_PORT || 5173),
    proxy: {
      '/api': `http://localhost:${Number(process.env.CHATAPP_API_PORT || 5000)}`,
      '/socket.io': {
        target: `http://localhost:${Number(process.env.CHATAPP_API_PORT || 5000)}`,
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
