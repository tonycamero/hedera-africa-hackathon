/**
 * Layout Mode System
 * 
 * Determines the UI shell based on:
 * - Path intent (viral landing vs app feature)
 * - Authentication state
 * - Query params (embed mode, etc.)
 * - User tokens (NFTs, badges, memberships)
 */

import type { UserTokens } from './token-types'

export type LayoutMode = 
  | 'app'          // Authenticated app with full chrome (tabs, nav)
  | 'viral'        // Public viral landing pages (collections, boost)
  | 'embed'        // Embedded iframe mode (minimal chrome)
  | 'kiosk'        // Kiosk/demo mode (simplified interaction)
  | 'vip'          // Token-gated: owns specific legendary NFT
  | 'premium'      // Token-gated: membership
  | 'civic-leader' // Token-gated: 9/9 trust
  | 'collector'    // Token-gated: >=10 collectibles

export interface LayoutContext {
  pathname: string
  isAuthenticated: boolean
  searchParams?: URLSearchParams
  userAgent?: string
  userTokens?: UserTokens
}

/**
 * Detect appropriate layout mode based on context
 */
export function detectLayoutMode(context: LayoutContext): LayoutMode {
  const { pathname, isAuthenticated, searchParams, userTokens } = context
  
  // Explicit mode from query params (e.g., ?embed=true)
  if (searchParams?.get('embed') === 'true') {
    return 'embed'
  }
  
  if (searchParams?.get('kiosk') === 'true') {
    return 'kiosk'
  }
  
  // Token-gated lenses (auth required)
  if (isAuthenticated && userTokens) {
    const has = (t: string) => userTokens.nfts.includes(t) || userTokens.badges.includes(t);
    const member = (m: string) => userTokens.memberships.includes(m);

    if (has('networking-goat@1')) return 'vip';
    if (userTokens.trustLevel >= 9) return 'civic-leader';
    if (member('PRO_ANNUAL')) return 'premium';
    if (userTokens.nfts.length >= 10) return 'collector';
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
  return mode === 'app' || mode === 'viral' || mode === 'vip' || mode === 'civic-leader' || mode === 'collector' || mode === 'premium'
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
      return 'bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900' // Viral gradient
    case 'embed':
      return 'bg-transparent' // Transparent for embedding
    case 'kiosk':
      return 'bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900' // Same as viral
    case 'vip':
      return 'bg-gradient-to-br from-amber-900 via-yellow-900 to-orange-900' // VIP gold
    case 'civic-leader':
      return 'bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900' // Leader blue
    case 'collector':
      return 'bg-gradient-to-br from-fuchsia-900 via-pink-900 to-rose-900' // Collector pink
    case 'premium':
      return 'bg-gradient-to-br from-emerald-900 via-teal-900 to-purple-900' // Premium green
    default:
      return 'bg-ink'
  }
}
