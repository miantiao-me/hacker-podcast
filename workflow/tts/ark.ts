import type { Env } from '../context'
import type { Gender } from './types'
import { Buffer } from 'node:buffer'
import { $fetch } from 'ofetch'
import { z } from 'zod'
import { createAudioBlob, requireTTSConfig } from './config'

const arkResponseSchema = z.looseObject({
  code: z.number(),
  message: z.string().optional(),
  data: z.string().nullable().optional(),
})

function parseArkSpeechRate(value: string | undefined): number | undefined {
  const ratio = Number(value)
  if (!Number.isFinite(ratio) || ratio < 0.5 || ratio > 2) {
    return undefined
  }
  return Math.min(100, Math.max(-50, Math.round((ratio - 1) * 100)))
}

function createArkError(code: number | string, message: string, logid: string | null): Error {
  return new Error(`Ark TTS failed: code=${code}, message=${message}, logid=${logid || 'unknown'}`)
}

export async function arkTTS(text: string, gender: Gender, env: Env): Promise<Blob> {
  const apiKey = requireTTSConfig(env.TTS_API_KEY, 'TTS_API_KEY', 'ark')
  const requestId = crypto.randomUUID()
  const speechRate = parseArkSpeechRate(env.AUDIO_SPEED)
  const response = await $fetch.raw<ReadableStream<Uint8Array>, 'stream'>(env.TTS_API_URL || 'https://openspeech.bytedance.com/api/v3/plan/tts/unidirectional', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
      'X-Api-Request-Id': requestId,
      'X-Api-Resource-Id': env.TTS_MODEL || 'seed-tts-2.0',
      'X-Control-Require-Usage-Tokens-Return': '*',
    },
    signal: AbortSignal.timeout(30000),
    responseType: 'stream',
    ignoreResponseError: true,
    body: {
      user: { uid: requestId },
      req_params: {
        text,
        speaker: gender === '男'
          ? (env.MAN_VOICE_ID || 'zh_female_xiaohe_uranus_bigtts')
          : (env.WOMAN_VOICE_ID || 'zh_female_qingxinnvsheng_uranus_bigtts'),
        audio_params: {
          format: 'mp3',
          sample_rate: 24000,
          ...(speechRate === undefined ? {} : { speech_rate: speechRate }),
        },
      },
    },
  })
  const logid = response.headers.get('X-Tt-Logid')
  console.info('Ark TTS X-Tt-Logid', logid)

  if (!response.ok) {
    throw createArkError(response.status, response.statusText || 'HTTP error', logid)
  }
  const stream = response._data
  if (!stream) {
    throw createArkError('NO_BODY', 'response body is empty', logid)
  }

  const audioChunks: Buffer[] = []
  const decoder = new TextDecoder()
  const reader = stream.getReader()
  let pending = ''
  let completed = false

  // Ark 使用逐行 JSON 帧传输音频，并以 20000000 帧标记完成。
  function parseLine(line: string): void {
    if (!line.trim()) {
      return
    }

    let json: unknown
    try {
      json = JSON.parse(line)
    }
    catch (error) {
      const message = error instanceof Error ? error.message : 'invalid JSON'
      throw createArkError('INVALID_JSON', message, logid)
    }

    const result = arkResponseSchema.safeParse(json)
    if (!result.success) {
      throw createArkError('INVALID_FRAME', result.error.message, logid)
    }
    const frame = result.data
    if (frame.code === 0) {
      if (frame.data) {
        const audio = Buffer.from(frame.data, 'base64')
        if (audio.byteLength > 0) {
          audioChunks.push(audio)
        }
      }
      return
    }
    if (frame.code === 20000000) {
      completed = true
      return
    }
    throw createArkError(frame.code, frame.message || 'unknown error', logid)
  }

  try {
    while (!completed) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      pending += decoder.decode(value, { stream: true })
      const lines = pending.split('\n')
      pending = lines.pop() || ''
      for (const line of lines) {
        parseLine(line)
        if (completed) {
          break
        }
      }
    }
  }
  finally {
    await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }

  if (!completed) {
    pending += decoder.decode()
    parseLine(pending)
  }
  if (!completed) {
    throw createArkError('INCOMPLETE', 'success frame was not received', logid)
  }
  if (audioChunks.length === 0) {
    throw createArkError('EMPTY_AUDIO', 'audio is empty', logid)
  }
  return createAudioBlob(Buffer.concat(audioChunks))
}
