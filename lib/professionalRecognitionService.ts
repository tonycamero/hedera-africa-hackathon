// Professional recognition token definitions
export interface ProfessionalToken {
  id: string
  name: string
  description: string
  icon: string
  category: 'leadership' | 'knowledge' | 'execution'
  trustValue: number // Trust units (0.1 to 0.5 for recognition tokens)
}

export const professionalTokens: ProfessionalToken[] = [
  // LEADERSHIP CATEGORY - Vision, People Management, Decision Making
  {
    id: 'strategic-visionary',
    name: 'Strategic Visionary',
    description: 'Exceptional ability to see the big picture and guide long-term strategy',
    icon: 'telescope',
    category: 'leadership',
    trustValue: 0.5
  },
  {
    id: 'team-catalyst',
    name: 'Team Catalyst',
    description: 'Brings out the best in team members and drives collective success',
    icon: 'users',
    category: 'leadership',
    trustValue: 0.5
  },
  {
    id: 'decision-maker',
    name: 'Decision Maker',
    description: 'Makes sound decisions under pressure with limited information',
    icon: 'target',
    category: 'leadership',
    trustValue: 0.4
  },
  {
    id: 'culture-builder',
    name: 'Culture Builder',
    description: 'Shapes positive organizational culture and values',
    icon: 'heart',
    category: 'leadership',
    trustValue: 0.4
  },
  {
    id: 'change-champion',
    name: 'Change Champion',
    description: 'Successfully leads organizational transformation and adaptation',
    icon: 'trending-up',
    category: 'leadership',
    trustValue: 0.4
  },
  {
    id: 'talent-developer',
    name: 'Talent Developer',
    description: 'Exceptional at recruiting, developing and retaining top talent',
    icon: 'user-plus',
    category: 'leadership',
    trustValue: 0.3
  },
  {
    id: 'crisis-manager',
    name: 'Crisis Manager',
    description: 'Remains calm and effective during high-pressure situations',
    icon: 'shield',
    category: 'leadership',
    trustValue: 0.3
  },

  // KNOWLEDGE CATEGORY - Expertise, Analysis, Learning
  {
    id: 'technical-expert',
    name: 'Technical Expert',
    description: 'Deep technical knowledge and ability to solve complex problems',
    icon: 'cpu',
    category: 'knowledge',
    trustValue: 0.5
  },
  {
    id: 'system-architect',
    name: 'System Architect',
    description: 'Designs robust, scalable systems and technical solutions',
    icon: 'network',
    category: 'knowledge',
    trustValue: 0.5
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    description: 'Transforms complex data into actionable business insights',
    icon: 'bar-chart',
    category: 'knowledge',
    trustValue: 0.4
  },
  {
    id: 'domain-specialist',
    name: 'Domain Specialist',
    description: 'Deep expertise in specific industry or functional area',
    icon: 'book-open',
    category: 'knowledge',
    trustValue: 0.4
  },
  {
    id: 'continuous-learner',
    name: 'Continuous Learner',
    description: 'Always acquiring new skills and staying current with trends',
    icon: 'graduation-cap',
    category: 'knowledge',
    trustValue: 0.3
  },
  {
    id: 'research-pioneer',
    name: 'Research Pioneer',
    description: 'Conducts thorough research and develops innovative methodologies',
    icon: 'search',
    category: 'knowledge',
    trustValue: 0.4
  },
  {
    id: 'quality-champion',
    name: 'Quality Champion',
    description: 'Maintains exceptional standards and attention to detail',
    icon: 'shield-check',
    category: 'knowledge',
    trustValue: 0.3
  },

  // EXECUTION CATEGORY - Delivery, Operations, Results
  {
    id: 'delivery-champion',
    name: 'Delivery Champion',
    description: 'Consistently delivers projects on time and within scope',
    icon: 'truck',
    category: 'execution',
    trustValue: 0.5
  },
  {
    id: 'process-optimizer',
    name: 'Process Optimizer',
    description: 'Streamlines operations and eliminates inefficiencies',
    icon: 'settings',
    category: 'execution',
    trustValue: 0.4
  },
  {
    id: 'customer-advocate',
    name: 'Customer Advocate',
    description: 'Relentlessly focuses on customer satisfaction and success',
    icon: 'heart-handshake',
    category: 'execution',
    trustValue: 0.4
  },
  {
    id: 'revenue-driver',
    name: 'Revenue Driver',
    description: 'Directly contributes to business growth and profitability',
    icon: 'trending-up',
    category: 'execution',
    trustValue: 0.5
  },
  {
    id: 'problem-solver',
    name: 'Problem Solver',
    description: 'Tackles challenges with creativity and systematic approach',
    icon: 'puzzle',
    category: 'execution',
    trustValue: 0.4
  },
  {
    id: 'bridge-builder',
    name: 'Bridge Builder',
    description: 'Connects stakeholders and facilitates cross-functional collaboration',
    icon: 'git-branch',
    category: 'execution',
    trustValue: 0.3
  },
  {
    id: 'risk-manager',
    name: 'Risk Manager',
    description: 'Identifies and mitigates potential issues before they impact delivery',
    icon: 'alert-triangle',
    category: 'execution',
    trustValue: 0.3
  }
]

