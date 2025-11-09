import type { SignalRarity } from '@/lib/types/signals-collectible'

export const RARITY_THEMES = {
  'Regular': {
    gradient: 'from-gray-400 to-gray-600',
    border: 'border-gray-500',
    text: 'text-gray-800',
    glow: 'shadow-gray-400/20',
    accent: '#6B7280'
  },
  'Heat': {
    gradient: 'from-orange-500 to-red-600',
    border: 'border-orange-500',
    text: 'text-orange-900',
    glow: 'shadow-orange-500/30',
    accent: '#EA580C'
  },
  'Peak': {
    gradient: 'from-purple-500 to-violet-700',
    border: 'border-purple-500',
    text: 'text-purple-900',
    glow: 'shadow-purple-500/40',
    accent: '#8B5CF6'
  },
  'God-Tier': {
    gradient: 'from-yellow-400 via-amber-500 to-orange-600',
    border: 'border-yellow-500',
    text: 'text-yellow-900',
    glow: 'shadow-yellow-500/50',
    accent: '#F59E0B'
  }
} as const

export const getRarityTheme = (rarity: SignalRarity) => {
  return RARITY_THEMES[rarity]
}

export const RARITY_ORDER: SignalRarity[] = ['Regular', 'Heat', 'Peak', 'God-Tier']

export const getRarityRank = (rarity: SignalRarity): number => {
  return RARITY_ORDER.indexOf(rarity) + 1
}

export const formatRarityDisplay = (rarity: SignalRarity): string => {
  switch (rarity) {
    case 'Regular':
      return '⚪ Regular'
    case 'Heat':
      return '🔥 Heat'
    case 'Peak':
      return '💜 Peak'
    case 'God-Tier':
      return '✨ God-Tier'
    default:
      return rarity
  }
}

export const CATEGORY_ICONS = {
  'Rizz': '😎',
  'Big Brain': '🧠',
  'Clutch': '⚡',
  'Grind': '💪',
  'Day 1': '🏆',
  'Vibe Check': '✨',
  'W Moment': '🏅',
  'Loyalty': '🤝',
  'Boss Move': '👑',
  'Real One': '💯'
} as const

export const getCategoryIcon = (category: string): string => {
  return CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || '🎯'
}