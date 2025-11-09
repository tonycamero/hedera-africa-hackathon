/**
 * A/B Testing Group Assignment
 * 
 * Persistent assignment of users to test groups for template variations
 * Supports both anonymous (cookie) and authenticated (profile) users
 */

import { NextRequest, NextResponse } from 'next/server'

export type TestGroup = 'A' | 'B' | 'C'

const COOKIE_NAME = 'tm_ab'
const COOKIE_MAX_AGE = 90 * 24 * 60 * 60 // 90 days in seconds

/**
 * Get user's test group from request (cookie or future: profile)
 * @param req - Next.js request object
 * @returns Test group or null if not assigned
 */
export function getUserGroup(req: NextRequest): TestGroup | null {
  // For now, we only support cookie-based assignment
  // In the future, check user profile first for authenticated users
  
  const cookieValue = req.cookies.get(COOKIE_NAME)?.value
  if (cookieValue && ['A', 'B', 'C'].includes(cookieValue)) {
    return cookieValue as TestGroup
  }
  
  return null
}

/**
 * Assign user to a test group if not already assigned
 * @param req - Next.js request object  
 * @param res - Next.js response object
 * @returns Assigned test group
 */
export function assignIfMissing(req: NextRequest, res: NextResponse): TestGroup {
  const existing = getUserGroup(req)
  if (existing) {
    return existing
  }
  
  // Assign to test group using deterministic hashing for consistency
  const userIdentifier = getUserIdentifier(req)
  const group = hashToTestGroup(userIdentifier)
  
  // Set cookie for anonymous users
  res.cookies.set(COOKIE_NAME, group, {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: false, // Allow client-side access for debugging
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  })
  
  return group
}

/**
 * Get or assign user's test group (client-side version)
 * @returns Test group
 */
export function getOrAssignClientGroup(): TestGroup {
  if (typeof document === 'undefined') {
    // Server-side fallback
    return 'A'
  }
  
  // Check existing cookie
  const cookies = document.cookie.split(';')
  const abCookie = cookies.find(cookie => 
    cookie.trim().startsWith(`${COOKIE_NAME}=`)
  )
  
  if (abCookie) {
    const value = abCookie.split('=')[1]
    if (['A', 'B', 'C'].includes(value)) {
      return value as TestGroup
    }
  }
  
  // Assign new group
  const userIdentifier = getClientUserIdentifier()
  const group = hashToTestGroup(userIdentifier)
  
  // Set cookie
  const expires = new Date()
  expires.setTime(expires.getTime() + (COOKIE_MAX_AGE * 1000))
  document.cookie = `${COOKIE_NAME}=${group}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
  
  return group
}

/**
 * Get user identifier for consistent group assignment
 * Uses IP + User-Agent for anonymous users
 */
function getUserIdentifier(req: NextRequest): string {
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'
  return `${ip}:${userAgent}`
}

/**
 * Get client-side user identifier
 */
function getClientUserIdentifier(): string {
  // Use a combination of screen resolution and navigator info for consistency
  const screen = `${window.screen.width}x${window.screen.height}`
  const nav = navigator.userAgent.slice(0, 100) // Truncate for consistency
  return `${screen}:${nav}`
}

/**
 * Hash string to test group using simple algorithm
 */
function hashToTestGroup(input: string): TestGroup {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  // Map to A, B, or C with equal distribution
  const groups: TestGroup[] = ['A', 'B', 'C']
  const index = Math.abs(hash) % groups.length
  return groups[index]
}

/**
 * Reset user's test group (useful for testing)
 */
export function resetGroup(res: NextResponse): void {
  res.cookies.set(COOKIE_NAME, '', {
    maxAge: 0,
    path: '/'
  })
}

/**
 * Get test group distribution stats (for analytics)
 */
export function getGroupDistribution(): Record<TestGroup, number> {
  // This would query your analytics or user database in production
  // For now, return mock data
  return {
    'A': 33,
    'B': 34,
    'C': 33
  }
}