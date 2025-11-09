import { NextResponse } from 'next/server'
import { topics } from '@/lib/registry/serverRegistry'

/**
 * GET /api/debug/topics
 * 
 * Returns the resolved HCS topic registry for debugging
 * No secrets exposed - just topic IDs
 */
export async function GET() {
  try {
    const resolved = topics()
    
    return NextResponse.json({
      ok: true,
      topics: resolved,
      source: 'serverRegistry',
      note: 'These are the validated, frozen topic IDs from environment variables'
    })
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message || 'Failed to load registry',
      note: 'Check NEXT_PUBLIC_TOPIC_* environment variables'
    }, { status: 500 })
  }
}
