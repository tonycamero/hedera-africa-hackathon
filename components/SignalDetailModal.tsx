import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Copy, ExternalLink, Share, Star, TrendingUp, Shield, Zap } from "lucide-react"
import { toast } from "sonner"
import { type RecognitionSignal } from "@/lib/data/recognitionSignals"
import { type HCSRecognitionDefinition } from "@/lib/services/HCSRecognitionService"

interface SignalDetailModalProps {
  isOpen: boolean
  onClose: () => void
  signal: RecognitionSignal | HCSRecognitionDefinition | null
  onSelect?: () => void
  showSelectButton?: boolean
}

export function SignalDetailModal({ isOpen, onClose, signal, onSelect, showSelectButton = false }: SignalDetailModalProps) {
  if (!signal) return null

  // Get recognition topic from environment or use fallback
  const RECOGNITION_TOPIC = process.env.NEXT_PUBLIC_TOPIC_RECOGNITION || process.env.RECOGNITION_TOPIC || '0.0.6895261'

  const categoryColors = {
    social: 'border-[var(--social)] bg-[hsl(var(--social))]/10',
    academic: 'border-[var(--academic)] bg-[hsl(var(--academic))]/10',
    professional: 'border-[var(--professional)] bg-[hsl(var(--professional))]/10'
  }

  const rarityColors = {
    Common: 'text-gray-400',
    Uncommon: 'text-green-400',
    Rare: 'text-blue-400',
    Epic: 'text-purple-400',
    Legendary: 'text-yellow-400'
  }

  const categoryLabels = {
    social: 'Social Signal',
    academic: 'Academic Signal',
    professional: 'Professional Signal'
  }

  // Check if this is an HCS recognition definition or has enhanced metadata
  const isHCSSignal = 'topicId' in signal && 'createdAt' in signal
  const hasEnhancedMetadata = !!(signal as any).extendedDescription || !!(signal as any).stats || !!(signal as any).enhancementVersion
  
  // Generate metadata for hashinal/token
  const tokenMetadata = {
    tokenId: `TM-${(signal.category || 'UNKNOWN').toUpperCase()}-${(signal.number || 0).toString().padStart(3, '0')}`,
    collection: "TrustMesh Recognition Signals",
    creator: isHCSSignal ? "TrustMesh HCS" : "TrustMesh Protocol",
    mintDate: isHCSSignal ? new Date(signal.createdAt).toLocaleDateString() : "2024-01-15",
    blockchain: "Hedera",
    rarity: signal.rarity || 'Common',
    attributes: [
      { trait: "Category", value: signal.category ? categoryLabels[signal.category] || signal.category : 'Unknown' },
      { trait: "Series", value: isHCSSignal ? "HCS Genesis" : "Genesis" },
      { trait: "Active Status", value: signal.isActive ? "Active" : "Inactive" },
      { trait: "Number", value: `#${signal.number || 0}` },
      ...(isHCSSignal ? [{ trait: "Source", value: "On-Chain" }] : [])
    ]
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(signal.id)
    toast.success("Signal ID copied to clipboard")
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${signal.name} - TrustMesh Signal`,
        text: signal.description,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied to clipboard")
    }
  }

  const StatBar = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          {icon}
          <span className="text-[hsl(var(--text-muted))]">{label}</span>
        </div>
        <span className="text-foreground font-semibold">{value}</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-auto bg-card border border-[hsl(var(--border))] max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-foreground text-center">
            Signal Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          {/* Large Signal Display */}
          <div className={`p-4 rounded-lg border-2 ${signal.category ? categoryColors[signal.category] || 'border-gray-400 bg-gray-100/10' : 'border-gray-400 bg-gray-100/10'} text-center`}>
            <div className="w-16 h-16 mx-auto mb-3 bg-card rounded-xl border border-[hsl(var(--border))] flex items-center justify-center text-3xl">
              {signal.icon}
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">{signal.name}</h2>
            <p className="text-sm text-[hsl(var(--text-secondary))] mb-3 leading-relaxed">
              {(signal as any).extendedDescription || signal.description}
            </p>
            
            <div className="flex justify-center gap-2">
              <Badge variant="outline" className="text-xs">
                {signal.category ? categoryLabels[signal.category] || signal.category : 'Unknown'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                #{signal.number || 0}
              </Badge>
              {signal.isActive && (
                <Badge className="bg-[hsl(var(--neon-cyan))] text-[hsl(var(--background))] text-xs">
                  Active
                </Badge>
              )}
            </div>
          </div>

          {/* Enhanced Stats (if available) */}
          {(signal as any).stats && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Signal Stats</h3>
              <div className="grid grid-cols-2 gap-2">
                <StatBar 
                  icon={<TrendingUp className="w-3 h-3" />} 
                  label="Popularity" 
                  value={(signal as any).stats.popularity} 
                  color="blue" 
                />
                <StatBar 
                  icon={<Zap className="w-3 h-3" />} 
                  label="Impact" 
                  value={(signal as any).stats.impact} 
                  color="green" 
                />
                <StatBar 
                  icon={<Shield className="w-3 h-3" />} 
                  label="Authenticity" 
                  value={(signal as any).stats.authenticity} 
                  color="purple" 
                />
                <StatBar 
                  icon={<Star className="w-3 h-3" />} 
                  label="Difficulty" 
                  value={(signal as any).stats.difficulty} 
                  color="orange" 
                />
              </div>
            </div>
          )}

          {/* Enhanced Traits (if available) */}
          {(signal as any).traits && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Traits</h3>
              <div className="space-y-2">
                {(signal as any).traits.personality && (
                  <div>
                    <span className="text-xs text-[hsl(var(--text-muted))]">Personality:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(signal as any).traits.personality.map((trait: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">{trait}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(signal as any).traits.skills && (
                  <div>
                    <span className="text-xs text-[hsl(var(--text-muted))]">Skills:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(signal as any).traits.skills.map((skill: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(signal as any).traits.environment && (
                  <div>
                    <span className="text-xs text-[hsl(var(--text-muted))]">Environment:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(signal as any).traits.environment.map((env: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">{env}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enhanced Backstory (if available) */}
          {(signal as any).backstory && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Backstory</h3>
              <p className="text-xs text-[hsl(var(--text-muted))] leading-relaxed">
                {(signal as any).backstory}
              </p>
            </div>
          )}

          {/* Enhanced Tips (if available) */}
          {(signal as any).tips && (signal as any).tips.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Tips</h3>
              <ul className="space-y-2">
                {(signal as any).tips.map((tip: string, index: number) => (
                  <li key={index} className="text-xs text-[hsl(var(--text-muted))] flex items-start gap-2">
                    <span className="text-[hsl(var(--primary))] mt-1">•</span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Token Metadata */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Token Metadata</h3>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[hsl(var(--text-muted))]">Token ID:</span>
                <p className="text-foreground font-mono">{tokenMetadata.tokenId}</p>
              </div>
              <div>
                <span className="text-[hsl(var(--text-muted))]">Rarity:</span>
                <p className="text-foreground">{tokenMetadata.rarity}</p>
              </div>
              <div>
                <span className="text-[hsl(var(--text-muted))]">Blockchain:</span>
                <p className="text-foreground">{tokenMetadata.blockchain}</p>
              </div>
              <div>
                <span className="text-[hsl(var(--text-muted))]">Mint Date:</span>
                <p className="text-foreground">{tokenMetadata.mintDate}</p>
              </div>
            </div>

            {/* Attributes */}
            <div>
              <span className="text-[hsl(var(--text-muted))] text-xs">Attributes:</span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {tokenMetadata.attributes.map((attr, index) => (
                  <div key={index} className="bg-[hsl(var(--muted))] p-2 rounded text-xs">
                    <div className="text-[hsl(var(--text-muted))]">{attr.trait}</div>
                    <div className="text-foreground font-medium">{attr.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Actions - Sticky at bottom */}
        <div className="space-y-2 mt-4 pt-4 border-t border-[hsl(var(--border))] shrink-0">
          {/* Select Button (if enabled) */}
          {showSelectButton && onSelect && (
            <Button
              onClick={() => {
                onSelect()
                onClose()
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-400 hover:from-orange-600 hover:to-yellow-500 text-black font-semibold"
              size="sm"
            >
              <Star className="w-4 h-4 mr-2" />
              Select This Signal
            </Button>
          )}
          
          {/* Action buttons row */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyId}
              className="flex-1"
            >
              <Copy className="w-3 h-3 mr-2" />
              Copy ID
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex-1"
            >
              <Share className="w-3 h-3 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                // For HCS recognition definitions, use the recognition topic
                const url = hasEnhancedMetadata || isHCSSignal 
                  ? `https://hashscan.io/testnet/topic/${(signal as any).topicId || RECOGNITION_TOPIC}`
                  : '#'
                
                if (url !== '#') {
                  window.open(url, '_blank')
                  toast.success('Opening HCS topic on HashScan')
                } else {
                  toast.info("This signal is not yet on-chain")
                }
              }}
            >
              <ExternalLink className="w-3 h-3 mr-2" />
              {hasEnhancedMetadata || isHCSSignal ? "View on HCS" : "View on Chain"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}