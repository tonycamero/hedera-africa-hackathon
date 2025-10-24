'use client'

import { useState, useEffect } from 'react'
import { signalsStore } from '@/lib/stores/signalsStore'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SignalInstance } from '@/lib/types/signals-collectible'
import { getCategoryIcon, getRarityTheme, formatRarityDisplay } from '@/lib/ui/signal-rarities'
import { GenZCard, GenZText, GenZHeading } from '@/components/ui/genz-design-system'
import { Clock, TrendingUp, Sparkles, Gift, Database, Zap } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { getSessionId } from '@/lib/session'

interface ActivityItem {
  id: string
  type: 'mint' | 'claim' | 'boost'
  signal: SignalInstance
  actor: string
  timestamp: Date
  isFromNetwork: boolean
}

interface RecentActivityProps {
  recentMints?: SignalInstance[]
  showTitle?: boolean
}

export function RecentActivity({ recentMints = [], showTitle = true }: RecentActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Read recognition mints from signalsStore (already populated by ingestor)
    const recognitionEvents = signalsStore.getByType('RECOGNITION_MINT')
    
    const live = recognitionEvents.map((event, idx) => ({
      id: event.id || `live_${idx}`,
      type: 'mint' as const,
      signal: {
        instance_id: event.id || `sig_${idx}`,
        type_id: event.metadata?.definitionId || 'unknown',
        issuer_pub: event.actor,
        recipient_pub: event.target || event.metadata?.to || 'unknown',
        issued_at: new Date(event.ts).toISOString(),
        metadata: {
          category: event.metadata?.category || event.metadata?.name || 'Signal',
          rarity: event.metadata?.rarity || 'Regular',
          inscription: event.metadata?.note || event.metadata?.inscription || '',
          labels: event.metadata?.labels || [],
        }
      },
      actor: event.actor.replace('tm-', '').replace('-', ' '),
      timestamp: new Date(event.ts),
      isFromNetwork: true
    }))
    
    const mine = (recentMints || []).map((signal, idx) => ({
      id: `recent_${idx}`,
      type: 'mint' as const,
      signal,
      actor: 'You',
      timestamp: new Date(signal.issued_at),
      isFromNetwork: true
    }))
    
    const all = [...live, ...mine].sort((a,b)=>b.timestamp.getTime()-a.timestamp.getTime()).slice(0,8)
    setActivities(all)
    setLoading(false)
    
    // Subscribe to store updates
    const unsubscribe = signalsStore.subscribe(() => {
      const updated = signalsStore.getByType('RECOGNITION_MINT')
      if (updated.length !== recognitionEvents.length) {
        // Trigger re-render by updating effect dependencies
        setLoading(false)
      }
    })
    
    return unsubscribe
  }, [recentMints])


  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'mint':
        return <Sparkles className="h-3 w-3" />
      case 'claim':
        return <Gift className="h-3 w-3" />
      case 'boost':
        return <TrendingUp className="h-3 w-3" />
    }
  }

  const getActivityText = (activity: ActivityItem) => {
    const currentUserId = getSessionId() || 'tm-alex-chen'
    const recipientName = activity.signal.recipient_pub === currentUserId ? 'you' : 
                         activity.signal.recipient_pub.replace('tm-', '').replace('-', ' ')
    
    switch (activity.type) {
      case 'mint':
        return activity.actor === 'You' ? 
          `You minted a ${activity.signal.metadata.category} signal for ${recipientName}` :
          `${activity.actor} minted a ${activity.signal.metadata.category} signal for ${recipientName}`
      case 'claim':
        return `${activity.actor} claimed a ${activity.signal.metadata.category} signal`
      case 'boost':
        return `${activity.actor} boosted a ${activity.signal.metadata.category} signal`
    }
  }

  const handleBoost = (activity: ActivityItem) => {
    toast.success('Signal boosted! ⚡', {
      description: `Amplified the ${activity.signal.metadata.category} recognition`
    })
  }

  if (loading) {
    return (
      <GenZCard variant="glass" className="p-4">
        {showTitle && (
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-pri-500 animate-pulse" />
            <GenZHeading level={4}>Recent Activity</GenZHeading>
          </div>
        )}
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </GenZCard>
    )
  }

  return (
    <GenZCard variant="glass" className="p-4">
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-pri-500" />
            <GenZHeading level={4}>Recent Activity</GenZHeading>
          </div>
          <GenZText size="sm" dim>{activities.length} recent</GenZText>
        </div>
      )}

      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📡</div>
            <GenZText className="mb-2">No recent activity</GenZText>
            <GenZText size="sm" dim>Start minting signals to see network activity</GenZText>
          </div>
        ) : (
          activities.map((activity) => {
            const theme = getRarityTheme(activity.signal.metadata.rarity)
            
            return (
              <Card key={activity.id} className="p-3 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  {/* Signal Icon */}
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-sm flex-shrink-0`}>
                    {getCategoryIcon(activity.signal.metadata.category)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Activity Header */}
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center gap-1">
                        {getActivityIcon(activity.type)}
                        <span className="text-sm font-medium">
                          {getActivityText(activity)}
                        </span>
                      </div>
                      {activity.isFromNetwork && (
                        <div className="w-1.5 h-1.5 rounded-full bg-pri-500 animate-breathe-glow" />
                      )}
                    </div>
                    
                    {/* Signal Details */}
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={`text-xs ${theme.text} ${theme.gradient.replace('from-', 'bg-').replace('to-', '').split(' ')[0]}/10`}>
                        {formatRarityDisplay(activity.signal.metadata.rarity)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    
                    {/* Signal Inscription (truncated) */}
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      "{activity.signal.metadata.inscription}"
                    </p>
                    
                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {activity.signal.metadata.labels.slice(0, 2).map((label, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-gray-50">
                            {label}
                          </Badge>
                        ))}
                      </div>
                      
                      {activity.type !== 'boost' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleBoost(activity)}
                          className="h-6 px-2 text-xs hover:bg-pri-500/10 hover:text-pri-500"
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Boost
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </GenZCard>
  )
}