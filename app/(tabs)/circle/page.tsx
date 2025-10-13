"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Users, UserPlus, Settings, Circle, User, MessageCircle, X, Plus } from "lucide-react"
import { type BondedContact } from "@/lib/stores/signalsStore"
import { getSessionId } from "@/lib/session"
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
      // CYAN LEDs for trust allocations - enhanced with pulse
      ledStyle = "bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-lg shadow-cyan-500/60 border-2 border-cyan-300"
      innerStyle = "bg-gradient-to-br from-cyan-300 to-cyan-500"
      pulseEffect = "animate-pulse"
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
      {/* Center fire emoji - enhanced for mobile */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center">
        <span className="text-xl animate-pulse">🔥</span>
      </div>
    </div>
  )

  if (onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        className="active:scale-95 transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-[#00F6FF]/50 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-full"
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

  // Load real data from server-side API
  useEffect(() => {
    const loadCircleData = async () => {
      try {
        setIsLoading(true)
        const currentSessionId = getSessionId()
        const effectiveSessionId = currentSessionId || 'tm-alex-chen'
        setSessionId(effectiveSessionId)
        
        console.log('🔥 [CirclePage] Loading circle data from server API for:', effectiveSessionId)
        
        // Load circle data from server-side API
        const response = await fetch(`/api/circle?sessionId=${effectiveSessionId}`)
        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to load circle data')
        }
        
        console.log('🔥 [CirclePage] Received circle data from API:', data)
        setBondedContacts(data.bondedContacts)
        setTrustStats(data.trustStats)
        
        // Convert trust levels object back to Map
        const trustLevelsMap = new Map<string, { allocatedTo: number, receivedFrom: number }>()
        Object.entries(data.trustLevels).forEach(([key, value]) => {
          trustLevelsMap.set(key, value as { allocatedTo: number, receivedFrom: number })
        })
        setTrustLevels(trustLevelsMap)
        
        console.log(`[CirclePage] Loaded ${data.bondedContacts.length} bonded contacts with ${data.trustStats.allocatedOut}/${data.trustStats.maxSlots} trust allocated from server API`)
      } catch (error) {
        console.error('[CirclePage] Failed to load circle data:', error)
        toast.error('Failed to load circle data')
      } finally {
        setIsLoading(false)
      }
    }

    loadCircleData()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadCircleData, 30000)
    return () => clearInterval(interval)
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

  const handleSelectContact = (contactId: string, contactName: string) => {
    // This would trigger trust allocation in real implementation
    toast.success(`Added ${contactName} to circle!`, {
      description: 'Trust allocated successfully'
    })
    setShowContactSelection(false)
    // In real implementation, this would call trust allocation service
  }

  const availableSlots = trustStats.maxSlots - trustStats.allocatedOut

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-6">
      {/* Streamlined Header */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
          <Circle className="w-5 h-5 text-[#00F6FF]" />
          Circle of Trust
        </h1>
        <p className="text-sm text-white/70 mt-1">Your Inner Circle Dashboard</p>
      </div>
      
      {/* Inner Circle Campfire - Visual Centerpiece */}
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10">
        <CardContent className="p-6 relative">
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold text-white mb-1">Inner Circle Members</h2>
            <div className="text-xs">
              {isLoading ? (
                <span className="text-white/60 animate-pulse">Loading circle data...</span>
              ) : (
                <>
                  <span className="text-[#00F6FF] font-medium">{trustStats.allocatedOut}/{trustStats.maxSlots} Slots</span>
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
              <div className="flex items-baseline gap-1 justify-center mb-2">
                <span className="text-2xl font-bold text-white">{trustStats.allocatedOut}</span>
                <span className="text-white/60 text-sm">active</span>
              </div>
              
              <div className="text-xs space-y-1">
                <div className="text-[#00F6FF] font-medium">{availableSlots} open slots</div>
                <div className="text-white/50">Prioritize Strength</div>
              </div>
            </div>
            
            {/* Mobile-optimized CTA Button */}
            <Button
              className="w-full h-12 text-base font-medium bg-[#00F6FF] text-black hover:bg-[#00F6FF]/90 active:scale-95 transition-transform"
              onClick={handleAddMember}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Add trusted member
            </Button>
          </div>
          
          {/* Tooltip-style hint positioned in bottom right of card */}
          <StoicGuideModal availableSlots={availableSlots} onAddMember={handleAddMember}>
            <div className="absolute -bottom-1 right-3 text-xs text-[#00F6FF]/80 hover:text-[#00F6FF] transition-all duration-300 cursor-pointer font-medium flex items-center gap-1 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.9)] hover:scale-105">
              <span className="text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]">→</span>
              <span className="drop-shadow-[0_0_6px_rgba(255,255,255,0.7)] hover:drop-shadow-[0_0_12px_rgba(255,255,255,1.0)]">Who should I add?</span>
            </div>
          </StoicGuideModal>
        </CardContent>
      </Card>
      
      {/* Circle Members List */}
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00F6FF]" />
              <span>Current Circle Members</span>
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
            
            {/* Add 3 Challenge - Show only 3 empty slots */}
            {availableSlots > 0 && (
              <>
                {/* Challenge Header */}
                <div className="text-center py-2 border-t border-white/10 mt-2">
                  <div className="text-xs text-[#00F6FF] font-medium">Sprint Challenge</div>
                  <div className="text-xs text-white/60 mt-1">Add 3 trusted members to strengthen your circle</div>
                </div>
                
                {/* Show up to 3 empty slots */}
                {Array.from({ length: Math.min(availableSlots, 3) }, (_, i) => (
                  <div key={`empty-${i}`} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border-2 border-dashed border-[#00F6FF]/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#00F6FF]/10 border border-[#00F6FF]/30 flex items-center justify-center">
                        <Plus className="w-4 h-4 text-[#00F6FF]/60" />
                      </div>
                      <div>
                        <div className="text-sm text-white/60">Slot {i + 1}</div>
                        <div className="text-xs text-[#00F6FF]/60">Add trusted contact</div>
                      </div>
                    </div>
                    
                    <Button 
                      size="sm"
                      className="h-7 px-3 text-xs bg-[#00F6FF]/20 hover:bg-[#00F6FF]/30 text-[#00F6FF] border border-[#00F6FF]/30"
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
          </div>
        </CardContent>
      </Card>

      {/* Contact Selection Modal */}
      {showContactSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowContactSelection(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-[#00F6FF]/30 rounded-xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Add to Circle</h3>
              <button 
                onClick={() => setShowContactSelection(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-white/70 mb-4">
              Choose from your bonded contacts to add to your circle of trust
            </p>
            
            <div className="space-y-2">
              {availableContacts.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm mb-1">No available contacts</p>
                  <p className="text-xs text-white/40">Connect with more people first</p>
                </div>
              ) : (
                availableContacts.map((contact) => {
                  const displayName = contact.handle || `User ${contact.peerId?.slice(-6) || 'Unknown'}`
                  return (
                    <div 
                      key={contact.peerId}
                      className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors border border-white/10 hover:border-[#00F6FF]/30"
                      onClick={() => handleSelectContact(contact.peerId || '', displayName)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00F6FF]/20 to-cyan-500/20 border border-[#00F6FF]/30 flex items-center justify-center">
                          <User className="w-4 h-4 text-[#00F6FF]" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{displayName}</div>
                          <div className="text-xs text-white/60">Bonded Contact</div>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        className="h-7 px-3 text-xs bg-[#00F6FF]/20 hover:bg-[#00F6FF]/30 text-[#00F6FF] border border-[#00F6FF]/30"
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
      )}

    </div>
  )
}
