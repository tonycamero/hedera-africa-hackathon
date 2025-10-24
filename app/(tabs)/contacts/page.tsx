"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { signalsStore, type BondedContact } from '@/lib/stores/signalsStore'
import { getBondedContactsFromHCS, getTrustLevelsPerContact } from '@/lib/services/HCSDataUtils'
import { getSessionId } from '@/lib/session'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { MintSignalFlow } from '@/components/signals/MintSignalFlow'
import { SignalTypeSelector } from '@/components/signals/SignalTypeSelector'
import { SignalType } from '@/lib/types/signals-collectible'
import { shareSignal } from "@/lib/utils/shareUtils"
import { trackSignalSent } from '@/lib/services/GenZTelemetryService'
import { GenZAddFriendModal } from '@/components/GenZAddFriendModal'
import { AddContactModal } from '@/components/AddContactModal'
import { AllocateTrustModal } from '@/components/AllocateTrustModal'
import { trustAllocationService } from '@/lib/services/TrustAllocationService'
import { GenZButton, GenZCard, GenZChip, GenZHeading, GenZText, GenZInput, genZClassNames } from '@/components/ui/genz-design-system'
import { 
  Users, 
  UserPlus, 
  Heart, 
  Zap, 
  MessageCircle, 
  Share2, 
  MapPin,
  Clock,
  Flame,
  Star,
  Eye,
  Camera,
  Music,
  Coffee,
  BookOpen
} from 'lucide-react'
import { PurpleFlame } from '@/components/ui/TrustAgentFlame'
import { XMTPMessageButton } from '@/components/messaging/XMTPIntegration'
import { knsService } from '@/lib/services/knsService'
import { 
  ProfessionalLoading, 
  ProfessionalError, 
  ContextualGuide, 
  NetworkStatusIndicator,
  PullToRefresh 
} from '@/components/enhancements/professional-ux-enhancements'
// GenZ Friend Interface
interface Friend {
  id: string
  name: string
  handle: string
  avatar?: string
  isOnline: boolean
  lastSeen?: string
  recentActivity?: string
  mutualFriends: number
  campusCode?: string
  vibe?: string
  quickEmoji?: string
  propsReceived: number
  isClose: boolean // inner circle member
}

interface CampusConnection {
  id: string
  name: string
  handle: string
  avatar?: string
  mutualFriends: number
  campusCode: string
  joinedRecently?: boolean
  commonInterests?: string[]
}

