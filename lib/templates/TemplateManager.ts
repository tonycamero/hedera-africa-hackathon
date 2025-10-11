/**
 * Template Manager
 * 
 * Dynamic template distribution, A/B testing, and community-driven expansion
 * Enables viral template discovery and organic growth of the signal library
 */

import { SignalTemplate, LensType, TemplateCategory, TemplateRarity, SIGNAL_TEMPLATE_LIBRARY } from './SignalTemplateLibrary'
import { getOrAssignClientGroup, type TestGroup } from '../ab/abGroup'
import { TemplateMetricsStore } from '../metrics/TemplateMetricsStore'

export interface TemplateMetrics {
  templateId: string
  usageCount: number
  boostCount: number
  shareCount: number
  viralScore: number        // Calculated metric
  conversionRate: number    // Signals → Boosts
  lastUsed: number         // Timestamp
  trending: boolean
  trendingScore: number
}

export interface TemplateBatch {
  id: string
  name: string
  description: string
  templates: SignalTemplate[]
  lens: LensType[]
  releaseDate: number
  expirationDate?: number
  featured: boolean
  unlockConditions?: {
    trustLevel?: number
    communityStanding?: number
    specialEvent?: string
  }
}

export interface TemplateVariation {
  originalId: string
  variationId: string
  text: string
  testGroup: 'A' | 'B' | 'C'
  metrics: TemplateMetrics
  isActive: boolean
}

export class TemplateManager {
  private static metrics: Map<string, TemplateMetrics> = new Map()
  private static batches: TemplateBatch[] = []
  private static variations: Map<string, TemplateVariation[]> = new Map()
  private static userTestGroups: Map<string, string> = new Map() // userId -> testGroup

  // ===== PREDEFINED TEMPLATE BATCHES =====

  static readonly TEMPLATE_BATCHES: TemplateBatch[] = [
    {
      id: 'genz_launch',
      name: 'GenZ Launch Pack',
      description: 'Essential viral templates for GenZ social recognition',
      lens: ['genz', 'social'],
      releaseDate: Date.now(),
      featured: true,
      templates: [
        // References to templates in main library by ID
      ]
    },

    {
      id: 'finals_season_2025',
      name: 'Finals Season 2025',
      description: 'Academic achievement templates for finals period',
      lens: ['genz', 'campus'],
      releaseDate: new Date('2025-12-01').getTime(),
      expirationDate: new Date('2025-12-20').getTime(),
      featured: true,
      unlockConditions: {
        specialEvent: 'finals_season'
      },
      templates: []
    },

    {
      id: 'professional_excellence',
      name: 'Professional Excellence',
      description: 'High-formality templates for workplace recognition',
      lens: ['professional', 'community'],
      releaseDate: Date.now(),
      featured: false,
      unlockConditions: {
        trustLevel: 25
      },
      templates: []
    },

    {
      id: 'legendary_tier',
      name: 'Legendary Recognition',
      description: 'Ultra-rare templates for exceptional achievements',
      lens: ['professional', 'community', 'genz'],
      releaseDate: Date.now(),
      featured: true,
      unlockConditions: {
        trustLevel: 100,
        communityStanding: 75
      },
      templates: []
    }
  ]

  // ===== VIRAL TEMPLATE DISCOVERY =====

  static getViralTemplates(lens: LensType, limit: number = 10): SignalTemplate[] {
    // Get templates sorted by viral score
    const sortedByViral = Array.from(this.metrics.entries())
      .filter(([templateId, metrics]) => metrics.viralScore > 0)
      .sort((a, b) => b[1].viralScore - a[1].viralScore)
      .slice(0, limit)

    // Return actual template objects (would need to lookup from main library)
    return sortedByViral.map(([templateId]) => {
      return SIGNAL_TEMPLATE_LIBRARY.find(template => template.id === templateId) || null
    }).filter(Boolean) as SignalTemplate[]
  }

  static getTrendingTemplates(lens: LensType, limit: number = 5): SignalTemplate[] {
    const now = Date.now()
    const lastWeek = now - (7 * 24 * 60 * 60 * 1000)

    // Calculate trending based on recent usage spike
    const trending = Array.from(this.metrics.entries())
      .filter(([_, metrics]) => {
        return metrics.lastUsed > lastWeek && metrics.trending
      })
      .sort((a, b) => b[1].trendingScore - a[1].trendingScore)
      .slice(0, limit)

    return trending.map(([templateId]) => {
      return SIGNAL_TEMPLATE_LIBRARY.find(template => template.id === templateId) || null
    }).filter(Boolean) as SignalTemplate[]
  }

