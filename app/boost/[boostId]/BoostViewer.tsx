'use client'

import React from 'react'
import { Sparkles, ExternalLink, Users, Star } from 'lucide-react'
import { BoostActions } from '@/components/BoostActions'
import TradeCard3D from '@/components/TradeCard3D'

interface BoostViewerProps {
  boostId: string
}

// Enhanced demo signals for NFT-style display
const DEMO_SIGNALS = {
  '60b7e2e023d0ee6d': {
    id: 'demo-boost-1',
    metadata: {
      boostId: '60b7e2e023d0ee6d',
      template: 'That presentation was ___',
      fill: 'absolutely killer! The investors were nodding the whole time 🔥',
      note: 'Seriously, you had them eating out of your palm. That\'s how you close deals!',
      senderHandle: 'alex.chen',
      recipientHandle: 'sarah.kim'
    },
    target: 'tm-sarah-kim',
    rarity: 'legendary' as const,
    boostCount: 127,
    emoji: '🎯',
    category: 'Professional'
  },
  '00169e15c6aacfc2': {
    id: 'demo-boost-2', 
    metadata: {
      boostId: '00169e15c6aacfc2',
      template: 'Your ___ game is unmatched',
      fill: 'coding during the hackathon - shipped 3 features while we were still reading docs',
      note: 'Watched you debug that API integration in 10 minutes. Pure wizardry! 🧙‍♂️',
      senderHandle: 'maya.creates',
      recipientHandle: 'alex.chen'
    },
    target: 'tm-alex-chen',
    rarity: 'epic' as const,
    boostCount: 73,
    emoji: '⚡',
    category: 'Technical'
  },
  '26ce4a8ff8eb608f': {
    id: 'demo-boost-3',
    metadata: {
      boostId: '26ce4a8ff8eb608f', 
      template: 'That was ___ energy',
      fill: 'pure main character - walked into that networking event like you owned the place',
      note: 'Everyone wanted to talk to you. That\'s what confidence looks like!',
      senderHandle: 'jordan.social',
      recipientHandle: 'maya.creates'
    },
    target: 'tm-maya-patel',
    rarity: 'rare' as const,
    boostCount: 42,
    emoji: '✨',
    category: 'Social'
  },
  'f21a7a683d0934a4': {
    id: 'demo-boost-4',
    metadata: {
      boostId: 'f21a7a683d0934a4',
      template: 'You absolutely ___', 
      fill: 'saved our demo with that last-minute fix. Crisis averted like a pro!',
      note: '1 hour before demo, everything broke. You fixed it in 20 minutes. Legend.',
      senderHandle: 'sam.builds',
      recipientHandle: 'jordan.social'
    },
    target: 'tm-jordan-lee',
    rarity: 'epic' as const,
    boostCount: 89,
    emoji: '🛡️',
    category: 'Heroic'
  }
}

