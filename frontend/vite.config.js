import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Bereikbaar op het lokale netwerk, zodat de QR-codes met een telefoon werken.
    host: true,
    // API-verzoeken via de dev-server naar de backend sturen.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
