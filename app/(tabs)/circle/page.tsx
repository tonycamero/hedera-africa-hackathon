"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Users, UserPlus, Settings, Circle, User, MessageCircle, X, Plus } from "lucide-react"
import { type BondedContact, signalsStore } from "@/lib/stores/signalsStore"
import { getSessionId } from "@/lib/session"
import { getValidMagicToken } from "@/lib/auth/getValidMagicToken"
import { StoicGuideModal } from "@/components/StoicGuideModal"

// Circle of Trust LED Visualization Component - Enhanced for Mobile
function TrustCircleVisualization({ allocatedOut, maxSlots, bondedContacts, onPress }: { 
  allocatedOut: number; 
  maxSlots: number; 
  bondedContacts: number;
  onPress?: () => void;
}) {
  const totalSlots = maxSlots
  const dots = Array.from({ length: totalSlots }, (_, i) => {
    // Arrange dots in a circle - using enhanced mobile-friendly sizing
    const angle = (i * 360) / totalSlots - 90 // Start from top
    const radian = (angle * Math.PI) / 180
    const radius = 35 // Increased radius for mobile visibility
    const x = Math.cos(radian) * radius + 48 // 48 is center (96/2) - scaled up
    const y = Math.sin(radian) * radius + 48

    // Determine LED state: CYAN (trust allocated), gray (available slot)
    let ledStyle = ""
    let innerStyle = ""
    let pulseEffect = ""
    
    if (i < allocatedOut) {
      // GREEN LEDs for trust allocations - enhanced with vibrant glow
      ledStyle = "bg-gradient-to-br from-emerald-400 to-green-600 shadow-[0_0_12px_rgba(34,197,94,0.6),0_0_24px_rgba(34,197,94,0.3)] border-2 border-emerald-300"
      innerStyle = "bg-gradient-to-br from-emerald-300 to-green-500"
      pulseEffect = ""
    } else {
      // Gray LEDs for available trust slots - slightly more visible
      ledStyle = "bg-gradient-to-br from-gray-300 to-gray-500 shadow-md shadow-gray-400/30 border-2 border-gray-200 opacity-50"
      innerStyle = "bg-gradient-to-br from-gray-200 to-gray-400"
    }

    return (
      <div
        key={i}
        className={`absolute w-5 h-5 rounded-full transform -translate-x-2.5 -translate-y-2.5 ${ledStyle} ${pulseEffect}`}
        style={{ left: x, top: y }}
      >
        {/* LED inner glow effect */}
        <div className={`absolute inset-1 rounded-full ${innerStyle}`} />
        {/* LED highlight spot */}
        <div className="absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-white opacity-70" />
      </div>
    )
  })

  // Make the whole circle tappable if onPress provided
  const CircleContent = (
    <div className="relative w-24 h-24 flex-shrink-0">
      {dots}
      {/* Center fire emoji - positioned at exact center (48px, 48px) */}
      <div 
        className="absolute flex items-center justify-center w-8 h-8"
        style={{ left: 48, top: 48, transform: 'translate(-50%, -50%)' }}
      >
        <span className="text-2xl animate-pulse leading-none">🔥</span>
      </div>
    </div>
  )

  if (onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        className="active:scale-95 transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 focus:ring-offset-2 focus:ring-offset-panel rounded-full"
        aria-label="Manage circle members"
      >
        {CircleContent}
      </button>
    )
  }

  return CircleContent
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

  // Load real data directly from signalsStore
  useEffect(() => {
    const loadCircleData = async () => {
      try {
        setIsLoading(true)
        const currentSessionId = getSessionId()
        
        // If no session (not authenticated), don't try to load data
        if (!currentSessionId) {
          console.log('🔥 [CirclePage] No session ID - user not authenticated')
          setSessionId('') // Empty session indicates unauthenticated state
          setIsLoading(false)
          return
        }
        
        setSessionId(currentSessionId)
        
        console.log('🔥 [CirclePage] Loading circle data from signalsStore for:', currentSessionId)
        
        // Load bonded contacts directly from signalsStore (same as contacts page)
        const contacts = signalsStore.getBondedContacts(currentSessionId)
        setBondedContacts(contacts)
        console.log(`[CirclePage] Loaded ${contacts.length} bonded contacts from signalsStore`)
        
        // Build trust levels map from TRUST_ALLOCATE events
        const trustLevelsMap = new Map<string, { allocatedTo: number, receivedFrom: number }>()
        const trustEvents = signalsStore.getAll().filter(e => e.type === 'TRUST_ALLOCATE')
        
        trustEvents.forEach(event => {
          const targetId = event.target
          if (!targetId) return
          
          // Track trust allocated TO others (outgoing)
          if (event.actor === currentSessionId) {
            const existing = trustLevelsMap.get(targetId) || { allocatedTo: 0, receivedFrom: 0 }
            existing.allocatedTo += 1
            trustLevelsMap.set(targetId, existing)
          }
          
          // Track trust received FROM others (incoming)
          if (event.target === currentSessionId) {
            const actorId = event.actor
            const existing = trustLevelsMap.get(actorId) || { allocatedTo: 0, receivedFrom: 0 }
            existing.receivedFrom += 1
            trustLevelsMap.set(actorId, existing)
          }
        })
        
        setTrustLevels(trustLevelsMap)
        
        // Calculate circle members (those with allocated trust)
        const circleMembers = contacts.filter(contact => {
          const trustData = trustLevelsMap.get(contact.peerId || '')
          return trustData && trustData.allocatedTo > 0
        })
        
        // Update trust stats
        const allocatedOut = circleMembers.length
        const maxSlots = 9
        setTrustStats({ 
          allocatedOut,
          maxSlots,
          bondedContacts: contacts.length
        })
        
        console.log(`[CirclePage] Loaded ${contacts.length} bonded contacts with ${allocatedOut}/${maxSlots} trust allocated`)
      } catch (error) {
        console.error('[CirclePage] Failed to load circle data:', error)
        toast.error('Failed to load circle data')
      } finally {
        setIsLoading(false)
      }
    }

    loadCircleData()
    
    // Subscribe to signalsStore changes for real-time updates
    const unsubscribe = signalsStore.subscribe(() => {
      loadCircleData()
    })
    
    return () => {
      unsubscribe()
    }
  }, [])
  
  // Circle members - ONLY show contacts to whom trust has been allocated
  const circleMembers = bondedContacts
    .filter((contact) => {
      const trustData = trustLevels.get(contact.peerId || '') || { allocatedTo: 0, receivedFrom: 0 }
      const hasAllocated = trustData.allocatedTo > 0
      console.log(`[CirclePage] Contact ${contact.peerId}: allocatedTo=${trustData.allocatedTo}, included=${hasAllocated}`)
      return hasAllocated // Only include if trust is allocated TO this contact
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

  // Get contacts that are bonded but not yet in the circle (no trust allocated)
  const availableContacts = bondedContacts.filter(contact => {
    const trustData = trustLevels.get(contact.peerId || '') || { allocatedTo: 0, receivedFrom: 0 }
    return trustData.allocatedTo === 0 // Not in circle yet
  })

  const handleAddMember = () => {
    if (availableContacts.length === 0) {
      toast.error('No available contacts', {
        description: 'Connect with more people first'
      })
      return
    }
    setShowContactSelection(true)
  }

  const handleSelectContact = async (contactId: string, contactName: string) => {
    try {
      setShowContactSelection(false)
      toast.loading(`Adding ${contactName} to circle...`, { id: 'trust-allocation' })
      
      // Optimistic update: Add trust allocation event to local store immediately
      const optimisticEvent = {
        id: `trust_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type: 'TRUST_ALLOCATE' as const,
        actor: sessionId,
        target: contactId,
        ts: Date.now(),
        topicId: '0.0.6896005', // Trust topic ID
        metadata: { weight: 1 },
        source: 'hcs-cached' as const
      }
      signalsStore.add(optimisticEvent)
      
      // Update local state immediately for instant UI feedback
      const updatedTrustLevels = new Map(trustLevels)
      updatedTrustLevels.set(contactId, { allocatedTo: 1, receivedFrom: trustLevels.get(contactId)?.receivedFrom || 0 })
      setTrustLevels(updatedTrustLevels)
      setTrustStats(prev => ({ ...prev, allocatedOut: prev.allocatedOut + 1 }))
      
      // Submit trust allocation to Hedera ledger in background
      const response = await fetch('/api/trust/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          targetId: contactId,
          weight: 1 // Equal trust for all circle members
        })
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to allocate trust')
      }
      
      toast.success(`${contactName} added to circle!`, {
        id: 'trust-allocation',
        description: 'Trust allocated on Hedera ledger'
      })
      
      // signalsStore will automatically update when HCS events arrive
      // No need for background sync - the useEffect will retrigger via signalsStore.subscribe
    } catch (error) {
      console.error('[CirclePage] Failed to add member:', error)
      
      // Rollback optimistic update on error
      const updatedTrustLevels = new Map(trustLevels)
      updatedTrustLevels.set(contactId, { allocatedTo: 0, receivedFrom: trustLevels.get(contactId)?.receivedFrom || 0 })
      setTrustLevels(updatedTrustLevels)
      setTrustStats(prev => ({ ...prev, allocatedOut: Math.max(0, prev.allocatedOut - 1) }))
      
      toast.error('Failed to add member to circle', {
        id: 'trust-allocation',
        description: error instanceof Error ? error.message : 'Please try again'
      })
    }
  }

  const availableSlots = trustStats.maxSlots - trustStats.allocatedOut

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a1f] via-[#2a1030] to-[#1a0a1f]"><div className="max-w-md mx-auto px-4 py-4 space-y-6">
      {/* Streamlined Header */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
          <Circle className="w-5 h-5 text-[#FF6B35]" />
          Circle of Trust
        </h1>
        <p className="text-sm text-white/70 mt-1">Your Inner Circle Dashboard</p>
      </div>
      
      {/* Inner Circle Campfire - Visual Centerpiece */}
      <div className="sheen-sweep overflow-hidden bg-gradient-to-br from-panel/90 to-panel/80 border-2 border-[#FF6B35]/20 shadow-[0_0_30px_rgba(255,107,53,0.15),0_0_60px_rgba(255,107,53,0.05)] rounded-lg relative before:absolute before:inset-0 before:rounded-lg before:p-[1px] before:bg-gradient-to-r before:from-[#FF6B35]/20 before:via-transparent before:to-[#FF6B35]/20 before:-z-10 before:animate-pulse">
        <div className="p-6 relative z-10">
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold text-white mb-1">Inner Circle Members</h2>
            <div className="text-xs">
              {isLoading ? (
                <span className="text-white/60 animate-pulse">Loading circle data...</span>
              ) : (
                <>
                  <span className="text-[#FF6B35] font-medium">{trustStats.allocatedOut}/{trustStats.maxSlots} Slots</span>
                  <span className="text-white/60 mx-2">•</span>
                  <span className="text-white/60">Choose Wisely</span>
                  <span className="text-white/60 mx-2">•</span>
                  <span className="text-amber-400">(Scarce Trust)</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-6">
            {/* Campfire LED Visualization - Now tappable */}
            <TrustCircleVisualization 
              allocatedOut={trustStats.allocatedOut}
              maxSlots={trustStats.maxSlots}
              bondedContacts={trustStats.bondedContacts}
              onPress={handleAddMember}
            />
            
            {/* Circle Stats - Centered below */}
            <div className="text-center">
              <div className="text-xs">
                <div className="text-white/50">Prioritize Strength</div>
              </div>
            </div>
            
            {/* Mobile-optimized CTA Button */}
            <Button
              className="w-full h-12 text-base font-medium bg-gradient-to-r from-[#FF6B35] to-yellow-400 text-black hover:from-[#FF6B35]/90 hover:to-yellow-400/90 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,107,53,0.4),0_0_40px_rgba(255,107,53,0.2)] hover:shadow-[0_0_25px_rgba(255,107,53,0.5),0_0_50px_rgba(255,107,53,0.3)]"
              onClick={handleAddMember}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Allocate Trust
            </Button>
          </div>
          
          {/* Tooltip-style hint positioned in bottom right of card, inside boundaries */}
          <div className="flex justify-end mt-4">
            <StoicGuideModal availableSlots={availableSlots} onAddMember={handleAddMember}>
              <div className="text-xs text-[#FF6B35]/80 hover:text-[#FF6B35] transition-all duration-300 cursor-pointer font-medium flex items-center gap-1 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.9)] hover:scale-105">
                <span className="text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]">→</span>
                <span className="drop-shadow-[0_0_6px_rgba(255,255,255,0.7)] hover:drop-shadow-[0_0_12px_rgba(255,255,255,1.0)]">Who should I add?</span>
              </div>
            </StoicGuideModal>
          </div>
        </div>
      </div>
      
      {/* Circle Members List */}
      <div className="sheen-sweep overflow-hidden bg-gradient-to-br from-panel/90 to-panel/80 border-2 border-[#FF6B35]/20 shadow-[0_0_30px_rgba(255,107,53,0.15),0_0_60px_rgba(255,107,53,0.05)] rounded-lg relative before:absolute before:inset-0 before:rounded-lg before:p-[1px] before:bg-gradient-to-r before:from-[#FF6B35]/20 before:via-transparent before:to-[#FF6B35]/20 before:-z-10 before:animate-pulse">
        <div className="p-5 relative z-10">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#FF6B35]" />
              <span>Current Circle Members</span>
            </div>
            <span className="text-xs text-white/60">{circleMembers.length} members</span>
          </h3>
          
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-white/60">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-3"></div>
                <p className="text-sm">Loading circle members...</p>
              </div>
            ) : circleMembers.length === 0 ? (
              <div className="text-center py-8 text-white/60">
                <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-white/40" />
                </div>
                <p className="text-sm mb-1">No members yet</p>
                <p className="text-xs text-white/40">Allocate trust to contacts to add them to your circle</p>
              </div>
            ) : (
              <>
              {/* Existing Circle Members */}
              {circleMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-panel/40 to-panel/30 border border-green-400/20 rounded-lg hover:bg-gradient-to-r hover:from-panel/50 hover:to-panel/40 hover:border-green-400/30 hover:shadow-[0_0_15px_rgba(255,107,53,0.15)] transition-all duration-300 relative before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-green-400/10 before:via-transparent before:to-green-400/10 before:-z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-yellow-500/20 border border-[#FF6B35]/30 flex items-center justify-center">
                    <User className="w-4 h-4 text-[#FF6B35]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{member.name}</div>
                    <div className="text-xs text-white/60">
                      {member.role} • <span className="text-[#FF6B35]">{member.trustAllocated} trust</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button 
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-white/70 hover:text-[#FF6B35] hover:bg-[#FF6B35]/10"
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
              ))}
              
              {/* Add 3 Challenge - Show only 3 empty slots BELOW members */}
              {availableSlots > 0 && (
              <>
                {/* Challenge Header */}
                <div className="text-center py-2 border-t border-white/10 mt-2">
                  <div className="text-xs text-[#FF6B35] font-medium">Sprint Challenge</div>
                  <div className="text-xs text-white/60 mt-1">Add 3 trusted members to strengthen your circle</div>
                </div>
                
                {/* Show up to 3 empty slots */}
                {Array.from({ length: Math.min(availableSlots, 3) }, (_, i) => (
                  <div key={`empty-${i}`} className="flex items-center justify-between p-3 bg-gradient-to-r from-panel/30 to-panel/20 rounded-lg border-2 border-dashed border-[#FF6B35]/30 hover:border-[#FF6B35]/50 hover:bg-gradient-to-r hover:from-panel/40 hover:to-panel/30 hover:shadow-[0_0_12px_rgba(255,107,53,0.1)] transition-all duration-300 relative before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-[#FF6B35]/5 before:via-transparent before:to-[#FF6B35]/5 before:-z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FF6B35]/10 border border-[#FF6B35]/30 flex items-center justify-center">
                        <Plus className="w-4 h-4 text-[#FF6B35]/60" />
                      </div>
                      <div>
                        <div className="text-sm text-white/60">Slot {i + 1}</div>
                        <div className="text-xs text-[#FF6B35]/60">Add trusted contact</div>
                      </div>
                    </div>
                    
                    <Button 
                      size="sm"
                      className="h-7 px-3 text-xs bg-[#FF6B35]/20 hover:bg-[#FF6B35]/30 text-[#FF6B35] border border-[#FF6B35]/30"
                      onClick={handleAddMember}
                    >
                      Add
                    </Button>
                  </div>
                ))}
                
                {/* Progress indicator if more than 3 slots available */}
                {availableSlots > 3 && (
                  <div className="text-center py-2">
                    <div className="text-xs text-white/40">
                      +{availableSlots - 3} more slots available after completing this sprint
                    </div>
                  </div>
                )}
              </>
            )}
            </>
            )}
          </div>
        </div>
      </div>
      {/* Contact Selection Modal */}
      {showContactSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-md animate-in fade-in-0 duration-300"
            onClick={() => setShowContactSelection(false)}
          />
          
          {/* Modal */}
          <div className="
            relative animate-in zoom-in-90 fade-in-0 duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
            max-w-md w-full max-h-[85vh] flex flex-col
            bg-gradient-to-br from-slate-900/85 to-slate-800/80
            backdrop-blur-xl
            border-2 border-yellow-500/40
            shadow-[0_0_40px_rgba(234,179,8,0.3),0_0_80px_rgba(234,179,8,0.1)]
            rounded-[10px]
            before:absolute before:inset-0 before:rounded-[10px] before:p-[2px]
            before:bg-gradient-to-r before:from-yellow-500/50 before:via-transparent before:to-yellow-500/50
            before:-z-10 before:animate-pulse
          ">
            <div className="
              flex-1 overflow-y-auto overscroll-contain touch-pan-y p-6
              [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
              [-webkit-overflow-scrolling:touch]
            ">
              {/* Close Button */}
              <button
                onClick={() => setShowContactSelection(false)}
                className="absolute top-4 right-4 w-6 h-6 rounded-sm opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="sr-only">Close</span>
              </button>
              
              {/* Modal Header */}
              <div className="mb-6 pb-4 border-b border-yellow-500/20">
                <h2 className="text-white text-2xl font-bold bg-gradient-to-r from-white via-yellow-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
                  Add to Circle
                </h2>
              </div>
              
              <p className="text-sm text-white/80 mb-6">
                Choose from your bonded contacts to add to your circle of trust
              </p>
            
              <div className="space-y-3">
                {availableContacts.length === 0 ? (
                  <div className="text-center py-8 text-white/60">
                    <Users className="w-12 h-12 mx-auto mb-3 text-yellow-500/30" />
                    <p className="text-sm mb-1 text-white">No available contacts</p>
                    <p className="text-xs text-white/40">Connect with more people first</p>
                  </div>
                ) : (
                  availableContacts.map((contact) => {
                    const displayName = contact.handle || `User ${contact.peerId?.slice(-6) || 'Unknown'}`
                    return (
                      <div 
                        key={contact.peerId}
                        className="flex items-center justify-between p-4 bg-slate-800/30 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-all border border-yellow-500/20 hover:border-yellow-500/40 hover:shadow-[0_0_20px_rgba(234,179,8,0.1)]"
                        onClick={() => handleSelectContact(contact.peerId || '', displayName)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 flex items-center justify-center">
                            <User className="w-5 h-5 text-yellow-500" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{displayName}</div>
                            <div className="text-xs text-yellow-500/70">Bonded Contact</div>
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          className="h-8 px-4 text-xs bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30 font-medium"
                        >
                          Add
                        </Button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
    </div>
  )
}
