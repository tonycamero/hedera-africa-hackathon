"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AddContactDialog } from "@/components/AddContactDialog"
import { signalsStore, type BondedContact, type SignalEvent } from "@/lib/stores/signalsStore"
import { hcsFeedService } from "@/lib/services/HCSFeedService"
import { getBondedContactsFromHCS, getRecentSignalsFromHCS } from "@/lib/services/HCSDataUtils"
// import { bootstrapFlex, type BootstrapResult } from "@/lib/boot/bootstrapFlex"
import Link from "next/link"
import { 
  Users, 
  UserPlus, 
  Heart, 
  Activity, 
  AlertCircle,
  Check,
  Clock
} from "lucide-react"
import { toast } from "sonner"
import { hederaClient } from "@/packages/hedera/HederaClient"
import { getSessionId } from "@/lib/session"
import { getRuntimeFlags } from "@/lib/runtimeFlags"
import { seedDemo } from "@/lib/demo/seed"
import { RecognitionGrid } from "@/components/RecognitionGrid"

const TRUST_TOPIC = process.env.NEXT_PUBLIC_TOPIC_TRUST || ""
const HCS_ENABLED = process.env.NEXT_PUBLIC_HCS_ENABLED === "true"

// Generate circular trust visualization
function TrustCircle({ allocatedOut, pendingOut, maxSlots }: { allocatedOut: number; pendingOut: number; maxSlots: number }) {
  const totalSlots = 9
  const dots = Array.from({ length: totalSlots }, (_, i) => {
    // Arrange dots in a circle
    const angle = (i * 360) / totalSlots - 90 // Start from top
    const radian = (angle * Math.PI) / 180
    const radius = 20 // Distance from center
    const x = Math.cos(radian) * radius + 32 // 32 is center (64/2)
    const y = Math.sin(radian) * radius + 32

    // Determine LED state: green (accepted connection), yellow (pending request), gray (available)
    let ledStyle = ""
    let innerStyle = ""
    
    if (i < allocatedOut) {
      // Green LEDs for accepted connections
      ledStyle = "bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/50 border-2 border-green-300"
      innerStyle = "bg-gradient-to-br from-green-300 to-green-500"
    } else if (i < allocatedOut + pendingOut) {
      // Yellow LEDs for pending connection requests
      ledStyle = "bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/40 border-2 border-yellow-300"
      innerStyle = "bg-gradient-to-br from-yellow-300 to-yellow-500"
    } else {
      // Gray LEDs for available connection slots
      ledStyle = "bg-gradient-to-br from-gray-300 to-gray-500 shadow-md shadow-gray-400/20 border-2 border-gray-200"
      innerStyle = "bg-gradient-to-br from-gray-200 to-gray-400"
    }

    return (
      <div
        key={i}
        className={`absolute w-4 h-4 rounded-full transform -translate-x-2 -translate-y-2 ${ledStyle}`}
        style={{ left: x, top: y }}
      >
        {/* LED inner glow effect */}
        <div className={`absolute inset-1 rounded-full ${innerStyle}`} />
        {/* LED highlight spot */}
        <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-white opacity-60" />
      </div>
    )
  })

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      {dots}
      {/* Center flame emoji */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center">
        <span className="text-base">🔥</span>
      </div>
    </div>
  )
}

async function submitTrustToHCS(envelope: any, signalId?: string) {
  if (!HCS_ENABLED || !TRUST_TOPIC) return
  
  try {
    await hederaClient.submitMessage(TRUST_TOPIC, JSON.stringify(envelope))
    if (signalId) {
      signalsStore.updateSignalStatus(signalId, "onchain")
    }
    toast.success("Trust allocated on-chain ✓", { description: `TRUST …${TRUST_TOPIC.slice(-6)}` })
  } catch (e: any) {
    if (signalId) {
      signalsStore.updateSignalStatus(signalId, "error")
    }
    toast.error("Trust allocation failed", { description: e?.message ?? "Unknown error" })
  }
}

