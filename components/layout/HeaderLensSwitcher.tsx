'use client'

import { useState, useEffect } from 'react'
import { LENSES, type LensKey, ENABLE_SWITCHER } from '@/lib/lens/lensConfig'
import { magic } from '@/lib/magic'
import { LensUnlockModal } from '@/components/LensUnlockModal'

export function HeaderLensSwitcher() {
  // Rollback: hide switcher in single-lens mode
  if (!ENABLE_SWITCHER) return null
  const [active, setActive] = useState<LensKey>('base')
  const [owned, setOwned] = useState<LensKey[]>(['base'])
  const [open, setOpen] = useState(false)
  const [pendingUnlock, setPendingUnlock] = useState<LensKey | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch current lens state
  useEffect(() => {
    fetchLensState()
  }, [])

  const fetchLensState = async () => {
    try {
      const token = await magic?.user.getIdToken()
      if (!token) return

      const res = await fetch('/api/profile/get-lens', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.active) setActive(data.active)
        if (data.owned) setOwned(data.owned)
      }
    } catch (err) {
      console.error('[HeaderLensSwitcher] Failed to fetch lens state:', err)
    } finally {
      setLoading(false)
    }
  }

  const selectLens = async (lens: LensKey) => {
    // Check if owned
    if (!owned.includes(lens)) {
      setPendingUnlock(lens)
      return
    }

    // Switch to owned lens
    try {
      const token = await magic?.user.getIdToken()
      if (!token) return

      const res = await fetch('/api/lens/set-lens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ lens })
      })

      if (res.ok) {
        setActive(lens)
        setOpen(false)
        // Refresh page to apply new lens theme
        window.location.reload()
      }
    } catch (err) {
      console.error('[HeaderLensSwitcher] Failed to switch lens:', err)
    }
  }

  const onUnlocked = async () => {
    setPendingUnlock(null)
    await fetchLensState()
    window.location.reload()
  }

  if (loading) return null

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="px-3 py-2 rounded bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition"
        >
          {LENSES[active].emoji} {LENSES[active].label}
        </button>

        {open && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setOpen(false)}
            />
            
            {/* Dropdown menu */}
            <div className="absolute right-0 mt-2 w-64 rounded-lg bg-panel border border-white/10 p-2 shadow-2xl z-50">
              <div className="text-xs text-white/60 uppercase font-semibold px-3 py-2">
                Select Lens
              </div>
              {(Object.keys(LENSES) as LensKey[]).map((k) => {
                const lens = LENSES[k]
                const isActive = active === k
                const isOwned = owned.includes(k)
                
                return (
                  <button
                    key={k}
                    onClick={() => selectLens(k)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center justify-between
                      ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{lens.emoji}</span>
                      <span className="font-medium">{lens.label}</span>
                    </span>
                    {!isOwned && (
                      <span className="text-xs text-white/50">🔒 {lens.price} TRST</span>
                    )}
                    {isActive && (
                      <span className="text-xs text-purple-400">✓</span>
                    )}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {pendingUnlock && (
        <LensUnlockModal
          lens={pendingUnlock}
          onClose={() => setPendingUnlock(null)}
          onUnlocked={onUnlocked}
        />
      )}
    </>
  )
}
