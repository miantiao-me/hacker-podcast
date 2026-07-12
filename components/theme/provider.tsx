'use client'

import type { ReactNode } from 'react'
import { useSelector } from '@tanstack/react-store'
import { useEffect } from 'react'
import { initThemeStore } from '@/stores/theme-store'

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const themeStore = initThemeStore()
  const theme = useSelector(themeStore, state => state.theme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const applySystemTheme = () => {
        root.classList.remove('light', 'dark')
        root.classList.add(mediaQuery.matches ? 'dark' : 'light')
      }

      applySystemTheme()
      mediaQuery.addEventListener('change', applySystemTheme)
      return () => mediaQuery.removeEventListener('change', applySystemTheme)
    }

    root.classList.add(theme)
    return undefined
  }, [theme])

  return <>{children}</>
}
