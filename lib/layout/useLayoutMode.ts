'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { detectLayoutMode, type LayoutMode, type LayoutContext } from './mode-detector'
import type { UserTokens } from './token-types'

interface UseLayoutModeOptions {
  isAuthenticated?: boolean
  userTokens?: UserTokens
}

/**
 * Hook to get current layout mode
 * 
 * Usage:
 * const mode = useLayoutMode({ isAuthenticated: true, userTokens })
 * const isViralMode = mode === 'viral'
 */
export function useLayoutMode(options: UseLayoutModeOptions = {}): LayoutMode {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isAuthenticated = false, userTokens } = options
  
  const mode = useMemo(() => {
    const context: LayoutContext = {
      pathname,
      isAuthenticated,
      searchParams: searchParams || undefined,
      userTokens
    }
    
    return detectLayoutMode(context)
  }, [pathname, isAuthenticated, searchParams, userTokens])
  
  return mode
}

/**
 * Hook to check if current mode allows specific features
 */
export function useLayoutFeatures(mode: LayoutMode, isAuthenticated: boolean) {
  const isTokenGated = mode === 'vip' || mode === 'civic-leader' || mode === 'collector' || mode === 'premium'
  
  return useMemo(() => ({
    showNav: mode === 'app' || isTokenGated,
    showSignupCTA: (mode === 'viral' || mode === 'kiosk') && !isAuthenticated,
    allowActions: mode === 'app' || mode === 'viral' || isTokenGated,
    isMinimal: mode === 'embed',
    isPublic: mode === 'viral' || mode === 'kiosk',
    isTokenGated
  }), [mode, isAuthenticated, isTokenGated])
}
