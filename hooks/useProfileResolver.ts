/**
 * Hook to resolve Hedera account IDs to display names
 * Uses the profile normalizer API to fetch names
 */

import { useState, useEffect } from 'react'

interface ProfileCache {
  [accountId: string]: {
    displayName: string
    timestamp: number
  }
}

const profileCache: ProfileCache = {}
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function useProfileResolver() {
  const [loading, setLoading] = useState<Set<string>>(new Set())

  const resolveProfile = async (accountId: string): Promise<string> => {
    // Check cache first
    const cached = profileCache[accountId]
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.displayName
    }

    // Check if already loading
    if (loading.has(accountId)) {
      return getDisplayName(accountId) // Return fallback while loading
    }

    try {
      setLoading(prev => new Set([...prev, accountId]))

      const response = await fetch(`/api/profile/status?accountId=${encodeURIComponent(accountId)}`)
      const data = await response.json()

      let displayName = getDisplayName(accountId) // fallback

      if (data.profile?.displayName && data.profile.displayName !== 'Unnamed') {
        displayName = data.profile.displayName
      }

      // Cache result
      profileCache[accountId] = {
        displayName,
        timestamp: Date.now()
      }

      return displayName
    } catch (error) {
      console.warn('[ProfileResolver] Failed to resolve:', accountId, error)
      return getDisplayName(accountId)
    } finally {
      setLoading(prev => {
        const next = new Set(prev)
        next.delete(accountId)
        return next
      })
    }
  }

  return { resolveProfile }
}

/**
 * Get a display name for an account ID (fallback)
 */
function getDisplayName(accountId: string): string {
  if (accountId.startsWith('0.0.')) {
    const parts = accountId.split('.')
    return `...${parts[2]?.slice(-4) || accountId.slice(-4)}`
  }
  
  if (accountId.startsWith('tm-') && accountId.length > 3) {
    const namepart = accountId.slice(3).replace(/-/g, ' ')
    const words = namepart.split(' ')
    return words[0].charAt(0).toUpperCase() + words[0].slice(1)
  }
  
  return accountId.length > 10 ? accountId.slice(0, 6) : accountId
}