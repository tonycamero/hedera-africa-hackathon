"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { signalsStore, type SignalEvent } from "@/lib/stores/signalsStore"
import { getSessionId } from "@/lib/session"
import { signalsPoller } from "@/lib/services/SignalsPoller"
import { 
  Activity, 
  Users, 
  Shield, 
  Trophy,
  UserPlus,
  MessageCircle,
  Send,
  DollarSign,
  Zap,
  Heart,
  Share,
  MoreHorizontal,
  Search,
  Filter,
  Sparkles,
  Award,
  TrendingUp
} from "lucide-react"
import { toast } from "sonner"

interface EnhancedSignal extends SignalEvent {
  firstName: string
  onlineStatus: 'online' | 'offline' | 'idle'
  eventDescription: string
  likes: number
  comments: number
}

export default function SignalsPage() {
  const [signals, setSignals] = useState<EnhancedSignal[]>([])
  const [selectedTab, setSelectedTab] = useState<'signals' | 'recognition'>('signals')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const getFirstName = (actorId: string): string => {
    // Smart name extraction
    if (actorId.startsWith('tm-') && actorId.length > 3) {
      const namepart = actorId.slice(3).replace(/-/g, ' ')
      const words = namepart.split(' ')
      return words[0].charAt(0).toUpperCase() + words[0].slice(1)
    }
    return actorId.length > 10 ? actorId.slice(0, 6) : actorId
  }

  const getOnlineStatus = (): 'online' | 'offline' | 'idle' => {
    const statuses: ('online' | 'offline' | 'idle')[] = ['online', 'offline', 'idle']
    return statuses[Math.floor(Math.random() * statuses.length)]
  }

  const getEventDescription = (signal: SignalEvent): string => {
    const firstName = getFirstName(signal.actor)
    
    const funDescriptions = {
      'CONTACT_REQUEST': [
        `👀 ${firstName} is sliding into your network!`,
        `✨ ${firstName} thinks you have main character energy`,
        `🎯 ${firstName} wants to be in your inner circle`,
        `🔥 ${firstName} is trying to level up their connections`
      ],
      'CONTACT_ACCEPT': [
        `🎉 ${firstName} just accepted your rizz!`,
        `⚡ ${firstName} said YES to your vibe!`,
        `🤝 ${firstName} officially locked in with you`,
        `💯 ${firstName} is now in your professional crew!`
      ],
      'TRUST_ALLOCATE': [
        `💎 ${firstName} just gave you their trust - that's rare!`,
        `🌟 ${firstName} sees your potential and backed it up`,
        `🚀 ${firstName} believes you're going places`,
        `⭐ ${firstName} put some respect on your name!`
      ],
      'RECOGNITION_MINT': [
        `🏆 ${firstName} just flex on everyone with a new achievement!`,
        `🎯 ${firstName} unlocked something legendary!`,
        `🔥 ${firstName} is absolutely crushing it right now`,
        `💫 ${firstName} just dropped their latest W`
      ],
      'PROFILE_UPDATE': [
        `✨ ${firstName} just had a glow up and it shows!`,
        `🎨 ${firstName} refreshed their whole aesthetic`,
        `🔄 ${firstName} is reinventing themselves`,
        `📈 ${firstName} upgraded their entire brand game`
      ]
    }
    
    const descriptions = funDescriptions[signal.type as keyof typeof funDescriptions] || [
      `🌟 ${firstName} made moves in the network!`,
      `⚡ ${firstName} is actively building connections`,
      `🚀 ${firstName} is making things happen`
    ]
    
    return descriptions[Math.floor(Math.random() * descriptions.length)]
  }

  useEffect(() => {
    const loadSignals = () => {
      try {
        const allEvents = signalsStore.getAll()
        
        const enhancedSignals: EnhancedSignal[] = allEvents.map(signal => ({
          ...signal,
          firstName: getFirstName(signal.actor),
          onlineStatus: getOnlineStatus(),
          eventDescription: getEventDescription(signal),
          likes: Math.floor(Math.random() * 25) + 2,
          comments: Math.floor(Math.random() * 8) + 1
        }))
        
        setSignals(enhancedSignals)
        setLoading(false)
        
        console.log(`[SignalsPage] Loaded ${enhancedSignals.length} enhanced signals`)
      } catch (error) {
        console.error('[SignalsPage] Failed to load signals:', error)
        setLoading(false)
      }
    }

    // Ensure signals poller is running for serverless environments
    signalsPoller.start()
    
    loadSignals()
    const unsubscribe = signalsStore.subscribe(loadSignals)
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

  const filteredSignals = signals.filter(signal => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return signal.firstName.toLowerCase().includes(query) || 
             signal.eventDescription.toLowerCase().includes(query)
    }
    
    if (selectedTab === 'recognition') {
      return signal.type.includes('RECOGNITION') || signal.type.includes('TRUST')
    }
    
    return true
  })

  const handleSendSignal = (targetUser: string) => {
    const reactions = [
      { emoji: '⚡', text: 'Zapped', desc: `You sent lightning vibes to ${targetUser}!` },
      { emoji: '🔥', text: 'Fired up', desc: `${targetUser} just got your fire signal!` },
      { emoji: '💫', text: 'Sparked', desc: `You lit up ${targetUser}'s network!` },
      { emoji: '🚀', text: 'Boosted', desc: `${targetUser} got your rocket boost!` }
    ]
    const reaction = reactions[Math.floor(Math.random() * reactions.length)]
    toast.success(`${reaction.emoji} ${reaction.text}!`, {
      description: reaction.desc,
    })
  }

  const handleSendTrust = (targetUser: string) => {
    const amounts = [5, 10, 15, 25, 50]
    const amount = amounts[Math.floor(Math.random() * amounts.length)]
    toast.success(`💰 ${amount} $TRST sent to ${targetUser}!`, {
      description: `Trust tokens locked and loaded! 🔒✨`,
    })
  }

  const handleSendMessage = (targetUser: string) => {
    const messageTypes = [
      { emoji: '💬', text: 'Slid into their DMs', desc: 'Message delivered with style!' },
      { emoji: '📩', text: 'Sent encrypted message', desc: 'Secure comms established!' },
      { emoji: '✉️', text: 'Dropped a line', desc: 'Your message is on its way!' }
    ]
    const msgType = messageTypes[Math.floor(Math.random() * messageTypes.length)]
    toast.success(`${msgType.emoji} ${msgType.text}!`, {
      description: msgType.desc,
    })
  }

  const handleReact = (signalId: string, targetUser: string) => {
    const reactions = ['❤️', '🔥', '💯', '⚡', '🚀', '👏', '💪', '🎯']
    const reaction = reactions[Math.floor(Math.random() * reactions.length)]
    toast.success(`${reaction} Reacted to ${targetUser}'s signal!`, {
      description: "Your reaction has been sent to the network",
    })
  }

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
          onClick={() => setSelectedTab('signals')}
          className={`py-3 rounded-md transition-all duration-300 text-sm ${
            selectedTab === 'signals'
              ? 'bg-[#00F6FF]/20 text-[#00F6FF] border border-[#00F6FF]/30'
              : 'text-white/60 hover:text-white/90'
          }`}
        >
          <Activity className="w-4 h-4 mr-1" />
          Signals
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedTab('recognition')}
          className={`py-3 rounded-md transition-all duration-300 text-sm ${
            selectedTab === 'recognition'
              ? 'bg-[#00F6FF]/20 text-[#00F6FF] border border-[#00F6FF]/30'
              : 'text-white/60 hover:text-white/90'
          }`}
        >
          <Trophy className="w-4 h-4 mr-1" />
          Recognition
        </Button>
      </div>

      {/* Mobile Signals Feed */}
      <div className="space-y-3">
        {loading ? (
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
            <Card key={signal.id} className="bg-white/5 border-white/10 backdrop-blur-sm hover:border-[#00F6FF]/30 transition-all duration-300">
              <CardContent className="p-3">
                {/* Mobile-First Layout */}
                <div className="space-y-3">
                  {/* Top: User Info & Signal */}
                  <div className="flex items-center gap-3">
                    {/* Avatar with status */}
                    <div className="relative">
                      <Avatar className="w-10 h-10 ring-2 ring-white/20">
                        <AvatarFallback className={`bg-gradient-to-br ${getSignalColor(signal.type)} text-white font-medium text-sm`}>
                          {signal.firstName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${getStatusColor(signal.onlineStatus)}`} />
                    </div>

                    {/* Signal Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-white text-sm truncate">{signal.firstName}</h3>
                        <div className={`p-1 rounded-full bg-gradient-to-br ${getSignalColor(signal.type)}`}>
                          {getSignalIcon(signal.type)}
                        </div>
                      </div>
                      <p className="text-white/80 text-sm line-clamp-2">{signal.eventDescription}</p>
                    </div>
                    
                    <span className="text-white/50 text-xs flex-shrink-0">
                      {new Date(signal.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  
                  {/* Bottom: Engagement & Actions */}
                  <div className="flex items-center justify-between">
                    {/* Engagement Stats */}
                    <div className="flex items-center gap-3 text-xs text-white/50">
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        <span>{signal.likes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>{signal.comments}</span>
                      </div>
                    </div>
                    
                    {/* Compact Action Buttons */}
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        onClick={() => handleSendSignal(signal.firstName)}
                        className="bg-blue-500/20 text-blue-400 border-blue-400/30 hover:bg-blue-500/30 text-xs px-2 py-1 h-7"
                      >
                        <Zap className="w-3 h-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => handleSendTrust(signal.firstName)}
                        className="bg-green-500/20 text-green-400 border-green-400/30 hover:bg-green-500/30 text-xs px-2 py-1 h-7"
                      >
                        <DollarSign className="w-3 h-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => handleSendMessage(signal.firstName)}
                        className="bg-purple-500/20 text-purple-400 border-purple-400/30 hover:bg-purple-500/30 text-xs px-2 py-1 h-7"
                      >
                        <MessageCircle className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
