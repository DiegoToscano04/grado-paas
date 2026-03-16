import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // Las peticiones de K8s van a Python (MS-03)
      '/api/k8s': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      // El resto de la API va a Java (MS-01)
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      }
    }
  }
})