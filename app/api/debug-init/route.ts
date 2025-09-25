import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🐛 Debug: Starting quick test...')
    
    // Test basic response without any HCS calls
    return NextResponse.json({
      success: true,
      message: '🐛 Debug: Basic response works!',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('🐛 Debug: Failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    console.log('🐛 Debug: Testing HCS service initialization...')
    
    // Test importing the service without calling it
    const { hcsFeedService } = await import('@/lib/services/HCSFeedService')
    
    console.log('🐛 Debug: Service imported, starting initialization...')
    const startTime = Date.now()
    
    // Start initialization but don't wait for it - fire and forget
    const initPromise = hcsFeedService.initialize()
    
    // Return immediately without waiting
    console.log('🐛 Debug: Initialize called, returning immediately...')
    
    return NextResponse.json({
      success: true,
      message: '🐛 Debug: Initialization started (fire-and-forget)',
      timeTaken: Date.now() - startTime,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('🐛 Debug: Failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
