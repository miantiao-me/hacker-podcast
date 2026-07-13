'use client'

import type { HTMLAttributes, ReactNode } from 'react'
import { domAnimation, LazyMotion, useAnimationFrame, useMotionValue, useTransform } from 'motion/react'
import * as m from 'motion/react-m'
import { useCallback, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

interface ScrollVelocityRowProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  baseVelocity?: number
  direction?: 1 | -1
  isPlaying?: boolean
}

function wrapValue(min: number, max: number, v: number) {
  const rangeSize = max - min
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min
}

export function ScrollTextContainer({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('relative w-full', className)} {...props}>
      {children}
    </div>
  )
}

export function ScrollTextRow({ children, baseVelocity = 5, direction = 1, isPlaying = true, className, ...props }: ScrollVelocityRowProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const blockRef = useRef<HTMLDivElement>(null)
  const copiesStoreRef = useRef<{ value: number, listeners: Set<() => void> }>({
    value: 1,
    listeners: new Set(),
  })

  const subscribe = useCallback((listener: () => void) => {
    copiesStoreRef.current.listeners.add(listener)
    return () => {
      copiesStoreRef.current.listeners.delete(listener)
    }
  }, [])

  const getSnapshot = useCallback(() => copiesStoreRef.current.value, [])
  const getServerSnapshot = useCallback(() => 1, [])
  const numCopies = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const updateNumCopies = useCallback((nextCopies: number) => {
    if (copiesStoreRef.current.value === nextCopies)
      return
    copiesStoreRef.current.value = nextCopies
    copiesStoreRef.current.listeners.forEach(listener => listener())
  }, [])

  const baseX = useMotionValue(0)
  const directionRef = useRef<number>(direction >= 0 ? 1 : -1)
  const unitWidth = useMotionValue(0)

  const isInViewRef = useRef(true)
  const isPageVisibleRef = useRef(true)
  const prefersReducedMotionRef = useRef(false)

  useLayoutEffect(() => {
    const container = containerRef.current
    const block = blockRef.current
    if (!container || !block)
      return

    const updateSizes = () => {
      const cw = container.offsetWidth || 0
      const bw = block.scrollWidth || 0
      unitWidth.set(bw)
      const nextCopies = bw > 0 ? Math.max(3, Math.ceil(cw / bw) + 2) : 1
      updateNumCopies(nextCopies)
    }

    updateSizes()

    const ro = new ResizeObserver(updateSizes)
    ro.observe(container)
    ro.observe(block)

    const io = new IntersectionObserver(([entry]) => {
      isInViewRef.current = entry.isIntersecting
    })
    io.observe(container)

    const handleVisibility = () => {
      isPageVisibleRef.current = document.visibilityState === 'visible'
    }
    document.addEventListener('visibilitychange', handleVisibility, { passive: true })
    handleVisibility()

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handlePRM = () => {
      prefersReducedMotionRef.current = mq.matches
      if (mq.matches)
        baseX.set(0)
    }
    mq.addEventListener('change', handlePRM)
    handlePRM()

    return () => {
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', handleVisibility)
      mq.removeEventListener('change', handlePRM)
    }
  }, [baseX, children, unitWidth, updateNumCopies])

  const x = useTransform([baseX, unitWidth], ([v, bw]) => {
    const width = Number(bw) || 1
    const offset = Number(v) || 0
    return `${-wrapValue(0, width, offset)}px`
  })

  useAnimationFrame((_, delta) => {
    if (!isInViewRef.current || !isPageVisibleRef.current || !isPlaying || prefersReducedMotionRef.current)
      return
    const dt = delta / 1000

    const bw = unitWidth.get() || 0
    if (bw <= 0)
      return
    const pixelsPerSecond = (bw * baseVelocity) / 100
    const moveBy = directionRef.current * pixelsPerSecond * dt
    baseX.set(baseX.get() + moveBy)
  })

  const copyIds = useMemo(
    () => Array.from({ length: numCopies }, (_, idx) => `scroll-copy-${idx}`),
    [numCopies],
  )

  return (
    <div
      ref={containerRef}
      className={cn(`w-full overflow-hidden whitespace-nowrap`, className)}
      {...props}
    >
      <LazyMotion features={domAnimation}>
        <m.div
          className={`
            inline-flex transform-gpu items-center will-change-transform
            select-none
          `}
          style={{ x }}
        >
          {copyIds.map((id, idx) => (
            <div
              key={id}
              ref={idx === 0 ? blockRef : null}
              aria-hidden={idx !== 0}
              className="inline-flex shrink-0 items-center"
            >
              {children}
              {idx < numCopies - 1 && <div className="inline-flex w-8 shrink-0" aria-hidden="true" />}
            </div>
          ))}
        </m.div>
      </LazyMotion>
    </div>
  )
}
