"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Users, UserPlus, Settings, Circle, User, MessageCircle, X, Plus } from "lucide-react"
import { signalsStore, type BondedContact } from "@/lib/stores/signalsStore"
import { getBondedContactsFromHCS, getTrustStatsFromHCS, getTrustLevelsPerContact } from "@/lib/services/HCSDataUtils"
import { getSessionId } from "@/lib/session"
import { StoicGuideModal } from "@/components/StoicGuideModal"

// Circle of Trust LED Visualization Component
function TrustCircleVisualization({ allocatedOut, maxSlots, bondedContacts }: { 
  allocatedOut: number; 
  maxSlots: number; 
  bondedContacts: number;
}) {
  const totalSlots = maxSlots
  const dots = Array.from({ length: totalSlots }, (_, i) => {
    // Arrange dots in a circle - using exact original positioning
    const angle = (i * 360) / totalSlots - 90 // Start from top
    const radian = (angle * Math.PI) / 180
    const radius = 20 // Distance from center - original working value
    const x = Math.cos(radian) * radius + 32 // 32 is center (64/2) - original working value
    const y = Math.sin(radian) * radius + 32

    // Determine LED state: GREEN (trust allocated), gray (available slot)
    let ledStyle = ""
    let innerStyle = ""
    
    if (i < allocatedOut) {
      // CYAN LEDs for trust allocations - matching theme #00F6FF
      ledStyle = "bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-lg shadow-cyan-500/50 border-2 border-cyan-300"
      innerStyle = "bg-gradient-to-br from-cyan-300 to-cyan-500"
    } else {
      // Gray LEDs for available trust slots
      ledStyle = "bg-gradient-to-br from-gray-300 to-gray-500 shadow-md shadow-gray-400/20 border-2 border-gray-200 opacity-40"
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
      {/* Center fire emoji */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center">
        <span className="text-base">🔥</span>
      </div>
    </div>
  )
}

export default function CirclePage() {
  const router = useRouter()
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [bondedContacts, setBondedContacts] = useState<BondedContact[]>([])
  const [trustStats, setTrustStats] = useState({ allocatedOut: 0, maxSlots: 9, bondedContacts: 0 })
  const [trustLevels, setTrustLevels] = useState<Map<string, { allocatedTo: number, receivedFrom: number }>>(new Map())
  const [sessionId, setSessionId] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Load real data from HCS
  useEffect(() => {
    const loadCircleData = async () => {
      try {
        setIsLoading(true)
        const currentSessionId = getSessionId()
        const effectiveSessionId = currentSessionId || 'tm-alex-chen'
        setSessionId(effectiveSessionId)
        
        // Load all events from signals store
        const allEvents = signalsStore.getAll()
        console.log('🔥 [CirclePage] Effective session ID:', effectiveSessionId)
        console.log('🔥 [CirclePage] Total events from signals store:', allEvents.length)
        
        // Get bonded contacts
        const contacts = getBondedContactsFromHCS(allEvents, effectiveSessionId)
        console.log('🔥 [CirclePage] Bonded contacts:', contacts)
        setBondedContacts(contacts)
        
        // Get trust statistics
        const hcsTrustStats = getTrustStatsFromHCS(allEvents, effectiveSessionId)
        console.log('🔥 [CirclePage] Trust stats:', hcsTrustStats)
        setTrustStats({
          allocatedOut: hcsTrustStats.allocatedOut,
          maxSlots: hcsTrustStats.cap, // This is always 9 from HCS
          bondedContacts: contacts.length
        })
        
        // Get trust levels per contact
        const trustData = getTrustLevelsPerContact(allEvents, effectiveSessionId)
        console.log('🔥 [CirclePage] Trust levels:', trustData)
        setTrustLevels(trustData)
        
        console.log(`[CirclePage] Loaded ${contacts.length} bonded contacts with ${hcsTrustStats.allocatedOut}/${hcsTrustStats.cap} trust allocated`)
      } catch (error) {
        console.error('[CirclePage] Failed to load circle data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCircleData()
    
    // Subscribe to updates from signals store
    const unsubscribe = signalsStore.subscribe(loadCircleData)
    return unsubscribe
  }, [])
  
  // Circle members are only those bonded contacts who we've allocated trust to
  const circleMembers = bondedContacts
    .filter(contact => {
      const trustData = trustLevels.get(contact.peerId || '') || { allocatedTo: 0, receivedFrom: 0 }
      return trustData.allocatedTo > 0 // Only include if we allocated trust to them
    })
    .map((contact, index) => {
      const roles = ['Mentor', 'Collaborator', 'Accountability Ally', 'Collaborator', 'Mentor', 'Collaborator']
      const types = ['mentor', 'collaborator', 'ally', 'collaborator', 'mentor', 'collaborator']
      const trustData = trustLevels.get(contact.peerId || '') || { allocatedTo: 0, receivedFrom: 0 }
      
      return {
        id: contact.peerId || `contact-${index}`,
        name: contact.handle || `User ${contact.peerId?.slice(-6) || 'Unknown'}`,
        role: roles[index % roles.length],
        type: types[index % types.length],
        engaged: true, // All circle members are engaged by definition (they have allocated trust)
        trustAllocated: trustData.allocatedTo // Include trust amount for display
      }
    })

  const handleMemberClick = (memberId: string) => {
    console.log('🖱️ Member clicked:', memberId)
    setSelectedMember(memberId)
    toast.info(`Opening profile for ${memberId}`)
  }

  const handleRevoke = (memberId: string, name: string) => {
    toast.error(`Revoked ${name} from circle`, {
      description: 'Slot now available for new member'
    })
  }

  const handleAddMember = (type: string) => {
    toast.success(`Adding ${type}...`, {
      description: 'Choose wisely - slots are scarce'
    })
  }

  const availableSlots = trustStats.maxSlots - trustStats.allocatedOut

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-6">
      {/* Stoic Builder Header */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
          <Circle className="w-5 h-5 text-[#00F6FF]" />
          Circle of Trust
        </h1>
        <p className="text-sm text-white/70 mt-1">Your Inner Circle Dashboard</p>
        <div className="mt-2 text-xs">
          {isLoading ? (
            <span className="text-white/60 animate-pulse">Loading circle data...</span>
          ) : (
            <>
              <span className="text-[#00F6FF] font-medium">{trustStats.allocatedOut}/{trustStats.maxSlots} Slots</span>
              <span className="text-white/60 ml-2">Choose Wisely</span>
              <span className="text-amber-400 ml-2">(Scarce Trust)</span>
            </>
          )}
        </div>
      </div>
      
      {/* Inner Circle Campfire - Visual Centerpiece */}
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold text-white mb-1">Inner Circle Members</h2>
            <p className="text-xs text-white/60">Your network of trust - each connection represents shared commitment</p>
          </div>
          
          <div className="flex items-center justify-center gap-6">
            {/* Campfire LED Visualization */}
            <div className="flex-shrink-0">
              <TrustCircleVisualization 
                allocatedOut={trustStats.allocatedOut}
                maxSlots={trustStats.maxSlots}
                bondedContacts={trustStats.bondedContacts}
              />
            </div>
            
            {/* Circle Stats */}
            <div className="text-center">
              <div className="flex items-baseline gap-1 justify-center mb-1">
                <span className="text-2xl font-bold text-white">{trustStats.allocatedOut}</span>
                <span className="text-white/60 text-sm">of 9 members</span>
              </div>
              <p className="text-xs text-white/60 mb-2">in your circle</p>
              
              <div className="text-xs">
                <span className="text-[#00F6FF] font-medium">{availableSlots} open slots</span>
                <br />
                <span className="text-white/50">Prioritize Strength</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Circle Members List */}
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00F6FF]" />
              <span>Current Circle Members</span>
              <StoicGuideModal availableSlots={availableSlots} onAddMember={handleAddMember}>
                <span className="text-xs text-[#00F6FF] hover:text-cyan-400 transition-colors cursor-pointer font-normal">who should i add?</span>
              </StoicGuideModal>
            </div>
            <span className="text-xs text-white/60">{circleMembers.length} members</span>
          </h3>
          
          <div className="space-y-2">
            {circleMembers.length === 0 ? (
              <div className="text-center py-8 text-white/60">
                <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-white/40" />
                </div>
                <p className="text-sm mb-1">No members yet</p>
                <p className="text-xs text-white/40">Allocate trust to contacts to add them to your circle</p>
              </div>
            ) : (
              circleMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00F6FF]/20 to-cyan-500/20 border border-[#00F6FF]/30 flex items-center justify-center">
                    <User className="w-4 h-4 text-[#00F6FF]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{member.name}</div>
                    <div className="text-xs text-white/60">
                      {member.role} • <span className="text-[#00F6FF]">{member.trustAllocated} trust</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button 
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-white/70 hover:text-[#00F6FF] hover:bg-[#00F6FF]/10"
                    onClick={() => handleMemberClick(member.id)}
                  >
                    <MessageCircle className="w-3 h-3" />
                  </Button>
                  <Button 
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => handleRevoke(member.id, member.name)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              ))
            )}
            
            {/* Empty Slots */}
            {Array.from({ length: availableSlots }, (_, i) => (
              <div key={`empty-${i}`} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border-2 border-dashed border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white/40" />
                  </div>
                  <div>
                    <div className="text-sm text-white/50">Empty Slot</div>
                    <div className="text-xs text-white/40">Add a trusted member</div>
                  </div>
                </div>
                
                <Button 
                  size="sm"
                  className="h-7 px-3 text-xs bg-[#00F6FF]/20 hover:bg-[#00F6FF]/30 text-[#00F6FF] border border-[#00F6FF]/30"
                  onClick={() => handleAddMember('member')}
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}