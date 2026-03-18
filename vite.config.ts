import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  /* proxy removed — VITE_BACKEND_URL env variable handles this now
  server: {
    proxy: {
      "/api": {
        target: "https://transaction-enrichment-pipeline.onrender.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, "")
      }
    }
  }
    */
});

