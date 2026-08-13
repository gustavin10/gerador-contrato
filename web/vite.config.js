import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Em desenvolvimento o front chama "/api/..." e o Vite repassa para a API
    // local. Assim o código não precisa saber a URL da API em dev — e em
    // produção basta apontar VITE_API_URL para a Railway.
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
    },
  },
});
