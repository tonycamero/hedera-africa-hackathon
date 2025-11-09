'use client'

import { SignalAsset, SignalType } from '@/lib/types/signals-collectible'
import { getCategoryIcon } from '@/lib/ui/signal-rarities'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Share2, Wallet, Database, Zap, Copy } from 'lucide-react'
import { toast } from 'sonner'
import '@/styles/glass-cards.css'

function rarityMod(r: string) {
  if (r === 'God-Tier') return 'glass--god'
  if (r === 'Peak') return 'glass--peak'
  if (r === 'Heat') return 'glass--heat'
  return ''
}

interface TradingSpotlightProps {
  asset: SignalAsset | null
  type: SignalType | null
}

export function TradingSpotlight({ asset, type }: TradingSpotlightProps) {

  if (!asset || !type) {
    return (
      <div className="h-[calc(100vh-88px)] flex flex-col items-center justify-center text-white/50 bg-gradient-to-br from-gray-900/20 to-black/40">
        <div className="text-6xl mb-4">🎴</div>
        <div className="text-xl mb-2">Select a signal to view</div>
        <div className="text-sm">Choose from your collection on the left</div>
      </div>
    )
  }

  const issuedAt = new Date(asset.issued_at).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
  const icon = getCategoryIcon(type.category)

  const giverHandle = asset.issuer_pub.includes('tm-') 
    ? asset.issuer_pub.replace('tm-', '').replace('-', ' ')
    : asset.issuer_pub.slice(0, 8) + '...'

  const recipientHandle = asset.recipient_pub.includes('tm-')
    ? asset.recipient_pub.replace('tm-', '').replace('-', ' ')  
    : asset.recipient_pub.slice(0, 8) + '...'

  const handleShare = async () => {
    const url = `${window.location.origin}/signals/asset/${asset.asset_id}`
    await navigator.clipboard.writeText(url)
    toast.success('Share link copied to clipboard! 🔗')
  }

  const handleViewInWallet = () => {
    window.location.href = '/wallet'
  }

  const handleCopyAssetId = async () => {
    await navigator.clipboard.writeText(asset.asset_id)
    toast.success('Asset ID copied to clipboard!')
  }

  return (
    <div className="h-[calc(100vh-88px)] overflow-y-auto bg-gradient-to-br from-gray-900/20 to-black/40">
      <div className="p-6 grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Big trading card */}
        <div className="xl:col-span-3 flex justify-center">
          <div className={`glass ${rarityMod(asset.metadata.rarity)} relative w-full max-w-md aspect-[63/88] p-6`}>
            <div className="glass-toplight" />
            <div className="sheen" />
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 grid place-items-center rounded-xl bg-white/10 text-3xl">
                  {icon}
                </div>
                <div>
                  <div className="text-white font-semibold text-lg">{type.category}</div>
                  <div className="text-xs text-white/60">#{asset.asset_id.slice(-6)}</div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="text-sm mb-2">
                  {asset.metadata.rarity}
                </Badge>
                <div className="text-xs text-white/60">
                  <Badge className={`${getDataSourceBadgeColor('signals')} flex items-center gap-1`}>
                    {getDataSourceLabel('signals') === 'Mock Data' ? <Database className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                    {getDataSourceLabel('signals')}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="mt-6 text-xl font-bold text-white">{type.category} Signal</div>
            
            {/* Inscription */}
            <div className="mt-3 text-sm text-white/80 leading-relaxed">
              "{asset.metadata.inscription}"
            </div>

            {/* Labels */}
            <div className="mt-4 flex flex-wrap gap-2">
              {asset.metadata.labels.slice(0, 3).map((label, idx) => (
                <Badge key={idx} variant="outline" className="text-white/90 border-white/30 bg-white/10 text-xs">
                  {label}
                </Badge>
              ))}
            </div>

            {/* Footer info */}
            <div className="absolute left-0 right-0 bottom-0 p-6 grid grid-cols-2 gap-2 text-xs text-white/70 border-t border-white/20 bg-black/20">
              <div>
                <div className="text-white/50">From</div>
                <div className="text-white/90 font-medium">{giverHandle}</div>
              </div>
              <div className="text-right">
                <div className="text-white/50">Minted</div>
                <div className="text-white/90 font-medium">{issuedAt}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Meta & actions panel */}
        <div className="xl:col-span-2 space-y-6">
          {/* Provenance */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Provenance
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-white/50 text-xs">Issuer Address</div>
                <div className="text-white/90 font-mono text-xs break-all">{asset.issuer_pub}</div>
              </div>
              <div>
                <div className="text-white/50 text-xs">Recipient Address</div>
                <div className="text-white/90 font-mono text-xs break-all">{asset.recipient_pub}</div>
              </div>
              <div>
                <div className="text-white/50 text-xs">Signal Type</div>
                <div className="text-white/90 font-mono text-xs">{type.type_id}</div>
              </div>
              <div>
                <div className="text-white/50 text-xs">Asset ID</div>
                <div className="flex items-center gap-2">
                  <div className="text-white/90 font-mono text-xs break-all flex-1">{asset.asset_id}</div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyAssetId}
                    className="h-6 w-6 p-0 text-white/60 hover:text-white"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleShare}
                className="bg-white text-black hover:bg-white/90 font-semibold flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button
                onClick={handleViewInWallet}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 font-semibold flex items-center gap-2"
              >
                <Wallet className="h-4 w-4" />
                Wallet
              </Button>
            </div>

            {/* Future: Trade/Gift section */}
            <div className="mt-4">
              <div className="text-sm text-white/50 italic">
                💡 Trading & gifting features coming soon for select signal types
              </div>
            </div>
          </div>

          {/* Collection insights */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Collection Value</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Rarity Rank</span>
                <span className="text-white font-medium">{asset.metadata.rarity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Category</span>
                <span className="text-white font-medium">{type.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Estimated Value</span>
                <span className="text-white font-medium">🔥 Priceless</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}