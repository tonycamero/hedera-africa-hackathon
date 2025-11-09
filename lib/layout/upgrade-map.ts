import type { LayoutMode } from './mode-detector'

export function modeToUnlockKind(mode: LayoutMode): 'collector' | 'civic-leader' | 'premium' | 'vip' | null {
  switch (mode) {
    case 'collector': return 'collector'
    case 'civic-leader': return 'civic-leader'
    case 'premium': return 'premium'
    case 'vip': return 'vip'
    default: return null
  }
}
