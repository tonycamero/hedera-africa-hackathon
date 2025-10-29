'use client'

import { useState } from 'react'
import { LENSES, LensKey, ENABLE_LENS_UNLOCK } from '@/lib/lens/lensConfig'
import { useLens } from '@/lib/hooks/useRecognitionSignals'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { toast } from 'sonner'

type Props = {
  open: boolean
  onClose: () => void
}

export default function LensUnlockModal({ open, onClose }: Props) {
  // Rollback: disable lens unlock UI
  if (!ENABLE_LENS_UNLOCK) return null
  const { active, owned, unlockAndSwitch, setActiveLens } = useLens()
  const [pending, setPending] = useState<LensKey | null>(null)

  if (!open) return null

  const choices = (Object.keys(LENSES) as LensKey[])

  const handleSelect = async (lens: LensKey) => {
    try {
      setPending(lens)
      if (owned.includes(lens)) {
        await setActiveLens(lens)
        toast.success(`Lens switched to ${LENSES[lens].label}`)
      } else {
        const res = await unlockAndSwitch(lens)
        if (res?.owned) {
          toast.success(`Lens switched to ${LENSES[lens].label}`)
        } else {
          toast.success(`Unlocked + switched to ${LENSES[lens].label}`)
        }
      }
      onClose()
    } catch (e: any) {
      toast.error(e?.message || 'Unable to switch lens')
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-lg bg-panel border-white/10">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-white font-semibold">Choose your lens</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {choices.map((key) => {
            const lens = LENSES[key]
            const isActive = key === active
            const isOwned = owned.includes(key)
            const isBusy = pending === key

            return (
              <Card key={key} className="p-4 bg-panel/60 border-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg text-white flex items-center gap-2">
                      <span>{lens.emoji}</span>
                      <span>{lens.label}</span>
                    </div>
                    <p className="text-white/60 text-sm mt-1">{lens.description}</p>
                  </div>
                  {isActive && (
                    <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/80">Active</span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-white/70 text-sm">
                    {isOwned ? 'Owned' : `Unlock: ${lens.priceTRST.toFixed(2)} TRST`}
                  </div>
                  <Button
                    onClick={() => handleSelect(key)}
                    disabled={isBusy || (isActive && isOwned)}
                    className="min-w-[110px]"
                  >
                    {isBusy
                      ? 'Processing…'
                      : isOwned
                        ? (isActive ? 'Current' : 'Switch')
                        : 'Unlock & Switch'}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="p-4 border-t border-white/10 text-xs text-white/60">
          Your first lens is free. Unlocking additional lenses costs a small TRST top-up.
        </div>
      </Card>
    </div>
  )
}
