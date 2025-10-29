/**
 * Catalog loader for lens-specific recognition types
 * 
 * Fetches the full 84-signal catalog from API with cultural overlays.
 * When minting, the selected type's metadata is frozen permanently.
 */

import { LensKey } from '@/lib/lens/lensConfig'

export type RecognitionType = {
  id: string
  label: string
  emoji: string
  description: string
  category?: string
}

// Cache to avoid repeated API calls
let catalogCache: Record<LensKey, RecognitionType[]> = {
  base: [],
  genz: [],
  african: []
}

let fetchPromises: Record<LensKey, Promise<RecognitionType[]> | null> = {
  base: null,
  genz: null,
  african: null
}

/**
 * Get recognition catalog for a lens
 * 
 * Fetches from /api/registry/catalog?edition={lens}
 * Returns the full set of 84 recognition types with cultural overlays.
 */
export async function getCatalogForLens(lens: LensKey): Promise<RecognitionType[]> {
  // Return from cache if available
  if (catalogCache[lens].length > 0) {
    return catalogCache[lens]
  }

  // Return pending promise if already fetching
  if (fetchPromises[lens]) {
    return fetchPromises[lens]!
  }

  // Fetch catalog
  fetchPromises[lens] = fetch(`/api/registry/catalog?edition=${lens}`)
    .then(res => {
      if (!res.ok) throw new Error(`Failed to fetch ${lens} catalog`)
      return res.json()
    })
    .then((data: any) => {
      // Transform API response to RecognitionType format
      const signals = data.signals || data.items || []
      const catalog: RecognitionType[] = signals.map((s: any) => ({
        id: s.id || s.signalId,
        label: s.name || s.label,
        emoji: s.icon || s.emoji || '💫',
        description: s.description || '',
        category: s.category || 'general'
      }))
      
      catalogCache[lens] = catalog
      fetchPromises[lens] = null
      return catalog
    })
    .catch(err => {
      console.error(`Failed to load ${lens} catalog:`, err)
      fetchPromises[lens] = null
      // Return empty array on error
      return []
    })

  return fetchPromises[lens]!
}

/**
 * Synchronous version for components that need immediate data
 * Returns cached catalog or empty array
 */
export function getCatalogForLensSync(lens: LensKey): RecognitionType[] {
  return catalogCache[lens] || []
}
