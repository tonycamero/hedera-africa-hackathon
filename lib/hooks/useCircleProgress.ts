'use client'

import { useSyncExternalStore } from 'react'
import { signalsStore } from '@/lib/stores/signalsStore'
import { fairfieldVoiceService } from '@/lib/services/FairfieldVoiceService'

export interface CircleProgress {
  accepted: number
  unlocked3: boolean
  unlocked9: boolean
  bondedContacts: Array<{
    peerId: string
    bondedAt: number
    metadata?: Record<string, any>
  }>
}

/**
 * React hook for Circle of Trust progress using signalsStore
 * Follows the universal lens pattern used by Professional and GenZ lenses
 */
export function useCircleProgress(userIssuer?: string): CircleProgress {
  
  // Subscribe to signalsStore changes for real-time updates
  const signalEvents = useSyncExternalStore(
    // Subscribe
    (callback) => {
      const unsubscribe = signalsStore.subscribe(callback)
      return unsubscribe
    },
    // Get snapshot
    () => signalsStore.getAll(),
    // Server snapshot (SSR)
    () => []
  )

  if (!userIssuer) {
    return {
      accepted: 0,
      unlocked3: false,
      unlocked9: false,
      bondedContacts: []
    }
  }

  // Get bonded contacts count using FairfieldVoiceService
  const accepted = fairfieldVoiceService.getBondedContactsCount(userIssuer)
  const bondedContacts = fairfieldVoiceService.getMyBondedContacts(userIssuer)

  return {
    accepted,
    unlocked3: accepted >= 3,
    unlocked9: accepted >= 9,
    bondedContacts
  }
}