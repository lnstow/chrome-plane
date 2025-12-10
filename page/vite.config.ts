import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './', // ensure assets are referenced with relative paths for extensions
  plugins: [react()],
})
