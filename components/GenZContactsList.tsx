'use client'

import React from 'react'
import { Trophy, MessageCircle, UserPlus } from 'lucide-react'
import { GenZContactsListProps } from '@/lib/types/genz-contacts'
import { trackSignalClicked, trackContactOpened } from '@/lib/services/GenZTelemetryService'
import { GenZButton, GenZCard, GenZChip, GenZHeading, GenZText, genZClassNames } from '@/components/ui/genz-design-system'

export function GenZContactsList({
  contacts,
  isLoading = false,
  onSignalClick,
  onContactOpen,
  emptyState = {
    title: "Start with 3 friends to unlock the fun.",
    ctaLabel: "Add Friend",
  }
}: GenZContactsListProps) {

  const handleSignalClick = (contact: typeof contacts[0]) => {
    trackSignalClicked(contact.id)
    onSignalClick(contact)
  }

  const handleContactClick = (contact: typeof contacts[0]) => {
    if (onContactOpen) {
      trackContactOpened(contact.id)
      onContactOpen(contact)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <GenZCard variant="glass" className="text-center p-8">
          <div className="animate-spin text-3xl mb-4">⚡</div>
          <GenZText dim>Loading your squad...</GenZText>
        </GenZCard>
      </div>
    )
  }

  if (contacts.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <GenZCard variant="glass" className="text-center p-8">
          {/* Illustration */}
          <div className="text-7xl mb-6 animate-float">👥</div>
          
          <GenZHeading level={3} className="mb-3">
            {emptyState.title}
          </GenZHeading>
          
          <GenZText dim className="mb-6">
            Connect with classmates, dormmates, or campus club members
          </GenZText>
          
          {emptyState.onCtaClick && (
            <GenZButton
              onClick={emptyState.onCtaClick}
              variant="signal"
              size="lg"
              glow
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {emptyState.ctaLabel}
            </GenZButton>
          )}
        </GenZCard>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 space-y-3">
      {contacts.map((contact) => (
        <GenZCard
          key={contact.id}
          variant="glass"
          className={`group cursor-pointer p-4 ${genZClassNames.hoverScale} transition-all duration-norm`}
          onClick={() => handleContactClick(contact)}
        >
          <div className="flex items-center gap-3">
            {/* Avatar - Enhanced with GenZ styling */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sec-500/30 to-pri-500/20 border border-sec-500/30 flex items-center justify-center">
                {contact.avatarUrl ? (
                  <img 
                    src={contact.avatarUrl} 
                    alt={contact.displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-genz-text font-semibold text-sm">
                    {contact.displayName.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              {/* Online status - Enhanced with glow */}
              {contact.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-genz-success border-2 border-panel rounded-full shadow-glow animate-breathe-glow" />
              )}
            </div>

            {/* Contact Info - Using GenZ Typography */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <GenZText className="font-semibold truncate">
                  {contact.displayName}
                </GenZText>
                <GenZText size="sm" dim>
                  {contact.handle}
                </GenZText>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Last signal or status - Enhanced with chips */}
                {contact.lastSignalSummary ? (
                  <GenZChip variant="neutral" className="max-w-32 truncate">
                    {contact.lastSignalSummary}
                  </GenZChip>
                ) : (
                  <GenZText size="sm" className="text-genz-success">
                    {contact.propsReceived ? `${contact.propsReceived} props` : 'New friend'}
                  </GenZText>
                )}
                
                {contact.isOnline && (
                  <GenZText size="sm" className="text-genz-success">• Online</GenZText>
                )}
              </div>
            </div>

            {/* Actions - Using GenZ Buttons */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-norm">
              {/* Signal Button */}
              <GenZButton
                variant="boost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSignalClick(contact)
                }}
                className={genZClassNames.hoverScale}
              >
                <Trophy className="w-3 h-3 mr-1" />
                Signal
              </GenZButton>
              
              {/* Chat Button */}
              <GenZButton
                variant="ghost"
                size="sm"
                className="w-9 h-9 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  // TODO: Open chat/DM
                }}
              >
                <MessageCircle className="w-4 h-4" />
              </GenZButton>
            </div>
          </div>
        </GenZCard>
      ))}
    </div>
  )
}