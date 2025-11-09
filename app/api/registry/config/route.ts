import { NextResponse } from 'next/server'
import { topics } from '@/lib/registry/serverRegistry'

// Force dynamic rendering and disable caching for development
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET() {
  try {
    const topicRegistry = topics()
    
    console.log('[Registry Config API] Serving validated topic registry')
    
    // Return full registry config structure
    return NextResponse.json({
      ok: true,
      registry: {
        env: process.env.NODE_ENV || 'development',
        topics: topicRegistry,
        mirror: {
          rest: process.env.NEXT_PUBLIC_MIRROR_REST_URL || 'https://mainnet.mirrornode.hedera.com/api/v1',
          ws: process.env.NEXT_PUBLIC_MIRROR_WS_URL || 'wss://mainnet.mirrornode.hedera.com'
        },
        flags: {
          enableRecognitionOverlays: true,
          enableCulturalLayers: true
        }
      },
      meta: {
        source: 'environment',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
      }
    }, {
      headers: { 
        // For development: no cache
        // For production: short cache with stale-while-revalidate
        'Cache-Control': process.env.NODE_ENV === 'production' 
          ? 's-maxage=30, stale-while-revalidate=600'
          : 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json'
      }
    })
  } catch (error: any) {
    console.error('[Registry Config API] Failed to serve registry:', error)
    return NextResponse.json(
      { 
        ok: false, 
        error: error.message || 'Failed to load registry configuration',
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
