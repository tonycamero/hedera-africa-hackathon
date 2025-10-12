import { NextResponse } from 'next/server'
import { ensureIngestion, getIngestState, resetIngestState } from '@/lib/ingest/supervisor'
import { startIngestion } from '@/lib/ingest/restBasedIngestor'
import { ensureDeps } from '@/lib/services/ingestion/depsReady'
import '@/lib/runtime/crash-guards'
// Force reload for REST-based ingestor

export async function POST() {
  try {
    console.log('🚑 [Admin] Manual ingestion startup requested (crash-proof version)...')
    
    // Get current status
    const initialState = getIngestState()
    console.log('🚑 [Admin] Initial state:', initialState)
    
    if (initialState.running) {
      return NextResponse.json({
        success: true,
        message: 'Ingestion already running',
        state: initialState
      })
    }

    if (initialState.starting) {
      return NextResponse.json({
        success: false,
        message: 'Ingestion startup already in progress',
        state: initialState
      }, { status: 409 })
    }

    // First ensure dependencies are ready (with timeout)
    console.log('🚑 [Admin] Checking dependencies...')
    try {
      await Promise.race([
        ensureDeps(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Dependency check timeout')), 10000))
      ])
    } catch (error: any) {
      console.error('🚑 [Admin] Dependency check failed:', error.message)
      return NextResponse.json({
        success: false,
        error: `Dependency check failed: ${error.message}`,
        state: getIngestState()
      }, { status: 500 })
    }
    
    // Start the crash-proof supervisor (non-blocking)
    console.log('🚑 [Admin] Starting crash-proof supervisor (async)...')
    
    // Don't await - let it run in background with retries
    ensureIngestion(startIngestion).catch(error => {
      console.error('🚑 [Admin] Background ingestion start failed:', error)
    })
    
    // Return immediately with current state
    const currentState = getIngestState()
    
    return NextResponse.json({
      success: true,
      message: 'Ingestion startup initiated with crash-proof supervisor (check status with GET)',
      state: currentState,
      note: 'Supervisor will retry automatically on failures. Use GET to check progress.'
    })
    
  } catch (error: any) {
    console.error('🚑 [Admin] Failed to start ingestion:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      state: getIngestState()
    }, { status: 500 })
  }
}

export async function GET() {
  const state = getIngestState()
  return NextResponse.json({
    success: true,
    message: 'Ingestion state (crash-proof supervisor)',
    state
  })
}

export async function DELETE() {
  try {
    console.log('🚑 [Admin] Resetting ingestion state for development...')
    resetIngestState()
    
    return NextResponse.json({
      success: true,
      message: 'Ingestion state reset successfully',
      state: getIngestState()
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
