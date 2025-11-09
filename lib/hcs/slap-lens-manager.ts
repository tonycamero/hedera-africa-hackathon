/**
 * SLAP Universal Lens Manager
 * Translates ALL signal types between GenZ and Professional vocabularies
 * Same HCS data, different presentation per lens
 */

import { slapSignalManager } from './slap-signal-sets'
import type { SignalEvent } from '@/lib/types'

export type LensType = 'genz' | 'professional' | 'hybrid'
export type SignalCategory = 'recognition' | 'trust' | 'contact' | 'profile' | 'treasury' | 'system'

export interface LensTranslation {
  title: string
  description: string
  actionText?: string
  emoji?: string
  shareTemplate?: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

// === LENS TRANSLATION MAPPINGS ===
export const LENS_TRANSLATIONS: Record<string, Record<LensType, LensTranslation>> = {
  // === RECOGNITION SIGNALS ===
  'RECOGNITION_MINT': {
    genz: {
      title: 'Props received! 🔥',
      description: 'Someone sent you recognition',
      actionText: 'Check it out',
      emoji: '🎉',
      shareTemplate: 'Just got some major props! 🔥',
      category: 'Achievement',
      priority: 'high'
    },
    professional: {
      title: 'Professional Recognition Received',
      description: 'Peer recognition for professional achievement',
      actionText: 'View credential',
      emoji: '🏆',
      shareTemplate: 'Received professional recognition from colleague',
      category: 'Credentials',
      priority: 'high'
    },
    hybrid: {
      title: 'Achievement unlocked! 🏆',
      description: 'Professional recognition with social impact',
      actionText: 'Celebrate',
      emoji: '⚡',
      shareTemplate: 'Achievement unlocked! Leveling up professionally 🚀',
      category: 'Achievement',
      priority: 'high'
    }
  },

  // === TRUST ALLOCATION SIGNALS ===
  'TRUST_ALLOCATE': {
    genz: {
      title: 'Added to inner circle! ⚡',
      description: 'Someone trusts you with their inner circle spot',
      actionText: 'See who',
      emoji: '🤝',
      shareTemplate: 'Just got added to someone\'s inner circle! Trust levels rising 📈',
      category: 'Social',
      priority: 'high'
    },
    professional: {
      title: 'Trust Endorsement Received', 
      description: 'Professional colleague has endorsed your capabilities',
      actionText: 'View endorsement',
      emoji: '🤝',
      shareTemplate: 'Received professional trust endorsement',
      category: 'Endorsements',
      priority: 'medium'
    },
    hybrid: {
      title: 'Trust level up! 🚀',
      description: 'Your professional trust network is growing',
      actionText: 'View network',
      emoji: '📈',
      shareTemplate: 'Trust network expanding! Professional relationships building 🤝',
      category: 'Network',
      priority: 'medium'
    }
  },

  'TRUST_REVOKE': {
    genz: {
      title: 'Circle update',
      description: 'Someone updated their trust allocation',
      actionText: 'No action needed',
      emoji: '🔄',
      category: 'Social',
      priority: 'low'
    },
    professional: {
      title: 'Trust Allocation Updated',
      description: 'Professional trust allocation has been modified',
      actionText: 'Review changes',
      emoji: '🔄',
      category: 'Network',
      priority: 'low'
    },
    hybrid: {
      title: 'Network adjustment',
      description: 'Professional trust network updated',
      actionText: 'Review network',
      emoji: '🔄',
      category: 'Network',
      priority: 'low'
    }
  },

  // === CONTACT/CONNECTION SIGNALS ===
  'CONTACT_REQUEST': {
    genz: {
      title: 'New friend request! 👋',
      description: 'Someone wants to connect with you',
      actionText: 'Accept or decline',
      emoji: '👋',
      shareTemplate: 'New friend request incoming! Growing the squad 🤝',
      category: 'Social',
      priority: 'medium'
    },
    professional: {
      title: 'Connection Request Received',
      description: 'Professional colleague wants to connect',
      actionText: 'Review profile',
      emoji: '🤝',
      shareTemplate: 'New professional connection request',
      category: 'Networking',
      priority: 'medium'
    },
    hybrid: {
      title: 'Network invite! 🤝',
      description: 'Someone wants to join your professional network',
      actionText: 'Review request',
      emoji: '📬',
      shareTemplate: 'Professional network growing! New connection request 🚀',
      category: 'Networking',
      priority: 'medium'
    }
  },

  'CONTACT_ACCEPT': {
    genz: {
      title: 'Connection confirmed! ⚡',
      description: 'You\'re now connected with a new friend',
      actionText: 'Send props',
      emoji: '🎉',
      shareTemplate: 'New connection made! Squad is growing 🤝',
      category: 'Social',
      priority: 'high'
    },
    professional: {
      title: 'Professional Connection Established',
      description: 'New professional relationship confirmed',
      actionText: 'Send recognition',
      emoji: '🤝',
      shareTemplate: 'New professional connection confirmed',
      category: 'Networking', 
      priority: 'medium'
    },
    hybrid: {
      title: 'Network expanded! 🚀',
      description: 'Professional network connection confirmed',
      actionText: 'Engage',
      emoji: '🌟',
      shareTemplate: 'Professional network expanding! New connections forming 🤝',
      category: 'Networking',
      priority: 'medium'
    }
  },

  // === PROFILE SIGNALS ===
  'PROFILE_UPDATE': {
    genz: {
      title: 'Vibe check updated 🔄',
      description: 'Profile got a fresh update',
      actionText: 'Check it out',
      emoji: '✨',
      category: 'Personal',
      priority: 'low'
    },
    professional: {
      title: 'Professional Profile Updated',
      description: 'Professional credentials or information updated',
      actionText: 'Review changes',
      emoji: '📝',
      category: 'Profile',
      priority: 'low'
    },
    hybrid: {
      title: 'Profile enhanced! ✨',
      description: 'Professional profile updated with new information',
      actionText: 'View profile',
      emoji: '⬆️',
      shareTemplate: 'Professional profile updated! Always evolving 🚀',
      category: 'Profile',
      priority: 'low'
    }
  },

  // === TREASURY/FINANCIAL SIGNALS ===
  'TREASURY_MINT': {
    genz: {
      title: 'Tokens minted! 💎',
      description: 'New value tokens created in your wallet',
      actionText: 'Check wallet',
      emoji: '💰',
      shareTemplate: 'Just minted some value tokens! 💎',
      category: 'Finance',
      priority: 'high'
    },
    professional: {
      title: 'Treasury Operation Completed',
      description: 'Financial transaction processed successfully',
      actionText: 'View transaction',
      emoji: '📊',
      category: 'Finance',
      priority: 'high'
    },
    hybrid: {
      title: 'Value creation! 💰',
      description: 'Financial operation completed successfully',
      actionText: 'View details',
      emoji: '📈',
      shareTemplate: 'Value creation in progress! Financial growth 📈',
      category: 'Finance',
      priority: 'high'
    }
  },

  'TREASURY_TRANSFER': {
    genz: {
      title: 'Payment sent! 💸',
      description: 'Successfully sent tokens to someone',
      actionText: 'View receipt',
      emoji: '🚀',
      shareTemplate: 'Payment sent! Keeping the economy moving 💸',
      category: 'Finance',
      priority: 'medium'
    },
    professional: {
      title: 'Financial Transaction Completed',
      description: 'Business payment processed successfully', 
      actionText: 'View transaction',
      emoji: '✅',
      category: 'Finance',
      priority: 'medium'
    },
    hybrid: {
      title: 'Transaction complete! ✅',
      description: 'Financial transaction processed successfully',
      actionText: 'View details',
      emoji: '💳',
      shareTemplate: 'Transaction completed! Professional finance in action 💼',
      category: 'Finance',
      priority: 'medium'
    }
  }
}

export class SLAPLensManager {
  
