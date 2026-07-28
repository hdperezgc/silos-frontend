import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const RAILWAY_BACKEND_URL = 'https://silos-backend-production-3c9f.up.railway.app'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: RAILWAY_BACKEND_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
