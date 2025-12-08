import { Buffer } from 'node:buffer'
import { synthesize } from '@echristian/edge-tts'
import { $fetch } from 'ofetch'

interface Env extends CloudflareEnv {
  TTS_PROVIDER?: string
  TTS_API_URL?: string
  TTS_API_ID?: string
  TTS_API_KEY?: string
  TTS_MODEL?: string
  MAN_VOICE_ID?: string
  WOMAN_VOICE_ID?: string
  AUDIO_SPEED?: string
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
    return new Blob([buffer.buffer], { type: 'audio/mpeg' })
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
  const result = await $fetch(`${env.TTS_API_URL || 'https://api.murf.ai/v1/speech/stream'}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': `${env.TTS_API_KEY}`,
    },
    timeout: 30000,
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

  if (result.ok) {
    const body = await result.arrayBuffer()
    const buffer = Buffer.from(body)
    return new Blob([buffer.buffer], { type: 'audio/mpeg' })
  }
  throw new Error(`Failed to fetch audio: ${result.statusText}`)
}

export default function (text: string, gender: string, env: Env) {
  console.info('TTS_PROVIDER', env.TTS_PROVIDER)
  switch (env.TTS_PROVIDER) {
    case 'minimax':
      return minimaxTTS(text, gender, env)
    case 'murf':
      return murfTTS(text, gender, env)
    default:
      return edgeTTS(text, gender, env)
  }
}
