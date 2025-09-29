/**
 * Health endpoint for HCS ingestion system
 * Provides monitoring and status information for data ingestion processes
 */

import { NextResponse } from 'next/server'
import { getIngestionStats, getIngestionHealth } from '@/lib/ingest/ingestor'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const health = getIngestionHealth()
    const stats = getIngestionStats()

    // Extract key metrics for health check
    const response = {
      status: health.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      ingestion: {
        running: health.running,
        healthy: health.healthy,
        activeConnections: health.activeConnections,
        recentActivity: health.recentActivity,
        lastActivity: health.lastActivity ? new Date(health.lastActivity).toISOString() : null,
      },
      metrics: {
        totalMessages: health.totalMessages,
        totalErrors: health.totalErrors,
        errorRate: health.totalMessages > 0 ? (health.totalErrors / health.totalMessages) * 100 : 0,
      },
      topics: Object.entries(stats).filter(([key]) => 
        ['contacts', 'trust', 'profile', 'signal', 'recognition'].includes(key)
      ).reduce((acc, [key, stat]) => ({
        ...acc,
        [key]: {
          backfilled: stat.backfilled,
          streamed: stat.streamed,
          failed: stat.failed,
          lastActivity: stat.lastActivity ? new Date(stat.lastActivity).toISOString() : null,
          lastConsensusNs: stat.lastConsensusNs,
        }
      }), {}),
      recognition: {
        definitions: stats.recognition?.recognitionDefinitions || 0,
        instances: stats.recognition?.recognitionInstances || 0,
        pending: stats.recognition?.recognitionPending || 0,
      },
      store: stats.signalsStore,
      uptime: process.uptime ? Math.floor(process.uptime()) : null,
    }

    // Set appropriate HTTP status based on health
    const statusCode = health.healthy ? 200 : 503
    
    return NextResponse.json(response, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('[Ingestion Health API] Error:', error)
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Failed to retrieve ingestion health status',
      message: String(error)
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}

/**
 * POST endpoint for administrative actions on ingestion system
 */
export async function POST(request: Request) {
  try {
    const { action, ...params } = await request.json()

    switch (action) {
      case 'restart':
        // Only allow in development
        if (process.env.NODE_ENV !== 'production') {
          const { startIngestion, stopIngestion } = await import('@/lib/ingest/ingestor')
          stopIngestion()
          await new Promise(resolve => setTimeout(resolve, 1000))
          await startIngestion()
          
          return NextResponse.json({
            status: 'success',
            message: 'Ingestion restarted',
            timestamp: new Date().toISOString()
          })
        } else {
          return NextResponse.json({
            status: 'error',
            message: 'Restart not allowed in production'
          }, { status: 403 })
        }

      case 'clear-caches':
        // Only allow in development
        if (process.env.NODE_ENV !== 'production') {
          // Access global debug interface
          const globalStats = (global as any).__ingest_stats__
          const recognitionCache = (global as any).__recognition_cache__
          
          if (recognitionCache) {
            recognitionCache.clear()
          }
          
          return NextResponse.json({
            status: 'success',
            message: 'Recognition cache cleared',
            timestamp: new Date().toISOString()
          })
        } else {
          return NextResponse.json({
            status: 'error',
            message: 'Cache clearing not allowed in production'
          }, { status: 403 })
        }

      case 'stats':
        const currentStats = getIngestionStats()
        return NextResponse.json({
          status: 'success',
          data: currentStats,
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json({
          status: 'error',
          message: `Unknown action: ${action}`,
          availableActions: ['restart', 'clear-caches', 'stats']
        }, { status: 400 })
    }

  } catch (error) {
    console.error('[Ingestion Health API] POST error:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to execute action',
      error: String(error)
    }, { status: 500 })
  }
}