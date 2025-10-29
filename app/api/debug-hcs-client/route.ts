// app/api/debug-hcs-client/route.ts
import { NextResponse } from "next/server"
import { topics } from '@/lib/registry/serverRegistry'

export async function GET() {
  try {
    const topicRegistry = topics()
    
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
        NODE_ENV: process.env.NODE_ENV,
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
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}