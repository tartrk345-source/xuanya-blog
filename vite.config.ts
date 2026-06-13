import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React 核心单独分包（不常变，利于缓存）
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Markdown 渲染独立分包（只在文章页需要）
          'vendor-markdown': ['react-markdown', 'remark-gfm'],
          // Supabase 独立分包
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 设置 chunk 大小警告阈值
    chunkSizeWarningLimit: 300,
  },
})
