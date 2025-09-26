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

// Helper function to clean environment variables of whitespace/newlines
const clean = (value?: string) => (value || '').trim();

const FALLBACK: RegistryTopics = {
  feed: clean(process.env.NEXT_PUBLIC_TOPIC_SIGNAL), // Using signal topic as feed
  contacts: clean(process.env.NEXT_PUBLIC_TOPIC_CONTACT),
  trust: clean(process.env.NEXT_PUBLIC_TOPIC_TRUST),
  profile: clean(process.env.NEXT_PUBLIC_TOPIC_PROFILE),
  system: clean(process.env.NEXT_PUBLIC_TOPIC_SIGNAL), // Using signal topic as system
  recognition: clean(process.env.NEXT_PUBLIC_TOPIC_RECOGNITION),
  recognitionDefinitions: clean(process.env.NEXT_PUBLIC_TOPIC_RECOGNITION),
  recognitionInstances: clean(process.env.NEXT_PUBLIC_TOPIC_RECOGNITION),
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