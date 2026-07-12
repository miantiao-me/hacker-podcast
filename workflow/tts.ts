import { Buffer } from 'node:buffer'
import { synthesize } from '@echristian/edge-tts'
import { generateSpeech } from '@xsai/generate-speech'
import { $fetch } from 'ofetch'
import {
  createUnAlibabaCloud,
  createUnElevenLabs,
  createUnMicrosoft,
  createUnSpeech,
  createUnVolcengine,
} from 'unspeech'
import { z } from 'zod'

interface Env extends CloudflareEnv {
  TTS_PROVIDER?: string
  TTS_API_URL?: string
  TTS_API_ID?: string
  TTS_API_KEY?: string
  TTS_MODEL?: string
  TTS_REGION?: string
  MAN_VOICE_ID?: string
  WOMAN_VOICE_ID?: string
  AUDIO_SPEED?: string
}

const defaultMicrosoftRegion = 'eastus'
const defaultArkURL = 'https://openspeech.bytedance.com/api/v3/plan/tts/unidirectional'
const defaultMiMoURL = 'https://api.xiaomimimo.com/v1/chat/completions'

const arkResponseSchema = z.looseObject({
  code: z.number(),
  message: z.string().optional(),
  data: z.string().nullable().optional(),
})

const mimoResponseSchema = z.looseObject({
  choices: z.array(z.looseObject({
    message: z.looseObject({
      audio: z.looseObject({
        data: z.base64().min(1),
      }),
    }),
  })).min(1),
})

type SpeechModel<TProvider extends { speech: (...args: never[]) => unknown }> = Parameters<TProvider['speech']>[0]
type UnAlibabaCloudModel = SpeechModel<ReturnType<typeof createUnAlibabaCloud>>
type UnElevenLabsModel = SpeechModel<ReturnType<typeof createUnElevenLabs>>
type UnMicrosoftModel = SpeechModel<ReturnType<typeof createUnMicrosoft>>
type UnVolcengineModel = SpeechModel<ReturnType<typeof createUnVolcengine>>
type UnGenericModel = SpeechModel<ReturnType<typeof createUnSpeech>>
type UnGenericProvider = 'deepgram' | 'koemotion' | 'openai' | 'volcano'

interface UnSpeechConfig {
  apiKey: string
  baseURL: string
  model: string
  speed?: number
  voice: string
}

function requireTTSConfig(value: string | undefined, name: string, provider: string) {
  if (!value) {
    throw new Error(`${name} is required for ${provider} TTS`)
  }
  return value
}

function resolveUnSpeechConfig(env: Env, gender: string, provider: string): UnSpeechConfig {
  return {
    apiKey: requireTTSConfig(env.TTS_API_KEY, 'TTS_API_KEY', provider),
    baseURL: requireTTSConfig(env.TTS_API_URL, 'TTS_API_URL', provider),
    model: requireTTSConfig(env.TTS_MODEL, 'TTS_MODEL', provider),
    speed: parseAudioSpeed(env.AUDIO_SPEED),
    voice: resolveVoice(gender, env, provider),
  }
}

function parseAudioSpeed(value: string | undefined) {
  const speed = Number(value)
  return Number.isFinite(speed) && speed > 0 ? speed : undefined
}

function normalizeModel(model: string, ...providers: string[]) {
  const provider = providers.find(provider => model.startsWith(`${provider}/`))
  return provider ? model.slice(provider.length + 1) : model
}

function resolveVoice(gender: string, env: Env, provider: string) {
  return requireTTSConfig(gender === '男' ? env.MAN_VOICE_ID : env.WOMAN_VOICE_ID, gender === '男' ? 'MAN_VOICE_ID' : 'WOMAN_VOICE_ID', provider)
}

function createAudioBlob(audio: ArrayBuffer | Uint8Array): Blob {
  if (audio instanceof ArrayBuffer) {
    return new Blob([audio], { type: 'audio/mpeg' })
  }

  const arrayBuffer = new ArrayBuffer(audio.byteLength)
  new Uint8Array(arrayBuffer).set(audio)
  return new Blob([arrayBuffer], { type: 'audio/mpeg' })
}