export interface RecognitionRequest {
  recipientId: string
  recipientName: string
  tokenId: string
  message: string
  senderId: string
  senderName: string
}

export class ProfessionalRecognitionService {
  constructor() {
    // Service is ready to use
  }

  /**
   * Initialize professional recognition tokens on Hedera if they don't exist
   * In this implementation, tokens are pre-defined and don't need initialization
   */
  async initializeProfessionalTokens(): Promise<void> {
    // Professional tokens are already defined in the service
    console.log('Professional recognition tokens are ready')
  }

  /**
   * Send a professional recognition token to a peer
   */
  async sendRecognition(request: RecognitionRequest): Promise<{
    success: boolean
    transactionId?: string
    error?: string
  }> {
    try {
      // Ensure the token definition exists
      const tokenDefinition = professionalTokens.find(t => t.id === request.tokenId)
      if (!tokenDefinition) {
        throw new Error('Invalid professional token ID')
      }

      // Create the recognition instance envelope for HCS
      const envelope = {
        type: 'RECOGNITION_MINT',
        from: request.senderId,
        nonce: Date.now(), // Simple nonce - should be more sophisticated in production
        ts: Math.floor(Date.now() / 1000),
        payload: {
          definitionId: request.tokenId,
          recipientId: request.recipientId,
          recipientName: request.recipientName,
          message: request.message,
          senderName: request.senderName,
          timestamp: new Date().toISOString(),
          tokenMetadata: {
            name: tokenDefinition.name,
            description: tokenDefinition.description,
            category: tokenDefinition.category,
            icon: tokenDefinition.icon,
            trustValue: tokenDefinition.trustValue
          }
        }
      }

      // Submit to HCS via the API endpoint
      const response = await fetch('/api/hcs/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(envelope),
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Failed to submit recognition to Hedera')
      }

      return {
        success: true,
        transactionId: result.sequenceNumber?.toString()
      }
    } catch (error) {
      console.error('Failed to send professional recognition:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get all professional recognition tokens by category
   */
  getTokensByCategory(): Record<string, ProfessionalToken[]> {
    return professionalTokens.reduce((acc, token) => {
      if (!acc[token.category]) {
        acc[token.category] = []
      }
      acc[token.category].push(token)
      return acc
    }, {} as Record<string, ProfessionalToken[]>)
  }

  /**
   * Get a specific professional token by ID
   */
  getToken(tokenId: string): ProfessionalToken | undefined {
    return professionalTokens.find(token => token.id === tokenId)
  }

  /**
   * Calculate total trust value for multiple token IDs
   */
  calculateTotalTrustValue(tokenIds: string[]): number {
    return tokenIds.reduce((total, tokenId) => {
      const token = this.getToken(tokenId)
      return total + (token?.trustValue || 0)
    }, 0)
  }

  /**
   * Validate a recognition request
   */
  validateRecognitionRequest(request: RecognitionRequest): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!request.recipientId?.trim()) {
      errors.push('Recipient ID is required')
    }

    if (!request.recipientName?.trim()) {
      errors.push('Recipient name is required')
    }

    if (!request.tokenId?.trim()) {
      errors.push('Token ID is required')
    }

    if (!request.senderId?.trim()) {
      errors.push('Sender ID is required')
    }

    if (!request.senderName?.trim()) {
      errors.push('Sender name is required')
    }

    if (!request.message?.trim()) {
      errors.push('Recognition message is required')
    }

    const token = this.getToken(request.tokenId)
    if (request.tokenId && !token) {
      errors.push('Invalid token ID')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// Export singleton instance
export const professionalRecognitionService = new ProfessionalRecognitionService()