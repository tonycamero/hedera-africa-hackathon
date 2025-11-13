"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { type SignalEvent, signalsStore } from "@/lib/stores/signalsStore"
import { toLegacyEventArray } from "@/lib/services/HCSDataAdapter"
import { useHcsEvents } from "@/hooks/useHcsEvents"
import { getSessionId } from "@/lib/session"
import { 
  Activity, 
  Users, 
  Shield, 
  Trophy,
  Search,
  RotateCw,
  X,
  Calendar,
  User,
  Gift,
  ExternalLink,
  Plus,
  Filter
} from "lucide-react"
import { toast } from "sonner"
import { usePullToRefresh } from "@/lib/hooks/usePullToRefresh"
import { SendSignalsModal } from "@/components/SendSignalsModal"

interface EnhancedSignal extends SignalEvent {
  firstName: string
  onlineStatus: 'online' | 'offline' | 'idle'
  eventDescription: string
}

// Mock user recognition token collection - would come from HCS later
const getUserTokenCollection = () => [
  {
    id: 'token-leadership-1',
    category: 'leadership',
    name: 'Strategic Vision',
    description: 'Recognized for exceptional strategic thinking and long-term planning capabilities',
    trustValue: 25,
    receivedFrom: 'Sarah Chen',
    receivedAt: Date.now() - 86400000 * 2,
    icon: 'telescope'
  },
  {
    id: 'token-execution-1', 
    category: 'execution',
    name: 'Project Delivery',
    description: 'Outstanding project management and delivery excellence under pressure',
    trustValue: 20,
    receivedFrom: 'Michael Rodriguez',
    receivedAt: Date.now() - 86400000 * 5,
    icon: 'truck'
  },
  {
    id: 'token-knowledge-1',
    category: 'knowledge',
    name: 'Technical Expertise',
    description: 'Deep technical knowledge and ability to solve complex problems',
    trustValue: 30,
    receivedFrom: 'David Kim',
    receivedAt: Date.now() - 86400000 * 7,
    icon: 'cpu'
  },
  {
    id: 'token-leadership-2',
    category: 'leadership',
    name: 'Team Inspiration',
    description: 'Exceptional ability to motivate and inspire team members',
    trustValue: 22,
    receivedFrom: 'Emily Johnson',
    receivedAt: Date.now() - 86400000 * 10,
    icon: 'users'
  }
]

