import { NextRequest, NextResponse } from 'next/server'
import { initializeMirrorWithStore } from '@/lib/services/MirrorToStore'
import { signalsStore } from '@/lib/stores/signalsStore'

export async function POST(request: NextRequest) {
  try {
    console.log('[Debug Backfill] Starting manual Mirror Node backfill...')
    
    // Get store state before
    const beforeSignals = signalsStore.getAllSignals().length
    
    // Test direct Mirror Node fetch first
    const { backfillFromRest } = await import('@/lib/services/MirrorBackfill')
    const { TOPIC } = await import('@/lib/env')
    
    console.log('[Debug Backfill] Testing direct Mirror Node fetch...')
    const testResults = await Promise.allSettled([
      backfillFromRest(TOPIC.contacts || '0.0.6896005', 10),
      backfillFromRest(TOPIC.trust || '0.0.6896005', 10)
    ])
    
    const mirrorMessages = testResults
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .flatMap(result => result.value)
    
    console.log(`[Debug Backfill] Mirror Node returned ${mirrorMessages.length} messages`)
    
    // Test message processing
    let processedCount = 0
    const processingErrors: string[] = []
    
    for (const message of mirrorMessages.slice(0, 5)) {
      try {
        const parsed = JSON.parse(message.decoded)
        console.log(`[Debug Backfill] Processing message: ${parsed.type} from ${parsed.actor || parsed.from}`)
        processedCount++
      } catch (error: any) {
        processingErrors.push(`${message.topicId}:${message.sequenceNumber} - ${error.message}`)
      }
    }
    
    // Now try the full Mirror with Store integration
    const cleanup = await initializeMirrorWithStore()
    
    // Wait a moment for backfill to complete
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Get store state after
    const afterSignals = signalsStore.getAllSignals().length
    const sampleSignals = signalsStore.getAllSignals().slice(0, 3).map(s => ({
      id: s.id,
      type: s.type,
      class: s.class,
      actors: s.actors,
      ts: new Date(s.ts).toISOString()
    }))
    
    return NextResponse.json({
      success: true,
      mirror: {
        messagesFetched: mirrorMessages.length,
        messagesProcessed: processedCount,
        processingErrors
      },
      backfill: {
        signalsBefore: beforeSignals,
        signalsAfter: afterSignals,
        signalsAdded: afterSignals - beforeSignals
      },
      sampleSignals,
      sampleMirrorMessages: mirrorMessages.slice(0, 2).map(m => ({
        topicId: m.topicId,
        sequence: m.sequenceNumber,
        decoded: m.decoded.substring(0, 200)
      })),
      message: 'Manual backfill completed'
    })
    
  } catch (error: any) {
    console.error('[Debug Backfill] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}