import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProductionBuild = mode === 'production'
  const serviceUrls = [
    ['VITE_API_URL', env.VITE_API_URL],
    ['VITE_SOCKET_URL', env.VITE_SOCKET_URL],
  ]

  if (isProductionBuild) {
    for (const [name, value] of serviceUrls) {
      if (!value) {
        throw new Error(`${name} must be configured for production builds.`)
      }
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(value)) {
        throw new Error(`${name} cannot point to localhost in a production build.`)
      }
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
    },
  }
})