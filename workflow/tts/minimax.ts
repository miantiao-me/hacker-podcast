import type { Env } from '../context'
import type { Gender } from './types'
import { Buffer } from 'node:buffer'
import { $fetch } from 'ofetch'
import { createAudioBlob, requireTTSConfig } from './config'

export async function minimaxTTS(text: string, gender: Gender, env: Env): Promise<Blob> {
  const apiId = requireTTSConfig(env.TTS_API_ID, 'TTS_API_ID', 'minimax')
  const apiKey = requireTTSConfig(env.TTS_API_KEY, 'TTS_API_KEY', 'minimax')
  const result = await $fetch<{ data: { audio: string }, base_resp: { status_msg: string } }>(`${env.TTS_API_URL || 'https://api.minimaxi.com/v1/t2a_v2'}?GroupId=${apiId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    timeout: 30000,
    body: JSON.stringify({
      model: env.TTS_MODEL || 'speech-2.6-hd',
      text,
      timber_weights: [{
        voice_id: gender === '男' ? (env.MAN_VOICE_ID || 'Chinese (Mandarin)_Gentleman') : (env.WOMAN_VOICE_ID || 'Chinese (Mandarin)_Gentle_Senior'),
        weight: 100,
      }],
      voice_setting: {
        voice_id: '',
        speed: Number(env.AUDIO_SPEED || 1.1),
        pitch: 0,
        vol: 1,
        latex_read: false,
      },
      audio_setting: {
        sample_rate: 32000,
        bitrate: 128000,
        format: 'mp3',
      },
      language_boost: 'Chinese',
    }),
  })

  if (result?.data?.audio) {
    return createAudioBlob(Buffer.from(result.data.audio, 'hex'))
  }
  throw new Error(`Failed to fetch audio: ${result?.base_resp?.status_msg}`)
}
