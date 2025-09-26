import { NextResponse } from 'next/server'
import { signalsStore } from '@/lib/stores/signalsStore'

export async function GET() {
  try {
    console.log('🐛 Debug: Checking SignalsStore state...')
    
    // Get store state by calling the store methods directly
    // Note: These methods exist on the client-side store
    const sessionId = 'tm-alex-chen' // Known session ID for testing
    
    return NextResponse.json({
      success: true,
      message: 'SignalsStore debug endpoint',
      timestamp: new Date().toISOString(),
      notes: [
        'SignalsStore is a client-side store',
        'This endpoint cannot directly access the store state',
        'Check browser console for actual store data',
        'Use browser DevTools to inspect: signalsStore.getAllSignals()',
        'Store methods: getBondedContacts(), getTrustStats(), etc.'
      ],
      instructions: {
        browserConsole: [
          'signalsStore.getAllSignals()',
          'signalsStore.getBondedContacts("tm-alex-chen")', 
          'signalsStore.getTrustStats("tm-alex-chen")',
          'signalsStore.getRecognitionSignals("tm-alex-chen")'
        ]
      }
    })
    
  } catch (error) {
    console.error('🐛 Debug: Store check failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}