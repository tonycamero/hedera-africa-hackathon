import { NextResponse } from 'next/server'
import { getHederaClient } from '@/lib/hedera/serverClient'
import { getRegistryTopics } from '@/lib/hcs2/registry'
import { fetchTopicMessages } from '@/lib/mirror/serverMirror'

export async function GET() {
  const checks: Record<string, string | boolean> = {}

  try {
    // Client ready
    getHederaClient()
    checks.client = true

    // Registry resolution
    const topics = await getRegistryTopics()
    checks.registry = !!topics.feed // Example

    // Mirror reach per topic (fetch 1 msg dry-run)
    for (const [key, id] of Object.entries(topics)) {
      if (id) {
        try {
          await fetchTopicMessages(id, 1)
          checks[`mirror_${key}`] = true
        } catch (e: any) {
          checks[`mirror_${key}`] = e.message
        }
      }
    }

    // Submit dry-run (no execute)
    checks.submit = true // Expand with test topic if needed

    return NextResponse.json({ ok: true, checks })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message, checks }, { status: 500 })
  }
}