// app/api/debug-hcs-client/route.ts
import { NextResponse } from "next/server"
import { HCS_ENABLED, MIRROR_REST, TOPIC } from "@/lib/env"

export async function GET() {
  try {
    return NextResponse.json({
      status: 'info',
      message: 'Server-side debugging not available - signals store is client-side only',
      timestamp: new Date().toISOString(),
      recommendations: [
        'Open browser console at localhost:3000',
        'Run: window.signalsStore.getSummary()',
        'Run: window.signalsStore.getAll()',
        'Run: window.trustmeshIngest?.stats() (if HCS client is running)'
      ],
      environment: {
        HCS_ENABLED: process.env.NEXT_PUBLIC_HCS_ENABLED,
        DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
        NODE_ENV: process.env.NODE_ENV,
        topics: {
          profile: process.env.NEXT_PUBLIC_TOPIC_PROFILE,
          contacts: process.env.NEXT_PUBLIC_TOPIC_CONTACT,
          trust: process.env.NEXT_PUBLIC_TOPIC_TRUST,
          recognition: process.env.NEXT_PUBLIC_TOPIC_RECOGNITION,
          signal: process.env.NEXT_PUBLIC_TOPIC_SIGNAL
        }
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}