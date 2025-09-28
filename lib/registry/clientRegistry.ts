"use client"

import type { RegistryConfig } from './serverRegistry'

let cachedRegistry: RegistryConfig | null = null
let cacheTimestamp = 0
let fetchPromise: Promise<RegistryConfig> | null = null

const CACHE_TTL = 30000 // 30 seconds
const STALE_WHILE_REVALIDATE = 600000 // 10 minutes

export interface RegistryResponse {
  ok: boolean
  registry: RegistryConfig
  meta: {
    source: string
    timestamp: string
    version: string
  }
  error?: string
}

export async function fetchRegistry(force = false): Promise<RegistryConfig> {
  const now = Date.now()
  const isStale = now - cacheTimestamp > CACHE_TTL
  const isVeryStale = now - cacheTimestamp > STALE_WHILE_REVALIDATE

  // Return cached if fresh enough
  if (cachedRegistry && !force && !isStale) {
    console.log('[Registry Client] Using fresh cache')
    return cachedRegistry
  }

  // Return stale cache while fetching fresh data (unless very stale)
  if (cachedRegistry && !force && !isVeryStale) {
    console.log('[Registry Client] Using stale cache, fetching fresh data in background')
    // Fetch in background without awaiting
    fetchRegistryFromServer().catch(error => 
      console.warn('[Registry Client] Background fetch failed:', error)
    )
    return cachedRegistry
  }

  // Block and fetch fresh data
  if (fetchPromise) {
    console.log('[Registry Client] Waiting for ongoing fetch')
    return fetchPromise
  }

  fetchPromise = fetchRegistryFromServer()
  
  try {
    const result = await fetchPromise
    fetchPromise = null
    return result
  } catch (error) {
    fetchPromise = null
    // If we have stale cache, return it on error
    if (cachedRegistry) {
      console.warn('[Registry Client] Fetch failed, returning stale cache:', error)
      return cachedRegistry
    }
    throw error
  }
}

async function fetchRegistryFromServer(): Promise<RegistryConfig> {
  try {
    console.log('[Registry Client] Fetching from server...')
    
    const response = await fetch('/api/registry/config', {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const data: RegistryResponse = await response.json()
    
    if (!data.ok) {
      throw new Error(data.error || 'Registry API returned error')
    }

    // Update cache
    cachedRegistry = data.registry
    cacheTimestamp = Date.now()
    
    console.log('[Registry Client] Registry loaded from server:', {
      source: data.meta.source,
      env: data.registry.env,
      topics: Object.keys(data.registry.topics).length,
      cached: true
    })

    return data.registry
  } catch (error) {
    console.error('[Registry Client] Failed to fetch registry:', error)
    throw error
  }
}

// Get cached registry (synchronous)
export function getCachedRegistry(): RegistryConfig | null {
  return cachedRegistry
}

// Check if cache is stale
export function isCacheStale(): boolean {
  return !cachedRegistry || Date.now() - cacheTimestamp > CACHE_TTL
}

// Force refresh
export async function refreshRegistry(): Promise<RegistryConfig> {
  return fetchRegistry(true)
}

// Clear cache (for testing)
export function clearRegistryCache(): void {
  cachedRegistry = null
  cacheTimestamp = 0
  fetchPromise = null
  console.log('[Registry Client] Cache cleared')
}

// Convenience methods for common registry access patterns
export async function getTopicIds(): Promise<Record<string, string>> {
  const registry = await fetchRegistry()
  const result: Record<string, string> = {}
  
  Object.entries(registry.topics).forEach(([key, value]) => {
    if (typeof value === 'string') {
      result[key] = value
    } else if (typeof value === 'object' && 'id' in value) {
      result[key] = value.id
    }
  })
  
  return result
}

export async function getMirrorUrls(): Promise<{ rest: string; ws: string }> {
  const registry = await fetchRegistry()
  return registry.mirror
}

export async function getFeatureFlags(): Promise<Record<string, any>> {
  const registry = await fetchRegistry()
  return registry.flags
}

// URL builders using client registry
export async function buildMirrorRestUrl(topicId?: string): Promise<string> {
  const registry = await fetchRegistry()
  const baseUrl = registry.mirror.rest
  
  if (topicId) {
    return `${baseUrl}/topics/${encodeURIComponent(topicId)}/messages`
  }
  return baseUrl
}

export async function buildMirrorWsUrl(topicId: string): Promise<string> {
  const registry = await fetchRegistry()
  const baseUrl = registry.mirror.ws
  return `${baseUrl}/api/v1/topics/${encodeURIComponent(topicId)}/messages`
}