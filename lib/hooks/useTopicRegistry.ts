import { useMemo } from 'react'

export interface TopicRegistry {
  contacts: string
  trust: string
  profile: string
  recognition: string
  signal: string
  system: string
}

/**
 * Client-side hook to access HCS topic IDs from environment variables
 * This is the SINGLE SOURCE OF TRUTH for topic IDs in the app
 * 
 * Usage:
 * const topics = useTopicRegistry()
 * console.log(topics.profile) // Gets from NEXT_PUBLIC_TOPIC_PROFILE env var
 */
export function useTopicRegistry(): TopicRegistry {
  return useMemo(() => ({
    contacts: process.env.NEXT_PUBLIC_TOPIC_CONTACT!,
    trust: process.env.NEXT_PUBLIC_TOPIC_TRUST!,
    profile: process.env.NEXT_PUBLIC_TOPIC_PROFILE!,
    recognition: process.env.NEXT_PUBLIC_TOPIC_RECOGNITION!,
    signal: process.env.NEXT_PUBLIC_TOPIC_SIGNAL!,
    system: process.env.NEXT_PUBLIC_TOPIC_SIGNAL!, // System messages use signal topic (matches server)
  }), [])
}

/**
 * Get topic registry synchronously (for non-React contexts)
 * 
 * IMPORTANT: Client-side version reads from process.env directly
 * Server-side code MUST use topics() from @/lib/registry/serverRegistry
 */
export function getTopicRegistry(): TopicRegistry {
  return {
    contacts: process.env.NEXT_PUBLIC_TOPIC_CONTACT!,
    trust: process.env.NEXT_PUBLIC_TOPIC_TRUST!,
    profile: process.env.NEXT_PUBLIC_TOPIC_PROFILE!,
    recognition: process.env.NEXT_PUBLIC_TOPIC_RECOGNITION!,
    signal: process.env.NEXT_PUBLIC_TOPIC_SIGNAL!,
    system: process.env.NEXT_PUBLIC_TOPIC_SIGNAL!, // System messages use signal topic (matches server)
  }
}
