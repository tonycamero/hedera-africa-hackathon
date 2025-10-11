// components/SignalRow.tsx
// TODO: T3 - Enhanced signal row with boost + share for GenZ UX

'use client'

import React, { useState } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { 
  Activity, 
  Users, 
  Shield, 
  Clock, 
  ArrowUp, 
  Share2, 
  Heart,
  ArrowUpRight,
  ArrowDownLeft 
} from 'lucide-react'
import { signalsStore, type SignalEvent, useSignals } from '../lib/stores/signalsStore'
import { createBoostShareData, shareBoost } from '../lib/utils/share'

interface SignalRowProps {
  signal: SignalEvent
  showBoost?: boolean
  showShare?: boolean
  onShare?: (signal: SignalEvent, boostUrl: string) => void
}

export function SignalRow({ 
  signal, 
  showBoost = true, 
  showShare = true, 
  onShare 
}: SignalRowProps) {
  const [isSharing, setIsSharing] = useState(false)
  
  // TODO: T3 - Subscribe to boost count for this specific signal
  const boostCount = useSignals((store) => 
    signal.id ? store.getBoostCount(signal.id) : 0
  )

  // TODO: T3 - Handle boost action
  const handleBoost = () => {
    if (signal.id) {
      signalsStore.incrementBoostCount(signal.id)
      console.log('[SignalRow] Boosted signal:', signal.id)
    }
  }

  // TODO: T3 - Handle share action
  const handleShare = async () => {
    if (!signal.id) return
    
    setIsSharing(true)
    try {
      const boostId = signal.metadata?.boostId || signal.id
      const recipientHandle = signal.metadata?.recipientHandle
      
      const shareData = createBoostShareData(boostId, {
        recipientHandle,
        utm: true
      })
      
      const success = await shareBoost(shareData)
      if (success && onShare) {
        onShare(signal, shareData.url)
      }
    } catch (error) {
      console.error('[SignalRow] Share failed:', error)
    } finally {
      setIsSharing(false)
    }
  }

  const getSignalIcon = () => {
    switch (signal.type) {
      case 'CONTACT_REQUEST':
      case 'CONTACT_ACCEPT':
        return <Users className="h-4 w-4" />
      case 'TRUST_ALLOCATE':
        return <Shield className="h-4 w-4" />
      case 'RECOGNITION_MINT':
        return <Heart className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const formatSignalDescription = () => {
    const fromShort = signal.actor.slice(-6)
    const toShort = signal.target?.slice(-6) || 'unknown'
    
    switch (signal.type) {
      case 'CONTACT_REQUEST':
        return `Contact request: ${fromShort} → ${toShort}`
      case 'CONTACT_ACCEPT':
        return `Contact accepted: ${fromShort} ↔ ${toShort}`
      case 'TRUST_ALLOCATE':
        return `Trust allocated: ${fromShort} → ${toShort}`
      case 'RECOGNITION_MINT':
        return `Recognition sent: ${fromShort} → ${toShort}`
      default:
        return signal.type.replace(/_/g, ' ').toLowerCase()
    }
  }

  const formatRelativeTime = () => {
    const now = Date.now()
    const seconds = Math.floor((now - signal.ts) / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const getDirectionIcon = () => {
    // TODO: Determine signal direction based on actor/target and current user
    return <ArrowUpRight className="h-3 w-3 text-blue-600" />
  }

  const getSourceBadge = () => {
    return (
      <Badge 
        variant="outline" 
        className={`text-xs ${
          signal.source === 'hcs' 
            ? 'bg-green-50 text-green-700 border-green-200' 
            : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}
      >
        {signal.source === 'hcs' ? '✓ HCS' : 'cached'}
      </Badge>
    )
  }

  return (
    <Card className="border-slate-200 hover:border-slate-300 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon & Direction */}
          <div className="flex items-center gap-1 mt-1">
            {getSignalIcon()}
            {getDirectionIcon()}
          </div>
          
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-medium text-slate-900 truncate">
                {formatSignalDescription()}
              </p>
              {getSourceBadge()}
            </div>
            
            <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatRelativeTime()}</span>
              </div>
              <div className="truncate">
                Topic: {signal.topicId.slice(-8)}
              </div>
            </div>

            {/* TODO: T3 - GenZ Actions Row */}
            {(showBoost || showShare) && (
              <div className="flex items-center gap-2">
                {showBoost && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBoost}
                    className="h-7 px-2 text-xs hover:bg-blue-50"
                  >
                    <ArrowUp className="h-3 w-3 mr-1" />
                    Boost {boostCount > 0 && `(${boostCount})`}
                  </Button>
                )}
                
                {showShare && onShare && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    disabled={isSharing}
                    className="h-7 px-2 text-xs hover:bg-green-50"
                  >
                    <Share2 className="h-3 w-3 mr-1" />
                    {isSharing ? 'Sharing...' : 'Share'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SignalRow