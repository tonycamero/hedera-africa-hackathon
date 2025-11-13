"use client"

import { useState, useEffect } from 'react'
import { PurpleFlame } from '@/components/ui/TrustAgentFlame'
import { GenZButton, GenZCard, GenZText } from '@/components/ui/genz-design-system'
import { UserPlus, X } from 'lucide-react'

export function TrustAgentNav() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Load from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    const seen = localStorage.getItem('trustmesh:trust-agent-seen') === 'true'
    setHasSeenOnboarding(seen)
  }, [])
  
  const nudges = [
    "Hey who's on your mind? Go add them to your TrustMesh crew 💫",
    "Spot someone cool at that event? Time to connect! 🔥", 
    "Your crew's looking a bit quiet... who should we add? ⚡",
    "That person from study group seems chill - add them? 📚",
    "Coffee shop regular? Concert buddy? Add them to the crew! ☕"
  ]
  
  const [currentNudge] = useState(() => 
    nudges[Math.floor(Math.random() * nudges.length)]
  )

  const handleFlameClick = () => {
    setIsExpanded(!isExpanded)
    if (!hasSeenOnboarding) {
      setHasSeenOnboarding(true)
      localStorage.setItem('trustmesh:trust-agent-seen', 'true')
    }
  }

  return (
    <>
      {/* Flame in Navigation */}
      <div 
        className="cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-all duration-200 group relative"
        onClick={handleFlameClick}
      >
        <PurpleFlame size="sm" active={true} />
        {/* Subtle indicator for new users */}
        {mounted && !hasSeenOnboarding && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-boost-500 rounded-full animate-ping" />
        )}
      </div>

      {/* Expanded Trust Agent Interface */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
          />
          
          {/* Trust Agent Card */}
          <div className="relative w-full max-w-md">
            <GenZCard variant="glass" className="p-6 relative overflow-hidden animate-in slide-in-from-top duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-pri-500/10 to-sec-500/10 opacity-50" />
              
              {/* Close button */}
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="relative">
                {/* Trust Agent Introduction */}
                <div className="flex items-center gap-4 mb-4">
                  <PurpleFlame size="lg" active={true} />
                  <div className="flex-1">
                    <GenZText className="font-semibold text-lg text-pri-500 mb-1">
                      Hello, I'm Trust Agent
                    </GenZText>
                    <GenZText size="sm" dim>
                      Your guide to building authentic connections
                    </GenZText>
                  </div>
                </div>

                {/* Current Nudge */}
                <div className="mb-6">
                  <GenZText className="mb-3">
                    {currentNudge}
                  </GenZText>
                </div>

                {/* Onboarding or Actions */}
                {!hasSeenOnboarding ? (
                  <div className="space-y-4">
                    <GenZText size="sm" dim>
                      I help you discover people and events IRL, send props to friends, and build your crew through real connections. 
                    </GenZText>
                    <GenZText size="sm" dim>
                      Tap my flame anytime you need guidance! 🔥
                    </GenZText>
                    <GenZButton 
                      variant="boost" 
                      className="w-full mt-4"
                      onClick={() => setIsExpanded(false)}
                      glow
                    >
                      Let's build your crew!
                    </GenZButton>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <GenZButton variant="boost" className="flex-1" glow>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Friend
                    </GenZButton>
                    <GenZButton variant="signal" className="flex-1">
                      Discover Events
                    </GenZButton>
                  </div>
                )}
              </div>
            </GenZCard>
          </div>
        </div>
      )}
    </>
  )
}