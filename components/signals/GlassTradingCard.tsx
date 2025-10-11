'use client'

import { SignalAsset, SignalType } from '@/lib/types/signals-collectible'
import { getCategoryIcon } from '@/lib/ui/signal-rarities'
import '@/styles/glass-cards.css'

function rarityMod(r: string) {
  if (r === 'God-Tier') return 'glass--god'
  if (r === 'Peak') return 'glass--peak'
  if (r === 'Heat') return 'glass--heat'
  return ''
}

interface GlassTradingCardProps {
  asset: SignalAsset
  type: SignalType
  active?: boolean
}

export function GlassTradingCard({ asset, type, active }: GlassTradingCardProps) {
  const issued = new Date(asset.issued_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
  const icon = getCategoryIcon(type.category)
  
  // Create short label from category and inscription
  const shortLabel = asset.metadata.inscription.length > 40 
    ? asset.metadata.inscription.substring(0, 37) + '...'
    : asset.metadata.inscription

  const giverHandle = asset.issuer_pub.includes('tm-') 
    ? asset.issuer_pub.replace('tm-', '').replace('-', ' ')
    : 'anon'

  return (
    <div
      className={`glass ${rarityMod(asset.metadata.rarity)} relative w-full aspect-[63/88] p-3 ${
        active ? 'ring-2 ring-white/30' : 'ring-0'
      }`}
      style={{
        backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.00))'
      }}
    >
      <div className="glass-toplight" />
      <div className="sheen" />
      
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 grid place-items-center rounded-lg bg-white/10 text-base">
            {icon}
          </div>
          <div className="text-[11px] font-semibold text-white/90">{type.category}</div>
        </div>
        <span className="text-[10px] text-white/70">{asset.metadata.rarity}</span>
      </div>

      {/* Title */}
      <div className="mt-2 text-sm font-semibold text-white line-clamp-2">
        {type.category} Signal
      </div>
      
      {/* Inscription preview */}
      <div className="mt-1 text-[11px] text-white/60 line-clamp-2">
        {shortLabel}
      </div>

      {/* Footer */}
      <div className="absolute left-0 right-0 bottom-0 p-3 flex items-center justify-between text-[10px] text-white/55">
        <span>From {giverHandle}</span>
        <span>{issued}</span>
      </div>
    </div>
  )
}