export default function SignalsPage() {
  const trustFeed = useHcsEvents('trust', 2500)
  const recognitionFeed = useHcsEvents('recognition', 2500)
  const contactFeed = useHcsEvents('contact', 2500)
  const profileFeed = useHcsEvents('profile', 2500)
  
  // Helper to resolve account ID to display name
  const getDisplayName = (accountId: string): string => {
    if (!accountId) return 'Unknown'
    
    // Try to find profile data from profileFeed events
    const profileEvents = profileFeed.events || []
    const profileUpdate = profileEvents
      .filter(event => event.type === 'PROFILE_UPDATE')
      .find(event => event.actor === accountId)
    
    if (profileUpdate?.metadata?.displayName) {
      return profileUpdate.metadata.displayName
    }
    
    // Try to find from contact mirror events
    const contactEvents = contactFeed.events || []
    const contactMirror = contactEvents
      .filter(event => event.type === 'CONTACT_MIRROR')
      .find(event => event.actor === accountId || event.target === accountId)
    
    if (contactMirror?.metadata?.displayName) {
      return contactMirror.metadata.displayName
    }
    
    // Fallback to formatted account ID
    if (accountId.startsWith('0.0.')) {
      const parts = accountId.split('.')
      return `...${parts[2]?.slice(-4) || accountId.slice(-4)}`
    }
    
    return accountId.length > 10 ? accountId.slice(0, 6) : accountId
  }
  
  const [signals, setSignals] = useState<EnhancedSignal[]>([])
  const [selectedTab, setSelectedTab] = useState<'feed' | 'tokens'>('feed')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [userTokens] = useState(getUserTokenCollection())
  const [selectedSignal, setSelectedSignal] = useState<EnhancedSignal | null>(null)
  const [filter, setFilter] = useState<'all' | 'from-me' | 'to-me' | 'mine'>(() => {
    // Load filter from localStorage
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('signals_filter') as any) || 'all'
    }
    return 'all'
  })
  const [showMintModal, setShowMintModal] = useState(false)
  
  const loadIdRef = useRef(0)

  const getFirstName = (actorId: string): string => {
    // For Hedera account IDs (0.0.xxxxx), show last 4 digits
    if (actorId.startsWith('0.0.')) {
      const parts = actorId.split('.')
      return `...${parts[2]?.slice(-4) || actorId.slice(-4)}`
    }
    
    // Legacy tm- format (deprecated)
    if (actorId.startsWith('tm-') && actorId.length > 3) {
      const namepart = actorId.slice(3).replace(/-/g, ' ')
      const words = namepart.split(' ')
      return words[0].charAt(0).toUpperCase() + words[0].slice(1)
    }
    
    return actorId.length > 10 ? actorId.slice(0, 6) : actorId
  }

  const getOnlineStatus = (signalId: string): 'online' | 'offline' | 'idle' => {
    const hash = signalId.split('').reduce((a, b) => (a + b.charCodeAt(0)) % 3, 0)
    const statuses: ('online' | 'offline' | 'idle')[] = ['online', 'offline', 'idle']
    return statuses[hash]
  }

  const getEventDescription = (signal: SignalEvent): string => {
    // For SIGNAL_MINT/RECOGNITION_MINT, show the rich token metadata (flat structure)
    if ((signal.type === 'SIGNAL_MINT' || signal.type === 'RECOGNITION_MINT') && signal.metadata) {
      const tokenName = signal.metadata.name || signal.metadata.recognition || signal.metadata.recognitionType || 'Recognition Token'
      const description = signal.metadata.description || signal.metadata.subtitle
      const category = signal.metadata.category
      const rarity = signal.metadata.rarity
      const emoji = signal.metadata.emoji
      
      // Build rich description with token name + description
      let displayText = `${emoji || '🏆'} ${tokenName}`
      if (description) displayText += ` - ${description}`
      if (rarity && rarity !== 'Common') displayText += ` (⭐ ${rarity})`
      
      return displayText
    }
    
    // Fallback for other event types
    const firstName = getFirstName(signal.actor)
    return `🏆 ${firstName} earned recognition`
  }

  const loadSignals = async () => {
    const myLoadId = ++loadIdRef.current
    try {
      setLoading(true)
      
      // Load recognition signals directly from signalsStore (populated by HCS backfill)
      const allSignals = signalsStore.getAll()
      console.log('[SignalsPage] Total signals in store:', allSignals.length)
      console.log('[SignalsPage] Sample raw signals:', allSignals.slice(0, 3))
      
      // Debug: inspect all signal types
      const signalTypes = allSignals.reduce((acc, s) => {
        acc[s.type] = (acc[s.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      console.log('[SignalsPage] Signal types in store:', signalTypes)
      
      // Debug: inspect recognition signal metadata structure
      const sampleRecognition = allSignals.find(s => s.type === 'SIGNAL_MINT' || s.type === 'RECOGNITION_MINT')
      if (sampleRecognition) {
        console.log('[SignalsPage] Sample recognition signal:', JSON.stringify(sampleRecognition, null, 2))
      } else {
        console.log('[SignalsPage] No SIGNAL_MINT or RECOGNITION_MINT signals found in storage')
      }
      
      // Filter to recognition events (SIGNAL_MINT or legacy RECOGNITION_MINT)
      const recognitionEvents = allSignals.filter(signal => {
        const isRecognition = signal.type === 'SIGNAL_MINT' || signal.type === 'RECOGNITION_MINT'
        const hasMetadata = signal.metadata && Object.keys(signal.metadata).length > 0
        
        // Check if this is a NEW signal with rich metadata (flat structure now)
        const hasRichMetadata = signal.metadata?.name || signal.metadata?.subtitle || signal.metadata?.senderName
        
        // Accept:
        // 1. Hedera account IDs (0.0.xxxxx) OR
        // 2. tm- signals that have NEW rich metadata
        const isHederaAccount = signal.actor?.startsWith('0.0.')
        const isTmWithRichData = signal.actor?.startsWith('tm-') && hasRichMetadata
        
        // Exclude: old demo-* and test signals
        const isNotOldDemo = !signal.actor?.startsWith('demo-') && !signal.actor?.startsWith('test')
        
        const passes = isRecognition && hasMetadata && (isHederaAccount || isTmWithRichData) && isNotOldDemo
        
        return passes
      })
      
      console.log('[SignalsPage] Recognition signals found:', recognitionEvents.length)
      console.log('[SignalsPage] Sample signal:', recognitionEvents[0])
      
      // Sort by timestamp (most recent first)
      const sortedEvents = recognitionEvents.sort((a, b) => b.ts - a.ts)
      
      const enhancedSignals: EnhancedSignal[] = sortedEvents.map((signal) => {
        // Try to get sender display name from metadata (flat structure)
        const displayName = signal.metadata?.senderName || getFirstName(signal.actor)
        
        return {
          ...signal,
          firstName: displayName,
          onlineStatus: getOnlineStatus(signal.id || ''),
          eventDescription: getEventDescription(signal)
        }
      })
      
      if (myLoadId === loadIdRef.current) {
        setSignals(enhancedSignals)
        setLoading(false)
        console.log(`[SignalsPage] Loaded ${enhancedSignals.length} recognition signals`)
      }
    } catch (err) {
      if (myLoadId === loadIdRef.current) {
        console.error('[SignalsPage] Error loading signals:', err)
        setLoading(false)
        toast.error('Failed to load signals')
      }
    }
  }

  const handleManualRefresh = async () => {
    try {
      toast.info('Refreshing signals...')
      
      // Clear cache and force reload from API
      const response = await fetch('/api/hcs/events?type=recognition')
      const data = await response.json()
      
      if (data.ok && data.items) {
        // Add all items to signalsStore (accept both tm- and 0.0. Hedera IDs)
        let newCount = 0
        data.items.forEach((item: any) => {
          const itemType = item.json?.type
          if (itemType === 'SIGNAL_MINT' || itemType === 'RECOGNITION_MINT') {
            const actorId = item.json.from
            // Accept Hedera accounts (0.0.xxxxx) or tm- format
            if (actorId?.startsWith('0.0.') || actorId?.startsWith('tm-')) {
              const event = {
                id: item.consensus_timestamp || item.sequence_number?.toString(),
                type: itemType as 'SIGNAL_MINT' | 'RECOGNITION_MINT',
                actor: actorId,
                target: item.json.payload?.recipientId || item.json.payload?.to,
                ts: Date.now(),
                topicId: item.topic_id || item.topicId || '',
                metadata: {
                  ...item.json,
                  sequenceNumber: item.sequence_number
                },
                source: 'hcs' as const
              }
              signalsStore.add(event)
              newCount++
            }
          }
        })
        toast.success(`✅ Refreshed! Loaded ${newCount} recognition signals`)
        await loadSignals()
      } else {
        toast.error('No data returned from API')
      }
    } catch (error) {
      console.error('[SignalsPage] Refresh error:', error)
      toast.error('Failed to refresh')
    }
  }
  
  const { bind, isPulling, distance } = usePullToRefresh(handleManualRefresh, 70)

  useEffect(() => {
    loadSignals()
    
    // Subscribe to signalsStore for real-time updates
    const unsubscribe = signalsStore.subscribe(() => {
      console.log('[SignalsPage] SignalsStore updated, reloading...')
      loadSignals()
    })
    
    return unsubscribe
  }, [])

  const getStatusColor = (status: 'online' | 'offline' | 'idle') => {
    switch (status) {
      case 'online': return 'bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
      case 'idle': return 'bg-yellow-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
      case 'offline': return 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
    }
  }

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'CONTACT_REQUEST':
      case 'CONTACT_ACCEPT':
        return <Users className="w-4 h-4" />
      case 'TRUST_ALLOCATE':
        return <Shield className="w-4 h-4" />
      case 'SIGNAL_MINT':
      case 'RECOGNITION_MINT':
        return <Trophy className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'CONTACT_REQUEST':
      case 'CONTACT_ACCEPT':
        return 'from-blue-500 to-yellow-500'
      case 'TRUST_ALLOCATE':
        return 'from-purple-500 to-pink-500'
      case 'SIGNAL_MINT':
      case 'RECOGNITION_MINT':
        return 'from-yellow-500 to-orange-500'
      default:
        return 'from-panel to-gray-500'
    }
  }

  // Apply direction filter
  const sessionId = getSessionId()
  const filteredSignals = selectedTab === 'feed' ? signals.filter(signal => {
    // Apply direction filter first
    if (filter === 'from-me' && signal.actor !== sessionId) return false
    if (filter === 'to-me' && signal.target !== sessionId) return false
    if (filter === 'mine' && signal.actor !== sessionId && signal.target !== sessionId) return false
    
    // Then apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return signal.firstName.toLowerCase().includes(query) || 
             signal.eventDescription.toLowerCase().includes(query)
    }
    return true
  }) : []

  // Save filter to localStorage
  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter)
    if (typeof window !== 'undefined') {
      localStorage.setItem('signals_filter', newFilter)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a1f] via-[#2a1030] to-[#1a0a1f]">
    <div className="max-w-md mx-auto px-4 py-4 space-y-6" {...bind}>
      {/* Mobile Header */}
      <div className="text-center space-y-2">
        <h1 className="text-xl font-medium text-white tracking-tight">
          Recognition Signals
        </h1>
        <p className="text-white/60 text-sm">MINT v2 - Professional recognition tokens on Hedera</p>
      </div>

      {/* Pull indicator */}
      {isPulling && (
        <div className="flex items-center justify-center text-xs text-white/60 -mt-2">
          <RotateCw className="w-3 h-3 mr-1 animate-spin" />
          Refreshing…
        </div>
      )}

      {/* Mobile Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-white/40" />
        <Input
          placeholder="Search signals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 py-3 bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-[#FF6B35]/50 rounded-lg text-sm"
        />
      </div>

      {/* Quick Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { id: 'all', label: 'All', icon: Filter },
          { id: 'from-me', label: 'From Me', icon: User },
          { id: 'to-me', label: 'To Me', icon: Gift },
          { id: 'mine', label: 'Mine', icon: Activity },
        ].map((filterOption) => {
          const Icon = filterOption.icon
          const isActive = filter === filterOption.id
          return (
            <button
              key={filterOption.id}
              onClick={() => handleFilterChange(filterOption.id as typeof filter)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                isActive
                  ? 'bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/30 shadow-[0_0_8px_rgba(255,107,53,0.3)]'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {filterOption.label}
            </button>
          )
        })}
      </div>

      {/* Mobile Tabs */}
      <div className="sheen-sweep grid grid-cols-2 bg-gradient-to-r from-panel/90 to-panel/80 border-2 border-white/20 rounded-lg p-1 gap-1 shadow-[0_0_20px_rgba(255,255,255,0.08)] relative overflow-hidden before:absolute before:inset-0 before:rounded-lg before:p-[1px] before:bg-gradient-to-r before:from-white/10 before:via-transparent before:to-white/10 before:-z-10 before:animate-pulse">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedTab('feed')}
          className={`py-3 rounded-md transition-all duration-300 text-sm ${
            selectedTab === 'feed'
              ? 'bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/30'
              : 'text-white/60 hover:text-white/90'
          }`}
        >
          <Activity className="w-4 h-4 mr-1" />
          Feed
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedTab('tokens')}
          className={`py-3 rounded-md transition-all duration-300 text-sm ${
            selectedTab === 'tokens'
              ? 'bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/30'
              : 'text-white/60 hover:text-white/90'
          }`}
        >
          <Trophy className="w-4 h-4 mr-1" />
          My Tokens
        </Button>
      </div>

      {/* Content Area */}
      <div className="space-y-3">
        {selectedTab === 'feed' ? (
          loading ? (
            <div className="flex justify-center py-12">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 mx-auto animate-spin rounded-full border-4 border-white/20 border-t-[#FF6B35]"></div>
                <p className="text-white/60">Loading network activity...</p>
              </div>
            </div>
          ) : filteredSignals.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 mx-auto mb-4 text-white/30" />
              <h3 className="text-white/80 text-xl font-medium mb-2">No signals found</h3>
              <p className="text-white/50">Try adjusting your search or check back later</p>
            </div>
          ) : (
            filteredSignals.map((signal) => (
              <div 
                key={signal.id} 
                onClick={() => setSelectedSignal(signal)}
                className="bg-gradient-to-r from-transparent to-transparent border border-white/15 backdrop-blur-sm hover:border-[#FF6B35]/40 hover:shadow-[0_0_15px_rgba(255,107,53,0.1)] transition-all duration-300 rounded-lg p-2.5 relative before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-white/5 before:via-transparent before:to-white/5 before:-z-10 hover:before:from-[#FF6B35]/10 hover:before:to-[#FF6B35]/10 cursor-pointer active:scale-98">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className={`bg-gradient-to-br ${getSignalColor(signal.type)} text-white font-medium text-xs`}>
                        {signal.firstName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-panel ${getStatusColor(signal.onlineStatus)}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-white text-xs truncate">{signal.firstName}</span>
                      <div className={`p-0.5 rounded-full bg-gradient-to-br ${getSignalColor(signal.type)}`}>
                        {getSignalIcon(signal.type)}
                      </div>
                    </div>
                    <p className="text-white/70 text-xs truncate">{signal.eventDescription}</p>
                  </div>
                  
                  <span className="text-white/40 text-xs flex-shrink-0">
                    {new Date(signal.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))
          )
        ) : (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-white mb-1">My Recognition Collection</h3>
              <p className="text-white/60 text-sm">{userTokens.length} professional tokens earned</p>
            </div>
            
            {userTokens.map((token) => {
              const getCategoryColor = (category: string) => {
                switch (category) {
                  case 'leadership': return { bg: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-400/30', text: 'text-orange-400' }
                  case 'knowledge': return { bg: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-400/30', text: 'text-emerald-400' }
                  case 'execution': return { bg: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-400/30', text: 'text-purple-400' }
                  default: return { bg: 'from-[#FF6B35]/20 to-yellow-500/10', border: 'border-[#FF6B35]/30', text: 'text-[#FF6B35]' }
                }
              }
              
              const colors = getCategoryColor(token.category)
              
              return (
                <div key={token.id} className={`bg-gradient-to-br from-panel/60 to-panel/50 ${colors.bg} border-2 ${colors.border} rounded-xl p-4 backdrop-blur-sm hover:scale-[1.02] transition-all duration-300 shadow-[0_0_25px_rgba(0,0,0,0.3)] hover:shadow-[0_0_35px_rgba(0,0,0,0.4)] relative`}>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium bg-white/10 ${colors.text} border ${colors.border}`}>
                          {token.category.toUpperCase()} SIGNAL
                        </div>
                      </div>
                      
                      <h4 className="font-bold text-white text-sm">{token.name}</h4>
                      <p className="text-white/70 text-xs line-clamp-2">{token.description}</p>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/50">From {token.receivedFrom}</span>
                        <span className={`font-semibold ${colors.text}`}>{token.trustValue} trust</span>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${colors.bg} border-2 ${colors.border} flex items-center justify-center shadow-lg`}>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
                          <Trophy className={`w-6 h-6 ${colors.text}`} />
                        </div>
                      </div>
                      <div className="text-center mt-1">
                        <span className="text-white/40 text-xs">
                          {new Date(token.receivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {userTokens.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-white/30" />
                <h3 className="text-white/80 text-xl font-medium mb-2">No tokens yet</h3>
                <p className="text-white/50">Earn recognition from your network to build your collection</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Signal Detail Modal */}
      {selectedSignal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedSignal(null)}
        >
          <div 
            className="bg-gradient-to-br from-panel/95 to-panel/90 border-2 border-white/20 rounded-2xl max-w-md w-full shadow-[0_0_50px_rgba(255,107,53,0.3)] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Recognition Token</h3>
              <button
                onClick={() => setSelectedSignal(null)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>

            {/* Token Display */}
            <div className="p-6 space-y-6">
              {/* Large Token Icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-4 border-[#FF6B35]/30 flex items-center justify-center shadow-[0_0_40px_rgba(255,107,53,0.4)]">
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
                      <span className="text-6xl">🏆</span>
                    </div>
                  </div>
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#FF6B35]/20 to-yellow-500/20 blur-xl -z-10 animate-pulse"></div>
                </div>
              </div>

              {/* Token Name */}
              <div className="text-center space-y-1">
                <h4 className="text-2xl font-bold text-white">
                  {selectedSignal.metadata?.name || selectedSignal.metadata?.recognition || 'Recognition Token'}
                </h4>
                <div className="flex items-center justify-center gap-2">
                  <Badge className="bg-[#FF6B35]/20 text-[#FF6B35] border-[#FF6B35]/30">
                    {selectedSignal.metadata?.category?.toUpperCase() || 'RECOGNITION'}
                  </Badge>
                  {selectedSignal.metadata?.rarity && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      {selectedSignal.metadata.rarity.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-white/70 text-center leading-relaxed text-lg">
                {selectedSignal.metadata?.description || selectedSignal.metadata?.subtitle || 'A professional recognition token minted on Hedera for outstanding contribution.'}
              </p>
              
              {/* Message if present */}
              {selectedSignal.metadata?.message && (
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-white/60 text-xs mb-1">Message</p>
                  <p className="text-white text-sm italic">"{selectedSignal.metadata.message}"</p>
                </div>
              )}

              {/* Metadata Grid */}
              <div className="space-y-3 bg-white/5 rounded-xl p-4 border border-white/10">
                {/* From */}
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                    <User className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white/50 text-xs">From</p>
                    <p className="text-white font-medium">
                      {(() => {
                        const senderAccountId = selectedSignal.metadata?.from || selectedSignal.actor
                        const senderName = selectedSignal.metadata?.senderName || getDisplayName(senderAccountId)
                        return senderName
                      })()
                    }</p>
                  </div>
                </div>

                {/* To */}
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                    <Gift className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white/50 text-xs">To</p>
                    <p className="text-white font-medium">
                      {selectedSignal.metadata?.recipientName || selectedSignal.metadata?.to || getFirstName(selectedSignal.target || '')}
                    </p>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-yellow-500/20">
                    <Calendar className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white/50 text-xs">Minted</p>
                    <p className="text-white font-medium">
                      {new Date(selectedSignal.ts).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Trust Value */}
                {selectedSignal.metadata?.trustAmount && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white/50 text-xs">Trust Value</p>
                      <p className="text-[#FF6B35] font-bold text-lg">
                        {selectedSignal.metadata.trustAmount} 🔥
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Labels/Tags */}
                {selectedSignal.metadata?.labels && selectedSignal.metadata.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {selectedSignal.metadata.labels.map((label: string) => (
                      <span key={label} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs">
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* HCS Info */}
              <div className="text-center pt-2 border-t border-white/10 space-y-2">
                <p className="text-white/40 text-xs">
                  Verified on Hedera Consensus Service
                </p>
                <p className="text-white/30 text-xs font-mono">
                  {selectedSignal.topicId}
                </p>
                {selectedSignal.metadata?.sequenceNumber && (
                  <a
                    href={`https://hashscan.io/testnet/topic/${selectedSignal.topicId}/message/${selectedSignal.metadata.sequenceNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View message on Hashscan
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mint Signal FAB */}
      <SendSignalsModal>
        <button
          className="fixed bottom-20 right-4 z-30 w-14 h-14 bg-gradient-to-r from-[#FF6B35] to-yellow-400 rounded-full shadow-[0_0_20px_rgba(255,107,53,0.6)] hover:shadow-[0_0_30px_rgba(255,107,53,0.8)] transition-all active:scale-95 flex items-center justify-center"
          aria-label="Mint Signal"
        >
          <Plus className="w-6 h-6 text-black" />
        </button>
      </SendSignalsModal>
    </div>
    </div>
  )
}
