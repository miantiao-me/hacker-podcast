import type { Env } from '../context'
import type { Gender, UnSpeechConfig } from './types'

export function requireTTSConfig(value: string | undefined, name: string, provider: string): string {
  if (!value) {
    throw new Error(`${name} is required for ${provider} TTS`)
  }
  return value
}

export function parseAudioSpeed(value: string | undefined): number | undefined {
  const speed = Number(value)
  return Number.isFinite(speed) && speed > 0 ? speed : undefined
}

export function resolveVoice(gender: Gender, env: Env, provider: string): string {
  return requireTTSConfig(
    gender === '男' ? env.MAN_VOICE_ID : env.WOMAN_VOICE_ID,
    gender === '男' ? 'MAN_VOICE_ID' : 'WOMAN_VOICE_ID',
    provider,
  )
}

export function resolveUnSpeechConfig(env: Env, gender: Gender, provider: string): UnSpeechConfig {
  return {
    apiKey: requireTTSConfig(env.TTS_API_KEY, 'TTS_API_KEY', provider),
    baseURL: requireTTSConfig(env.TTS_API_URL, 'TTS_API_URL', provider),
    model: requireTTSConfig(env.TTS_MODEL, 'TTS_MODEL', provider),
    speed: parseAudioSpeed(env.AUDIO_SPEED),
    voice: resolveVoice(gender, env, provider),
  }
}

export function normalizeModel(model: string, ...providers: string[]): string {
  const provider = providers.find(provider => model.startsWith(`${provider}/`))
  return provider ? model.slice(provider.length + 1) : model
}

export function createAudioBlob(audio: ArrayBuffer | Uint8Array): Blob {
  if (audio instanceof ArrayBuffer) {
    return new Blob([audio], { type: 'audio/mpeg' })
  }

  const arrayBuffer = new ArrayBuffer(audio.byteLength)
  new Uint8Array(arrayBuffer).set(audio)
  return new Blob([arrayBuffer], { type: 'audio/mpeg' })
}
