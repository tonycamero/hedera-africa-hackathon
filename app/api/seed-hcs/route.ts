import { NextResponse } from 'next/server'
import { hcsFeedService } from '@/lib/services/HCSFeedService'

export async function GET() {
  try {
    console.log('🚀 Manual HCS seeding requested...')
    
    // Check current state
    const isReady = hcsFeedService.isReady()
    const isInitializing = hcsFeedService.isInitializingService()
    
    if (!isReady && !isInitializing) {
      console.log('📡 Initializing HCS Feed Service...')
      await hcsFeedService.initialize()
    }
    
    // Get topic IDs
    const topicIds = hcsFeedService.getTopicIds()
    
    // Get current session (should be Alex Chen)
    const { getSessionId } = await import('@/lib/session')
    const sessionId = getSessionId()
    
    console.log('🔥 Current session:', sessionId)
    console.log('📋 Topic IDs:', topicIds)
    
    return NextResponse.json({
      success: true,
      sessionId,
      isReady: hcsFeedService.isReady(),
      isInitializing: hcsFeedService.isInitializingService(),
      topics: topicIds,
      message: `HCS Feed Service status - Session: ${sessionId}`,
      hashScanUrls: {
        contacts: topicIds.contacts ? `https://hashscan.io/testnet/topic/${topicIds.contacts}` : null,
        trust: topicIds.trust ? `https://hashscan.io/testnet/topic/${topicIds.trust}` : null,
        recognition: topicIds.recognition ? `https://hashscan.io/testnet/topic/${topicIds.recognition}` : null,
      }
    })
    
  } catch (error) {
    console.error('❌ HCS seeding check failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    console.log('🔥 FIRE-AND-FORGET: Manual HCS seeding triggered...')
    
    // FIRE-AND-FORGET: Start initialization without waiting for it
    const initPromise = hcsFeedService.initialize()
    
    // Start seed mode in parallel without waiting
    const seedPromise = hcsFeedService.enableSeedMode()
    
    // Get current topic IDs (may be empty initially)
    const topicIds = hcsFeedService.getTopicIds()
    const { getSessionId } = await import('@/lib/session')
    const sessionId = getSessionId()
    
    // Return immediately without waiting for the async processes
    return NextResponse.json({
      success: true,
      message: '🔥 Alex Chen demo network seeding started (FIRE-AND-FORGET)! Initialization and seeding processes have been launched in the background.',
      sessionId,
      topics: topicIds,
      mode: 'fire-and-forget',
      status: 'background-processing',
      note: 'Topics are being created on Hedera testnet and demo data will be seeded automatically. Check back in 1-2 minutes for populated data.',
      hashScanUrls: topicIds.contacts ? {
        contacts: `https://hashscan.io/testnet/topic/${topicIds.contacts}`,
        trust: `https://hashscan.io/testnet/topic/${topicIds.trust}`,
        recognition: `https://hashscan.io/testnet/topic/${topicIds.recognition}`,
      } : null
    })
    
  } catch (error) {
    console.error('❌ Manual HCS seeding failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}