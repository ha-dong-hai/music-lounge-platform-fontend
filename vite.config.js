import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(
      // Tailwind v4 sử dụng content ở đây
      // Hoặc để mặc định, v4 auto-scan src/
    )
  ],
  server: {
    proxy: {
    '/api': { target: 'https://musiclounge-api.azurewebsites.net', changeOrigin: true },
    '/uploads': { target: 'https://musiclounge-api.azurewebsites.net', changeOrigin: true },
    '/hubs': { target: 'https://musiclounge-api.azurewebsites.net', changeOrigin: true, ws: true },
    }
  }
})
