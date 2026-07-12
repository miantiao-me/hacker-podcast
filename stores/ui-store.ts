import { Store } from '@tanstack/store'

interface UIStoreState {
  isEpisodeFullscreen: boolean
}

export const uiStore = new Store<UIStoreState>({
  isEpisodeFullscreen: false,
})

export function setEpisodeFullscreen(isFullscreen: boolean): void {
  uiStore.setState(state => ({
    ...state,
    isEpisodeFullscreen: isFullscreen,
  }))
}

export function toggleEpisodeFullscreen(): void {
  uiStore.setState(state => ({
    ...state,
    isEpisodeFullscreen: !state.isEpisodeFullscreen,
  }))
}
