import { Store } from '@tanstack/store'

export type Theme = 'light' | 'dark' | 'system'

export interface ThemeStoreState {
  theme: Theme
}

let themeStore: Store<ThemeStoreState> | null = null
const storageKey = 'next-ui-theme'

function createThemeStore() {
  const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') {
      return 'system'
    }
    try {
      const stored = localStorage.getItem(storageKey) as Theme | null
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored
      }
    }
    catch (error) {
      console.error('Failed to read stored theme', error)
    }
    return 'system'
  }

  return new Store<ThemeStoreState>({
    theme: getInitialTheme(),
  })
}

export function initThemeStore(): Store<ThemeStoreState> {
  if (!themeStore) {
    themeStore = createThemeStore()
  }
  return themeStore
}

export function persistTheme(theme: Theme): void {
  localStorage.setItem(storageKey, theme)
}

export function getThemeStore(): Store<ThemeStoreState> {
  if (!themeStore) {
    throw new Error('Theme store has not been initialized')
  }
  return themeStore
}
