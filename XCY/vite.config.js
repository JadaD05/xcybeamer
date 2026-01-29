import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // <-- allows access from other devices on your network
    port: 5173, // optional, you can change if needed
    allowedHosts: true
  }
})
