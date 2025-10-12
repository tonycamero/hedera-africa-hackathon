"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { type SignalEvent } from "@/lib/stores/signalsStore"
import { getSessionId } from "@/lib/session"
import { 
  Activity, 
  Users, 
  Shield, 
  Trophy,
  Search
} from "lucide-react"
import { toast } from "sonner"

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
    receivedAt: Date.now() - 86400000 * 2, // 2 days ago
    icon: 'telescope'
  },
  {
    id: 'token-execution-1', 
    category: 'execution',
    name: 'Project Delivery',
    description: 'Outstanding project management and delivery excellence under pressure',
    trustValue: 20,
    receivedFrom: 'Michael Rodriguez',
    receivedAt: Date.now() - 86400000 * 5, // 5 days ago
    icon: 'truck'
  },
  {
    id: 'token-knowledge-1',
    category: 'knowledge',
    name: 'Technical Expertise',
    description: 'Deep technical knowledge and ability to solve complex problems',
    trustValue: 30,
    receivedFrom: 'David Kim',
    receivedAt: Date.now() - 86400000 * 7, // 7 days ago
    icon: 'cpu'
  },
  {
    id: 'token-leadership-2',
    category: 'leadership',
    name: 'Team Inspiration',
    description: 'Exceptional ability to motivate and inspire team members',
    trustValue: 22,
    receivedFrom: 'Emily Johnson',
    receivedAt: Date.now() - 86400000 * 10, // 10 days ago
    icon: 'users'
  }
]

