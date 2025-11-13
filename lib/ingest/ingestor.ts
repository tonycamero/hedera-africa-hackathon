/**
 * Core HCS ingestion orchestrator
 * Coordinates backfill, streaming, and two-phase recognition processing
 */

import { HCS_ENABLED, MIRROR_REST, MIRROR_WS, TOPICS, TopicKey, INGEST_DEBUG, WS_ENABLED, REST_POLL_INTERVAL } from '@/lib/env'
import { signalsStore } from '@/lib/stores/signalsStore'
import { circleState } from '@/lib/stores/HcsCircleState'
import { normalizeHcsMessage } from './normalizers'
import { backfillTopic } from './restBackfill'
import { connectTopicWs } from './wsStream'
import { loadCursor, saveCursor, clearAllCursors, getAllCursors } from './cursor'
import { syncState } from '@/lib/sync/syncState'

interface IngestStats {
  backfilled: number
  streamed: number
  duplicates: number
  failed: number
  lastConsensusNs?: string
  lastActivity?: number
}

// Global stats tracking
const stats: Record<TopicKey, IngestStats> = {
  contacts: { backfilled: 0, streamed: 0, duplicates: 0, failed: 0 },
  trust: { backfilled: 0, streamed: 0, duplicates: 0, failed: 0 },
  profile: { backfilled: 0, streamed: 0, duplicates: 0, failed: 0 },
  signal: { backfilled: 0, streamed: 0, duplicates: 0, failed: 0 },
  recognition: { backfilled: 0, streamed: 0, duplicates: 0, failed: 0 },
}

// Track active connections for cleanup
const activeConnections = new Map<TopicKey, () => void>()

// Track REST polling intervals
const pollingIntervals = new Map<TopicKey, NodeJS.Timeout>()

let ingestionStarted = false

/**
 * Start HCS ingestion for all configured topics
 */
export async function startIngestion(): Promise<void> {
  if (!HCS_ENABLED) {
    console.info('[Ingest] HCS disabled. Skipping ingestion.')
    return
  }

  if (ingestionStarted) {
    console.warn('[Ingest] Ingestion already started. Skipping duplicate start.')
    return
  }

  ingestionStarted = true
  
  console.info('[Ingest] Starting ingestion…', { 
    MIRROR_REST, 
    MIRROR_WS, 
    TOPICS,
    topicCount: Object.keys(TOPICS).length 
  })

  try {
    // Phase 1: Backfill historical data for each topic (with error recovery)
    try {
      await backfillAllTopics()
    } catch (backfillError) {
      console.error('[Ingest] Backfill failed, continuing with degraded functionality:', backfillError)
      // Don't throw - allow streaming to continue
    }

    // Phase 2: Start real-time streaming for each topic (with error recovery)
    try {
      if (WS_ENABLED) {
        console.info('[Ingest] WebSocket streaming enabled')
        startStreamingAllTopics()
      } else {
        console.info('[Ingest] WebSocket disabled, using REST polling only')
        startRestPollingAllTopics()
      }
    } catch (streamingError) {
      console.error('[Ingest] Streaming failed, running with cached data only:', streamingError)
      // Don't throw - system can still use cached data
    }

    // Expose debug interface
    exposeDebugInterface()

    console.info('[Ingest] Ingestion started (may be running in degraded mode if errors occurred)')

  } catch (error) {
    console.error('[Ingest] Critical ingestion failure:', error)
    // Only throw if absolutely critical systems fail
    // For now, allow degraded operation
    console.warn('[Ingest] Running in emergency fallback mode - UI may have limited functionality')
  }
}

/**
 * Stop all ingestion processes
 */
export function stopIngestion(): void {
  console.info('[Ingest] Stopping ingestion…')
  
  // Clear all polling intervals
  for (const [topic, intervalId] of pollingIntervals) {
    clearInterval(intervalId)
    console.info(`[Ingest] Stopped polling for ${topic}`)
  }
  pollingIntervals.clear()
  
  // Close all active connections
  for (const [topic, cleanup] of activeConnections) {
    try {
      cleanup()
      console.info(`[Ingest] Closed connection for ${topic}`)
    } catch (error) {
      console.warn(`[Ingest] Failed to close connection for ${topic}:`, error)
    }
  }
  
  activeConnections.clear()
  ingestionStarted = false
  
  // Update sync state
  if (typeof window !== 'undefined') {
    syncState.setConnectionCount(0)
    syncState.setLive(false)
  }
  
  console.info('[Ingest] Ingestion stopped')
}

