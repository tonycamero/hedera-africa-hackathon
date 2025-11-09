import { NextRequest, NextResponse } from 'next/server'
import { topics } from '@/lib/registry/serverRegistry'

export async function GET(request: NextRequest) {
  const topicRegistry = topics()
  
  return NextResponse.json({
    message: 'Use the browser console to check client status',
    instructions: [
      '1. Open browser console on localhost:3000',
      '2. Run: window.trustmeshIngest.stats()',
      '3. Run: window.signalsStore.getSummary()',
      '4. Run: window.signalsStore.getAll().length',
      '5. Check if ingestion is running and putting data in store'
    ],
    environment: {
      HCS_ENABLED: process.env.NEXT_PUBLIC_HCS_ENABLED,
      topics: {
        profile: topicRegistry.profile,
        contacts: topicRegistry.contacts,
        trust: topicRegistry.trust,
        recognition: topicRegistry.recognition,
        signal: topicRegistry.signal,
        system: topicRegistry.system
      }
    }
  })
}
