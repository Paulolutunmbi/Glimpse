import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const productionFrontendUrl = 'https://glimpse-theta-swart.vercel.app'

const stripLibraryLocalFallbackFromProductionBundle = (mode) => ({
  name: 'strip-library-local-fallback-from-production-bundle',
  renderChunk(code) {
    if (mode !== 'production') return null
    const productionFrontendHost = new URL(productionFrontendUrl).hostname
    return {
      code: code
        .replaceAll('http://localhost', productionFrontendUrl)
        .replaceAll('localhost', productionFrontendHost),
      map: null,
    }
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const devApiUrl = env.VITE_API_URL || 'http://localhost:5000'

  return {
    plugins: [react(), stripLibraryLocalFallbackFromProductionBundle(mode)],
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
