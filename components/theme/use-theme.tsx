'use client'

import type { Theme } from '@/stores/theme-store'
import { useSelector } from '@tanstack/react-store'
import { getThemeStore, persistTheme } from '@/stores/theme-store'

export function useTheme() {
  const themeStore = getThemeStore()
  const theme = useSelector(themeStore, state => state.theme)

  const setTheme = (newTheme: Theme) => {
    try {
      persistTheme(newTheme)
    }
    catch (error) {
      console.error('Failed to persist theme', error)
    }

    themeStore.setState(state => ({ ...state, theme: newTheme }))
  }

  return { theme, setTheme }
}