// CrewSection - Your closest friends (inner circle members)
function CrewSection({ friends, onSignalClick, onAllocateTrust, setActiveTab, onAddFriend }: { friends: Friend[], onSignalClick: (friend: Friend) => void, onAllocateTrust?: (friend: Friend) => void, setActiveTab: (tab: 'crew' | 'campus' | 'discover') => void, onAddFriend: () => void }) {
  const closeFriends = friends.filter(friend => friend.isClose)
  const availableToTrust = friends.filter(friend => !friend.isClose)
  
  // If no friends, just show empty state - Lightning Bolt handles the CTA
  
  return (
    <div className="space-y-4">
      {/* Inner Circle Members */}
      {closeFriends.length > 0 && (
        <div className="space-y-3">
          <GenZHeading level={4}>Inner Circle ({closeFriends.length}/9)</GenZHeading>
          {closeFriends.map((friend) => (
            <FriendCard key={friend.id} friend={friend} onSignalClick={onSignalClick} showActivity />
          ))}
        </div>
      )}
      
      {/* Available to Trust */}
      {availableToTrust.length > 0 && (
        <div className="space-y-3">
          <GenZHeading level={4}>Your Contacts</GenZHeading>
          <GenZText size="sm" dim>Add to Circle to build deeper trust</GenZText>
          {availableToTrust.map((friend) => (
            <FriendCard 
              key={friend.id} 
              friend={friend} 
              onSignalClick={onSignalClick} 
              onAllocateTrust={onAllocateTrust}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Viral Share Section - Simple profile sharing and invite
function ViralShareSection({ sessionId, onAddFriend, counters }: { sessionId: string, onAddFriend: () => void, counters: { friends: number, sent: number, boosts: number } }) {
  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/u/${sessionId}`
    const shareText = `Connect with me on TrustMesh! I've got ${counters.friends} connections and sent ${counters.sent} props ⚡`
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join my TrustMesh crew',
          text: shareText,
          url: profileUrl
        })
      } else {
        await navigator.clipboard.writeText(`${shareText} ${profileUrl}`)
        toast('Profile link copied! Send it to add friends ⚡')
      }
    } catch (error) {
      console.warn('Share failed:', error)
    }
  }
  
  return (
    <GenZCard variant="glass" className="p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-boost-500/10 to-pri-500/10" />
      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <GenZText className="font-semibold text-boost-400 mb-1">
            Grow your crew
          </GenZText>
          <GenZText size="sm" dim>
            Share profile · Scan QR
          </GenZText>
        </div>
        <div className="flex gap-2">
          <GenZButton size="sm" variant="boost" glow onClick={handleShareProfile}>
            <Share2 className="w-3 h-3 mr-1" />
            Share
          </GenZButton>
          <GenZButton size="sm" variant="primary" onClick={onAddFriend}>
            <Camera className="w-3 h-3 mr-1" />
            Scan
          </GenZButton>
        </div>
      </div>
    </GenZCard>
  )
}

// Trust Agent Component - Action-oriented lightning bolt design
function AICrewNudge({ onAddFriend }: { onAddFriend: () => void }) {
  const actionPhrases = [
    "Ready to connect?",
    "Let's build your crew!", 
    "Time to add friends!",
    "Expand your network!",
    "Connect with someone new!"
  ]
  
  const [currentPhrase] = useState(() => 
    actionPhrases[Math.floor(Math.random() * actionPhrases.length)]
  )
  
  return (
    <GenZCard variant="glass" className="relative p-6 mb-4 overflow-hidden cursor-pointer" onClick={onAddFriend}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-boost-500/20 via-pri-500/15 to-sec-500/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5" />
      
      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Big Lightning Bolt */}
        <div className="mb-4 relative">
          <div className="text-6xl animate-breathe-glow" style={{ filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))' }}>
            ⚡
          </div>
          {/* Pulsing ring effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 border-2 border-boost-400/30 rounded-full animate-ping" />
          </div>
        </div>
        
        <GenZHeading level={4} className="mb-2 text-boost-400">
          Trust Agent
        </GenZHeading>
        
        <GenZText className="mb-4 text-pri-300">
          {currentPhrase}
        </GenZText>
        
        {/* Action button */}
        <GenZButton variant="boost" size="lg" glow className="transform hover:scale-105 transition-all duration-300">
          <UserPlus className="w-5 h-5 mr-2" />
          Add Friend Now
        </GenZButton>
      </div>
    </GenZCard>
  )
}



// EventCard component for recent events
function EventCard({ event }: { event: any }) {
  return (
    <GenZCard variant="glass" className="p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="text-2xl">{event.icon}</div>
        <div className="flex-1">
          <GenZText className="font-semibold mb-1">{event.name}</GenZText>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-3 h-3 text-pri-500" />
            <GenZText size="sm" className="text-pri-500">{event.location}</GenZText>
            <span className="text-genz-text-dim">•</span>
            <GenZText size="sm" dim>{event.when}</GenZText>
          </div>
          <GenZText size="sm" dim className="mt-1">
            {event.attendees} people attended
          </GenZText>
        </div>
      </div>
      
      <div className="space-y-2">
        {event.people.map((person: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg bg-panel/30">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sec-500/30 to-pri-500/20 border border-sec-500/30 flex items-center justify-center">
                <span className="text-xs font-semibold">
                  {person.name.slice(0, 1).toUpperCase()}
                </span>
              </div>
              <GenZText size="sm" className="font-medium">{person.name}</GenZText>
              <GenZText size="sm" dim>{person.handle}</GenZText>
            </div>
            
            {person.wasAdded ? (
              <GenZChip variant="boost" className="text-xs">
                Added ✓
              </GenZChip>
            ) : (
              <GenZButton size="sm" variant="ghost">
                <UserPlus className="w-3 h-3" />
              </GenZButton>
            )}
          </div>
        ))}
      </div>
    </GenZCard>
  )
}

// Recent scan card for add section
function RecentScanCard({ scan }: { scan: any }) {
  return (
    <GenZCard variant="glass" className="p-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-boost-500/30 to-pri-500/20 border border-boost-500/30 flex items-center justify-center">
          <span className="text-xs font-semibold">
            {scan.name.slice(0, 1).toUpperCase()}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <GenZText size="sm" className="font-medium truncate">{scan.name}</GenZText>
            <GenZChip variant="signal" className="text-xs">
              {scan.method}
            </GenZChip>
          </div>
          
          <div className="flex items-center gap-2">
            <GenZText size="sm" dim>{scan.handle}</GenZText>
            <span className="text-genz-text-dim">•</span>
            <GenZText size="sm" dim>{scan.when}</GenZText>
          </div>
          
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-pri-500" />
            <GenZText size="sm" className="text-pri-500">{scan.location}</GenZText>
          </div>
        </div>
        
        <GenZButton size="sm" variant="boost">
          Add
        </GenZButton>
      </div>
    </GenZCard>
  )
}

// FriendCard - For close crew members
function FriendCard({ friend, onSignalClick, onAllocateTrust, showActivity = false }: { friend: Friend, onSignalClick: (friend: Friend) => void, onAllocateTrust?: (friend: Friend) => void, showActivity?: boolean }) {
  return (
    <GenZCard variant="glass" className={`p-4 ${genZClassNames.hoverScale} cursor-pointer`}>
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pri-500/30 to-sec-500/20 border border-pri-500/30 flex items-center justify-center">
            <span className="text-genz-text font-semibold text-sm">
              {friend.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
          {friend.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-genz-success border-2 border-panel shadow-glow animate-breathe-glow" />
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <GenZText className="font-semibold truncate">{friend.name}</GenZText>
            {friend.isClose && (
              <Heart className="w-3 h-3 text-sec-500" />
            )}
          </div>
          
          {showActivity && friend.recentActivity ? (
            <GenZText size="sm" className="text-pri-500">
              {friend.recentActivity}
            </GenZText>
          ) : (
            <div className="flex items-center gap-2">
              <GenZText size="sm" className="text-boost-400 font-medium">Bonded</GenZText>
              <span className="text-genz-text-dim">•</span>
              <GenZText size="sm" dim>{friend.propsReceived || 0} props sent</GenZText>
            </div>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Show Allocate Trust button if not in circle yet and handler provided */}
          {!friend.isClose && onAllocateTrust && (
            <GenZButton
              size="sm"
              variant="primary"
              onClick={(e) => {
                e.stopPropagation()
                onAllocateTrust(friend)
              }}
            >
              <Users className="w-3 h-3 mr-1" />
              Trust
            </GenZButton>
          )}
        </div>
      </div>
    </GenZCard>
  )
}

// CampusPersonCard - For campus connections
function CampusPersonCard({ person }: { person: any }) {
  return (
    <GenZCard variant="glass" className={`p-4 ${genZClassNames.hoverScale} cursor-pointer`}>
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sec-500/30 to-pri-500/20 border border-sec-500/30 flex items-center justify-center">
            <span className="text-genz-text font-semibold text-sm">
              {person.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
          {person.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-genz-success border-2 border-panel" />
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <GenZText className="font-medium truncate">{person.name}</GenZText>
            {person.joinedRecently && (
              <GenZChip variant="signal" className="text-xs">
                New
              </GenZChip>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <GenZText size="sm" dim>{person.handle}</GenZText>
            <span className="text-genz-text-dim">•</span>
            <GenZText size="sm" className="text-genz-success">
              {person.mutualFriends} mutual
            </GenZText>
          </div>
          
          <GenZText size="sm" dim className="mt-1">
            {person.vibe}
          </GenZText>
        </div>
        
        {/* Add Button */}
        <GenZButton size="sm" variant="signal">
          <UserPlus className="w-3 h-3 mr-1" />
          Add
        </GenZButton>
      </div>
    </GenZCard>
  )
}

// SuggestionCard - For discovery suggestions
function SuggestionCard({ person }: { person: any }) {
  return (
    <GenZCard variant="glass" className={`p-4 ${genZClassNames.hoverScale} cursor-pointer`}>
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-genz-text-dim/30 to-genz-border/20 border border-genz-text-dim/30 flex items-center justify-center">
            <span className="text-genz-text font-semibold text-sm">
              {person.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
          {person.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-genz-success border-2 border-panel" />
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <GenZText className="font-medium truncate mb-1">{person.name}</GenZText>
          
          <GenZText size="sm" className="text-pri-500 mb-1">
            {person.reason}
          </GenZText>
          
          <div className="flex items-center gap-2 text-xs">
            <GenZText size="sm" dim>{person.handle}</GenZText>
            <span className="text-genz-text-dim">•</span>
            <GenZText size="sm" dim>{person.vibe}</GenZText>
          </div>
        </div>
        
        {/* Add Button */}
        <GenZButton size="sm" variant="ghost" className="border border-pri-500/30">
          <UserPlus className="w-3 h-3 mr-1" />
          Add
        </GenZButton>
      </div>
    </GenZCard>
  )
}

export default function YourCrewPage() {
  // Core state
  const [bondedContacts, setBondedContacts] = useState<BondedContact[]>([])
  const [trustLevels, setTrustLevels] = useState<Map<string, { allocatedTo: number, receivedFrom: number }>>(new Map())
  const [sessionId, setSessionId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  
  // GenZ UI state (simplified)
  const [addFriendOpen, setAddFriendOpen] = useState(false)
  const [allocateTrustModalOpen, setAllocateTrustModalOpen] = useState(false)
  const [selectedContactForTrust, setSelectedContactForTrust] = useState<Friend | null>(null)
  const [mintSheetOpen, setMintSheetOpen] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [selectedSignalType, setSelectedSignalType] = useState<SignalType | null>(null)
  const [showSignalSelector, setShowSignalSelector] = useState(true)
  
  // Professional state management
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showFirstTimeGuide, setShowFirstTimeGuide] = useState(false)
  
  // Track load sequence to prevent stale updates
  const loadIdRef = useRef(0)
  
  // Professional data loading with enhanced error handling + race guards
  const loadContacts = useCallback(async () => {
    const myLoadId = ++loadIdRef.current
    
    try {
      if (!isRefreshing) setIsLoading(true)
      setError(null)
      
      const currentSessionId = getSessionId()
      const effectiveSessionId = currentSessionId || 'tm-alex-chen'
      setSessionId(effectiveSessionId)
      
      // Load with timeout protection
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Loading timeout - check your connection')), 8000)
      )
      
      const loadPromise = Promise.resolve().then(() => {
        const allEvents = signalsStore.getAll()
        const contacts = getBondedContactsFromHCS(allEvents, effectiveSessionId)
        const trustData = getTrustLevelsPerContact(allEvents, effectiveSessionId)
        return { contacts, trustData }
      })
      
      const { contacts, trustData } = await Promise.race([loadPromise, timeoutPromise]) as any
      
      // Only update if this is still the latest load (prevent stale updates)
      if (myLoadId === loadIdRef.current) {
        setBondedContacts(contacts)
        setTrustLevels(trustData)
        
        // Show first-time guide if no contacts
        if (contacts.length === 0) {
          setShowFirstTimeGuide(true)
        }
        
        console.log(`[GenZContacts] ✅ Loaded ${contacts.length} connections`)
      } else {
        console.log(`[GenZContacts] ⏭️ Skipping stale load ${myLoadId} (current: ${loadIdRef.current})`)
      }
    } catch (error) {
      // Only show error if this is still the latest load
      if (myLoadId === loadIdRef.current) {
        const message = error instanceof Error ? error.message : 'Failed to load your crew'
        console.error('[GenZContacts] ❌ Error:', error)
        setError(message)
      }
    } finally {
      if (myLoadId === loadIdRef.current) {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [isRefreshing])
  
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadContacts()
  }
  
  useEffect(() => {
    let active = true
    
    // Wrapper to check if still mounted
    const safeLoad = async () => {
      if (active) await loadContacts()
    }
    
    safeLoad()
    const unsubscribe = signalsStore.subscribe(safeLoad)
    
    return () => {
      active = false
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [loadContacts])

  // Convert HCS contacts to Friend format (no fake data)
  const friends: Friend[] = bondedContacts.map(contact => {
    const trustData = trustLevels.get(contact.peerId || contact.id) || { allocatedTo: 0, receivedFrom: 0 }
    const displayName = contact.handle || `User ${contact.peerId?.slice(-6) || 'Unknown'}`
    
    return {
      id: contact.peerId || contact.id,
      name: displayName,
      handle: `@${displayName.toLowerCase().replace(/\s+/g, '')}`,
      isOnline: true, // Assume online (no fake randomness)
      mutualFriends: 0, // Real data only
      propsReceived: trustData.receivedFrom,
      isClose: trustData.allocatedTo > 0,
      recentActivity: trustData.allocatedTo > 0 ? 'in your circle' : undefined,
      vibe: undefined // Remove fake vibes
    }
  })

  // Calculate counters
  const counters = {
    friends: friends.length,
    sent: Array.from(trustLevels.values()).reduce((sum, trust) => sum + trust.allocatedTo, 0),
    boosts: Array.from(trustLevels.values()).reduce((sum, trust) => sum + trust.receivedFrom, 0)
  }

  // Event handlers
  const handleAddFriend = () => {
    setAddFriendOpen(true)
  }

  const handleProfessionalAddContact = () => {
    // This opens the professional contact modal with phone/email integration
    setAddFriendOpen(true)
  }


  const handleSignalClick = async (friend: Friend) => {
    setSelectedFriend(friend)
    setShowSignalSelector(true) // Show selector first
    setSelectedSignalType(null)
    setMintSheetOpen(true)
  }
  
  const handleSignalTypeSelect = (signalType: SignalType) => {
    setSelectedSignalType(signalType)
    setShowSignalSelector(false) // Move to mint flow
  }

  const handleAllocateTrustClick = (friend: Friend) => {
    setSelectedContactForTrust(friend)
    setAllocateTrustModalOpen(true)
  }

  const handleTrustAllocation = async (contactId: string, level: number) => {
    const result = await trustAllocationService.submitTrustAllocation(contactId, level)
    
    if (result.success) {
      // Optimistic update - the actual data will be updated when HCS events are ingested
      const updatedTrustLevels = new Map(trustLevels)
      const currentTrust = updatedTrustLevels.get(contactId) || { allocatedTo: 0, receivedFrom: 0 }
      updatedTrustLevels.set(contactId, { ...currentTrust, allocatedTo: level })
      setTrustLevels(updatedTrustLevels)
    } else {
      throw new Error(result.error || 'Trust allocation failed')
    }
  }

  return (
    <div className="min-h-screen bg-ink">
      <NetworkStatusIndicator />
      
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="max-w-md mx-auto px-4 py-4 space-y-6">
          {/* Header */}
          <div className="text-center mb-4">
            <GenZHeading level={1} className="flex items-center justify-center gap-2">
              <Users className="w-6 h-6 text-pri-500 animate-breathe-glow" />
              Friends
            </GenZHeading>
            <GenZText className="text-lg text-pri-400 font-medium">
              Add people → send props → share the boost
            </GenZText>
          </div>


          {/* First Time Guide */}
          {showFirstTimeGuide && (
            <ContextualGuide
              title="Build Your Crew"
              message="Connect with people you trust to start building your inner circle."
              tip="Quality connections matter more than quantity!"
              actionText="Add Your First Contact"
              onAction={handleAddFriend}
              onDismiss={() => setShowFirstTimeGuide(false)}
              showOnce
              storageKey="first-contacts"
            />
          )}

          {/* Error State */}
          {error && (
            <ProfessionalError
              message={error}
              onAction={handleRefresh}
              actionText="Try Again"
              variant="error"
              dismissible
              onDismiss={() => setError(null)}
            />
          )}

          {/* Loading State */}
          {isLoading ? (
            <ProfessionalLoading 
              variant="initial"
              message="Loading your crew..."
              submessage="Syncing contacts from HCS"
            />
          ) : (
            <div className="space-y-4">
              {/* Trust Agent - First Priority Action */}
              <AICrewNudge onAddFriend={handleAddFriend} />
              
              {/* Main Crew Section (no tabs) */}
              <CrewSection 
                friends={friends} 
                onSignalClick={handleSignalClick} 
                onAllocateTrust={handleAllocateTrustClick} 
                setActiveTab={() => {}} // Removed tab functionality
                onAddFriend={handleAddFriend} 
              />
            </div>
          )}
        </div>
      </PullToRefresh>
      
      {/* Modals */}
      
      {/* Mint Signal Bottom Sheet */}
      <Sheet open={mintSheetOpen} onOpenChange={(open) => {
        setMintSheetOpen(open)
        if (!open) {
          // Reset state when closing
          setShowSignalSelector(true)
          setSelectedSignalType(null)
          setSelectedFriend(null)
        }
      }}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          {selectedFriend && (
            <>
              {showSignalSelector ? (
                <div className="space-y-4">
                  <SheetHeader>
                    <SheetTitle className="text-center">
                      Send Recognition to {selectedFriend.name}
                    </SheetTitle>
                  </SheetHeader>
                  <SignalTypeSelector 
                    onSelect={handleSignalTypeSelect}
                    selectedType={selectedSignalType}
                  />
                </div>
              ) : selectedSignalType ? (
                <MintSignalFlow
                  selectedType={selectedSignalType}
                  onBack={() => setShowSignalSelector(true)}
                  onComplete={() => {
                    setMintSheetOpen(false)
                    setSelectedFriend(null)
                    setSelectedSignalType(null)
                    setShowSignalSelector(true)
                    toast.success('Recognition sent! 🎉')
                    loadContacts() // Refresh
                  }}
                />
              ) : null}
            </>
          )}
        </SheetContent>
      </Sheet>
      
      {/* Professional Add Contact Modal with Phone/Email Integration */}
      <AddContactModal>
        <div style={{ display: 'none' }} />
      </AddContactModal>
      
      {/* Fallback GenZ Add Friend Modal */}
      <GenZAddFriendModal
        isOpen={addFriendOpen}
        onClose={() => setAddFriendOpen(false)}
      />
      
      {/* Allocate Trust Modal */}
      {selectedContactForTrust && (
        <AllocateTrustModal
          isOpen={allocateTrustModalOpen}
          onClose={() => {
            setAllocateTrustModalOpen(false)
            setSelectedContactForTrust(null)
          }}
          contact={{
            id: selectedContactForTrust.id,
            name: selectedContactForTrust.name,
            handle: selectedContactForTrust.handle
          }}
          currentCapacity={trustAllocationService.getCurrentCapacity()}
          onAllocate={handleTrustAllocation}
        />
      )}
    </div>
  )
}
