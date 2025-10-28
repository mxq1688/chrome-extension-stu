import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { copyFileSync, existsSync, mkdirSync } from 'fs'

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    {
      name: 'copy-manifest',
      writeBundle() {
        const manifestSrc = resolve(__dirname, 'public/manifest.json')
        const manifestDest = resolve(__dirname, 'dist/manifest.json')
        if (existsSync(manifestSrc)) {
          copyFileSync(manifestSrc, manifestDest)
        }
      }
    },
    {
      name: 'copy-html-files',
      writeBundle() {
        // 复制 offscreen.html 到根目录
        const offscreenSrc = resolve(__dirname, 'src/offscreen/offscreen.html')
        const offscreenDest = resolve(__dirname, 'dist/offscreen.html')
        if (existsSync(offscreenSrc)) {
          copyFileSync(offscreenSrc, offscreenDest)
        }
        
        // 复制 permission-helper.html 到根目录
        const permissionSrc = resolve(__dirname, 'src/permission/permission-helper.html')
        const permissionDest = resolve(__dirname, 'dist/permission-helper.html')
        if (existsSync(permissionSrc)) {
          copyFileSync(permissionSrc, permissionDest)
        }
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        background: resolve(__dirname, 'src/background/background.js'),
        content: resolve(__dirname, 'src/content/content.js'),
        'service-worker': resolve(__dirname, 'src/service-worker.js'),
        'offscreen': resolve(__dirname, 'src/offscreen/offscreen.js'),
        'permission-helper': resolve(__dirname, 'src/permission/permission-helper.js')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // 对于 service-worker 和 offscreen/permission 相关文件，保持固定名称
          if (chunkInfo.name === 'service-worker') return 'service-worker.js'
          if (chunkInfo.name === 'offscreen') return 'offscreen.js'
          if (chunkInfo.name === 'permission-helper') return 'permission-helper.js'
          return '[name].js'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // 对于 offscreen.js 和 permission-helper.js，保持固定名称
          if (assetInfo.name === 'offscreen.js') return 'offscreen.js'
          if (assetInfo.name === 'permission-helper.js') return 'permission-helper.js'
          return 'assets/[name]-[hash].[ext]'
        }
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})