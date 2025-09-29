/**
 * Recognition cache for two-phase ingestion
 * Stores definitions and manages pending instances until they can be resolved
 */

import type { SignalsStore } from '@/lib/stores/signalsStore'
import { INGEST_DEBUG } from '@/lib/env'

interface RecognitionDefinition {
  id: string
  slug?: string
  title: string
  icon?: string
  description?: string
  schema?: string
  meta: any
}

interface RecognitionInstance {
  owner: string
  recognitionId: string
  actor?: string
  note?: string
  timestamp?: number
  topicId?: string
  meta: any
}

class RecognitionCache {
  private defsById = new Map<string, RecognitionDefinition>()
  private defsBySlug = new Map<string, RecognitionDefinition>()
  private pendingInstances: RecognitionInstance[] = []
  private maxPendingInstances = 1000 // Prevent memory leaks

  /**
   * Store a recognition definition
   * @param definition Recognition definition to store
   */
  upsertDefinition(definition: RecognitionDefinition): void {
    // Store by ID
    this.defsById.set(definition.id, definition)
    
    // Store by slug if available
    if (definition.slug) {
      this.defsBySlug.set(definition.slug, definition)
    }

    if (INGEST_DEBUG) {
      console.info('[RecognitionCache] Stored definition', { 
        id: definition.id, 
        slug: definition.slug, 
        title: definition.title 
      })
    }
  }

  /**
   * Try to resolve a recognition instance with its definition
   * @param instance Recognition instance to resolve
   * @returns Resolved instance with definition or null if not found
   */
  resolveInstance(instance: RecognitionInstance): (RecognitionInstance & { definition: RecognitionDefinition }) | null {
    // Try to find definition by ID first
    let definition = this.defsById.get(instance.recognitionId)
    
    // If not found by ID, try by slug
    if (!definition && instance.recognitionId) {
      definition = this.defsBySlug.get(instance.recognitionId)
    }

    if (definition) {
      if (INGEST_DEBUG) {
        console.info('[RecognitionCache] Resolved instance', { 
          recognitionId: instance.recognitionId,
          owner: instance.owner,
          definitionTitle: definition.title 
        })
      }
      
      return { ...instance, definition }
    }

    if (INGEST_DEBUG) {
      console.debug('[RecognitionCache] Cannot resolve instance', { 
        recognitionId: instance.recognitionId,
        owner: instance.owner,
        availableDefinitions: Array.from(this.defsById.keys()).slice(0, 5) // Show first 5 for debug
      })
    }

    return null
  }

  /**
   * Queue an instance that cannot be resolved yet
   * @param instance Recognition instance to queue
   */
  queueInstance(instance: RecognitionInstance): void {
    // Prevent memory leaks by limiting pending instances
    if (this.pendingInstances.length >= this.maxPendingInstances) {
      // Remove oldest instances
      const removeCount = Math.floor(this.maxPendingInstances * 0.1) // Remove 10%
      this.pendingInstances.splice(0, removeCount)
      
      if (INGEST_DEBUG) {
        console.warn('[RecognitionCache] Pruned pending instances', { 
          removed: removeCount,
          remaining: this.pendingInstances.length 
        })
      }
    }

    this.pendingInstances.push(instance)
    
    if (INGEST_DEBUG) {
      console.info('[RecognitionCache] Queued pending instance', { 
        recognitionId: instance.recognitionId,
        owner: instance.owner,
        queueSize: this.pendingInstances.length 
      })
    }
  }

  /**
   * Process all pending instances and add resolved ones to the store
   * @param store SignalsStore instance
   */
  reprocessPending(store: SignalsStore): void {
    if (this.pendingInstances.length === 0) return

    const stillPending: RecognitionInstance[] = []
    let processedCount = 0

    for (const instance of this.pendingInstances) {
      const resolved = this.resolveInstance(instance)
      
      if (resolved) {
        // Convert resolved instance to SignalEvent and add to store
        const signalEvent = {
          id: `${instance.topicId}/${Date.now()}-${Math.random()}`,
          type: 'RECOGNITION_MINT',
          actor: instance.actor || 'unknown',
          target: instance.owner,
          timestamp: instance.timestamp || Date.now(),
          topicId: instance.topicId || '',
          metadata: resolved,
          source: 'hcs' as const,
        }
        
        store.add(signalEvent)
        processedCount++
      } else {
        // Keep for next reprocessing attempt
        stillPending.push(instance)
      }
    }

    this.pendingInstances = stillPending

    if (INGEST_DEBUG && processedCount > 0) {
      console.info('[RecognitionCache] Reprocessed pending instances', { 
        processed: processedCount,
        stillPending: this.pendingInstances.length 
      })
    }
  }

  /**
   * Get debug information about cache state
   * @returns Debug information
   */
  debug() {
    return {
      definitionsCount: this.defsById.size,
      definitionsBySlug: this.defsBySlug.size,
      pendingInstancesCount: this.pendingInstances.length,
      definitions: Array.from(this.defsById.entries()).slice(0, 10), // First 10 for debugging
      pendingInstancesSample: this.pendingInstances.slice(0, 5), // First 5 for debugging
    }
  }

  /**
   * Get a definition by ID or slug
   * @param idOrSlug Recognition ID or slug
   * @returns Definition if found
   */
  getDefinition(idOrSlug: string): RecognitionDefinition | undefined {
    return this.defsById.get(idOrSlug) || this.defsBySlug.get(idOrSlug)
  }

  /**
   * Get all definitions
   * @returns Array of all stored definitions
   */
  getAllDefinitions(): RecognitionDefinition[] {
    return Array.from(this.defsById.values())
  }

  /**
   * Clear all cached data (useful for testing)
   */
  clear(): void {
    this.defsById.clear()
    this.defsBySlug.clear()
    this.pendingInstances.length = 0
    
    if (INGEST_DEBUG) {
      console.info('[RecognitionCache] Cleared all cached data')
    }
  }

  /**
   * Get statistics about cache performance
   */
  getStats() {
    return {
      definitionsById: this.defsById.size,
      definitionsBySlug: this.defsBySlug.size,
      pendingInstances: this.pendingInstances.length,
      maxPendingInstances: this.maxPendingInstances,
    }
  }

  /**
   * Update max pending instances limit
   * @param limit New limit
   */
  setMaxPendingInstances(limit: number): void {
    this.maxPendingInstances = Math.max(100, limit) // Minimum of 100
    
    // Prune if current count exceeds new limit
    if (this.pendingInstances.length > this.maxPendingInstances) {
      const removeCount = this.pendingInstances.length - this.maxPendingInstances
      this.pendingInstances.splice(0, removeCount)
      
      if (INGEST_DEBUG) {
        console.info('[RecognitionCache] Adjusted pending instances limit', { 
          newLimit: this.maxPendingInstances,
          pruned: removeCount 
        })
      }
    }
  }
}

// Singleton instance
export const recognitionCache = new RecognitionCache()

// Export types for use in other modules
export type { RecognitionDefinition, RecognitionInstance }