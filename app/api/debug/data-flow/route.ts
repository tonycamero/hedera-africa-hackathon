import { NextRequest, NextResponse } from 'next/server'
import { signalsStore } from '@/lib/stores/signalsStore'
import { topics } from '@/lib/registry/serverRegistry'

export async function GET(request: NextRequest) {
  try {
    // Check signalsStore state (server-side safe)
    let storeSummary: any = null
    let allSignals: any[] = []
    
    try {
      if (typeof (signalsStore as any).getSummary === 'function') {
        storeSummary = (signalsStore as any).getSummary()
      }
      if (typeof (signalsStore as any).getAll === 'function') {
        allSignals = (signalsStore as any).getAll()
      }
    } catch (storeError) {
      console.warn('SignalsStore access error:', storeError)
    }
    
    // Get ingestion status - not available server-side
    const ingestionStatus = 'server: use window.trustmeshIngest in browser console'
    
    const topicRegistry = topics()
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: {
        HCS_ENABLED: process.env.NEXT_PUBLIC_HCS_ENABLED,
        MIRROR_REST: process.env.NEXT_PUBLIC_MIRROR_NODE_URL,
        TOPICS: {
          profile: topicRegistry.profile,
          contacts: topicRegistry.contacts,
          trust: topicRegistry.trust,
          recognition: topicRegistry.recognition,
          signal: topicRegistry.signal,
          system: topicRegistry.system
        }
      },
      store: {
        summary: storeSummary,
        totalEvents: allSignals.length,
        sampleEvents: allSignals.slice(0, 5).map(e => ({
          id: e.id,
          type: e.type,
          actor: e.actor,
          timestamp: e.ts || e.timestamp,
          source: e.source
        }))
      },
      ingestion: ingestionStatus,
      dataFlow: {
        hasStoreData: allSignals.length > 0,
        storeInitialized: !!signalsStore,
        latestEventTimestamp: allSignals.length > 0 ? 
          Math.max(...allSignals.map(e => e.ts || e.timestamp || 0)) : null
      }
    })
  } catch (error) {
    console.error('Data flow debug error:', error)
    return NextResponse.json({
      error: 'Failed to get data flow status',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}