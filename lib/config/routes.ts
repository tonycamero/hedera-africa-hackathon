// lib/config/routes.ts
// TODO: T4 - Routes configuration for boost URLs and app navigation

export const ROUTES = {
  // Core app routes
  home: '/',
  signals: '/signals',
  contacts: '/contacts',
  trust: '/trust',
  profile: '/profile',
  
  // TODO: T4 - GenZ boost sharing routes
  boost: {
    // Individual boost route: /boost/{boostId}
    view: (boostId: string) => `/boost/${boostId}`,
    
    // Boost creation/sharing flow
    create: '/boost/create',
    share: '/boost/share'
  },
  
  // API routes
  api: {
    signals: '/api/signals',
    boost: '/api/boost',
    share: '/api/share'
  }
} as const

// Route patterns for Next.js dynamic routes
export const ROUTE_PATTERNS = {
  // TODO: T4 - Boost ID pattern for URL parsing
  boostId: /^\/boost\/([a-f0-9]{16})$/i,
  
  // Other dynamic patterns
  profile: /^\/profile\/(.+)$/,
  contact: /^\/contact\/(.+)$/
} as const

/**
 * TODO: T4 - Parse boost ID from pathname
 */
export function parseBoostIdFromPath(pathname: string): string | null {
  const match = pathname.match(ROUTE_PATTERNS.boostId)
  return match ? match[1] : null
}

/**
 * TODO: T4 - Generate canonical boost share URL
 */
export function createBoostShareUrl(boostId: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}${ROUTES.boost.view(boostId)}`
}

/**
 * TODO: T4 - Check if current route is a boost view
 */
export function isBoostRoute(pathname: string): boolean {
  return ROUTE_PATTERNS.boostId.test(pathname)
}

/**
 * TODO: T4 - Navigation helpers for GenZ flows
 */
export const navigate = {
  toBoost: (boostId: string) => ROUTES.boost.view(boostId),
  toSignals: () => ROUTES.signals,
  toHome: () => ROUTES.home,
  
  // External sharing URLs
  shareToTwitter: (boostUrl: string, text: string) => 
    `https://twitter.com/intent/tweet?url=${encodeURIComponent(boostUrl)}&text=${encodeURIComponent(text)}`,
  
  shareToLinkedIn: (boostUrl: string) =>
    `https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(boostUrl)}`
}

export default ROUTES