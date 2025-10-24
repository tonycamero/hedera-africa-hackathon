'use client'

import { useState } from 'react'
import type { UserTokens } from '@/lib/layout/token-types'
import { TrendingUp, X } from 'lucide-react'

export function TokenGatedProgress({ tokens }: { tokens?: UserTokens }) {
  const [isOpen, setIsOpen] = useState(false)
  
  if (!tokens) return null
  
  const collectorCurrent = tokens.nfts.length
  const collectorTarget = 10
  const leaderCurrent = tokens.trustLevel
  const leaderTarget = 9

  const bar = (current: number, target: number) => {
    const pct = Math.min(100, Math.round((current / target) * 100))
    return (
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-pri-500 to-boost-500 transition-all duration-500" 
          style={{ width: `${pct}%` }} 
        />
      </div>
    )
  }

  return (
    <>
      {/* Floating trigger button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full border border-pri-500/30 bg-panel/90 backdrop-blur-md flex items-center justify-center text-pri-500 shadow-lg hover:scale-110 hover:shadow-glow transition-all duration-300 animate-breathe-glow"
          aria-label="Open progress"
        >
          <TrendingUp className="w-5 h-5" />
        </button>
      )}
      
      {/* Slide-right drawer */}
      <aside 
        className={`fixed top-0 right-0 h-full w-80 z-50 bg-panel/95 backdrop-blur-xl border-l border-pri-500/20 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-pri-500/20">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-pri-500" />
            <h3 className="text-lg font-bold text-genz-text">Your Progress</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-genz-text-dim hover:text-genz-text transition-colors"
            aria-label="Close progress"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Collector Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💎</span>
                <span className="font-semibold text-genz-text">Collector</span>
              </div>
              <span className="text-sm font-mono text-genz-text-dim">{collectorCurrent}/{collectorTarget}</span>
            </div>
            {bar(collectorCurrent, collectorTarget)}
            <p className="text-xs text-genz-text-dim">
              Collect {collectorTarget - collectorCurrent} more NFTs to unlock Collector Mode
            </p>
          </div>
          
          {/* Civic Leader Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏛️</span>
                <span className="font-semibold text-genz-text">Civic Leader</span>
              </div>
              <span className="text-sm font-mono text-genz-text-dim">{leaderCurrent}/{leaderTarget}</span>
            </div>
            {bar(leaderCurrent, leaderTarget)}
            <p className="text-xs text-genz-text-dim">
              Add {leaderTarget - leaderCurrent} more to your inner circle to unlock Civic Leader Mode
            </p>
          </div>
          
          {/* Achievements hint */}
          <div className="mt-8 p-4 rounded-lg bg-pri-500/10 border border-pri-500/20">
            <div className="flex items-start gap-3">
              <span className="text-xl">✨</span>
              <div>
                <p className="text-sm font-medium text-pri-400 mb-1">Keep Building!</p>
                <p className="text-xs text-genz-text-dim">
                  Unlock special modes by collecting NFTs and growing your trust network.
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Backdrop overlay (tap to close) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
