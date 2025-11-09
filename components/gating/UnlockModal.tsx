'use client'

import { useEffect, useState } from 'react'

// dynamic import so SSR never touches window
const confetti = () => import('canvas-confetti').then(m => m.default)

type UnlockKind = 'collector' | 'civic-leader' | 'premium' | 'vip'

const TITLES: Record<UnlockKind, string> = {
  collector: '🎉 Collector Mode Unlocked!',
  'civic-leader': '⭐ Civic Leader Unlocked!',
  premium: '✨ Premium Unlocked!',
  vip: '👑 VIP Unlocked!'
}

const PERKS: Record<UnlockKind, string[]> = {
  collector: [
    'Collection showcase & stats',
    'Collector badge on profile',
    'Priority in public gallery'
  ],
  'civic-leader': [
    'Community tools & leader badge',
    'Campaign creation access',
    'Civic dashboards'
  ],
  premium: [
    'Premium themes & cards',
    'Advanced analytics',
    'Early feature access'
  ],
  vip: [
    'VIP dashboard & gold chrome',
    'Early alpha access',
    'Concierge support'
  ]
}

export function UnlockModal({
  showFor
}: {
  showFor: UnlockKind | null
}) {
  const [open, setOpen] = useState(Boolean(showFor))

  useEffect(() => {
    setOpen(Boolean(showFor))
    if (showFor) {
      confetti().then(fire => {
        fire({ spread: 70, startVelocity: 45, scalar: 0.9, particleCount: 100, origin: { y: 0.3 } })
        setTimeout(() => fire({ spread: 60, startVelocity: 35, scalar: 0.9, particleCount: 80, origin: { y: 0.4 } }), 250)
      }).catch(() => {})
    }
  }, [showFor])

  if (!open || !showFor) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      {/* scrim */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      {/* modal */}
      <div className="relative z-10 w-[92%] max-w-sm rounded-2xl border border-white/15 bg-neutral-900/90 p-4 text-white shadow-2xl">
        <div className="text-lg font-semibold mb-2">{TITLES[showFor]}</div>
        <ul className="list-disc pl-5 space-y-1 text-sm text-white/90">
          {PERKS[showFor].map(p => <li key={p}>{p}</li>)}
        </ul>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setOpen(false)}
            className="rounded-full bg-white/15 px-4 py-1.5 text-sm hover:bg-white/25 transition"
          >
            Explore
          </button>
        </div>
      </div>
    </div>
  )
}
