import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🐛 Debug: Checking HCS feed data...')
    
    const { hcsFeedService } = await import('@/lib/services/HCSFeedService')
    
    // Check service status
    const isReady = hcsFeedService.isReady()
    const isInitializing = hcsFeedService.isInitializingService()
    const topicIds = hcsFeedService.getTopicIds()
    
    console.log('🐛 Debug: Service state:', { isReady, isInitializing, topicIds })
    
    // Try to get feed events
    const events = await hcsFeedService.getAllFeedEvents()
    console.log('🐛 Debug: Retrieved events count:', events.length)
    
    return NextResponse.json({
      success: true,
      serviceState: {
        isReady,
        isInitializing,
        topicIds
      },
      events: {
        count: events.length,
        eventTypes: events.map(e => ({ type: e.type, class: e.class, status: e.status })),
        sample: events.slice(0, 3) // First 3 events for inspection
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('🐛 Debug: Feed check failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}