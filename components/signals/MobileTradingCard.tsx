'use client'

import { useState } from 'react'
import { SignalAsset, SignalType } from '@/lib/types/signals-collectible'
import { getCategoryIcon, getRarityTheme, formatRarityDisplay } from '@/lib/ui/signal-rarities'
import { GenZCard, GenZText, GenZButton } from '@/components/ui/genz-design-system'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Share2, Copy, Eye, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import '@/styles/glass-cards.css'

function rarityMod(r: string) {
  if (r === 'God-Tier') return 'glass--god'
  if (r === 'Peak') return 'glass--peak'
  if (r === 'Heat') return 'glass--heat'
  return ''
}

interface MobileTradingCardProps {
  asset: SignalAsset
  type: SignalType
}

export function MobileTradingCard({ asset, type }: MobileTradingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const theme = getRarityTheme(asset.metadata.rarity)
  const icon = getCategoryIcon(type.category)
  
  const issued = new Date(asset.issued_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

  const giverHandle = asset.issuer_pub.includes('tm-') 
    ? asset.issuer_pub.replace('tm-', '').replace('-', ' ')
    : 'anon'

  const handleShare = async () => {
    const url = `${window.location.origin}/signals/asset/${asset.asset_id}`
    await navigator.clipboard.writeText(url)
    toast.success('Share link copied! 🔗')
  }

  const handleCopyAssetId = async () => {
    await navigator.clipboard.writeText(asset.asset_id)
    toast.success('Asset ID copied!')
  }

  const handleViewDetails = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className={`glass ${rarityMod(asset.metadata.rarity)} relative w-full p-4 transition-all duration-300`}>
      <div className="glass-toplight" />
      <div className="sheen" />
      
      <div className="relative z-10">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-lg">
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-white">{type.category}</h3>
              <Badge variant="secondary" className="text-xs">
                {formatRarityDisplay(asset.metadata.rarity)}
              </Badge>
            </div>
          </div>
          <div className="text-right text-xs text-white/70">
            <div>#{asset.asset_id.slice(-6)}</div>
            <div>{issued}</div>
          </div>
        </div>

        {/* Inscription */}
        <div className="mb-3">
          <p className="text-white/90 text-sm leading-relaxed">
            "{asset.metadata.inscription}"
          </p>
        </div>

        {/* Labels */}
        <div className="flex flex-wrap gap-1 mb-3">
          {asset.metadata.labels.slice(0, 2).map((label, idx) => (
            <Badge key={idx} variant="outline" className="text-white/80 border-white/30 bg-white/10 text-xs">
              {label}
            </Badge>
          ))}
          {asset.metadata.labels.length > 2 && (
            <Badge variant="outline" className="text-white/60 border-white/20 bg-white/5 text-xs">
              +{asset.metadata.labels.length - 2}
            </Badge>
          )}
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between text-xs text-white/60 mb-3">
          <span>From {giverHandle}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleViewDetails}
            className="text-white/60 hover:text-white h-auto p-1"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-white/20 pt-3 space-y-3">
            {/* Provenance */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white">Provenance</h4>
              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-white/50">Issuer:</span>
                  <div className="text-white/80 font-mono break-all">{asset.issuer_pub}</div>
                </div>
                <div>
                  <span className="text-white/50">Type:</span>
                  <span className="text-white/80 font-mono ml-2">{type.type_id}</span>
                </div>
                <div>
                  <span className="text-white/50">Asset ID:</span>
                  <div className="text-white/80 font-mono break-all">{asset.asset_id}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleShare}
                className="flex-1 bg-white text-black hover:bg-white/90 text-xs"
              >
                <Share2 className="h-3 w-3 mr-1" />
                Share
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyAssetId}
                className="border-white/20 text-white hover:bg-white/10 text-xs"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.href = '/wallet'}
                className="border-white/20 text-white hover:bg-white/10 text-xs"
              >
                <Eye className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}