/**
 * Backfill all topics with historical data
 */
async function backfillAllTopics(): Promise<void> {
  // Filter out empty or invalid topic IDs
  const validTopics = Object.entries(TOPICS).filter(([key, topicId]) => {
    const isValid = topicId && topicId.trim() !== '' && topicId.match(/^0\.0\.[0-9]+$/)
    if (!isValid) {
      console.warn(`[Ingest] Skipping invalid topic ID for ${key}: "${topicId}"`)
    }
    return isValid
  })
  
  console.info(`[Ingest] Backfilling ${validTopics.length} valid topics out of ${Object.entries(TOPICS).length} configured`)
  
  const backfillPromises = validTopics.map(async ([key, topicId]) => {
    const topicKey = key as TopicKey
    
    // Try to load saved cursor, fallback to 7-day lookback
    let since = await loadCursor(topicKey)
    
    if (!since) {
      // No cursor saved - use 7-day lookback window
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      const sevenDaysAgoSec = Math.floor(sevenDaysAgo / 1000)
      since = `${sevenDaysAgoSec}.0`
      console.info(`[Ingest] No cursor for ${topicKey}, using 7-day lookback: ${since}`)
    }
    
    try {
      const { count, last } = await backfillTopic({
        topicId,
        since,
        MIRROR_REST,
        onMessage: (msg, consensusNs) => handleMessage(topicKey, msg, 'hcs-cached', consensusNs),
      })
      
      stats[topicKey].backfilled += count
      
      if (last) {
        stats[topicKey].lastConsensusNs = last
        await saveCursor(topicKey, last)
      }
      
      console.info(`[Ingest] Backfill completed for ${topicKey}`, { count, last, since })
      
    } catch (error) {
      stats[topicKey].failed++
      console.error(`[Ingest] Backfill failed for ${topicKey}:`, error)
      // Continue with other topics rather than failing completely
      console.warn(`[Ingest] Continuing without ${topicKey} backfill data - topic may be empty or inaccessible`)
    }
  })
  
  // Use allSettled to allow some topics to fail without breaking others
  const backfillResults = await Promise.allSettled(backfillPromises)
  
  // Log results summary
  const successful = backfillResults.filter(r => r.status === 'fulfilled').length
  const failed = backfillResults.filter(r => r.status === 'rejected').length
  
  console.info(`[Ingest] Backfill summary: ${successful} successful, ${failed} failed topics`)
  
  if (failed > 0) {
    console.warn('[Ingest] Some topics failed to backfill, but ingestion will continue with available data')
    backfillResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        const [topicKey] = validTopics[index]
        console.error(`[Ingest] Topic ${topicKey} backfill failed:`, result.reason)
      }
    })
  }
  
  // Backfill complete - all events normalized and added to store
}

/**
 * Start streaming for all topics
 */
function startStreamingAllTopics(): void {
  // Filter out empty or invalid topic IDs
  const validTopics = Object.entries(TOPICS).filter(([key, topicId]) => {
    const isValid = topicId && topicId.trim() !== '' && topicId.match(/^0\.0\.[0-9]+$/)
    if (!isValid) {
      console.warn(`[Ingest] Skipping invalid topic ID for streaming ${key}: "${topicId}"`)
    }
    return isValid
  })
  
  console.info(`[Ingest] Starting streaming for ${validTopics.length} valid topics`)
  
  validTopics.forEach(([key, topicId]) => {
    const topicKey = key as TopicKey
    
    const cleanup = connectTopicWs({
      topicId,
      MIRROR_WS,
      onMessage: async (msg, consensusNs) => {
        handleMessage(topicKey, msg, 'hcs', consensusNs)
        stats[topicKey].streamed++
        stats[topicKey].lastActivity = Date.now()
        
        // Update sync state
        syncState.recordActivity()
        syncState.markSynced()
        
        // Update cursor if this is a newer message
        if (consensusNs && (!stats[topicKey].lastConsensusNs || compareConsensusNs(consensusNs, stats[topicKey].lastConsensusNs!) > 0)) {
          stats[topicKey].lastConsensusNs = consensusNs
          await saveCursor(topicKey, consensusNs)
        }
      },
      onError: (error) => {
        console.warn(`[Ingest] WebSocket error for ${topicKey}:`, error)
        stats[topicKey].failed++
        syncState.pushError(error)
      },
      onFallbackPoll: async (since) => {
        // Use REST backfill to bridge WebSocket gaps
        try {
          const { count, last } = await backfillTopic({
            topicId,
            since: since || stats[topicKey].lastConsensusNs,
            MIRROR_REST,
            onMessage: (msg, consensusNs) => handleMessage(topicKey, msg, 'hcs', consensusNs),
          })
          
          if (count > 0) {
            stats[topicKey].backfilled += count
            console.info(`[Ingest] Fallback polling recovered ${count} messages for ${topicKey}`)
          }
          
          if (last) {
            stats[topicKey].lastConsensusNs = last
            await saveCursor(topicKey, last)
          }
        } catch (error) {
          console.warn(`[Ingest] Fallback polling failed for ${topicKey}:`, error)
        }
      }
    })
    
    activeConnections.set(topicKey, cleanup)
    console.info(`[Ingest] Started streaming for ${topicKey}`)
  })
  
  // Update connection count after all connections are established
  if (typeof window !== 'undefined') {
    syncState.setConnectionCount(activeConnections.size)
  }
}

