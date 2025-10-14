/**
 * Canonical Rarity System
 * Single source of truth for recognition card rarities
 * Maps original HCS rarities to consistent UI system
 */

// Canonical rarity enum (snake_case for consistency with other enums)
export type CanonicalRarity = 'regular' | 'heat' | 'god_tier';

// Original HCS rarity values (preserve for metadata)
export type OriginalRarity = 'Common' | 'Rare' | 'Legendary';

// Rarity mapping from HCS to canonical
export const RARITY_MAP: Record<OriginalRarity, CanonicalRarity> = {
  'Common': 'regular',
  'Rare': 'heat', 
  'Legendary': 'god_tier'
};

// Reverse mapping for lookups
export const REVERSE_RARITY_MAP: Record<CanonicalRarity, OriginalRarity> = {
  'regular': 'Common',
  'heat': 'Rare',
  'god_tier': 'Legendary'
};

// UI Display Configuration
export const RARITY_CONFIG: Record<CanonicalRarity, {
  label: string;
  emoji: string;
  gradient: string;
  border: string;
  text: string;
  glow: string;
  accent: string;
  order: number;
  description: string;
}> = {
  regular: {
    label: 'Regular',
    emoji: '⚪',
    gradient: 'from-gray-400 to-gray-600',
    border: 'border-gray-500',
    text: 'text-gray-800',
    glow: 'shadow-gray-400/20',
    accent: '#6B7280',
    order: 1,
    description: 'Common recognition signals'
  },
  heat: {
    label: 'Heat',
    emoji: '🔥',
    gradient: 'from-orange-500 to-red-600',
    border: 'border-orange-500',
    text: 'text-orange-900',
    glow: 'shadow-orange-500/30',
    accent: '#EA580C',
    order: 2,
    description: 'Rare and impactful signals'
  },
  god_tier: {
    label: 'God-Tier',
    emoji: '✨',
    gradient: 'from-yellow-400 via-amber-500 to-orange-600',
    border: 'border-yellow-500',
    text: 'text-yellow-900',
    glow: 'shadow-yellow-500/50 animate-pulse motion-reduce:animate-none',
    accent: '#F59E0B',
    order: 3,
    description: 'Legendary achievement signals'
  }
};

// Utility Functions
export function mapRarityToCanonical(originalRarity: string): CanonicalRarity {
  return RARITY_MAP[originalRarity as OriginalRarity] || 'regular';
}

export function getRarityConfig(rarity: CanonicalRarity) {
  return RARITY_CONFIG[rarity];
}

export function getRarityByOrder(): CanonicalRarity[] {
  return Object.entries(RARITY_CONFIG)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([rarity]) => rarity as CanonicalRarity);
}

export function formatRarityDisplay(rarity: CanonicalRarity): string {
  const config = RARITY_CONFIG[rarity];
  return `${config.emoji} ${config.label}`;
}

export function getRarityTheme(rarity: CanonicalRarity) {
  const config = RARITY_CONFIG[rarity];
  return {
    gradient: config.gradient,
    border: config.border,
    text: config.text,
    glow: config.glow,
    accent: config.accent
  };
}

// Statistics helper
export function calculateRarityDistribution(items: { rarity: CanonicalRarity }[]): Record<CanonicalRarity, number> {
  return items.reduce((acc, item) => {
    acc[item.rarity] = (acc[item.rarity] || 0) + 1;
    return acc;
  }, {} as Record<CanonicalRarity, number>);
}

// Validation
export function isValidCanonicalRarity(rarity: string): rarity is CanonicalRarity {
  return rarity in RARITY_CONFIG;
}

export function isValidOriginalRarity(rarity: string): rarity is OriginalRarity {
  return rarity in RARITY_MAP;
}