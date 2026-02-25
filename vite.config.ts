import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cloudflare } from '@cloudflare/vite-plugin'
import vinext from 'vinext'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    vinext(),
    cloudflare({
      viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
      remoteBindings: true,
    }),
  ],
  resolve: {
    alias: [
      {
        // @vidstack/react uses non-standard export conditions (worker/development/default)
        // that Vite's commonjs resolver can't handle; point directly to the production entry
        find: /^@vidstack\/react$/,
        replacement: path.resolve(__dirname, 'node_modules/@vidstack/react/prod/vidstack.js'),
      },
    ],
  },
})
