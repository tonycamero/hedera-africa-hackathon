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
  Clock,
  Share2,
  Link2,
  Crown,
  Star,
  Send,
  Coins,
  UserMinus,
  Group,
  Sparkles
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

// Social Circle Visualization with member avatars
function SocialCircle({ members, maxSlots }: { members: BondedContact[]; maxSlots: number }) {
  const totalSlots = 9
  const slots = Array.from({ length: totalSlots }, (_, i) => {
    // Arrange slots in a circle
    const angle = (i * 360) / totalSlots - 90 // Start from top
    const radian = (angle * Math.PI) / 180
    const radius = 28 // Distance from center
    const x = Math.cos(radian) * radius + 40 // 40 is center (80/2)
    const y = Math.sin(radian) * radius + 40

    const member = members[i]
    const isEmpty = !member
    
    return (
      <div
        key={i}
        className={`absolute w-10 h-10 rounded-full transform -translate-x-5 -translate-y-5 cursor-pointer transition-all duration-300 hover:scale-110 ${
          isEmpty 
            ? "border-2 border-dashed border-orange-400/40 bg-orange-500/10 hover:border-orange-400/60 hover:bg-orange-500/20"
            : "border-2 border-orange-400/60 bg-gradient-to-br from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 shadow-lg"
        }`}
        style={{ left: x, top: y }}
      >
        {member ? (
          // Filled slot with member
          <div className="w-full h-full rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-orange-300">
              {(member.handle || member.peerId).slice(0, 2).toUpperCase()}
            </span>
            {/* Trust level indicator */}
            {member.trustLevel && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-400 text-white text-xs flex items-center justify-center font-bold">
                {member.trustLevel}
              </div>
            )}
          </div>
        ) : (
          // Empty slot
          <div className="w-full h-full rounded-full flex items-center justify-center">
            <UserPlus className="w-4 h-4 text-orange-400/60" />
          </div>
        )}
      </div>
    )
  })

  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      {slots}
      {/* Center - You */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
        <Crown className="w-4 h-4 text-white" />
      </div>
      {/* Connection lines */}
      {members.map((member, i) => {
        const angle = (i * 360) / totalSlots - 90
        const radian = (angle * Math.PI) / 180
        const x1 = Math.cos(radian) * 12 + 40
        const y1 = Math.sin(radian) * 12 + 40
        const x2 = Math.cos(radian) * 23 + 40
        const y2 = Math.sin(radian) * 23 + 40
        
        return (
          <line
            key={`line-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="rgba(251, 146, 60, 0.4)"
            strokeWidth="1.5"
            className="absolute top-0 left-0"
          />
        )
      })}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {members.map((member, i) => {
          const angle = (i * 360) / totalSlots - 90
          const radian = (angle * Math.PI) / 180
          const x1 = Math.cos(radian) * 12 + 40
          const y1 = Math.sin(radian) * 12 + 40
          const x2 = Math.cos(radian) * 23 + 40
          const y2 = Math.sin(radian) * 23 + 40
          
          return (
            <line
              key={`line-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(251, 146, 60, 0.4)"
              strokeWidth="1.5"
            />
          )
        })}
      </svg>
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

export default function SocialCirclePage() {
  const [bondedContacts, setBondedContacts] = useState<BondedContact[]>([])
  const [trustStats, setTrustStats] = useState({ allocatedOut: 0, cap: 9 })
  const [recentSignals, setRecentSignals] = useState<SignalEvent[]>([])
  const [allEvents, setAllEvents] = useState<SignalEvent[]>([])
  const [sessionId, setSessionId] = useState("")
  const [showGroupInvite, setShowGroupInvite] = useState(false)
  
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

  // Mock social circle data
  const mockTrustBalance = 150 // TRST tokens available
  const mockStakedTrust = 75 // TRST currently staked
  
  const handleShareCircle = () => {
    toast.success("🔗 Circle link copied!", {
      description: "Share to invite friends to your trust network"
    })
  }

  const handleInviteToGroup = () => {
    toast.info("👥 Group Circle invite sent!", {
      description: "Friends can now co-build circles together"
    })
    setShowGroupInvite(false)
  }

  const handleStakeTrust = () => {
    toast.success("💰 25 TRST staked!", {
      description: "Higher stakes unlock better network effects"
    })
  }

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-6">
      {/* Social Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-neon-coral" />
            My Trust Circle
          </h1>
          <p className="text-sm text-white/60">
            {bondedContacts.length}/9 filled · Build your inner network
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={handleShareCircle}
            className="bg-neon-coral/20 hover:bg-neon-coral/30 text-neon-coral border border-neon-coral/30"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Social Circle Visualization */}
      <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-orange-400/30">
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <SocialCircle members={bondedContacts.slice(0, 9)} maxSlots={9} />
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 mb-2">
                <div className="text-sm">
                  <span className="font-semibold text-white">{bondedContacts.length}</span>
                  <span className="text-white/60 ml-1">members</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-white/30" />
                <div className="text-sm">
                  <span className="font-semibold text-orange-300">{9 - bondedContacts.length}</span>
                  <span className="text-white/60 ml-1">slots left</span>
                </div>
              </div>
              
              {bondedContacts.length < 9 && (
                <p className="text-xs text-white/60">
                  Fill 2 more slots for network boost!
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Features */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card/50 border border-orange-400/20">
          <CardContent className="p-4 text-center">
            <Group className="w-6 h-6 text-neon-orange mx-auto mb-2" />
            <h3 className="font-semibold text-sm text-white mb-1">Group Circle</h3>
            <p className="text-xs text-white/60 mb-3">Invite friends to co-build</p>
            <Button 
              size="sm" 
              onClick={() => setShowGroupInvite(true)}
              className="w-full bg-neon-orange/20 hover:bg-neon-orange/30 text-neon-orange border border-neon-orange/30 text-xs h-8"
            >
              <Send className="w-3 h-3 mr-1" />
              Send Invite
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 border border-red-400/20">
          <CardContent className="p-4 text-center">
            <Coins className="w-6 h-6 text-neon-coral mx-auto mb-2" />
            <h3 className="font-semibold text-sm text-white mb-1">Stake TRST</h3>
            <p className="text-xs text-white/60 mb-3">{mockStakedTrust}/{mockTrustBalance} Balance</p>
            <Button 
              size="sm" 
              onClick={handleStakeTrust}
              className="w-full bg-neon-coral/20 hover:bg-neon-coral/30 text-neon-coral border border-neon-coral/30 text-xs h-8"
            >
              <Star className="w-3 h-3 mr-1" />
              Stake 25
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Circle Members Management */}
      {bondedContacts.length > 0 && (
        <Card className="bg-card/50 border border-orange-400/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-neon-coral" />
                Circle Members
              </h3>
              <Badge className="bg-neon-orange/20 text-neon-orange border border-neon-orange/30">
                {bondedContacts.length}/9
              </Badge>
            </div>
            
            <div className="space-y-3">
              {bondedContacts.slice(0, 3).map((contact, i) => {
                const hasTrust = contact.trustLevel && contact.trustLevel > 0
                return (
                  <div key={contact.peerId} className="flex items-center justify-between p-3 bg-orange-500/5 rounded border border-orange-400/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-orange-300">
                          {(contact.handle || contact.peerId).slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-sm text-white">
                          {contact.handle || `User ${contact.peerId.slice(-6)}`}
                        </div>
                        {hasTrust ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-orange-400" />
                            <span className="text-xs text-orange-300">Trust Level {contact.trustLevel}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-white/60">Connected</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {!hasTrust && (
                        <div className="flex gap-1">
                          {[1, 2, 3].map((weight) => (
                            <Button
                              key={weight}
                              size="sm"
                              variant="outline"
                              onClick={() => handleAllocateTrust(contact.peerId, weight)}
                              disabled={trustStats.allocatedOut + weight > 9}
                              className="text-xs px-2 py-1 h-6 border-orange-400/30 text-orange-300 hover:bg-orange-400/10"
                            >
                              {weight}
                            </Button>
                          ))}
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-white/40 hover:text-red-400"
                        onClick={() => toast.info(`Removed ${contact.handle || 'member'} from circle`)}
                      >
                        <UserMinus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
              
              {bondedContacts.length > 3 && (
                <div className="text-center pt-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-orange-300 hover:text-orange-400 text-xs"
                  >
                    View all {bondedContacts.length} members →
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Tracker */}
      <Card className="bg-gradient-to-r from-orange-500/5 to-red-500/5 border border-orange-400/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-neon-peach" />
              Progress
            </h3>
            <span className="text-xs text-white/60">Level up your network</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/80">Fill 2 more for boost</span>
              <div className="flex items-center gap-1">
                <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-400 to-red-400 transition-all duration-300"
                    style={{ width: `${(bondedContacts.length / 9) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-orange-300 ml-1">{Math.round((bondedContacts.length / 9) * 100)}%</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Crown className="w-3 h-3 text-orange-400" />
              <span>Next: Unlock group circles & premium features</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
