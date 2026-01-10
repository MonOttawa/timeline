/* eslint-env node */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const rawPocketbase = (env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090').trim()
  const pocketbaseTarget = rawPocketbase
    .replace(/\/api\/?$/, '')
    .replace(/\/$/, '')
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: pocketbaseTarget,
          changeOrigin: true,
          ws: true,
          secure: false,
        }
      }
    }
  }
})
