import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // 本地开发时把 /api/supabase 转发到真实 Supabase（生产由 Vercel Edge Function 处理）
  server: {
    proxy: {
      '/api/supabase': {
        target: 'https://twuvrrfzlynhehdxxtid.supabase.co',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/supabase/, ''),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/react-markdown') || id.includes('node_modules/remark-gfm')) {
            return 'vendor-markdown'
          }
        },
      },
    },
    cssCodeSplit: true,
    chunkSizeWarningLimit: 300,
  },
})
