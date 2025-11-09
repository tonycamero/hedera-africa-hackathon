/**
 * SLAP Signal Set Manager
 * Different signal taxonomies for GenZ vs Professional lenses
 * Same underlying HCS patterns, different signal vocabularies
 */

export interface SLAPSignalDefinition {
  id: string
  name: string
  slang?: string          // GenZ-friendly display name
  formal?: string         // Professional display name
  description: string
  category: string
  xpValue: number
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  lens: 'genz' | 'professional' | 'hybrid'
  shareTemplate?: string  // For viral sharing
  professionalWeight?: number  // For B2B credibility scoring
}

// === GENZ LENS SIGNAL SETS ===
export const GENZ_SIGNAL_SETS = {
  // Social Recognition - Campus/friendship focused
  social: [
    {
      id: 'viral-boost',
      name: 'Viral Boost',
      slang: 'This absolutely slaps! 🔥',
      description: 'Content that resonates with the community',
      category: 'Social',
      xpValue: 25,
      rarity: 'common',
      lens: 'genz',
      shareTemplate: 'Just got viral boosted! My content hits different 🔥'
    },
    {
      id: 'crew-props', 
      name: 'Crew Props',
      slang: 'You\'re in my inner circle now',
      description: 'Recognition from trusted friend group',
      category: 'Social',
      xpValue: 40,
      rarity: 'rare', 
      lens: 'genz',
      shareTemplate: 'Got crew props from my inner circle! 🤝'
    },
    {
      id: 'campus-legend',
      name: 'Campus Legend',
      slang: 'Everyone knows you',
      description: 'Widely recognized on campus or in community',
      category: 'Social',
      xpValue: 60,
      rarity: 'epic',
      lens: 'genz', 
      shareTemplate: 'Officially a campus legend! 👑'
    }
  ],

  // Achievement Gaming - Progression focused
  gaming: [
    {
      id: 'level-up',
      name: 'Level Up',
      slang: 'Just leveled up! ⚡',
      description: 'Significant skill or achievement progression',
      category: 'Achievement',
      xpValue: 35,
      rarity: 'uncommon',
      lens: 'genz',
      shareTemplate: 'Level up complete! Next milestone incoming ⚡'
    },
    {
      id: 'rare-drop',
      name: 'Rare Drop',
      slang: 'Got something special',
      description: 'Discovered or achieved something unique',
      category: 'Achievement', 
      xpValue: 50,
      rarity: 'rare',
      lens: 'genz',
      shareTemplate: 'Just got a rare drop! This is special ✨'
    }
  ],

  // Viral Amplification - Shareability focused
  amplification: [
    {
      id: 'share-worthy',
      name: 'Share Worthy',
      slang: 'Had to share this',
      description: 'Content compelling enough to amplify',
      category: 'Viral',
      xpValue: 20,
      rarity: 'common',
      lens: 'genz',
      shareTemplate: 'This was too good not to share! 📢'
    },
    {
      id: 'main-character',
      name: 'Main Character',
      slang: 'You\'re the moment',
      description: 'Central figure in a significant event',
      category: 'Viral',
      xpValue: 45,
      rarity: 'rare',
      lens: 'genz',
      shareTemplate: 'Main character energy activated! 🌟'
    }
  ]
} as const