function BondedContactCard({ 
  contact, 
  canAllocate, 
  onAllocateTrust 
}: { 
  contact: BondedContact
  canAllocate: boolean
  onAllocateTrust: (peerId: string, weight: number) => void
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-sm">
              {contact.handle || `User ${contact.peerId.slice(-6)}`}
            </div>
            <div className="text-xs text-[hsl(var(--muted-foreground))]">
              Bonded {new Date(contact.bondedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {contact.trustLevel && (
            <Badge variant="secondary" className="text-xs">
              Trust {contact.trustLevel}
            </Badge>
          )}
          
          {canAllocate && !contact.trustLevel && (
            <div className="flex gap-1">
              {[1, 2, 3].map((weight) => (
                <Button
                  key={weight}
                  size="sm"
                  variant="outline"
                  className="text-xs px-2 py-1 h-6"
                  onClick={() => onAllocateTrust(contact.peerId, weight)}
                >
                  {weight}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

function MiniFeedItem({ signal }: { signal: SignalEvent }) {
  const getIcon = () => {
    if (signal.class === "contact") return <UserPlus className="w-3 h-3" />
    if (signal.class === "trust") return <Heart className="w-3 h-3" />
    return <Activity className="w-3 h-3" />
  }

  const getStatusIcon = () => {
    if (signal.status === "onchain") return <Check className="w-3 h-3 text-green-600" />
    if (signal.status === "error") return <AlertCircle className="w-3 h-3 text-red-600" />
    return <Clock className="w-3 h-3 text-slate-400" />
  }

  const getTitle = () => {
    if (signal.type === "CONTACT_REQUEST") {
      return signal.direction === "outbound" ? "Contact request sent" : "Contact request received"
    }
    if (signal.type === "CONTACT_ACCEPT") {
      return signal.direction === "outbound" ? "Contact accepted" : "Contact bonded"
    }
    if (signal.type === "TRUST_ALLOCATE") {
      return `Trust allocated (${signal.payload?.weight || 1})`
    }
    return signal.type
  }

  return (
    <div className="flex items-center gap-2 py-2 border-b last:border-0">
      <div className="flex items-center gap-1">
        {getIcon()}
        {getStatusIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{getTitle()}</div>
        <div className="text-xs text-[hsl(var(--muted-foreground))]">
          {new Date(signal.ts).toLocaleDateString()} · {signal.direction}
        </div>
      </div>
    </div>
  )
}

export default function CirclePage() {
  const [bondedContacts, setBondedContacts] = useState<BondedContact[]>([])
  const [trustStats, setTrustStats] = useState({ allocatedOut: 0, cap: 9, pendingOut: 0 })
  const [recentSignals, setRecentSignals] = useState<SignalEvent[]>([])
  const [allEvents, setAllEvents] = useState<SignalEvent[]>([])
  const [sessionId, setSessionId] = useState("")
  // Direct HCS data loading - bypass broken bootstrap
  useEffect(() => {
    const loadDirectFromHCS = async () => {
      try {
        console.log('🚀 [CirclePage] Loading directly from HCS...')
        
        const currentSessionId = getSessionId()
        setSessionId(currentSessionId)
        console.log('📋 [CirclePage] Session ID:', currentSessionId)
        console.log('📋 [CirclePage] Expected recognition owner ID:', currentSessionId)
        
        // Initialize HCS service and get all events
        await hcsFeedService.initialize()
        const events = await hcsFeedService.getAllFeedEvents()
        
        console.log('📡 [CirclePage] Loaded', events.length, 'events from HCS')
        
        if (events.length > 0) {
          // Process events into UI data
          const bonded = getBondedContactsFromHCS(events, currentSessionId)
          const recent = getRecentSignalsFromHCS(events, currentSessionId, 5)
          const allSignals = getRecentSignalsFromHCS(events, currentSessionId, 1000) // Get all events for counting
          
          // Calculate connection status for LEDs (not trust allocation amounts)
          const contactEvents = events.filter(e => e.class === 'contact')
          
          // Count accepted connections (green LEDs)
          const acceptedConnections = contactEvents.filter(e => 
            e.type === 'CONTACT_ACCEPT' && 
            (e.actors.from === currentSessionId || e.actors.to === currentSessionId)
          ).length / 2 // Divide by 2 since each connection creates 2 events
          
          // Count pending outbound requests (yellow LEDs) 
          const pendingRequests = contactEvents.filter(e => 
            e.type === 'CONTACT_REQUEST' && 
            e.actors.from === currentSessionId &&
            // Only count as pending if no corresponding ACCEPT exists
            !contactEvents.some(acceptEvent => 
              acceptEvent.type === 'CONTACT_ACCEPT' &&
              acceptEvent.actors.to === currentSessionId &&
              acceptEvent.actors.from === e.actors.to
            )
          ).length
          
          const stats = { 
            allocatedOut: Math.floor(acceptedConnections), // Green LEDs = accepted connections
            cap: 9, 
            pendingOut: pendingRequests // Yellow LEDs = pending requests
          }
          
          setBondedContacts(bonded)
          setTrustStats(stats)
          setRecentSignals(recent)
          setAllEvents(allSignals)
          
          console.log('✅ [CirclePage] Data loaded:', { 
            bonded: bonded.length, 
            stats, 
            recent: recent.length,
            session: currentSessionId
          })
        } else {
          console.log('⚠️ [CirclePage] No events found - this is expected on first load')
          setBondedContacts([])
          setTrustStats({ allocatedOut: 0, cap: 9, pendingOut: 0 })
          setRecentSignals([])
        }
        
      } catch (error) {
        console.error('❌ [CirclePage] Direct HCS load failed:', error)
        // Set empty state
        const currentSessionId = getSessionId()
        setSessionId(currentSessionId)
        setBondedContacts([])
        setTrustStats({ allocatedOut: 0, cap: 9, pendingOut: 0 })
        setRecentSignals([])
      }
    }
    
    loadDirectFromHCS()
  }, [])

  const availableSlots = Math.max(0, 9 - trustStats.allocatedOut)

  const handleAllocateTrust = async (peerId: string, weight: number) => {
    try {
      // Use HCS feed service to log trust allocation
      const trustEvent = await hcsFeedService.logTrustAllocation(
        sessionId,
        peerId,
        weight,
        "circle_allocation"
      )
      
      toast.success(`Trust allocated to ${peerId.slice(-6)}`, { description: `Weight: ${weight}` })
      
      // Refresh data immediately to show the updated connection status
      const events = await hcsFeedService.getAllFeedEvents()
      const bonded = getBondedContactsFromHCS(events, sessionId)
      
      // Recalculate connection status for LEDs (not trust allocation amounts)
      const contactEvents = events.filter(e => e.class === 'contact')
      
      // Count accepted connections (green LEDs)
      const acceptedConnections = contactEvents.filter(e => 
        e.type === 'CONTACT_ACCEPT' && 
        (e.actors.from === sessionId || e.actors.to === sessionId)
      ).length / 2 // Divide by 2 since each connection creates 2 events
      
      // Count pending outbound requests (yellow LEDs) 
      const pendingRequests = contactEvents.filter(e => 
        e.type === 'CONTACT_REQUEST' && 
        e.actors.from === sessionId &&
        // Only count as pending if no corresponding ACCEPT exists
        !contactEvents.some(acceptEvent => 
          acceptEvent.type === 'CONTACT_ACCEPT' &&
          acceptEvent.actors.to === sessionId &&
          acceptEvent.actors.from === e.actors.to
        )
      ).length
      
      const stats = { 
        allocatedOut: Math.floor(acceptedConnections), // Green LEDs = accepted connections
        cap: 9, 
        pendingOut: pendingRequests // Yellow LEDs = pending requests
      }
      
      setBondedContacts(bonded)
      setTrustStats(stats)
    } catch (error) {
      console.error('[CirclePage] Failed to allocate trust via HCS:', error)
      toast.error('Failed to allocate trust', { description: error.message || 'Unknown error' })
    }
  }

  // Get metrics for compact display (connection workflow model)
  const metrics = {
    bondedContacts: bondedContacts.length,
    trustAllocated: trustStats.allocatedOut, // Green LEDs = accepted connections
    trustCapacity: 9,
    recognitionOwned: allEvents.filter(s => 
      (s.type === 'NFT_MINT' || s.type === 'RECOGNITION_MINT') && 
      (s.actors?.to === sessionId || s.target === sessionId)
    ).length // Recognition minted to Alex
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Circle of Trust</h1>
          {/* Personal Metrics under title */}
          <div className="flex items-center gap-4 text-sm mt-2">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="font-semibold">{metrics.bondedContacts}</span>
              <span className="text-muted-foreground">Bonded</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-green-600" />
              <span className="font-semibold">{metrics.trustAllocated}/9</span>
              <span className="text-muted-foreground">Connected</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="w-4 h-4 text-purple-600" />
              <span className="font-semibold">{metrics.recognitionOwned}</span>
              <span className="text-muted-foreground">Recognition</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AddContactDialog />
        </div>
      </div>

      {/* Trust & Contacts Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <TrustCircle 
                allocatedOut={trustStats.allocatedOut} 
                pendingOut={trustStats.pendingOut}
                maxSlots={9} 
              />
              <div>
                <div className="font-semibold text-[hsl(var(--card-foreground))]">
                  Connections: {trustStats.allocatedOut}/9
                </div>
                <div className="text-sm text-[hsl(var(--muted-foreground))]">
                  {bondedContacts.length} bonded contacts
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {availableSlots > 0 ? (
                <Badge variant="secondary" className="bg-emerald-400/20 text-emerald-300">
                  {availableSlots} slots
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                  Full
                </Badge>
              )}
              <Link 
                href="/contacts"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Manage →
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Recognition Collection */}
      <RecognitionGrid ownerId={sessionId} maxItems={5} />

      {/* Recent Signals Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Signals
            </CardTitle>
            {recentSignals.length > 0 && (
              <Link 
                href="/signals"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All →
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recentSignals.length === 0 ? (
            <div className="text-center py-6 text-[hsl(var(--muted-foreground))]">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No signals yet</p>
              <p className="text-xs">Activity will appear here when you connect with others</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSignals.map((signal) => (
                <MiniFeedItem key={signal.id} signal={signal} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trust Allocation - Show for all bonded contacts */}
      {bondedContacts.length > 0 && (
        <Card className="border-card-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-card-foreground">
              <Heart className="w-5 h-5 text-neon-green" />
              Send Trust
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bondedContacts.map((contact) => {
                const hasTrust = contact.trustLevel && contact.trustLevel > 0
                return (
                  <div key={contact.peerId} className="flex items-center justify-between p-3 border-card-border bg-card rounded border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-card-foreground">
                          {contact.handle || `User ${contact.peerId.slice(-6)}`}
                        </div>
                        {hasTrust && (
                          <div className="text-xs text-neon-green">
                            Trust Level: {contact.trustLevel}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {!hasTrust && (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3].map((weight) => (
                          <Button
                            key={weight}
                            size="sm"
                            variant="outline"
                            onClick={() => handleAllocateTrust(contact.peerId, weight)}
                            disabled={trustStats.allocatedOut + trustStats.pendingOut + weight > 9}
                            className="text-xs px-2 py-1 h-6 border-card-border text-card-foreground hover:bg-card-border hover:text-card-foreground"
                          >
                            {weight}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
