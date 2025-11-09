import { NextResponse } from 'next/server'
import { topics } from '@/lib/registry/serverRegistry'

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET() {
  try {
    const topicRegistry = topics()
    
    console.log('[Registry Topics API] Serving validated topics:', {
      contacts: topicRegistry.contacts,
      trust: topicRegistry.trust,
      profile: topicRegistry.profile,
      recognition: topicRegistry.recognition,
      signal: topicRegistry.signal,
      system: topicRegistry.system
    })
    
    return NextResponse.json({
      ok: true,
      topics: topicRegistry,
      meta: {
        source: 'environment',
        timestamp: new Date().toISOString()
      }
    }, {
      headers: { 
        'Cache-Control': process.env.NODE_ENV === 'production'
          ? 's-maxage=30, stale-while-revalidate=300'
          : 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json'
      }
    })
  } catch (error: any) {
    console.error('[Registry Topics API] Failed to get topics:', error)
    return NextResponse.json(
      { 
        ok: false, 
        error: error.message || 'Failed to get registry topics',
        fallback: 'Check NEXT_PUBLIC_TOPIC_* environment variables'
      },
      { 
        status: 500,
        headers: { 
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      }
    )
  }
}
