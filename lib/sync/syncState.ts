/**
 * Sync state management for HCS ingestion status tracking
 * Provides live/paused state, last sync time, and error tracking
 */

interface SyncState {
  live: boolean
  lastSyncedMs: number | null
  errors: string[]
  connectionCount: number
  lastActivityMs: number | null
}

class SyncStateManager {
  private state: SyncState = {
    live: false,
    lastSyncedMs: null,
    errors: [],
    connectionCount: 0,
    lastActivityMs: null
  }

  private listeners: Array<(state: SyncState) => void> = []

  /**
   * Get current sync state
   */
  get(): SyncState {
    return { ...this.state }
  }

  /**
   * Subscribe to sync state changes
   */
  subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  /**
   * Notify all listeners of state changes
   */
  private notify(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.get())
      } catch (error) {
        console.error('[SyncState] Listener error:', error)
      }
    })
  }

  /**
   * Set live/paused state
   */
  setLive(live: boolean): void {
    if (this.state.live !== live) {
      this.state.live = live
      this.notify()
    }
  }

  /**
   * Mark successful sync with current timestamp
   */
  markSynced(): void {
    this.state.lastSyncedMs = Date.now()
    this.state.lastActivityMs = Date.now()
    this.notify()
  }

  /**
   * Record activity (message received, connection event, etc.)
   */
  recordActivity(): void {
    this.state.lastActivityMs = Date.now()
    this.notify()
  }

  /**
   * Add an error to the error list
   */
  pushError(error: unknown): void {
    const errorString = String(error).slice(0, 200) // Limit error length
    this.state.errors.push(errorString)
    
    // Keep only last 10 errors to prevent memory leak
    if (this.state.errors.length > 10) {
      this.state.errors = this.state.errors.slice(-10)
    }
    
    this.notify()
  }

  /**
   * Clear all errors
   */
  resetErrors(): void {
    if (this.state.errors.length > 0) {
      this.state.errors = []
      this.notify()
    }
  }

  /**
   * Update connection count (active WebSocket connections)
   */
  setConnectionCount(count: number): void {
    if (this.state.connectionCount !== count) {
      this.state.connectionCount = count
      this.notify()
    }
  }

  /**
   * Get health status derived from current state
   */
  getHealth(): {
    healthy: boolean
    status: 'healthy' | 'degraded' | 'down'
    issues: string[]
  } {
    const now = Date.now()
    const issues: string[] = []
    
    // Check if we're live
    if (!this.state.live) {
      issues.push('Not connected to live stream')
    }

    // Check if we have active connections
    if (this.state.connectionCount === 0) {
      issues.push('No active connections')
    }

    // Check for recent activity
    const fiveMinutesAgo = now - (5 * 60 * 1000)
    if (this.state.lastActivityMs && this.state.lastActivityMs < fiveMinutesAgo) {
      issues.push('No recent activity')
    }

    // Check for recent errors
    if (this.state.errors.length > 0) {
      issues.push(`${this.state.errors.length} error(s)`)
    }

    // Determine overall health
    let status: 'healthy' | 'degraded' | 'down'
    if (issues.length === 0) {
      status = 'healthy'
    } else if (this.state.live && this.state.connectionCount > 0) {
      status = 'degraded'
    } else {
      status = 'down'
    }

    return {
      healthy: status === 'healthy',
      status,
      issues
    }
  }

  /**
   * Get formatted time since last sync
   */
  getTimeSinceLastSync(): string | null {
    if (!this.state.lastSyncedMs) return null
    
    const seconds = Math.floor((Date.now() - this.state.lastSyncedMs) / 1000)
    
    if (seconds < 60) {
      return `${seconds}s ago`
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ago`
    } else {
      return `${Math.floor(seconds / 3600)}h ago`
    }
  }

  /**
   * Reset all state (useful for testing)
   */
  reset(): void {
    this.state = {
      live: false,
      lastSyncedMs: null,
      errors: [],
      connectionCount: 0,
      lastActivityMs: null
    }
    this.notify()
  }
}

// Singleton instance
export const syncState = new SyncStateManager()

// React hook for subscribing to sync state
export function useSyncState() {
  const [state, setState] = React.useState(syncState.get())
  
  React.useEffect(() => {
    return syncState.subscribe(setState)
  }, [])
  
  return state
}

// Make React import conditional for environments where React isn't available
let React: any
try {
  React = require('react')
} catch {
  // Fallback for non-React environments
  React = {
    useState: () => [syncState.get(), () => {}],
    useEffect: () => {}
  }
}