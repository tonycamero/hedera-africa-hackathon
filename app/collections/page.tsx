'use client'

import React from 'react'
import { ArrowLeft, Search, Filter, Sparkles, Star } from 'lucide-react'
import { GenZSignalCard } from '@/components/GenZSignalCard'

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
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Star className="h-8 w-8 text-yellow-400 animate-pulse" />
            <h1 className="text-4xl font-bold text-white">NFT Signal Collection</h1>
            <Star className="h-8 w-8 text-yellow-400 animate-pulse" />
          </div>
          <p className="text-purple-200 text-xl mb-6">Collectible peer recognition cards on the blockchain</p>
          
          {/* Collection Stats */}
          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400">{NFT_SIGNAL_COLLECTIONS.length}</div>
              <div className="text-sm text-purple-300">Total Cards</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">{NFT_SIGNAL_COLLECTIONS.filter(s => s.rarity === 'legendary').length}</div>
              <div className="text-sm text-purple-300">Legendary</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">{NFT_SIGNAL_COLLECTIONS.filter(s => s.rarity === 'epic').length}</div>
              <div className="text-sm text-purple-300">Epic</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{NFT_SIGNAL_COLLECTIONS.filter(s => s.rarity === 'rare').length}</div>
              <div className="text-sm text-purple-300">Rare</div>
            </div>
          </div>
          
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        {/* Rarity Filter */}
        <div className="flex justify-center gap-4 mb-12">
          <button className="px-6 py-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-full text-orange-300 border border-orange-500/30 transition-all">
            🔥 Legendary ({NFT_SIGNAL_COLLECTIONS.filter(s => s.rarity === 'legendary').length})
          </button>
          <button className="px-6 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-full text-purple-300 border border-purple-500/30 transition-all">
            ⚡ Epic ({NFT_SIGNAL_COLLECTIONS.filter(s => s.rarity === 'epic').length})
          </button>
          <button className="px-6 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-full text-blue-300 border border-blue-500/30 transition-all">
            ✨ Rare ({NFT_SIGNAL_COLLECTIONS.filter(s => s.rarity === 'rare').length})
          </button>
          <button className="px-6 py-2 bg-slate-500/20 hover:bg-slate-500/30 rounded-full text-slate-300 border border-slate-500/30 transition-all">
            ⚪ Common ({NFT_SIGNAL_COLLECTIONS.filter(s => s.rarity === 'common').length})
          </button>
        </div>

        {/* NFT Cards Gallery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
          {NFT_SIGNAL_COLLECTIONS.map((signal, idx) => (
            <div key={idx} className="transform hover:scale-105 transition-all duration-300">
              <GenZSignalCard
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
                onClick={() => {
                  // Could open a detail modal or navigate to boost page
                  console.log('Clicked NFT card:', signal)
                }}
              />
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-4">Ready to Send Your First Signal?</h3>
            <p className="text-purple-200 mb-6">Join TrustMesh to start recognizing others and building your network</p>
            <button
              onClick={() => window.open('/signup?intent=create_signal', '_blank')}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 rounded-full text-white font-medium transition-all hover:scale-105 shadow-lg"
            >
              Create Account & Start Sending
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}