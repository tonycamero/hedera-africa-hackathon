"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { signalsStore, type SignalEvent, type SignalClass } from "@/lib/stores/signalsStore"
import { SignalDetailModal } from "@/components/SignalDetailModal"
import { hcsFeedService } from "@/lib/services/HCSFeedService"
import { hcsRecognitionService, type HCSRecognitionDefinition } from "@/lib/services/HCSRecognitionService"
import { 
  Activity, 
  Users, 
  Heart, 
  Award,
  AlertCircle,
  Check,
  Clock,
  Copy,
  Filter,
  Trophy,
  ThumbsUp,
  Share2,
  Star,
  Crown,
  Sparkles,
  Gift,
  Medal,
  Zap,
  Flame,
  Target,
  Handshake
} from "lucide-react"
import { toast } from "sonner"
import { getSessionId } from "@/lib/session"
import { getRuntimeFlags } from "@/lib/runtimeFlags"
import { loadSignals as loadSignalsCache, saveSignals as saveSignalsCache, loadDerivedState, saveDerivedState } from "@/lib/cache/sessionCache"
import { computeDerivedFromSignals } from "@/lib/ux/derive"
// import { bootstrapFlex, type BootstrapResult } from "@/lib/boot/bootstrapFlex"

type FilterChip = {
  label: string
  value: SignalClass | "all"
  icon: React.ReactNode
}

const filterChips: FilterChip[] = [
  { label: "All", value: "all", icon: <Activity className="w-3 h-3" /> },
  { label: "Contact", value: "contact", icon: <Users className="w-3 h-3" /> },
  { label: "Trust", value: "trust", icon: <Heart className="w-3 h-3" /> },
  { label: "Recognition", value: "recognition", icon: <Award className="w-3 h-3" /> }
]

function SignalStatusBadge({ status }: { status: string }) {
  if (status === "onchain") {
    return (
      <Badge variant="secondary" className="text-xs bg-emerald-400/20 text-emerald-300">
        <Check className="w-3 h-3 mr-1" />
        On-chain ✓
      </Badge>
    )
  }
  
  if (status === "error") {
    return (
      <Badge variant="destructive" className="text-xs">
        <AlertCircle className="w-3 h-3 mr-1" />
        Error
      </Badge>
    )
  }
  
  return (
    <Badge variant="outline" className="text-xs text-[hsl(var(--muted-foreground))]">
      <Clock className="w-3 h-3 mr-1" />
      Local
    </Badge>
  )
}


// Signal type color mapping with better contrast for dark theme
const getSignalTypeStyles = (signalClass: SignalClass) => {
  const styles = {
    contact: { 
      border: "border-l-blue-500",
      badge: "bg-blue-500/20 text-blue-600 dark:text-blue-400"
    },
    trust: { 
      border: "border-l-green-500",
      badge: "bg-green-500/20 text-green-600 dark:text-green-400"
    },
    recognition: { 
      border: "border-l-purple-500",
      badge: "bg-purple-500/20 text-purple-600 dark:text-purple-400"
    },
    system: { 
      border: "border-l-gray-500",
      badge: "bg-gray-500/20 text-gray-600 dark:text-gray-400"
    }
  }
  return styles[signalClass] || styles.system
}

