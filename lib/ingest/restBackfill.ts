/**
 * REST backfill system for HCS message ingestion
 * Handles paginated retrieval from Mirror Node REST API with cursor support
 */

import { BACKFILL_PAGE_SIZE, INGEST_DEBUG } from '@/lib/env'

interface BackfillOptions {
  topicId: string
  since?: string | null // consensus_ns cursor
  MIRROR_REST: string
  onMessage: (msg: any, consensusNs?: string) => void
  pageSize?: number
}

interface BackfillResult {
  count: number
  last?: string // last consensus_timestamp processed
}

/**
 * Backfill all messages for a topic since a given cursor
 * @param opts Backfill configuration
 * @returns Result with count and last timestamp processed
 */
export async function backfillTopic(opts: BackfillOptions): Promise<BackfillResult> {
  const { topicId, MIRROR_REST, onMessage, since, pageSize = BACKFILL_PAGE_SIZE } = opts
  
  let next: string | null = buildInitialUrl(MIRROR_REST, topicId, since, pageSize)
  let count = 0
  let last: string | undefined

  if (INGEST_DEBUG) {
    console.info(`[Backfill] Starting for topic ${topicId}`, { since, pageSize })
  }

  while (next) {
    try {
      if (INGEST_DEBUG) {
        console.info(`[Backfill] Fetching page: ${next}`)
      }

      const res = await fetch(next, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TrustMesh-Ingestion/1.0'
        }
      })

      if (!res.ok) {
        // Handle 404 gracefully - topic may not exist or be empty
        if (res.status === 404) {
          if (INGEST_DEBUG) {
            console.warn(`[Backfill] Topic ${topicId} not found (404) - likely empty or doesn't exist`)
          }
          return { count: 0 }
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      const messages = data?.messages ?? []

      if (INGEST_DEBUG) {
        console.info(`[Backfill] Processing ${messages.length} messages`)
      }

      // Process messages in order (ascending by consensus_timestamp)
      for (const msg of messages) {
        try {
          onMessage(msg, msg.consensus_timestamp)
          count++
          last = msg.consensus_timestamp
        } catch (error) {
          console.error('[Backfill] Failed to process message:', error, { 
            topicId, 
            sequence: msg.sequence_number,
            consensus: msg.consensus_timestamp 
          })
        }
      }

      // Check for next page - Mirror API returns full path, extract base URL
      next = data?.links?.next 
        ? `${new URL(MIRROR_REST).origin}${data.links.next}` 
        : null
      
      if (messages.length === 0) {
        // No more messages available
        break
      }

    } catch (error) {
      console.error(`[Backfill] Failed to fetch page for topic ${topicId}:`, error)
      throw new Error(`Backfill ${topicId} failed: ${error}`)
    }
  }

  if (INGEST_DEBUG) {
    console.info(`[Backfill] Completed for topic ${topicId}`, { count, last })
  }

  return { count, last }
}

/**
 * Build initial URL for backfill request
 * @param baseUrl Mirror Node REST base URL
 * @param topicId HCS topic ID
 * @param since Optional cursor (consensus timestamp)
 * @param pageSize Page size for pagination
 * @returns Complete URL for first request
 */
function buildInitialUrl(baseUrl: string, topicId: string, since: string | null, pageSize: number): string {
  const params = new URLSearchParams({
    limit: pageSize.toString(),
    order: 'asc' // Ascending order to preserve causality
  })

  // Add timestamp filter if cursor provided
  if (since) {
    params.set('timestamp', `gt:${since}`)
  }

  return `${baseUrl}/topics/${topicId}/messages?${params.toString()}`
}

/**
 * Backfill a specific time range (useful for gap filling)
 * @param opts Backfill options with start/end timestamps
 * @returns Backfill result
 */
export async function backfillRange(opts: BackfillOptions & {
  startTime?: string
  endTime?: string
}): Promise<BackfillResult> {
  const { topicId, MIRROR_REST, onMessage, startTime, endTime, pageSize = BACKFILL_PAGE_SIZE } = opts
  
  const params = new URLSearchParams({
    limit: pageSize.toString(),
    order: 'asc'
  })

  if (startTime) params.set('timestamp', `gte:${startTime}`)
  if (endTime) {
    const existing = params.get('timestamp')
    if (existing) {
      params.set('timestamp', `${existing}&lte:${endTime}`)
    } else {
      params.set('timestamp', `lte:${endTime}`)
    }
  }

  let next: string | null = `${MIRROR_REST}/topics/${topicId}/messages?${params.toString()}`
  let count = 0
  let last: string | undefined

  while (next) {
    const res = await fetch(next)
    if (!res.ok) throw new Error(`Range backfill ${topicId} failed: ${res.status}`)

    const data = await res.json()
    const messages = data?.messages ?? []

    for (const msg of messages) {
      onMessage(msg, msg.consensus_timestamp)
      count++
      last = msg.consensus_timestamp
    }

    next = data?.links?.next 
      ? `${new URL(MIRROR_REST).origin}${data.links.next}` 
      : null
    if (messages.length === 0) break
  }

  return { count, last }
}