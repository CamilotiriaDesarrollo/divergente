import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// IMPORTANTE: el puerto de proxy.target DEBE coincidir con el PORT del server
// (server/src/index.ts usa 3000 por defecto). Desalinearlos rompe /api en dev.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Separa vendors pesados en chunks cacheables; elimina el warning de chunk >500 kB.
        // Ajustar la lista a las libs reales del proyecto (ej. quitar leaflet si no se usa).
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          leaflet: ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
})
