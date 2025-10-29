'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { LENSES, LensKey, DEFAULT_LENS } from '@/lib/lens/lensConfig'
import { magic } from '@/lib/magic'

export type CulturalLens = 'base' | 'genz' | 'african'

type LensState = {
  active: LensKey
  owned: LensKey[]
  lastSwitch?: string
  unlocks?: Record<string, { txId: string; amount: number }>
}

const STORAGE_KEY = 'tm:lens'

export type RecognitionSignal = {
  base_id: string
  type_id: string
  name: string
  description: string
  icon: string
  tags: string[]
  category: string
  subcategory: string
  trustValue?: number
  rarity?: string
}

/**
 * Fetches recognition signals with cultural overlay applied
 * @param lens - Cultural lens to apply (base, genz, african)
 */
export function useRecognitionSignals(lens: CulturalLens = 'base') {
  const [signals, setSignals] = useState<RecognitionSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSignals() {
      try {
        setLoading(true)
        setError(null)

        // Fetch base catalog
        const baseRes = await fetch('/api/registry/catalog?edition=base')
        if (!baseRes.ok) throw new Error('Failed to fetch base catalog')
        const baseData = await baseRes.json()

        let finalSignals = baseData.items || []

        // If lens is not base, fetch and apply overlay
        if (lens !== 'base') {
          const overlayRes = await fetch(`/api/registry/catalog?edition=${lens}`)
          if (overlayRes.ok) {
            const overlayData = await overlayRes.json()
            const overlayMap = new Map(
              (overlayData.items || []).map((item: RecognitionSignal) => [
                item.base_id,
                item,
              ])
            )

            // Layer overlay onto base (overlay name/description/icon override base)
            finalSignals = finalSignals.map((baseSignal: RecognitionSignal) => {
              const overlay = overlayMap.get(baseSignal.base_id)
              if (overlay) {
                return {
                  ...baseSignal, // Keep base economics (trustValue, rarity)
                  name: overlay.name, // Override with cultural translation
                  description: overlay.description,
                  icon: overlay.icon,
                  tags: overlay.tags,
                }
              }
              return baseSignal
            })
          }
        }

        setSignals(finalSignals)
      } catch (err: any) {
        console.error('[useRecognitionSignals] Error:', err)
        setError(err.message || 'Failed to load signals')
      } finally {
        setLoading(false)
      }
    }

    fetchSignals()
  }, [lens])

  return { signals, loading, error }
}

/**
 * Get user's preferred cultural lens from localStorage
 * Falls back to 'base' if not set
 */
export function getUserLens(): CulturalLens {
  if (typeof window === 'undefined') return 'base'
  const stored = localStorage.getItem('tm:cultural-lens')
  if (stored === 'genz' || stored === 'african') return stored
  return 'base'
}

/**
 * Set user's preferred cultural lens
 */
export function setUserLens(lens: CulturalLens) {
  if (typeof window === 'undefined') return
  localStorage.setItem('tm:cultural-lens', lens)
}

/**
 * Full lens hook with economic unlock system
 */
export function useLens() {
  const [state, setState] = useState<LensState | null>(null)

  // Boot from profile or localStorage fallback
  useEffect(() => {
    const boot = async () => {
      try {
        const token = await magic?.user.getIdToken()
        if (token) {
          const res = await fetch('/api/profile/get-lens', { 
            headers: { Authorization: `Bearer ${token}` }
          })
          if (res.ok) {
            const data: LensState = await res.json()
            setState(data)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
            return
          }
        }
      } catch {/* ignore */}
      const cached = localStorage.getItem(STORAGE_KEY)
      if (cached) setState(JSON.parse(cached))
      else setState({ active: DEFAULT_LENS, owned: [DEFAULT_LENS] })
    }
    boot()
  }, [])

  const isOwned = useCallback(
    (lens: LensKey) => !!state?.owned.includes(lens), 
    [state]
  )

  const setActiveLens = useCallback(async (lens: LensKey) => {
    if (!state) return
    if (!isOwned(lens)) throw new Error('Lens not owned')
    
    const token = await magic?.user.getIdToken()
    const res = await fetch('/api/profile/set-lens', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ active: lens }),
    })
    
    if (!res.ok) throw new Error('Failed to set active lens')
    
    const next = { 
      ...state, 
      active: lens, 
      lastSwitch: new Date().toISOString() 
    }
    setState(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [state, isOwned])

  const unlockAndSwitch = useCallback(async (lens: LensKey) => {
    if (!state) return { owned: false }

    // Already owned? Just switch
    if (isOwned(lens)) {
      await setActiveLens(lens)
      return { owned: true }
    }

    // Pay TRST fee (stub for now - will integrate sendTRSTWithContext)
    const amount = LENSES[lens].priceTRST
    
    // TODO: Integrate with sendTRSTWithContext when treasury is live
    // const pay = await sendTRSTWithContext({
    //   to: process.env.NEXT_PUBLIC_TREASURY_ACCOUNT || 'tm-treasury',
    //   amount,
    //   context: { type: 'lens_unlock', lens },
    // })
    
    // For now, mock the payment
    const mockTxId = `mock-tx-${Date.now()}`
    
    // Tell backend to record ownership
    const token = await magic?.user.getIdToken()
    const res = await fetch('/api/profile/unlock-lens', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ 
        lens, 
        payment: { txId: mockTxId, amount } 
      }),
    })
    
    if (!res.ok) throw new Error('Unlock failed')

    const owned = [...new Set([...state.owned, lens])]
    const next: LensState = {
      ...state,
      active: lens,
      owned,
      lastSwitch: new Date().toISOString(),
      unlocks: { 
        ...(state.unlocks || {}), 
        [lens]: { txId: mockTxId, amount } 
      },
    }
    
    setState(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    return { owned: false, txId: mockTxId }
  }, [state, isOwned, setActiveLens])

  return useMemo(() => ({
    loading: !state,
    active: state?.active ?? DEFAULT_LENS,
    owned: state?.owned ?? [DEFAULT_LENS],
    lenses: LENSES,
    isOwned,
    setActiveLens,
    unlockAndSwitch,
  }), [state, isOwned, setActiveLens, unlockAndSwitch])
}