/**
 * Start REST polling for all topics (fallback when WebSocket is unavailable)
 */
function startRestPollingAllTopics(): void {
  // Filter out empty or invalid topic IDs
  const validTopics = Object.entries(TOPICS).filter(([key, topicId]) => {
    const isValid = topicId && topicId.trim() !== '' && topicId.match(/^0\.0\.[0-9]+$/)
    if (!isValid) {
      console.warn(`[Ingest] Skipping invalid topic ID for REST polling ${key}: "${topicId}"`)
    }
    return isValid
  })
  
  console.info(`[Ingest] Starting REST polling for ${validTopics.length} valid topics (interval: ${REST_POLL_INTERVAL}ms)`)
  
  validTopics.forEach(([key, topicId]) => {
    const topicKey = key as TopicKey
    
    // Create polling function
    const poll = async () => {
      try {
        const { count, last } = await backfillTopic({
          topicId,
          since: stats[topicKey].lastConsensusNs,
          MIRROR_REST,
          onMessage: (msg, consensusNs) => {
            handleMessage(topicKey, msg, 'hcs', consensusNs)
            stats[topicKey].streamed++
          },
        })
        
        if (count > 0) {
          console.info(`[Ingest] REST poll found ${count} new messages for ${topicKey}`)
          stats[topicKey].lastActivity = Date.now()
          syncState.recordActivity()
          syncState.markSynced()
        }
        
        if (last) {
          stats[topicKey].lastConsensusNs = last
          await saveCursor(topicKey, last)
        }
      } catch (error) {
        console.warn(`[Ingest] REST polling failed for ${topicKey}:`, error)
        stats[topicKey].failed++
        syncState.pushError(error)
      }
    }
    
    // Start polling immediately, then on interval
    poll()
    const intervalId = setInterval(poll, REST_POLL_INTERVAL)
    pollingIntervals.set(topicKey, intervalId)
    
    console.info(`[Ingest] Started REST polling for ${topicKey}`)
  })
  
  // Update sync state
  if (typeof window !== 'undefined') {
    syncState.setConnectionCount(pollingIntervals.size)
    syncState.setLive(true) // Consider polling as "live"
  }
}

/**
 * Handle incoming message for a specific topic
 * All topics now use standard normalization (no special recognition handling)
 */
