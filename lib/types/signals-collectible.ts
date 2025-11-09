// Signals Collectible System Types
// Transform from ephemeral posts to collectible NFT-lite tokens

export type SignalRarity = 'Regular' | 'Heat' | 'Peak' | 'God-Tier';

export interface SignalType {
  type_id: string;        // e.g., "rizz@1"
  base_id: string;        // e.g., "rizz"
  version: number;        // 1
  category: string;       // "Rizz", "Clutch", "social", "academic", "professional", etc.
  labels: string[];       // array of short phrases
  rarity: SignalRarity;
  content_hash: string;   // sha3-256 of canonical JSON
  created_at: string;
  name?: string;          // display name for recognition signals
  description?: string;   // description for recognition signals
  icon?: string;          // emoji icon
  source?: 'recognition_signals' | 'legacy';  // signal source
}

export interface SignalInstance {
  instance_id: string;
  type_id: string;
  issuer_pub: string;         // who gave this signal
  recipient_pub?: string;     // who received it (if known)
  recipient_hint?: string;    // email/phone if wallet unknown
  inscription?: string;       // personal message
  evidence?: string;          // link/context
  instance_hash: string;      // commitment to private data
  issued_at: string;
  mode: 'asset' | 'ephemeral';
}

export interface SignalAsset {
  asset_id: string;           // HTS NFT serial or unique ID
  instance_id: string;       // links to SignalInstance
  type_id: string;
  issuer_pub: string;
  recipient_pub: string;      // actual owner
  issued_at: string;
  claimed_at?: string;        // if was pending claim
  metadata: {
    category: string;
    rarity: SignalRarity;
    inscription?: string;
    labels: string[];
  };
}

export interface PendingClaim {
  claim_id: string;
  instance_id: string;
  claim_token: string;        // secure claim link
  recipient_contact: string;  // email/phone
  recipient_pub?: string;     // filled when claimed
  mode: 'treasury_mint' | 'lazy_mint';
  status: 'pending' | 'claimed' | 'expired';
  expires_at: string;
  created_at: string;
  claimed_at?: string;
}

// UI Types
export interface SignalTokenCard {
  asset: SignalAsset;
  signalType: SignalType;
}

export interface FlexBoardStats {
  items: Array<{
    category: string;
    count: number;
    icon: string;
  }>;
  last30d: number;
  streak: number;
}

export interface ShareCardData {
  category: string;
  rarity: SignalRarity;
  inscription: string;
  issued: string;
  handle: string;
}

// Rarity Themes
export interface RarityTheme {
  ring: string;
  bg: string;
  accent: string;
  glow?: string;
}

export const rarityTheme: Record<SignalRarity, RarityTheme> = {
  "Regular": { 
    ring: "border-zinc-700", 
    bg: "from-zinc-950 to-zinc-900", 
    accent: "text-zinc-300" 
  },
  "Heat": { 
    ring: "border-emerald-500/40", 
    bg: "from-zinc-950 to-emerald-950/20", 
    accent: "text-emerald-300",
    glow: "shadow-emerald-500/20"
  },
  "Peak": { 
    ring: "border-amber-500/40", 
    bg: "from-zinc-950 to-amber-950/20", 
    accent: "text-amber-300",
    glow: "shadow-amber-500/20"
  },
  "God-Tier": { 
    ring: "border-pink-500/40", 
    bg: "from-zinc-950 to-pink-950/20", 
    accent: "text-pink-300",
    glow: "shadow-pink-500/30 animate-pulse"
  },
};

// Category Icons - Extended for recognition signals
export const typeIcon: Record<string, string> = {
  // Legacy categories
  "Rizz": "😏",
  "Clutch": "⏱️", 
  "Big Brain": "🧠",
  "Grind": "💪",
  "Builder": "🛠️",
  "Plug": "🔌",
  "W": "🏆",
  "Ops": "🧩",
  "Vibes": "🎛️",
  "Day 1": "🫱🏽‍🫲🏾",
  
  // Recognition signal categories
  "social": "👥",
  "academic": "📚", 
  "professional": "💼",
};

// Category display names
export const categoryDisplayName: Record<string, string> = {
  // Legacy categories
  "Rizz": "Rizz",
  "Clutch": "Clutch", 
  "Big Brain": "Big Brain",
  "Grind": "Grind",
  "Builder": "Builder",
  "Plug": "Plug",
  "W": "W",
  "Ops": "Ops",
  "Vibes": "Vibes",
  "Day 1": "Day 1",
  
  // Recognition signal categories
  "social": "Social",
  "academic": "Academic", 
  "professional": "Professional",
};
