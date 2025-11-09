import { NextRequest, NextResponse } from 'next/server'
import { TemplateTelemetry } from '@/lib/telemetry/TemplateTelemetry'
import { TemplateMetricsStore } from '@/lib/metrics/TemplateMetricsStore'

/**
 * GET /api/templates/analytics
 * 
 * Returns template usage analytics and telemetry data
 * Query params: templateId (optional), limit (optional)
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user has admin access (in production, add proper auth)
    const isDevMode = process.env.NODE_ENV === 'development'
    const adminToken = request.headers.get('authorization')
    const isAdmin = adminToken === `Bearer ${process.env.ADMIN_API_KEY}` || isDevMode
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized access to analytics' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    
    if (templateId) {
      // Get analytics for specific template
      const events = TemplateTelemetry.getEventsByTemplate(templateId)
      return NextResponse.json({
        success: true,
        templateId,
        events,
        totalEvents: events.length,
        eventTypes: events.reduce((acc, event) => {
          acc[event.type] = (acc[event.type] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      })
    }
    
    // Get overall usage statistics from both telemetry and persistent metrics
    const telemetryStats = TemplateTelemetry.getUsageStats()
    const recentEvents = TemplateTelemetry.getRecentEvents(limit)
    const persistentMetrics = TemplateMetricsStore.readTop(20)
    
    return NextResponse.json({
      success: true,
      analytics: {
        ...telemetryStats,
        recentEvents,
        persistentMetrics,
        topTemplatesByUsage: persistentMetrics.slice(0, 10)
      },
      meta: {
        limit,
        timestamp: Date.now(),
        metricsSource: 'hybrid' // Both telemetry and persistent storage
      }
    })
    
  } catch (error) {
    console.error('[TemplateAnalytics] Error fetching analytics:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch template analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}