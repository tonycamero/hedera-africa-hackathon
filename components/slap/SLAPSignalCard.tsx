"use client"

/**
 * SLAP Lens-Aware Signal Card
 * Universal signal display that adapts vocabulary and styling based on user lens
 */

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { slapLensManager, type LensType } from '@/lib/hcs/slap-lens-manager'
import { GenZButton, GenZCard, GenZChip } from '@/components/ui/genz-design-system'
import type { SignalEvent } from '@/lib/types'
import { Share2, Heart, MessageCircle, TrendingUp } from 'lucide-react'

interface SLAPSignalCardProps {
  signal: SignalEvent
  lens: LensType
  onAction?: (action: string, signal: SignalEvent) => void
  showActions?: boolean
  compact?: boolean
}

export const SLAPSignalCard: React.FC<SLAPSignalCardProps> = ({
  signal,
  lens,
  onAction,
  showActions = true,
  compact = false
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const translation = slapLensManager.translateSignal(signal, lens)
  const suggestedActions = slapLensManager.getSuggestedActions(signal, lens)

  const handleAction = (action: string) => {
    onAction?.(action, signal)
  }

  const handleShare = () => {
    if (translation.shareTemplate) {
      if (navigator.share) {
        navigator.share({
          text: translation.shareTemplate,
          url: window.location.href
        })
      } else {
        navigator.clipboard.writeText(translation.shareTemplate)
      }
    }
  }

  // Lens-specific styling
  const cardVariant = lens === 'genz' ? 'glass' : 'panel'
  const priorityGlow = translation.priority === 'high' || translation.priority === 'urgent'

  return (
    <GenZCard 
      variant={cardVariant}
      glow={priorityGlow && isHovered}
      className={cn(
        "transition-all duration-300 hover:scale-[1.01] cursor-pointer",
        compact ? "p-3" : "p-4",
        // Lens-specific border colors
        lens === 'genz' && "border-pri-500/20 hover:border-pri-500/40",
        lens === 'professional' && "border-slate-600/50 hover:border-slate-400/60",
        lens === 'hybrid' && "border-gradient-to-r from-pri-500/20 to-sec-500/20"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header Section */}
      <div className="flex items-start justify-between gap-3">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* Priority/Category Chip */}
            <GenZChip 
              variant={lens === 'genz' ? 'boost' : 'signal'}
              className="text-xs"
            >
              {translation.category}
            </GenZChip>
            
            {/* Timestamp */}
            <span className="text-xs text-genz-text-dim">
              {formatRelativeTime(signal.ts)}
            </span>
          </div>

          {/* Title with Emoji */}
          <div className="flex items-center gap-2 mb-2">
            {translation.emoji && (
              <span className="text-lg">{translation.emoji}</span>
            )}
            <h3 className={cn(
              "font-semibold truncate",
              compact ? "text-sm" : "text-base",
              // Lens-specific text colors
              lens === 'genz' && "text-pri-400",
              lens === 'professional' && "text-slate-200", 
              lens === 'hybrid' && "bg-gradient-to-r from-pri-400 to-sec-400 bg-clip-text text-transparent"
            )}>
              {translation.title}
            </h3>
          </div>

          {/* Description */}
          {!compact && (
            <p className="text-sm text-genz-text-dim mb-3 line-clamp-2">
              {translation.description}
            </p>
          )}

          {/* Signal-specific metadata */}
          <div className="flex items-center gap-4 text-xs text-genz-text-dim">
            {signal.actor && (
              <span>From: {signal.actor.slice(-6)}</span>
            )}
            {signal.target && (
              <span>To: {signal.target.slice(-6)}</span>
            )}
            {signal.metadata?.xpValue && (
              <span className="text-pri-400">+{signal.metadata.xpValue} XP</span>
            )}
          </div>
        </div>

        {/* Priority Indicator */}
        {(translation.priority === 'high' || translation.priority === 'urgent') && (
          <div className={cn(
            "w-2 h-2 rounded-full animate-pulse",
            translation.priority === 'urgent' ? "bg-red-500" : "bg-pri-500"
          )} />
        )}
      </div>

      {/* Actions Section */}
      {showActions && !compact && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
          {/* Primary Actions */}
          <div className="flex items-center gap-2">
            {suggestedActions.slice(0, 2).map((action, index) => (
              <GenZButton
                key={index}
                size="sm"
                variant={index === 0 ? "boost" : "ghost"}
                onClick={() => handleAction(action)}
                className="text-xs"
              >
                {action}
              </GenZButton>
            ))}
          </div>

          {/* Secondary Actions */}
          <div className="flex items-center gap-1">
            {/* Share Button (GenZ and Hybrid only) */}
            {translation.shareTemplate && lens !== 'professional' && (
              <button
                onClick={handleShare}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Share"
              >
                <Share2 className="w-4 h-4 text-genz-text-dim" />
              </button>
            )}

            {/* Like/Acknowledge Button */}
            <button
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title={lens === 'genz' ? 'Like' : 'Acknowledge'}
            >
              <Heart className="w-4 h-4 text-genz-text-dim" />
            </button>

            {/* Comment/Respond Button */}
            <button
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title={lens === 'genz' ? 'Comment' : 'Respond'}
            >
              <MessageCircle className="w-4 h-4 text-genz-text-dim" />
            </button>
          </div>
        </div>
      )}

      {/* Lens Debug Info (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 p-2 bg-black/20 rounded text-xs text-genz-text-dim">
          <div>Lens: {lens}</div>
          <div>Type: {signal.type}</div>
          <div>Priority: {translation.priority}</div>
        </div>
      )}
    </GenZCard>
  )
}

// Utility function for relative time formatting
function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d`
  if (hours > 0) return `${hours}h`
  if (minutes > 0) return `${minutes}m`
  return 'now'
}

// Compact variant for lists and feeds
export const SLAPSignalCardCompact: React.FC<SLAPSignalCardProps> = (props) => (
  <SLAPSignalCard {...props} compact showActions={false} />
)

// Professional variant with enhanced metadata
export const SLAPSignalCardProfessional: React.FC<SLAPSignalCardProps & { showMetadata?: boolean }> = ({ 
  showMetadata = true, 
  ...props 
}) => (
  <div>
    <SLAPSignalCard {...props} lens="professional" />
    {showMetadata && props.signal.metadata && (
      <div className="mt-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
        <div className="text-xs text-slate-400 space-y-1">
          <div>Transaction ID: {props.signal.id.slice(-8)}</div>
          <div>Topic: {props.signal.topicId}</div>
          {props.signal.metadata.amount && (
            <div>Amount: {props.signal.metadata.amount}</div>
          )}
        </div>
      </div>
    )}
  </div>
)