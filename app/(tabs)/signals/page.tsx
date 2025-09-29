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
  Filter
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


// Signal type color mapping
const getSignalTypeStyles = (signalClass: SignalClass) => {
  const styles = {
    contact: { 
      bg: "bg-blue-50/50 dark:bg-blue-950/20", 
      border: "border-blue-200 dark:border-blue-800",
      badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
    },
    trust: { 
      bg: "bg-green-50/50 dark:bg-green-950/20", 
      border: "border-green-200 dark:border-green-800",
      badge: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
    },
    recognition: { 
      bg: "bg-purple-50/50 dark:bg-purple-950/20", 
      border: "border-purple-200 dark:border-purple-800",
      badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
    },
    system: { 
      bg: "bg-gray-50/50 dark:bg-gray-950/20", 
      border: "border-gray-200 dark:border-gray-800",
      badge: "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300"
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
      return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">✓ On-chain</Badge>
    }
    if (signal.status === "error") {
      return <Badge variant="destructive">⚠ Error</Badge>
    }
    return <Badge variant="outline" className="text-muted-foreground">⏳ Local</Badge>
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
    <Card className={`${styles.bg} ${styles.border} hover:border-primary/50 cursor-pointer transition-colors`} onClick={onClick}>
      <CardContent className="p-4 flex items-center gap-3">
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
        <div className="flex items-center gap-2 shrink-0">
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
    <div className="container mx-auto p-4 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Activity Feed</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All your TrustMesh network activity - contacts, trust, and recognition signals
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {filteredSignals.length} signals
          </Badge>
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
