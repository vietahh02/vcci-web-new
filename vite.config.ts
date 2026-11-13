import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  // DEV_PROXY_TARGET (e.g. in .env.development.local): forward /api to a remote backend that has no CORS for localhost
  const target = loadEnv(mode, process.cwd(), '').DEV_PROXY_TARGET
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { port: 5180, proxy: target ? { '/api': { target, changeOrigin: true, secure: true } } : undefined },
  }
})
