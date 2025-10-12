'use client'

import { useState, useEffect } from 'react'
import { useHcsEvents } from '@/hooks/useHcsEvents'
import { recognitionItemsToActivity } from './transform'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SignalInstance } from '@/lib/types/signals-collectible'
import { getCategoryIcon, getRarityTheme, formatRarityDisplay } from '@/lib/ui/signal-rarities'
import { useDemoMode } from '@/lib/hooks/useDemoMode'
import { GenZCard, GenZText, GenZHeading } from '@/components/ui/genz-design-system'
import { Clock, TrendingUp, Sparkles, Gift, Database, Zap } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

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
}

export function RecentActivity({ recentMints = [] }: RecentActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const recognition = useHcsEvents('recognition', 2500)
  const { getDataSourceLabel, getDataSourceBadgeColor } = useDemoMode()

  useEffect(() => {
    const live = recognitionItemsToActivity(recognition.items) as any as ActivityItem[]
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
  }, [recognition.watermark, recentMints])

  const generateActivityData = () => {
    // Mock recent activity data
    const mockActivities: ActivityItem[] = [
      {
        id: 'act_1',
        type: 'mint',
        signal: {
          instance_id: 'inst_001',
          type_id: 'rizz@1',
          issuer_pub: 'tm-alex-chen',
          recipient_pub: 'tm-sarah-kim',
          issued_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          metadata: {
            category: 'Rizz',
            rarity: 'Heat',
            inscription: 'Absolutely killed that presentation to the investors! 🔥',
            labels: ['smooth operator', 'presentation king', 'confidence boost']
          }
        },
        actor: 'Alex Chen',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        isFromNetwork: true
      },
      {
        id: 'act_2',
        type: 'claim',
        signal: {
          instance_id: 'inst_002',
          type_id: 'clutch@1',
          issuer_pub: 'tm-mike-jones',
          recipient_pub: 'tm-alex-chen',
          issued_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          metadata: {
            category: 'Clutch',
            rarity: 'Peak',
            inscription: 'Fixed the production bug at 2AM when everything was on fire',
            labels: ['came through', 'under pressure', 'hero moment']
          }
        },
        actor: 'You',
        timestamp: new Date(Date.now() - 12 * 60 * 1000),
        isFromNetwork: true
      },
      {
        id: 'act_3',
        type: 'mint',
        signal: {
          instance_id: 'inst_003',
          type_id: 'day-1@1',
          issuer_pub: 'tm-lisa-park',
          recipient_pub: 'tm-david-wilson',
          issued_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          metadata: {
            category: 'Day 1',
            rarity: 'God-Tier',
            inscription: 'Been supporting this vision since the very beginning',
            labels: ['loyalty recognized', 'original supporter', 'foundation member']
          }
        },
        actor: 'Lisa Park',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        isFromNetwork: true
      },
      {
        id: 'act_4',
        type: 'boost',
        signal: {
          instance_id: 'inst_004',
          type_id: 'grind@1',
          issuer_pub: 'tm-john-doe',
          recipient_pub: 'tm-jane-smith',
          issued_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          metadata: {
            category: 'Grind',
            rarity: 'Regular',
            inscription: '5am workouts for 30 days straight - dedication noticed!',
            labels: ['hustle mode', 'discipline', 'consistency']
          }
        },
        actor: 'Multiple people',
        timestamp: new Date(Date.now() - 40 * 60 * 1000),
        isFromNetwork: false
      }
    ]

    // Add recent mints to the activity
    const mintActivities: ActivityItem[] = recentMints.map((signal, idx) => ({
      id: `recent_${idx}`,
      type: 'mint' as const,
      signal,
      actor: 'You',
      timestamp: new Date(signal.issued_at),
      isFromNetwork: true
    }))

    const allActivities = [...mintActivities, ...mockActivities]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 8)

    setActivities(allActivities)
    setLoading(false)
  }

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
    const recipientName = activity.signal.recipient_pub === 'tm-alex-chen' ? 'you' : 
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
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-pri-500 animate-pulse" />
          <GenZHeading level={4}>Recent Activity</GenZHeading>
        </div>
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-pri-500" />
          <GenZHeading level={4}>Recent Activity</GenZHeading>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`text-xs ${getDataSourceBadgeColor('signals')} flex items-center gap-1`}>
            {getDataSourceLabel('signals') === 'Mock Data' ? <Database className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
            {getDataSourceLabel('signals')}
          </Badge>
          <GenZText size="sm" dim>{activities.length} recent</GenZText>
        </div>
      </div>

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