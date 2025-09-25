"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { signalsStore, type SignalEvent, type SignalClass } from "@/lib/stores/signalsStore"
import { FeedItem } from "@/components/FeedItem"
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

function SignalClassBadge({ className }: { className: SignalClass }) {
  const configs = {
    contact: { color: "bg-social text-[hsl(var(--background))]" , icon: <Users className="w-3 h-3" /> },
    trust: { color: "bg-trust text-[hsl(var(--background))]", icon: <Heart className="w-3 h-3" /> },
    recognition: { color: "bg-academic text-[hsl(var(--background))]", icon: <Award className="w-3 h-3" /> },
    system: { color: "bg-professional text-[hsl(var(--background))]", icon: <Activity className="w-3 h-3" /> }
  }
  
  const config = configs[className]
  
  return (
    <Badge variant="secondary" className={`text-xs ${config.color}`}>
      {config.icon}
      <span className="ml-1 capitalize">{className}</span>
    </Badge>
  )
}

function SignalRow({ signal }: { signal: SignalEvent }) {
  const [showDetails, setShowDetails] = useState(false)
  
  const getTitle = () => {
    if (signal.type === "CONTACT_REQUEST") {
      return signal.direction === "outbound" ? "Contact request sent" : "Contact request received"
    }
    if (signal.type === "CONTACT_ACCEPT") {
      return signal.direction === "outbound" ? "Contact accepted" : "Contact bonded"
    }
    if (signal.type === "TRUST_ALLOCATE") {
      return `Trust allocated (weight ${signal.payload?.weight || 1})`
    }
    if (signal.type === "TRUST_REVOKE") {
      return "Trust revoked"
    }
    return signal.type
  }

  const getActors = () => {
    if (signal.direction === "outbound") {
      return `${signal.actors.from} → ${signal.actors.to || "peer:unknown"}`
    } else {
      return `${signal.actors.from} → ${signal.actors.to || "me"}`
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  return (
    <Card className="mb-3 bg-card border border-[hsl(var(--border))]/80">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <SignalClassBadge className={signal.class} />
              <div className="text-sm font-medium">
                {getTitle()}
              </div>
            </div>
            
            <div className="text-xs text-[hsl(var(--muted-foreground))] space-y-1">
              <div>Actors: {getActors()}</div>
              <div>Time: {new Date(signal.ts).toLocaleString()}</div>
              <div>Direction: {signal.direction} · Topic: {signal.topicType}</div>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <SignalStatusBadge status={signal.status} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs px-2 py-1 h-6"
            >
              {showDetails ? "Hide" : "Details"}
            </Button>
          </div>
        </div>
        
        {showDetails && (
          <div className="mt-3 pt-3 border-t space-y-2">
            <div className="text-xs">
              <div className="font-medium mb-1">Signal ID:</div>
              <div className="flex items-center gap-2">
                <code className="bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] px-2 py-1 rounded text-xs font-mono">
                  {signal.id}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(signal.id, "Signal ID")}
                  className="h-5 w-5 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            {signal.payload && Object.keys(signal.payload).length > 0 && (
              <div className="text-xs">
                <div className="font-medium mb-1">Payload:</div>
                <div className="flex items-start gap-2">
                  <pre className="bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] p-3 rounded-lg text-xs overflow-x-auto flex-1 font-mono border border-[hsl(var(--border))]">
                    {JSON.stringify(signal.payload, null, 2)}
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(signal.payload, null, 2), "Payload")}
                    className="h-5 w-5 p-0 flex-shrink-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
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
  
  // Initialize session
  useEffect(() => {
    const currentSessionId = getSessionId()
    setSessionId(currentSessionId)
  }, [])
  
  // Load and mark as seen when visiting page
  useEffect(() => {
    if (!sessionId) return
    
    // Mark signals tab as seen
    signalsStore.markSeen("signals")
    
    const loadSignals = async () => {
      try {
        console.log("[SignalsPage] Loading signals (cache → HCS)...")
        // 1) Try cache first
        const cached = loadSignalsCache()
        if (cached && cached.length) {
          const flags = getRuntimeFlags()
          const scopeFiltered = flags.scope === 'my'
            ? cached.filter(s => s.actors.from === sessionId || s.actors.to === sessionId)
            : cached
          setSignals(scopeFiltered.sort((a, b) => b.ts - a.ts))
        }

        // 2) Always fetch from HCS/Mirror and refresh cache
        console.log("[SignalsPage] HCS feed service ready?", hcsFeedService.isReady())
        console.log("[SignalsPage] HCS topic IDs:", hcsFeedService.getTopicIds())
        
        // Load ONLY from HCS - no local storage
        const hcsSignals = await hcsFeedService.getAllFeedEvents()
        console.log("[SignalsPage] Raw HCS signals:", hcsSignals)
        
        // Filter by scope if needed
        const flags = getRuntimeFlags()
        console.log("[SignalsPage] Runtime flags:", flags)
        let filteredSignals = hcsSignals
        
        if (flags.scope === 'my') {
          // Filter to only show signals involving current session
          filteredSignals = hcsSignals.filter(signal => 
            signal.actors.from === sessionId || signal.actors.to === sessionId
          )
        }
        
        setSignals(filteredSignals.sort((a, b) => b.ts - a.ts))

        // 3) Save to cache for snappy reloads
        saveSignalsCache(hcsSignals)

        // 4) Save lightweight derived state (for header counters etc.)
        const derived = computeDerivedFromSignals(hcsSignals, sessionId)
        saveDerivedState(derived)
        
        // Update HCS topic IDs
        if (hcsFeedService.isReady()) {
          setHcsTopicIds(hcsFeedService.getTopicIds())
        }
        
        console.log(`[SignalsPage] Loaded ${filteredSignals.length} HCS signals (scope: ${flags.scope})`)
      } catch (error) {
        console.error("[SignalsPage] Failed to load HCS signals:", error)
        setSignals([]) // No fallback to local - pure HCS mode
      }
    }

    // Load initially
    loadSignals()

    // Reload on storage changes
    const handleStorageChange = () => loadSignals()
    window.addEventListener('storage', handleStorageChange)
    
    // Also poll for updates only if service is ready
    const interval = setInterval(() => {
      if (hcsFeedService.isReady()) {
        loadSignals()
      }
    }, 5000) // Reduced frequency to prevent race conditions

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [sessionId])

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
          <div className="space-y-3">
            {filteredSignals.map((signal) => (
              <FeedItem 
                key={signal.id} 
                signal={signal}
                onPrimaryClick={handleRecognitionSignalClick}
                onAccept={(signal) => console.log('Accept:', signal)}
                onBlock={(signal) => console.log('Block:', signal)}
                onAdjustTrust={(signal) => console.log('Adjust trust:', signal)}
                onRevoke={(signal) => console.log('Revoke:', signal)}
                onShare={(signal) => console.log('Share:', signal)}
                onRetry={(signal) => console.log('Retry:', signal)}
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
