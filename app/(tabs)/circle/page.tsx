"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Users, UserPlus, Settings, Circle, User, MessageCircle, X, Plus } from "lucide-react"
import type { BondedContact } from "@/lib/stores/signalsStore" // type only
import { useHcsEvents } from "@/hooks/useHcsEvents"
import { toLegacyEventArray } from "@/lib/services/HCSDataAdapter"
import { getBondedContactsFromHCS, getTrustStatsFromHCS, getTrustLevelsPerContact } from "@/lib/services/HCSDataUtils"
import { getSessionId } from "@/lib/session"
import { StoicGuideModal } from "@/components/StoicGuideModal"
import { TrustCircleVisualization } from "@/components/trust/TrustCircleVisualization"
import { GenZButton, GenZCard, GenZHeading, GenZText, GenZModal, genZClassNames } from '@/components/ui/genz-design-system'
import { 
  ProfessionalLoading, 
  ProfessionalError, 
  ProfessionalSuccess,
  ContextualGuide 
} from '@/components/enhancements/professional-ux-enhancements'
import { trustAllocationService } from '@/lib/services/TrustAllocationService'

// Using shared TrustCircleVisualization component from components/trust/

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
  const [showStoicGuide, setShowStoicGuide] = useState(false)
  
  // Professional state
  const [error, setError] = useState<string | null>(null)
  const [isAllocatingTrust, setIsAllocatingTrust] = useState(false)
  const [recentTrustAllocation, setRecentTrustAllocation] = useState<{name: string, amount: number} | null>(null)
  
  // Track load sequence to prevent stale updates
  const loadIdRef = useRef(0)

  // Load real data from HCS
  useEffect(() => {
    let active = true
    
    const loadCircleData = async () => {
      const myLoadId = ++loadIdRef.current
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
        
        // Get trust statistics
        const hcsTrustStats = getTrustStatsFromHCS(allEvents, effectiveSessionId)
        console.log('🔥 [InnerCirclePage] Trust stats:', hcsTrustStats)
        
        // Get trust levels per contact
        const trustData = getTrustLevelsPerContact(allEvents, effectiveSessionId)
        console.log('🔥 [InnerCirclePage] Trust levels:', trustData)
        
        // Only update if this is still the latest load (prevent stale updates)
        if (active && myLoadId === loadIdRef.current) {
          setBondedContacts(contacts)
          setTrustStats({
            allocatedOut: hcsTrustStats.allocatedOut,
            maxSlots: hcsTrustStats.cap,
            bondedContacts: contacts.length
          })
          setTrustLevels(trustData)
          console.log(`[InnerCirclePage] ✅ Loaded ${contacts.length} bonded contacts with ${hcsTrustStats.allocatedOut}/${hcsTrustStats.cap} trust allocated`)
        } else {
          console.log(`[InnerCirclePage] ⏭️ Skipping stale load ${myLoadId} (current: ${loadIdRef.current})`)
        }
      } catch (error) {
        if (active && myLoadId === loadIdRef.current) {
          console.error('[InnerCirclePage] Failed to load inner circle data:', error)
          setError(error instanceof Error ? error.message : 'Failed to load circle data')
        }
      } finally {
        if (active && myLoadId === loadIdRef.current) {
          setIsLoading(false)
        }
      }
    }

    loadCircleData()
    
    return () => {
      active = false
    }
    
    // Re-run when feeds advance (watermarks change)
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
      toast.info('No contacts available', {
        description: 'Go to Contacts page to connect with people first'
      })
      return
    }
    setShowContactSelection(true)
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
      
      // Submit trust allocation via HCS
      const result = await trustAllocationService.submitTrustAllocation(contactId, allocationAmount)
      
      if (!result.success) {
        throw new Error(result.error || 'Trust allocation failed')
      }
      
      // Update UI state
      setRecentTrustAllocation({ name: contactName, amount: allocationAmount })
      
      // Update trust stats optimistically
      setTrustStats(prev => ({
        ...prev,
        allocatedOut: prev.allocatedOut + allocationAmount
      }))
      
      // Update trust levels map
      const updatedTrustLevels = new Map(trustLevels)
      const currentTrust = updatedTrustLevels.get(contactId) || { allocatedTo: 0, receivedFrom: 0 }
      updatedTrustLevels.set(contactId, { ...currentTrust, allocatedTo: allocationAmount })
      setTrustLevels(updatedTrustLevels)
      
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
        {/* Your Inner Circle Dashboard Header */}
        <div className="text-center mb-6">
          <GenZHeading level={1} className="flex items-center justify-center gap-2 mb-2">
            <Circle className="w-6 h-6 text-pri-500 animate-breathe-glow" />
            Your Inner Circle Dashboard
          </GenZHeading>
          <GenZText className="text-lg text-pri-400 font-medium">
            Circle of Trust • Choose Wisely • Scarce Trust
          </GenZText>
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
          <div className="text-center mb-6">
            <GenZHeading level={2} className="mb-3">Inner Circle Members</GenZHeading>
            <GenZHeading level={1} className="mb-2 font-mono">
              {trustStats.allocatedOut}/9 Slots
            </GenZHeading>
            <GenZText className="text-pri-400 mb-4">
              Choose Wisely • Scarce Trust
            </GenZText>
            {isLoading && (
              <ProfessionalLoading 
                variant="default"
                message="Loading your circle..."
                className="py-4"
              />
            )}
          </div>
          
          <div className="flex flex-col items-center gap-6">
            {/* Inner Circle LED Visualization - Now tappable */}
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
            <GenZButton
              variant="boost"
              glow
              onClick={handleAddMember}
              className="w-full border-2 border-white/20 hover:border-white/40"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Add to Circle
            </GenZButton>
          </div>
        </GenZCard>
        
        {/* Inner Circle Members List */}
        <GenZCard variant="glass" className="p-4">
            {innerCircleMembers.length === 0 ? (
            <div className="text-center py-8">
              <GenZText className="text-lg mb-6" dim>
                Your inner circle is empty
              </GenZText>
              
              {/* Who should I add? - Styled as a card button */}
              <GenZButton
                onClick={() => setShowStoicGuide(true)}
                variant="outline"
                size="lg"
                className="w-full mb-4 border-2 border-white/30 hover:border-white/60 text-white/90 hover:text-white"
              >
                💡 Who should I add?
              </GenZButton>
              
              {/* Action button for building circle - only from existing contacts */}
              {availableContacts.length > 0 ? (
                <GenZButton 
                  onClick={() => setShowContactSelection(true)}
                  variant="boost"
                  size="lg"
                  glow
                  className="w-full"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Choose from Contacts ({availableContacts.length})
                </GenZButton>
              ) : (
                <div className="mt-6">
                  <GenZText dim className="mb-2">No contacts available</GenZText>
                  <GenZText size="sm" dim>Go to Contacts to connect with people first</GenZText>
                </div>
              )}
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
                          
                          {/* Add from existing contacts button only */}
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

        {/* Stoic Guide Modal */}
        <StoicGuideModal
          isOpen={showStoicGuide}
          onClose={() => setShowStoicGuide(false)}
          availableSlots={trustStats.maxSlots - trustStats.allocatedOut}
          onAddMember={handleAddMember}
        />

      </div>
    </div>
  )
}
