import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function copyFolderPlugin() {
  return {
    name: 'copy-presentations-folder',
    closeBundle() {
      const src = path.resolve(process.cwd(), 'presentations-executive-8c9f')
      const dest = path.resolve(process.cwd(), 'dist/presentations-executive-8c9f')
      if (fs.existsSync(src)) {
        fs.cpSync(src, dest, { recursive: true })
        console.log(`\n[Vite Plugin] Copied presentations to ${dest}\n`)
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyFolderPlugin()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
