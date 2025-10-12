/**
 * Dependency checker for ingestion prerequisites
 * Validates environment, connectivity, and configuration before starting ingestion
 */

import { MIRROR_REST, TOPICS, HCS_ENABLED, TOPIC } from '@/lib/env'

/**
 * Ensure all dependencies are ready before starting ingestion
 * Throws descriptive errors if any prerequisite is missing
 */
export async function ensureDeps(): Promise<void> {
  // 1. Check HCS is enabled
  if (!HCS_ENABLED) {
    throw new Error('HCS_ENABLED is false - check NEXT_PUBLIC_HCS_ENABLED environment variable')
  }

  // 2. Check Mirror REST URL
  const restUrl = MIRROR_REST
  if (!restUrl) {
    throw new Error('MIRROR_REST URL is missing - check NEXT_PUBLIC_MIRROR_NODE_URL')
  }

  // 3. Check all required topics are configured
  const requiredTopics = [TOPIC.contacts, TOPIC.trust, TOPIC.profile, TOPIC.feed, TOPIC.recognition]
  const missingTopics = requiredTopics.filter((topic, i) => !topic)
  
  if (missingTopics.length > 0) {
    const topicNames = ['contacts', 'trust', 'profile', 'feed', 'recognition']
    const missing = topicNames.filter((_, i) => !requiredTopics[i])
    throw new Error(`Missing HCS topics: ${missing.join(', ')} - check NEXT_PUBLIC_TOPIC_* environment variables`)
  }

  // 4. Ping Mirror Node to verify connectivity
  console.log(`[Deps] Pinging Mirror Node: ${restUrl}`)
  
  try {
    const response = await fetch(`${restUrl}/network/nodes`, { 
      cache: 'no-store',
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })
    
    if (!response.ok) {
      throw new Error(`Mirror Node ping failed: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    if (!data.nodes || !Array.isArray(data.nodes)) {
      throw new Error('Mirror Node returned invalid network/nodes response')
    }
    
    console.log(`[Deps] ✅ Mirror Node healthy (${data.nodes.length} nodes)`)
    
  } catch (error: any) {
    if (error.name === 'TimeoutError') {
      throw new Error(`Mirror Node ping timeout after 10s: ${restUrl}`)
    }
    throw new Error(`Mirror Node connectivity failed: ${error.message}`)
  }

  // 5. Log final validation
  console.log(`[Deps] ✅ All dependencies ready:`, {
    hcsEnabled: HCS_ENABLED,
    mirrorRest: restUrl,
    topics: {
      contacts: TOPIC.contacts,
      trust: TOPIC.trust, 
      profile: TOPIC.profile,
      feed: TOPIC.feed,
      recognition: TOPIC.recognition
    }
  })
}