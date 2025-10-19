/**
 * Fairfield Voice Service
 * 
 * Handles civic engagement signals for mayoral campaign via Hedera HCS
 * Integrates with universal TrustMesh recognition system for civic networking
 */

import { signalsStore } from '@/lib/stores/signalsStore'
import { hcsPublish, hcsEnvelope } from '@/lib/hedera'

export interface FairfieldVoiceRequest {
  type: 'CONTACT_BOND_REQUEST_DIRECT' | 'CONTACT_BOND_CONFIRMED' | 'INVITE_CREATED' | 'INVITE_ACCEPTED' | 'SUPPORT_SAVED' | 'VOLUNTEER_SAVED' | 'EVENT_RSVP'
  actor: string
  payload: Record<string, any>
}

export interface FairfieldVoiceResult {
  success: boolean
  transactionId?: string
  error?: string
}

export class FairfieldVoiceService {
  
  /**
   * Send a civic engagement signal following the universal lens pattern
   * Uses the same HCS infrastructure as Professional and GenZ lenses
   */
  async sendCivicSignal(request: FairfieldVoiceRequest): Promise<FairfieldVoiceResult> {
    try {
      console.log('[FairfieldVoiceService] Sending civic signal:', {
        type: request.type,
        actor: request.actor
      })
      
      // Create HCS envelope using existing universal infrastructure
      const envelope = hcsEnvelope(request.type, request.actor, request.payload)
      
      // Submit to HCS via existing infrastructure
      const transactionId = await hcsPublish(envelope)
      
      // Add optimistic update to signalsStore for immediate UI feedback
      // This follows the same pattern as Professional and GenZ lenses
      this.addToSignalsStore({
        type: request.type,
        actor: request.actor,
        payload: request.payload,
        transactionId
      })
      
      console.log('[FairfieldVoiceService] Successfully sent civic signal:', {
        type: request.type,
        transactionId
      })
      
      return {
        success: true,
        transactionId
      }
      
    } catch (error) {
      console.error('[FairfieldVoiceService] Failed to send civic signal:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * Add civic signal to signalsStore for immediate UI feedback
   * Follows the same pattern as other lens services
   */
  private addToSignalsStore(params: {
    type: string
    actor: string
    payload: Record<string, any>
    transactionId: string
  }): void {
    const signalEvent = {
      id: `fairfield_${params.type.toLowerCase()}_${params.actor}_${Date.now()}`,
      type: params.type,
      actor: params.actor,
      target: params.payload.invitee || params.payload.target,
      ts: Date.now(),
      topicId: process.env.HEDERA_TOPIC_ID || '0.0.6896005', // Fairfield single topic
      metadata: params.payload,
      source: 'hcs' as const
    }
    
    signalsStore.add(signalEvent)
  }
  
  /**
   * Get bonded contacts count for Circle of Trust progress
   * Reads from universal signalsStore like other lenses
   */
  getBondedContactsCount(userIssuer: string): number {
    const contactBondEvents = signalsStore.getByType('CONTACT_BOND_CONFIRMED')
    
    const bondedContacts = new Set<string>()
    contactBondEvents.forEach(event => {
      if (event.metadata?.inviter === userIssuer) {
        bondedContacts.add(event.metadata.invitee)
      }
      if (event.metadata?.invitee === userIssuer) {
        bondedContacts.add(event.metadata.inviter)
      }
    })
    
    return bondedContacts.size
  }
  
  /**
   * Get my bonded contacts for Circle of Trust display
   * Follows universal pattern for reading contacts across all lenses
   */
  getMyBondedContacts(userIssuer: string): Array<{
    peerId: string
    bondedAt: number
    metadata?: Record<string, any>
  }> {
    const contactBondEvents = signalsStore.getByType('CONTACT_BOND_CONFIRMED')
    const bonds: Array<{
      peerId: string
      bondedAt: number
      metadata?: Record<string, any>
    }> = []
    
    contactBondEvents.forEach(event => {
      let peerId: string | null = null
      
      if (event.metadata?.inviter === userIssuer) {
        peerId = event.metadata.invitee
      } else if (event.metadata?.invitee === userIssuer) {
        peerId = event.metadata.inviter
      }
      
      if (peerId) {
        bonds.push({
          peerId,
          bondedAt: event.ts,
          metadata: event.metadata
        })
      }
    })
    
    return bonds
  }
}

// Singleton instance following the lens service pattern
export const fairfieldVoiceService = new FairfieldVoiceService()