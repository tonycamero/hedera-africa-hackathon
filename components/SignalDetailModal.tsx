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
}

export function SignalDetailModal({ isOpen, onClose, signal }: SignalDetailModalProps) {
  if (!signal) return null

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

  // Check if this is an HCS recognition definition (has topicId and createdAt)
  const isHCSSignal = 'topicId' in signal && 'createdAt' in signal
  
  // Generate metadata for hashinal/token
  const tokenMetadata = {
    tokenId: `TM-${signal.category.toUpperCase()}-${signal.number.toString().padStart(3, '0')}`,
    collection: "TrustMesh Recognition Signals",
    creator: isHCSSignal ? "TrustMesh HCS" : "TrustMesh Protocol",
    mintDate: isHCSSignal ? new Date(signal.createdAt).toLocaleDateString() : "2024-01-15",
    blockchain: "Hedera",
    rarity: signal.rarity || 'Common',
    attributes: [
      { trait: "Category", value: categoryLabels[signal.category] },
      { trait: "Series", value: isHCSSignal ? "HCS Genesis" : "Genesis" },
      { trait: "Active Status", value: signal.isActive ? "Active" : "Inactive" },
      { trait: "Number", value: `#${signal.number}` },
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
      <DialogContent className="max-w-md mx-auto bg-card border border-[hsl(var(--border))]">
        <DialogHeader>
          <DialogTitle className="text-foreground text-center">
            Signal Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Large Signal Display */}
          <div className={`p-6 rounded-lg border-2 ${categoryColors[signal.category]} text-center`}>
            <div className="w-20 h-20 mx-auto mb-4 bg-card rounded-xl border border-[hsl(var(--border))] flex items-center justify-center text-4xl">
              {signal.icon}
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">{signal.name}</h2>
            <p className="text-[hsl(var(--text-secondary))] mb-4">
              {isHCSSignal && signal.extendedDescription ? signal.extendedDescription : signal.description}
            </p>
            
            <div className="flex justify-center gap-2">
              <Badge variant="outline" className="text-xs">
                {categoryLabels[signal.category]}
              </Badge>
              <Badge variant="outline" className="text-xs">
                #{signal.number}
              </Badge>
              {signal.isActive && (
                <Badge className="bg-[hsl(var(--neon-cyan))] text-[hsl(var(--background))] text-xs">
                  Active
                </Badge>
              )}
            </div>
          </div>

          {/* Token Metadata */}
          <div className="space-y-4">
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

          {/* Actions */}
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
                const url = isHCSSignal 
                  ? `https://hashscan.io/testnet/topic/${signal.topicId}`
                  : '#'
                if (url !== '#') {
                  window.open(url, '_blank')
                } else {
                  toast.info("This signal is not yet on-chain")
                }
              }}
            >
              <ExternalLink className="w-3 h-3 mr-2" />
              {isHCSSignal ? "View on Chain" : "View on Chain"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}