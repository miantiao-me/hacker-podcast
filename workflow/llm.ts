import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

interface LLMEnv {
  LLM_PROVIDER?: string
  OPENAI_BASE_URL?: string
  OPENAI_API_KEY?: string
  MINIMAX_API_KEY?: string
  OPENAI_MODEL?: string
  OPENAI_THINKING_MODEL?: string
}

interface ProviderPreset {
  baseURL: string
  defaultModel: string
}

const providerPresets: Record<string, ProviderPreset> = {
  minimax: {
    baseURL: 'https://api.minimax.io/v1',
    defaultModel: 'MiniMax-M2.7',
  },
}

export function createLLMClient(env: LLMEnv) {
  const provider = env.LLM_PROVIDER || 'openai'
  const preset = providerPresets[provider]
  const baseURL = env.OPENAI_BASE_URL || preset?.baseURL || 'https://api.openai.com/v1'
  const apiKey = (provider === 'minimax' && env.MINIMAX_API_KEY) || env.OPENAI_API_KEY

  return createOpenAICompatible({
    name: provider,
    baseURL,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })
}

export function getDefaultModel(env: LLMEnv) {
  const provider = env.LLM_PROVIDER || 'openai'
  const preset = providerPresets[provider]
  return env.OPENAI_MODEL || preset?.defaultModel || 'gpt-4.1'
}

export function getThinkingModel(env: LLMEnv) {
  const provider = env.LLM_PROVIDER || 'openai'
  const preset = providerPresets[provider]
  return env.OPENAI_THINKING_MODEL || env.OPENAI_MODEL || preset?.defaultModel || 'gpt-4.1'
}
