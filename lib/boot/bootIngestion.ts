/**
 * Boot integration for HCS ingestion system
 * Handles startup, shutdown, and lifecycle management
 */

import { startIngestion, stopIngestion, getIngestionHealth } from '@/lib/ingest/ingestor'
import { HCS_ENABLED, INGEST_DEBUG } from '@/lib/env'

let bootStarted = false
let shutdownHandlers: Array<() => void> = []

/**
 * Boot HCS ingestion once (idempotent)
 * Safe to call multiple times - will only start once
 */
export async function bootIngestionOnce(): Promise<void> {
  if (bootStarted) {
    if (INGEST_DEBUG) {
      console.info('[Boot] Ingestion already started, skipping duplicate boot')
    }
    return
  }

  if (!HCS_ENABLED) {
    console.info('[Boot] HCS ingestion disabled, skipping boot')
    return
  }

  bootStarted = true
  console.info('[Boot] Starting HCS ingestion…')

  try {
    await startIngestion()
    
    // Register shutdown handlers
    registerShutdownHandlers()
    
    console.info('[Boot] HCS ingestion started successfully')

    // Log periodic health checks in development
    if (INGEST_DEBUG) {
      const healthInterval = setInterval(() => {
        const health = getIngestionHealth()
        if (!health.healthy) {
          console.warn('[Boot] Ingestion health check failed:', health)
        }
      }, 30000) // Every 30 seconds

      shutdownHandlers.push(() => clearInterval(healthInterval))
    }

  } catch (error) {
    console.error('[Boot] Failed to start HCS ingestion:', error)
    bootStarted = false // Allow retry
    throw error
  }
}

/**
 * Force restart ingestion (mainly for development)
 */
export async function restartIngestion(): Promise<void> {
  console.info('[Boot] Restarting HCS ingestion…')
  
  await shutdownIngestion()
  
  // Reset boot state
  bootStarted = false
  
  // Wait a moment for cleanup
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  await bootIngestionOnce()
  
  console.info('[Boot] HCS ingestion restarted')
}

/**
 * Gracefully shutdown ingestion
 */
export async function shutdownIngestion(): Promise<void> {
  if (!bootStarted) {
    return
  }

  console.info('[Boot] Shutting down HCS ingestion…')

  try {
    // Run custom shutdown handlers first
    for (const handler of shutdownHandlers) {
      try {
        handler()
      } catch (error) {
        console.warn('[Boot] Shutdown handler failed:', error)
      }
    }
    shutdownHandlers.length = 0

    // Stop the main ingestion system
    stopIngestion()
    
    bootStarted = false
    console.info('[Boot] HCS ingestion shutdown complete')

  } catch (error) {
    console.error('[Boot] Error during ingestion shutdown:', error)
    throw error
  }
}

/**
 * Check if ingestion is booted and healthy
 */
export function isIngestionBooted(): boolean {
  return bootStarted
}

/**
 * Get current ingestion status
 */
export function getBootStatus() {
  return {
    booted: bootStarted,
    enabled: HCS_ENABLED,
    health: bootStarted ? getIngestionHealth() : null,
    shutdownHandlers: shutdownHandlers.length
  }
}

/**
 * Register shutdown handlers for graceful cleanup
 */
function registerShutdownHandlers(): void {
  // Only register once
  if (shutdownHandlers.length > 0) {
    return
  }

  // Browser environment
  if (typeof window !== 'undefined') {
    const cleanup = () => {
      console.info('[Boot] Page unloading, shutting down ingestion')
      shutdownIngestion().catch(console.error)
    }

    window.addEventListener('beforeunload', cleanup)
    window.addEventListener('unload', cleanup)

    shutdownHandlers.push(() => {
      window.removeEventListener('beforeunload', cleanup)
      window.removeEventListener('unload', cleanup)
    })
  }

  // Node.js environment
  if (typeof process !== 'undefined') {
    const cleanup = (signal: string) => {
      console.info(`[Boot] Received ${signal}, shutting down ingestion gracefully`)
      shutdownIngestion()
        .then(() => process.exit(0))
        .catch((error) => {
          console.error('[Boot] Shutdown failed:', error)
          process.exit(1)
        })
    }

    process.on('SIGINT', () => cleanup('SIGINT'))
    process.on('SIGTERM', () => cleanup('SIGTERM'))

    shutdownHandlers.push(() => {
      process.removeAllListeners('SIGINT')
      process.removeAllListeners('SIGTERM')
    })
  }

  if (INGEST_DEBUG) {
    console.info(`[Boot] Registered ${shutdownHandlers.length} shutdown handlers`)
  }
}

/**
 * Add custom shutdown handler
 * @param handler Function to call during shutdown
 */
export function addShutdownHandler(handler: () => void): void {
  shutdownHandlers.push(handler)
}

/**
 * Development helper to expose boot controls globally
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).trustmeshBoot = {
    start: bootIngestionOnce,
    restart: restartIngestion,
    shutdown: shutdownIngestion,
    status: getBootStatus,
    isBooted: isIngestionBooted
  }
}