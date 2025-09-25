type RegistryTopics = {
  feed?: string
  contacts?: string
  trust?: string
  recognition?: string
  profile?: string
  system?: string
  recognitionDefinitions?: string
  recognitionInstances?: string
}

const FALLBACK: RegistryTopics = {
  feed: process.env.NEXT_PUBLIC_TOPIC_SIGNAL, // Using signal topic as feed
  contacts: process.env.NEXT_PUBLIC_TOPIC_CONTACT,
  trust: process.env.NEXT_PUBLIC_TOPIC_TRUST,
  profile: process.env.NEXT_PUBLIC_TOPIC_PROFILE,
  system: process.env.NEXT_PUBLIC_TOPIC_SIGNAL, // Using signal topic as system
  recognition: process.env.NEXT_PUBLIC_TOPIC_RECOGNITION,
  recognitionDefinitions: process.env.NEXT_PUBLIC_TOPIC_RECOGNITION,
  recognitionInstances: process.env.NEXT_PUBLIC_TOPIC_RECOGNITION,
}

let cached: RegistryTopics | null = null
let lastFetch = 0

export async function getRegistryTopics(): Promise<RegistryTopics> {
  const TTL = 30_000
  const now = Date.now()
  if (cached && now - lastFetch < TTL) return cached

  const regId = process.env.NEXT_PUBLIC_TRUSTMESH_REGISTRY_ID
  if (!regId) {
    cached = FALLBACK
    lastFetch = now
    return cached
  }

  try {
    // TODO: Implement full Mirror read for registry snapshot (expand later)
    // For now, use fallback; log warning
    console.warn('Using fallback topics; implement registry read')
    cached = FALLBACK
  } catch {
    cached = FALLBACK
  }
  lastFetch = now
  return cached
}

export type { RegistryTopics }