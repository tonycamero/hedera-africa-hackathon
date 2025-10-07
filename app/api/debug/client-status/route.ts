import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
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
      DEMO_SEED: process.env.NEXT_PUBLIC_DEMO_SEED,
      DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
      topics: {
        profile: process.env.NEXT_PUBLIC_TOPIC_PROFILE,
        contacts: process.env.NEXT_PUBLIC_TOPIC_CONTACT,
        trust: process.env.NEXT_PUBLIC_TOPIC_TRUST,
        recognition: process.env.NEXT_PUBLIC_TOPIC_RECOGNITION,
        signal: process.env.NEXT_PUBLIC_TOPIC_SIGNAL
      }
    }
  })
}