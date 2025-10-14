'use client'

import React, { useState } from 'react'
import { ArrowUp, MessageSquare, Share2 } from 'lucide-react'
import { GENZ_TEMPLATES } from '@/lib/filters/contentGuard'

interface BoostActionsProps {
  boostId: string
  currentBoostCount: number
}

export function BoostActions({ boostId, currentBoostCount }: BoostActionsProps) {
  const [isBoostLoading, setIsBoostLoading] = useState(false)
  const [isSuggestLoading, setIsSuggestLoading] = useState(false)
  const [showSuggestModal, setShowSuggestModal] = useState(false)
  const [boostCount, setBoostCount] = useState(currentBoostCount)
  const [hasBoost, setHasBoost] = useState(false)
  const [actionMessage, setActionMessage] = useState('')

  // Handle anonymous boost
  const handleBoost = async () => {
    if (hasBoost || isBoostLoading) return

    setIsBoostLoading(true)
    setActionMessage('') // Clear previous messages
    try {
      const response = await fetch('/api/signal/boost', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest' // Basic CSRF protection
        },
        body: JSON.stringify({ boostId })
      })

      if (response.ok) {
        const result = await response.json()
        setBoostCount(prev => prev + 1)
        setHasBoost(true)
        setActionMessage('Boost added successfully!')
        console.log('[BoostActions] Boost successful:', result)
      } else {
        const error = await response.json()
        console.error('[BoostActions] Boost failed:', error)
        setActionMessage(error.error || 'Failed to boost. Please try again.')
      }
    } catch (error) {
      console.error('[BoostActions] Boost error:', error)
      setActionMessage('Network error. Please try again.')
    } finally {
      setIsBoostLoading(false)
    }
  }

  // Handle suggest (placeholder - would open modal in full implementation)
  const handleSuggest = async () => {
    if (isSuggestLoading) return

    // For demo, just simulate a suggest action
    setIsSuggestLoading(true)
    try {
      const response = await fetch('/api/signal/suggest', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest' // Basic CSRF protection
        },
        body: JSON.stringify({ 
          boostId,
          def_id: 'grit.clutched@1', // Demo template
          note: 'Great signal!',
          sessionId: crypto.randomUUID() // Generate unique session for demo
        })
      })

      if (response.ok) {
        setActionMessage('🔁 Suggestion sent! Others can now see your template recommendation.')
      } else {
        const error = await response.json()
        console.error('[BoostActions] Suggest failed:', error)
        setActionMessage(error.error || 'Failed to suggest. Please try again.')
      }
    } catch (error) {
      console.error('[BoostActions] Suggest error:', error)
      setActionMessage('Network error. Please try again.')
    } finally {
      setIsSuggestLoading(false)
    }
  }

  // Handle share (Web Share API with fallback)
  const handleShare = async () => {
    const shareUrl = window.location.href
    const shareText = 'Check out this GenZ signal boost!'

    if (navigator.share) {
      try {
        await navigator.share({
          title: '🔥 GenZ Signal Boost',
          text: shareText,
          url: shareUrl
        })
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          fallbackShare(shareUrl)
        }
      }
    } else {
      fallbackShare(shareUrl)
    }
  }

  // Fallback share (copy to clipboard)
  const fallbackShare = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setActionMessage('🔗 Link copied to clipboard!')
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setActionMessage('🔗 Link copied!')
    })
  }

  return (
    <div className="space-y-4">
      {/* Action status - Live region for screen readers */}
      {actionMessage && (
        <div 
          className="text-center text-sm text-purple-200 bg-purple-900/20 px-4 py-2 rounded-full"
          aria-live="polite"
          role="status"
        >
          {actionMessage}
        </div>
      )}
      
      {/* Action Buttons - Mobile-first stack layout */}
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-3 justify-center px-4">
        {/* Boost Button */}
        <button
          onClick={handleBoost}
          disabled={isBoostLoading || hasBoost}
          className={`
            flex items-center justify-center gap-2 
            px-8 py-4 sm:px-6 sm:py-3 
            min-h-[56px] sm:min-h-0
            rounded-full font-medium transition-all
            text-base sm:text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${hasBoost 
              ? 'bg-blue-500/30 text-blue-300 cursor-not-allowed opacity-60' 
              : 'bg-blue-500/20 text-white md:hover:bg-blue-500/30 md:hover:scale-105 active:scale-95'
            }
            ${isBoostLoading ? 'md:animate-pulse motion-reduce:animate-none' : ''}
          `}
          aria-label={`Boost this signal. Current boost count: ${boostCount}`}
          aria-describedby="boost-description"
        >
          <ArrowUp className={`h-5 w-5 ${isBoostLoading ? 'md:animate-spin motion-reduce:animate-none' : ''}`} />
          {hasBoost ? 'Boosted!' : isBoostLoading ? 'Boosting...' : 'Boost'}
          {boostCount > 0 && (
            <span className="bg-white/20 px-2 py-1 rounded-full text-xs" aria-hidden="true">
              {boostCount}
            </span>
          )}
        </button>

        {/* Suggest Button */}
        <button
          onClick={handleSuggest}
          disabled={isSuggestLoading}
          className="
            flex items-center justify-center gap-2 
            px-8 py-4 sm:px-6 sm:py-3 
            min-h-[56px] sm:min-h-0
            rounded-full font-medium transition-all
            text-base sm:text-sm
            bg-purple-500/20 text-white 
            md:hover:bg-purple-500/30 md:hover:scale-105 active:scale-95
            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
            disabled:opacity-60 disabled:cursor-not-allowed
          "
          aria-label="Suggest an alternative template for this signal"
          aria-describedby="suggest-description"
        >
          <MessageSquare className={`h-5 w-5 ${isSuggestLoading ? 'md:animate-spin motion-reduce:animate-none' : ''}`} />
          {isSuggestLoading ? 'Suggesting...' : 'Suggest'}
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="
            flex items-center justify-center gap-2 
            px-8 py-4 sm:px-6 sm:py-3 
            min-h-[56px] sm:min-h-0
            rounded-full font-medium transition-all
            text-base sm:text-sm
            bg-green-500/20 text-white 
            md:hover:bg-green-500/30 md:hover:scale-105 active:scale-95
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
          "
          aria-label="Share this signal with others"
          aria-describedby="share-description"
        >
          <Share2 className="h-5 w-5" />
          Share
        </button>
      </div>

      {/* Action Descriptions - Mobile-friendly layout */}
      <div className="text-center space-y-3 sm:space-y-2 text-sm text-purple-200 px-4">
        <div className="grid grid-cols-1 gap-3 sm:flex sm:justify-center sm:gap-8 text-sm sm:text-xs">
          <div className="flex items-center justify-center gap-2" id="boost-description">
            <ArrowUp className="h-3 w-3" />
            <span>Boost (anonymous)</span>
          </div>
          <div className="flex items-center justify-center gap-2" id="suggest-description">
            <MessageSquare className="h-3 w-3" />
            <span>Suggest template</span>
          </div>
          <div className="flex items-center justify-center gap-2" id="share-description">
            <Share2 className="h-3 w-3" />
            <span>Share link</span>
          </div>
        </div>
      </div>
    </div>
  )
}