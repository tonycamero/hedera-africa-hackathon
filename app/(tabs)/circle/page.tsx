"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Users, UserPlus, Settings, Circle, User, MessageCircle, X, Plus, Heart, Flame } from "lucide-react"
import { signalsStore, type BondedContact } from "@/lib/stores/signalsStore"
import { getBondedContactsFromHCS, getTrustStatsFromHCS, getTrustLevelsPerContact } from "@/lib/services/HCSDataUtils"
import { getSessionId } from "@/lib/session"
import { StoicGuideModal } from "@/components/StoicGuideModal"
import { GenZButton, GenZCard, GenZHeading, GenZText, GenZModal, genZClassNames } from '@/components/ui/genz-design-system'

// Crew Fire LED Visualization Component - GenZ Style
function CrewFireVisualization({ allocatedOut, maxSlots, bondedContacts }: { 
  allocatedOut: number; 
  maxSlots: number; 
  bondedContacts: number;
}) {
  const totalSlots = maxSlots
  const dots = Array.from({ length: totalSlots }, (_, i) => {
    // Arrange dots in a circle - using exact original positioning
    const angle = (i * 360) / totalSlots - 90 // Start from top
    const radian = (angle * Math.PI) / 180
    const radius = 30 // Distance from center - 50% larger (was 20)
    const x = Math.cos(radian) * radius + 48 // 48 is center (96/2) - 50% larger
    const y = Math.sin(radian) * radius + 48

    // Determine LED state: active crew member (trust allocated), available spot
    let ledStyle = ""
    let innerStyle = ""
    
    if (i < allocatedOut) {
      // GenZ Primary (Boost) LEDs for active crew members
      ledStyle = "bg-gradient-to-br from-pri-500 to-pri-600 shadow-glow border-2 border-pri-glow animate-breathe-glow"
      innerStyle = "bg-gradient-to-br from-pri-glow to-pri-500"
    } else {
      // Dimmed LEDs for available spots
      ledStyle = "bg-gradient-to-br from-genz-text-dim to-genz-border shadow-md shadow-genz-border/20 border-2 border-genz-border opacity-40"
      innerStyle = "bg-gradient-to-br from-genz-text-dim to-genz-border"
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
    <div className="relative w-24 h-24 flex-shrink-0">
      {dots}
      {/* Center crew fire emoji - GenZ style */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center animate-breathe-glow">
        <span className="text-xl">🔥</span>
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
  const [showContactSelection, setShowContactSelection] = useState(false)

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
  
  // Crew members are only those bonded contacts who we've allocated trust to
  const crewMembers = bondedContacts
    .filter(contact => {
      const trustData = trustLevels.get(contact.peerId || '') || { allocatedTo: 0, receivedFrom: 0 }
      return trustData.allocatedTo > 0 // Only include if we allocated trust to them
    })
    .map((contact, index) => {
      const roles = ['Day One', 'Ride-or-Die', 'Real One', 'Core Crew', 'Day One', 'Ride-or-Die']
      const types = ['dayOne', 'rideOrDie', 'realOne', 'coreCrew', 'dayOne', 'rideOrDie']
      const trustData = trustLevels.get(contact.peerId || '') || { allocatedTo: 0, receivedFrom: 0 }
      
      return {
        id: contact.peerId || `contact-${index}`,
        name: contact.handle || `User ${contact.peerId?.slice(-6) || 'Unknown'}`,
        role: roles[index % roles.length],
        type: types[index % types.length],
        engaged: true, // All crew members are engaged by definition (they have allocated trust)
        trustAllocated: trustData.allocatedTo // Include trust amount for display
      }
    })

  const handleMemberClick = (memberId: string) => {
    console.log('🗝️ Crew member clicked:', memberId)
    setSelectedMember(memberId)
    toast.info(`Opening profile for ${memberId}`)
  }

  const handleRevoke = (memberId: string, name: string) => {
    toast.error(`Removed ${name} from inner circle`, {
      description: 'Spot now available for a new ride-or-die'
    })
  }

  // Get contacts that are bonded but not yet in the circle (no trust allocated)
  const availableContacts = bondedContacts.filter(contact => {
    const trustData = trustLevels.get(contact.peerId || '') || { allocatedTo: 0, receivedFrom: 0 }
    return trustData.allocatedTo === 0 // Not in circle yet
  })

  const handleAddMember = () => {
    if (availableContacts.length === 0) {
      toast.error('No friends to add', {
        description: 'Connect with more people first to build my crew'
      })
      return
    }
    setShowContactSelection(true)
  }

  const handleSelectContact = (contactId: string, contactName: string) => {
    // This would trigger trust allocation in real implementation
    toast.success(`${contactName} is now in my inner circle! 🔥`, {
      description: 'They\'re officially a ride-or-die'
    })
    setShowContactSelection(false)
    // In real implementation, this would call trust allocation service
  }

  const availableSlots = trustStats.maxSlots - trustStats.allocatedOut

  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-md mx-auto px-4 py-4 space-y-6">
        {/* GenZ Header */}
        <div className="text-center mb-6">
          <GenZHeading level={1} className="flex items-center justify-center gap-2 mb-1">
            <Flame className="w-5 h-5 text-pri-500 animate-breathe-glow" />
            Select My Inner Circle
          </GenZHeading>
          <GenZText dim>My ride-or-dies • The real ones</GenZText>
        </div>
      
        {/* Crew Fire - Visual Centerpiece */}
        <GenZCard variant="glass" className="p-6">
          <div className="text-center mb-4">
            <GenZHeading level={3} className="mb-2">Only 9 Spots. Ever. 🔥</GenZHeading>
            {isLoading && (
              <GenZText dim className="animate-pulse">Loading my crew...</GenZText>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-6">
            {/* Crew Fire LED Visualization */}
            <div className="flex-shrink-0">
              <CrewFireVisualization 
                allocatedOut={trustStats.allocatedOut}
                maxSlots={trustStats.maxSlots}
                bondedContacts={trustStats.bondedContacts}
              />
            </div>
            
            {/* Crew Stats */}
            <div className="text-center">
              <div className="flex items-baseline gap-1 justify-center mb-2">
                <span className="text-2xl font-bold text-genz-text font-mono">{trustStats.allocatedOut}</span>
                <GenZText size="sm" dim>in the circle</GenZText>
              </div>
              
              <div className="text-xs space-y-1">
                <div className="text-pri-500 font-medium">{availableSlots} open spots</div>
                <GenZText size="sm" dim>Quality over quantity</GenZText>
                <StoicGuideModal availableSlots={availableSlots} onAddMember={handleAddMember}>
                  <div className="text-pri-500 hover:text-pri-glow transition-colors cursor-pointer font-medium mt-1 animate-breathe-glow">
                    who should I add?
                  </div>
                </StoicGuideModal>
              </div>
            </div>
          </div>
        </GenZCard>
      
        {/* Crew Members List */}
        <GenZCard variant="glass" className="p-4">
          {crewMembers.length === 0 ? (
            <div className="text-center py-6">
              <GenZHeading level={4}>Start Filling Your Inner Circle</GenZHeading>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <GenZHeading level={4}>My Ride-or-Dies</GenZHeading>
                <span className="text-xs text-genz-text-dim">{crewMembers.length}</span>
              </div>
              
              <div className="space-y-2">
                {crewMembers.map((member) => (
                  <GenZCard key={member.id} variant="glass" className={`p-3 ${genZClassNames.hoverScale} cursor-pointer`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pri-500/20 to-sec-500/20 border border-pri-500/30 flex items-center justify-center">
                      <User className="w-5 h-5 text-pri-500" />
                    </div>
                    <div>
                      <GenZText className="font-medium">{member.name}</GenZText>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-sec-500 font-medium">{member.role}</span>
                        <span className="text-genz-text-dim">•</span>
                        <span className="text-pri-500">{member.trustAllocated} trust</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <GenZButton 
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleMemberClick(member.id)}
                    >
                      <MessageCircle className="w-3 h-3" />
                    </GenZButton>
                    <GenZButton 
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-genz-danger hover:text-genz-danger"
                      onClick={() => handleRevoke(member.id, member.name)}
                    >
                      <X className="w-3 h-3" />
                    </GenZButton>
                  </div>
                </div>
                  </GenZCard>
                ))}
            
                
                {/* Crew Building Challenge - Show up to 3 empty spots */}
                {availableSlots > 0 && (
                  <>
                    {Array.from({ length: Math.min(availableSlots, 3) }, (_, i) => (
                      <GenZCard key={`empty-${i}`} variant="glass" className="p-3 border-2 border-dashed border-pri-500/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-pri-500/10 border border-pri-500/30 flex items-center justify-center">
                              <Plus className="w-5 h-5 text-pri-500/60 animate-breathe-glow" />
                            </div>
                            <GenZText>Open spot #{i + 1}</GenZText>
                          </div>
                          
                          <GenZButton 
                            size="sm"
                            variant="boost"
                            onClick={handleAddMember}
                          >
                            Add
                          </GenZButton>
                        </div>
                      </GenZCard>
                    ))}
                    
                    {/* Progress indicator if more than 3 spots available */}
                    {availableSlots > 3 && (
                      <div className="text-center py-2">
                        <GenZText size="sm" dim>
                          +{availableSlots - 3} more spots available after building core crew
                        </GenZText>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </GenZCard>

        {/* Contact Selection Modal */}
        <GenZModal 
          isOpen={showContactSelection} 
          onClose={() => setShowContactSelection(false)}
          title="Add to Inner Circle"
        >
          <div className="space-y-4">
            <GenZText dim>
              Choose from my friends to add to my inner circle
            </GenZText>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableContacts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4 animate-float">🤷</div>
                  <GenZText className="mb-2">No friends to add</GenZText>
                  <GenZText size="sm" dim>Connect with more people first</GenZText>
                </div>
              ) : (
                availableContacts.map((contact) => {
                  const displayName = contact.handle || `User ${contact.peerId?.slice(-6) || 'Unknown'}`
                  return (
                    <GenZCard 
                      key={contact.peerId}
                      variant="glass"
                      className={`p-3 cursor-pointer ${genZClassNames.hoverScale}`}
                      onClick={() => handleSelectContact(contact.peerId || '', displayName)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pri-500/20 to-sec-500/20 border border-pri-500/30 flex items-center justify-center">
                            <User className="w-5 h-5 text-pri-500" />
                          </div>
                          <div>
                            <GenZText className="font-medium">{displayName}</GenZText>
                            <GenZText size="sm" dim>Friend</GenZText>
                          </div>
                        </div>
                        <GenZButton 
                          size="sm"
                          variant="boost"
                          glow
                        >
                          Add
                        </GenZButton>
                      </div>
                    </GenZCard>
                  )
                })
              )}
            </div>
          </div>
        </GenZModal>

      </div>
    </div>
  )
}
