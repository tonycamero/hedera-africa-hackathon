import { NextResponse } from 'next/server'
import { getRegistry, getRegistrySource, getAllTopicIds, getTopicId } from '@/lib/registry/serverRegistry'

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET() {
  try {
    const registry = getRegistry()
    const source = getRegistrySource()
    const allTopics = getAllTopicIds()
    
    // Build comprehensive topic map with legacy compatibility
    const topics = {
      // Primary topics
      contacts: getTopicId('contacts'),
      trust: getTopicId('trust'),
      profile: getTopicId('profile'),
      recognition: getTopicId('recognition'),
      
      // Legacy aliases for backward compatibility
      feed: getTopicId('recognition'), // Feed uses recognition topic
      system: getTopicId('profile'),   // System uses profile topic
      
      // Recognition sub-topics (if configured)
      recognitionDefinitions: allTopics.recognition_definitions || getTopicId('recognition'),
      recognitionInstances: allTopics.recognition_instances || getTopicId('recognition')
    }
    
    console.log(`[Registry Topics API] Serving topics from ${source}:`, {
      contacts: topics.contacts,
      trust: topics.trust,
      profile: topics.profile,
      recognition: topics.recognition
    })
    
    return NextResponse.json({
      ok: true,
      topics,
      meta: {
        source,
        timestamp: new Date().toISOString(),
        sharedContactsTrust: registry.flags.SHARED_CONTACTS_TRUST_TOPIC
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
        fallback: 'Check registry configuration'
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
