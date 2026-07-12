import type { Env } from '../context'
import type { Gender } from './types'
import type { UnGenericProvider } from './unspeech'
import { arkTTS } from './ark'
import { edgeTTS } from './edge'
import { mimoTTS } from './mimo'
import { minimaxTTS } from './minimax'
import { murfTTS } from './murf'
import {
  unAlibabaCloudTTS,
  unElevenLabsTTS,
  unGenericTTS,
  unMicrosoftTTS,
  unVolcengineTTS,
} from './unspeech'

export function synthesize(text: string, gender: Gender, env: Env): Promise<Blob> {
  const provider = env.TTS_PROVIDER?.trim().toLowerCase() || 'edge'
  console.info('TTS_PROVIDER', env.TTS_PROVIDER)

  switch (provider) {
    case 'edge':
      return edgeTTS(text, gender, env)
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
      return unGenericTTS(text, gender, env, provider as UnGenericProvider)
    default:
      throw new Error(`Unknown TTS provider: ${provider}`)
  }
}
