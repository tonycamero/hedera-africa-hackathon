"use client"

import { useRef, useState, useCallback } from "react"

export function usePullToRefresh(onRefresh: () => Promise<void> | void, threshold = 60) {
  const startY = useRef<number | null>(null)
  const pulling = useRef(false)
  const [distance, setDistance] = useState(0)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (typeof window === "undefined") return
    if (document.scrollingElement && document.scrollingElement.scrollTop > 0) return
    startY.current = e.touches[0].clientY
    pulling.current = true
    setDistance(0)
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || startY.current === null) return
    const dy = e.touches[0].clientY - startY.current
    if (dy > 0) setDistance(Math.min(dy, threshold * 2))
  }, [threshold])

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return
    pulling.current = false
    if (distance >= threshold) {
      setDistance(0)
      await onRefresh()
    } else {
      setDistance(0)
    }
    startY.current = null
  }, [distance, threshold, onRefresh])

  return {
    bind: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      style: distance ? { transform: `translateY(${distance / 3}px)` } : undefined,
    },
    isPulling: distance > 0,
    distance,
  }
}