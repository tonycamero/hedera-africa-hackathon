'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Search, Filter, Sparkles, Star, X, Users, BookOpen, Briefcase } from 'lucide-react'
import RecognitionCard3D from '@/components/RecognitionCard3D'
import type { EnhancedSignalType } from '@/lib/services/RecognitionEnrichmentService'

// No more mock data - using real HCS recognition signals only

type CategoryFilter = 'all' | 'social' | 'academic' | 'professional'

export default function CollectionsPage() {
  const [selectedRecognition, setSelectedRecognition] = useState<EnhancedSignalType | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [recognitionSignals, setRecognitionSignals] = useState<EnhancedSignalType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)
  
  // Load recognition signals and stats
  useEffect(() => {
    loadRecognitionData()
  }, [])
  
  // Reload when category filter changes
  useEffect(() => {
    if (recognitionSignals.length > 0) {
      // If we already have signals, just re-filter client-side instead of re-fetching
      console.log('[Collections] Category filter changed to:', categoryFilter)
    }
  }, [categoryFilter])
  
  const loadRecognitionData = async () => {
    try {
      setIsLoading(true)
      console.log('[Collections] Loading recognition signals...')
      
      // Load stats first
      const statsResponse = await fetch('/api/signals/recognition?stats=true')
      if (statsResponse.ok) {
        const statsResult = await statsResponse.json()
        if (statsResult.success) {
          setStats(statsResult.stats)
        }
      }
      
      // Load signals based on category filter
      const signalsUrl = categoryFilter === 'all' 
        ? '/api/signals/recognition'
        : `/api/signals/recognition?category=${categoryFilter}`
      
      // Use the enriched signals API directly
      const enrichedResponse = await fetch('/api/signals/recognition')
      if (enrichedResponse.ok) {
        const enrichedResult = await enrichedResponse.json()
        if (enrichedResult.success && enrichedResult.data) {
          setRecognitionSignals(enrichedResult.data)
          console.log(`[Collections] Loaded ${enrichedResult.data.length} enriched recognition signals from API`)
        }
      }
    } catch (error) {
      console.error('[Collections] Failed to load recognition data:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Filter recognition signals by category
  const filteredRecognitionSignals = categoryFilter === 'all' 
    ? recognitionSignals
    : recognitionSignals.filter(signal => signal.category === categoryFilter)
    
  // Get current stats for display
  const currentStats = stats ? {
    total: categoryFilter === 'all' ? stats.total : stats.categories[categoryFilter] || 0,
    regular: stats.rarities.Regular || 0,
    heat: stats.rarities.Heat || 0,
    peak: stats.rarities.Peak || 0,
    godTier: stats.rarities['God-Tier'] || 0
  } : {
    total: recognitionSignals.length,
    regular: 0,
    heat: 0,
    peak: 0,
    godTier: 0
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] overflow-x-hidden">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-sm sm:max-w-2xl lg:max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Star className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400 md:animate-pulse motion-reduce:animate-none" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Recognition Cards
          </h1>
            <Star className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400 md:animate-pulse motion-reduce:animate-none" />
          </div>
          <p className="text-purple-200 text-base sm:text-lg lg:text-xl mb-4 sm:mb-6 px-2">
            Gen-Z recognition signals as collectible hashinal cards
          </p>
          
          {/* Collection Stats - mobile optimized */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-6 max-w-sm sm:max-w-none mx-auto">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-cyan-400">{currentStats.total}</div>
              <div className="text-sm sm:text-base text-purple-300 font-medium">
                {categoryFilter === 'all' ? 'Total' : categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-400">{currentStats.godTier}</div>
              <div className="text-sm sm:text-base text-purple-300 font-medium">God-Tier</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-400">{currentStats.peak}</div>
              <div className="text-sm sm:text-base text-purple-300 font-medium">Peak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-400">{currentStats.heat}</div>
              <div className="text-sm sm:text-base text-purple-300 font-medium">Heat</div>
            </div>
          </div>
          
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 sm:px-4 sm:py-2 min-h-[44px] sm:min-h-0 bg-white/10 md:hover:bg-white/20 rounded-full text-white transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        {/* Category Filter for Recognition Cards - Horizontal scroll on mobile */}
        <div className="relative mb-8 sm:mb-12 px-4">
          <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 sm:justify-center">
            <button 
              onClick={() => setCategoryFilter('all')}
              className={`
                snap-start px-4 py-3 sm:px-6 sm:py-3 rounded-full min-h-[44px] text-base sm:text-sm font-medium transition-all active:scale-95 focus:outline-none focus:ring-2 whitespace-nowrap
                ${categoryFilter === 'all' 
                  ? 'bg-cyan-500/40 border border-cyan-500/60 ring-1 ring-white/15 text-cyan-200 focus:ring-cyan-500' 
                  : 'bg-slate-500/20 border border-slate-500/30 ring-1 ring-white/10 text-slate-300 md:hover:bg-slate-500/30 focus:ring-slate-500'
                }
              `}
            >
              🌟 All ({stats?.total || 53})
            </button>
            <button 
              onClick={() => setCategoryFilter('social')}
              className={`
                snap-start px-4 py-3 sm:px-6 sm:py-3 rounded-full min-h-[44px] text-base sm:text-sm font-medium transition-all active:scale-95 focus:outline-none focus:ring-2 whitespace-nowrap
                ${categoryFilter === 'social' 
                  ? 'bg-blue-500/40 border border-blue-500/60 ring-1 ring-white/15 text-blue-200 focus:ring-blue-500' 
                  : 'bg-slate-500/20 border border-slate-500/30 ring-1 ring-white/10 text-slate-300 md:hover:bg-slate-500/30 focus:ring-slate-500'
                }
              `}
            >
              <Users className="inline w-4 h-4 mr-1" />
              Social ({stats?.categories?.social || 41})
            </button>
            <button 
              onClick={() => setCategoryFilter('academic')}
              className={`
                snap-start px-4 py-3 sm:px-6 sm:py-3 rounded-full min-h-[44px] text-base sm:text-sm font-medium transition-all active:scale-95 focus:outline-none focus:ring-2 whitespace-nowrap
                ${categoryFilter === 'academic' 
                  ? 'bg-green-500/40 border border-green-500/60 ring-1 ring-white/15 text-green-200 focus:ring-green-500' 
                  : 'bg-slate-500/20 border border-slate-500/30 ring-1 ring-white/10 text-slate-300 md:hover:bg-slate-500/30 focus:ring-slate-500'
                }
              `}
            >
              <BookOpen className="inline w-4 h-4 mr-1" />
              Academic ({stats?.categories?.academic || 5})
            </button>
            <button 
              onClick={() => setCategoryFilter('professional')}
              className={`
                snap-start px-4 py-3 sm:px-6 sm:py-3 rounded-full min-h-[44px] text-base sm:text-sm font-medium transition-all active:scale-95 focus:outline-none focus:ring-2 whitespace-nowrap
                ${categoryFilter === 'professional' 
                  ? 'bg-purple-500/40 border border-purple-500/60 ring-1 ring-white/15 text-purple-200 focus:ring-purple-500' 
                  : 'bg-slate-500/20 border border-slate-500/30 ring-1 ring-white/10 text-slate-300 md:hover:bg-slate-500/30 focus:ring-slate-500'
                }
              `}
            >
              <Briefcase className="inline w-4 h-4 mr-1" />
              Professional ({stats?.categories?.professional || 7})
            </button>
          </div>
        </div>

        {/* Recognition Cards Gallery - 2 columns mobile-first */}
        <div className="px-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin motion-reduce:animate-none rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-purple-200 text-base">Loading recognition cards from API...</p>
              </div>
            </div>
          ) : filteredRecognitionSignals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-purple-200 text-lg mb-2">No recognition cards found</p>
              <p className="text-purple-300 text-base">
                {categoryFilter === 'all' ? 'Recognition data is loading...' : `No ${categoryFilter} cards available`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {filteredRecognitionSignals.map((signal) => (
                <RecognitionCard3D
                  key={signal.type_id}
                  signal={signal}
                  compact={true}
                  onClick={() => setSelectedRecognition(signal)}
                />
              ))}
            </div>
          )}
        </div>

        
        {/* Recognition Card Detail Modal */}
        {selectedRecognition && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Close button */}
              <button
                onClick={() => setSelectedRecognition(null)}
                className="absolute top-2 right-2 z-10 w-8 h-8 bg-black/60 md:hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
              
              {/* Full-size recognition card */}
              <RecognitionCard3D
                signal={selectedRecognition}
                compact={false}
              />
            </div>
            
            {/* Click outside to close */}
            <div 
              className="absolute inset-0 -z-10" 
              onClick={() => setSelectedRecognition(null)}
              aria-label="Click to close modal"
            />
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-8 sm:mt-12 text-center mx-4">
          <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 md:backdrop-blur-lg rounded-3xl p-6 sm:p-8 border border-white/20">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Ready to Send Your First Signal?</h3>
            <p className="text-base sm:text-lg text-purple-200 mb-4 sm:mb-6">Join TrustMesh to start recognizing others and building your network</p>
            <button
              onClick={() => window.open('/signup?intent=create_signal', '_blank')}
              className="w-full sm:w-auto px-8 py-4 sm:py-3 min-h-[56px] sm:min-h-0 bg-gradient-to-r from-purple-500 to-cyan-500 md:hover:from-purple-600 md:hover:to-cyan-600 rounded-full text-white font-medium transition-all md:hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Create Account & Start Sending
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}