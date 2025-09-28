// app/api/debug-hcs-client/route.ts
import { NextResponse } from "next/server"
import { HCS_ENABLED, MIRROR_REST, TOPIC } from "@/lib/env"

export async function GET() {
  try {
    // Import store from server side
    const { signalsStore } = await import('@/lib/stores/signalsStore')
    
    // Get current store state
    const allSignals = signalsStore.getAllSignals()
    const signalsByClass = {
      contact: allSignals.filter(s => s.class === 'contact').length,
      trust: allSignals.filter(s => s.class === 'trust').length,
      recognition: allSignals.filter(s => s.class === 'recognition').length,
      system: allSignals.filter(s => s.class === 'system').length
    }
    
    // Check environment
    const environment = {
      HCS_ENABLED,
      MIRROR_REST,
      TOPIC,
      NODE_ENV: process.env.NODE_ENV
    }
    
    // Check if MirrorToStore would work
    let mirrorStatus = 'unknown'
    try {
      const { backfillFromRest } = await import('@/lib/services/MirrorBackfill')
      
      if (TOPIC.contacts) {
        const testMessages = await backfillFromRest(TOPIC.contacts, 1)
        mirrorStatus = `Can fetch Mirror Node data: ${testMessages.length} messages found`
      } else {
        mirrorStatus = 'No contacts topic configured'
      }
    } catch (error) {
      mirrorStatus = `Mirror fetch failed: ${error.message}`
    }
    
    // Get samples of signals in store
    const sampleSignals = allSignals.slice(0, 5).map(s => ({
      id: s.id,
      type: s.type,
      class: s.class,
      actors: s.actors,
      ts: new Date(s.ts).toISOString(),
      status: s.status
    }))
    
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      environment,
      signalsStore: {
        totalSignals: allSignals.length,
        signalsByClass,
        sampleSignals,
        lastSignalTime: allSignals.length > 0 ? new Date(Math.max(...allSignals.map(s => s.ts))).toISOString() : null
      },
      mirrorStatus,
      analysis: {
        hcsEnabled: HCS_ENABLED,
        hasTopics: !!(TOPIC.contacts && TOPIC.trust),
        storageIssue: allSignals.length === 0 ? 'Store is empty - BootHCSClient may not be running' : 'Store has data',
        recommendation: allSignals.length === 0 ? 
          'Check browser console for BootHCSClient errors. Verify HCS_ENABLED=true and topics are configured.' :
          'Store is populated correctly'
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}