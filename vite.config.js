import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const productionFrontendUrl = 'https://glimpse-theta-swart.vercel.app'

const stripLocalhostFromProductionBundle = (mode) => ({
  name: 'strip-localhost-from-production-bundle',
  renderChunk(code) {
    if (mode !== 'production') return null
    return {
      code: code
        .replaceAll('http://localhost', productionFrontendUrl)
        .replaceAll('localhost', new URL(productionFrontendUrl).hostname),
      map: null,
    }
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const devApiUrl = env.VITE_API_URL || 'http://localhost:5000'

  return {
    plugins: [react(), stripLocalhostFromProductionBundle(mode)],
    server: {
      proxy: {
        '/api': {
          target: devApiUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
