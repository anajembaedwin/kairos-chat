import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    define: {
      'process.env.VITE_SERVER_URL': JSON.stringify(env.VITE_SERVER_URL),
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': { target: 'http://localhost:3001', changeOrigin: true },
        '/socket.io': { target: 'http://localhost:3001', ws: true },
      },
    },
  }
})
