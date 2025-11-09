/**
 * Cursor persistence for HCS ingestion deduplication
 * Tracks the last processed consensus timestamp per topic to avoid duplicate processing
 */

import { CURSOR_STORAGE_PREFIX } from '@/lib/env'

// In-memory cache for cursors (persisted to localStorage when available)
const cursorCache = new Map<string, string>()

/**
 * Load cursor (last processed consensus timestamp) for a topic
 * @param key Topic key (e.g., 'contacts', 'trust', 'recognition')
 * @returns Last consensus timestamp or null if none stored
 */
export async function loadCursor(key: string): Promise<string | null> {
  // Check memory cache first
  const cached = cursorCache.get(key)
  if (cached) return cached

  // Try to load from localStorage if in browser
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem(`${CURSOR_STORAGE_PREFIX}:${key}`)
      if (stored) {
        cursorCache.set(key, stored)
        return stored
      }
    } catch (error) {
      console.warn('[Cursor] Failed to load from localStorage:', error)
    }
  }

  return null
}

/**
 * Save cursor (last processed consensus timestamp) for a topic
 * @param key Topic key
 * @param consensusNs Consensus timestamp to save
 */
export async function saveCursor(key: string, consensusNs: string): Promise<void> {
  // Update memory cache
  cursorCache.set(key, consensusNs)

  // Persist to localStorage if available
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(`${CURSOR_STORAGE_PREFIX}:${key}`, consensusNs)
    } catch (error) {
      console.warn('[Cursor] Failed to save to localStorage:', error)
    }
  }
}

/**
 * Clear cursor for a topic (useful for testing or reset scenarios)
 * @param key Topic key
 */
export async function clearCursor(key: string): Promise<void> {
  cursorCache.delete(key)
  
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(`${CURSOR_STORAGE_PREFIX}:${key}`)
    } catch (error) {
      console.warn('[Cursor] Failed to clear from localStorage:', error)
    }
  }
}

/**
 * Clear all cursors (force full re-sync from HCS)
 */
export async function clearAllCursors(): Promise<void> {
  console.log('[Cursor] Clearing all cursors...')
  
  // Clear memory cache
  cursorCache.clear()
  
  // Clear localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(`${CURSOR_STORAGE_PREFIX}:`)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      console.log(`[Cursor] Cleared ${keysToRemove.length} cursors from localStorage`)
    } catch (error) {
      console.warn('[Cursor] Failed to clear from localStorage:', error)
    }
  }
}

/**
 * Get all cursors for debugging
 * @returns Map of all stored cursors
 */
export function getAllCursors(): Record<string, string> {
  const result: Record<string, string> = {}
  
  // From memory cache
  for (const [key, value] of cursorCache) {
    result[key] = value
  }
  
  // Also check localStorage for any not in memory
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(`${CURSOR_STORAGE_PREFIX}:`)) {
          const topicKey = key.replace(`${CURSOR_STORAGE_PREFIX}:`, '')
          if (!result[topicKey]) {
            const value = localStorage.getItem(key)
            if (value) {
              result[topicKey] = value
            }
          }
        }
      }
    } catch (error) {
      console.warn('[Cursor] Failed to read all from localStorage:', error)
    }
  }
  
  return result
}