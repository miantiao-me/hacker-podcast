export type Gender = '男' | '女'

export interface UnSpeechConfig {
  apiKey: string
  baseURL: string
  model: string
  speed?: number
  voice: string
}
