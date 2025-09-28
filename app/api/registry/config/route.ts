import { NextResponse } from 'next/server'
import { getRegistry, getRegistrySource, validateRegistry } from '@/lib/registry/serverRegistry'

// Force dynamic rendering and disable caching for development
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET() {
  try {
    const registry = getRegistry()
    const source = getRegistrySource()
    
    // Validate the registry before serving
    const validation = validateRegistry(registry)
    if (!validation.valid) {
      console.error('[Registry Config API] Invalid registry:', validation.errors)
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Invalid registry configuration',
          details: validation.errors
        },
        { status: 500 }
      )
    }
    
    console.log(`[Registry Config API] Serving registry from ${source}`)
    
    return NextResponse.json({
      ok: true,
      registry,
      meta: {
        source,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
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
        fallback: 'Check environment variables or registry source'
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