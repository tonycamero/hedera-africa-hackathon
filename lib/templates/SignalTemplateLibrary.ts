/**
 * TrustMesh Signal Template Library
 * 
 * Comprehensive, categorized, and contextual signal templates for viral social recognition
 * Designed for multi-lens deployment (GenZ, Professional, Community, Campus)
 */

export interface SignalTemplate {
  id: string
  text: string                    // Template with ___ placeholder
  maxFill: number                 // Character limit for fill text
  category: TemplateCategory
  subcategory?: string
  lens: LensType[]               // Which lenses can use this template
  context: ContextType[]         // When to suggest this template
  vibe: VibeType                 // Emotional tone
  formality: FormalityLevel      // Professional → Casual scale
  tags: string[]                 // Searchable tags
  examples: string[]             // Example fills for inspiration
  rarity: TemplateRarity         // Common → Legendary for gamification
  unlockConditions?: UnlockCondition[]
}

export type TemplateCategory = 
  | 'achievement'     // Accomplishments, wins, clutch moments
  | 'character'       // Personality traits, values, integrity
  | 'skill'          // Technical abilities, expertise
  | 'leadership'     // Guidance, inspiration, direction
  | 'creativity'     // Innovation, art, original thinking
  | 'support'        // Helping others, collaboration
  | 'resilience'     // Overcoming challenges, persistence
  | 'growth'         // Learning, improvement, development
  | 'impact'         // Making a difference, influence
  | 'authenticity'   // Being genuine, honest, real

export type LensType = 'genz' | 'professional' | 'social' | 'community' | 'campus'
export type ContextType = 'celebration' | 'challenge' | 'milestone' | 'collaboration' | 'crisis' | 'daily' | 'seasonal'
export type VibeType = 'hype' | 'respect' | 'appreciation' | 'pride' | 'inspiration' | 'gratitude'
export type FormalityLevel = 1 | 2 | 3 | 4 | 5  // 1=very casual, 5=very formal
export type TemplateRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface UnlockCondition {
  type: 'trust_level' | 'signals_sent' | 'community_standing' | 'special_event'
  threshold: number
  description: string
}

