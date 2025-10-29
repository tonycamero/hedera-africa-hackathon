'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeft, Share, Copy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import RecognitionCard3D from '@/components/RecognitionCard3D'
import type { EnhancedSignalType } from '@/lib/services/RecognitionEnrichmentService'
import { mapRarityToCanonical, getRarityConfig } from '@/lib/rarity/canonical-rarity'

interface RecognitionDetailPageProps {
  // Static generation will pass props via generateStaticParams
}

export default function RecognitionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [signal, setSignal] = useState<EnhancedSignalType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copySuccess, setCopySuccess] = useState(false)

  const signalId = params?.id as string

  useEffect(() => {
    if (!signalId) return

    loadSignalDetail()
  }, [signalId])

  const loadSignalDetail = async () => {
    try {
      setIsLoading(true)
      console.log('[RecognitionDetail] Loading signal:', signalId)
      
      // First try to get from full collection, then filter by ID
      const response = await fetch('/api/recognition')
      const result = await response.json()
      
      if (!result.success || !result.data) {
        throw new Error('Failed to load recognition data')
      }
      
      // Find the specific signal
      const foundSignal = result.data.find((s: any) => s.id === signalId)
      if (!foundSignal) {
        throw new Error(`Signal "${signalId}" not found`)
      }
      
      // Transform to EnhancedSignalType (same logic as collections page for now)
      const enhancedSignal: EnhancedSignalType = {
        type_id: `${foundSignal.id}@1`,
        base_id: foundSignal.id,
        version: 1,
        category: foundSignal.category,
        name: foundSignal.name,
        description: foundSignal.description,
        labels: generateLabels(foundSignal.name, foundSignal.description, foundSignal.category),
        rarity: mapRarityToCanonical(foundSignal.rarity),
        icon: foundSignal.icon,
        content_hash: `hash-${foundSignal.id}`,
        created_at: foundSignal._ts,
        source: 'recognition_signals',
        metadata: {
          original_rarity: foundSignal.rarity,
          hrl: foundSignal._hrl,
          timestamp: foundSignal._ts
        }
      }
      
      setSignal(enhancedSignal)
    } catch (error) {
      console.error('[RecognitionDetail] Failed to load signal:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Temporary label generation (will be replaced with real enrichment service)
  const generateLabels = (name: string, description: string, category: string) => {
    const labels = [name.toLowerCase().replace(/\s+/g, '-')]
    if (category === 'social') labels.push('social-dynamics')
    if (category === 'academic') labels.push('academic-achievement')
    if (category === 'professional') labels.push('workplace-skills')
    if (description.includes('confidence')) labels.push('confidence')
    if (name.toLowerCase().includes('goat')) labels.push('legendary', 'excellence')
    if (name.toLowerCase().includes('rizz')) labels.push('charisma', 'social-skills')
    return labels.slice(0, 4)
  }

  const handleShare = async () => {
    const shareUrl = window.location.href
    const shareText = `Check out this ${signal?.name} recognition card from TrustMesh!`

    if (navigator.share) {
      // Use native sharing if available
      try {
        await navigator.share({
          title: `${signal?.name} - TrustMesh Recognition Card`,
          text: shareText,
          url: shareUrl
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      // Fallback to copying URL
      await handleCopyLink()
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Failed to copy link')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin motion-reduce:animate-none rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading recognition card...</p>
        </div>
      </div>
    )
  }

  if (!signal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-white mb-2">Card Not Found</h1>
          <p className="text-purple-200 mb-6">The recognition card "{signalId}" doesn't exist.</p>
          <Button 
            onClick={() => router.push('/collections')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Collections
          </Button>
        </div>
      </div>
    )
  }

  const rarityConfig = getRarityConfig(signal.rarity)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="bg-white/10 border-white/20 text-white md:hover:bg-white/20 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex gap-2">
            <Button
              onClick={handleShare}
              variant="outline" 
              className="bg-white/10 border-white/20 text-white md:hover:bg-white/20 min-h-[44px]"
            >
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
            
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="bg-white/10 border-white/20 text-white md:hover:bg-white/20 min-h-[44px]"
            >
              <Copy className="w-4 h-4 mr-2" />
              {copySuccess ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Card Display */}
          <div className="flex justify-center">
            <div className="w-full max-w-sm">
              <RecognitionCard3D 
                signal={signal} 
                compact={false}
              />
            </div>
          </div>

          {/* Card Details */}
          <div className="space-y-6">
            
            {/* Title & Category */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{signal.icon}</span>
                <div>
                  <h1 className="text-3xl font-bold text-white leading-tight">
                    {signal.name}
                  </h1>
                  <p className="text-purple-300 text-lg capitalize">
                    {signal.category} • {rarityConfig.label}
                  </p>
                </div>
              </div>
              <p className="text-xl text-purple-100 leading-relaxed">
                {signal.description}
              </p>
            </div>

            {/* Labels */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {signal.labels.map((label, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-2 rounded-full text-sm font-medium bg-white/20 text-white border border-white/30"
                  >
                    {label.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Details</h3>
              <div className="space-y-2 text-purple-200">
                <div className="flex justify-between">
                  <span>Type ID:</span>
                  <code className="font-mono text-sm bg-black/20 px-2 py-1 rounded">
                    {signal.type_id}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span>Rarity:</span>
                  <span className="font-medium">{rarityConfig.emoji} {rarityConfig.label}</span>
                </div>
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span className="font-medium capitalize">{signal.category}</span>
                </div>
                <div className="flex justify-between">
                  <span>Source:</span>
                  <span className="font-medium">HCS Recognition Signals</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-white/20">
              <Button
                onClick={() => router.push('/collections')}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 md:hover:from-purple-700 md:hover:to-pink-700 text-white font-medium min-h-[48px]"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Full Collection
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

