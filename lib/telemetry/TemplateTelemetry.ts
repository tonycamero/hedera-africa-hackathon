/**
 * Template Telemetry Service
 * 
 * Tracks template usage events for analytics and optimization
 * Events: template_used, template_boosted, template_shared
 */

export interface TemplateEvent {
  type: 'template_used' | 'template_boosted' | 'template_shared'
  templateId: string
  lens: string
  context?: string
  group?: string  // A/B test group
  rarity?: string
  category?: string
  userId?: string
  sessionId?: string
  timestamp: number
  metadata?: Record<string, any>
}

export class TemplateTelemetry {
  private static events: TemplateEvent[] = []
  private static readonly MAX_EVENTS = 1000 // Keep last 1000 events in memory
  
  /**
   * Track a template usage event
   */
  static track(event: Omit<TemplateEvent, 'timestamp'>): void {
    const fullEvent: TemplateEvent = {
      ...event,
      timestamp: Date.now()
    }
    
    // Add to in-memory store
    this.events.push(fullEvent)
    
    // Keep only recent events to prevent memory bloat
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS)
    }
    
    // Log to console (in production, send to analytics service)
    console.log(`[TemplateTelemetry] ${event.type}:`, {
      templateId: event.templateId,
      lens: event.lens,
      context: event.context,
      group: event.group,
      rarity: event.rarity,
      userId: event.userId?.slice(-6) || 'anonymous'
    })
    
    // Send to external analytics if configured
    this.sendToAnalytics(fullEvent)
  }
  
  /**
   * Track template used (when user sends a signal)
   */
  static trackUsed(params: {
    templateId: string
    lens: string
    context?: string
    group?: string
    rarity?: string
    category?: string
    userId?: string
    sessionId?: string
    fill?: string
  }): void {
    this.track({
      type: 'template_used',
      templateId: params.templateId,
      lens: params.lens,
      context: params.context,
      group: params.group,
      rarity: params.rarity,
      category: params.category,
      userId: params.userId,
      sessionId: params.sessionId,
      metadata: {
        fillLength: params.fill?.length,
        hasCustomNote: params.fill ? params.fill.length > 0 : false
      }
    })
  }
  
  /**
   * Track template boosted (when boost page is viewed/boosted)
   */
  static trackBoosted(params: {
    templateId: string
    lens: string
    context?: string
    group?: string
    rarity?: string
    category?: string
    boostId?: string
    userId?: string
    sessionId?: string
  }): void {
    this.track({
      type: 'template_boosted',
      templateId: params.templateId,
      lens: params.lens,
      context: params.context,
      group: params.group,
      rarity: params.rarity,
      category: params.category,
      userId: params.userId,
      sessionId: params.sessionId,
      metadata: {
        boostId: params.boostId
      }
    })
  }
  
  /**
   * Track template shared (when boost page is shared)
   */
  static trackShared(params: {
    templateId: string
    lens: string
    context?: string
    group?: string
    rarity?: string
    category?: string
    shareMethod?: 'link' | 'social' | 'copy'
    userId?: string
    sessionId?: string
  }): void {
    this.track({
      type: 'template_shared',
      templateId: params.templateId,
      lens: params.lens,
      context: params.context,
      group: params.group,
      rarity: params.rarity,
      category: params.category,
      userId: params.userId,
      sessionId: params.sessionId,
      metadata: {
        shareMethod: params.shareMethod
      }
    })
  }
  
  /**
   * Get recent events for analytics dashboard
   */
  static getRecentEvents(limit: number = 100): TemplateEvent[] {
    return this.events.slice(-limit)
  }
  
  /**
   * Get events by template ID
   */
  static getEventsByTemplate(templateId: string): TemplateEvent[] {
    return this.events.filter(event => event.templateId === templateId)
  }
  
  /**
   * Get usage statistics
   */
  static getUsageStats(): {
    totalEvents: number
    eventsByType: Record<string, number>
    topTemplates: Array<{templateId: string, count: number}>
    recentActivity: TemplateEvent[]
  } {
    const eventsByType = this.events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const templateCounts = this.events.reduce((acc, event) => {
      acc[event.templateId] = (acc[event.templateId] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const topTemplates = Object.entries(templateCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([templateId, count]) => ({ templateId, count }))
    
    return {
      totalEvents: this.events.length,
      eventsByType,
      topTemplates,
      recentActivity: this.events.slice(-20)
    }
  }
  
  /**
   * Send event to external analytics service
   */
  private static sendToAnalytics(event: TemplateEvent): void {
    // In production, this would send to your analytics service
    // Examples: PostHog, Mixpanel, Segment, etc.
    
    if (process.env.ANALYTICS_ENDPOINT && process.env.ANALYTICS_API_KEY) {
      // Example: send to external service
      fetch(process.env.ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ANALYTICS_API_KEY}`
        },
        body: JSON.stringify({
          event: 'template_event',
          properties: event
        })
      }).catch(error => {
        console.warn('[TemplateTelemetry] Failed to send to analytics:', error.message)
      })
    }
  }
  
  /**
   * Clear all events (useful for testing)
   */
  static clear(): void {
    this.events = []
  }
}