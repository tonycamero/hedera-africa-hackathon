export type LensKey = 'base' | 'genz' | 'african';

export const LENSES: Record<LensKey, {
  key: LensKey;
  label: string;
  emoji?: string;
  priceTRST: number;       // cost to unlock
  description: string;
}> = {
  base: { 
    key: 'base', 
    label: 'Base (Universal)', 
    emoji: '🧭', 
    priceTRST: 0, 
    description: 'Neutral, protocol-first experience.' 
  },
  genz: { 
    key: 'genz', 
    label: 'GenZ', 
    emoji: '🔥', 
    priceTRST: 1.0, 
    description: 'Fast feedback, streaks, kudos vibes.' 
  },
  african: { 
    key: 'african', 
    label: 'African (Ubuntu)', 
    emoji: '🌍', 
    priceTRST: 1.0, 
    description: 'Cooperative loops rooted in Ubuntu.' 
  },
};

export const DEFAULT_LENS: LensKey = 'base';

export const LENS_UNLOCK_PRICE_TRST = 1.0; // 100 mints
export const LENS_MINT_PRICE_TRST = 0.01; // reference only (135 mints = 1.35 TRST)

export const LENS_EVENTS = {
  UNLOCK: 'LENS_UNLOCK',      // HCS-21 signal
  SWITCH: 'LENS_SWITCH',      // HCS-21 signal
} as const;

// Rollback flags (Hackathon: disable multi-lens switching)
export const SINGLE_LENS = (process.env.TRUSTMESH_SINGLE_LENS as LensKey) || 'base';
export const ENABLE_LENS_UNLOCK = process.env.ENABLE_LENS_UNLOCK === 'true';
export const ENABLE_SWITCHER = process.env.NEXT_PUBLIC_ENABLE_LENS_SWITCHER === 'true';
