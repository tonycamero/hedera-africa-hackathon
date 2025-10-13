"use client"

import { useState, useEffect } from 'react'
import { Wallet, Filter, Grid, List, TrendingUp, Database, Zap, Sparkles, Eye, Share2 } from 'lucide-react'
import { SignalAsset } from '@/lib/types/signals-collectible'
import { SignalCard } from '@/components/signals/SignalCard'
import { MobileTradingCard } from '@/components/signals/MobileTradingCard'
import { getRarityRank, RARITY_ORDER } from '@/lib/ui/signal-rarities'
import { useDemoMode } from '@/lib/hooks/useDemoMode'
import { GenZButton, GenZCard, GenZHeading, GenZText, GenZChip, genZClassNames } from '@/components/ui/genz-design-system'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getSessionId } from '@/lib/session'
import { 
  ProfessionalLoading, 
  ProfessionalError, 
  ContextualGuide,
  NetworkStatusIndicator,
  PullToRefresh 
} from '@/components/enhancements/professional-ux-enhancements'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function GenZWalletPage() {
  const [signals, setSignals] = useState<SignalAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortBy, setSortBy] = useState<'recent' | 'rarity' | 'category'>('recent')
  const [filterRarity, setFilterRarity] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('collection')
  const [showFirstTimeGuide, setShowFirstTimeGuide] = useState(false)
  const { getDataSourceLabel, getDataSourceBadgeColor } = useDemoMode()
  const router = useRouter()

  const userAddress = getSessionId() || 'tm-alex-chen'

  const loadSignals = async () => {
    try {
      if (!isRefreshing) setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/signals/wallet?owner=${userAddress}`)
      if (response.ok) {
        const data = await response.json()
        setSignals(data.assets || [])
        
        // Show first-time guide if no signals
        if ((data.assets || []).length === 0) {
          setShowFirstTimeGuide(true)
        }
        
        console.log(`[GenZWallet] ✅ Loaded ${(data.assets || []).length} signals`)
      } else {
        throw new Error('Failed to load signals')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load your collection'
      console.error('[GenZWallet] ❌ Error:', error)
      setError(message)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadSignals()
  }

  useEffect(() => {
    loadSignals()
  }, [userAddress])

  const filteredAndSortedSignals = signals
    .filter(signal => {
      if (filterRarity !== 'all' && signal.metadata.rarity !== filterRarity) return false
      if (filterCategory !== 'all' && signal.metadata.category !== filterCategory) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
        case 'rarity':
          return getRarityRank(b.metadata.rarity) - getRarityRank(a.metadata.rarity)
        case 'category':
          return a.metadata.category.localeCompare(b.metadata.category)
        default:
          return 0
      }
    })

  const categories = [...new Set(signals.map(s => s.metadata.category))]
  const rarityStats = RARITY_ORDER.map(rarity => ({
    rarity,
    count: signals.filter(s => s.metadata.rarity === rarity).length
  })).filter(stat => stat.count > 0)

  const handleShareCollection = async () => {
    const shareText = `Check out my TrustMesh signal collection! I've collected ${signals.length} recognition tokens across ${categories.length} categories. 🔥`
    const shareUrl = `${window.location.origin}/u/${userAddress}`
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My TrustMesh Collection',
          text: shareText,
          url: shareUrl
        })
      } else {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
        toast.success('Collection link copied! Share it to show off your achievements ⚡')
      }
    } catch (error) {
      console.warn('Share failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-ink">
      <NetworkStatusIndicator />
      
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="max-w-md mx-auto px-4 py-4 space-y-6">
          {/* Header */}
          <div className="text-center">
            <GenZHeading level={1} className="flex items-center justify-center gap-2 mb-2">
              <Wallet className="w-6 h-6 text-pri-500 animate-breathe-glow" />
              My Collection
            </GenZHeading>
            
            <div className="flex items-center justify-center gap-2 mb-4">
              <GenZText size="sm" dim>{signals.length} signals collected</GenZText>
              <GenZChip variant="boost" className="text-xs">
                {getDataSourceLabel('wallet') === 'Mock Data' ? <Database className="w-3 h-3 mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
                {getDataSourceLabel('wallet')}
              </GenZChip>
            </div>
          </div>

          {/* First Time Guide */}
          {showFirstTimeGuide && (
            <ContextualGuide
              title="Start Your Collection! 🎯"
              message="Earn recognition tokens by having friends acknowledge your achievements. Your collection shows your reputation and skills."
              tip="Create signals for others to build relationships and earn signals back!"
              actionText="Create First Signal"
              onAction={() => router.push('/signals')}
              onDismiss={() => setShowFirstTimeGuide(false)}
              showOnce
              storageKey="first-wallet"
            />
          )}

          {/* Error State */}
          {error && (
            <ProfessionalError
              message={error}
              onAction={handleRefresh}
              actionText="Try Again"
              variant="error"
              dismissible
              onDismiss={() => setError(null)}
            />
          )}

          {/* Loading State */}
          {loading ? (
            <ProfessionalLoading 
              variant="initial"
              message="Loading your collection..."
              submessage="Syncing signals from HCS"
            />
          ) : (
            <div className="space-y-4">
              {/* Stats Overview */}
              <GenZCard variant="glass" className="p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-boost-400 mb-1">{signals.length}</div>
                    <GenZText size="sm" dim>Total Signals</GenZText>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pri-400 mb-1">{categories.length}</div>
                    <GenZText size="sm" dim>Categories</GenZText>
                  </div>
                </div>
                
                <div className="flex justify-center gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-sec-400 mb-1">{rarityStats.length}</div>
                    <GenZText size="sm" dim>Rarities</GenZText>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-accent-400 mb-1">
                      {rarityStats.length > 0 ? rarityStats[rarityStats.length - 1].rarity : 'None'}
                    </div>
                    <GenZText size="sm" dim>Rarest</GenZText>
                  </div>
                </div>

                {signals.length > 0 && (
                  <div className="flex justify-center mt-4">
                    <GenZButton
                      size="sm"
                      variant="boost"
                      onClick={handleShareCollection}
                      className="animate-pulse-glow"
                    >
                      <Share2 className="w-3 h-3 mr-1" />
                      Share Collection
                    </GenZButton>
                  </div>
                )}
              </GenZCard>

              {/* Quick Actions */}
              {signals.length > 0 && (
                <GenZCard variant="glass" className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <GenZButton 
                      variant="primary" 
                      onClick={() => router.push('/signals-trading')}
                      className="flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Full View
                    </GenZButton>
                    
                    <GenZButton 
                      variant="boost" 
                      onClick={() => router.push('/signals')}
                      className="flex items-center justify-center gap-2"
                      glow
                    >
                      <Sparkles className="w-4 h-4" />
                      Create More
                    </GenZButton>
                  </div>
                </GenZCard>
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 bg-panel border border-genz-border">
                  <TabsTrigger 
                    value="collection" 
                    className="data-[state=active]:bg-pri-500/20 data-[state=active]:text-pri-500"
                  >
                    Collection
                  </TabsTrigger>
                  <TabsTrigger 
                    value="stats" 
                    className="data-[state=active]:bg-pri-500/20 data-[state=active]:text-pri-500"
                  >
                    Stats
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="collection" className="space-y-4">
                  {/* Filters */}
                  {signals.length > 3 && (
                    <GenZCard variant="glass" className="p-4">
                      <div className="flex flex-wrap gap-3 items-center">
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-pri-500" />
                          <GenZText size="sm" className="font-medium">Filters:</GenZText>
                        </div>
                        
                        <Select value={sortBy} onValueChange={(value: 'recent' | 'rarity' | 'category') => setSortBy(value)}>
                          <SelectTrigger className="w-28 h-8 bg-panel border-genz-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="recent">Recent</SelectItem>
                            <SelectItem value="rarity">Rarity</SelectItem>
                            <SelectItem value="category">Category</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {categories.length > 1 && (
                          <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger className="w-32 h-8 bg-panel border-genz-border">
                              <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              {categories.map(category => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      
                      {(filterRarity !== 'all' || filterCategory !== 'all') && (
                        <GenZButton 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setFilterRarity('all')
                            setFilterCategory('all')
                          }}
                          className="mt-2"
                        >
                          Clear Filters
                        </GenZButton>
                      )}
                    </GenZCard>
                  )}

                  {/* Signal Cards */}
                  {filteredAndSortedSignals.length > 0 ? (
                    <div className="space-y-3">
                      {filteredAndSortedSignals.map((signal) => (
                        <MobileTradingCard 
                          key={signal.asset_id} 
                          asset={signal}
                          type={null} // Type info is embedded in the asset
                        />
                      ))}
                    </div>
                  ) : signals.length === 0 ? (
                    <GenZCard variant="glass" className="p-8 text-center">
                      <div className="text-6xl mb-4 animate-float">📦</div>
                      <GenZHeading level={3} className="mb-2">No Signals Yet</GenZHeading>
                      <GenZText className="mb-4 max-w-xs mx-auto">
                        Start earning recognition tokens by connecting with friends and creating signals for others!
                      </GenZText>
                      <div className="space-y-2">
                        <GenZButton variant="boost" glow onClick={() => router.push('/signals')}>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Create First Signal
                        </GenZButton>
                        <GenZButton variant="ghost" onClick={() => router.push('/contacts')}>
                          Connect with Friends
                        </GenZButton>
                      </div>
                    </GenZCard>
                  ) : (
                    <GenZCard variant="glass" className="p-6 text-center">
                      <div className="text-4xl mb-3">🔍</div>
                      <GenZText>No signals match your filters</GenZText>
                      <GenZButton 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setFilterRarity('all')
                          setFilterCategory('all')
                        }}
                        className="mt-2"
                      >
                        Clear Filters
                      </GenZButton>
                    </GenZCard>
                  )}
                </TabsContent>

                <TabsContent value="stats" className="space-y-4">
                  {signals.length > 0 ? (
                    <>
                      {/* Rarity Distribution */}
                      <GenZCard variant="glass" className="p-4">
                        <GenZHeading level={4} className="mb-4">Rarity Breakdown</GenZHeading>
                        <div className="space-y-3">
                          {rarityStats.map(({ rarity, count }) => (
                            <div key={rarity} className="flex items-center justify-between">
                              <GenZText className="font-medium">{rarity}</GenZText>
                              <div className="flex items-center gap-3">
                                <GenZChip variant="neutral" className="text-xs">{count}</GenZChip>
                                <div className="w-20 bg-genz-border rounded-full h-2">
                                  <div 
                                    className="h-2 bg-gradient-to-r from-pri-500 to-boost-500 rounded-full" 
                                    style={{ width: `${(count / signals.length) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </GenZCard>

                      {/* Category Stats */}
                      <GenZCard variant="glass" className="p-4">
                        <GenZHeading level={4} className="mb-4">Top Categories</GenZHeading>
                        <div className="space-y-2">
                          {categories.slice(0, 5).map((category) => {
                            const count = signals.filter(s => s.metadata.category === category).length
                            return (
                              <div key={category} className="flex items-center justify-between py-2">
                                <GenZText>{category}</GenZText>
                                <GenZChip variant="boost" className="text-xs">{count}</GenZChip>
                              </div>
                            )
                          })}
                        </div>
                      </GenZCard>

                      {/* Collection Value */}
                      <GenZCard variant="glass" className="p-4 text-center">
                        <div className="text-4xl mb-2">💎</div>
                        <GenZHeading level={4} className="mb-2">Collection Power</GenZHeading>
                        <GenZText size="sm" dim className="mb-4">
                          Your signals represent real achievements and peer recognition
                        </GenZText>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xl font-bold text-boost-400">{signals.length}</div>
                            <GenZText size="sm" dim>Total Earned</GenZText>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-pri-400">🔥</div>
                            <GenZText size="sm" dim>Reputation</GenZText>
                          </div>
                        </div>
                      </GenZCard>
                    </>
                  ) : (
                    <GenZCard variant="glass" className="p-8 text-center">
                      <div className="text-5xl mb-4">📊</div>
                      <GenZText>No stats yet - start collecting signals!</GenZText>
                    </GenZCard>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </PullToRefresh>
    </div>
  )
}