'use client'

import type { UserTokens } from '@/lib/layout/token-types'

export function TokenGatedProgress({ tokens }: { tokens?: UserTokens }) {
  if (!tokens) return null
  const collectorCurrent = tokens.nfts.length
  const collectorTarget = 10
  const leaderCurrent = tokens.trustLevel
  const leaderTarget = 9

  const bar = (current: number, target: number) => {
    const pct = Math.min(100, Math.round((current / target) * 100))
    return (
      <div className="w-40 h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-white/70" style={{ width: `${pct}%` }} />
      </div>
    )
  }

  return (
    <aside className="fixed bottom-24 right-4 z-40 rounded-xl border border-white/15 bg-black/50 backdrop-blur-md px-3 py-2 text-xs text-white/90 shadow-lg">
      <div className="flex items-center gap-2 mb-1">
        <span className="opacity-70">Progress</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>💎 Collector</span>
          {bar(collectorCurrent, collectorTarget)}
        </div>
        <span className="tabular-nums">{collectorCurrent}/{collectorTarget}</span>
      </div>

      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>🏛️ Civic</span>
          {bar(leaderCurrent, leaderTarget)}
        </div>
        <span className="tabular-nums">{leaderCurrent}/{leaderTarget}</span>
      </div>
    </aside>
  )
}
