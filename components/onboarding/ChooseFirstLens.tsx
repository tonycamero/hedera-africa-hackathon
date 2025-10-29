'use client'

import { useState } from 'react'
import { LENSES, LensKey, DEFAULT_LENS } from '@/lib/lens/lensConfig'
import { magic } from '@/lib/magic'
import { Card } from '@/components/ui/kit'

type Props = {
  onSelected: (lens: LensKey) => void
  className?: string
}

export default function ChooseFirstLens({ onSelected, className }: Props) {
  const [choice, setChoice] = useState<LensKey>(DEFAULT_LENS)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (busy) return
    setBusy(true)
    try {
      const token = await magic?.user.getIdToken()
      if (!token) throw new Error('Not authenticated')
      
      const res = await fetch('/api/lens/init-first', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ lens: choice }),
      })
      
      if (!res.ok) throw new Error('Failed to set initial lens')
      
      onSelected(choice)
    } catch (err) {
      console.error('[ChooseFirstLens] Error:', err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className={`p-6 bg-panel border-white/10 ${className || ''}`}>
      <div className="text-center mb-4">
        <h2 className="text-xl font-semibold text-white">Choose your first lens</h2>
        <p className="text-white/70 text-sm mt-1">You can unlock additional lenses later.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(Object.keys(LENSES) as LensKey[]).map((k) => {
          const lens = LENSES[k]
          const selected = choice === k
          
          return (
            <button
              key={k}
              type="button"
              onClick={() => setChoice(k)}
              className={`text-left rounded-lg border px-4 py-3 transition
                  ${selected ? 'border-white/60 bg-white/5' : 'border-white/10 hover:border-white/30'}`}
            >
              <div className="text-2xl mb-2">{lens.emoji}</div>
              <div className="text-white font-medium">{lens.label}</div>
              <div className="text-white/60 text-sm mt-1">{lens.description}</div>
            </button>
          )
        })}
      </div>

      <div className="mt-5 flex justify-end">
        <button
          onClick={submit}
          disabled={busy}
          className="px-6 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {busy ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </Card>
  )
}
