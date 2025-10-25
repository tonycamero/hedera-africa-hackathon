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

      // Call HCS Recognition service to mint NFT
      const response = await fetch('/api/recognition/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...request,
          tokenName: token.name,
          tokenDescription: token.description,
          tokenIcon: token.icon,
          tokenCategory: token.category,
          trustValue: token.trustValue,
          rarity: token.rarity
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to send recognition' }
      }

      return {
        success: true,
        tokenId: data.tokenId,
        transactionId: data.transactionId
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