async function edgeTTS(text: string, gender: string, env: Env) {
  const { audio } = await synthesize({
    text,
    language: 'zh-CN',
    voice: gender === '男' ? (env.MAN_VOICE_ID || 'zh-CN-YunyangNeural') : (env.WOMAN_VOICE_ID || 'zh-CN-XiaoxiaoNeural'),
    rate: env.AUDIO_SPEED || '10%',
  })
  return audio
}

async function minimaxTTS(text: string, gender: string, env: Env) {
  const result = await $fetch<{ data: { audio: string }, base_resp: { status_msg: string } }>(`${env.TTS_API_URL || 'https://api.minimaxi.com/v1/t2a_v2'}?GroupId=${env.TTS_API_ID}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.TTS_API_KEY}`,
    },
    timeout: 30000,
    body: JSON.stringify({
      model: env.TTS_MODEL || 'speech-2.6-hd',
      text,
      timber_weights: [
        {
          voice_id: gender === '男' ? (env.MAN_VOICE_ID || 'Chinese (Mandarin)_Gentleman') : (env.WOMAN_VOICE_ID || 'Chinese (Mandarin)_Gentle_Senior'),
          weight: 100,
        },
      ],
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
    const buffer = Buffer.from(result.data.audio, 'hex')
    return createAudioBlob(buffer)
  }
  throw new Error(`Failed to fetch audio: ${result?.base_resp?.status_msg}`)
}

/**
 * murf.ai 语音合成服务每月$10的免费额度，相对于 minimax 收费，没有预算的用户可以使用
 * 使用 Murf 语音合成服务将文本转换为音频。
 * 根据 `gender` 选择不同的预设音色，并可通过环境变量调整语速等参数。
 *
 * @param text 要合成的文本内容
 * @param gender 性别标识：传入 `'男'` 使用男声，否则使用女声
 * @param env 运行环境配置，包含 `TTS_API_URL`、`TTS_API_KEY`、`TTS_MODEL`、`MAN_VOICE_ID`、`WOMAN_VOICE_ID`、`AUDIO_SPEED` 等
 * @returns 返回包含 MP3 数据的 `Blob`
 * @throws 当请求失败或服务返回非 2xx 状态码时抛出错误
 * @apiUrl https://murf.ai/api/docs/api-reference/text-to-speech/stream?explorer=true
 * @getKeyUrl https://murf.ai/api/api-keys
 */
async function murfTTS(text: string, gender: string, env: Env) {
  const body = await $fetch<ArrayBuffer, 'arrayBuffer'>(`${env.TTS_API_URL || 'https://api.murf.ai/v1/speech/stream'}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': `${env.TTS_API_KEY}`,
    },
    timeout: 30000,
    responseType: 'arrayBuffer',
    // en-UK-ruby 女声1
    // zh-CN-wei 女声2
    // en-US-ken 男声1
    // zh-CN-tao 男声2
    // pl-PL-jacek 男声3
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

  return new Blob([body], { type: 'audio/mpeg' })
}

function parseArkSpeechRate(value: string | undefined) {
  const ratio = Number(value)
  if (!Number.isFinite(ratio) || ratio < 0.5 || ratio > 2) {
    return undefined
  }
  return Math.min(100, Math.max(-50, Math.round((ratio - 1) * 100)))
}

function createArkError(code: number | string, message: string, logid: string | null) {
  return new Error(`Ark TTS failed: code=${code}, message=${message}, logid=${logid || 'unknown'}`)
}

async function arkTTS(text: string, gender: string, env: Env) {
  const apiKey = requireTTSConfig(env.TTS_API_KEY, 'TTS_API_KEY', 'ark')
  const requestId = crypto.randomUUID()
  const speechRate = parseArkSpeechRate(env.AUDIO_SPEED)
  const response = await $fetch.raw<ReadableStream<Uint8Array>, 'stream'>(env.TTS_API_URL || defaultArkURL, {
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

  function parseLine(line: string) {
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

async function mimoTTS(text: string, gender: string, env: Env) {
  const apiKey = requireTTSConfig(env.TTS_API_KEY, 'TTS_API_KEY', 'mimo')
  const response: unknown = await $fetch(env.TTS_API_URL || defaultMiMoURL, {
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

async function unAlibabaCloudTTS(text: string, gender: string, env: Env) {
  const config = resolveUnSpeechConfig(env, gender, 'alibaba')
  const model = normalizeModel(config.model, 'alibaba', 'aliyun') as UnAlibabaCloudModel
  const provider = createUnAlibabaCloud(config.apiKey, config.baseURL)
  const audio = await generateSpeech({
    ...provider.speech(model, config.speed ? { rate: config.speed } : undefined),
    input: text,
    responseFormat: 'mp3',
    voice: config.voice,
    ...(config.speed ? { speed: config.speed } : {}),
  })

  return createAudioBlob(audio)
}

async function unElevenLabsTTS(text: string, gender: string, env: Env) {
  const config = resolveUnSpeechConfig(env, gender, 'elevenlabs')
  const model = normalizeModel(config.model, 'elevenlabs') as UnElevenLabsModel
  const provider = createUnElevenLabs(config.apiKey, config.baseURL)
  const audio = await generateSpeech({
    ...provider.speech(model, {
      voiceSettings: {
        similarityBoost: 0.75,
        stability: 0.5,
        ...(config.speed ? { speed: config.speed } : {}),
      },
    }),
    input: text,
    responseFormat: 'mp3',
    voice: config.voice,
    ...(config.speed ? { speed: config.speed } : {}),
  })

  return createAudioBlob(audio)
}

async function unMicrosoftTTS(text: string, gender: string, env: Env) {
  const config = resolveUnSpeechConfig(env, gender, 'microsoft')
  const model = normalizeModel(config.model, 'microsoft', 'azure') as UnMicrosoftModel
  const provider = createUnMicrosoft(config.apiKey, config.baseURL)
  const audio = await generateSpeech({
    ...provider.speech(model, {
      gender: gender === '男' ? 'Male' : 'Female',
      lang: 'zh-CN',
      region: env.TTS_REGION || defaultMicrosoftRegion,
      voice: config.voice,
    }),
    input: text,
    responseFormat: 'mp3',
    voice: config.voice,
    ...(config.speed ? { speed: config.speed } : {}),
  })

  return createAudioBlob(audio)
}

async function unVolcengineTTS(text: string, gender: string, env: Env) {
  const config = resolveUnSpeechConfig(env, gender, 'volcengine')
  const model = normalizeModel(config.model, 'volcengine') as UnVolcengineModel
  const provider = createUnVolcengine(config.apiKey, config.baseURL)
  const audio = await generateSpeech({
    ...provider.speech(model, {
      ...(env.TTS_API_ID ? { app: { appId: env.TTS_API_ID } } : {}),
      audio: {
        encoding: 'mp3',
        explicitLanguage: 'zh',
        ...(config.speed ? { speedRatio: config.speed } : {}),
      },
    }),
    input: text,
    responseFormat: 'mp3',
    voice: config.voice,
    ...(config.speed ? { speed: config.speed } : {}),
  })

  return createAudioBlob(audio)
}

async function unGenericTTS(text: string, gender: string, env: Env, providerName: UnGenericProvider) {
  const config = resolveUnSpeechConfig(env, gender, providerName)
  const model = (config.model.includes('/') ? config.model : `${providerName}/${config.model}`) as UnGenericModel
  const provider = createUnSpeech(config.apiKey, config.baseURL)
  const audio = await generateSpeech({
    ...provider.speech(model),
    input: text,
    responseFormat: 'mp3',
    voice: config.voice,
    ...(config.speed ? { speed: config.speed } : {}),
  })

  return createAudioBlob(audio)
}

export default function (text: string, gender: string, env: Env) {
  const provider = env.TTS_PROVIDER?.toLowerCase()
  console.info('TTS_PROVIDER', env.TTS_PROVIDER)
  switch (provider) {
    case 'ark':
      return arkTTS(text, gender, env)
    case 'minimax':
      return minimaxTTS(text, gender, env)
    case 'mimo':
      return mimoTTS(text, gender, env)
    case 'murf':
      return murfTTS(text, gender, env)
    case 'alibaba':
    case 'aliyun':
      return unAlibabaCloudTTS(text, gender, env)
    case 'elevenlabs':
      return unElevenLabsTTS(text, gender, env)
    case 'microsoft':
    case 'azure':
      return unMicrosoftTTS(text, gender, env)
    case 'volcengine':
      return unVolcengineTTS(text, gender, env)
    case 'deepgram':
    case 'koemotion':
    case 'openai':
    case 'volcano':
      return unGenericTTS(text, gender, env, provider)
    default:
      return edgeTTS(text, gender, env)
  }
}