// Comprehensive Template Library
export const SIGNAL_TEMPLATE_LIBRARY: SignalTemplate[] = [

  // ===== GENZ VIRAL TEMPLATES =====
  
  // Achievement Category - GenZ Style
  {
    id: 'clutched_under_fire',
    text: 'Clutched ___ under fire',
    maxFill: 40,
    category: 'achievement',
    subcategory: 'performance',
    lens: ['genz', 'social'],
    context: ['celebration', 'challenge'],
    vibe: 'hype',
    formality: 1,
    tags: ['clutch', 'pressure', 'performance', 'win'],
    examples: ['the presentation', 'that deadline', 'the group project'],
    rarity: 'common'
  },

  {
    id: 'carried_team',
    text: 'Carried the team on ___',
    maxFill: 40,
    category: 'achievement',
    subcategory: 'teamwork',
    lens: ['genz', 'professional'],
    context: ['collaboration', 'celebration'],
    vibe: 'respect',
    formality: 2,
    tags: ['leadership', 'teamwork', 'responsibility'],
    examples: ['the final project', 'debugging', 'event planning'],
    rarity: 'common'
  },

  {
    id: 'absolutely_sent_it',
    text: 'Absolutely sent it on ___',
    maxFill: 35,
    category: 'achievement',
    subcategory: 'boldness',
    lens: ['genz'],
    context: ['celebration', 'challenge'],
    vibe: 'hype',
    formality: 1,
    tags: ['bold', 'fearless', 'commitment'],
    examples: ['that presentation', 'the dance floor', 'asking the question'],
    rarity: 'uncommon'
  },

  {
    id: 'main_character_energy',
    text: 'Main character energy with ___',
    maxFill: 35,
    category: 'character',
    subcategory: 'confidence',
    lens: ['genz', 'social'],
    context: ['daily', 'celebration'],
    vibe: 'pride',
    formality: 1,
    tags: ['confidence', 'presence', 'authenticity'],
    examples: ['their style', 'that comeback', 'the whole vibe'],
    rarity: 'uncommon'
  },

  // ===== PROFESSIONAL TEMPLATES =====

  {
    id: 'demonstrated_excellence',
    text: 'Demonstrated excellence in ___',
    maxFill: 50,
    category: 'achievement',
    subcategory: 'expertise',
    lens: ['professional', 'community'],
    context: ['milestone', 'collaboration'],
    vibe: 'respect',
    formality: 4,
    tags: ['excellence', 'expertise', 'professional'],
    examples: ['project management', 'client relations', 'technical innovation'],
    rarity: 'common'
  },

  {
    id: 'strategic_thinking',
    text: 'Showed strategic thinking with ___',
    maxFill: 45,
    category: 'leadership',
    subcategory: 'strategy',
    lens: ['professional', 'community'],
    context: ['challenge', 'collaboration'],
    vibe: 'respect',
    formality: 4,
    tags: ['strategy', 'planning', 'leadership'],
    examples: ['the market analysis', 'resource allocation', 'long-term planning'],
    rarity: 'uncommon'
  },

  // ===== COMMUNITY/CAMPUS TEMPLATES =====

  {
    id: 'made_difference',
    text: 'Made a real difference with ___',
    maxFill: 45,
    category: 'impact',
    subcategory: 'service',
    lens: ['community', 'campus', 'professional'],
    context: ['milestone', 'collaboration'],
    vibe: 'inspiration',
    formality: 3,
    tags: ['impact', 'service', 'community'],
    examples: ['the volunteer drive', 'mentoring freshmen', 'organizing the event'],
    rarity: 'rare'
  },

  {
    id: 'brought_everyone_together',
    text: 'Brought everyone together for ___',
    maxFill: 40,
    category: 'leadership',
    subcategory: 'unity',
    lens: ['community', 'campus', 'social'],
    context: ['collaboration', 'celebration'],
    vibe: 'inspiration',
    formality: 3,
    tags: ['unity', 'inclusion', 'community building'],
    examples: ['the fundraiser', 'study groups', 'the difficult conversation'],
    rarity: 'rare'
  },

  // ===== CREATIVE & INNOVATION TEMPLATES =====

  {
    id: 'creative_genius',
    text: 'Pure creative genius with ___',
    maxFill: 35,
    category: 'creativity',
    subcategory: 'innovation',
    lens: ['genz', 'professional', 'social'],
    context: ['celebration', 'milestone'],
    vibe: 'inspiration',
    formality: 2,
    tags: ['creativity', 'innovation', 'original'],
    examples: ['that design', 'the solution', 'their art'],
    rarity: 'rare'
  },

  {
    id: 'next_level_thinking',
    text: 'Next-level thinking on ___',
    maxFill: 40,
    category: 'creativity',
    subcategory: 'problem_solving',
    lens: ['professional', 'genz', 'community'],
    context: ['challenge', 'collaboration'],
    vibe: 'respect',
    formality: 2,
    tags: ['innovation', 'problem solving', 'breakthrough'],
    examples: ['the architecture', 'that workaround', 'the new approach'],
    rarity: 'uncommon'
  },

  // ===== SUPPORT & COLLABORATION TEMPLATES =====

  {
    id: 'always_has_your_back',
    text: 'Always has your back with ___',
    maxFill: 40,
    category: 'support',
    subcategory: 'reliability',
    lens: ['social', 'community', 'campus'],
    context: ['daily', 'challenge'],
    vibe: 'gratitude',
    formality: 2,
    tags: ['support', 'reliability', 'friendship'],
    examples: ['late night coding', 'tough conversations', 'being there'],
    rarity: 'common'
  },

  {
    id: 'lifted_everyone_up',
    text: 'Lifted everyone up through ___',
    maxFill: 40,
    category: 'support',
    subcategory: 'encouragement',
    lens: ['community', 'campus', 'professional'],
    context: ['challenge', 'crisis'],
    vibe: 'inspiration',
    formality: 3,
    tags: ['encouragement', 'positivity', 'motivation'],
    examples: ['difficult times', 'the tough semester', 'team struggles'],
    rarity: 'uncommon'
  },

  // ===== SEASONAL/EVENT-SPECIFIC TEMPLATES =====

  {
    id: 'crushed_finals',
    text: 'Absolutely crushed ___',
    maxFill: 30,
    category: 'achievement',
    subcategory: 'academic',
    lens: ['genz', 'campus'],
    context: ['milestone', 'seasonal'],
    vibe: 'hype',
    formality: 1,
    tags: ['academic', 'achievement', 'finals'],
    examples: ['finals week', 'that exam', 'the presentation'],
    rarity: 'common',
    unlockConditions: [
      { type: 'special_event', threshold: 1, description: 'Available during finals season' }
    ]
  },

  // ===== LEGENDARY/RARE TEMPLATES =====

  {
    id: 'changed_the_game',
    text: 'Literally changed the game with ___',
    maxFill: 45,
    category: 'impact',
    subcategory: 'transformation',
    lens: ['professional', 'community', 'genz'],
    context: ['milestone', 'celebration'],
    vibe: 'inspiration',
    formality: 3,
    tags: ['transformation', 'leadership', 'innovation'],
    examples: ['that breakthrough', 'the new system', 'their vision'],
    rarity: 'legendary',
    unlockConditions: [
      { type: 'trust_level', threshold: 100, description: 'Requires high community trust' },
      { type: 'signals_sent', threshold: 50, description: 'Must have sent 50+ signals' }
    ]
  },

  {
    id: 'absolute_legend',
    text: 'Absolute legend for ___',
    maxFill: 35,
    category: 'character',
    subcategory: 'legendary',
    lens: ['genz', 'social'],
    context: ['celebration', 'milestone'],
    vibe: 'respect',
    formality: 1,
    tags: ['legendary', 'respect', 'iconic'],
    examples: ['that move', 'standing up', 'the whole thing'],
    rarity: 'epic',
    unlockConditions: [
      { type: 'community_standing', threshold: 75, description: 'Requires strong community standing' }
    ]
  }

]

