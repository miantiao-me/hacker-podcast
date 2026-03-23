import { describe, expect, it, vi } from 'vitest'

// Mock external dependencies before importing
vi.mock('@echristian/edge-tts', () => ({
  synthesize: vi.fn().mockResolvedValue({ audio: new Blob(['audio'], { type: 'audio/mpeg' }) }),
}))

vi.mock('ofetch', () => ({
  $fetch: vi.fn().mockResolvedValue({
    data: { audio: '48656c6c6f' },
    base_resp: { status_msg: 'success' },
  }),
}))

describe('tts provider selection', () => {
  it('defaults to edge TTS when no provider specified', async () => {
    const { default: synthesize } = await import('../tts')
    const env = {} as Record<string, string>
    // Should not throw - edge TTS mock is set up
    const result = await synthesize('test', '男', env as never)
    expect(result).toBeDefined()
  })

  it('selects minimax when TTS_PROVIDER=minimax', async () => {
    const { $fetch } = await import('ofetch')
    const { default: synthesize } = await import('../tts')
    const env = {
      TTS_PROVIDER: 'minimax',
      TTS_API_KEY: 'test-key',
    } as Record<string, string>
    const result = await synthesize('test', '男', env as never)
    expect(result).toBeDefined()
    expect($fetch).toHaveBeenCalled()
  })

  it('uses correct MiniMax API URL without GroupId when TTS_API_ID is not set', async () => {
    const { $fetch } = await import('ofetch')
    const { default: synthesize } = await import('../tts')
    vi.mocked($fetch).mockClear()

    const env = {
      TTS_PROVIDER: 'minimax',
      TTS_API_KEY: 'test-key',
    } as Record<string, string>
    await synthesize('test', '女', env as never)

    const calledUrl = vi.mocked($fetch).mock.calls[0]?.[0] as string
    expect(calledUrl).toBe('https://api.minimax.io/v1/t2a_v2')
    expect(calledUrl).not.toContain('GroupId')
  })

  it('appends GroupId when TTS_API_ID is set', async () => {
    const { $fetch } = await import('ofetch')
    const { default: synthesize } = await import('../tts')
    vi.mocked($fetch).mockClear()

    const env = {
      TTS_PROVIDER: 'minimax',
      TTS_API_KEY: 'test-key',
      TTS_API_ID: 'group-123',
    } as Record<string, string>
    await synthesize('test', '男', env as never)

    const calledUrl = vi.mocked($fetch).mock.calls[0]?.[0] as string
    expect(calledUrl).toBe('https://api.minimax.io/v1/t2a_v2?GroupId=group-123')
  })

  it('uses speech-2.8-hd as default TTS model', async () => {
    const { $fetch } = await import('ofetch')
    const { default: synthesize } = await import('../tts')
    vi.mocked($fetch).mockClear()

    const env = {
      TTS_PROVIDER: 'minimax',
      TTS_API_KEY: 'test-key',
    } as Record<string, string>
    await synthesize('test', '男', env as never)

    const body = vi.mocked($fetch).mock.calls[0]?.[1]?.body as string
    const parsed = JSON.parse(body)
    expect(parsed.model).toBe('speech-2.8-hd')
  })

  it('selects correct voice by gender', async () => {
    const { $fetch } = await import('ofetch')
    const { default: synthesize } = await import('../tts')

    vi.mocked($fetch).mockClear()
    const env = {
      TTS_PROVIDER: 'minimax',
      TTS_API_KEY: 'test-key',
    } as Record<string, string>

    await synthesize('test', '男', env as never)
    const maleBody = JSON.parse(vi.mocked($fetch).mock.calls[0]?.[1]?.body as string)
    expect(maleBody.timber_weights[0].voice_id).toBe('Chinese (Mandarin)_Gentleman')

    vi.mocked($fetch).mockClear()
    await synthesize('test', '女', env as never)
    const femaleBody = JSON.parse(vi.mocked($fetch).mock.calls[0]?.[1]?.body as string)
    expect(femaleBody.timber_weights[0].voice_id).toBe('Chinese (Mandarin)_Gentle_Senior')
  })

  it('only includes format in audio_setting', async () => {
    const { $fetch } = await import('ofetch')
    const { default: synthesize } = await import('../tts')
    vi.mocked($fetch).mockClear()

    const env = {
      TTS_PROVIDER: 'minimax',
      TTS_API_KEY: 'test-key',
    } as Record<string, string>
    await synthesize('test', '男', env as never)

    const body = JSON.parse(vi.mocked($fetch).mock.calls[0]?.[1]?.body as string)
    expect(body.audio_setting).toEqual({ format: 'mp3' })
    expect(body.audio_setting.sample_rate).toBeUndefined()
    expect(body.audio_setting.bitrate).toBeUndefined()
  })

  it('respects custom TTS_API_URL', async () => {
    const { $fetch } = await import('ofetch')
    const { default: synthesize } = await import('../tts')
    vi.mocked($fetch).mockClear()

    const env = {
      TTS_PROVIDER: 'minimax',
      TTS_API_KEY: 'test-key',
      TTS_API_URL: 'https://custom.tts.api/v1/t2a_v2',
    } as Record<string, string>
    await synthesize('test', '男', env as never)

    const calledUrl = vi.mocked($fetch).mock.calls[0]?.[0] as string
    expect(calledUrl).toBe('https://custom.tts.api/v1/t2a_v2')
  })
})
