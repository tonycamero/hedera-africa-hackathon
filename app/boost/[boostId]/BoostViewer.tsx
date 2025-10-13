'use client'

import React from 'react'
import { Sparkles, ExternalLink, Users } from 'lucide-react'
import { BoostActions } from '@/components/BoostActions'

interface BoostViewerProps {
  boostId: string
}

// Demo signals for testing boost mechanism
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
    target: 'tm-sarah-kim'
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
    target: 'tm-alex-chen'
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
    target: 'tm-maya-patel'
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
    target: 'tm-jordan-lee'
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Boost Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-6 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4 animate-pulse">🔥</div>
            <h1 className="text-3xl font-bold text-white mb-2">Signal Boost</h1>
            <div className="text-purple-200 text-sm">
              Peer Recognition
            </div>
          </div>

          {/* Signal Content */}
          <div className="text-center mb-8">
            <blockquote className="text-xl font-medium text-white mb-4 leading-relaxed">
              "{praiseText}"
            </blockquote>
            
            <div className="text-lg text-cyan-300 mb-2">
              for @{recipient}
            </div>
            
            {senderHandle && (
              <div className="text-sm text-purple-200">
                from @{senderHandle}
              </div>
            )}

            {note && (
              <div className="mt-4 p-4 bg-white/10 rounded-lg text-purple-100 text-sm italic">
                "{note}"
              </div>
            )}
          </div>

          {/* HCS Verification Badge */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 backdrop-blur rounded-full border border-green-500/30">
              <Sparkles className="h-4 w-4 text-green-400" />
              <span className="text-green-300 text-sm font-medium">Blockchain Verified</span>
            </div>
          </div>

          {/* Active Boost Actions */}
          <BoostActions 
            boostId={boostId}
            currentBoostCount={0}
          />
        </div>

        {/* Secondary Actions */}
        <div className="flex gap-4 justify-center mb-6">
          <button
            onClick={() => window.open('/collections', '_blank')}
            className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm font-medium transition-all hover:scale-105"
          >
            <Users className="h-4 w-4" />
            Browse Collections
          </button>
          
          <button
            onClick={() => window.open('/signup?intent=create_signal', '_blank')}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 rounded-full text-white text-sm font-medium transition-all hover:scale-105 shadow-lg"
          >
            <ExternalLink className="h-4 w-4" />
            Start Sending Signals
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <a 
            href="/"
            className="text-purple-300 hover:text-white text-sm transition-colors"
          >
            TrustMesh → Peer Recognition
          </a>
        </div>
      </div>
    </div>
  )
}
