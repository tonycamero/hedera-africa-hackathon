'use client'

import { useState } from 'react'
import { magic } from '@/lib/magic'
import { useLens } from '@/lib/hooks/useLens'
import { getCatalogForLens, RecognitionType } from '@/lib/catalog/getCatalog'
import { Button, Card, Input } from '@/components/ui/kit'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type Props = {
  to: { accountId: string; handle?: string }
  onClose: () => void
  onSuccess?: () => void
}

/**
 * Create recognition modal
 * 
 * Shows recognition types filtered by minter's active lens.
 * Selected metadata is FROZEN permanently in the minted signal.
 */
export function CreateRecognitionModal({ to, onClose, onSuccess }: Props) {
  const { active: minterLens } = useLens()
  const catalog = getCatalogForLens(minterLens)
  
  const [selectedId, setSelectedId] = useState<string>()
  const [note, setNote] = useState('')
  const [mintAsNFT, setMintAsNFT] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const selectedType = catalog.find(t => t.id === selectedId)

  const handleSubmit = async () => {
    if (!selectedType || submitting) return

    setSubmitting(true)
    try {
      const token = await magic?.user.getIdToken()
      if (!token) throw new Error('Not authenticated')

      const res = await fetch('/api/recognition/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          label: selectedType.label,
          emoji: selectedType.emoji,
          description: selectedType.description,
          lens: minterLens,
          to,
          note: note.trim() || undefined,
          mintAsNFT
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create recognition')
      }

      toast.success('Recognition sent', {
        description: `${selectedType.emoji} ${selectedType.label} sent to ${to.handle || to.accountId}`
      })

      onSuccess?.()
      onClose()
    } catch (err: any) {
      console.error('[CreateRecognitionModal] Error:', err)
      toast.error('Failed to send recognition', {
        description: err.message
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-lg bg-panel border-white/10 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Send Recognition</h2>
            <p className="text-sm text-white/70 mt-1">
              to {to.handle || to.accountId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lens indicator */}
        <div className="text-xs text-white/50 border-l-2 border-white/20 pl-3">
          Using {minterLens} lens vocabulary
        </div>

        {/* Recognition type picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Select Recognition Type</label>
          <div className="grid grid-cols-1 gap-2">
            {catalog.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedId(type.id)}
                className={`text-left p-3 rounded-lg border transition ${
                  selectedId === type.id
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/10 hover:border-white/30 bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{type.emoji}</span>
                  <div className="flex-1">
                    <div className="font-medium text-white">{type.label}</div>
                    <div className="text-xs text-white/60">{type.description}</div>
                  </div>
                  {selectedId === type.id && (
                    <div className="text-purple-400 text-sm">✓</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Optional note */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">
            Add a personal message (optional)
          </label>
          <Input
            type="text"
            placeholder="e.g., Thanks for your help today!"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            className="w-full"
          />
          <div className="text-xs text-white/50 text-right">
            {note.length}/200
          </div>
        </div>

        {/* NFT mint option */}
        <div className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-white/5">
          <input
            type="checkbox"
            id="mintAsNFT"
            checked={mintAsNFT}
            onChange={(e) => setMintAsNFT(e.target.checked)}
            className="mt-1"
          />
          <label htmlFor="mintAsNFT" className="flex-1 cursor-pointer">
            <div className="text-sm font-medium text-white">Mint as NFT (transferable asset)</div>
            <div className="text-xs text-white/60 mt-1">
              Create a transferable token that can be shown in wallets and marketplaces.
              Costs additional 0.001 HBAR for minting.
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedType || submitting}
            className="flex-1"
          >
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Send Recognition
          </Button>
        </div>

        {/* Info */}
        <div className="text-xs text-white/40 text-center pt-2">
          Costs 0.01 TRST{mintAsNFT && ' + 0.001 HBAR (NFT mint)'} • Recognition is permanent and immutable
        </div>
      </Card>
    </div>
  )
}
