/**
 * Trust Allocation Service
 * Handles HCS trust allocation, revocation, and updates for bounded circle management
 */

import { getSessionId } from '@/lib/session'
import { signalsStore } from '@/lib/stores/signalsStore'

export interface TrustAllocation {
  contactId: string
  level: number
  allocatedAt: string
  stakeAmount?: number
  opId: string // For idempotent operations
}

export interface TrustAllocationResult {
  success: boolean
  transactionId?: string
  error?: string
  allocation?: TrustAllocation
}

export class TrustAllocationService {
  private baseUrl = '/api/hcs'

  /**
   * Submit trust allocation to HCS
   */
  async submitTrustAllocation(
    contactId: string, 
    level: number,
    stakeAmount?: number
  ): Promise<TrustAllocationResult> {
    const sessionId = getSessionId()
    const opId = `trust-${contactId}-${Date.now()}-${Math.random().toString(36).slice(2)}`

    try {
      console.log('[TrustAllocation] Submitting trust allocation:', { contactId, level, sessionId })

      // Validate level
      if (level < 1 || level > 3) {
        throw new Error('Invalid trust level. Must be between 1 and 3.')
      }

      // Check capacity client-side (server will also validate)
      const currentCapacity = this.getCurrentCapacity()
      if (currentCapacity.available <= 0) {
        throw new Error('Circle is full. Revoke an existing allocation first.')
      }

      // Prevent self-allocation
      if (contactId === sessionId) {
        throw new Error('Cannot allocate trust to yourself.')
      }

      const allocation: TrustAllocation = {
        contactId,
        level,
        allocatedAt: new Date().toISOString(),
        stakeAmount,
        opId
      }

      // Submit to HCS via trust submission API (match Envelope format)
      const response = await fetch(`${this.baseUrl}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'TRUST_ALLOCATE',
          from: sessionId,
          nonce: Date.now(),
          ts: Math.floor(Date.now() / 1000),
          payload: {
            to: contactId,
            level,
            trustType: 'professional',
            relationship: 'trusted_contact',
            context: `Trust allocation level ${level}`,
            stakeAmount,
            opId
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Handle specific error codes
        if (response.status === 409 && errorData.code === 'CIRCLE_FULL') {
          throw new Error('Circle capacity exceeded. Revoke an existing allocation first.')
        }
        
        if (response.status === 400 && errorData.code === 'SELF_ALLOCATION') {
          throw new Error('Cannot allocate trust to yourself.')
        }

        throw new Error(errorData.error || `HTTP ${response.status}: Trust allocation failed`)
      }

      const result = await response.json()

      console.log('[TrustAllocation] Trust allocated successfully:', result)

      return {
        success: true,
        transactionId: result.transactionId,
        allocation
      }

    } catch (error) {
      console.error('[TrustAllocation] Failed to allocate trust:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Revoke trust allocation
   */
  async revokeTrustAllocation(contactId: string): Promise<TrustAllocationResult> {
    const sessionId = getSessionId()
    const opId = `revoke-${contactId}-${Date.now()}-${Math.random().toString(36).slice(2)}`

    try {
      console.log('[TrustAllocation] Revoking trust allocation:', { contactId, sessionId })

      const response = await fetch(`${this.baseUrl}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'TRUST_REVOKE',
          from: sessionId,
          nonce: Date.now(),
          ts: Math.floor(Date.now() / 1000),
          payload: {
            to: contactId,
            reason: 'manual_revocation',
            opId
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Trust revocation failed`)
      }

      const result = await response.json()

      console.log('[TrustAllocation] Trust revoked successfully:', result)

      return {
        success: true,
        transactionId: result.transactionId
      }

    } catch (error) {
      console.error('[TrustAllocation] Failed to revoke trust:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Update trust level
   */
  async updateTrustLevel(contactId: string, newLevel: number): Promise<TrustAllocationResult> {
    const sessionId = getSessionId()
    const opId = `update-${contactId}-${Date.now()}-${Math.random().toString(36).slice(2)}`

    try {
      console.log('[TrustAllocation] Updating trust level:', { contactId, newLevel, sessionId })

      if (newLevel < 1 || newLevel > 3) {
        throw new Error('Invalid trust level. Must be between 1 and 3.')
      }

      const response = await fetch(`${this.baseUrl}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'TRUST_UPDATE',
          from: sessionId,
          nonce: Date.now(),
          ts: Math.floor(Date.now() / 1000),
          payload: {
            to: contactId,
            level: newLevel,
            context: `Trust level updated to ${newLevel}`,
            opId
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Trust update failed`)
      }

      const result = await response.json()

      console.log('[TrustAllocation] Trust level updated successfully:', result)

      return {
        success: true,
        transactionId: result.transactionId
      }

    } catch (error) {
      console.error('[TrustAllocation] Failed to update trust level:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get current capacity from signals store
   */
  getCurrentCapacity(): { allocated: number; maxSlots: number; available: number } {
    try {
      const sessionId = getSessionId()
      const allEvents = signalsStore.getAll()
      
      // Count allocated trust relationships
      const trustEvents = allEvents.filter(event => 
        (event.type === 'TRUST_ALLOCATE' || event.type.includes('TRUST')) && 
        event.actor === sessionId
      )

      // For now, use a simple count - in production this would handle revocations
      const allocated = trustEvents.length
      const maxSlots = 9 // Standard circle capacity
      const available = Math.max(0, maxSlots - allocated)

      return { allocated, maxSlots, available }
    } catch (error) {
      console.warn('[TrustAllocation] Failed to calculate capacity:', error)
      return { allocated: 0, maxSlots: 9, available: 9 }
    }
  }

  /**
   * Check if contact is already in circle
   */
  isContactInCircle(contactId: string): boolean {
    try {
      const sessionId = getSessionId()
      const allEvents = signalsStore.getAll()
      
      return allEvents.some(event => 
        event.type === 'TRUST_ALLOCATE' && 
        event.actor === sessionId && 
        event.target === contactId
      )
    } catch (error) {
      console.warn('[TrustAllocation] Failed to check circle membership:', error)
      return false
    }
  }

  /**
   * Get trust level for a contact
   */
  getTrustLevel(contactId: string): number | null {
    try {
      const sessionId = getSessionId()
      const allEvents = signalsStore.getAll()
      
      // Find most recent trust allocation event
      const trustEvent = allEvents
        .filter(event => 
          event.type === 'TRUST_ALLOCATE' && 
          event.actor === sessionId && 
          event.target === contactId
        )
        .sort((a, b) => b.ts - a.ts)[0]

      return trustEvent?.metadata?.level || null
    } catch (error) {
      console.warn('[TrustAllocation] Failed to get trust level:', error)
      return null
    }
  }
}

// Singleton instance
export const trustAllocationService = new TrustAllocationService()