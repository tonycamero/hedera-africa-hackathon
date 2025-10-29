/**
 * Catalog loader for lens-specific recognition types
 * 
 * Each lens has its own vocabulary for recognition types.
 * When minting, the selected type's metadata is frozen permanently.
 */

import { LensKey } from '@/lib/lens/lensConfig'

export type RecognitionType = {
  id: string
  label: string
  emoji: string
  description: string
}

// Base catalog (neutral, professional)
const BASE_CATALOG: RecognitionType[] = [
  { id: 'truth', label: 'Truth', emoji: '💎', description: 'Honest and transparent' },
  { id: 'courage', label: 'Courage', emoji: '🦁', description: 'Brave and bold action' },
  { id: 'wisdom', label: 'Wisdom', emoji: '🦉', description: 'Deep insight and guidance' },
  { id: 'kindness', label: 'Kindness', emoji: '🤝', description: 'Compassionate support' },
  { id: 'innovation', label: 'Innovation', emoji: '💡', description: 'Creative breakthrough' },
]

// GenZ catalog (casual, energetic)
const GENZ_CATALOG: RecognitionType[] = [
  { id: 'no-cap', label: 'No Cap', emoji: '🔥', description: 'Straight facts, zero lies' },
  { id: 'vibes', label: 'Good Vibes', emoji: '✨', description: 'Immaculate energy' },
  { id: 'slaps', label: 'That Slaps', emoji: '🎵', description: 'Absolutely fire' },
  { id: 'goat', label: 'GOAT', emoji: '🐐', description: 'Greatest of all time' },
  { id: 'based', label: 'Based', emoji: '💯', description: 'Authentically yourself' },
]

// African catalog (Ubuntu philosophy)
const AFRICAN_CATALOG: RecognitionType[] = [
  { id: 'ubuntu', label: 'Ubuntu', emoji: '🌍', description: 'I am because we are' },
  { id: 'sankofa', label: 'Sankofa', emoji: '🦅', description: 'Learn from the past' },
  { id: 'ujamaa', label: 'Ujamaa', emoji: '🤲', description: 'Collective work and responsibility' },
  { id: 'harambee', label: 'Harambee', emoji: '🙌', description: 'All pull together' },
  { id: 'umoja', label: 'Umoja', emoji: '🔗', description: 'Unity and togetherness' },
]

const CATALOGS: Record<LensKey, RecognitionType[]> = {
  base: BASE_CATALOG,
  genz: GENZ_CATALOG,
  african: AFRICAN_CATALOG,
}

/**
 * Get recognition catalog for a lens
 * 
 * Returns the full set of recognition types available for that lens.
 * When minting, the selected type's metadata is frozen permanently.
 */
export function getCatalogForLens(lens: LensKey): RecognitionType[] {
  return CATALOGS[lens] || BASE_CATALOG
}
