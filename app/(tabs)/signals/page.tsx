"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Sparkles, Zap, Database, Settings, Eye, Collection, Users, Send, Wallet, Share2 } from 'lucide-react'
import { SignalTypeSelector } from '@/components/signals/SignalTypeSelector'
import { MintSignalFlow } from '@/components/signals/MintSignalFlow'
import { RecentActivity } from '@/components/signals/RecentActivity'
import { SignalType, SignalInstance, SignalAsset } from '@/lib/types/signals-collectible'
import { GenZButton, GenZCard, GenZHeading, GenZText, GenZChip } from '@/components/ui/genz-design-system'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { 
  ProfessionalLoading, 
  ProfessionalError, 
  ProfessionalSuccess,
  ContextualGuide,
  NetworkStatusIndicator,
  PullToRefresh 
} from '@/components/enhancements/professional-ux-enhancements'
import { getSessionId } from '@/lib/session'
import { signalsStore, type BondedContact } from '@/lib/stores/signalsStore'
import { getBondedContactsFromHCS } from '@/lib/services/HCSDataUtils'
import { PurpleFlame } from '@/components/ui/TrustAgentFlame'

export default function SignalsPage() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'selector' | 'minting' | 'collection'>('dashboard')
  const [selectedSignalType, setSelectedSignalType] = useState<SignalType | null>(null)
  const [recentMints, setRecentMints] = useState<SignalInstance[]>([])
  const [mySignals, setMySignals] = useState<SignalAsset[]>([])
  const [contacts, setContacts] = useState<BondedContact[]>([])
  const [sessionId, setSessionId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()
  
  // Professional state
  const [error, setError] = useState<string | null>(null)
  const [isMinting, setIsMinting] = useState(false)
  const [showFirstTimeGuide, setShowFirstTimeGuide] = useState(false)
  const [mintSuccess, setMintSuccess] = useState<SignalInstance | null>(null)

  // Load user data and signals - memoized to prevent excessive calls
  const loadSignalsData = useCallback(async () => {
    try {
      if (!isRefreshing) setIsLoading(true)
      setError(null)
      
      const currentSessionId = getSessionId() || 'tm-alex-chen'
      setSessionId(currentSessionId)
      
      // Load contacts for signal sending - now with intelligent caching
      const allEvents = signalsStore.getAll()
      const bondedContacts = getBondedContactsFromHCS(allEvents, currentSessionId)
      setContacts(bondedContacts)
      
      // Load user's signal collection
      const walletResponse = await fetch(`/api/signals/wallet?owner=${currentSessionId}`)
      if (walletResponse.ok) {
        const walletData = await walletResponse.json()
        setMySignals(walletData.assets || [])
      }
      
      // Show first-time guide if no signals
      if (mySignals.length === 0 && contacts.length === 0) {
        setShowFirstTimeGuide(true)
      }
      
      // Only log if we actually loaded data, not from cache
      console.log(`[GenZSignals] ✅ Loaded ${mySignals.length} signals, ${contacts.length} contacts`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load signals data'
      console.error('[GenZSignals] ❌ Error:', error)
      setError(message)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [isRefreshing, mySignals.length, contacts.length])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await loadSignalsData()
  }, [loadSignalsData])

  useEffect(() => {
    loadSignalsData()
    const unsubscribe = signalsStore.subscribe(loadSignalsData)
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSignalTypeSelect = (signalType: SignalType) => {
    setSelectedSignalType(signalType)
    setCurrentView('minting')
  }

  const handleMintComplete = (signal: SignalInstance) => {
    try {
      setRecentMints(prev => [signal, ...prev])
      setCurrentView('dashboard')
      setSelectedSignalType(null)
      setError(null)
      setMintSuccess(signal)
      
      // Enhanced success feedback
      toast.success('🎉 Signal Created!', {
        description: `${signal.metadata.category} signal sent successfully!`,
        duration: 4000
      })
      
      // Reload data to show new signal
      setTimeout(() => loadSignalsData(), 1000)
    } catch (err) {
      setError('Failed to complete signal creation')
    }
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
    setSelectedSignalType(null)
  }

  const stats = useMemo(() => ({
    collected: mySignals.length,
    sent: recentMints.length,
    connections: contacts.length,
    rarities: [...new Set(mySignals.map(s => s.metadata.rarity))].length
  }), [mySignals.length, recentMints.length, contacts.length, mySignals])

  return (
    <div className="min-h-screen bg-ink">
      <NetworkStatusIndicator />
      
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="max-w-md mx-auto px-4 py-4 space-y-6">
          {/* Header */}
          <div className="text-center">
            <GenZHeading level={1} className="flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-pri-500 animate-breathe-glow" />
              {currentView === 'dashboard' ? 'Signals' : 
               currentView === 'selector' ? 'Send Props' : 
               currentView === 'minting' ? 'Send Props' : 'My Props'}
            </GenZHeading>
            
            {currentView === 'dashboard' && (
              <GenZText className="text-lg text-pri-400 font-medium text-center">
                Real props between real friends
              </GenZText>
            )}
          </div>

          {/* First Time Guide */}
          {showFirstTimeGuide && currentView === 'dashboard' && (
            <ContextualGuide
              title="Welcome to Signals! 🚀"
              message="Create collectible recognition tokens to celebrate achievements and build your reputation."
              tip="Start by creating your first signal or connecting with friends!"
              actionText="Create First Signal"
              onAction={() => setCurrentView('selector')}
              onDismiss={() => setShowFirstTimeGuide(false)}
              showOnce
              storageKey="first-signals"
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

          {/* Success State */}
          {mintSuccess && (
            <ProfessionalSuccess
              title="Signal Created! 🎉"
              message={`Your ${mintSuccess.metadata.category} signal was successfully created`}
              details={[
                `Sent to: ${mintSuccess.recipient_pub}`,
                `Rarity: ${mintSuccess.metadata.rarity}`,
                'Now available in their collection'
              ]}
              autoHide
              hideDelay={6000}
              onHide={() => setMintSuccess(null)}
            />
          )}

          {/* Loading State */}
          {isLoading ? (
            <ProfessionalLoading 
              variant="initial"
              message="Loading signals..."
              submessage="Syncing from HCS network"
            />
          ) : (
            <div className="space-y-4">
              {/* Dashboard View */}
              {currentView === 'dashboard' && (
                <div className="space-y-6">
                  {/* Feed Tabs */}
                  <GenZCard variant="glass" className="p-2">
                    <div className="grid grid-cols-2 gap-2">
                      <GenZButton variant="boost" size="sm" className="font-bold" glow>
                        Friends
                      </GenZButton>
                      <GenZButton variant="ghost" size="sm" className="font-bold">
                        Everyone
                      </GenZButton>
                    </div>
                  </GenZCard>
                  
                  {/* Props Feed */}
                  <div className="space-y-3">
                    {/* Mock props activity */}
                    <GenZCard variant="glass" className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-boost-500/30 to-pri-500/20 border border-boost-500/30 flex items-center justify-center">
                          <span className="text-xs font-semibold">A</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <GenZText className="font-semibold">Alex → Sarah</GenZText>
                            <GenZChip variant="boost" className="text-xs">clutch</GenZChip>
                          </div>
                          <GenZText className="mb-3">
                            clutched <span className="font-bold text-boost-400">"the presentation"</span> under fire
                          </GenZText>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <GenZButton size="sm" variant="boost" className="flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                <span>Boost</span>
                                <span className="text-xs">(3)</span>
                              </GenZButton>
                              <GenZButton size="sm" variant="ghost" className="flex items-center gap-1">
                                <Share2 className="w-3 h-3" />
                                <span>Share</span>
                              </GenZButton>
                            </div>
                            <GenZText size="sm" dim>
                              HCS verified • 1m ago
                            </GenZText>
                          </div>
                        </div>
                      </div>
                    </GenZCard>
                    
                    <GenZCard variant="glass" className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sec-500/30 to-pri-500/20 border border-sec-500/30 flex items-center justify-center">
                          <span className="text-xs font-semibold">M</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <GenZText className="font-semibold">Maya → Jordan</GenZText>
                            <GenZChip variant="signal" className="text-xs">rizz</GenZChip>
                          </div>
                          <GenZText className="mb-3">
                            smooth operator with <span className="font-bold text-pri-400">"that coffee shop convo"</span>
                          </GenZText>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <GenZButton size="sm" variant="boost" className="flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                <span>Boost</span>
                                <span className="text-xs">(7)</span>
                              </GenZButton>
                              <GenZButton size="sm" variant="ghost" className="flex items-center gap-1">
                                <Share2 className="w-3 h-3" />
                                <span>Share</span>
                              </GenZButton>
                            </div>
                            <GenZText size="sm" dim>
                              HCS verified • 15m ago
                            </GenZText>
                          </div>
                        </div>
                      </div>
                    </GenZCard>
                  </div>
                  
                  {/* Stats Overview (moved down) */}
                  <GenZCard variant="glass" className="p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-boost-400 mb-1">{stats.collected}</div>
                        <GenZText size="sm" dim>My Props</GenZText>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-pri-400 mb-1">{stats.sent}</div>
                        <GenZText size="sm" dim>Sent</GenZText>
                      </div>
                    </div>
                    
                    <div className="flex justify-center gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-sec-400 mb-1">{stats.connections}</div>
                        <GenZText size="sm" dim>Friends</GenZText>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-accent-400 mb-1">{stats.rarities}</div>
                        <GenZText size="sm" dim>Rarities</GenZText>
                      </div>
                    </div>
                  </GenZCard>

                  {/* Quick Actions */}
                  <GenZCard variant="glass" className="p-4">
                    <GenZHeading level={4} className="mb-4 text-center">Quick Actions</GenZHeading>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <GenZButton 
                        variant="boost" 
                        className="h-20 flex-col gap-2" 
                        glow
                        onClick={() => setCurrentView('selector')}
                      >
                        <Zap className="w-6 h-6" />
                        <span className="text-sm">Send Props</span>
                      </GenZButton>
                      
                      <GenZButton 
                        variant="primary" 
                        className="h-20 flex-col gap-2"
                        onClick={() => setCurrentView('collection')}
                      >
                        <Wallet className="w-6 h-6" />
                        <span className="text-sm">My Props</span>
                      </GenZButton>
                    </div>
                    
                    {contacts.length > 0 && (
                      <GenZButton 
                        variant="ghost" 
                        className="w-full mt-3" 
                        onClick={() => router.push('/contacts')}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        View Friends ({contacts.length})
                      </GenZButton>
                    )}
                  </GenZCard>

                  {/* Trust Agent Suggestion */}
                  <GenZCard variant="glass" className="p-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-pri-500/10 to-sec-500/10 opacity-50" />
                    <div className="relative flex items-center gap-3">
                      <PurpleFlame size="md" active={true} />
                      <div className="flex-1">
                        <GenZText className="font-medium mb-1 text-pri-500">
                          Trust Agent
                        </GenZText>
                        <GenZText size="sm">
                          {contacts.length === 0 
                            ? "Add friends to start sending props"
                            : mySignals.length === 0
                            ? "Send your first props to friends"
                            : "Keep the props flowing with your crew"}
                        </GenZText>
                      </div>
                      <GenZButton size="sm" variant="boost" glow onClick={() => setCurrentView('selector')}>
                        <Sparkles className="w-3 h-3" />
                      </GenZButton>
                    </div>
                  </GenZCard>

                  {/* Recent Activity */}
                  {(recentMints.length > 0 || mySignals.length > 0) && (
                    <RecentActivity recentMints={recentMints} />
                  )}
                </div>
              )}

              {/* Signal Type Selector */}
              {currentView === 'selector' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <GenZButton size="sm" variant="ghost" onClick={handleBackToDashboard}>
                      ← Back
                    </GenZButton>
                    <GenZChip variant="boost">
                      Choose Signal Type
                    </GenZChip>
                  </div>
                  
                  <SignalTypeSelector 
                    onSelect={handleSignalTypeSelect}
                    selectedType={selectedSignalType}
                  />
                </div>
              )}

              {/* Minting Flow */}
              {currentView === 'minting' && selectedSignalType && (
                <MintSignalFlow
                  selectedType={selectedSignalType}
                  onBack={handleBackToDashboard}
                  onComplete={handleMintComplete}
                />
              )}

              {/* Collection View */}
              {currentView === 'collection' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <GenZButton size="sm" variant="ghost" onClick={handleBackToDashboard}>
                      ← Back
                    </GenZButton>
                    <GenZChip variant="primary">
                      {mySignals.length} signals
                    </GenZChip>
                  </div>
                  
                  {mySignals.length === 0 ? (
                    <GenZCard variant="glass" className="p-8 text-center">
                      <div className="text-6xl mb-4 animate-float">📦</div>
                      <GenZHeading level={3} className="mb-2">No activity yet</GenZHeading>
                      <GenZText className="mb-4">Send your first props to get the feed started!</GenZText>
                      <GenZButton variant="boost" glow onClick={() => setCurrentView('selector')}>
                        <Zap className="w-4 h-4 mr-2" />
                        Send your first props
                      </GenZButton>
                    </GenZCard>
                  ) : (
                    <div className="text-center">
                      <GenZButton 
                        variant="outline"
                        onClick={() => router.push('/signals-trading')}
                        className="border-pri-500/30 text-pri-500 hover:bg-pri-500/10"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Full Collection
                      </GenZButton>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </PullToRefresh>
    </div>
  )
}
