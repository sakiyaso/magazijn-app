import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const proxy = { '/api': 'http://localhost:3000' }
const allowedHosts = ['.trycloudflare.com', 'ts.net']


// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { host: true, proxy, allowedHosts },
  preview: { host: true, port: 4173, proxy, allowedHosts },
})
