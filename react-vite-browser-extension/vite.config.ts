import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, existsSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-manifest',
      writeBundle() {
        const manifestSrc = resolve(__dirname, 'public/manifest.json')
        const manifestDest = resolve(__dirname, 'dist/manifest.json')
        if (existsSync(manifestSrc)) {
          copyFileSync(manifestSrc, manifestDest)
        }
      }
    }
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        background: resolve(__dirname, 'src/background/background.ts'),
        content: resolve(__dirname, 'src/content/content.ts')
      },
      output: {
        entryFileNames: (chunk) => {
          return chunk.name === 'popup' ? 'assets/[name]-[hash].js' : '[name].js'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'development'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@popup': resolve(__dirname, 'src/popup'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@components': resolve(__dirname, 'src/popup/components')
    }
  },
  server: {
    hmr: {
      port: 5174
    }
  }
})