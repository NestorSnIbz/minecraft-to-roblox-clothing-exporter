import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  ssgOptions: {
    formatting: 'minify',
    includedRoutes(paths: string[]) {
      return paths.filter((path: string) => !path.includes('/share/'));
    },
  },
} as any)