export function BoostViewer({ boostId }: BoostViewerProps) {
  // Use only demo data for now
  const signal = DEMO_SIGNALS[boostId as keyof typeof DEMO_SIGNALS]
  
  if (!signal?.metadata) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto px-4">
          <div className="text-6xl mb-6">😅</div>
          <h1 className="text-2xl font-bold mb-4">This boost link isn't live yet</h1>
          <p className="text-purple-200 mb-8">
            The signal you're looking for might still be processing, or the link might be incorrect.
          </p>
        </div>
      </div>
    )
  }

  // Extract signal data
  const templateText = signal.metadata.template
  const fill = signal.metadata.fill
  const note = signal.metadata.note
  const senderHandle = signal.metadata.senderHandle
  const recipientHandle = signal.metadata.recipientHandle

  // Format the praise text
  const praiseText = templateText?.replace('___', `"${fill}"`) || 'Amazing signal!'
  const recipient = recipientHandle || 'someone'

  return (
    <div className="min-h-screen pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] p-4 overflow-x-hidden">
      <div className="max-w-sm sm:max-w-2xl lg:max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Star className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400 md:animate-pulse motion-reduce:animate-none" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">NFT Signal Collection</h1>
            <Star className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400 md:animate-pulse motion-reduce:animate-none" />
          </div>
          <p className="text-purple-200 text-base sm:text-lg px-2">
            Collectible peer recognition on the blockchain
          </p>
          
          {/* Collection Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-4 sm:mt-6 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-400">1/∞</div>
              <div className="text-xs sm:text-sm text-purple-300">Collected</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-400">{signal.rarity || 'Epic'}</div>
              <div className="text-xs sm:text-sm text-purple-300">Rarity</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">{signal.boostCount || 0}</div>
              <div className="text-xs sm:text-sm text-purple-300">Boosts</div>
            </div>
          </div>
        </div>

        {/* Main NFT Card Display */}
        <div className="flex justify-center mb-6 sm:mb-8 px-4">
          <div className="relative w-full max-w-sm sm:max-w-md">
            {/* Glow effect background - reduced on mobile */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 md:from-purple-500/30 to-purple-500/20 md:to-purple-500/30 md:blur-xl blur-lg rounded-xl opacity-50 md:opacity-70"></div>
            
            {/* The NFT Card - 3D Trading Card */}
            <TradeCard3D
              title={signal.category || 'GenZ Signal'}
              template={templateText}
              fill={fill}
              note={note}
              senderHandle={senderHandle}
              recipientHandle={recipientHandle}
              rarity={signal.rarity || 'epic'}
              boostCount={signal.boostCount || 0}
              emoji={signal.emoji || '🔥'}
              timestamp={new Date().toISOString()}
              compact={false}
            />
          </div>
        </div>

        {/* HCS Verification Badge */}
        <div className="flex justify-center mb-6 sm:mb-8 px-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 md:backdrop-blur rounded-full border border-green-500/30">
            <Sparkles className="h-4 w-4 text-green-400" />
            <span className="text-green-300 text-sm font-medium">Blockchain Verified NFT</span>
          </div>
        </div>

        {/* Interactive Actions */}
        <div className="max-w-2xl mx-auto px-2">
          <BoostActions 
            boostId={boostId}
            currentBoostCount={signal.boostCount || 0}
          />
        </div>

        {/* Collection Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-4 justify-center mb-6 sm:mb-8 mt-6 sm:mt-8 px-4">
          <button
            onClick={() => window.open('/collections', '_blank')}
            className="flex items-center justify-center gap-2 px-8 py-4 sm:px-6 sm:py-3 min-h-[48px] bg-white/20 md:hover:bg-white/30 rounded-full text-white font-medium transition-all md:hover:scale-105 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 active:scale-95 text-base sm:text-sm"
          >
            <Users className="h-5 w-5" />
            Browse Collection
          </button>
          
          <button
            onClick={() => window.open('/signup?intent=create_signal', '_blank')}
            className="flex items-center justify-center gap-2 px-8 py-4 sm:px-6 sm:py-3 min-h-[48px] bg-gradient-to-r from-purple-500 to-purple-500 md:hover:from-purple-600 md:hover:to-purple-600 rounded-full text-white font-semibold transition-all md:hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 active:scale-95 text-base sm:text-sm"
          >
            <ExternalLink className="h-5 w-5" />
            Start Collecting
          </button>
        </div>

        {/* Rarity Information */}
        <div className="max-w-2xl mx-auto bg-white/5 md:backdrop-blur rounded-2xl p-4 sm:p-6 border border-white/10 mb-6 sm:mb-8 mx-4">
          <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 text-center">Rarity Guide</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center">
              <div className="text-slate-400 font-bold mb-1 text-sm sm:text-base">Common</div>
              <div className="text-xs text-slate-300">0-9 boosts</div>
            </div>
            <div className="text-center">
              <div className="text-blue-400 font-bold mb-1 text-sm sm:text-base">Rare</div>
              <div className="text-xs text-blue-300">10-49 boosts</div>
            </div>
            <div className="text-center">
              <div className="text-purple-400 font-bold mb-1 text-sm sm:text-base">Epic</div>
              <div className="text-xs text-purple-300">50-99 boosts</div>
            </div>
            <div className="text-center">
              <div className="text-orange-400 font-bold mb-1 text-sm sm:text-base">Legendary</div>
              <div className="text-xs text-orange-300">100+ boosts</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center px-4 pb-4">
          <a 
            href="/"
            className="text-purple-300 md:hover:text-white text-sm transition-colors focus:outline-none focus:underline"
          >
            TrustMesh → Collectible Peer Recognition
          </a>
        </div>
      </div>
    </div>
  )
}
