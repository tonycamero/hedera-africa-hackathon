'use client'

/**
 * Example component demonstrating Step 4 performance patterns:
 * - useSignals hook with selectors
 * - Virtualized lists for performance
 * - Batched updates
 * - useTransition for heavy operations
 * - StateShell for consistent UX
 * - Performance monitoring
 */

import React, { useState, useTransition, useMemo, useCallback } from 'react'
import { useSignals, batchSignals } from '@/lib/stores/signalsStore'
import { 
  selectScoped, 
  selectRecentActivity, 
  selectFeedStats, 
  selectFilteredSignals 
} from '@/lib/stores/selectors'
import { SESSION_ID } from '@/lib/env'
import ActivityVirtualList from '@/components/virtual/ActivityVirtualList'
import { FeedStateShell } from '@/components/state/StateShell'
import PerformanceMonitor from '@/components/dev/PerformanceMonitor'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface FeedFilters {
  search: string
  types: string[]
  dateRange?: { start: number; end: number }
}

export default function PerformantFeedExample() {
  // State management with transitions for heavy operations
  const [scope, setScope] = useState<'my' | 'global'>('global')
  const [filters, setFilters] = useState<FeedFilters>({ search: '', types: [] })
  const [isPending, startTransition] = useTransition()

  // Efficient selectors instead of local state + useEffect
  const feedStats = useSignals(selectFeedStats(SESSION_ID))
  
  const filteredSignals = useSignals(
    selectFilteredSignals(SESSION_ID, scope, {
      search: filters.search,
      types: filters.types,
      dateRange: filters.dateRange
    })
  )

  // Memoize expensive computations
  const signalTypes = useMemo(() => {
    const types = Object.keys(feedStats.eventsByType)
    return types.sort()
  }, [feedStats.eventsByType])

  const sortedSignals = useMemo(() => {
    return filteredSignals.sort((a, b) => (b.timestamp || b.ts) - (a.timestamp || a.ts))
  }, [filteredSignals])

  // Stable callbacks to avoid re-renders
  const handleScopeChange = useCallback((newScope: 'my' | 'global') => {
    startTransition(() => {
      setScope(newScope)
    })
  }, [])

  const handleSearchChange = useCallback((search: string) => {
    // Debounce search updates
    startTransition(() => {
      setFilters(prev => ({ ...prev, search }))
    })
  }, [])

  const handleTypeToggle = useCallback((type: string) => {
    setFilters(prev => ({
      ...prev,
      types: prev.types.includes(type) 
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }))
  }, [])

  const handleBatchTest = useCallback(() => {
    // Example of batched updates for performance
    batchSignals(() => {
      console.log('This would be multiple signalsStore.add() calls in a batch')
      // signalsStore.add(event1)
      // signalsStore.add(event2) 
      // signalsStore.add(event3)
      // Only triggers one re-render for all three additions
    })
  }, [])

  // Memoized signal card renderer
  const renderSignal = useCallback((signal: any, index: number) => (
    <SignalCardMemo key={signal.id} signal={signal} />
  ), [])

  return (
    <div className="p-6 space-y-6">
      <PerformanceMonitor componentName="PerformantFeedExample" />
      
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Performance Feed Example</h1>
          <p className="text-gray-600">
            {feedStats.totalEvents} events, {feedStats.eventsByType.CONTACT_REQUEST || 0} contacts, {feedStats.eventsByType.RECOGNITION_MINT || 0} recognitions
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={isPending ? 'secondary' : 'default'}>
            {isPending ? 'Loading...' : 'Ready'}
          </Badge>
          
          <Button onClick={handleBatchTest} variant="outline" size="sm">
            Test Batch Update
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search signals..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="max-w-xs"
          />
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Scope:</span>
            <Button
              onClick={() => handleScopeChange('my')}
              variant={scope === 'my' ? 'default' : 'outline'}
              size="sm"
            >
              My Signals
            </Button>
            <Button
              onClick={() => handleScopeChange('global')}
              variant={scope === 'global' ? 'default' : 'outline'}
              size="sm"
            >
              Global Feed
            </Button>
          </div>
        </div>

        {/* Type filters */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium">Types:</span>
          {signalTypes.map(type => (
            <Badge
              key={type}
              variant={filters.types.includes(type) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => handleTypeToggle(type)}
            >
              {type} ({feedStats.eventsByType[type] || 0})
            </Badge>
          ))}
        </div>
      </div>

      {/* Feed content with state management */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <FeedStateShell signals={sortedSignals} className="h-[600px]">
            <ActivityVirtualList
              items={sortedSignals}
              rowHeight={120}
              containerHeight={600}
              render={renderSignal}
              overscan={3}
              className="border rounded-lg bg-white"
            />
          </FeedStateShell>
        </TabsContent>
        
        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">Overview</h3>
              <div className="space-y-2 text-sm">
                <div>Total Events: {feedStats.totalEvents}</div>
                <div>My Events: {feedStats.myEvents}</div>
                <div>Global Events: {feedStats.globalEvents}</div>
                {feedStats.lastActivity && (
                  <div>Last Activity: {new Date(feedStats.lastActivity).toLocaleString()}</div>
                )}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">By Type</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(feedStats.eventsByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between">
                    <span>{type}</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">Performance</h3>
              <div className="space-y-2 text-sm">
                <div>Filtered Results: {sortedSignals.length}</div>
                <div>Active Filters: {filters.types.length}</div>
                <div>Search: {filters.search ? 'Active' : 'None'}</div>
                <div>Scope: {scope}</div>
                <div>Status: {isPending ? 'Loading' : 'Ready'}</div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Memoized signal card for performance
const SignalCardMemo = React.memo(function SignalCard({ signal }: { signal: any }) {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'CONTACT_REQUEST': return '👋'
      case 'CONTACT_ACCEPT': return '🤝'
      case 'TRUST_ALLOCATE': return '⭐'
      case 'RECOGNITION_MINT': return '🏆'
      case 'PROFILE_UPDATE': return '👤'
      default: return '📡'
    }
  }

  return (
    <div className="bg-white rounded-lg border p-4 m-2 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="text-2xl">{getSignalIcon(signal.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{signal.type}</Badge>
            <Badge variant="secondary" className="text-xs">{signal.source}</Badge>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <strong>From:</strong> 
              <span className="truncate">{signal.actor}</span>
            </div>
            {signal.target && (
              <div className="flex items-center gap-2">
                <strong>To:</strong> 
                <span className="truncate">{signal.target}</span>
              </div>
            )}
            <div><strong>Time:</strong> {formatTime(signal.timestamp || signal.ts)}</div>
          </div>
        </div>
      </div>
    </div>
  )
})