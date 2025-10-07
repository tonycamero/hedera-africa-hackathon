import { NextRequest, NextResponse } from 'next/server'
import { signalsStore } from '@/lib/stores/signalsStore'

export async function POST(request: NextRequest) {
  try {
    console.log('[Manual Load] Fetching HCS data manually...')
    
    // 1) Fetch some real HCS messages from mirror node
    const topicId = '0.0.6896008' // Profile topic with data
    const mirrorUrl = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages?limit=10`
    
    const response = await fetch(mirrorUrl)
    const data = await response.json()
    
    if (!data.messages || data.messages.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No HCS messages found',
        topicId
      })
    }
    
    console.log(`[Manual Load] Found ${data.messages.length} messages from topic ${topicId}`)
    
    // 2) Convert to SignalEvent format manually for testing
    const testSignals = data.messages.map((msg: any, index: number) => {
      // Decode the base64 message
      let decodedPayload = {}
      try {
        const decoded = atob(msg.message)
        decodedPayload = JSON.parse(decoded)
      } catch (e) {
        decodedPayload = { raw: msg.message }
      }
      
      // Create a compatible SignalEvent
      return {
        id: `manual_${msg.topic_id}_${msg.sequence_number}`,
        type: 'PROFILE_UPDATE',
        actor: '0.0.5864559', // Our operator account
        target: undefined,
        ts: Math.floor(parseFloat(msg.consensus_timestamp.replace('.', '')) / 1000000), // Convert nanoseconds to ms
        topicId: msg.topic_id,
        metadata: decodedPayload,
        source: 'hcs-cached' as const
      }
    })
    
    // 3) Add to store
    console.log('[Manual Load] Adding signals to store...')
    testSignals.forEach(signal => {
      signalsStore.add(signal)
    })
    
    // 4) Verify store state
    const summary = signalsStore.getSummary()
    const allSignals = signalsStore.getAll()
    
    return NextResponse.json({
      success: true,
      message: 'Successfully loaded HCS data into store',
      data: {
        fetched: data.messages.length,
        processed: testSignals.length,
        storeTotal: allSignals.length,
        storeSummary: summary,
        sampleSignal: testSignals[0] || null
      }
    })
    
  } catch (error) {
    console.error('[Manual Load] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}