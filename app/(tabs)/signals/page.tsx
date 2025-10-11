"use client"

import { useState } from 'react'
import { Sparkles, Zap, Database, Settings, Eye, Collection } from 'lucide-react'
import { SignalTypeSelector } from '@/components/signals/SignalTypeSelector'
import { MintSignalFlow } from '@/components/signals/MintSignalFlow'
import { RecentActivity } from '@/components/signals/RecentActivity'
import { SignalType, SignalInstance } from '@/lib/types/signals-collectible'
import { useDemoMode } from '@/lib/hooks/useDemoMode'
import { GenZButton, GenZCard, GenZHeading, GenZText } from '@/components/ui/genz-design-system'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { DevRibbon } from '@/components/DevRibbon'

export default function SignalsPage() {
  const [currentView, setCurrentView] = useState<'selector' | 'minting'>('selector')
  const [selectedSignalType, setSelectedSignalType] = useState<SignalType | null>(null)
  const [recentMints, setRecentMints] = useState<SignalInstance[]>([])
  const { getDataSourceLabel, getDataSourceBadgeColor } = useDemoMode()
  const router = useRouter()

  const handleSignalTypeSelect = (signalType: SignalType) => {
    setSelectedSignalType(signalType)
    setCurrentView('minting')
  }

  const handleMintComplete = (signal: SignalInstance) => {
    setRecentMints(prev => [signal, ...prev])
    setCurrentView('selector')
    setSelectedSignalType(null)
    
    toast.success('🎉 Signal Minted Successfully!', {
      description: `Your ${signal.metadata.category} collectible is ready to be claimed`
    })
  }

  const handleBackToSelector = () => {
    setCurrentView('selector')
    setSelectedSignalType(null)
  }

  return (
    <div className="min-h-screen bg-ink">
      <DevRibbon />
      <div className="max-w-md mx-auto px-4 py-4 space-y-6">
        {/* Header */}
        <div className="text-center">
          <GenZHeading level={1} className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-pri-500 animate-breathe-glow" />
            {currentView === 'selector' ? 'Signals' : 'Create Signal'}
          </GenZHeading>
          
          {/* Collection View Button */}
          {currentView === 'selector' && (
            <div className="flex justify-center mb-4">
              <Button
                onClick={() => router.push('/signals-trading')}
                variant="outline"
                className="bg-white/5 border-white/20 text-white hover:bg-white/10 flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                <span>View Collection</span>
                <div className="text-xs bg-white/10 px-2 py-1 rounded-full ml-1">🎴</div>
              </Button>
            </div>
          )}
        </div>

        {/* Main Content */}
        {currentView === 'selector' ? (
          <div className="space-y-6">
            {/* Signal Type Selector */}
            <div>
              <GenZHeading level={3} className="mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pri-500" />
                Choose Signal Type
              </GenZHeading>
              <SignalTypeSelector 
                onSelect={handleSignalTypeSelect}
                selectedType={selectedSignalType}
              />
            </div>

            {/* Recent Activity */}
            <RecentActivity recentMints={recentMints} />
          </div>
        ) : (
          selectedSignalType && (
            <MintSignalFlow
              selectedType={selectedSignalType}
              onBack={handleBackToSelector}
              onComplete={handleMintComplete}
            />
          )
        )}
      </div>
    </div>
  )
}
