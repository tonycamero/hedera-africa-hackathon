import { NextRequest, NextResponse } from 'next/server'
import { hcsFeedService } from '@/lib/services/HCSFeedService'

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 Manual demo seeding requested via API...')
    
    // Force initialize and seed HCS data
    await hcsFeedService.initialize()
    
    // Check if seeding is enabled
    const topicIds = hcsFeedService.getTopicIds()
    console.log('✅ HCS Topics:', topicIds)
    
    if (!hcsFeedService.isReady()) {
      throw new Error('HCS Feed Service not ready - topics not initialized')
    }
    
    // Enable seed mode (this will trigger comprehensive demo seeding)
    console.log('🌐 Triggering comprehensive demo data seeding...')
    await hcsFeedService.enableSeedMode()
    
    // Wait for propagation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return NextResponse.json({
      success: true,
      message: 'Alex Chen demo network seeded to Hedera testnet!',
      topics: topicIds,
      hashScanUrls: {
        profile: `https://hashscan.io/testnet/topic/${topicIds.profile}`,
        contacts: `https://hashscan.io/testnet/topic/${topicIds.contacts}`,
        trust: `https://hashscan.io/testnet/topic/${topicIds.trust}`,
        recognition: `https://hashscan.io/testnet/topic/${topicIds.recognition}`,
        system: `https://hashscan.io/testnet/topic/${topicIds.system}`
      },
      alexProfile: {
        id: 'tm-alex-chen',
        handle: '@alex.chen', 
        displayName: 'Alex Chen',
        bio: 'CS Senior • React & Blockchain • Coffee enthusiast ☕',
        bondedContacts: ['tm-maya-patel', 'tm-jordan-kim', 'tm-sam-rivera'],
        trustAllocated: {
          'tm-maya-patel': 3,
          'tm-jordan-kim': 2, 
          'tm-sam-rivera': 1
        },
        totalTrustAllocated: 6
      }
    })
    
  } catch (error) {
    console.error('❌ Demo seeding failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get current state
    const isReady = hcsFeedService.isReady()
    const topicIds = hcsFeedService.getTopicIds()
    
    return NextResponse.json({
      ready: isReady,
      topics: topicIds,
      message: isReady 
        ? 'HCS Feed Service is ready' 
        : 'HCS Feed Service not ready - call POST to initialize and seed'
    })
    
  } catch (error) {
    return NextResponse.json({
      ready: false,
      error: error.message
    })
  }
}