  // ===== A/B TESTING SYSTEM =====

  static createTemplateVariation(
    originalTemplateId: string, 
    variationText: string, 
    testGroup: 'A' | 'B' | 'C'
  ): string {
    const variationId = `${originalTemplateId}_${testGroup.toLowerCase()}`
    
    const variation: TemplateVariation = {
      originalId: originalTemplateId,
      variationId,
      text: variationText,
      testGroup,
      metrics: {
        templateId: variationId,
        usageCount: 0,
        boostCount: 0,
        shareCount: 0,
        viralScore: 0,
        conversionRate: 0,
        lastUsed: 0,
        trending: false,
        trendingScore: 0
      },
      isActive: true
    }

    if (!this.variations.has(originalTemplateId)) {
      this.variations.set(originalTemplateId, [])
    }
    this.variations.get(originalTemplateId)!.push(variation)

    return variationId
  }

  static getTemplateForUser(templateId: string, userId?: string): SignalTemplate | null {
    // Check if template has A/B variations
    const variations = this.variations.get(templateId)
    if (!variations || variations.length === 0) {
      // Return original template
      return SIGNAL_TEMPLATE_LIBRARY.find(template => template.id === templateId) || null
    }

    // Get user's test group using persistent assignment
    let testGroup: TestGroup
    if (userId && this.userTestGroups.has(userId)) {
      testGroup = this.userTestGroups.get(userId) as TestGroup
    } else {
      // Use client-side persistent assignment
      testGroup = getOrAssignClientGroup()
      if (userId) {
        this.userTestGroups.set(userId, testGroup)
      }
    }

    // Find variation for user's test group
    const variation = variations.find(v => v.testGroup === testGroup && v.isActive)
    if (variation) {
      // Return template with variation text merged with base template
      const baseTemplate = SIGNAL_TEMPLATE_LIBRARY.find(t => t.id === templateId)
      if (baseTemplate) {
        return {
          ...baseTemplate,
          id: variation.variationId,
          text: variation.text
        }
      }
    }

    // Fallback to original
    return SIGNAL_TEMPLATE_LIBRARY.find(template => template.id === templateId) || null
  }

  // ===== COMMUNITY-DRIVEN TEMPLATE SUGGESTIONS =====

  static submitCommunityTemplate(
    suggestedTemplate: Omit<SignalTemplate, 'id' | 'rarity'>,
    submitterId: string
  ): { success: boolean; templateId?: string; error?: string } {
    
    // Validate template
    if (!suggestedTemplate.text.includes('___')) {
      return { success: false, error: 'Template must include ___ placeholder' }
    }

    if (suggestedTemplate.text.length > 60) {
      return { success: false, error: 'Template text too long' }
    }

    // Generate ID for community template
    const templateId = `community_${Date.now()}_${submitterId.slice(-6)}`
    
    // Add to community review queue
    const communityTemplate: SignalTemplate = {
      ...suggestedTemplate,
      id: templateId,
      rarity: 'common', // Start as common, can be upgraded
      tags: [...suggestedTemplate.tags, 'community-submitted']
    }

    // In real implementation, add to review queue
    console.log('[TemplateManager] Community template submitted:', communityTemplate)

    return { success: true, templateId }
  }

  // ===== TEMPLATE METRICS & ANALYTICS =====

  static recordTemplateUsage(templateId: string, action: 'use' | 'boost' | 'share'): void {
    // Update in-memory metrics for backward compatibility
    let metrics = this.metrics.get(templateId)
    if (!metrics) {
      metrics = {
        templateId,
        usageCount: 0,
        boostCount: 0,
        shareCount: 0,
        viralScore: 0,
        conversionRate: 0,
        lastUsed: 0,
        trending: false,
        trendingScore: 0
      }
      this.metrics.set(templateId, metrics)
    }

    // Update metrics
    switch (action) {
      case 'use':
        metrics.usageCount++
        metrics.lastUsed = Date.now()
        // Update persistent store
        TemplateMetricsStore.incrUsage(templateId).catch(console.error)
        break
      case 'boost':
        metrics.boostCount++
        // Update persistent store
        TemplateMetricsStore.incrBoost(templateId).catch(console.error)
        break
      case 'share':
        metrics.shareCount++
        // Update persistent store
        TemplateMetricsStore.incrShare(templateId).catch(console.error)
        break
    }

    // Recalculate viral score
    metrics.viralScore = this.calculateViralScoreFromMetrics(metrics)
    metrics.conversionRate = metrics.usageCount > 0 ? metrics.boostCount / metrics.usageCount : 0
    
    // Update trending status
    this.updateTrendingStatus(templateId, metrics)
  }