// === PROFESSIONAL LENS SIGNAL SETS ===
export const PROFESSIONAL_SIGNAL_SETS = {
  // Leadership Excellence - Management focused
  leadership: [
    {
      id: 'strategic-vision',
      name: 'Strategic Vision',
      formal: 'Strategic Leadership Excellence',
      slang: 'Big picture energy',
      description: 'Demonstrates exceptional strategic thinking and long-term planning',
      category: 'Leadership',
      xpValue: 55,
      rarity: 'epic',
      lens: 'hybrid',
      professionalWeight: 0.9,
      shareTemplate: 'Recognized for strategic vision! Building the future 🎯'
    },
    {
      id: 'team-catalyst',
      name: 'Team Catalyst', 
      formal: 'Team Performance Driver',
      slang: 'Squad activator',
      description: 'Elevates team performance and collaboration',
      category: 'Leadership',
      xpValue: 50,
      rarity: 'rare',
      lens: 'hybrid',
      professionalWeight: 0.8,
      shareTemplate: 'Team catalyst mode activated! We rise together 🚀'
    }
  ],

  // Technical Expertise - Skills focused
  expertise: [
    {
      id: 'domain-authority',
      name: 'Domain Authority',
      formal: 'Subject Matter Expert',
      slang: 'The person to ask',
      description: 'Recognized expert in specific domain or technology',
      category: 'Technical',
      xpValue: 60,
      rarity: 'epic',
      lens: 'hybrid',
      professionalWeight: 0.95,
      shareTemplate: 'Domain authority recognized! Ask me anything 🧠'
    },
    {
      id: 'problem-solver',
      name: 'Problem Solver',
      formal: 'Complex Issue Resolution',
      slang: 'Fix-it energy',
      description: 'Consistently resolves challenging technical or business problems',
      category: 'Technical',
      xpValue: 45,
      rarity: 'rare',
      lens: 'hybrid', 
      professionalWeight: 0.75,
      shareTemplate: 'Problem solver in action! No challenge too big 💪'
    }
  ],

  // Business Impact - Results focused
  impact: [
    {
      id: 'revenue-driver',
      name: 'Revenue Driver',
      formal: 'Business Impact Achievement',
      slang: 'Money moves',
      description: 'Directly contributes to revenue generation or business growth',
      category: 'Business',
      xpValue: 65,
      rarity: 'legendary',
      lens: 'professional',
      professionalWeight: 1.0,
      shareTemplate: 'Revenue driver achievement unlocked! 💰'
    },
    {
      id: 'client-advocate',
      name: 'Client Advocate',
      formal: 'Client Success Champion',
      slang: 'Customer obsessed',
      description: 'Champions client success and satisfaction',
      category: 'Business',
      xpValue: 50,
      rarity: 'rare',
      lens: 'hybrid',
      professionalWeight: 0.8,
      shareTemplate: 'Client advocate energy! Success is mutual 🤝'
    }
  ]
} as const

export class SLAPSignalSetManager {
  
  /**
   * Get all signals for a specific lens
   */
  getSignalsByLens(lens: 'genz' | 'professional' | 'hybrid'): SLAPSignalDefinition[] {
    const allSignals = [
      ...Object.values(GENZ_SIGNAL_SETS).flat(),
      ...Object.values(PROFESSIONAL_SIGNAL_SETS).flat()
    ]
    
    return allSignals.filter(signal => 
      signal.lens === lens || signal.lens === 'hybrid'
    )
  }

  /**
   * Get signal definition with appropriate display name for lens
   */
  getSignalForLens(signalId: string, lens: 'genz' | 'professional'): SLAPSignalDefinition | null {
    const allSignals = [
      ...Object.values(GENZ_SIGNAL_SETS).flat(),
      ...Object.values(PROFESSIONAL_SIGNAL_SETS).flat()
    ]
    
    const signal = allSignals.find(s => s.id === signalId)
    if (!signal) return null
    
    // Return appropriate display name based on lens
    return {
      ...signal,
      name: lens === 'genz' 
        ? (signal.slang || signal.name)
        : (signal.formal || signal.name)
    }
  }

  /**
   * Get signals by category for lens-appropriate filtering
   */
  getSignalsByCategory(category: string, lens: 'genz' | 'professional'): SLAPSignalDefinition[] {
    const lensSignals = this.getSignalsByLens(lens === 'genz' ? 'genz' : 'professional')
    return lensSignals.filter(signal => signal.category === category)
  }

  /**
   * Calculate professional credibility score from signal history
   */
  calculateProfessionalScore(signalIds: string[]): number {
    let totalWeight = 0
    let totalSignals = 0
    
    for (const signalId of signalIds) {
      const signal = this.getSignalForLens(signalId, 'professional')
      if (signal?.professionalWeight) {
        totalWeight += signal.professionalWeight
        totalSignals += 1
      }
    }
    
    return totalSignals > 0 ? (totalWeight / totalSignals) * 100 : 0
  }
}

// Global signal set manager
export const slapSignalManager = new SLAPSignalSetManager()