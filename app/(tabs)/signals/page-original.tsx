"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { signalsStore, type SignalEvent } from "@/lib/stores/signalsStore"
import { getRecentSignalsFromHCS } from "@/lib/services/HCSDataUtils"
import { getSessionId } from "@/lib/session"
import { 
  Activity, 
  Users, 
  Heart, 
  UserPlus, 
  AlertCircle,
  Check,
  Clock,
  Coins,
  Zap,
  Trophy,
  Award,
  Star,
  Sparkles,
  Target,
  TrendingUp
} from "lucide-react"
import { toast } from "sonner"

// Mock achievement data - in real app would come from recognition system
const mockAchievements = [
  { 
    id: "eco-helper", 
    name: "Eco Helper", 
    emoji: "🌱", 
    rarity: "rare", 
    xp: 20, 
    description: "Helped organize community cleanup",
    earnedAt: Date.now() - 86400000,
    category: "community"
  },
  { 
    id: "trust-builder", 
    name: "Trust Builder", 
    emoji: "🤝", 
    rarity: "common", 
    xp: 10, 
    description: "Connected 5+ people in your network",
    earnedAt: Date.now() - 172800000,
    category: "social"
  },
  { 
    id: "early-adopter", 
    name: "Early Adopter", 
    emoji: "🚀", 
    rarity: "epic", 
    xp: 50, 
    description: "One of the first 100 TrustMesh users",
    earnedAt: Date.now() - 259200000,
    category: "special"
  }
]

const mockChallenges = [
  {
    id: "weekly-connect",
    name: "Weekly Connector",
    emoji: "🔗",
    progress: 3,
    target: 5,
    reward: 15,
    description: "Connect with 5 new people this week",
    timeLeft: "4 days"
  },
  {
    id: "trust-circle",
    name: "Circle Master",
    emoji: "🔄",
    progress: 6,
    target: 9,
    reward: 25,
    description: "Fill your complete Circle of Trust",
    timeLeft: "No limit"
  }
]
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

export default function SignalsPage() {
  const [signals, setSignals] = useState<SignalEvent[]>([])
  const [activeFilter, setActiveFilter] = useState<SignalClass | "all">("all")
  const [sessionId, setSessionId] = useState("")
  const [hcsTopicIds, setHcsTopicIds] = useState<ReturnType<typeof hcsFeedService.getTopicIds> | null>(null)
  const [selectedRecognition, setSelectedRecognition] = useState<HCSRecognitionDefinition | null>(null)
  const [isRecognitionModalOpen, setIsRecognitionModalOpen] = useState(false)
  
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

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Activity Feed</h1>
          <p className="text-xs text-muted-foreground">
            Network activity • {filteredSignals.length} signals
          </p>
        </div>
      </div>

      {/* Compact filter pills */}
      <div className="flex justify-center">
        <div className="flex gap-1 p-1 bg-[hsl(var(--muted))]/30 rounded-full">
          {filterChips.map((chip) => (
            <Button
              key={chip.value}
              variant="ghost"
              size="sm"
              onClick={() => setActiveFilter(chip.value)}
              className={`h-8 w-8 rounded-full p-0 transition-all ${
                activeFilter === chip.value 
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-lg" 
                  : "hover:bg-[hsl(var(--muted))]"
              }`}
              title={chip.label}
            >
              {chip.icon}
            </Button>
          ))}
        </div>
      </div>

      {/* Signals list */}
      <div>
        {filteredSignals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium mb-2">No signals yet</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                {activeFilter === "all" 
                  ? "Activity will appear here when you interact with contacts or allocate trust"
                  : `No ${activeFilter} signals found`}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <h4 className="font-medium text-blue-900 mb-2">💡 Demo the Recognition System</h4>
                <p className="text-blue-700 text-sm mb-3">
                  Click the <strong>"Seed"</strong> button in the header to load demo data and see recognition signals in action!
                </p>
                <p className="text-blue-600 text-xs">
                  This will create real HCS topics on Hedera testnet with various recognition signals like Chad, Skibidi, Prof Fav, and more.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredSignals.map((signal) => (
              <SignalRow 
                key={signal.id} 
                signal={signal}
                onClick={() => handleRecognitionSignalClick(signal)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Recognition Signal Detail Modal */}
      <SignalDetailModal
        isOpen={isRecognitionModalOpen}
        onClose={() => setIsRecognitionModalOpen(false)}
        signal={selectedRecognition}
      />
    </div>
  )
}
