"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AddContactDialog } from "@/components/AddContactDialog"
import { signalsStore, type BondedContact, type SignalEvent } from "@/lib/stores/signalsStore"
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
import { PersonalMetrics } from "@/components/PersonalMetrics"
import { RecognitionGrid } from "@/components/RecognitionGrid"

const TRUST_TOPIC = process.env.NEXT_PUBLIC_TOPIC_TRUST || ""
const HCS_ENABLED = process.env.NEXT_PUBLIC_HCS_ENABLED === "true"

// Generate circular trust visualization
function TrustCircle({ allocatedOut, maxSlots }: { allocatedOut: number; maxSlots: number }) {
  const totalSlots = 9
  const dots = Array.from({ length: totalSlots }, (_, i) => {
    // Arrange dots in a circle
    const angle = (i * 360) / totalSlots - 90 // Start from top
    const radian = (angle * Math.PI) / 180
    const radius = 20 // Distance from center
    const x = Math.cos(radian) * radius + 32 // 32 is center (64/2)
    const y = Math.sin(radian) * radius + 32

    return (
      <div
        key={i}
        className={`absolute w-3 h-3 rounded-full transform -translate-x-1.5 -translate-y-1.5 ${
          i < allocatedOut ? "bg-green-500" : "bg-slate-200"
        }`}
        style={{ left: x, top: y }}
      />
    )
  })

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      {dots}
      {/* Center dot */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-300" />
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
  const [sessionId, setSessionId] = useState("")

  // Initialize session and seed data
  useEffect(() => {
    const currentSessionId = getSessionId()
    setSessionId(currentSessionId)
    
    // Seed demo data if needed
    seedDemo(signalsStore, currentSessionId)
  }, [])

  // Load data from signals store
  useEffect(() => {
    if (!sessionId) return
    
    const loadData = () => {
      const flags = getRuntimeFlags()
      const bonded = signalsStore.getBondedContacts(sessionId)
      const stats = signalsStore.getTrustStats(sessionId)
      const recent = signalsStore.getSignals({ 
        scope: flags.scope,
        sessionId,
        class: 'contact'
      }).concat(signalsStore.getSignals({
        scope: flags.scope,
        sessionId,
        class: 'trust'
      })).sort((a, b) => b.ts - a.ts).slice(0, 3)
      
      setBondedContacts(bonded)
      setTrustStats(stats)
      setRecentSignals(recent)
    }

    // Load initially
    loadData()

    // Reload on storage changes (when signals are added/updated)
    const handleStorageChange = () => loadData()
    window.addEventListener('storage', handleStorageChange)
    
    // Also poll for updates since storage events don't fire in same tab
    const interval = setInterval(loadData, 2000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [sessionId])

  const availableSlots = Math.min(bondedContacts.length, 9) - trustStats.allocatedOut

  const handleAllocateTrust = async (peerId: string, weight: number) => {
    // Create TRUST_ALLOCATE envelope
    const envelope = {
      type: "TRUST_ALLOCATE",
      from: sessionId,
      nonce: Date.now(),
      ts: Math.floor(Date.now() / 1000),
      payload: {
        to: peerId,
        weight,
        reason: "circle_allocation"
      },
      sig: "demo_signature"
    }

    // Add to signals store immediately
    const signalEvent: SignalEvent = {
      id: `trust_allocate_${envelope.nonce}`,
      class: "trust",
      topicType: "TRUST",
      direction: "outbound",
      actors: { from: sessionId, to: peerId },
      payload: envelope.payload,
      ts: Date.now(),
      status: "local",
      seen: false,
      type: "TRUST_ALLOCATE",
      sessionId,
      seeded: false
    }

    signalsStore.addSignal(signalEvent)
    toast.success(`Trust allocated to ${peerId.slice(-6)}`, { description: `Weight: ${weight}` })

    // Background HCS submit
    if (HCS_ENABLED && TRUST_TOPIC) {
      submitTrustToHCS(envelope, signalEvent.id)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Circle</h1>
        <AddContactDialog />
      </div>

      {/* Trust & Contacts Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <TrustCircle 
                allocatedOut={trustStats.allocatedOut} 
                maxSlots={Math.min(bondedContacts.length, 9)} 
              />
              <div>
                <div className="font-semibold text-[hsl(var(--card-foreground))]">
                  Trust: {trustStats.allocatedOut}/{Math.min(bondedContacts.length, trustStats.cap)}
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

      {/* Personal Metrics Dashboard */}
      <PersonalMetrics sessionId={sessionId} />

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

      {/* Trust Allocation - Only show if have bonded contacts and available slots */}
      {bondedContacts.length > 0 && availableSlots > 0 && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="font-semibold text-[hsl(var(--card-foreground))] mb-1">Quick Trust Allocation</div>
                <div className="text-sm text-[hsl(var(--muted-foreground))]">
                  Allocate to {bondedContacts[0]?.handle || `User ${bondedContacts[0]?.peerId.slice(-6)}`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((weight) => (
                  <Button
                    key={weight}
                    size="sm"
                    onClick={() => handleAllocateTrust(bondedContacts[0].peerId, weight)}
                    disabled={trustStats.allocatedOut + weight > trustStats.cap}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 disabled:opacity-50"
                  >
                    {weight}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
