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

  // Handle anonymous boost
  const handleBoost = async () => {
    if (hasBoost || isBoostLoading) return

    setIsBoostLoading(true)
    try {
      const response = await fetch('/api/signal/boost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boostId })
      })

      if (response.ok) {
        const result = await response.json()
        setBoostCount(prev => prev + 1)
        setHasBoost(true)
        console.log('[BoostActions] Boost successful:', result)
      } else {
        const error = await response.json()
        console.error('[BoostActions] Boost failed:', error)
        alert(error.error || 'Failed to boost. Please try again.')
      }
    } catch (error) {
      console.error('[BoostActions] Boost error:', error)
      alert('Network error. Please try again.')
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          boostId,
          def_id: 'grit.clutched@1', // Demo template
          note: 'Great signal!',
          sessionId: '0.0.5864559' // Demo session
        })
      })

      if (response.ok) {
        alert('🔁 Suggestion sent! Others can now see your template recommendation.')
      } else {
        const error = await response.json()
        console.error('[BoostActions] Suggest failed:', error)
        alert(error.error || 'Failed to suggest. Please try again.')
      }
    } catch (error) {
      console.error('[BoostActions] Suggest error:', error)
      alert('Network error. Please try again.')
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
      alert('🔗 Link copied to clipboard!')
    }).catch(() => {
      prompt('Copy this link to share:', url)
    })
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        {/* Boost Button */}
        <button
          onClick={handleBoost}
          disabled={isBoostLoading || hasBoost}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all
            ${hasBoost 
              ? 'bg-blue-500/30 text-blue-300 cursor-not-allowed' 
              : 'bg-blue-500/20 text-white hover:bg-blue-500/30 hover:scale-105 active:scale-95'
            }
            ${isBoostLoading ? 'animate-pulse' : ''}
          `}
        >
          <ArrowUp className={`h-5 w-5 ${isBoostLoading ? 'animate-spin' : ''}`} />
          {hasBoost ? 'Boosted!' : isBoostLoading ? 'Boosting...' : 'Boost'}
          {boostCount > 0 && (
            <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
              {boostCount}
            </span>
          )}
        </button>

        {/* Suggest Button */}
        <button
          onClick={handleSuggest}
          disabled={isSuggestLoading}
          className="flex items-center gap-2 px-6 py-3 rounded-full font-medium bg-purple-500/20 text-white hover:bg-purple-500/30 hover:scale-105 active:scale-95 transition-all"
        >
          <MessageSquare className={`h-5 w-5 ${isSuggestLoading ? 'animate-spin' : ''}`} />
          {isSuggestLoading ? 'Suggesting...' : 'Suggest'}
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-6 py-3 rounded-full font-medium bg-green-500/20 text-white hover:bg-green-500/30 hover:scale-105 active:scale-95 transition-all"
        >
          <Share2 className="h-5 w-5" />
          Share
        </button>
      </div>

      {/* Action Descriptions */}
      <div className="text-center space-y-2 text-sm text-purple-200">
        <div className="flex justify-center gap-8 text-xs">
          <div className="flex items-center gap-1">
            <ArrowUp className="h-3 w-3" />
            <span>Boost (anonymous)</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            <span>Suggest template</span>
          </div>
          <div className="flex items-center gap-1">
            <Share2 className="h-3 w-3" />
            <span>Share link</span>
          </div>
        </div>
      </div>
    </div>
  )
}