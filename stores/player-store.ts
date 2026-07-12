import type { Episode } from '@/types/podcast'
import { Store } from '@tanstack/store'

export interface PlayerStoreState {
  currentEpisode: Episode | null
  isPlaying: boolean
  isSourceChanging: boolean
  selectionSource: 'default' | 'user' | null
}

export const playerStore = new Store<PlayerStoreState>({
  currentEpisode: null,
  isPlaying: false,
  isSourceChanging: false,
  selectionSource: null,
})

export function setCurrentEpisode(episode: Episode): void {
  playerStore.setState(state => ({
    currentEpisode: episode,
    isPlaying: true,
    isSourceChanging: state.currentEpisode?.id !== episode.id,
    selectionSource: 'user',
  }))
}

export function setDefaultEpisode(episode: Episode): void {
  playerStore.setState((state) => {
    const canSetDefault = !state.currentEpisode
    if (!canSetDefault) {
      return state
    }

    return {
      ...state,
      currentEpisode: episode,
      isPlaying: false,
      isSourceChanging: false,
      selectionSource: 'default',
    }
  })
}

export function setIsPlaying(isPlaying: boolean): void {
  playerStore.setState(state => ({
    ...state,
    isPlaying,
    selectionSource: isPlaying ? 'user' : state.selectionSource,
  }))
}

export function setIsSourceChanging(isSourceChanging: boolean): void {
  playerStore.setState(state => ({ ...state, isSourceChanging }))
}

export function play(): void {
  playerStore.setState(state => ({ ...state, isPlaying: true, selectionSource: 'user' }))
}

export function pause(): void {
  playerStore.setState(state => ({ ...state, isPlaying: false, isSourceChanging: false }))
}
