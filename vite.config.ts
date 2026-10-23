import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'
import fs from 'fs'

let appVersion = '0.4.0'
try {
  const pkgContent = fs.readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
  const pkg = JSON.parse(pkgContent)
  appVersion = pkg.version || '0.4.0'
} catch {
  appVersion = '0.4.0'
}

let commitHash = 'dev'
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim()
} catch {
  commitHash = 'unknown'
}

const buildDate = new Date().toISOString().replace('T', ' ').substring(0, 16)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    {
      name: 'network-request-logger',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const ip = req.socket.remoteAddress || 'unknown';
          console.log(`[NET-INBOUND] ${ip} ${req.method} ${req.url}`);
          next();
        });
      },
    },
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    cors: true,
    strictPort: true,
    allowedHosts: true,
  },
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __BUILD_DATE__: JSON.stringify(buildDate),
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
})
