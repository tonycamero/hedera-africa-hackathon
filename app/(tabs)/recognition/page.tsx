"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RecognitionSignalCard } from "@/components/RecognitionSignalCard"
import { SignalDetailModal } from "@/components/SignalDetailModal"
import { recognitionSignals, getSignalsByCategory, getSignalCounts, type SignalCategory, type RecognitionSignal } from "@/lib/data/recognitionSignals"

export default function RecognitionPage() {
  const [activeCategory, setActiveCategory] = useState<SignalCategory | 'all'>('all')
  const [selectedSignal, setSelectedSignal] = useState<RecognitionSignal | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const counts = getSignalCounts()

  const handleSignalClick = (signal: RecognitionSignal) => {
    setSelectedSignal(signal)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedSignal(null)
  }

  // Filter signals based on active category
  const filteredSignals = activeCategory === 'all' 
    ? recognitionSignals 
    : getSignalsByCategory(activeCategory)

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

      {/* Stats Footer */}
      <div className="mt-12 text-center text-[hsl(var(--text-subtle))] text-sm">
        <p>
          Showing {filteredSignals.length} of {recognitionSignals.length} recognition signals
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
