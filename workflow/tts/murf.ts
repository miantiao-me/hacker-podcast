import type { Env } from '../context'
import type { Gender } from './types'
import { $fetch } from 'ofetch'
import { createAudioBlob, requireTTSConfig } from './config'

export async function murfTTS(text: string, gender: Gender, env: Env): Promise<Blob> {
  const apiKey = requireTTSConfig(env.TTS_API_KEY, 'TTS_API_KEY', 'murf')
  const body = await $fetch<ArrayBuffer, 'arrayBuffer'>(env.TTS_API_URL || 'https://api.murf.ai/v1/speech/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    timeout: 30000,
    responseType: 'arrayBuffer',
    body: JSON.stringify({
      text,
      voiceId: gender === '男' ? env.MAN_VOICE_ID || 'en-US-ken' : env.WOMAN_VOICE_ID || 'en-UK-ruby',
      model: env.TTS_MODEL || 'GEN2',
      multiNativeLocale: 'zh-CN',
      style: 'Conversational',
      rate: Number(env.AUDIO_SPEED || -8),
      pitch: 0,
      format: 'MP3',
    }),
  })

  return createAudioBlob(body)
}
