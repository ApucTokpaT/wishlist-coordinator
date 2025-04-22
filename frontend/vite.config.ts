// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // --- ВОТ ЭТА СЕКЦИЯ ДОБАВЛЕНА ---
  server: {
    proxy: {
      // Запросы, начинающиеся с '/api', будут перенаправлены на бэкенд
      '/api': {
        target: 'http://localhost:3001', // Адрес вашего бэкенда
        changeOrigin: true, // Важно для корректной работы прокси
      }
    }
    // Можно добавить порт для vite, если нужно
    // port: 5173 
  }
  // ------------------------------
})