"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RecognitionSignalCard } from "@/components/RecognitionSignalCard"
import { SignalDetailModal } from "@/components/SignalDetailModal"
import { hcsRecognitionService, type HCSRecognitionDefinition } from "@/lib/services/HCSRecognitionService"
import type { SignalCategory } from "@/lib/data/recognitionSignals"

export default function RecognitionPage() {
  const [activeCategory, setActiveCategory] = useState<SignalCategory | 'all'>('all')
  const [selectedSignal, setSelectedSignal] = useState<HCSRecognitionDefinition | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [recognitionDefinitions, setRecognitionDefinitions] = useState<HCSRecognitionDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load recognition definitions from HCS
  useEffect(() => {
    const loadRecognitionData = async () => {
      try {
        setIsLoading(true)
        
        // Wait for recognition service to be ready
        if (!hcsRecognitionService.isReady()) {
          console.log("[RecognitionPage] Waiting for HCS recognition service to initialize...")
          // Try again after a longer delay, and set a max retry limit
          let retryCount = parseInt(sessionStorage.getItem('hcsRecognitionRetries') || '0')
          if (retryCount < 10) { // Max 10 retries (20 seconds total)
            sessionStorage.setItem('hcsRecognitionRetries', (retryCount + 1).toString())
            setTimeout(loadRecognitionData, 3000)
          } else {
            console.error("[RecognitionPage] Max retries reached, HCS service may not be initialized")
            setIsLoading(false)
          }
          return
        }
        
        // Reset retry count on success
        sessionStorage.removeItem('hcsRecognitionRetries')
        
        const definitions = await hcsRecognitionService.getAllRecognitionDefinitions()
        setRecognitionDefinitions(definitions)
        console.log(`[RecognitionPage] Loaded ${definitions.length} recognition definitions from HCS`)
      } catch (error) {
        console.error("[RecognitionPage] Failed to load recognition data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadRecognitionData()
  }, [])

  const handleSignalClick = (signal: HCSRecognitionDefinition) => {
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
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[hsl(var(--text-primary))] mb-2">
          Signal
        </h1>
        <p className="text-[hsl(var(--primary))] text-lg">
          NFT Collection - What people are sending you
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex justify-center gap-3 mb-8">
        <Button
          variant={activeCategory === 'all' ? 'default' : 'outline'}
          onClick={() => setActiveCategory('all')}
          className="h-10 px-6"
        >
          All
        </Button>
        
        {categoryButtons.map((cat) => (
          <Button
            key={cat.key}
            variant={activeCategory === cat.key ? 'default' : 'outline'}
            onClick={() => setActiveCategory(cat.key)}
            className={`
              h-10 px-6
              ${activeCategory === cat.key ? cat.className : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]'}
            `}
          >
            {cat.label} ({cat.count})
          </Button>
        ))}
      </div>

      {/* Signal Cards Grid - Mobile first: 3 across, tablet: 4 across, desktop: 5-6 across */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-[hsl(var(--text-muted))] text-sm">Loading recognition signals from HCS...</p>
          </div>
        </div>
      ) : filteredSignals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[hsl(var(--text-muted))] text-lg mb-2">No recognition signals found</p>
          <p className="text-[hsl(var(--text-subtle))] text-sm">
            {activeCategory === 'all' ? 'HCS data is still loading' : `No ${activeCategory} signals available`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 px-2">
          {filteredSignals.map((signal) => (
            <RecognitionSignalCard
              key={signal.id}
              name={signal.name}
              description={signal.description}
              category={signal.category}
              number={signal.number}
              icon={signal.icon}
              isActive={signal.isActive}
              onClick={() => handleSignalClick(signal)}
            />
          ))}
        </div>
      )}

      {/* Stats Footer */}
      <div className="mt-12 text-center text-[hsl(var(--text-subtle))] text-sm">
        <p>
          Showing {filteredSignals.length} of {recognitionDefinitions.length} recognition signals
          {!isLoading && recognitionDefinitions.length > 0 && " (loaded from HCS)"}
        </p>
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
