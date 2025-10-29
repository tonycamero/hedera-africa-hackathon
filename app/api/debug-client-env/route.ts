import { NextResponse } from 'next/server'
import { topics } from '@/lib/registry/serverRegistry'

export async function GET() {
  try {
    console.log('🐛 Debug: Checking client-side environment variables...')
    
    const topicRegistry = topics()
    
    // Show both raw env vars and validated registry
    const clientEnvs = {
      NEXT_PUBLIC_TOPIC_PROFILE: process.env.NEXT_PUBLIC_TOPIC_PROFILE,
      NEXT_PUBLIC_TOPIC_CONTACT: process.env.NEXT_PUBLIC_TOPIC_CONTACT,
      NEXT_PUBLIC_TOPIC_TRUST: process.env.NEXT_PUBLIC_TOPIC_TRUST,
      NEXT_PUBLIC_TOPIC_RECOGNITION: process.env.NEXT_PUBLIC_TOPIC_RECOGNITION,
      NEXT_PUBLIC_TOPIC_SIGNAL: process.env.NEXT_PUBLIC_TOPIC_SIGNAL,
      NEXT_PUBLIC_MIRROR_NODE_URL: process.env.NEXT_PUBLIC_MIRROR_NODE_URL,
      NEXT_PUBLIC_MIRROR_NODE_WS: process.env.NEXT_PUBLIC_MIRROR_NODE_WS,
      NEXT_PUBLIC_HCS_ENABLED: process.env.NEXT_PUBLIC_HCS_ENABLED,
    }
    
    // Check which are undefined (missing at build time)
    const missing = Object.entries(clientEnvs)
      .filter(([key, value]) => !value)
      .map(([key]) => key)
    
    const available = Object.entries(clientEnvs)
      .filter(([key, value]) => value)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
    
    console.log('🐛 Available client envs:', available)
    console.log('🐛 Missing client envs:', missing)
    
    return NextResponse.json({
      success: true,
      available,
      missing,
      registry: topicRegistry,
      totalCount: Object.keys(clientEnvs).length,
      availableCount: Object.keys(available).length,
      missingCount: missing.length,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('🐛 Debug: Client env check failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}