import { describe, expect, it } from 'vitest'
import { createLLMClient, getDefaultModel, getThinkingModel } from '../llm'

describe('minimax LLM integration', () => {
  const apiKey = process.env.MINIMAX_API_KEY
  const shouldRun = !!apiKey

  it.skipIf(!shouldRun)('creates a working MiniMax LLM client', async () => {
    const client = createLLMClient({
      LLM_PROVIDER: 'minimax',
      MINIMAX_API_KEY: apiKey,
    })
    const model = getDefaultModel({ LLM_PROVIDER: 'minimax' })
    expect(model).toBe('MiniMax-M2.7')

    const modelInstance = client(model)
    expect(modelInstance).toBeDefined()
    expect(modelInstance.modelId).toBe('MiniMax-M2.7')
  })

  it.skipIf(!shouldRun)('supports custom model override', () => {
    const model = getDefaultModel({
      LLM_PROVIDER: 'minimax',
      OPENAI_MODEL: 'MiniMax-M2.5-highspeed',
    })
    expect(model).toBe('MiniMax-M2.5-highspeed')

    const client = createLLMClient({
      LLM_PROVIDER: 'minimax',
      MINIMAX_API_KEY: apiKey,
    })
    const modelInstance = client(model)
    expect(modelInstance.modelId).toBe('MiniMax-M2.5-highspeed')
  })

  it.skipIf(!shouldRun)('thinking model falls back correctly', () => {
    const thinking = getThinkingModel({ LLM_PROVIDER: 'minimax' })
    expect(thinking).toBe('MiniMax-M2.7')

    const thinkingWithOverride = getThinkingModel({
      LLM_PROVIDER: 'minimax',
      OPENAI_THINKING_MODEL: 'MiniMax-M2.5',
    })
    expect(thinkingWithOverride).toBe('MiniMax-M2.5')
  })
})
