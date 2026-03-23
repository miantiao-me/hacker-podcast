import { describe, expect, it } from 'vitest'
import { createLLMClient, getDefaultModel, getThinkingModel } from '../llm'

describe('createLLMClient', () => {
  it('creates OpenAI client by default', () => {
    const client = createLLMClient({
      OPENAI_BASE_URL: 'https://api.openai.com/v1',
      OPENAI_API_KEY: 'sk-test',
    })
    expect(client).toBeDefined()
    expect(typeof client).toBe('function')
  })

  it('creates MiniMax client when LLM_PROVIDER=minimax', () => {
    const client = createLLMClient({
      LLM_PROVIDER: 'minimax',
      MINIMAX_API_KEY: 'minimax-test-key',
    })
    expect(client).toBeDefined()
    expect(typeof client).toBe('function')
  })

  it('uses MINIMAX_API_KEY when provider is minimax', () => {
    const client = createLLMClient({
      LLM_PROVIDER: 'minimax',
      MINIMAX_API_KEY: 'minimax-key',
      OPENAI_API_KEY: 'openai-key',
    })
    expect(client).toBeDefined()
  })

  it('falls back to OPENAI_API_KEY when MINIMAX_API_KEY is not set', () => {
    const client = createLLMClient({
      LLM_PROVIDER: 'minimax',
      OPENAI_API_KEY: 'openai-key',
    })
    expect(client).toBeDefined()
  })

  it('respects custom OPENAI_BASE_URL even with minimax provider', () => {
    const client = createLLMClient({
      LLM_PROVIDER: 'minimax',
      OPENAI_BASE_URL: 'https://custom.proxy.io/v1',
      MINIMAX_API_KEY: 'minimax-key',
    })
    expect(client).toBeDefined()
  })
})

describe('getDefaultModel', () => {
  it('returns gpt-4.1 by default', () => {
    expect(getDefaultModel({})).toBe('gpt-4.1')
  })

  it('returns MiniMax-M2.7 for minimax provider', () => {
    expect(getDefaultModel({ LLM_PROVIDER: 'minimax' })).toBe('MiniMax-M2.7')
  })

  it('respects explicit OPENAI_MODEL override', () => {
    expect(getDefaultModel({
      LLM_PROVIDER: 'minimax',
      OPENAI_MODEL: 'MiniMax-M2.5-highspeed',
    })).toBe('MiniMax-M2.5-highspeed')
  })

  it('respects OPENAI_MODEL for default provider', () => {
    expect(getDefaultModel({
      OPENAI_MODEL: 'gpt-4o',
    })).toBe('gpt-4o')
  })
})

describe('getThinkingModel', () => {
  it('returns gpt-4.1 by default', () => {
    expect(getThinkingModel({})).toBe('gpt-4.1')
  })

  it('returns MiniMax-M2.7 for minimax provider', () => {
    expect(getThinkingModel({ LLM_PROVIDER: 'minimax' })).toBe('MiniMax-M2.7')
  })

  it('prefers OPENAI_THINKING_MODEL over OPENAI_MODEL', () => {
    expect(getThinkingModel({
      OPENAI_THINKING_MODEL: 'o1',
      OPENAI_MODEL: 'gpt-4.1',
    })).toBe('o1')
  })

  it('falls back to OPENAI_MODEL when OPENAI_THINKING_MODEL is not set', () => {
    expect(getThinkingModel({
      OPENAI_MODEL: 'gpt-4.1',
    })).toBe('gpt-4.1')
  })

  it('falls back to provider default when no model env is set', () => {
    expect(getThinkingModel({
      LLM_PROVIDER: 'minimax',
    })).toBe('MiniMax-M2.7')
  })
})