  static calculateViralScore(templateId: string): number {
    const metrics = this.metrics.get(templateId)
    if (!metrics) return 0
    
    // Viral score algorithm: usage * boost_multiplier * share_multiplier
    const baseScore = metrics.usageCount
    const boostMultiplier = 1 + (metrics.boostCount * 0.5)
    const shareMultiplier = 1 + (metrics.shareCount * 2.0)
    
    return Math.floor(baseScore * boostMultiplier * shareMultiplier)
  }

  private static calculateViralScoreFromMetrics(metrics: TemplateMetrics): number {
    // Viral score algorithm: usage * boost_multiplier * share_multiplier
    const baseScore = metrics.usageCount
    const boostMultiplier = 1 + (metrics.boostCount * 0.5)
    const shareMultiplier = 1 + (metrics.shareCount * 2.0)
    
    return Math.floor(baseScore * boostMultiplier * shareMultiplier)
  }

  private static updateTrendingStatus(templateId: string, metrics: TemplateMetrics): void {
    const now = Date.now()
    const oneDayAgo = now - (24 * 60 * 60 * 1000)
    
    // Simple trending logic: used recently with high viral score
    const recentlyUsed = metrics.lastUsed > oneDayAgo
    const highViralScore = metrics.viralScore > 50
    
    metrics.trending = recentlyUsed && highViralScore
    metrics.trendingScore = metrics.trending ? metrics.viralScore : 0
  }

  // ===== SEASONAL & EVENT TEMPLATES =====

  static getSeasonalTemplates(currentSeason: string, lens: LensType): SignalTemplate[] {
    // In real implementation, filter by season/event conditions
    const seasonalBatch = this.batches.find(batch => 
      batch.unlockConditions?.specialEvent === currentSeason
    )
    
    return seasonalBatch?.templates.filter(template => 
      template.lens.includes(lens)
    ) || []
  }

  static activateEventTemplates(eventName: string): void {
    console.log(`[TemplateManager] Activating templates for event: ${eventName}`)
    
    // Find batches for this event
    const eventBatches = this.batches.filter(batch => 
      batch.unlockConditions?.specialEvent === eventName
    )
    
    // Mark as featured/active
    eventBatches.forEach(batch => {
      batch.featured = true
      console.log(`[TemplateManager] Activated batch: ${batch.name}`)
    })
  }

  // ===== TEMPLATE RECOMMENDATION ENGINE =====

  static getRecommendedTemplates(
    userId: string, 
    lens: LensType, 
    context: string,
    userTrustLevel: number = 0
  ): SignalTemplate[] {
    
    // Get user's historical preferences
    const userHistory = this.getUserTemplateHistory(userId)
    
    // Combine multiple recommendation strategies
    const trending = this.getTrendingTemplates(lens, 3)
    const viral = this.getViralTemplates(lens, 3)  
    const personalized = this.getPersonalizedTemplates(userId, lens, userHistory)
    const contextual = this.getContextualTemplates(context, lens)
    
    // Merge and dedupe recommendations
    const allRecommendations = [...trending, ...viral, ...personalized, ...contextual]
    const uniqueRecommendations = Array.from(
      new Map(allRecommendations.map(t => [t?.id, t])).values()
    ).filter(Boolean)
    
    return uniqueRecommendations.slice(0, 10)
  }

  private static getUserTemplateHistory(userId: string): string[] {
    // In real implementation, query user's template usage history
    return []
  }

  private static getPersonalizedTemplates(userId: string, lens: LensType, history: string[]): SignalTemplate[] {
    // Personalization based on user's past template preferences
    return []
  }

  private static getContextualTemplates(context: string, lens: LensType): SignalTemplate[] {
    // Templates that match current context (finals, holidays, etc.)
    return []
  }

  // ===== TEMPLATE ANALYTICS DASHBOARD DATA =====

  static getTemplateAnalytics(): {
    totalTemplates: number
    totalUsage: number
    topPerforming: TemplateMetrics[]
    trendingNow: string[]
    communitySubmissions: number
  } {
    const allMetrics = Array.from(this.metrics.values())
    
    return {
      totalTemplates: this.metrics.size,
      totalUsage: allMetrics.reduce((sum, m) => sum + m.usageCount, 0),
      topPerforming: allMetrics
        .sort((a, b) => b.viralScore - a.viralScore)
        .slice(0, 10),
      trendingNow: allMetrics
        .filter(m => m.trending)
        .map(m => m.templateId),
      communitySubmissions: allMetrics.filter(m => 
        m.templateId.startsWith('community_')
      ).length
    }
  }
}

export default TemplateManager