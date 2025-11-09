"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RecognitionSignalCard } from "@/components/RecognitionSignalCard"
import { SignalDetailModal } from "@/components/SignalDetailModal"
import type { SignalCategory } from "@/lib/data/recognitionSignals"

// Define the recognition definition type based on API response
type RecognitionDefinition = {
  id: string
  name: string
  description: string
  icon: string
  category: string
  rarity: string
  _hrl: string
  _ts: string
  number?: number
  isActive?: boolean
}

export default function RecognitionPage() {
  const [activeCategory, setActiveCategory] = useState<SignalCategory | 'all'>('all')
  const [selectedSignal, setSelectedSignal] = useState<RecognitionDefinition | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [recognitionDefinitions, setRecognitionDefinitions] = useState<RecognitionDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load recognition definitions from API endpoint (more reliable than HCS service)
  useEffect(() => {
    const loadRecognitionData = async () => {
      try {
        setIsLoading(true)
        console.log("[RecognitionPage] Loading recognition data from API...")
        
        const response = await fetch('/api/recognition', {
          cache: 'no-store' // Always fetch fresh data
        })
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }
        
        const result = await response.json()
        
        if (result.success && result.data) {
          setRecognitionDefinitions(result.data)
          console.log(`[RecognitionPage] Loaded ${result.data.length} recognition definitions from API`)
          
          // Debug: Log category distribution
          const categories = result.data.reduce((acc: Record<string, number>, def: RecognitionDefinition) => {
            acc[def.category] = (acc[def.category] || 0) + 1
            return acc
          }, {})
          console.log('[RecognitionPage] Category distribution:', categories)
        } else {
          console.error('[RecognitionPage] API response indicates failure:', result)
          throw new Error(result.message || 'Failed to load recognition data')
        }
      } catch (error) {
        console.error("[RecognitionPage] Failed to load recognition data:", error)
        // Set empty array on error to show "no signals" message
        setRecognitionDefinitions([])
      } finally {
        setIsLoading(false)
      }
    }

    loadRecognitionData()
  }, [])

  const handleSignalClick = (signal: RecognitionDefinition) => {
    setSelectedSignal(signal)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedSignal(null)
  }

  // Calculate counts from HCS data
  const getHCSSignalCounts = () => {
    const counts = {
      social: recognitionDefinitions.filter(s => s.category === 'social').length,
      academic: recognitionDefinitions.filter(s => s.category === 'academic').length,
      professional: recognitionDefinitions.filter(s => s.category === 'professional').length
    }
    return counts
  }
  
  const counts = getHCSSignalCounts()

  // Filter signals based on active category
  const filteredSignals = activeCategory === 'all' 
    ? recognitionDefinitions 
    : recognitionDefinitions.filter(signal => signal.category === activeCategory)

  // Category filter buttons with our theme colors
  const categoryButtons = [
    { 
      key: 'social' as const, 
      label: 'Social', 
      count: counts.social,
      className: 'bg-[hsl(var(--social))] text-[hsl(var(--background))] hover:bg-[hsl(var(--social))]/90'
    },
    { 
      key: 'academic' as const, 
      label: 'Academic', 
      count: counts.academic,
      className: 'bg-[hsl(var(--academic))] text-[hsl(var(--background))] hover:bg-[hsl(var(--academic))]/90'
    },
    { 
      key: 'professional' as const, 
      label: 'Professional', 
      count: counts.professional,
      className: 'bg-[hsl(var(--professional))] text-[hsl(var(--background))] hover:bg-[hsl(var(--professional))]/90'
    }
  ]

  return (
    <div className="container mx-auto p-4 max-w-7xl overflow-x-hidden">  
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--text-primary))] mb-2 tracking-tight">
          Signal
        </h1>
        <p className="text-[hsl(var(--primary))] text-base sm:text-lg">
          NFT Collection - What people are sending you
        </p>
      </div>

      {/* Category Filter Pills - Mobile: horizontal scroll, Desktop: center */}
      <div className="mb-6 sm:mb-8">
        <div className="flex sm:justify-center gap-3 overflow-x-auto pb-2 px-1 snap-x snap-mandatory no-scrollbar">
          <Button
            variant={activeCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setActiveCategory('all')}
            className="min-h-[48px] px-6 flex-shrink-0 snap-start active:scale-95 transition-transform"
          >
            All
          </Button>
          
          {categoryButtons.map((cat) => (
            <Button
              key={cat.key}
              variant={activeCategory === cat.key ? 'default' : 'outline'}
              onClick={() => setActiveCategory(cat.key)}
              className={`
                min-h-[48px] px-6 flex-shrink-0 snap-start active:scale-95 transition-transform
                ${activeCategory === cat.key ? cat.className : 'border-[hsl(var(--border))] md:hover:bg-[hsl(var(--muted))]'}
              `}
            >
              {cat.label} ({cat.count})
            </Button>
          ))}
        </div>
      </div>

      {/* Signal Cards Grid - Mobile first: 2 across, tablet: 4 across, desktop: 5-6 across */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin motion-reduce:animate-none rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-[hsl(var(--text-muted))] text-base">Loading recognition signals from API...</p>
          </div>
        </div>
      ) : filteredSignals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[hsl(var(--text-muted))] text-lg mb-2">No recognition signals found</p>
          <p className="text-[hsl(var(--text-subtle))] text-base">
            {activeCategory === 'all' ? 'Recognition data is loading...' : `No ${activeCategory} signals available`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 px-2">
          {filteredSignals.map((signal) => (
            <RecognitionSignalCard
              key={signal.id}
              name={signal.name}
              description={signal.description}
              category={signal.category}
              number={signal.number}
              icon={signal.icon}
              isActive={signal.isActive ?? true}
              onClick={() => handleSignalClick(signal)}
            />
          ))}
        </div>
      )}

      {/* Debug Info & Stats Footer */}
      <div className="mt-12 text-center text-[hsl(var(--text-subtle))] text-sm space-y-2 pb-[env(safe-area-inset-bottom)]">
        <p className="text-base">
          Showing {filteredSignals.length} of {recognitionDefinitions.length} recognition signals
          {!isLoading && recognitionDefinitions.length > 0 && " (loaded from API)"}
        </p>
        <div className="text-sm bg-muted p-3 rounded mx-4">
          <p>Active Category: {activeCategory}</p>
          <p>Categories: {JSON.stringify([...new Set(recognitionDefinitions.map(d => d.category))])}</p>
          <p>Counts: Social={counts.social}, Academic={counts.academic}, Professional={counts.professional}</p>
        </div>
      </div>

      {/* Signal Detail Modal */}
      <SignalDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        signal={selectedSignal}
      />
    </div>
  )
}
