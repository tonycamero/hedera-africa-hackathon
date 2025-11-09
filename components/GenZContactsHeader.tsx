'use client'

import React from 'react'
import { UserPlus, Share2, Users, Trophy, Zap } from 'lucide-react'
import { GenZContactsHeaderProps } from '@/lib/types/genz-contacts'
import { trackAddFriendClicked, trackShareProfileClicked } from '@/lib/services/GenZTelemetryService'
import { GenZButton, GenZCard, GenZChip, GenZHeading, GenZText, genZClassNames } from '@/components/ui/genz-design-system'

export function GenZContactsHeader({
  counters,
  onAddFriendClick,
  onShareProfileClick,
  campusCode,
  tagline = "Add friends. Send signals. Level up."
}: GenZContactsHeaderProps) {
  
  const handleAddFriend = () => {
    trackAddFriendClicked()
    onAddFriendClick()
  }
  
  const handleShareProfile = () => {
    trackShareProfileClicked()
    onShareProfileClick()
  }

  return (
    <GenZCard 
      variant="glass" 
      className={`sticky top-0 z-10 ${genZClassNames.heroGradient} backdrop-blur-xl border-b border-genz-border p-4`}
    >
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <GenZHeading level={2} gradient className="mb-1">
            {tagline}
          </GenZHeading>
          {campusCode && (
            <GenZText size="sm" dim className="uppercase tracking-wider">
              {campusCode} Campus
            </GenZText>
          )}
        </div>

        {/* KPI Chips - Using GenZ Design System */}
        <div className="flex justify-center gap-2 mb-4">
          <GenZChip variant="signal" count={counters.friends}>
            <Users className="w-3 h-3" />
            friends
          </GenZChip>
          
          <GenZChip variant="boost" count={counters.sent}>
            <Trophy className="w-3 h-3" />
            sent
          </GenZChip>
          
          <GenZChip variant="boost" count={counters.boosts}>
            <Zap className="w-3 h-3" />
            boosts
          </GenZChip>
        </div>

        {/* CTAs - Using GenZ Design System */}
        <div className="flex gap-3">
          {/* Primary CTA: Add Friend */}
          <GenZButton
            onClick={handleAddFriend}
            variant="signal"
            size="lg"
            glow
            className="flex-1"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Friend
          </GenZButton>
          
          {/* Secondary CTA: Share Profile */}
          <GenZButton
            onClick={handleShareProfile}
            variant="ghost"
            size="lg"
            className={genZClassNames.hoverGlow}
          >
            <Share2 className="w-4 h-4" />
          </GenZButton>
        </div>

        {/* Progress hint - Enhanced with GenZ styling */}
        {counters.friends < 3 && (
          <div className="text-center mt-3">
            <GenZText size="sm" dim>
              {counters.friends === 0 
                ? "Start with 3 friends to unlock the fun" 
                : `${3 - counters.friends} more friends to unlock more features`
              }
            </GenZText>
            <div className="w-full bg-genz-border rounded-full h-1 mt-2">
              <div 
                className="bg-gradient-to-r from-pri-500 to-sec-500 h-1 rounded-full transition-all duration-slow animate-breathe-glow"
                style={{ width: `${(counters.friends / 3) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </GenZCard>
  )
}