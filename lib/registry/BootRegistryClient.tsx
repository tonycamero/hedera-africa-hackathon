"use client"

import { useEffect, useState } from 'react'
import { fetchRegistry, clearRegistryCache } from './clientRegistry'
import type { RegistryConfig } from './serverRegistry'

// Global registry state for components to consume
let globalRegistry: RegistryConfig | null = null
let registryLoadPromise: Promise<RegistryConfig> | null = null

export function BootRegistryClient() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [registry, setRegistry] = useState<RegistryConfig | null>(null)

  useEffect(() => {
    async function initializeRegistry() {
      try {
        console.log('[Boot Registry] Starting registry initialization...')
        setError(null)
        setIsLoading(true)

        // Clear any stale cache on page load 
        if (performance.getEntriesByType('navigation')[0]?.type === 'reload') {
          console.log('[Boot Registry] Page reload detected, clearing cache')
          clearRegistryCache()
        }

        // Fetch registry configuration
        const config = await fetchRegistry()
        
        // Store globally for other components
        globalRegistry = config
        registryLoadPromise = Promise.resolve(config)
        setRegistry(config)

        console.log('[Boot Registry] Registry initialization complete:', {
          env: config.env,
          mirror: config.mirror.rest,
          topics: Object.keys(config.topics),
          flags: Object.keys(config.flags).filter(key => config.flags[key])
        })

        // Notify other services that registry is ready
        window.dispatchEvent(new CustomEvent('registry-loaded', { 
          detail: { registry: config } 
        }))

        setIsLoading(false)
      } catch (err: any) {
        console.error('[Boot Registry] Failed to initialize registry:', err)
        setError(err.message || 'Failed to load registry')
        setIsLoading(false)
      }
    }

    initializeRegistry()

    // Set up periodic refresh (every 5 minutes)
    const refreshInterval = setInterval(async () => {
      try {
        console.log('[Boot Registry] Periodic refresh check...')
        await fetchRegistry() // Uses cache unless stale
      } catch (error) {
        console.warn('[Boot Registry] Periodic refresh failed:', error)
      }
    }, 5 * 60 * 1000)

    return () => {
      clearInterval(refreshInterval)
    }
  }, [])

  return null // No UI - registry status removed
}

// Global accessor for components that need registry synchronously
export function getGlobalRegistry(): RegistryConfig | null {
  return globalRegistry
}

// Promise-based accessor for components that can wait
export async function waitForRegistry(): Promise<RegistryConfig> {
  if (globalRegistry) {
    return globalRegistry
  }

  if (registryLoadPromise) {
    return registryLoadPromise
  }

  // If not loaded yet, fetch it
  const config = await fetchRegistry()
  globalRegistry = config
  return config
}

// Hook for React components
export function useRegistry() {
  const [registry, setRegistry] = useState<RegistryConfig | null>(getGlobalRegistry())
  const [isLoading, setIsLoading] = useState(!registry)

  useEffect(() => {
    if (registry) return // Already have it

    let mounted = true
    
    waitForRegistry()
      .then(config => {
        if (mounted) {
          setRegistry(config)
          setIsLoading(false)
        }
      })
      .catch(error => {
        console.error('[useRegistry] Failed to load:', error)
        if (mounted) {
          setIsLoading(false)
        }
      })

    // Listen for registry updates
    const handleRegistryUpdate = (event: CustomEvent) => {
      if (mounted) {
        setRegistry(event.detail.registry)
      }
    }

    window.addEventListener('registry-loaded', handleRegistryUpdate as EventListener)

    return () => {
      mounted = false
      window.removeEventListener('registry-loaded', handleRegistryUpdate as EventListener)
    }
  }, [registry])

  return {
    registry,
    isLoading,
    refresh: () => fetchRegistry(true)
  }
}