  /**
   * Translate any signal event to appropriate lens vocabulary
   */
  translateSignal(event: SignalEvent, lens: LensType): LensTranslation {
    const translation = LENS_TRANSLATIONS[event.type]?.[lens]
    
    if (!translation) {
      // Fallback translation
      return {
        title: lens === 'genz' 
          ? `Something happened! ${event.type}` 
          : `System Event: ${event.type}`,
        description: lens === 'genz'
          ? 'Check it out to see what\'s new'
          : 'Review system notification',
        category: 'System',
        priority: 'low'
      }
    }

    // Handle recognition signals with specific token information
    if (event.type === 'RECOGNITION_MINT' && event.metadata?.tokenId) {
      const signal = slapSignalManager.getSignalForLens(
        event.metadata.tokenId, 
        lens === 'hybrid' ? 'genz' : lens
      )
      
      if (signal) {
        return {
          ...translation,
          title: lens === 'genz' 
            ? `${signal.slang || signal.name}! 🔥`
            : `${signal.formal || signal.name} Received`,
          shareTemplate: signal.shareTemplate || translation.shareTemplate
        }
      }
    }

    return translation
  }

  /**
   * Get all signal events translated for specific lens
   */
  translateSignalFeed(events: SignalEvent[], lens: LensType): (SignalEvent & { translation: LensTranslation })[] {
    return events.map(event => ({
      ...event,
      translation: this.translateSignal(event, lens)
    }))
  }

  /**
   * Filter signals by lens-appropriate categories
   */
  getRelevantSignals(events: SignalEvent[], lens: LensType): SignalEvent[] {
    return events.filter(event => {
      const translation = this.translateSignal(event, lens)
      
      // GenZ lens preferences
      if (lens === 'genz') {
        return ['Achievement', 'Social', 'Finance'].includes(translation.category)
      }
      
      // Professional lens preferences  
      if (lens === 'professional') {
        return ['Credentials', 'Endorsements', 'Networking', 'Finance'].includes(translation.category)
      }
      
      // Hybrid shows everything
      return true
    })
  }

  /**
   * Get lens-appropriate action suggestions for signal
   */
  getSuggestedActions(event: SignalEvent, lens: LensType): string[] {
    const translation = this.translateSignal(event, lens)
    const actions: string[] = []
    
    if (translation.actionText) {
      actions.push(translation.actionText)
    }
    
    if (translation.shareTemplate && lens !== 'professional') {
      actions.push('Share this')
    }
    
    // Add lens-specific contextual actions
    if (event.type === 'TRUST_ALLOCATE') {
      actions.push(lens === 'genz' ? 'Send props back' : 'Send recognition')
    }
    
    if (event.type === 'CONTACT_ACCEPT') {
      actions.push(lens === 'genz' ? 'Add to inner circle' : 'Endorse skills')
    }
    
    return actions
  }
}

// Global lens manager instance
export const slapLensManager = new SLAPLensManager()