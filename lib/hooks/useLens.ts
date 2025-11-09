'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SINGLE_LENS } from '@/lib/lens/lensConfig'

export type Lens = 'genz' | 'pro' | 'civic'

const LENS_STORAGE_KEY = 'preferred-lens'
const VALID_LENSES: Lens[] = ['genz', 'pro', 'civic']

/**
 * Lens hook with hybrid detection
 * 
 * Priority: URL param > localStorage > default (genz)
 * 
 * Usage:
 * ```tsx
 * const lens = useLens()
 * // lens = 'genz' | 'pro' | 'civic'
 * ```
 * 
 * Set via URL: ?lens=pro
 * Persists in localStorage for future sessions
 */
export function useLens(): Lens {
  const searchParams = useSearchParams()
  // Rollback: force single-lens mode
  const forced = SINGLE_LENS as Lens
  const [lens, setLens] = useState<Lens>(forced || 'genz')

  useEffect(() => {
    // If single-lens mode is enforced, ignore all other sources
    if (forced) {
      setLens(forced)
      return
    }

    // Priority 1: URL param
    const urlLens = searchParams?.get('lens') as Lens | null
    if (urlLens && VALID_LENSES.includes(urlLens)) {
      setLens(urlLens)
      // Persist URL choice for future sessions
      if (typeof window !== 'undefined') {
        localStorage.setItem(LENS_STORAGE_KEY, urlLens)
      }
      return
    }

    // Priority 2: localStorage
    if (typeof window !== 'undefined') {
      const storedLens = localStorage.getItem(LENS_STORAGE_KEY) as Lens | null
      if (storedLens && VALID_LENSES.includes(storedLens)) {
        setLens(storedLens)
        return
      }
    }

    // Priority 3: default to genz
    setLens('genz')
  }, [searchParams, forced])

  return lens
}

/**
 * Get lens theme class name for root <html> element
 * 
 * Maps lens to CSS class:
 * - genz → theme-genz-dark
 * - pro → theme-mesh-dark (Professional)
 * - civic → theme-civic-dark
 */
export function getLensThemeClass(lens: Lens): string {
  switch (lens) {
    case 'genz':
      return 'theme-genz-dark'
    case 'pro':
      return 'theme-mesh-dark'
    case 'civic':
      return 'theme-civic-dark'
    default:
      return 'theme-genz-dark'
  }
}

/**
 * Check if current lens is GenZ
 */
export function isGenZLens(lens: Lens): boolean {
  return lens === 'genz'
}

/**
 * Check if current lens is Professional
 */
export function isProLens(lens: Lens): boolean {
  return lens === 'pro'
}

/**
 * Check if current lens is Civic
 */
export function isCivicLens(lens: Lens): boolean {
  return lens === 'civic'
}
