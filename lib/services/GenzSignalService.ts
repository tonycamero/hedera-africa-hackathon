/**
 * GenZ Signal Service
 * 
 * Handles minting and sending GenZ signal templates via Hedera HCS
 * Integrates with TrustMesh architecture for viral GenZ social interactions
 */

import { signalsStore } from '@/lib/stores/signalsStore'
import { createBoostId } from '@/lib/ids/boostId'
import { guardContent } from '@/lib/filters/contentGuard'
import { getTemplate } from '@/lib/templates'

export interface GenzSignalRequest {
  templateId: string
  fill: string
  note?: string
  recipientAccountId: string
  recipientHandle?: string
  senderAccountId: string
  senderHandle: string
  // New template metadata fields
  lens?: string
  context?: string
  rarity?: string
}

export interface GenzSignalResult {
  success: boolean
  transactionId?: string
  boostId?: string
  error?: string
}

export class GenzSignalService {
  
  /**
   * Send a GenZ signal template to a recipient
   * Creates signal.mint@1 HCS message with boost ID for viral sharing
   */
  async sendGenzSignal(request: GenzSignalRequest): Promise<GenzSignalResult> {
    try {
      console.log('[GenzSignalService] Sending GenZ signal:', {
        template: request.templateId,
        recipient: request.recipientHandle || request.recipientAccountId.slice(-6),
        sender: request.senderHandle
      })

      // Get template details from library
      const template = getTemplate(request.templateId)
      if (!template) {
        return {
          success: false,
          error: 'Template not found in library'
        }
      }
      
      // Validate content length
      if (request.fill.length > template.maxFill) {
        return {
          success: false,
          error: `Fill text too long (max ${template.maxFill} characters)`
        }
      }
      
      // Basic positivity check
      const negativeWords = ['hate', 'terrible', 'awful', 'horrible', 'worst', 'stupid', 'dumb']
      const containsNegative = negativeWords.some(word => 
        request.fill.toLowerCase().includes(word) || (request.note && request.note.toLowerCase().includes(word))
      )
      if (containsNegative) {
        return {
          success: false,
          error: 'Please keep your message positive and encouraging'
        }
      }

      // Generate boost ID for viral sharing
      const timestamp = Date.now()
      const boostId = createBoostId(
        request.senderAccountId,
        request.recipientAccountId,
        request.templateId,
        request.fill,
        timestamp
      )

      // Create the signal.mint@1 payload with template metadata
      const signalPayload = {
        t: 'signal.mint@1',
        def_id: `grit.${request.templateId}@1`,
        subject: request.recipientHandle ? `kns:${request.recipientHandle}` : request.recipientAccountId,
        issuer: 'operator:tm',
        fill: request.fill,
        note: request.note || '',
        realm: 'trustmesh-genz',
        boost_id: boostId,
        // Add template metadata to HCS payload
        template_id: request.templateId,
        lens: request.lens || template.lens[0] || 'genz',
        context: request.context || template.context,
        rarity: request.rarity || template.rarity,
        category: template.category,
        ts: timestamp
      }

      // Create HCS envelope (matches the expected format in /api/hcs/submit)
      const envelope = {
        type: 'RECOGNITION_MINT', // Routes to recognition topic
        from: request.senderAccountId,
        nonce: Date.now(),
        ts: Math.floor(timestamp / 1000), // Unix seconds
        payload: signalPayload
      }

      // Submit to HCS via API
      const transactionId = await this.submitToHCS(envelope)

      // Add optimistic update to signals store for immediate UI feedback
      this.addToSignalsStore({
        templateId: request.templateId,
        template: template.text,
        fill: request.fill,
        note: request.note,
        boostId,
        recipientAccountId: request.recipientAccountId,
        recipientHandle: request.recipientHandle,
        senderAccountId: request.senderAccountId,
        senderHandle: request.senderHandle,
        timestamp
      })

      console.log('[GenzSignalService] Successfully sent GenZ signal:', {
        transactionId,
        boostId
      })

      return {
        success: true,
        transactionId,
        boostId
      }

    } catch (error) {
      console.error('[GenzSignalService] Failed to send GenZ signal:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Submit envelope to HCS via API
   */
  private async submitToHCS(envelope: any): Promise<string> {
    const response = await fetch('/api/hcs/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`HCS submission failed: ${error}`)
    }

    const result = await response.json()
    if (!result.ok) {
      throw new Error(`HCS submission failed: ${result.error}`)
    }

    return result.transactionId || result.sequenceNumber || 'pending'
  }

  /**
   * Add GenZ signal to signals store for immediate UI feedback
   */
  private addToSignalsStore(params: {
    templateId: string
    template: string
    fill: string
    note?: string
    boostId: string
    recipientAccountId: string
    recipientHandle?: string
    senderAccountId: string
    senderHandle: string
    timestamp: number
  }): void {
    // Import registry at usage to avoid circular deps
    const { getTopicRegistry } = require('@/lib/hooks/useTopicRegistry')
    const topics = getTopicRegistry()
    
    const signalEvent = {
      id: `genz_signal_${params.boostId}`,
      type: 'RECOGNITION_MINT',
      actor: params.senderAccountId,
      target: params.recipientAccountId,
      ts: params.timestamp,
      topicId: topics.recognition,
      metadata: {
        templateId: params.templateId,
        template: params.template,
        fill: params.fill,
        note: params.note,
        boostId: params.boostId,
        senderHandle: params.senderHandle,
        recipientHandle: params.recipientHandle,
        signalType: 'genz-template',
        def_id: `grit.${params.templateId}@1`
      },
      source: 'hcs' as const
    }

    signalsStore.add(signalEvent)
  }
}

// Singleton instance
export const genzSignalService = new GenzSignalService()