function handleMessage(topic: TopicKey, raw: any, source: 'hcs' | 'hcs-cached', consensusNs?: string): void {
  try {
    stats[topic].lastActivity = Date.now()
    
    // Standard message processing for all topics
    const normalizedEvent = normalizeHcsMessage(raw, source)
    if (normalizedEvent) {
      // Add to SignalsStore (existing behavior)
      signalsStore.add(normalizedEvent)
      
      // NEW: Update HcsCircleState for contact/trust events
      if (normalizedEvent.type === 'CONTACT_ACCEPT' || normalizedEvent.type === 'CONTACT_REVOKE') {
        circleState.addContactEvent({
          type: normalizedEvent.type,
          actor: normalizedEvent.actor,
          target: normalizedEvent.target,
          ts: normalizedEvent.ts,
          metadata: normalizedEvent.metadata
        })
      } else if (normalizedEvent.type === 'TRUST_ALLOCATE') {
        circleState.addTrustEvent({
          type: normalizedEvent.type,
          actor: normalizedEvent.actor,
          target: normalizedEvent.target,
          ts: normalizedEvent.ts,
          metadata: normalizedEvent.metadata
        })
      }
    } else {
      stats[topic].failed++
      if (INGEST_DEBUG) {
        console.debug(`[Ingest] Failed to normalize message for ${topic}`, { raw })
      }
    }

  } catch (error) {
    stats[topic].failed++
    console.error(`[Ingest] handleMessage failed for ${topic}:`, error, { 
      consensusNs, 
      sequence: raw.sequence_number,
      topicId: raw.topic_id 
    })
  }
}


/**
 * Expose debug interface to global scope
 */
function exposeDebugInterface(): void {
  if (typeof window !== 'undefined') {
    // Browser environment
    (window as any).trustmeshIngest = {
      stats: () => ({ ...stats }),
      signalsStore: () => {
        try {
          return signalsStore.getSummary();
        } catch (error) {
          console.warn('[Ingest] Failed to get signalsStore summary in debug interface:', error);
          return { countsByType: {}, countsBySource: { 'hcs': 0, 'hcs-cached': 0 }, total: 0 };
        }
      },
      restart: async () => {
        stopIngestion()
        await new Promise(resolve => setTimeout(resolve, 1000))
        await startIngestion()
      },
      clearCaches: () => {
        signalsStore.clear()
        circleState.clear()
        Object.keys(stats).forEach(key => {
          const topicKey = key as TopicKey
          stats[topicKey] = { backfilled: 0, streamed: 0, duplicates: 0, failed: 0 }
        })
      },
      // NEW: Cursor management for debugging
      cursors: () => getAllCursors(),
      clearCursors: async () => {
        await clearAllCursors()
        console.log('[Debug] Cursors cleared - restart ingestion to resync from 7 days ago')
      },
      forceResync: async () => {
        console.log('[Debug] Force resync: clearing all caches and cursors...')
        await clearAllCursors()
        signalsStore.clear()
        circleState.clear()
        stopIngestion()
        await new Promise(resolve => setTimeout(resolve, 1000))
        await startIngestion()
        console.log('[Debug] Resync complete - reloaded from 7-day lookback window')
      }
    }
  } else {
    // Node environment (for API endpoints)
    (global as any).__ingest_stats__ = stats
  }
}

/**
 * Get current ingestion statistics
 * @returns Statistics for all topics
 */
export function getIngestionStats() {
  // Safely get signalsStore summary, handling potential SSR/client differences
  let signalsStoreSummary;
  try {
    signalsStoreSummary = signalsStore.getSummary();
  } catch (error) {
    console.warn('[Ingest] Failed to get signalsStore summary:', error);
    signalsStoreSummary = {
      countsByType: {},
      countsBySource: { 'hcs': 0, 'hcs-cached': 0 },
      total: 0,
      lastTs: undefined
    };
  }
  
  return {
    ...stats,
    totalMessages: Object.values(stats).reduce((sum, s) => sum + s.backfilled + s.streamed, 0),
    totalErrors: Object.values(stats).reduce((sum, s) => sum + s.failed, 0),
    isRunning: ingestionStarted,
    activeConnections: activeConnections.size,
    signalsStore: signalsStoreSummary,
  }
}

/**
 * Get health status of ingestion system
 */
export function getIngestionHealth() {
  const now = Date.now()
  const fiveMinutesAgo = now - (5 * 60 * 1000)
  
  const recentActivity = Object.values(stats).some(s => 
    s.lastActivity && s.lastActivity > fiveMinutesAgo
  )
  
  return {
    healthy: ingestionStarted && activeConnections.size > 0,
    running: ingestionStarted,
    activeConnections: activeConnections.size,
    recentActivity,
    lastActivity: Math.max(...Object.values(stats).map(s => s.lastActivity || 0)),
    totalMessages: Object.values(stats).reduce((sum, s) => sum + s.backfilled + s.streamed, 0),
    totalErrors: Object.values(stats).reduce((sum, s) => sum + s.failed, 0),
  }
}