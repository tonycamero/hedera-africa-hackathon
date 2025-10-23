/**
 * Layout Mode System
 * 
 * Determines the UI shell based on:
 * - Path intent (viral landing vs app feature)
 * - Authentication state
 * - Query params (embed mode, etc.)
 */

export type LayoutMode = 
  | 'app'       // Authenticated app with full chrome (tabs, nav)
  | 'viral'     // Public viral landing pages (collections, boost)
  | 'embed'     // Embedded iframe mode (minimal chrome)
  | 'kiosk'     // Kiosk/demo mode (simplified interaction)

export interface LayoutContext {
  pathname: string
  isAuthenticated: boolean
  searchParams?: URLSearchParams
  userAgent?: string
}

/**
 * Detect appropriate layout mode based on context
 */
export function detectLayoutMode(context: LayoutContext): LayoutMode {
  const { pathname, isAuthenticated, searchParams } = context
  
  // Explicit mode from query params (e.g., ?embed=true)
  if (searchParams?.get('embed') === 'true') {
    return 'embed'
  }
  
  if (searchParams?.get('kiosk') === 'true') {
    return 'kiosk'
  }
  
  // Viral paths - public landing pages optimized for sharing
  const viralPaths = [
    '/collections',
    '/boost/',
    '/u/',  // Public profile pages
  ]
  
  const isViralPath = viralPaths.some(path => pathname.startsWith(path))
  
  // Viral pages show viral shell even when authenticated
  // This keeps shared links consistent across users
  if (isViralPath) {
    return 'viral'
  }
  
  // Default to app mode for authenticated users
  return 'app'
}

/**
 * Check if current mode allows authenticated actions
 * (e.g., viral mode can show "Send Signal" button to logged-in users)
 */
export function allowsAuthenticatedActions(mode: LayoutMode): boolean {
  return mode === 'app' || mode === 'viral'
}

/**
 * Check if mode should show navigation chrome
 */
export function showsNavigation(mode: LayoutMode): boolean {
  return mode === 'app'
}

/**
 * Check if mode should show signup CTAs
 */
export function showsSignupCTA(mode: LayoutMode, isAuthenticated: boolean): boolean {
  return (mode === 'viral' || mode === 'kiosk') && !isAuthenticated
}

/**
 * Get appropriate background class for mode
 */
export function getModeBackground(mode: LayoutMode): string {
  switch (mode) {
    case 'app':
      return 'bg-ink' // Core app dark background
    case 'viral':
      return 'bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900' // Viral gradient
    case 'embed':
      return 'bg-transparent' // Transparent for embedding
    case 'kiosk':
      return 'bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900' // Same as viral
    default:
      return 'bg-ink'
  }
}
