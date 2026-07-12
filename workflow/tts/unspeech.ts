import type { Env } from '../context'
import type { Gender } from './types'
import { generateSpeech } from '@xsai/generate-speech'
import {
  createUnAlibabaCloud,
  createUnElevenLabs,
  createUnMicrosoft,
  createUnSpeech,
  createUnVolcengine,
} from 'unspeech'
import { createAudioBlob, normalizeModel, resolveUnSpeechConfig } from './config'

type SpeechModel<TProvider extends { speech: (...args: never[]) => unknown }> = Parameters<TProvider['speech']>[0]
type UnAlibabaCloudModel = SpeechModel<ReturnType<typeof createUnAlibabaCloud>>
type UnElevenLabsModel = SpeechModel<ReturnType<typeof createUnElevenLabs>>
type UnMicrosoftModel = SpeechModel<ReturnType<typeof createUnMicrosoft>>
type UnVolcengineModel = SpeechModel<ReturnType<typeof createUnVolcengine>>
type UnGenericModel = SpeechModel<ReturnType<typeof createUnSpeech>>
export type UnGenericProvider = 'deepgram' | 'koemotion' | 'openai' | 'volcano'

export async function unAlibabaCloudTTS(text: string, gender: Gender, env: Env): Promise<Blob> {
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

export async function unElevenLabsTTS(text: string, gender: Gender, env: Env): Promise<Blob> {
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

export async function unMicrosoftTTS(text: string, gender: Gender, env: Env): Promise<Blob> {
  const config = resolveUnSpeechConfig(env, gender, 'microsoft')
  const model = normalizeModel(config.model, 'microsoft', 'azure') as UnMicrosoftModel
  const provider = createUnMicrosoft(config.apiKey, config.baseURL)
  const audio = await generateSpeech({
    ...provider.speech(model, {
      gender: gender === '男' ? 'Male' : 'Female',
      lang: 'zh-CN',
      region: env.TTS_REGION || 'eastus',
      voice: config.voice,
    }),
    input: text,
    responseFormat: 'mp3',
    voice: config.voice,
    ...(config.speed ? { speed: config.speed } : {}),
  })
  return createAudioBlob(audio)
}

export async function unVolcengineTTS(text: string, gender: Gender, env: Env): Promise<Blob> {
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

export async function unGenericTTS(text: string, gender: Gender, env: Env, providerName: UnGenericProvider): Promise<Blob> {
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
