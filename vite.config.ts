
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const useFunctionsEmulator =
    env.VITE_USE_FUNCTIONS_EMULATOR === 'true'

  const projectId = env.VITE_FIREBASE_PROJECT_ID
  const renderApiUrl = env.VITE_RENDER_API_URL

  if (!useFunctionsEmulator && !projectId) {
    throw new Error(
      'Set VITE_FIREBASE_PROJECT_ID in .env to use cloud Firebase Functions.'
    )
  }

  if (!renderApiUrl) {
    throw new Error(
      'Set VITE_RENDER_API_URL in .env to use the Render API.'
    )
  }

  const firebaseFunctionsTarget = useFunctionsEmulator
    ? 'http://127.0.0.1:5001'
    : `https://europe-west1-${projectId}.cloudfunctions.net`

  return {
    plugins: [react()],
    server: {
      proxy: {
        // BCTB prediction now runs on Render.
        '/api/predictResearchBctb': {
          target: renderApiUrl,
          changeOrigin: true,
        },

        // Other API endpoints remain on Firebase Functions.
        '/api': {
          target: firebaseFunctionsTarget,
          changeOrigin: !useFunctionsEmulator,
          rewrite: (path) =>
            useFunctionsEmulator
              ? path.replace(
                  /^\/api/,
                  '/demo-agrisense-local/europe-west1'
                )
              : path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
