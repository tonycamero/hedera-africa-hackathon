'use client'

import { useState, useEffect } from 'react'
import { SignalCard } from '@/components/signals/SignalCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { SignalAsset } from '@/lib/types/signals-collectible'
import { getRarityRank, RARITY_ORDER } from '@/lib/ui/signal-rarities'
import { useDemoMode } from '@/lib/hooks/useDemoMode'
import { Wallet, Filter, Grid, List, TrendingUp, Database, Zap } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function WalletPage() {
  const [signals, setSignals] = useState<SignalAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'recent' | 'rarity' | 'category'>('recent')
  const [filterRarity, setFilterRarity] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [dataSource, setDataSource] = useState<string>('Unknown')
  const { getDataSourceLabel, getDataSourceBadgeColor } = useDemoMode()

  // Mock user address - in real app this would come from auth/wallet connection
  const userAddress = "0.0.123456"

  useEffect(() => {
    loadSignals()
  }, [])

  const loadSignals = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/signals/wallet?owner=${userAddress}`)
      if (response.ok) {
        const data = await response.json()
        setSignals(data.assets || [])
        setDataSource(data.dataSource || 'Unknown')
      } else {
        console.error('Failed to load signals')
      }
    } catch (error) {
      console.error('Error loading signals:', error)
    } finally {
      setLoading(false)
    }
  }

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

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto p-8">
        <div className="flex items-center gap-3 mb-8">
          <Wallet className="h-8 w-8" />
          <h1 className="text-3xl font-bold">My Wallet</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-32 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-md mx-auto px-4 py-4 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Wallet className="h-8 w-8" />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold">My Wallet</h1>
              <Badge className={`${getDataSourceBadgeColor('wallet')} flex items-center gap-1`}>
                {dataSource === 'Mock Data' ? <Database className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                {dataSource}
              </Badge>
            </div>
            <p className="text-gray-600">{signals.length} collectible signals</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={sortBy} onValueChange={(value: 'recent' | 'rarity' | 'category') => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent First</SelectItem>
              <SelectItem value="rarity">By Rarity</SelectItem>
              <SelectItem value="category">By Category</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="collection" className="space-y-6">
        <TabsList>
          <TabsTrigger value="collection">Collection</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="collection" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={filterRarity} onValueChange={setFilterRarity}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Rarity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rarities</SelectItem>
                {RARITY_ORDER.map(rarity => (
                  <SelectItem key={rarity} value={rarity}>{rarity}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {(filterRarity !== 'all' || filterCategory !== 'all') && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setFilterRarity('all')
                  setFilterCategory('all')
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Signal Cards */}
          {filteredAndSortedSignals.length > 0 ? (
            <div className="space-y-4">
              {filteredAndSortedSignals.map((signal) => (
                <SignalCard 
                  key={signal.asset_id} 
                  signal={signal} 
                  compact={viewMode === 'list'}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Wallet className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No signals found</h3>
              <p className="text-gray-600 mb-4">
                {signals.length === 0 
                  ? "You haven't collected any signals yet. Start engaging with your network to earn recognition tokens!"
                  : "No signals match your current filters. Try adjusting them to see more results."
                }
              </p>
              {signals.length === 0 && (
                <Button onClick={() => window.location.href = '/signals'}>
                  Explore Signals
                </Button>
              )}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Total Signals */}
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Wallet className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Signals</p>
                  <p className="text-2xl font-bold">{signals.length}</p>
                </div>
              </div>
            </Card>

            {/* Unique Categories */}
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-full">
                  <Grid className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Categories</p>
                  <p className="text-2xl font-bold">{categories.length}</p>
                </div>
              </div>
            </Card>

            {/* Rarest Signal */}
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rarest Signal</p>
                  <p className="text-2xl font-bold">
                    {rarityStats.length > 0 ? rarityStats[rarityStats.length - 1].rarity : 'None'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Collection Value */}
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <span className="text-xl">💎</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estimated Value</p>
                  <p className="text-2xl font-bold">🔥</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Rarity Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Rarity Distribution</h3>
            <div className="space-y-3">
              {rarityStats.map(({ rarity, count }) => (
                <div key={rarity} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{rarity}</span>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{count}</Badge>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 bg-blue-500 rounded-full" 
                        style={{ width: `${(count / signals.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}