'use client'

import { useEffect, useRef, useState } from 'react'
import type { LayoutMode } from './mode-detector'

const RANK: Record<LayoutMode, number> = {
  app: 0,
  viral: 0,         // public shell, not part of "progress"
  embed: 0,
  kiosk: 0,
  collector: 1,
  'civic-leader': 2,
  premium: 2,       // premium is parallel tier w/ leader (can tweak)
  vip: 3
}

const STORAGE_KEY = 'tm-last-mode-rank'

export function useModeUpgrade(mode: LayoutMode) {
  const [upgraded, setUpgraded] = useState<null | { from: number; to: number }>(null)
  const rank = RANK[mode] ?? 0
  const prevRankRef = useRef<number | null>(null)

  useEffect(() => {
    // Read last seen rank
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
    const last = raw ? parseInt(raw, 10) : null
    prevRankRef.current = last

    // First paint, set baseline if none
    if (last == null) {
      window.localStorage.setItem(STORAGE_KEY, String(rank))
      return
    }

    // If rank increased, mark upgrade and store
    if (rank > last) {
      setUpgraded({ from: last, to: rank })
      window.localStorage.setItem(STORAGE_KEY, String(rank))
    } else if (rank < last) {
      // If user "lost" entitlements (e.g., testing), still store new rank
      window.localStorage.setItem(STORAGE_KEY, String(rank))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // Reset helper (e.g., for testing)
  const resetProgress = () => {
    window.localStorage.removeItem(STORAGE_KEY)
  }

  return { upgraded, rank, resetProgress }
}
