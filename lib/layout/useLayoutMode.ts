'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { detectLayoutMode, type LayoutMode, type LayoutContext } from './mode-detector'

/**
 * Hook to get current layout mode
 * 
 * Usage:
 * const mode = useLayoutMode()
 * const isViralMode = mode === 'viral'
 */
export function useLayoutMode(isAuthenticated: boolean = false): LayoutMode {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const mode = useMemo(() => {
    const context: LayoutContext = {
      pathname,
      isAuthenticated,
      searchParams: searchParams || undefined
    }
    
    return detectLayoutMode(context)
  }, [pathname, isAuthenticated, searchParams])
  
  return mode
}

/**
 * Hook to check if current mode allows specific features
 */
export function useLayoutFeatures(mode: LayoutMode, isAuthenticated: boolean) {
  return useMemo(() => ({
    showNav: mode === 'app',
    showSignupCTA: (mode === 'viral' || mode === 'kiosk') && !isAuthenticated,
    allowActions: mode === 'app' || mode === 'viral',
    isMinimal: mode === 'embed',
    isPublic: mode === 'viral' || mode === 'kiosk'
  }), [mode, isAuthenticated])
}
