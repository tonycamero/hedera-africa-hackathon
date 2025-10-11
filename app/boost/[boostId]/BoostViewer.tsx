'use client'

import React, { useState, useEffect } from 'react'
import { ArrowUp, MessageSquare, Share2, ExternalLink, Sparkles } from 'lucide-react'
import { signalsStore, useSignals } from '@/lib/stores/signalsStore'
import { getTemplate } from '@/lib/templates'
import { TemplateManager } from '@/lib/templates/TemplateManager'
import { TemplateTelemetry } from '@/lib/telemetry/TemplateTelemetry'
import { BoostActions } from '@/components/BoostActions'
import { PublicContactCard } from '@/components/PublicContactCard'

interface BoostViewerProps {
  boostId: string
}

export function BoostViewer({ boostId }: BoostViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  
  // Find signal with this boost ID in the store
  const signal = useSignals((store) => 
    store.getAll().find(s => s.metadata?.boostId === boostId)
  )
  
  const boostCount = useSignals((store) => 
    signal?.id ? store.getBoostCount(signal.id) : 0
  )

  useEffect(() => {
    // Simulate loading time for better UX
    const timer = setTimeout(() => {
      if (!signal) {
        setNotFound(true)
      }
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [signal])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin text-4xl mb-4">⚡</div>
          <div className="text-lg">Loading boost...</div>
        </div>
      </div>
    )
  }

  if (notFound || !signal?.metadata) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto px-4">
          <div className="text-6xl mb-6">😅</div>
          <h1 className="text-2xl font-bold mb-4">This boost link isn't live yet</h1>
          <p className="text-purple-200 mb-8">
            The signal you're looking for might still be processing, or the link might be incorrect.
          </p>
          <a 
            href="/" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur rounded-full text-white font-medium hover:bg-white/30 transition-all"
          >
            <ExternalLink className="h-4 w-4" />
            Check out TrustMesh
          </a>
        </div>
      </div>
    )
  }

  // Extract signal data
  const template = getTemplate(signal.metadata.templateId)
  const templateText = template?.text || signal.metadata.template
  const fill = signal.metadata.fill
  const note = signal.metadata.note
  const senderHandle = signal.metadata.senderHandle
  const recipientHandle = signal.metadata.recipientHandle
  const recipientAccountId = signal.target

  // Record boost view for analytics and telemetry
  useEffect(() => {
    if (signal?.metadata?.templateId && template) {
      TemplateManager.recordTemplateUsage(signal.metadata.templateId, 'boost')
      
      // Track telemetry event
      TemplateTelemetry.trackBoosted({
        templateId: signal.metadata.templateId,
        lens: template.lens[0] || 'genz',
        context: template.context,
        rarity: template.rarity,
        category: template.category,
        boostId: boostId,
        userId: signal.target // recipient account ID
      })
    }
  }, [signal?.metadata?.templateId, template, boostId, signal?.target])

  // Format the praise text
  const praiseText = templateText?.replace('___', `"${fill}"`) || 'Amazing signal!'
  const recipient = recipientHandle || recipientAccountId?.slice(-6) || 'someone'

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Boost Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-6 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4 animate-pulse">🔥</div>
            <h1 className="text-3xl font-bold text-white mb-2">GenZ Signal Boost</h1>
            <div className="text-purple-200 text-sm">
              Blockchain-verified peer recognition
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
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 backdrop-blur rounded-full border border-green-500/30">
              <Sparkles className="h-4 w-4 text-green-400" />
              <span className="text-green-300 text-sm font-medium">HCS Verified</span>
            </div>
          </div>

          {/* Boost Actions */}
          <BoostActions 
            boostId={boostId}
            currentBoostCount={boostCount}
          />
          
          {/* Template Examples (if available) */}
          {template?.examples && template.examples.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/20">
              <h3 className="text-sm font-medium text-purple-300 mb-3 text-center">
                Other ways people say this:
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {template.examples.slice(0, 4).map((example, idx) => (
                  <span 
                    key={idx}
                    className="text-xs bg-white/10 text-purple-200 px-3 py-1 rounded-full"
                  >
                    "{templateText?.replace('___', `"${example}"`) || example}"
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Public Contact Card */}
        {recipientAccountId && (
          <PublicContactCard 
            accountId={recipientAccountId}
            handle={recipientHandle}
          />
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <a 
            href="/"
            className="text-purple-300 hover:text-white text-sm transition-colors"
          >
            Powered by TrustMesh → Sovereign Social Recognition
          </a>
        </div>
      </div>
    </div>
  )
}