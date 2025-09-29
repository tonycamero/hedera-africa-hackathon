/**
 * Core HCS ingestion orchestrator
 * Coordinates backfill, streaming, and two-phase recognition processing
 */

import { HCS_ENABLED, MIRROR_REST, MIRROR_WS, TOPICS, TopicKey, INGEST_DEBUG } from '@/lib/env'
import { signalsStore } from '@/lib/stores/signalsStore'
import { normalizeHcsMessage } from './normalizers'
import { decodeRecognition, isRecognitionDefinition, isRecognitionInstance } from './recognition/decodeRecognition'
import { recognitionCache } from './recognition/cache'
import { backfillTopic } from './restBackfill'
import { connectTopicWs } from './wsStream'
import { loadCursor, saveCursor } from './cursor'
import { compareConsensusNs } from './time'
import { syncState } from '@/lib/sync/syncState'

interface IngestStats {
  backfilled: number
  streamed: number
  duplicates: number
  failed: number
  lastConsensusNs?: string
  lastActivity?: number
  recognitionDefinitions?: number
  recognitionInstances?: number
  recognitionPending?: number
}

// Global stats tracking
const stats: Record<TopicKey, IngestStats> = {
  contacts: { backfilled: 0, streamed: 0, duplicates: 0, failed: 0 },
  trust: { backfilled: 0, streamed: 0, duplicates: 0, failed: 0 },
  profile: { backfilled: 0, streamed: 0, duplicates: 0, failed: 0 },
  signal: { backfilled: 0, streamed: 0, duplicates: 0, failed: 0 },
  recognition: { backfilled: 0, streamed: 0, duplicates: 0, failed: 0, recognitionDefinitions: 0, recognitionInstances: 0, recognitionPending: 0 },
}

// Track active connections for cleanup
const activeConnections = new Map<TopicKey, () => void>()

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
      startStreamingAllTopics()
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
    const since = await loadCursor(topicKey)
    
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
  
  // After backfill, process any pending recognition instances
  if (recognitionCache.debug().pendingInstancesCount > 0) {
    console.info('[Ingest] Processing pending recognition instances after backfill')
    recognitionCache.reprocessPending(signalsStore)
    updateRecognitionStats()
  }
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
 * Handle incoming message for a specific topic
 */
function handleMessage(topic: TopicKey, raw: any, source: 'hcs' | 'hcs-cached', consensusNs?: string): void {
  try {
    stats[topic].lastActivity = Date.now()
    
    // Special handling for recognition topic (two-phase processing)
    if (topic === 'recognition') {
      handleRecognitionMessage(raw, source)
      return
    }

    // Standard message processing
    const normalizedEvent = normalizeHcsMessage(raw, source)
    if (normalizedEvent) {
      signalsStore.add(normalizedEvent)
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
 * Handle recognition message with two-phase processing
 */
function handleRecognitionMessage(raw: any, source: 'hcs' | 'hcs-cached'): void {
  try {
    const decoded = decodeRecognition(raw)
    
    if (isRecognitionDefinition(decoded)) {
      // Phase A: Store definition
      recognitionCache.upsertDefinition(decoded)
      stats.recognition.recognitionDefinitions = (stats.recognition.recognitionDefinitions || 0) + 1
      
      // Try to resolve any pending instances
      recognitionCache.reprocessPending(signalsStore)
      updateRecognitionStats()
      
    } else if (isRecognitionInstance(decoded)) {
      // Phase B: Try to resolve instance
      const resolved = recognitionCache.resolveInstance(decoded)
      
      if (resolved) {
        // Successfully resolved - convert to SignalEvent
        const signalEvent = {
          id: raw.sequence_number ? `${raw.topic_id}/${raw.sequence_number}` : `${raw.topic_id}/${Date.now()}-${Math.random()}`,
          type: 'RECOGNITION_MINT',
          actor: decoded.actor || 'unknown',
          target: decoded.owner,
          timestamp: decoded.timestamp || Date.now(),
          topicId: raw.topic_id || raw.topicId || '',
          metadata: resolved,
          source,
        }
        
        signalsStore.add(signalEvent)
        stats.recognition.recognitionInstances = (stats.recognition.recognitionInstances || 0) + 1
      } else {
        // Queue for later resolution
        recognitionCache.queueInstance(decoded)
        updateRecognitionStats()
      }
    } else {
      // Unknown recognition message - try standard normalization as fallback
      const normalizedEvent = normalizeHcsMessage(raw, source)
      if (normalizedEvent) {
        signalsStore.add(normalizedEvent)
      } else {
        stats.recognition.failed++
      }
    }
    
  } catch (error) {
    stats.recognition.failed++
    console.error('[Ingest] Recognition message processing failed:', error, { raw })
  }
}

/**
 * Update recognition-specific statistics
 */
function updateRecognitionStats(): void {
  const cacheStats = recognitionCache.getStats()
  stats.recognition.recognitionPending = cacheStats.pendingInstances
}

/**
 * Expose debug interface to global scope
 */
function exposeDebugInterface(): void {
  if (typeof window !== 'undefined') {
    // Browser environment
    (window as any).trustmeshIngest = {
      stats: () => ({ ...stats }),
      recognitionCache: () => recognitionCache.debug(),
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
        recognitionCache.clear()
        signalsStore.clear()
        Object.keys(stats).forEach(key => {
          const topicKey = key as TopicKey
          stats[topicKey] = { backfilled: 0, streamed: 0, duplicates: 0, failed: 0 }
        })
      }
    }
  } else {
    // Node environment (for API endpoints)
    (global as any).__ingest_stats__ = stats
    (global as any).__recognition_cache__ = recognitionCache
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
    recognitionCache: recognitionCache.getStats(),
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