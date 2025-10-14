'use client'

import React, { useState } from 'react'
import { ArrowLeft, Search, Filter, Sparkles, Star, X } from 'lucide-react'
import TradeCard3D from '@/components/TradeCard3D'

// NFT-style signal collections with rarity and visual properties
const NFT_SIGNAL_COLLECTIONS = [
  {
    template: 'That presentation was ___',
    fill: 'absolutely killer! 🎯',
    note: 'Seriously dominated that boardroom!',
    senderHandle: 'alex.mentor',
    recipientHandle: 'sarah.star',
    rarity: 'legendary' as const,
    boostCount: 127,
    emoji: '🎯',
    category: 'Professional'
  },
  {
    template: 'Your ___ game is unmatched',
    fill: 'coding wizardry during the hackathon',
    note: 'Shipped 3 features while others read docs!',
    senderHandle: 'maya.codes',
    recipientHandle: 'alex.dev',
    rarity: 'epic' as const,
    boostCount: 89,
    emoji: '⚡',
    category: 'Technical'
  },
  {
    template: 'That was ___ energy',
    fill: 'pure main character vibes',
    note: 'Walked into that room like you owned it!',
    senderHandle: 'jordan.social',
    recipientHandle: 'maya.queen',
    rarity: 'rare' as const,
    boostCount: 42,
    emoji: '✨',
    category: 'Social'
  },
  {
    template: 'You absolutely ___',
    fill: 'saved our demo with that clutch fix',
    note: '1 hour to demo, everything broke. 20 min fix. Legend.',
    senderHandle: 'sam.hero',
    recipientHandle: 'jordan.saves',
    rarity: 'epic' as const,
    boostCount: 73,
    emoji: '🛡️',
    category: 'Heroic'
  },
  {
    template: 'Your creativity is ___',
    fill: 'absolutely mind-blowing',
    note: 'That design concept changed everything!',
    senderHandle: 'artist.vision',
    recipientHandle: 'creative.mind',
    rarity: 'rare' as const,
    boostCount: 35,
    emoji: '🎨',
    category: 'Creative'
  },
  {
    template: 'Thank you for ___',
    fill: 'being there when I needed you most',
    note: 'Your support means everything to me.',
    senderHandle: 'grateful.heart',
    recipientHandle: 'caring.soul',
    rarity: 'common' as const,
    boostCount: 8,
    emoji: '🤗',
    category: 'Support'
  },
  {
    template: 'You just ___',
    fill: 'made everyone in the room smile',
    note: 'Your energy is absolutely infectious!',
    senderHandle: 'happy.vibes',
    recipientHandle: 'smile.maker',
    rarity: 'rare' as const,
    boostCount: 28,
    emoji: '😄',
    category: 'Social'
  },
  {
    template: 'That ___ was revolutionary',
    fill: 'product launch strategy',
    note: 'Completely changed how we think about launches!',
    senderHandle: 'strategy.guru',
    recipientHandle: 'launch.expert',
    rarity: 'epic' as const,
    boostCount: 67,
    emoji: '🚀',
    category: 'Innovation'
  }
]

export default function CollectionsPage() {
  const [selectedSignal, setSelectedSignal] = useState<typeof NFT_SIGNAL_COLLECTIONS[0] | null>(null)
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-sm sm:max-w-2xl lg:max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Star className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400 md:animate-pulse motion-reduce:animate-none" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">NFT Signal Collection</h1>
            <Star className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400 md:animate-pulse motion-reduce:animate-none" />
          </div>
          <p className="text-purple-200 text-base sm:text-lg lg:text-xl mb-4 sm:mb-6 px-2">Collectible peer recognition cards on the blockchain</p>
          
          {/* Collection Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 mb-4 sm:mb-6 max-w-md sm:max-w-none mx-auto">
            <div className="text-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-cyan-400">{NFT_SIGNAL_COLLECTIONS.length}</div>
              <div className="text-xs sm:text-sm text-purple-300">Total Cards</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-400">{NFT_SIGNAL_COLLECTIONS.filter(s => s.rarity === 'legendary').length}</div>
              <div className="text-xs sm:text-sm text-purple-300">Legendary</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-400">{NFT_SIGNAL_COLLECTIONS.filter(s => s.rarity === 'epic').length}</div>
              <div className="text-xs sm:text-sm text-purple-300">Epic</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-400">{NFT_SIGNAL_COLLECTIONS.filter(s => s.rarity === 'rare').length}</div>
              <div className="text-xs sm:text-sm text-purple-300">Rare</div>
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

        {/* Rarity Filter */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-8 sm:mb-12 px-4">
          <button className="px-4 py-3 sm:px-6 sm:py-2 min-h-[44px] sm:min-h-0 bg-orange-500/20 md:hover:bg-orange-500/30 rounded-full text-orange-300 border border-orange-500/30 transition-all text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
            🔥 Legendary ({NFT_SIGNAL_COLLECTIONS.filter(s => s.rarity === 'legendary').length})
          </button>
          <button className="px-4 py-3 sm:px-6 sm:py-2 min-h-[44px] sm:min-h-0 bg-purple-500/20 md:hover:bg-purple-500/30 rounded-full text-purple-300 border border-purple-500/30 transition-all text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
            ⚡ Epic ({NFT_SIGNAL_COLLECTIONS.filter(s => s.rarity === 'epic').length})
          </button>
          <button className="px-4 py-3 sm:px-6 sm:py-2 min-h-[44px] sm:min-h-0 bg-blue-500/20 md:hover:bg-blue-500/30 rounded-full text-blue-300 border border-blue-500/30 transition-all text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            ✨ Rare ({NFT_SIGNAL_COLLECTIONS.filter(s => s.rarity === 'rare').length})
          </button>
          <button className="px-4 py-3 sm:px-6 sm:py-2 min-h-[44px] sm:min-h-0 bg-slate-500/20 md:hover:bg-slate-500/30 rounded-full text-slate-300 border border-slate-500/30 transition-all text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2">
            ⚪ Common ({NFT_SIGNAL_COLLECTIONS.filter(s => s.rarity === 'common').length})
          </button>
        </div>

        {/* NFT Cards Gallery - 3 columns on mobile, more on larger screens */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4 px-4">
          {NFT_SIGNAL_COLLECTIONS.map((signal, idx) => (
            <TradeCard3D
              key={idx}
              title={signal.category}
              template={signal.template}
              fill={signal.fill}
              note={signal.note}
              senderHandle={signal.senderHandle}
              recipientHandle={signal.recipientHandle}
              rarity={signal.rarity}
              boostCount={signal.boostCount}
              emoji={signal.emoji}
              timestamp={new Date().toISOString()}
              compact={true}
              onClick={() => setSelectedSignal(signal)}
            />
          ))}
        </div>

        {/* Full Detail Modal */}
        {selectedSignal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Close button */}
              <button
                onClick={() => setSelectedSignal(null)}
                className="absolute top-2 right-2 z-10 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
              
              {/* Full-size card */}
              <TradeCard3D
                title={selectedSignal.category}
                template={selectedSignal.template}
                fill={selectedSignal.fill}
                note={selectedSignal.note}
                senderHandle={selectedSignal.senderHandle}
                recipientHandle={selectedSignal.recipientHandle}
                rarity={selectedSignal.rarity}
                boostCount={selectedSignal.boostCount}
                emoji={selectedSignal.emoji}
                timestamp={new Date().toISOString()}
                compact={false}
              />
            </div>
            
            {/* Click outside to close */}
            <div 
              className="absolute inset-0 -z-10" 
              onClick={() => setSelectedSignal(null)}
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