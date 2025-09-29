/**
 * WebSocket streaming system for real-time HCS message ingestion
 * Features exponential backoff, automatic reconnection, and polling fallback
 */

import { WS_RECONNECT_MAX_BACKOFF, WS_RECONNECT_JITTER_MAX, INGEST_DEBUG } from '@/lib/env'
import { syncState } from '@/lib/sync/syncState'

interface WebSocketOptions {
  topicId: string
  MIRROR_WS: string
  onMessage: (msg: any, consensusNs?: string) => void
  onError?: (error: any) => void
  onFallbackPoll?: (since?: string) => Promise<void>
  startTime?: string // Optional start time for initial connection
}

interface ConnectionState {
  ws: WebSocket | null
  backoffMs: number
  lastConsensusNs?: string
  reconnectTimeoutId?: NodeJS.Timeout
  closed: boolean
}

/**
 * Connect to HCS topic WebSocket stream with resilient retry logic
 * @param opts WebSocket configuration options
 * @returns Cleanup function to close the connection
 */
export function connectTopicWs(opts: WebSocketOptions): () => void {
  const { topicId, MIRROR_WS, onMessage, onError, onFallbackPoll, startTime } = opts
  
  const state: ConnectionState = {
    ws: null,
    backoffMs: 1000, // Start with 1 second
    closed: false
  }

  const url = buildWebSocketUrl(MIRROR_WS, topicId, startTime)
  
  if (INGEST_DEBUG) {
    console.info(`[WS] Connecting to ${topicId}`, { url })
  }

  const connect = () => {
    if (state.closed) return

    try {
      if (state.ws) {
        // Clean up existing connection
        state.ws.close()
        state.ws = null
      }

      state.ws = new WebSocket(url)

      state.ws.onopen = () => {
        state.backoffMs = 1000 // Reset backoff on successful connection
        
        // Update sync state on successful connection
        if (typeof window !== 'undefined') {
          syncState.setLive(true)
          // Note: Connection count will be managed by the ingestor
        }
        
        if (INGEST_DEBUG) {
          console.info(`[WS] Connected to ${topicId}`)
        }
      }

      state.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (INGEST_DEBUG && Math.random() < 0.1) { // Log 10% of messages to avoid spam
            console.debug(`[WS] Received message on ${topicId}`, {
              consensus: data.consensus_timestamp,
              sequence: data.sequence_number
            })
          }

          onMessage(data, data.consensus_timestamp)
          
          // Track last consensus timestamp for fallback polling
          if (data.consensus_timestamp) {
            state.lastConsensusNs = data.consensus_timestamp
          }
        } catch (error) {
          console.error(`[WS] Failed to parse message on ${topicId}:`, error)
          onError?.(error)
        }
      }

      state.ws.onerror = (error) => {
        console.warn(`[WS] Error on ${topicId}:`, error)
        onError?.(error)
      }

      state.ws.onclose = async (event) => {
        if (state.closed) return

        if (INGEST_DEBUG) {
          console.info(`[WS] Disconnected from ${topicId}`, { 
            code: event.code, 
            reason: event.reason,
            wasClean: event.wasClean 
          })
        }
        
        // Update sync state on disconnection
        if (typeof window !== 'undefined') {
          syncState.setLive(false)
        }

        // Trigger polling fallback while attempting to reconnect
        if (onFallbackPoll) {
          try {
            await onFallbackPoll(state.lastConsensusNs)
          } catch (error) {
            console.warn(`[WS] Fallback polling failed for ${topicId}:`, error)
          }
        }

        // Schedule reconnection with exponential backoff + jitter
        const jitter = Math.floor(Math.random() * WS_RECONNECT_JITTER_MAX)
        const delay = state.backoffMs + jitter
        
        if (INGEST_DEBUG) {
          console.info(`[WS] Reconnecting to ${topicId} in ${delay}ms`)
        }

        state.reconnectTimeoutId = setTimeout(() => {
          state.backoffMs = Math.min(state.backoffMs * 2, WS_RECONNECT_MAX_BACKOFF)
          connect()
        }, delay)
      }

    } catch (error) {
      console.error(`[WS] Failed to create WebSocket for ${topicId}:`, error)
      onError?.(error)
      
      // Schedule retry
      state.reconnectTimeoutId = setTimeout(() => {
        state.backoffMs = Math.min(state.backoffMs * 2, WS_RECONNECT_MAX_BACKOFF)
        connect()
      }, state.backoffMs + Math.floor(Math.random() * WS_RECONNECT_JITTER_MAX))
    }
  }

  // Start initial connection
  connect()

  // Return cleanup function
  return () => {
    state.closed = true
    
    if (state.reconnectTimeoutId) {
      clearTimeout(state.reconnectTimeoutId)
      state.reconnectTimeoutId = undefined
    }

    if (state.ws) {
      try {
        state.ws.close()
      } catch (error) {
        // Ignore close errors
      }
      state.ws = null
    }

    if (INGEST_DEBUG) {
      console.info(`[WS] Closed connection to ${topicId}`)
    }
  }
}

/**
 * Build WebSocket URL for Mirror Node streaming
 * @param baseWsUrl Mirror Node WebSocket base URL
 * @param topicId HCS topic ID
 * @param startTime Optional start time
 * @returns WebSocket URL
 */
function buildWebSocketUrl(baseWsUrl: string, topicId: string, startTime?: string): string {
  // Remove any trailing slashes and ensure correct protocol
  const cleanBaseUrl = baseWsUrl.replace(/\/+$/, '').replace(/^http/, 'ws')
  const params = new URLSearchParams()
  
  if (startTime) {
    params.set('startTime', startTime)
  } else {
    // Start from current time for new connections
    params.set('startTime', '0.0') // Use 0.0 to get all available messages
  }

  const queryString = params.toString()
  return `${cleanBaseUrl}/api/v1/topics/${topicId}/messages/stream${queryString ? `?${queryString}` : ''}`
}

/**
 * Create a WebSocket connection with health monitoring
 * @param opts WebSocket options with health callbacks
 * @returns Connection with health status
 */
export function createMonitoredConnection(opts: WebSocketOptions & {
  onHealthChange?: (healthy: boolean) => void
}) {
  let isHealthy = false
  let lastHeartbeat = Date.now()
  const healthCheckInterval = 30000 // 30 seconds
  
  const healthTimer = setInterval(() => {
    const now = Date.now()
    const wasHealthy = isHealthy
    isHealthy = (now - lastHeartbeat) < healthCheckInterval * 2 // Allow 2 intervals grace
    
    if (isHealthy !== wasHealthy) {
      opts.onHealthChange?.(isHealthy)
    }
  }, healthCheckInterval)

  const originalOnMessage = opts.onMessage
  const enhancedOptions = {
    ...opts,
    onMessage: (msg: any, consensusNs?: string) => {
      lastHeartbeat = Date.now()
      isHealthy = true
      originalOnMessage(msg, consensusNs)
    }
  }

  const cleanup = connectTopicWs(enhancedOptions)

  return {
    cleanup: () => {
      clearInterval(healthTimer)
      cleanup()
    },
    isHealthy: () => isHealthy,
    getLastHeartbeat: () => lastHeartbeat
  }
}