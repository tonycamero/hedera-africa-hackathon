/**
 * Professional Recognition Service
 * 
 * Handles minting and sending professional recognition tokens on Hedera HCS
 * Integrates with existing TrustMesh architecture for enterprise-grade peer recognition
 */

import { hcsRecognitionService } from '@/lib/services/HCSRecognitionService'
import { signalsStore } from '@/lib/stores/signalsStore'

export interface ProfessionalRecognitionToken {
  id: string
  name: string
  description: string
  category: string
  xpValue: number
  icon: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
}

export interface PeerRecognitionRequest {
  peerName: string
  peerEmail?: string
  peerHandle?: string
  recognitionTokenIds: string[]
  personalMessage?: string
  issuerName: string
  issuerHandle: string
}

// Enterprise-grade professional recognition tokens
export const PROFESSIONAL_RECOGNITION_TOKENS: ProfessionalRecognitionToken[] = [
  {
    id: 'leadership-excellence',
    name: 'Leadership Excellence',
    description: 'Demonstrates exceptional leadership capabilities and team management',
    category: 'Leadership',
    xpValue: 50,
    icon: 'trophy',
    rarity: 'epic'
  },
  {
    id: 'innovation-catalyst',
    name: 'Innovation Catalyst', 
    description: 'Drives innovative solutions and creative problem-solving',
    category: 'Innovation',
    xpValue: 45,
    icon: 'lightbulb',
    rarity: 'rare'
  },
  {
    id: 'strategic-partner',
    name: 'Strategic Partner',
    description: 'Provides valuable strategic insights and business acumen',
    category: 'Strategy', 
    xpValue: 55,
    icon: 'target',
    rarity: 'epic'
  },
  {
    id: 'collaboration-champion',
    name: 'Collaboration Champion',
    description: 'Excels at cross-functional teamwork and partnership building',
    category: 'Collaboration',
    xpValue: 40,
    icon: 'handshake',
    rarity: 'rare'
  },
  {
    id: 'technical-expert',
    name: 'Technical Expert',
    description: 'Demonstrates deep technical expertise and knowledge sharing',
    category: 'Technical',
    xpValue: 50,
    icon: 'shield',
    rarity: 'epic'
  },
  {
    id: 'market-leader',
    name: 'Market Leader',
    description: 'Shows exceptional market understanding and business development',
    category: 'Business',
    xpValue: 55,
    icon: 'trending-up',
    rarity: 'epic'
  },
  {
    id: 'team-builder',
    name: 'Team Builder',
    description: 'Exceptional at building and nurturing high-performing teams',
    category: 'Management',
    xpValue: 45,
    icon: 'users',
    rarity: 'rare'
  },
  {
    id: 'industry-thought-leader',
    name: 'Industry Thought Leader',
    description: 'Recognized expert who shapes industry standards and practices',
    category: 'Thought Leadership',
    xpValue: 60,
    icon: 'globe',
    rarity: 'legendary'
  },
  {
    id: 'excellence-in-execution',
    name: 'Excellence in Execution',
    description: 'Consistently delivers exceptional results and quality outcomes',
    category: 'Performance',
    xpValue: 45,
    icon: 'star',
    rarity: 'rare'
  }
]

export class ProfessionalRecognitionService {
  
