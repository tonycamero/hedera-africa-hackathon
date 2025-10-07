"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AddContactDialog } from "@/components/AddContactDialog"
import { signalsStore, type BondedContact, type SignalEvent } from "@/lib/stores/signalsStore"
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
import { HCS_ENABLED, TOPIC, MIRROR_REST, MIRROR_WS } from "@/lib/env"
import { seedDemo } from "@/lib/demo/seed"
import { RecognitionGrid } from "@/components/RecognitionGrid"

const TRUST_TOPIC = TOPIC.trust || ""

// Expose store for debugging
if (typeof window !== 'undefined') {
  (window as any).__signalsStore = signalsStore;
}

// Professional Trust Circle - Ultra Minimal
function ProfessionalTrustCircle({ allocatedOut, maxSlots }: { allocatedOut: number; maxSlots: number }) {
  const totalSlots = 9
  const dots = Array.from({ length: totalSlots }, (_, i) => {
    const angle = (i * 360) / totalSlots - 90
    const radian = (angle * Math.PI) / 180
    const radius = 60 // Larger radius for professional look
    const x = Math.cos(radian) * radius + 80 // Centered in larger container
    const y = Math.sin(radian) * radius + 80

    const isActive = i < allocatedOut
    const isInvite = !isActive
    
    return (
      <div
        key={i}
        className={`absolute w-6 h-6 rounded-full border transition-all duration-500 cursor-pointer ${
          isActive 
            ? 'border-[#00F6FF] bg-[#00F6FF]/20 shadow-[0_0_8px_rgba(0,246,255,0.4)]' 
            : 'border-white/30 bg-transparent hover:border-[#00F6FF]/50'
        }`}
        style={{ left: x - 12, top: y - 12 }}
      >
        {isActive && (
          <div className="absolute inset-2 rounded-full bg-[#00F6FF] animate-pulse" />
        )}
        {isInvite && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-white/40 font-light">
            +
          </div>
        )}
      </div>
    )
  })

  return (
    <div className="relative w-40 h-40 flex-shrink-0">
      {dots}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="text-2xl font-light text-[#00F6FF]">{allocatedOut}</div>
        <div className="text-xs text-white/50">/9</div>
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
  const [trustStats, setTrustStats] = useState({ allocatedOut: 0, cap: 9 })
  const [recentSignals, setRecentSignals] = useState<SignalEvent[]>([])
  const [allEvents, setAllEvents] = useState<SignalEvent[]>([])
  const [sessionId, setSessionId] = useState("")
  
  // Log changes to UI state for debugging
  useEffect(() => {
    console.log('📋 [UI] bonded contacts updated:', bondedContacts.length, bondedContacts.map(b => b.handle || b.peerId.slice(-6)));
  }, [bondedContacts]);
  
  useEffect(() => {
    console.log('📋 [UI] recent signals updated:', recentSignals.length, recentSignals.map(s => s.type));
  }, [recentSignals]);
  
  useEffect(() => {
    console.log('📋 [UI] trust stats updated:', trustStats);
  }, [trustStats]);
  
  // Note: Removed signalsStore subscription since we're using direct HCS loading for consistency
  
  // Load data from SignalsStore (single source of truth)
  useEffect(() => {
    const loadFromSignalsStore = () => {
      try {
        const currentSessionId = getSessionId()
        // Fallback to 'tm-alex-chen' if session ID is null/undefined (common in demo mode)
        const effectiveSessionId = currentSessionId || 'tm-alex-chen'
        setSessionId(effectiveSessionId)
        console.log('🚀 [CirclePage] Loading from SignalsStore (single source)...')
        console.log('📋 [CirclePage] Session ID:', effectiveSessionId, '(raw:', currentSessionId, ')')
        
        // Get all events from SignalsStore
        const allStoreEvents = signalsStore.getAll()
        
        console.log('📡 [CirclePage] Loaded', allStoreEvents.length, 'events from SignalsStore')
        
        if (allStoreEvents.length > 0) {
          // Process events using the same HCS utility functions but with store data
          const bonded = getBondedContactsFromHCS(allStoreEvents, effectiveSessionId)
          const recent = getRecentSignalsFromHCS(allStoreEvents, effectiveSessionId, 5)
          const allSignals = getRecentSignalsFromHCS(allStoreEvents, effectiveSessionId, 1000)
          
          // Calculate TRUST allocation for LEDs (not contacts!)
          const trustEvents = allStoreEvents.filter(e => 
            e.type === 'trust_allocate' && e.actor === effectiveSessionId
          )
          
          // Count trust allocations (green LEDs) - each allocation = 1 LED
          const trustAllocated = trustEvents.length
          
          console.log('📊 [CirclePage] Trust calculation:', {
            totalEvents: allStoreEvents.length,
            trustEvents: trustEvents.length,
            trustAllocated,
            sessionId: effectiveSessionId,
            sampleTrustEvent: trustEvents[0]
          })
          
          const stats = { 
            allocatedOut: trustAllocated, // Green LEDs = trust allocations (not contacts!)
            cap: 9
          }
          
          setBondedContacts(bonded)
          setTrustStats(stats)
          setRecentSignals(recent)
          setAllEvents(allSignals)
          
          console.log('✅ [CirclePage] Data loaded from SignalsStore:', {
            bonded: bonded.length,
            stats,
            recent: recent.length,
            total: allStoreEvents.length,
            session: currentSessionId
          })
        } else {
          console.log('⚠️ [CirclePage] SignalsStore empty - waiting for ingestion...')
          setBondedContacts([])
          setTrustStats({ allocatedOut: 0, cap: 9 })
          setRecentSignals([])
          setAllEvents([])
        }
        
      } catch (error) {
        console.error('❌ [CirclePage] SignalsStore load failed:', error)
        const currentSessionId = getSessionId()
        const effectiveSessionId = currentSessionId || 'tm-alex-chen'
        setSessionId(effectiveSessionId)
        setBondedContacts([])
        setTrustStats({ allocatedOut: 0, cap: 9 })
        setRecentSignals([])
      }
    }
    
    // Initial load
    loadFromSignalsStore()
    
    // Subscribe to SignalsStore changes
    const unsubscribe = signalsStore.subscribe(() => {
      console.log('📡 [CirclePage] SignalsStore updated, refreshing...')
      loadFromSignalsStore()
    })
    
    return unsubscribe
  }, [])

  const availableSlots = Math.max(0, 9 - trustStats.allocatedOut)

  const handleAllocateTrust = async (peerId: string, weight: number) => {
    try {
      // Create a trust allocation signal and add to store
      const trustSignal: SignalEvent = {
        id: `trust_${sessionId}_${peerId}_${Date.now()}`,
        type: 'TRUST_ALLOCATE',
        actor: sessionId,
        target: peerId,
        ts: Date.now(),
        topicId: TRUST_TOPIC,
        metadata: { weight, tag: 'circle_allocation' },
        source: 'hcs-cached'
      }
      
      signalsStore.addSignal(trustSignal)
      
      toast.success(`Trust allocated to ${peerId.slice(-6)}`, { description: `Weight: ${weight}` })
      
      // SignalsStore subscription will automatically refresh the UI
      // No need to manually refresh since we're subscribed to store changes
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
      (s.type === 'NFT_MINT' || s.type === 'RECOGNITION_MINT' || s.type === 'recognition_mint') && 
      (s.target === effectiveSessionId || s.target === sessionId)
    ).length // Recognition minted to current user
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Professional Header */}
      <div className="text-center">
        <h1 className="text-3xl font-medium text-white mb-2 tracking-tight">
          Your Circle of Trust ({trustStats.allocatedOut}/9)
        </h1>
      </div>

      {/* Professional Trust Circle */}
      <div className="flex justify-center">
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-12">
          <ProfessionalTrustCircle 
            allocatedOut={trustStats.allocatedOut} 
            maxSlots={9} 
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button className="bg-transparent border border-[#00F6FF] text-[#00F6FF] hover:bg-[#00F6FF]/10 transition-all duration-300 px-8">
          Send a Signal
        </Button>
      </div>

      {/* Management Controls */}
      <div className="text-center">
        <Button 
          variant="ghost" 
          className="text-white/60 hover:text-[#00F6FF] hover:bg-[#00F6FF]/10 transition-all duration-300"
          onClick={() => window.location.href = '/contacts'}
        >
          Manage Slots
        </Button>
      </div>
    </div>
  )
}
