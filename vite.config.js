import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(
      // Tailwind v4 sử dụng content ở đây
      // Hoặc để mặc định, v4 auto-scan src/
    )
  ],
  // '@/' = src/ — đường dẫn tắt mà linh kiện shadcn/ui (src/components/ui, sinh bằng "npx shadcn add") dùng để nhập lẫn nhau.
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    proxy: {
    '/api': { target: 'https://musiclounge-api.azurewebsites.net', changeOrigin: true },
    '/uploads': { target: 'https://musiclounge-api.azurewebsites.net', changeOrigin: true },
    '/hubs': { target: 'https://musiclounge-api.azurewebsites.net', changeOrigin: true, ws: true },
    }
  }
})
