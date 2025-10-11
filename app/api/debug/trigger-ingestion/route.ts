import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('[TriggerIngestion] Manual ingestion trigger requested...')
    
    // Import the ingestion system dynamically to avoid SSR issues
    const { startIngestion, getIngestionStats, stopIngestion } = await import('@/lib/ingest/ingestor')
    const { HCS_ENABLED } = await import('@/lib/env')
    
    if (!HCS_ENABLED) {
      return NextResponse.json({
        success: false,
        message: 'HCS is disabled',
        hcsEnabled: HCS_ENABLED
      }, { status: 400 })
    }
    
    // Check if we should restart or just start
    const currentStats = getIngestionStats()
    const shouldRestart = currentStats.isRunning
    
    if (shouldRestart) {
      console.log('[TriggerIngestion] Stopping existing ingestion...')
      stopIngestion()
      
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    console.log('[TriggerIngestion] Starting ingestion...')
    await startIngestion()
    
    // Give it a moment to initialize
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Get updated stats
    const finalStats = getIngestionStats()
    
    console.log('[TriggerIngestion] Ingestion triggered successfully:', {
      wasRestarted: shouldRestart,
      isRunning: finalStats.isRunning,
      connections: finalStats.activeConnections,
      totalMessages: finalStats.totalMessages
    })
    
    return NextResponse.json({
      success: true,
      message: shouldRestart ? 'Ingestion restarted successfully' : 'Ingestion started successfully',
      stats: finalStats,
      actions: {
        wasRestarted: shouldRestart,
        isRunning: finalStats.isRunning,
        activeConnections: finalStats.activeConnections
      }
    })
    
  } catch (error) {
    console.error('[TriggerIngestion] Failed to trigger ingestion:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}