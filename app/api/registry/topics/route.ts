import { NextResponse } from 'next/server'
import { getRegistryTopics } from '@/lib/hcs2/registry'

export async function GET() {
  try {
    const topics = await getRegistryTopics()
    
    return NextResponse.json({
      ok: true,
      topics: {
        feed: topics.feed,
        contacts: topics.contacts,
        trust: topics.trust,
        recognition: topics.recognition,
        recognitionDefinitions: topics.recognitionDefinitions,
        recognitionInstances: topics.recognitionInstances,
        profile: topics.profile,
        system: topics.system
      }
    })
  } catch (error: any) {
    console.error('[Registry API] Failed to get topics:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to get registry topics' },
      { status: 500 }
    )
  }
}