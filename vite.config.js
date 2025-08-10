import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { crx } from '@crxjs/vite-plugin'
import manifest from './src/manifest.json'

export default defineConfig({
  plugins: [vue(), crx({ manifest })],
  build: {
    rollupOptions: {
      input: {
        // 明確指定入口點
        'content-script': 'src/content-script.js',
        'main': 'src/main.js'
      },
      output: {
        // 保持檔案結構
        entryFileNames: 'src/[name].js',
        chunkFileNames: 'src/[name].js',
        assetFileNames: 'src/[name].[ext]'
      }
    }
  }
})