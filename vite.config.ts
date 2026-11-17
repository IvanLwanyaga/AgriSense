
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Authentication and Functions emulators are configured independently.
  const useFunctionsEmulator =
    env.VITE_USE_FUNCTIONS_EMULATOR === 'true'

  const projectId = env.VITE_FIREBASE_PROJECT_ID

  if (!useFunctionsEmulator && !projectId) {
    throw new Error(
      'Set VITE_FIREBASE_PROJECT_ID in .env to use cloud Firebase Functions.'
    )
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: useFunctionsEmulator
            ? 'http://127.0.0.1:5001'
            : `https://europe-west1-${projectId}.cloudfunctions.net`,

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
