import antfu from '@antfu/eslint-config'
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss'

export default antfu({
  formatters: true,
  react: true,

  pnpm: false,
  ignores: [
    'components/ui/**/*',
    'cloudflare-env.d.ts',
    '.codex/**/*',
  ],
  rules: {
    'no-console': ['error', { allow: ['info', 'table', 'warn', 'error'] }],
  },
}, {
  plugins: {
    'better-tailwindcss': eslintPluginBetterTailwindcss,
  },
  settings: {
    'better-tailwindcss': {
      entryPoint: './app/globals.css',
    },
  },
  rules: {
    ...eslintPluginBetterTailwindcss.configs['recommended-warn'].rules,
    'better-tailwindcss/no-unregistered-classes': 'off',
  },
})
