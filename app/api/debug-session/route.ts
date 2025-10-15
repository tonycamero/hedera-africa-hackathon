import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🐛 Debug: Checking session consistency...')
    
    // Get server-side session ID
    const { getSessionId } = await import('@/lib/session')
    const serverSessionId = getSessionId()
    
    console.log('🐛 Server session ID:', serverSessionId)
    
    return NextResponse.json({
      success: true,
      serverSessionId,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('🐛 Debug: Session check failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}