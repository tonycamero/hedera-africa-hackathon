'use client'

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SignalAsset } from "@/lib/types/signals-collectible"
import { getRarityTheme, formatRarityDisplay, getCategoryIcon } from "@/lib/ui/signal-rarities"
import { formatDistanceToNow } from "date-fns"
import { Copy, Share2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface SignalCardProps {
  signal: SignalAsset
  showActions?: boolean
  compact?: boolean
}

export function SignalCard({ signal, showActions = true, compact = false }: SignalCardProps) {
  const theme = getRarityTheme(signal.metadata.rarity)
  const categoryIcon = getCategoryIcon(signal.metadata.category)
  
  const handleCopyAssetId = async () => {
    await navigator.clipboard.writeText(signal.asset_id)
    toast.success("Asset ID copied to clipboard")
  }
  
  const handleShare = async () => {
    const url = `${window.location.origin}/signals/asset/${signal.asset_id}`
    await navigator.clipboard.writeText(url)
    toast.success("Share link copied to clipboard")
  }
  
  const handleViewExternal = () => {
    // In real implementation, this would open the asset on a blockchain explorer
    window.open(`https://explorer.hedera.com/mainnet/token/${signal.asset_id}`, '_blank')
  }

  if (compact) {
    return (
      <Card className={`p-3 bg-gradient-to-br ${theme.gradient} ${theme.glow} shadow-lg border-2 ${theme.border} relative overflow-hidden`}>
        <div className="flex items-center gap-3">
          <div className="text-2xl">{categoryIcon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-white text-sm truncate">{signal.metadata.category}</h4>
              <Badge variant="secondary" className="text-xs">
                {formatRarityDisplay(signal.metadata.rarity)}
              </Badge>
            </div>
            <p className="text-white/90 text-xs truncate">{signal.metadata.inscription}</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-6 bg-gradient-to-br ${theme.gradient} ${theme.glow} shadow-xl border-2 ${theme.border} relative overflow-hidden group hover:scale-[1.02] transition-transform duration-200`}>
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{categoryIcon}</div>
            <div>
              <h3 className="font-bold text-white text-lg">{signal.metadata.category}</h3>
              <Badge variant="secondary" className="text-sm">
                {formatRarityDisplay(signal.metadata.rarity)}
              </Badge>
            </div>
          </div>
          <div className="text-right text-white/70 text-sm">
            <div>#{signal.asset_id.slice(-6)}</div>
            <div>{formatDistanceToNow(new Date(signal.issued_at), { addSuffix: true })}</div>
          </div>
        </div>

        {/* Inscription */}
        <div className="mb-4">
          <p className="text-white font-medium text-base leading-relaxed">
            "{signal.metadata.inscription}"
          </p>
        </div>

        {/* Labels */}
        <div className="flex flex-wrap gap-2 mb-4">
          {signal.metadata.labels.slice(0, 3).map((label, idx) => (
            <Badge 
              key={idx}
              variant="outline" 
              className="text-white/90 border-white/30 bg-white/10 text-xs"
            >
              {label}
            </Badge>
          ))}
          {signal.metadata.labels.length > 3 && (
            <Badge variant="outline" className="text-white/70 border-white/20 bg-white/5 text-xs">
              +{signal.metadata.labels.length - 3} more
            </Badge>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/20">
          <div className="text-white/70 text-sm">
            From: {signal.issuer_pub.slice(0, 8)}...
          </div>
          
          {showActions && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
                onClick={handleCopyAssetId}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                size="sm" 
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
                onClick={handleViewExternal}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}