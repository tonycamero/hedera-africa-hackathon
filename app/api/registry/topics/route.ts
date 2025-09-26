import { NextResponse } from 'next/server'
import { getRegistryTopics } from '@/lib/hcs2/registry'
import { clean } from '@/lib/env'

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET() {
  try {
    const topics = await getRegistryTopics()
    
    // Clean all topic IDs to remove any CR/LF characters
    const sanitizedTopics = {
      feed: clean(topics.feed),
      contacts: clean(topics.contacts),
      trust: clean(topics.trust),
      recognition: clean(topics.recognition),
      recognitionDefinitions: clean(topics.recognitionDefinitions),
      recognitionInstances: clean(topics.recognitionInstances),
      profile: clean(topics.profile),
      system: clean(topics.system)
    }
    
    return NextResponse.json({
      ok: true,
      topics: sanitizedTopics,
      timestamp: new Date().toISOString()
    }, {
      headers: { 
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    console.error('[Registry API] Failed to get topics:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to get registry topics' },
      { 
        status: 500,
        headers: { 
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  }
}