// ===== TEMPLATE DISCOVERY & FILTERING =====

export class SignalTemplateService {
  
  static getTemplatesForLens(lens: LensType): SignalTemplate[] {
    return SIGNAL_TEMPLATE_LIBRARY.filter(template => 
      template.lens.includes(lens)
    )
  }

  static getTemplatesForContext(
    lens: LensType, 
    context: ContextType, 
    userTrustLevel: number = 0,
    signalsSent: number = 0
  ): SignalTemplate[] {
    return SIGNAL_TEMPLATE_LIBRARY.filter(template => {
      // Basic filtering
      if (!template.lens.includes(lens)) return false
      if (!template.context.includes(context)) return false
      
      // Unlock condition check
      if (template.unlockConditions) {
        for (const condition of template.unlockConditions) {
          switch (condition.type) {
            case 'trust_level':
              if (userTrustLevel < condition.threshold) return false
              break
            case 'signals_sent':
              if (signalsSent < condition.threshold) return false
              break
            // Add other conditions as needed
          }
        }
      }
      
      return true
    })
  }

  static searchTemplates(query: string, lens: LensType): SignalTemplate[] {
    const lowercaseQuery = query.toLowerCase()
    
    return SIGNAL_TEMPLATE_LIBRARY.filter(template => {
      if (!template.lens.includes(lens)) return false
      
      return (
        template.text.toLowerCase().includes(lowercaseQuery) ||
        template.category.toLowerCase().includes(lowercaseQuery) ||
        template.subcategory?.toLowerCase().includes(lowercaseQuery) ||
        template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
        template.examples.some(example => example.toLowerCase().includes(lowercaseQuery))
      )
    })
  }

  static getRandomTemplate(
    lens: LensType, 
    rarity?: TemplateRarity,
    category?: TemplateCategory
  ): SignalTemplate | null {
    let filtered = SIGNAL_TEMPLATE_LIBRARY.filter(template => template.lens.includes(lens))
    
    if (rarity) {
      filtered = filtered.filter(template => template.rarity === rarity)
    }
    
    if (category) {
      filtered = filtered.filter(template => template.category === category)
    }
    
    if (filtered.length === 0) return null
    
    const randomIndex = Math.floor(Math.random() * filtered.length)
    return filtered[randomIndex]
  }

  static getTemplatesByCategory(lens: LensType, category: TemplateCategory): SignalTemplate[] {
    return SIGNAL_TEMPLATE_LIBRARY.filter(template => 
      template.lens.includes(lens) && template.category === category
    )
  }

  static getSuggestedFills(templateId: string): string[] {
    const template = SIGNAL_TEMPLATE_LIBRARY.find(t => t.id === templateId)
    return template?.examples || []
  }
}

export default SignalTemplateService