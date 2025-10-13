"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Users, UserPlus, Settings, Circle, User, MessageCircle, X, Plus, Heart, Flame, Mail, Smartphone, Send, Copy } from "lucide-react"
import type { BondedContact } from "@/lib/stores/signalsStore" // type only
import { useHcsEvents } from "@/hooks/useHcsEvents"
import { toLegacyEventArray } from "@/lib/services/HCSDataAdapter"
import { getBondedContactsFromHCS, getTrustStatsFromHCS, getTrustLevelsPerContact } from "@/lib/services/HCSDataUtils"
import { getSessionId } from "@/lib/session"
import { StoicGuideModal } from "@/components/StoicGuideModal"
import { GenZButton, GenZCard, GenZHeading, GenZText, GenZModal, genZClassNames } from '@/components/ui/genz-design-system'
import { 
  ProfessionalLoading, 
  ProfessionalError, 
  ProfessionalSuccess,
  ContextualGuide 
} from '@/components/enhancements/professional-ux-enhancements'

// Inner Circle LED Visualization Component - GenZ Style
function InnerCircleVisualization({ allocatedOut, maxSlots, bondedContacts }: { 
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
      {/* Center inner circle emoji - GenZ style */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center animate-breathe-glow">
        <span className="text-xl">🔥</span>
      </div>
    </div>
  )
}

export default function InnerCirclePage() {
  const router = useRouter()
  const trustFeed = useHcsEvents('trust', 2500)
  const contactFeed = useHcsEvents('contact', 2500) // optional if your utils look at contacts too
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [bondedContacts, setBondedContacts] = useState<BondedContact[]>([])
  const [trustStats, setTrustStats] = useState({ allocatedOut: 0, maxSlots: 9, bondedContacts: 0 })
  const [trustLevels, setTrustLevels] = useState<Map<string, { allocatedTo: number, receivedFrom: number }>>(new Map())
  const [sessionId, setSessionId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showContactSelection, setShowContactSelection] = useState(false)
  const [showInviteActions, setShowInviteActions] = useState(false)
  
  // Professional state
  const [error, setError] = useState<string | null>(null)
  const [isAllocatingTrust, setIsAllocatingTrust] = useState(false)
  const [recentTrustAllocation, setRecentTrustAllocation] = useState<{name: string, amount: number} | null>(null)

  // Load real data from HCS
  useEffect(() => {
    const loadCircleData = async () => {
      try {
        setIsLoading(true)
        const currentSessionId = getSessionId()
        const effectiveSessionId = currentSessionId || 'tm-alex-chen'
        setSessionId(effectiveSessionId)
        
        // Merge feeds you need (trust + contact) to match previous utils' assumptions
        const allEvents = toLegacyEventArray([
          ...trustFeed.items,
          ...contactFeed.items,
        ] as any)
        console.log('🔥 [InnerCirclePage] Effective session ID:', effectiveSessionId)
        console.log('🔥 [InnerCirclePage] Total events from signals store:', allEvents.length)
        
        // Get bonded contacts
        const contacts = getBondedContactsFromHCS(allEvents, effectiveSessionId)
        console.log('🔥 [InnerCirclePage] Bonded contacts:', contacts)
        setBondedContacts(contacts)
        
        // Get trust statistics
        const hcsTrustStats = getTrustStatsFromHCS(allEvents, effectiveSessionId)
        console.log('🔥 [InnerCirclePage] Trust stats:', hcsTrustStats)
        setTrustStats({
          allocatedOut: hcsTrustStats.allocatedOut,
          maxSlots: hcsTrustStats.cap, // Configurable capacity from HCS
          bondedContacts: contacts.length
        })
        
        // Get trust levels per contact
        const trustData = getTrustLevelsPerContact(allEvents, effectiveSessionId)
        console.log('🔥 [InnerCirclePage] Trust levels:', trustData)
        setTrustLevels(trustData)
        
        console.log(`[InnerCirclePage] Loaded ${contacts.length} bonded contacts with ${hcsTrustStats.allocatedOut}/${hcsTrustStats.cap} trust allocated`)
      } catch (error) {
        console.error('[InnerCirclePage] Failed to load inner circle data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCircleData()
    
    // Re-run when feeds advance (watermarks change)
    // (No subscription object needed—SWR revalidates)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trustFeed.watermark, contactFeed.watermark])
  
  // Inner circle members are only those bonded contacts who we've allocated trust to
  const innerCircleMembers = bondedContacts
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
      description: 'Spot now available in your inner circle'
    })
  }

  // Get contacts that are bonded but not yet in the circle (no trust allocated)
  const availableContacts = bondedContacts.filter(contact => {
    const trustData = trustLevels.get(contact.peerId || '') || { allocatedTo: 0, receivedFrom: 0 }
    return trustData.allocatedTo === 0 // Not in circle yet
  })

  const handleAddMember = () => {
    if (availableContacts.length === 0) {
      // Show invite options instead of error
      setShowInviteActions(true)
      return
    }
    setShowContactSelection(true)
  }

  const handleSMSInvite = () => {
    const inviteText = `Join me on TrustMesh! Build your trust network and earn recognition tokens. Download: https://trustmesh.app/invite`
    const smsUrl = `sms:?body=${encodeURIComponent(inviteText)}`
    window.location.href = smsUrl
    toast.success('SMS invite ready!', {
      description: 'Choose a contact to send the invite'
    })
    setShowInviteActions(false)
  }

  const handleEmailInvite = () => {
    const subject = 'Join me on TrustMesh!'
    const body = `Hey! I'm building my trust network on TrustMesh and would love to connect with you.\n\nTrustMesh lets you:\n• Build your inner circle with trusted friends\n• Earn recognition tokens for your achievements\n• Share trust through your network\n\nJoin me: https://trustmesh.app/invite`
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailtoUrl
    toast.success('Email invite ready!', {
      description: 'Your email app will open with the invite'
    })
    setShowInviteActions(false)
  }

  const handleCopyInvite = async () => {
    const inviteText = `Join me on TrustMesh! Build your trust network and earn recognition tokens. https://trustmesh.app/invite`
    try {
      await navigator.clipboard.writeText(inviteText)
      toast.success('Invite link copied!', {
        description: 'Share it anywhere you want'
      })
    } catch (err) {
      toast.error('Failed to copy link')
    }
  }

  const handleSelectContact = async (contactId: string, contactName: string) => {
    try {
      setIsAllocatingTrust(true)
      setError(null)
      
      // Validate capacity
      const remaining = trustStats.maxSlots - trustStats.allocatedOut
      if (remaining <= 0) {
        throw new Error('Your inner circle is full. Remove someone to add a new member.')
      }
      
      // Default allocation amount = 1 (or next available)
      const allocationAmount = 1
      
      // TODO: integrate trustAllocationService if available here
      // await trustAllocationService.submitTrustAllocation(contactId, allocationAmount)
      
      // Optimistic UI update
      setRecentTrustAllocation({ name: contactName, amount: allocationAmount })
      toast.success(`${contactName} added to your inner circle! 🔥`)
      setShowContactSelection(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add to inner circle'
      setError(msg)
      toast.error('Could not add to inner circle', { description: msg })
    } finally {
      setIsAllocatingTrust(false)
    }
  }

  const availableSlots = trustStats.maxSlots - trustStats.allocatedOut

  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-md mx-auto px-4 py-4 space-y-6">
        {/* GenZ Header */}
        <div className="text-center mb-6">
            <GenZHeading level={1} className="flex items-center justify-center gap-2">
              <Flame className="w-5 h-5 text-pri-500 animate-breathe-glow" />
              Inner Circle
            </GenZHeading>
        </div>
        
        {/* Error State */}
        {error && (
          <ProfessionalError
            message={error}
            variant="error"
            dismissible
            onDismiss={() => setError(null)}
          />
        )}
        
        {/* Success Feedback */}
        {recentTrustAllocation && (
          <ProfessionalSuccess
            title="Circle Updated!"
            message={`${recentTrustAllocation.name} is now in your inner circle`}
            details={[
              `Trust allocated: ${recentTrustAllocation.amount}`,
              'They can now see your trust network',
              'Send them props to strengthen the bond'
            ]}
            autoHide
            hideDelay={5000}
          />
        )}
      
        {/* Inner Circle - Visual Centerpiece */}
        <GenZCard variant="glass" className="p-6">
          <div className="text-center mb-4">
            <GenZHeading level={3} className="mb-2">Your Inner Circle 🔥</GenZHeading>
            {isLoading && (
              <ProfessionalLoading 
                variant="default"
                message="Loading your circle..."
                className="py-4"
              />
            )}
          </div>
          
          <div className="flex items-center justify-center gap-6">
            {/* Inner Circle LED Visualization */}
            <div className="flex-shrink-0">
              <InnerCircleVisualization
                allocatedOut={trustStats.allocatedOut}
                maxSlots={trustStats.maxSlots}
                bondedContacts={trustStats.bondedContacts}
              />
            </div>
            
            {/* Compact Stats */}
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center mb-2">
                <span className="text-xl font-bold text-genz-text font-mono">{trustStats.allocatedOut}/{trustStats.maxSlots}</span>
                <GenZText size="sm" dim>slots used</GenZText>
              </div>
            </div>
          </div>
        </GenZCard>
      
        {/* Inner Circle Members List */}
        <GenZCard variant="glass" className="p-4">
            {innerCircleMembers.length === 0 ? (
            <div className="text-center py-6">
              <GenZHeading level={4} className="mb-4">Add to Circle</GenZHeading>
              
              {/* Action buttons for building circle */}
              <div className="flex gap-3 justify-center">
                {/* Add from existing contacts */}
                {availableContacts.length > 0 && (
                  <GenZButton 
                    onClick={() => setShowContactSelection(true)}
                    variant="boost"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    From Friends ({availableContacts.length})
                  </GenZButton>
                )}
                
                {/* Invite new people */}
                <GenZButton 
                  onClick={() => setShowInviteActions(true)}
                  variant="outline"
                  className="border-pri-500/30 text-pri-500 hover:bg-pri-500/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Invite
                </GenZButton>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <GenZHeading level={4}>My Inner Circle</GenZHeading>
            <span className="text-xs text-genz-text-dim">{innerCircleMembers.length}</span>
              </div>
              
              <div className="space-y-2">
                {innerCircleMembers.map((member) => (
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
            
                
                {/* Inner Circle Building - Show up to 3 empty spots */}
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
                          
                          <div className="flex gap-2">
                            {/* Add from existing contacts button */}
                            {availableContacts.length > 0 && (
                              <GenZButton 
                                size="sm"
                                variant="boost"
                                onClick={() => setShowContactSelection(true)}
                                className="animate-pulse-glow"
                              >
                                <UserPlus className="w-3 h-3 mr-1" />
                                Add
                              </GenZButton>
                            )}
                            
                            {/* Invite new people button */}
                            <GenZButton 
                              size="sm"
                              variant={availableContacts.length > 0 ? "outline" : "boost"}
                              onClick={() => setShowInviteActions(true)}
                              className={availableContacts.length === 0 ? "animate-pulse-glow" : "border-pri-500/30"}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Invite
                            </GenZButton>
                          </div>
                        </div>
                      </GenZCard>
                    ))}
                    
                    {/* Progress indicator if more than 3 spots available */}
                    {availableSlots > 3 && (
                      <div className="text-center py-2">
                        <GenZText size="sm" dim>
                          +{availableSlots - 3} more spots available
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

        {/* Invite Actions Modal - Game-like UI */}
        <GenZModal 
          isOpen={showInviteActions} 
          onClose={() => setShowInviteActions(false)}
          title="Recruit New Members"
        >
          <div className="space-y-6">
            {/* Header with game-like messaging */}
            <div className="text-center">
              <div className="text-4xl mb-2">🎯</div>
              <GenZText className="mb-2">Your inner circle needs more trusted allies!</GenZText>
              <GenZText size="sm" dim>
                Invite friends and family to join your network. They'll become part of your trust ecosystem.
              </GenZText>
            </div>

            {/* Invite Action Cards - Game-style */}
            <div className="space-y-3">
              {/* SMS Invite */}
              <GenZCard 
                variant="glass" 
                className="p-4 cursor-pointer hover:bg-pri-500/5 hover:border-pri-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                onClick={handleSMSInvite}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <GenZText className="font-semibold mb-1">SMS Invite</GenZText>
                    <GenZText size="sm" dim>Send a text message invite</GenZText>
                  </div>
                  <Send className="w-4 h-4 text-pri-500 opacity-60" />
                </div>
              </GenZCard>

              {/* Email Invite */}
              <GenZCard 
                variant="glass" 
                className="p-4 cursor-pointer hover:bg-pri-500/5 hover:border-pri-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                onClick={handleEmailInvite}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <GenZText className="font-semibold mb-1">Email Invite</GenZText>
                    <GenZText size="sm" dim>Send a detailed email invitation</GenZText>
                  </div>
                  <Send className="w-4 h-4 text-pri-500 opacity-60" />
                </div>
              </GenZCard>

              {/* Copy Link */}
              <GenZCard 
                variant="glass" 
                className="p-4 cursor-pointer hover:bg-pri-500/5 hover:border-pri-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                onClick={handleCopyInvite}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                    <Copy className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <GenZText className="font-semibold mb-1">Copy Invite Link</GenZText>
                    <GenZText size="sm" dim>Share on social media or messaging apps</GenZText>
                  </div>
                  <Copy className="w-4 h-4 text-pri-500 opacity-60" />
                </div>
              </GenZCard>
            </div>

            {/* Pro Tips Section */}
            <GenZCard variant="glass" className="p-4 bg-sec-500/5 border-sec-500/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sec-500/20 to-sec-600/20 border border-sec-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">💡</span>
                </div>
                <div>
                  <GenZText className="font-medium mb-2">Pro Tips for Building Your Circle:</GenZText>
                  <div className="space-y-1 text-xs">
                    <GenZText size="sm" dim>• Start with people you trust most</GenZText>
                    <GenZText size="sm" dim>• Quality matters more than quantity</GenZText>
                    <GenZText size="sm" dim>• They'll earn recognition tokens too!</GenZText>
                  </div>
                </div>
              </div>
            </GenZCard>
          </div>
        </GenZModal>

      </div>
    </div>
  )
}
