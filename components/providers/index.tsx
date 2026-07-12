'use client'

import type { ReactNode } from 'react'
import { useSelector } from '@tanstack/react-store'
import { lazy, Suspense, useSyncExternalStore } from 'react'
import { ThemeProvider } from '@/components/theme/provider'
import { playerStore } from '@/stores/player-store'

const Player = lazy(() => import('@/components/player/index').then(module => ({ default: module.Player })))

function subscribeToHydration() {
  return () => {}
}

function getClientSnapshot() {
  return true
}

function getServerSnapshot() {
  return false
}

interface ProvidersProps {
  children: ReactNode
}

function LazyPlayer() {
  const isHydrated = useSyncExternalStore(subscribeToHydration, getClientSnapshot, getServerSnapshot)
  const currentEpisode = useSelector(playerStore, state => state.currentEpisode)

  if (!isHydrated || !currentEpisode) {
    return null
  }

  return <Player />
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      {children}
      <Suspense fallback={null}>
        <LazyPlayer />
      </Suspense>
    </ThemeProvider>
  )
}
