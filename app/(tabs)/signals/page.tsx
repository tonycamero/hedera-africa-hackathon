"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { signalsStore, type SignalEvent, type SignalClass } from "@/lib/stores/signalsStore"
import { FeedItem } from "@/components/FeedItem"
import { hcsFeedService } from "@/lib/services/HCSFeedService"
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
        // Load ONLY from HCS - no local storage
        const hcsSignals = await hcsFeedService.getAllFeedEvents()
        
        // Filter by scope if needed
        const flags = getRuntimeFlags()
        let filteredSignals = hcsSignals
        
        if (flags.scope === 'my') {
          // Filter to only show signals involving current session
          filteredSignals = hcsSignals.filter(signal => 
            signal.actors.from === sessionId || signal.actors.to === sessionId
          )
        }
        
        setSignals(filteredSignals.sort((a, b) => b.ts - a.ts))
        
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
    
    // Also poll for updates
    const interval = setInterval(loadSignals, 2000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [sessionId])

  // Filter signals based on active filter
  const filteredSignals = signals.filter(signal => 
    activeFilter === "all" || signal.class === activeFilter
  )

  const clearAllSignals = async () => {
    if (confirm("Are you sure you want to clear all signals? This will reset HCS demo data.")) {
      await hcsFeedService.disableSeedMode()
      signalsStore.clear() // Clear any remaining local data
      setSignals([])
      setHcsTopicIds(null)
      toast.success("All HCS signals cleared")
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
          
          {signals.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllSignals}
              className="text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* HCS Topic Information */}
      {hcsTopicIds && (
        <Card className="bg-gradient-to-r from-[hsl(var(--card))]/50 to-[hsl(var(--muted))]/30 border border-[hsl(var(--success))]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-[hsl(var(--success))]">
              <Check className="w-4 h-4" />
              HCS Topics Active
              <Badge variant="outline" className="text-xs border-[hsl(var(--success))]/30 text-[hsl(var(--success))]">
                On-chain Storage
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {hcsTopicIds.feed && (
                <div className="flex items-center gap-2 text-xs">
                  <Activity className="w-3 h-3 text-[hsl(var(--professional))]" />
                  <div>
                    <div className="font-medium">Feed</div>
                    <code className="text-[hsl(var(--muted-foreground))]">{hcsTopicIds.feed}</code>
                  </div>
                </div>
              )}
              {hcsTopicIds.contacts && (
                <div className="flex items-center gap-2 text-xs">
                  <Users className="w-3 h-3 text-[hsl(var(--social))]" />
                  <div>
                    <div className="font-medium">Contacts</div>
                    <code className="text-[hsl(var(--muted-foreground))]">{hcsTopicIds.contacts}</code>
                  </div>
                </div>
              )}
              {hcsTopicIds.trust && (
                <div className="flex items-center gap-2 text-xs">
                  <Heart className="w-3 h-3 text-[hsl(var(--trust))]" />
                  <div>
                    <div className="font-medium">Trust</div>
                    <code className="text-[hsl(var(--muted-foreground))]">{hcsTopicIds.trust}</code>
                  </div>
                </div>
              )}
              {hcsTopicIds.recognition && (
                <div className="flex items-center gap-2 text-xs">
                  <Award className="w-3 h-3 text-[hsl(var(--academic))]" />
                  <div>
                    <div className="font-medium">Recognition</div>
                    <code className="text-[hsl(var(--muted-foreground))]">{hcsTopicIds.recognition}</code>
                  </div>
                </div>
              )}
              {hcsTopicIds.profile && (
                <div className="flex items-center gap-2 text-xs">
                  <Users className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
                  <div>
                    <div className="font-medium">Profiles</div>
                    <code className="text-[hsl(var(--muted-foreground))]">{hcsTopicIds.profile}</code>
                  </div>
                </div>
              )}
              {hcsTopicIds.system && (
                <div className="flex items-center gap-2 text-xs">
                  <Activity className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
                  <div>
                    <div className="font-medium">System</div>
                    <code className="text-[hsl(var(--muted-foreground))]">{hcsTopicIds.system}</code>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-[hsl(var(--border))]/50">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                All signal data is stored immutably on Hedera Consensus Service. 
                <a 
                  href="https://hashscan.io/testnet/topics" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[hsl(var(--success))] hover:underline ml-1"
                >
                  View on HashScan Explorer →
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter chips */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter by type
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2 flex-wrap">
            {filterChips.map((chip) => (
              <Button
                key={chip.value}
                variant={activeFilter === chip.value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(chip.value)}
                className="text-xs h-7"
              >
                {chip.icon}
                <span className="ml-1">{chip.label}</span>
                {chip.value !== "all" && (
                  <Badge 
                    variant="secondary" 
                    className="ml-1 h-4 text-xs px-1"
                  >
                    {signals.filter(s => s.class === chip.value).length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Signals list */}
      <div>
        {filteredSignals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium mb-2">No signals yet</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {activeFilter === "all" 
                  ? "Activity will appear here when you interact with contacts or allocate trust"
                  : `No ${activeFilter} signals found`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredSignals.map((signal) => (
              <FeedItem 
                key={signal.id} 
                signal={signal}
                onPrimaryClick={(signal) => console.log('Open signal modal:', signal)}
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
    </div>
  )
}