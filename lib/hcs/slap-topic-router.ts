/**
 * SLAP Topic Router
 * Routes HCS messages to appropriate topics based on context layer
 * Maintains pattern consistency across distinct topic domains
 */

export interface SLAPTopicConfig {
  // === GENZ SOCIAL LAYER ===
  social: {
    profile: string     // Campus profiles, social bios
    contact: string     // Friend requests, QR connections  
    trust: string       // Circle of 9, anonymous trust
    signal: string      // Props, boosts, viral shares
  }
  
  // === PROFESSIONAL BUSINESS LAYER ===
  professional: {
    profile: string     // LinkedIn-style profiles, credentials
    contact: string     // Business connections, endorsements
    trust: string       // Role-based trust, compliance scores  
    signal: string      // Enterprise recognition, certifications
  }
  
  // === TREASURY/FINANCE LAYER ===
  treasury: {
    transactions: string // Brale mints, MatterFi transfers
    custody: string     // Brinks receipts, compliance proofs
    audit: string       // Regulatory trails, KYB events
  }
  
  // === CROSS-LAYER ANALYTICS ===
  analytics: {
    networkEffects: string    // Cross-topic trust correlations
    reputationBridge: string  // Social → Professional trust mapping
  }
}

export interface SLAPMessageContext {
  layer: 'social' | 'professional' | 'treasury' | 'analytics'
  intent: 'profile' | 'contact' | 'trust' | 'signal' | 'transaction' | 'audit'
  userId: string
  userRole?: 'genz' | 'professional' | 'hybrid'
  complianceLevel?: 'casual' | 'business' | 'regulatory'
}

export class SLAPTopicRouter {
  private config: SLAPTopicConfig

  constructor(config: SLAPTopicConfig) {
    this.config = config
  }

  /**
   * Route message to appropriate topic based on context
   */
  routeMessage(context: SLAPMessageContext): string {
    const { layer, intent } = context

    // Primary routing logic
    switch (layer) {
      case 'social':
        return this.config.social[intent as keyof typeof this.config.social]
        
      case 'professional':  
        return this.config.professional[intent as keyof typeof this.config.professional]
        
      case 'treasury':
        return this.config.treasury[intent as keyof typeof this.config.treasury] 
        
      case 'analytics':
        return this.config.analytics[intent as keyof typeof this.config.analytics]
        
      default:
        throw new Error(`Unknown layer: ${layer}`)
    }
  }

  /**
   * Determine optimal topic based on user context and message type
   */
  determineOptimalRoute(
    messageType: string, 
    userId: string, 
    metadata: Record<string, any>
  ): SLAPMessageContext {
    // Smart routing logic based on message patterns
    
    // Social layer detection
    if (messageType.includes('VIRAL') || messageType.includes('BOOST')) {
      return { layer: 'social', intent: 'signal', userId }
    }
    
    if (messageType.includes('FRIEND') || messageType.includes('QR')) {
      return { layer: 'social', intent: 'contact', userId }
    }
    
    // Professional layer detection
    if (messageType.includes('ENTERPRISE') || messageType.includes('CREDENTIAL')) {
      return { layer: 'professional', intent: 'signal', userId }
    }
    
    if (messageType.includes('ENDORSEMENT') || messageType.includes('BUSINESS')) {
      return { layer: 'professional', intent: 'contact', userId }
    }
    
    // Treasury layer detection  
    if (messageType.includes('MINT') || messageType.includes('TRANSFER')) {
      return { layer: 'treasury', intent: 'transaction', userId }
    }
    
    if (messageType.includes('CUSTODY') || messageType.includes('COMPLIANCE')) {
      return { layer: 'treasury', intent: 'audit', userId }
    }
    
    // Default to social layer for ambiguous cases
    return { layer: 'social', intent: 'signal', userId }
  }

  /**
   * Get all topics for cross-layer analytics queries
   */
  getAllTopics(): string[] {
    return [
      ...Object.values(this.config.social),
      ...Object.values(this.config.professional), 
      ...Object.values(this.config.treasury),
      ...Object.values(this.config.analytics)
    ]
  }

  /**
   * Get topics by layer for targeted queries
   */
  getTopicsByLayer(layer: keyof SLAPTopicConfig): string[] {
    return Object.values(this.config[layer])
  }
}

// Default topic configuration (populated from environment)
export const slapTopicConfig: SLAPTopicConfig = {
  social: {
    profile: process.env.NEXT_PUBLIC_TOPIC_SOCIAL_PROFILE || process.env.NEXT_PUBLIC_TOPIC_PROFILE || '',
    contact: process.env.NEXT_PUBLIC_TOPIC_SOCIAL_CONTACT || process.env.NEXT_PUBLIC_TOPIC_CONTACT || '', 
    trust: process.env.NEXT_PUBLIC_TOPIC_SOCIAL_TRUST || process.env.NEXT_PUBLIC_TOPIC_TRUST || '',
    signal: process.env.NEXT_PUBLIC_TOPIC_SOCIAL_SIGNAL || process.env.NEXT_PUBLIC_TOPIC_SIGNAL || ''
  },
  professional: {
    profile: process.env.NEXT_PUBLIC_TOPIC_PROFESSIONAL_PROFILE || '',
    contact: process.env.NEXT_PUBLIC_TOPIC_PROFESSIONAL_CONTACT || '',
    trust: process.env.NEXT_PUBLIC_TOPIC_PROFESSIONAL_TRUST || '',
    signal: process.env.NEXT_PUBLIC_TOPIC_PROFESSIONAL_SIGNAL || ''
  },
  treasury: {
    transactions: process.env.NEXT_PUBLIC_TOPIC_TREASURY_TRANSACTIONS || '',
    custody: process.env.NEXT_PUBLIC_TOPIC_TREASURY_CUSTODY || '',
    audit: process.env.NEXT_PUBLIC_TOPIC_TREASURY_AUDIT || ''
  },
  analytics: {
    networkEffects: process.env.NEXT_PUBLIC_TOPIC_NETWORK_EFFECTS || '',
    reputationBridge: process.env.NEXT_PUBLIC_TOPIC_REPUTATION_BRIDGE || ''
  }
}

// Global router instance
export const slapRouter = new SLAPTopicRouter(slapTopicConfig)