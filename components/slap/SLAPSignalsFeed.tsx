"use client"

/**
 * SLAP Lens-Aware Signals Feed
 * Shows signals filtered and translated for specific lens with toggle capability
 */

import React, { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { slapLensManager, type LensType } from '@/lib/hcs/slap-lens-manager'
import { SLAPSignalCard, SLAPSignalCardCompact } from './SLAPSignalCard'
import { GenZButton, GenZCard, GenZHeading } from '@/components/ui/genz-design-system'
import type { SignalEvent } from '@/lib/types'
import { Filter, ToggleLeft, ToggleRight, Eye, Briefcase, Zap } from 'lucide-react'

interface SLAPSignalsFeedProps {
  signals: SignalEvent[]
  defaultLens?: LensType
  allowLensToggle?: boolean
  showFilters?: boolean
  compact?: boolean
  maxItems?: number
  className?: string
}

export const SLAPSignalsFeed: React.FC<SLAPSignalsFeedProps> = ({
  signals,
  defaultLens = 'genz',
  allowLensToggle = true,
  showFilters = true,
  compact = false,
  maxItems = 50,
  className
}) => {
  const [currentLens, setCurrentLens] = useState<LensType>(defaultLens)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  // Filter and translate signals based on lens
  const processedSignals = useMemo(() => {
    let filteredSignals = slapLensManager.getRelevantSignals(signals, currentLens)
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filteredSignals = filteredSignals.filter(signal => {
        const translation = slapLensManager.translateSignal(signal, currentLens)
        return translation.category === categoryFilter
      })
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all') {
      filteredSignals = filteredSignals.filter(signal => {
        const translation = slapLensManager.translateSignal(signal, currentLens)
        return translation.priority === priorityFilter
      })
    }
    
    // Limit results
    const limitedSignals = filteredSignals.slice(0, maxItems)
    
    // Translate all signals
    return slapLensManager.translateSignalFeed(limitedSignals, currentLens)
  }, [signals, currentLens, categoryFilter, priorityFilter, maxItems])

  // Get unique categories for current lens
  const availableCategories = useMemo(() => {
    const categories = new Set(['all'])
    processedSignals.forEach(signal => {
      categories.add(signal.translation.category)
    })
    return Array.from(categories)
  }, [processedSignals])

  const handleAction = (action: string, signal: SignalEvent) => {
    console.log(`Action: ${action}`, signal)
    // TODO: Implement action handlers
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with Lens Toggle and Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Lens Toggle */}
          {allowLensToggle && (
            <div className="flex items-center gap-2">
              <div className="flex bg-panel/50 rounded-xl p-1">
                <button
                  onClick={() => setCurrentLens('genz')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    currentLens === 'genz' 
                      ? "bg-pri-500 text-slate-900" 
                      : "text-genz-text-dim hover:text-genz-text"
                  )}
                >
                  <Zap className="w-3 h-3" />
                  GenZ
                </button>
                <button
                  onClick={() => setCurrentLens('professional')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    currentLens === 'professional' 
                      ? "bg-slate-500 text-white" 
                      : "text-genz-text-dim hover:text-genz-text"
                  )}
                >
                  <Briefcase className="w-3 h-3" />
                  Pro
                </button>
                <button
                  onClick={() => setCurrentLens('hybrid')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    currentLens === 'hybrid' 
                      ? "bg-gradient-to-r from-pri-500 to-sec-500 text-white" 
                      : "text-genz-text-dim hover:text-genz-text"
                  )}
                >
                  <Eye className="w-3 h-3" />
                  Both
                </button>
              </div>
            </div>
          )}
          
          {/* Result Count */}
          <span className="text-sm text-genz-text-dim">
            {processedSignals.length} {currentLens === 'genz' ? 'signals' : 'events'}
          </span>
        </div>

        {/* Filters Toggle */}
        {showFilters && (
          <GenZButton size="sm" variant="ghost" onClick={() => {}}>
            <Filter className="w-4 h-4" />
          </GenZButton>
        )}
      </div>

      {/* Filters Row */}
      {showFilters && (
        <div className="flex items-center gap-3 flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-genz-text-dim">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-panel/50 border border-genz-border rounded-lg px-2 py-1 text-xs text-genz-text"
            >
              {availableCategories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All' : category}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-genz-text-dim">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-panel/50 border border-genz-border rounded-lg px-2 py-1 text-xs text-genz-text"
            >
              <option value="all">All</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Clear Filters */}
          {(categoryFilter !== 'all' || priorityFilter !== 'all') && (
            <GenZButton 
              size="sm" 
              variant="ghost"
              onClick={() => {
                setCategoryFilter('all')
                setPriorityFilter('all')
              }}
              className="text-xs"
            >
              Clear
            </GenZButton>
          )}
        </div>
      )}

      {/* Lens Context Hint */}
      <div className={cn(
        "p-3 rounded-lg text-sm",
        currentLens === 'genz' && "bg-pri-500/10 border border-pri-500/20 text-pri-200",
        currentLens === 'professional' && "bg-slate-600/10 border border-slate-600/20 text-slate-300",
        currentLens === 'hybrid' && "bg-gradient-to-r from-pri-500/10 to-sec-500/10 border border-pri-500/20 text-pri-200"
      )}>
        <div className="flex items-center gap-2">
          {currentLens === 'genz' && <Zap className="w-4 h-4" />}
          {currentLens === 'professional' && <Briefcase className="w-4 h-4" />}
          {currentLens === 'hybrid' && <Eye className="w-4 h-4" />}
          <span>
            {currentLens === 'genz' && "Showing social gaming perspective with viral sharing"}
            {currentLens === 'professional' && "Showing business perspective with credentials focus"}
            {currentLens === 'hybrid' && "Showing combined perspective with full context"}
          </span>
        </div>
      </div>

      {/* Signal Cards Feed */}
      <div className="space-y-3">
        {processedSignals.length === 0 ? (
          <GenZCard variant="panel" className="p-8 text-center">
            <div className="text-genz-text-dim">
              <p className="mb-2">
                {currentLens === 'genz' ? "No signals in your feed yet" : "No events to display"}
              </p>
              <p className="text-sm">
                {currentLens === 'genz' 
                  ? "Connect with friends and start sending props!" 
                  : "Professional activities will appear here"
                }
              </p>
            </div>
          </GenZCard>
        ) : (
          processedSignals.map((signal, index) => 
            compact ? (
              <SLAPSignalCardCompact
                key={signal.id}
                signal={signal}
                lens={currentLens}
                onAction={handleAction}
              />
            ) : (
              <SLAPSignalCard
                key={signal.id}
                signal={signal}
                lens={currentLens}
                onAction={handleAction}
              />
            )
          )
        )}
      </div>

      {/* Load More */}
      {signals.length > maxItems && (
        <div className="text-center">
          <GenZButton variant="ghost" onClick={() => {}}>
            Load more {currentLens === 'genz' ? 'signals' : 'events'}
          </GenZButton>
        </div>
      )}

      {/* Development Debug Panel */}
      {process.env.NODE_ENV === 'development' && (
        <GenZCard variant="panel" className="p-4">
          <GenZHeading level={4} className="mb-2">Debug Info</GenZHeading>
          <div className="text-xs text-genz-text-dim space-y-1">
            <div>Current Lens: {currentLens}</div>
            <div>Total Signals: {signals.length}</div>
            <div>Filtered Signals: {processedSignals.length}</div>
            <div>Category Filter: {categoryFilter}</div>
            <div>Priority Filter: {priorityFilter}</div>
            <div>Available Categories: {availableCategories.join(', ')}</div>
          </div>
        </GenZCard>
      )}
    </div>
  )
}

// Preset variations for different contexts
export const SLAPSignalsFeedGenZ: React.FC<Omit<SLAPSignalsFeedProps, 'defaultLens' | 'allowLensToggle'>> = (props) => (
  <SLAPSignalsFeed {...props} defaultLens="genz" allowLensToggle={false} />
)

export const SLAPSignalsFeedProfessional: React.FC<Omit<SLAPSignalsFeedProps, 'defaultLens' | 'allowLensToggle'>> = (props) => (
  <SLAPSignalsFeed {...props} defaultLens="professional" allowLensToggle={false} />
)

export const SLAPSignalsFeedCompact: React.FC<SLAPSignalsFeedProps> = (props) => (
  <SLAPSignalsFeed {...props} compact showFilters={false} />
)