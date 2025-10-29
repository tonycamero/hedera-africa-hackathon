'use client'

import { useState, useEffect } from 'react'
import { magic } from '@/lib/magic'
import { useLens } from '@/lib/hooks/useLens'
import { getCatalogForLens, RecognitionType } from '@/lib/catalog/getCatalog'
import { LENSES } from '@/lib/lens/lensConfig'
import { Button, Input, Card } from '@/components/ui/kit'
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
 * Loads full 84-signal catalog from API.
 * Selected metadata is FROZEN permanently in the minted signal.
 */
export function CreateRecognitionModal({ to, onClose, onSuccess }: Props) {
  const { active: minterLens } = useLens()
  const [catalog, setCatalog] = useState<RecognitionType[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  
  const [selectedId, setSelectedId] = useState<string>()
  const [note, setNote] = useState('')
  const [mintAsNFT, setMintAsNFT] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const selectedType = catalog.find(t => t.id === selectedId)

  // Load catalog on mount and lens change
  useEffect(() => {
    let cancelled = false
    setCatalogLoading(true)
    
    getCatalogForLens(minterLens)
      .then(data => {
        if (!cancelled) {
          setCatalog(data)
          setCatalogLoading(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error('Failed to load catalog:', err)
          toast.error('Failed to load recognition types')
          setCatalogLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [minterLens])

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <Card className="bg-panel border-white/10 p-6 space-y-6">
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

        {/* Recognition type picker - Grid */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-white">
            Select Recognition {catalogLoading && <span className="text-xs text-white/50">(loading...)</span>}
          </label>
          <div className="grid grid-cols-3 gap-3 max-h-[40vh] overflow-y-auto">
            {catalogLoading ? (
              <div className="col-span-3 flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-white/50" />
              </div>
            ) : catalog.length === 0 ? (
              <div className="col-span-3 text-center text-white/50 py-8">
                No recognition types available
              </div>
            ) : (
              catalog.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedId(type.id)}
                  className={`p-4 rounded-lg border text-center transition ${
                    selectedId === type.id
                      ? 'border-white bg-white/10'
                      : 'border-white/20 hover:border-white/40 bg-panel'
                  }`}
                >
                  <div className="text-4xl mb-2">{type.emoji}</div>
                  <div className="text-white font-medium text-sm leading-tight">{type.label}</div>
                </button>
              ))
            )}
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
        <div className="flex items-start gap-3 p-3 rounded-lg border border-white/10">
          <input
            type="checkbox"
            id="mintAsNFT"
            checked={mintAsNFT}
            onChange={(e) => setMintAsNFT(e.target.checked)}
            className="mt-1"
          />
          <label htmlFor="mintAsNFT" className="flex-1 cursor-pointer text-sm">
            <div className="font-medium text-white">Mint as NFT (optional)</div>
            <div className="text-white/60 mt-1">
              Create a transferable token (+0.001 HBAR)
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
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
        <div className="text-xs text-white/50 text-center pt-3">
          Costs 0.01 TRST{mintAsNFT && ' + 0.001 HBAR'} • Permanent and immutable
        </div>
        </Card>
      </div>
    </div>
  )
}
