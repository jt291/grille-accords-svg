import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const projectRoot = new URL('.', import.meta.url).pathname

export default defineConfig({
  root: projectRoot,
  plugins: [react()],
  publicDir: false,
  server: {
    port: 4317,
    strictPort: true,
    open: '/',
  },
  preview: {
    port: 4318,
    strictPort: true,
    open: '/',
  },
})
