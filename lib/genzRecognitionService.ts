// GenZ recognition token definitions with NFT minting metadata
import { recognitionSignals, type RecognitionSignal } from './data/recognitionSignals'

export interface GenZToken extends RecognitionSignal {
  trustValue: number // Trust units for NFT minting (0.1 to 0.5)
}

// Enrich GenZ tokens with trust values based on rarity
const getTrustValueFromRarity = (rarity: string): number => {
  switch (rarity) {
    case 'Legendary': return 0.5
    case 'Epic': return 0.4
    case 'Rare': return 0.3
    case 'Uncommon': return 0.2
    case 'Common': return 0.1
    default: return 0.1
  }
}

// Convert GenZ signals to NFT-compatible tokens
export const genzTokens: GenZToken[] = recognitionSignals.map(signal => ({
  ...signal,
  trustValue: getTrustValueFromRarity(signal.rarity)
}))

export interface RecognitionRequest {
  recipientId: string
  recipientName: string
  tokenId: string
  message: string
  senderId: string
  senderName: string
}

export interface RecognitionResponse {
  success: boolean
  tokenId?: string
  transactionId?: string
  error?: string
}

export class GenZRecognitionService {
  constructor() {
    // Service is ready to use
  }

  getAllTokens(): GenZToken[] {
    return genzTokens.filter(token => token.isActive)
  }

  getTokensByCategory(category?: 'social' | 'academic' | 'professional'): Record<string, GenZToken[]> {
    if (category) {
      return { [category]: genzTokens.filter(t => t.category === category && t.isActive) }
    }
    
    return {
      social: genzTokens.filter(t => t.category === 'social' && t.isActive),
      academic: genzTokens.filter(t => t.category === 'academic' && t.isActive),
      professional: genzTokens.filter(t => t.category === 'professional' && t.isActive)
    }
  }

  getTokenById(tokenId: string): GenZToken | undefined {
    return genzTokens.find(t => t.id === tokenId)
  }

  async sendRecognition(request: RecognitionRequest): Promise<RecognitionResponse> {
    try {
      const token = this.getTokenById(request.tokenId)
      if (!token) {
        return { success: false, error: 'Token not found' }
      }

      // Build HCS envelope for direct submission
      const envelope = {
        type: 'RECOGNITION_MINT',
        from: request.senderId,
        nonce: Date.now(),
        ts: Math.floor(Date.now() / 1000),
        payload: {
          definitionId: request.tokenId,
          recipientId: request.recipientId,
          recipientName: request.recipientName,
          message: request.message,
          senderName: request.senderName,
          timestamp: new Date().toISOString(),
          tokenMetadata: {
            name: token.name,
            description: token.description,
            category: token.category,
            icon: token.icon,
            trustValue: token.trustValue,
            rarity: token.rarity
          }
        }
      }

      // Submit directly to HCS submit API
      const response = await fetch('/api/hcs/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(envelope)
      })

      const data = await response.json()
      
      if (!response.ok || !data.ok) {
        console.error('[GenZRecognitionService] HCS submit failed:', data)
        console.error('[GenZRecognitionService] Envelope sent:', envelope)
        return { success: false, error: data.error || 'Failed to send recognition' }
      }

      return {
        success: true,
        tokenId: request.tokenId,
        transactionId: data.transactionHash
      }
    } catch (error) {
      console.error('[GenZRecognitionService] Error sending recognition:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // Get total trust value for multiple tokens
  getTotalTrustValue(tokenIds: string[]): number {
    return tokenIds.reduce((total, id) => {
      const token = this.getTokenById(id)
      return total + (token?.trustValue || 0)
    }, 0)
  }
}

// Export singleton instance
export const genzRecognitionService = new GenZRecognitionService()
