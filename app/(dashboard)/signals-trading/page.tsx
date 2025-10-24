'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'

// Disable static generation for this page (uses client-side data)
export const dynamic = 'force-dynamic'
import { SignalAsset, SignalType } from '@/lib/types/signals-collectible'
import { GlassTradingCard } from '@/components/signals/GlassTradingCard'
import { TradingSpotlight } from '@/components/signals/TradingSpotlight'
import { MobileTradingCard } from '@/components/signals/MobileTradingCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Database, Zap, Sparkles } from 'lucide-react'
import '@/styles/glass-cards.css'

function SignalsTradingViewInner() {
  const [types, setTypes] = useState<SignalType[]>([])
  const [owned, setOwned] = useState<SignalAsset[]>([])
  const [selected, setSelected] = useState<{ asset: SignalAsset; type: SignalType } | null>(null)
  const [loading, setLoading] = useState(true)

  // Default to Alex Chen who has real HCS recognition data
  const userAddress = "tm-alex-chen"

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Fetch signal types
      const typesResponse = await fetch('/api/signal-types')
      if (typesResponse.ok) {
        const typesData = await typesResponse.json()
        setTypes(typesData.types || [])
      }

      // Web3-style client-side HCS asset collection query
      const { hcsAssetCollection } = await import('@/lib/services/HCSAssetCollectionService')
      const assets = await hcsAssetCollection.getUserCollection(userAddress)
      
      setOwned(assets)
      console.log(`[TradingView] ✅ Loaded ${assets.length} assets from HCS`)
    } catch (error) {
      console.error('Failed to load trading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const typeById = useMemo(() => 
    Object.fromEntries(types.map(t => [t.type_id, t])), 
    [types]
  )

  // Default select newest on first load (for desktop)
  useEffect(() => {
    if (!selected && owned.length && types.length) {
      const asset = owned[0]
      const type = typeById[asset.type_id]
      if (type) {
        setSelected({ asset, type })
      }
    }
  }, [owned, types, selected, typeById])

  // Default select newest on first load
  useEffect(() => {
    if (!selected && owned.length && types.length) {
      const asset = owned[0]
      const type = typeById[asset.type_id]
      if (type) {
        setSelected({ asset, type })
      }
    }
  }, [owned, types, selected, typeById])

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(120%_80%_at_10%_0%,#0d0e12_0%,#050509_60%,#030306_100%)] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🎴</div>
          <div className="text-xl mb-2">Loading collection...</div>
          <div className="text-sm text-white/60">Fetching your signal cards</div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile View */}
      <div className="lg:hidden min-h-screen bg-ink">
        <div className="max-w-md mx-auto px-4 py-4 space-y-6">
          {/* Mobile Header */}
          <div className="text-center">
            <div className="flex items-center justify-between mb-4">
              <Button
                onClick={() => window.location.href = '/signals'}
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white"
              >
                ← Back
              </Button>
              <Button
                onClick={() => window.location.href = '/signals'}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10 flex items-center gap-2"
              >
                <Sparkles className="h-3 w-3" />
                Mint New
              </Button>
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">My Collection</h1>
            <div className="flex items-center justify-center gap-2">
              <span className="text-white/60 text-sm">{owned.length} signal tokens</span>
            </div>
          </div>

          {/* Mobile Trading Cards Stack */}
          <div className="space-y-4">
            {owned.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <div className="text-xl text-white mb-2">No signals yet</div>
                <div className="text-sm text-white/60 mb-4">
                  Earn signals when others recognize your achievements
                </div>
                <Button
                  onClick={() => window.location.href = '/signals'}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Start Minting Signals
                </Button>
              </div>
            ) : (
              owned.map((asset) => {
                const type = typeById[asset.type_id]
                if (!type) return null
                
                return (
                  <MobileTradingCard key={asset.asset_id} asset={asset} type={type} />
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Desktop View - 1/3 | 2/3 Trading Layout */}
      <div className="hidden lg:block min-h-screen bg-[radial-gradient(120%_80%_at_10%_0%,#0d0e12_0%,#050509_60%,#030306_100%)] text-white">
        {/* Desktop Header */}
        <header className="sticky top-0 z-10 border-b border-white/10 bg-black/40 backdrop-blur px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">My Signal Collection</div>
              <div className="text-xs text-white/60 flex items-center gap-2">
                <span>{owned.length} tokens • Earned, owned, collectible</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => window.location.href = '/signals'}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10 flex items-center gap-2"
              >
                <Sparkles className="h-3 w-3" />
                Mint New
              </Button>
            </div>
          </div>
        </header>

        {/* 1/3 | 2/3 Desktop Grid Layout */}
        <div className="grid grid-cols-3 gap-0 h-[calc(100vh-88px)]">
          {/* Left Rail (1/3) - Collection Stack */}
          <aside className="col-span-1 border-r border-white/10 bg-black/20">
            <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
              <div className="text-sm text-white/80 font-medium">Collection</div>
              <div className="text-xs text-white/50">Tap a card</div>
            </div>

            <div className="h-full overflow-y-auto collection-rail px-4 pb-6 space-y-4 pt-4">
              {owned.map((asset) => {
                const type = typeById[asset.type_id]
                if (!type) return null
                
                const active = selected?.asset.asset_id === asset.asset_id
                
                return (
                  <button
                    key={asset.asset_id}
                    onClick={() => setSelected({ asset, type })}
                    className={`w-full text-left transition-transform duration-200 ${
                      active ? 'scale-[1.02]' : 'hover:scale-[1.01]'
                    }`}
                  >
                    <GlassTradingCard asset={asset} type={type} active={active} />
                  </button>
                )
              })}
              
              {owned.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📦</div>
                  <div className="text-sm text-white/70 mb-2">No signals yet</div>
                  <div className="text-xs text-white/50">
                    Earn signals when others recognize your achievements
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Right Spotlight (2/3) - Big Card View */}
          <main className="col-span-2">
            <TradingSpotlight
              asset={selected?.asset || null}
              type={selected?.type || null}
            />
          </main>
        </div>
      </div>
    </>
  )
}

export default function SignalsTradingView() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[radial-gradient(120%_80%_at_10%_0%,#0d0e12_0%,#050509_60%,#030306_100%)] text-white flex items-center justify-center">
        <div className="text-6xl animate-pulse">🎴</div>
      </div>
    }>
      <SignalsTradingViewInner />
    </Suspense>
  )
}
