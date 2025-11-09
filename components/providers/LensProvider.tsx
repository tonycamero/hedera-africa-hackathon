'use client'

import { useEffect } from 'react'
import { useLens, getLensThemeClass } from '@/lib/hooks/useLens'

/**
 * LensProvider - Client-side lens theme switcher
 * 
 * Detects lens from URL/localStorage and applies theme class to <html>
 * Must be client component to access searchParams and localStorage
 */
export function LensProvider() {
  const lens = useLens()

  useEffect(() => {
    const themeClass = getLensThemeClass(lens)
    const htmlElement = document.documentElement

    // Remove all theme classes
    htmlElement.classList.remove('theme-genz-dark', 'theme-mesh-dark', 'theme-civic-dark')
    
    // Add current lens theme
    htmlElement.classList.add(themeClass)

    // Update data attribute for legacy compatibility
    htmlElement.setAttribute('data-lens', lens)
  }, [lens])

  return null // No UI, just theme switching
}
