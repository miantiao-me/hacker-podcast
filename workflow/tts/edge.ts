import type { Env } from '../context'
import type { Gender } from './types'
import { synthesize } from '@echristian/edge-tts'

export async function edgeTTS(text: string, gender: Gender, env: Env): Promise<Blob> {
  const { audio } = await synthesize({
    text,
    language: 'zh-CN',
    voice: gender === '男' ? (env.MAN_VOICE_ID || 'zh-CN-YunyangNeural') : (env.WOMAN_VOICE_ID || 'zh-CN-XiaoxiaoNeural'),
    rate: env.AUDIO_SPEED || '10%',
  })
  return audio
}