function SignalRow({ signal, onClick }: { signal: SignalEvent; onClick?: () => void }) {
  const getTitle = () => {
    if (signal.type === "CONTACT_REQUEST" || signal.type === "contact_request") {
      return signal.direction === "outbound" ? "Contact request sent" : "Contact request received"
    }
    if (signal.type === "CONTACT_ACCEPT" || signal.type === "contact_accept") {
      return signal.direction === "outbound" ? "Contact accepted" : "Contact bonded"
    }
    if (signal.type === "TRUST_ALLOCATE" || signal.type === "trust_allocate") {
      return `Trust allocated (weight ${signal.payload?.weight || signal.metadata?.weight || 1})`
    }
    if (signal.type === "TRUST_REVOKE" || signal.type === "trust_revoke") {
      return "Trust revoked"
    }
    if (signal.type === "RECOGNITION_MINT" || signal.type === "recognition_mint") {
      return signal.payload?.name || "Recognition earned"
    }
    return signal.type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())
  }

  const getSubtext = () => {
    const from = signal.actor || signal.actors?.from || 'unknown'
    const to = signal.target || signal.actors?.to || 'unknown'
    
    if (signal.direction === "outbound") {
      return `${from.slice(-8)} → ${to.slice(-8)}`
    } else {
      return `${from.slice(-8)} → you`
    }
  }

  const formatTime = (timestamp: number) => {
    if (!timestamp || timestamp === 0) return "—"
    
    try {
      const date = new Date(timestamp)
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "—"
      }
      
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)
      
      if (diffMins < 1) return "now"
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      return date.toLocaleDateString()
    } catch {
      return "—"
    }
  }

  const getStatusBadge = () => {
    if (signal.status === "onchain") {
      return <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">✓</Badge>
    }
    if (signal.status === "error") {
      return <Badge className="bg-red-500/20 text-red-600 dark:text-red-400">⚠</Badge>
    }
    return <Badge className="bg-gray-500/20 text-gray-600 dark:text-gray-400">⏳</Badge>
  }

  const getIcon = () => {
    switch (signal.class) {
      case 'contact': return <Users className="w-4 h-4" />
      case 'trust': return <Heart className="w-4 h-4" />
      case 'recognition': return <Award className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const styles = getSignalTypeStyles(signal.class)
  
  return (
    <Card className={`bg-card border ${styles.border} border-l-4 hover:border-primary/50 cursor-pointer transition-colors`} onClick={onClick}>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${styles.badge}`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">
            {getTitle()}
          </div>
          <div className="text-xs text-muted-foreground">
            {getSubtext()} • {formatTime(signal.ts)}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {getStatusBadge()}
        </div>
      </CardContent>
    </Card>
  )
}

export default function SocialRecognitionPage() {
  const [signals, setSignals] = useState<SignalEvent[]>([])
  const [activeFilter, setActiveFilter] = useState<SignalClass | "all">("all")
  const [sessionId, setSessionId] = useState("")
  const [hcsTopicIds, setHcsTopicIds] = useState<ReturnType<typeof hcsFeedService.getTopicIds> | null>(null)
  const [selectedRecognition, setSelectedRecognition] = useState<HCSRecognitionDefinition | null>(null)
  const [isRecognitionModalOpen, setIsRecognitionModalOpen] = useState(false)
  const [showNominateModal, setShowNominateModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'community' | 'personal'>('community')
  
  // Direct HCS data loading - bypass broken bootstrap
  useEffect(() => {
    const loadDirectFromHCS = async () => {
      try {
        console.log('🚀 [SignalsPage] Loading directly from HCS...')
        
        const currentSessionId = getSessionId()
        setSessionId(currentSessionId)
        console.log('📋 [SignalsPage] Session ID:', currentSessionId)
        
        // Mark signals tab as seen
        signalsStore.markSeen("signals")
        
        // Initialize HCS service and get all events
        await hcsFeedService.initialize()
        const events = await hcsFeedService.getAllFeedEvents()
        
        console.log('📡 [SignalsPage] Loaded', events.length, 'events from HCS')
        
        if (events.length > 0) {
          // Filter events based on scope
          const flags = getRuntimeFlags()
          let filteredSignals = events
          
          if (flags.scope === 'my') {
            filteredSignals = events.filter(signal => 
              signal.actors.from === currentSessionId || signal.actors.to === currentSessionId
            )
          }
          
          setSignals(filteredSignals.sort((a, b) => b.ts - a.ts))
          
          console.log('✅ [SignalsPage] Data loaded:', {
            total: events.length,
            filtered: filteredSignals.length,
            session: currentSessionId
          })
        } else {
          console.log('⚠️ [SignalsPage] No events found')
          setSignals([])
        }
        
        // Update HCS topic IDs
        const topicIds = hcsFeedService.getTopicIds()
        setHcsTopicIds(topicIds)
        
      } catch (error) {
        console.error('❌ [SignalsPage] Direct HCS load failed:', error)
        const currentSessionId = getSessionId()
        setSessionId(currentSessionId)
        setSignals([])
        signalsStore.markSeen("signals")
      }
    }
    
    loadDirectFromHCS()
  }, [])

  // Filter signals based on active filter
  const filteredSignals = signals.filter(signal => 
    activeFilter === "all" || signal.class === activeFilter
  )


  const handleRecognitionSignalClick = async (signal: SignalEvent) => {
    if (signal.class !== "recognition") return
    
    console.log("[SignalsPage] Recognition signal clicked:", signal)
    
    // Try to find the recognition definition if we have a recognition instance ID
    const recognitionInstanceId = signal.payload?.recognitionInstanceId
    if (recognitionInstanceId) {
      try {
        const instance = await hcsRecognitionService.getRecognitionInstance(recognitionInstanceId)
        if (instance) {
          const definition = await hcsRecognitionService.getRecognitionDefinition(instance.definitionId)
          if (definition) {
            setSelectedRecognition(definition)
            setIsRecognitionModalOpen(true)
            return
          }
        }
      } catch (error) {
        console.error("[SignalsPage] Failed to load recognition data:", error)
      }
    }
    
    // Fallback: try to find definition by name
    const definitions = await hcsRecognitionService.getAllRecognitionDefinitions()
    const matchingDefinition = definitions.find(def => 
      def.name === signal.payload?.name || 
      def.description === signal.payload?.description
    )
    
    if (matchingDefinition) {
      setSelectedRecognition(matchingDefinition)
      setIsRecognitionModalOpen(true)
    } else {
      toast.info("Recognition signal details not available")
    }
  }

  // Mock recognition data for social demo
  const mockUserRecognitions = [
    {
      id: 1,
      name: "Eco Helper",
      icon: "🎖️",
      rarity: "Rare",
      boost: "+20 Trust Boost",
      description: "Helped organize campus sustainability event",
      fromCircle: true
    },
    {
      id: 2, 
      name: "Best Guide",
      icon: "🏅",
      rarity: "Common",
      boost: "+10 Network Points",
      description: "From Study Group event",
      fromCircle: false
    }
  ]

  const mockCommunityNominations = [
    {
      id: 1,
      nominee: "Jordan Kim",
      category: "Style Icon",
      votes: 12,
      timeLeft: "2 days",
      hasVoted: false
    },
    {
      id: 2,
      nominee: "Alex Chen",
      category: "Tech Helper", 
      votes: 8,
      timeLeft: "1 day",
      hasVoted: true
    },
    {
      id: 3,
      nominee: "Sarah Kim",
      category: "Event Organizer",
      votes: 15,
      timeLeft: "3 days", 
      hasVoted: false
    }
  ]

  const mockChallenges = [
    {
      id: 1,
      title: "Network Builder",
      description: "Connect with 5 new people this week",
      progress: 3,
      total: 5,
      reward: "+50 Trust Points",
      icon: Users
    },
    {
      id: 2,
      title: "Recognition Giver", 
      description: "Nominate 3 community members",
      progress: 1,
      total: 3,
      reward: "Curator Badge",
      icon: Gift
    }
  ]

  const handleShareRecognition = (recognition: any) => {
    toast.success(`🔗 Shared ${recognition.name}!`, {
      description: "Posted to your social circle feed"
    })
  }

  const handleVoteNomination = (nomination: any) => {
    toast.success(`👍 Voted for ${nomination.nominee}!`, {
      description: `Supporting them for ${nomination.category}`
    })
  }

  const handleNominate = (contactName: string) => {
    toast.success(`✨ Nominated ${contactName}!`, {
      description: "Community will vote on this recognition"
    })
    setShowNominateModal(false)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-6">
      {/* Social Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-neon-coral" />
            Community Signals
          </h1>
          <p className="text-sm text-white/60">Earn, share & celebrate achievements</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={() => setShowNominateModal(true)}
            className="bg-neon-coral/20 hover:bg-neon-coral/30 text-neon-coral border border-neon-coral/30"
          >
            <ThumbsUp className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-card/30 p-1 rounded-xl border border-orange-400/20">
        <button
          onClick={() => setActiveTab('community')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'community'
              ? 'bg-neon-coral/20 text-neon-coral border border-neon-coral/30 shadow-sm'
              : 'text-white/70 hover:text-white/90 hover:bg-white/5'
          }`}
        >
          <Flame className="w-4 h-4" />
          Community Signals
        </button>
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'personal'
              ? 'bg-neon-coral/20 text-neon-coral border border-neon-coral/30 shadow-sm'
              : 'text-white/70 hover:text-white/90 hover:bg-white/5'
          }`}
        >
          <Star className="w-4 h-4" />
          My Recognition
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'personal' && (
        <div className="space-y-6">
          {/* Your Achievements */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-white/80 flex items-center gap-2">
              <Medal className="w-4 h-4 text-neon-peach" />
              Your Achievements
            </h2>
            
            {mockUserRecognitions.map((recognition) => (
              <Card key={recognition.id} className={`bg-gradient-to-r ${recognition.fromCircle ? 'from-orange-500/10 to-red-500/10 border border-orange-400/30' : 'from-slate-500/10 to-slate-600/10 border border-slate-400/20'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{recognition.icon}</div>
                      <div>
                        <h3 className="font-semibold text-white">{recognition.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${recognition.rarity === 'Rare' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'}`}>
                            {recognition.rarity}
                          </Badge>
                          <span className="text-xs text-green-300">{recognition.boost}</span>
                        </div>
                      </div>
                    </div>
                    {recognition.fromCircle && (
                      <Crown className="w-4 h-4 text-orange-400" />
                    )}
                  </div>
                  <p className="text-sm text-white/70 mb-3">{recognition.description}</p>
                  <Button 
                    size="sm" 
                    onClick={() => handleShareRecognition(recognition)}
                    className="w-full bg-neon-coral/20 hover:bg-neon-coral/30 text-neon-coral border border-neon-coral/30"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share to Circle
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Personal Progress */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-white/80 flex items-center gap-2">
              <Target className="w-4 h-4 text-neon-orange" />
              Your Progress
            </h2>
            
            {mockChallenges.map((challenge) => {
              const IconComponent = challenge.icon
              const progress = Math.round((challenge.progress / challenge.total) * 100)
              
              return (
                <Card key={challenge.id} className="bg-gradient-to-r from-orange-500/5 to-red-500/5 border border-orange-400/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{challenge.title}</h3>
                        <p className="text-sm text-white/70">{challenge.description}</p>
                      </div>
                      <Badge className="bg-neon-peach/20 text-neon-peach border border-neon-peach/30 text-xs">
                        {challenge.reward}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/80">Progress</span>
                        <span className="text-orange-300">{challenge.progress}/{challenge.total}</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-orange-400 to-red-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Community Tab */}
      {activeTab === 'community' && (
        <div className="space-y-6">
          {/* Community Board */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-white/80 flex items-center gap-2">
              <Flame className="w-4 h-4 text-neon-orange" />
              Community Nominations
            </h2>
        
        {mockCommunityNominations.slice(0, 2).map((nomination) => (
          <Card key={nomination.id} className="bg-card/50 border border-orange-400/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">Nominate {nomination.nominee}</h3>
                  <p className="text-sm text-orange-300">for {nomination.category}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    <ThumbsUp className="w-3 h-3 text-orange-400" />
                    <span className="text-sm font-semibold text-white">{nomination.votes}</span>
                  </div>
                  <span className="text-xs text-white/60">{nomination.timeLeft} left</span>
                </div>
              </div>
              
              <Button 
                size="sm" 
                onClick={() => handleVoteNomination(nomination)}
                disabled={nomination.hasVoted}
                className={`w-full ${
                  nomination.hasVoted 
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30 cursor-not-allowed'
                    : 'bg-neon-orange/20 hover:bg-neon-orange/30 text-neon-orange border border-neon-orange/30'
                }`}
              >
                {nomination.hasVoted ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Voted
                  </>
                ) : (
                  <>
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Vote/Endorse
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
            ))}
          </div>
          
          {/* Community Challenges */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-white/80 flex items-center gap-2">
              <Handshake className="w-4 h-4 text-neon-peach" />
              Community Challenges
            </h2>
            
            {/* Community-specific challenge */}
            <Card className="bg-gradient-to-r from-orange-500/5 to-red-500/5 border border-orange-400/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <ThumbsUp className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">Community Supporter</h3>
                    <p className="text-sm text-white/70">Vote on 5 community nominations</p>
                  </div>
                  <Badge className="bg-neon-peach/20 text-neon-peach border border-neon-peach/30 text-xs">
                    Social Badge
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/80">Progress</span>
                    <span className="text-orange-300">2/5</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-orange-400 to-red-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: '40%' }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Add nominate someone section */}
            <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-400/30">
              <CardContent className="p-4 text-center">
                <Sparkles className="w-8 h-8 text-neon-coral mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">Nominate Someone Special</h3>
                <p className="text-sm text-white/70 mb-4">
                  Recognize outstanding community members and help them shine!
                </p>
                <Button 
                  onClick={() => setShowNominateModal(true)}
                  className="w-full bg-neon-coral/20 hover:bg-neon-coral/30 text-neon-coral border border-neon-coral/30"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Start Nomination
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      
      {/* Recognition Signal Detail Modal */}
      <SignalDetailModal
        isOpen={isRecognitionModalOpen}
        onClose={() => setIsRecognitionModalOpen(false)}
        signal={selectedRecognition}
      />
    </div>
  )
}