export default function SignalsPage() {
  const [signals, setSignals] = useState<EnhancedSignal[]>([])
  const [selectedTab, setSelectedTab] = useState<'feed' | 'tokens'>('feed')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [userTokens] = useState(getUserTokenCollection())

  const getFirstName = (actorId: string): string => {
    // Smart name extraction
    if (actorId.startsWith('tm-') && actorId.length > 3) {
      const namepart = actorId.slice(3).replace(/-/g, ' ')
      const words = namepart.split(' ')
      return words[0].charAt(0).toUpperCase() + words[0].slice(1)
    }
    return actorId.length > 10 ? actorId.slice(0, 6) : actorId
  }

  const getOnlineStatus = (signalId: string): 'online' | 'offline' | 'idle' => {
    // Deterministic status based on signal ID for stability
    const hash = signalId.split('').reduce((a, b) => (a + b.charCodeAt(0)) % 3, 0)
    const statuses: ('online' | 'offline' | 'idle')[] = ['online', 'offline', 'idle']
    return statuses[hash]
  }

  const getEventDescription = (signal: SignalEvent): string => {
    const firstName = getFirstName(signal.actor)
    // Use signal ID for deterministic description selection
    const hash = signal.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    
    const professionalDescriptions = {
      'CONTACT_REQUEST': [
        `🤝 ${firstName} sent a professional connection request`,
        `📬 ${firstName} wants to expand their trusted network`,
        `🔗 ${firstName} is building professional relationships`,
        `🌐 ${firstName} reached out to grow their network`
      ],
      'CONTACT_ACCEPT': [
        `✅ ${firstName} accepted your connection request`,
        `🤝 ${firstName} confirmed your professional bond`,
        `🔗 ${firstName} is now part of your trusted network`,
        `🌟 ${firstName} validated your professional relationship`
      ],
      'TRUST_ALLOCATE': [
        `⭐ ${firstName} allocated trust tokens to recognize excellence`,
        `🏆 ${firstName} sent professional recognition signals`,
        `💎 ${firstName} endorsed someone's professional capabilities`,
        `🎯 ${firstName} distributed trust to acknowledge achievements`
      ],
      'RECOGNITION_MINT': [
        `🏆 ${firstName} earned a Leadership Signal recognition`,
        `🎖️ ${firstName} received an Execution Signal token`,
        `🧠 ${firstName} was awarded a Knowledge Signal`,
        `⚡ ${firstName} unlocked professional recognition tokens`
      ],
      'PROFILE_UPDATE': [
        `📋 ${firstName} updated their professional profile`,
        `🔄 ${firstName} refreshed their network credentials`,
        `📈 ${firstName} enhanced their professional presence`,
        `✨ ${firstName} optimized their trust network profile`
      ]
    }
    
    const descriptions = professionalDescriptions[signal.type as keyof typeof professionalDescriptions] || [
      `🔄 ${firstName} engaged in network activity`,
      `⚡ ${firstName} participated in professional networking`,
      `🌐 ${firstName} contributed to the trust network`
    ]
    
    return descriptions[hash % descriptions.length]
  }

  useEffect(() => {
    const loadSignals = async () => {
      try {
        console.log('[SignalsPage] Loading signals from server-side API...')
        const response = await fetch('/api/signals')
        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to load signals')
        }
        
        const enhancedSignals: EnhancedSignal[] = data.signals.map((signal: SignalEvent) => {
          return {
            ...signal,
            firstName: getFirstName(signal.actor),
            onlineStatus: getOnlineStatus(signal.id || ''),
            eventDescription: getEventDescription(signal)
          }
        })
        
        setSignals(enhancedSignals)
        setLoading(false)
        
        console.log(`[SignalsPage] Loaded ${enhancedSignals.length} enhanced signals from server API`)
      } catch (error) {
        console.error('[SignalsPage] Failed to load signals:', error)
        setLoading(false)
        toast.error('Failed to load signals data')
      }
    }

    loadSignals()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadSignals, 30000)
    return () => clearInterval(interval)
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
        return 'from-blue-500 to-cyan-500'
      case 'TRUST_ALLOCATE':
        return 'from-purple-500 to-pink-500'
      case 'RECOGNITION_MINT':
        return 'from-yellow-500 to-orange-500'
      default:
        return 'from-slate-500 to-gray-500'
    }
  }

  const filteredSignals = selectedTab === 'feed' ? signals.filter(signal => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return signal.firstName.toLowerCase().includes(query) || 
             signal.eventDescription.toLowerCase().includes(query)
    }
    return true
  }) : []


  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-6">
      {/* Mobile Header */}
      <div className="text-center space-y-2">
        <h1 className="text-xl font-medium text-white tracking-tight">
          Network Signals
        </h1>
        <p className="text-white/60 text-sm">Stay connected with your network</p>
      </div>

      {/* Mobile Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-white/40" />
        <Input
          placeholder="Search signals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 py-3 bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-[#00F6FF]/50 rounded-lg text-sm"
        />
      </div>

      {/* Mobile Tabs */}
      <div className="grid grid-cols-2 bg-white/5 border border-white/10 rounded-lg p-1 gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedTab('feed')}
          className={`py-3 rounded-md transition-all duration-300 text-sm ${
            selectedTab === 'feed'
              ? 'bg-[#00F6FF]/20 text-[#00F6FF] border border-[#00F6FF]/30'
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
              ? 'bg-[#00F6FF]/20 text-[#00F6FF] border border-[#00F6FF]/30'
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
          // Feed View
          loading ? (
            <div className="flex justify-center py-12">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 mx-auto animate-spin rounded-full border-4 border-white/20 border-t-[#00F6FF]"></div>
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
              <div key={signal.id} className="bg-white/5 border border-white/10 backdrop-blur-sm hover:border-[#00F6FF]/30 transition-all duration-300 rounded-lg p-2">
                {/* Compact Feed Item */}
                <div className="flex items-center gap-2">
                  {/* Small Avatar with status */}
                  <div className="relative">
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className={`bg-gradient-to-br ${getSignalColor(signal.type)} text-white font-medium text-xs`}>
                        {signal.firstName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-900 ${getStatusColor(signal.onlineStatus)}`} />
                  </div>

                  {/* Signal Info - Compact */}
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
          // My Tokens View - NFT Style Wallet
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
                  default: return { bg: 'from-[#00F6FF]/20 to-cyan-500/10', border: 'border-[#00F6FF]/30', text: 'text-[#00F6FF]' }
                }
              }
              
              const colors = getCategoryColor(token.category)
              
              return (
                <div key={token.id} className={`bg-gradient-to-r ${colors.bg} border ${colors.border} rounded-xl p-4 backdrop-blur-sm hover:scale-[1.02] transition-all duration-300 shadow-lg`}>
                  <div className="flex items-center gap-4">
                    {/* Left 2/3: Token Info */}
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
                    
                    {/* Right 1/3: NFT Badge */}
                    <div className="flex-shrink-0">
                      <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${colors.bg} border-2 ${colors.border} flex items-center justify-center shadow-lg`}>
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center`}>
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
    </div>
  )
}
