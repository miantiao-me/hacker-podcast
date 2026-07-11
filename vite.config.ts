import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { cdnAdapter } from '@vinext/cloudflare/cache/cdn-adapter'
import { kvDataAdapter } from '@vinext/cloudflare/cache/kv-data-adapter'
import vinext from 'vinext'
import { defineConfig } from 'vite'

export default defineConfig({
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  plugins: [
    tailwindcss(),
    vinext({
      cache: {
        cdn: cdnAdapter(),
        data: kvDataAdapter({ binding: 'HACKER_PODCAST_KV', appPrefix: 'vinext' }),
      },
    }),
    cloudflare({
      viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
      remoteBindings: true,
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
})
