'use client'

import React from 'react'
import { Sparkles, ExternalLink, Users, Star } from 'lucide-react'
import { BoostActions } from '@/components/BoostActions'
import { GenZSignalCard } from '@/components/GenZSignalCard'

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
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Star className="h-8 w-8 text-yellow-400 animate-pulse" />
            <h1 className="text-4xl font-bold text-white">NFT Signal Collection</h1>
            <Star className="h-8 w-8 text-yellow-400 animate-pulse" />
          </div>
          <p className="text-purple-200 text-lg">
            Collectible peer recognition on the blockchain
          </p>
          
          {/* Collection Stats */}
          <div className="flex justify-center gap-6 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">1/∞</div>
              <div className="text-xs text-purple-300">Collected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{signal.rarity || 'Epic'}</div>
              <div className="text-xs text-purple-300">Rarity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{signal.boostCount || 0}</div>
              <div className="text-xs text-purple-300">Boosts</div>
            </div>
          </div>
        </div>

        {/* Main NFT Card Display */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Glow effect background */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/30 to-cyan-500/30 blur-xl rounded-xl opacity-70"></div>
            
            {/* The NFT Card */}
            <div className="relative">
              <GenZSignalCard
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
                glowEffect={true}
              />
            </div>
          </div>
        </div>

        {/* HCS Verification Badge */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 backdrop-blur rounded-full border border-green-500/30">
            <Sparkles className="h-4 w-4 text-green-400" />
            <span className="text-green-300 text-sm font-medium">Blockchain Verified NFT</span>
          </div>
        </div>

        {/* Interactive Actions */}
        <div className="max-w-2xl mx-auto">
          <BoostActions 
            boostId={boostId}
            currentBoostCount={signal.boostCount || 0}
          />
        </div>

        {/* Collection Actions */}
        <div className="flex gap-4 justify-center mb-8 mt-8">
          <button
            onClick={() => window.open('/collections', '_blank')}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white font-medium transition-all hover:scale-105 border border-white/20"
          >
            <Users className="h-5 w-5" />
            Browse Collection
          </button>
          
          <button
            onClick={() => window.open('/signup?intent=create_signal', '_blank')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 rounded-full text-white font-medium transition-all hover:scale-105 shadow-lg"
          >
            <ExternalLink className="h-5 w-5" />
            Start Collecting
          </button>
        </div>

        {/* Rarity Information */}
        <div className="max-w-2xl mx-auto bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 mb-8">
          <h3 className="text-lg font-bold text-white mb-4 text-center">Rarity Guide</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-slate-400 font-bold mb-1">Common</div>
              <div className="text-xs text-slate-300">0-9 boosts</div>
            </div>
            <div className="text-center">
              <div className="text-blue-400 font-bold mb-1">Rare</div>
              <div className="text-xs text-blue-300">10-49 boosts</div>
            </div>
            <div className="text-center">
              <div className="text-purple-400 font-bold mb-1">Epic</div>
              <div className="text-xs text-purple-300">50-99 boosts</div>
            </div>
            <div className="text-center">
              <div className="text-orange-400 font-bold mb-1">Legendary</div>
              <div className="text-xs text-orange-300">100+ boosts</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <a 
            href="/"
            className="text-purple-300 hover:text-white text-sm transition-colors"
          >
            TrustMesh → Collectible Peer Recognition
          </a>
        </div>
      </div>
    </div>
  )
}