  /**
   * Send professional recognition tokens to a peer
   * This creates HCS messages that will be processed by the recognition service
   */
  async sendPeerRecognition(request: PeerRecognitionRequest): Promise<{
    success: boolean
    transactionIds: string[]
    totalXP: number
    error?: string
  }> {
    try {
      console.log('[ProfessionalRecognitionService] Sending peer recognition:', {
        peer: request.peerName,
        tokens: request.recognitionTokenIds.length,
        issuer: request.issuerName
      })

      // Get the selected tokens
      const selectedTokens = PROFESSIONAL_RECOGNITION_TOKENS.filter(token =>
        request.recognitionTokenIds.includes(token.id)
      )

      if (selectedTokens.length === 0) {
        throw new Error('No valid recognition tokens selected')
      }

      const totalXP = selectedTokens.reduce((sum, token) => sum + token.xpValue, 0)
      const transactionIds: string[] = []

      // Create recognition definitions if they don't exist
      await this.ensureRecognitionDefinitions(selectedTokens)

      // Mint recognition instances for the peer
      for (const token of selectedTokens) {
        const transactionId = await this.mintRecognitionInstance({
          definitionId: token.id,
          recipientName: request.peerName,
          recipientEmail: request.peerEmail,
          recipientHandle: request.peerHandle,
          issuerName: request.issuerName,
          issuerHandle: request.issuerHandle,
          personalMessage: request.personalMessage,
          xpValue: token.xpValue
        })

        if (transactionId) {
          transactionIds.push(transactionId)
        }
      }

      console.log('[ProfessionalRecognitionService] Successfully sent recognition:', {
        tokens: selectedTokens.length,
        totalXP,
        transactionIds: transactionIds.length
      })

      return {
        success: true,
        transactionIds,
        totalXP
      }

    } catch (error) {
      console.error('[ProfessionalRecognitionService] Failed to send peer recognition:', error)
      return {
        success: false,
        transactionIds: [],
        totalXP: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Ensure recognition definitions exist on HCS
   */
  private async ensureRecognitionDefinitions(tokens: ProfessionalRecognitionToken[]): Promise<void> {
    for (const token of tokens) {
      try {
        // Check if definition already exists
        const existing = hcsRecognitionService.getDefinition(token.id)
        if (existing) {
          console.log(`[ProfessionalRecognitionService] Definition exists: ${token.id}`)
          continue
        }

        // Create the definition
        await this.publishRecognitionDefinition(token)
        
      } catch (error) {
        console.warn(`[ProfessionalRecognitionService] Failed to ensure definition ${token.id}:`, error)
      }
    }
  }

  /**
   * Publish a recognition definition to HCS
   */
  private async publishRecognitionDefinition(token: ProfessionalRecognitionToken): Promise<void> {
    const definitionMessage = {
      schema: 'HCS-Recognition-Def@1',
      type: 'recognition_definition_created',
      timestamp: new Date().toISOString(),
      id: token.id,
      slug: token.id,
      name: token.name,
      description: token.description,
      icon: token.icon,
      category: 'professional', // All are professional category
      rarity: token.rarity,
      number: this.generateTokenNumber(token.id),
      isActive: true,
      extendedDescription: `${token.description} - Enterprise-grade professional recognition token`,
      stats: {
        popularity: Math.floor(Math.random() * 100) + 1,
        impact: token.xpValue,
        authenticity: 95, // High authenticity for professional tokens
        difficulty: this.getDifficultyByXP(token.xpValue)
      },
      traits: {
        personality: this.getPersonalityTraits(token.category),
        skills: this.getSkillTraits(token.category),
        environment: ['enterprise', 'professional', 'corporate']
      },
      enhancementVersion: '2.0',
      backstory: `Professional recognition token for ${token.category.toLowerCase()} excellence in enterprise environments`,
      tips: [`Earned through demonstrated ${token.category.toLowerCase()} excellence`, 'Blockchain-verified professional endorsement']
    }

    await this.publishToHCS(definitionMessage, 'recognition')
    console.log(`[ProfessionalRecognitionService] Published definition: ${token.name}`)
  }

  /**
   * Mint a recognition instance for a specific recipient
   */
  private async mintRecognitionInstance(params: {
    definitionId: string
    recipientName: string
    recipientEmail?: string
    recipientHandle?: string
    issuerName: string
    issuerHandle: string
    personalMessage?: string
    xpValue: number
  }): Promise<string | null> {
    
    // Generate recipient ID (in real app, this would resolve to actual user ID)
    const recipientId = params.recipientHandle || 
                       `tm-${params.recipientName.toLowerCase().replace(/\s+/g, '-')}` ||
                       `tm-${Date.now()}`

    const instanceMessage = {
      schema: 'HCS-Recognition-Instance@1',
      type: 'recognition_instance_created',
      timestamp: new Date().toISOString(),
      definitionId: params.definitionId,
      definitionSlug: params.definitionId,
      owner: recipientId,
      recipient: recipientId,
      issuer: params.issuerHandle,
      issuerName: params.issuerName,
      note: params.personalMessage || `Professional recognition for ${params.recipientName}`,
      xpValue: params.xpValue,
      metadata: {
        recipientName: params.recipientName,
        recipientEmail: params.recipientEmail,
        issuedAt: new Date().toISOString(),
        tokenType: 'professional-recognition',
        consensusService: 'hedera-testnet'
      }
    }

    try {
      const result = await this.publishToHCS(instanceMessage, 'recognition')
      
      // Also add directly to signals store for immediate UI update
      this.addToSignalsStore(instanceMessage, recipientId, params.issuerHandle)
      
      console.log(`[ProfessionalRecognitionService] Minted instance: ${params.definitionId} for ${params.recipientName}`)
      return result
      
    } catch (error) {
      console.error(`[ProfessionalRecognitionService] Failed to mint instance:`, error)
      return null
    }
  }

  /**
   * Add recognition to signals store for immediate UI feedback
   */
  private addToSignalsStore(message: any, recipientId: string, issuerId: string): void {
    // Import registry at usage to avoid circular deps
    const { getTopicRegistry } = require('@/lib/hooks/useTopicRegistry')
    const topics = getTopicRegistry()
    
    const signalEvent = {
      id: `recognition_${message.definitionId}_${recipientId}_${Date.now()}`,
      type: 'RECOGNITION_MINT',
      actor: issuerId,
      target: recipientId,
      ts: Date.now(),
      topicId: topics.recognition,
      metadata: {
        definitionId: message.definitionId,
        definitionSlug: message.definitionSlug,
        issuerName: message.issuerName,
        recipientName: message.metadata.recipientName,
        note: message.note,
        xpValue: message.xpValue,
        tokenType: 'professional-recognition'
      },
      source: 'hcs' as const
    }

    signalsStore.add(signalEvent)
  }

  /**
   * Publish message to HCS via API
   */
  private async publishToHCS(message: any, topic: 'recognition' | 'contacts' | 'trust'): Promise<string> {
    const response = await fetch('/api/hcs/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        message
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`HCS submission failed: ${error}`)
    }

    const result = await response.json()
    return result.transactionId || result.id || 'pending'
  }

  // Helper methods for token metadata
  private generateTokenNumber(tokenId: string): number {
    return Math.abs(tokenId.split('').reduce((hash, char) => hash + char.charCodeAt(0), 0)) % 1000 + 1
  }

  private getDifficultyByXP(xp: number): number {
    if (xp >= 60) return 90 // Legendary
    if (xp >= 50) return 75 // Epic  
    if (xp >= 40) return 60 // Rare
    return 45 // Common/Uncommon
  }

  private getPersonalityTraits(category: string): string[] {
    const traitMap: Record<string, string[]> = {
      'Leadership': ['inspiring', 'decisive', 'visionary', 'empathetic'],
      'Innovation': ['creative', 'analytical', 'resourceful', 'forward-thinking'],
      'Strategy': ['strategic', 'analytical', 'systematic', 'goal-oriented'],
      'Collaboration': ['diplomatic', 'inclusive', 'communicative', 'supportive'],
      'Technical': ['precise', 'logical', 'detail-oriented', 'methodical'],
      'Business': ['entrepreneurial', 'competitive', 'results-driven', 'market-savvy'],
      'Management': ['organized', 'motivational', 'development-focused', 'accountable'],
      'Thought Leadership': ['influential', 'knowledgeable', 'articulate', 'pioneering'],
      'Performance': ['consistent', 'reliable', 'excellence-driven', 'quality-focused']
    }
    return traitMap[category] || ['professional', 'competent', 'dedicated', 'reliable']
  }

  private getSkillTraits(category: string): string[] {
    const skillMap: Record<string, string[]> = {
      'Leadership': ['team-management', 'strategic-planning', 'change-management', 'talent-development'],
      'Innovation': ['problem-solving', 'design-thinking', 'research', 'experimentation'],
      'Strategy': ['business-analysis', 'market-research', 'competitive-intelligence', 'planning'],
      'Collaboration': ['cross-functional-coordination', 'stakeholder-management', 'communication', 'negotiation'],
      'Technical': ['domain-expertise', 'system-design', 'troubleshooting', 'knowledge-transfer'],
      'Business': ['business-development', 'market-expansion', 'revenue-growth', 'client-relations'],
      'Management': ['project-management', 'resource-allocation', 'performance-management', 'team-building'],
      'Thought Leadership': ['industry-expertise', 'public-speaking', 'content-creation', 'mentoring'],
      'Performance': ['execution', 'quality-assurance', 'process-improvement', 'delivery-excellence']
    }
    return skillMap[category] || ['professional-competency', 'industry-knowledge', 'execution', 'quality-focus']
  }
}

// Singleton instance
export const professionalRecognitionService = new ProfessionalRecognitionService()