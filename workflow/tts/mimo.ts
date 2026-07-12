import type { Env } from '../context'
import type { Gender } from './types'
import { Buffer } from 'node:buffer'
import { $fetch } from 'ofetch'
import { z } from 'zod'
import { createAudioBlob, requireTTSConfig } from './config'

const mimoResponseSchema = z.looseObject({
  choices: z.array(z.looseObject({
    message: z.looseObject({
      audio: z.looseObject({
        data: z.base64().min(1),
      }),
    }),
  })).min(1),
})

export async function mimoTTS(text: string, gender: Gender, env: Env): Promise<Blob> {
  const apiKey = requireTTSConfig(env.TTS_API_KEY, 'TTS_API_KEY', 'mimo')
  const response: unknown = await $fetch(env.TTS_API_URL || 'https://api.xiaomimimo.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    signal: AbortSignal.timeout(60000),
    body: {
      model: env.TTS_MODEL || 'mimo-v2.5-tts',
      messages: [{ role: 'assistant', content: text }],
      audio: {
        format: 'mp3',
        voice: gender === '男' ? (env.MAN_VOICE_ID || '苏打') : (env.WOMAN_VOICE_ID || '冰糖'),
      },
    },
  })
  const result = mimoResponseSchema.safeParse(response)
  if (!result.success) {
    throw new Error(`MiMo TTS failed: invalid response audio data: ${result.error.message}`)
  }

  const audio = Buffer.from(result.data.choices[0].message.audio.data, 'base64')
  if (audio.byteLength === 0) {
    throw new Error('MiMo TTS failed: audio is empty')
  }
  return createAudioBlob(audio)
}
