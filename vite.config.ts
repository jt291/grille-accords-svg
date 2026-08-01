/**
 * Configures Vite development, preview, testing, and Sites-compatible builds.
 *
 * @packageDocumentation
 */

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const projectRoot = new URL('.', import.meta.url).pathname

export default defineConfig({
  root: projectRoot,
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: 'dist/client',
  },
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
