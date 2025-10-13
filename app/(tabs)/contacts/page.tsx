"use client"

import { useEffect, useState } from 'react'
import { signalsStore, type BondedContact } from '@/lib/stores/signalsStore'
import { getBondedContactsFromHCS, getTrustLevelsPerContact } from '@/lib/services/HCSDataUtils'
import { getSessionId } from '@/lib/session'
import { SendSignalModal } from '@/components/SendSignalModal'
import { toast } from 'sonner'
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
  BookOpen,
  Circle
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

// EventsSection - People from IRL events and gatherings
function EventsSection() {
  const recentEvents = [
    {
      id: 'event-1',
      name: 'CS 161 Study Group',
      location: 'Powell Library',
      when: '2 hours ago',
      attendees: 8,
      icon: '📚',
      people: [
        { name: 'Sarah', handle: '@sarahk', wasAdded: false },
        { name: 'Marcus', handle: '@mchen', wasAdded: true },
        { name: 'Alex', handle: '@alex_codes', wasAdded: false }
      ]
    },
    {
      id: 'event-2',
      name: 'Hackathon Kickoff',
      location: 'Engineering Building',
      when: 'Yesterday',
      attendees: 24,
      icon: '💻',
      people: [
        { name: 'Maya', handle: '@maya_creates', wasAdded: false },
        { name: 'Jordan', handle: '@jlee_music', wasAdded: false }
      ]
    },
    {
      id: 'event-3',
      name: 'Coffee Meetup',
      location: 'Blue Bottle',
      when: 'Last week',
      attendees: 6,
      icon: '☕',
      people: [
        { name: 'Zoe', handle: '@zoe_writes', wasAdded: true }
      ]
    }
  ]
  
  return (
    <div className="space-y-4">
      <GenZHeading level={4}>Recent Events</GenZHeading>
      <GenZText size="sm" dim className="mb-4">
        People you've actually met IRL
      </GenZText>
      
      <div className="space-y-3">
        {recentEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}

// AddSection - IRL ways to connect with people
function AddSection() {
  const recentScans = [
    {
      id: 'scan-1',
      name: 'Alex Rivera',
      handle: '@alex_codes',
      when: '5 mins ago',
      method: 'QR scan',
      location: 'Starbucks on Westwood'
    },
    {
      id: 'scan-2',
      name: 'Maya Patel',
      handle: '@maya_creates', 
      when: '2 hours ago',
      method: 'NFC tap',
      location: 'Hackathon check-in'
    }
  ]
  
  return (
    <div className="space-y-6">
      {/* Quick Add Methods */}
      <div className="space-y-4">
        <GenZHeading level={4}>Add People IRL</GenZHeading>
        
        <div className="grid grid-cols-2 gap-3">
          <GenZButton variant="boost" className="h-20 flex-col gap-2" glow>
            <Camera className="w-6 h-6" />
            <span className="text-sm">QR Scan</span>
          </GenZButton>
          
          <GenZButton variant="signal" className="h-20 flex-col gap-2">
            <Zap className="w-6 h-6" />
            <span className="text-sm">NFC Tap</span>
          </GenZButton>
        </div>
        
        <GenZButton variant="ghost" className="w-full" onClick={() => {}}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add by Handle
        </GenZButton>
      </div>
      
      {/* Recent Scans */}
      {recentScans.length > 0 && (
        <div className="space-y-3">
          <GenZHeading level={4}>Recent Scans</GenZHeading>
          <GenZText size="sm" dim>
            People you've scanned today
          </GenZText>
          
          <div className="space-y-2">
            {recentScans.map((scan) => (
              <RecentScanCard key={scan.id} scan={scan} />
            ))}
          </div>
        </div>
      )}
    </div>
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
              <GenZText size="sm" dim>Ready for props</GenZText>
            </div>
          )}
        </div>
        
        {/* Core Actions Only - Add to Circle or Send Props */}
        <div className="flex items-center gap-2">
          {/* Show Add to Circle button if not in circle yet */}
          {!friend.isClose && onAllocateTrust && (
            <GenZButton
              size="sm"
              variant="primary"
              onClick={(e) => {
                e.stopPropagation()
                onAllocateTrust(friend)
              }}
            >
              <Circle className="w-3 h-3 mr-1" />
              Circle
            </GenZButton>
          )}
          
          {/* Send Recognition/Props */}
          <GenZButton
            size="sm"
            variant="boost"
            onClick={(e) => {
              e.stopPropagation()
              onSignalClick(friend)
            }}
            glow
          >
            <Zap className="w-3 h-3 mr-1" />
            Props
          </GenZButton>
        </div>
      </div>
    </GenZCard>
  )
}

// All unused mock components removed

export default function YourCrewPage() {
  // Core state - Real HCS data only
  const [bondedContacts, setBondedContacts] = useState<BondedContact[]>([])
  const [trustLevels, setTrustLevels] = useState<Map<string, { allocatedTo: number, receivedFrom: number }>>(new Map())
  const [sessionId, setSessionId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  
  // GenZ UI state (simplified)
  const [sendSignalModalOpen, setSendSignalModalOpen] = useState(false)
  const [addFriendOpen, setAddFriendOpen] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [allocateTrustModalOpen, setAllocateTrustModalOpen] = useState(false)
  const [selectedContactForTrust, setSelectedContactForTrust] = useState<Friend | null>(null)
  
  // Professional state management
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showFirstTimeGuide, setShowFirstTimeGuide] = useState(false)
  
  // Professional data loading with enhanced error handling
  const loadContacts = async () => {
      when: 'Tonight 7pm',
      attendees: 45,
      icon: '💻',
      distance: '0.2 miles',
      vibe: 'Networking, demos'
    },
    {
      id: 'campus-2', 
      name: 'Study Session',
      location: 'Powell Library',
      when: 'Tomorrow 2pm',
      attendees: 12,
      icon: '📚',
      distance: '0.1 miles',
      vibe: 'CS 161 prep'
    },
    {
      id: 'campus-3',
      name: 'Coffee Chat',
      location: 'Blue Bottle',
      when: 'Friday 4pm',
      attendees: 8,
      icon: '☕',
      distance: '0.3 miles',
      vibe: 'Startup founders'
    }
  ]
  
  return (
    <div className="space-y-4">
      <GenZHeading level={4}>Campus Events</GenZHeading>
      <GenZText size="sm" dim className="mb-4">
        Real meetups happening near you
      </GenZText>
      
      <div className="space-y-3">
        {campusEvents.map((event) => (
          <GenZCard key={event.id} variant="glass" className={`p-4 ${genZClassNames.hoverScale} cursor-pointer`}>
            <div className="flex items-start gap-3">
              <div className="text-2xl">{event.icon}</div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <GenZText className="font-semibold">{event.name}</GenZText>
                  <GenZChip variant="neutral" className="text-xs">
                    {event.distance}
                  </GenZChip>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-3 h-3 text-pri-500" />
                  <GenZText size="sm" className="text-pri-500">{event.location}</GenZText>
                  <span className="text-genz-text-dim">•</span>
                  <GenZText size="sm" dim>{event.when}</GenZText>
                </div>
                
                <GenZText size="sm" dim className="mb-2">{event.vibe}</GenZText>
                
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3 text-sec-500" />
                  <GenZText size="sm" className="text-sec-500">
                    {event.attendees} going
                  </GenZText>
                </div>
              </div>
              
              <GenZButton size="sm" variant="signal" glow>
                <Eye className="w-3 h-3 mr-1" />
                Check out
              </GenZButton>
            </div>
          </GenZCard>
        ))}
      </div>
      
      <EventsSection />
    </div>
  )
}

// DiscoverSection - Places and activities for meeting people
function DiscoverSection() {
  const discoverySpots = [
    {
      id: 'spot-1',
      name: 'Starbucks Westwood',
      type: 'Coffee Shop',
      activity: '12 TrustMesh users checked in today',
      distance: '0.1 miles',
      vibe: 'Study vibes, laptop crowd',
      icon: '☕',
      busyLevel: 'busy'
    },
    {
      id: 'spot-2',
      name: 'UCLA Recreation Center', 
      type: 'Gym',
      activity: '8 users working out now',
      distance: '0.3 miles',
      vibe: 'Fitness community, group classes',
      icon: '💪',
      busyLevel: 'active'
    },
    {
      id: 'spot-3',
      name: 'The Hammer Museum',
      type: 'Cultural',
      activity: '3 users at current exhibition',
      distance: '0.5 miles', 
      vibe: 'Art lovers, deep conversations',
      icon: '🎨',
      busyLevel: 'chill'
    }
  ]
  
  const trendingActivities = [
    {
      id: 'activity-1',
      name: 'Late Night Library',
      description: 'Study groups forming organically',
      activeNow: 23,
      icon: '🌙'
    },
    {
      id: 'activity-2', 
      name: 'Food Truck Friday',
      description: 'Weekly meetup spot',
      activeNow: 18,
      icon: '🌮'
    }
  ]
  
  return (
    <div className="space-y-6">
      {/* Trending Places */}
      <div className="space-y-4">
        <GenZHeading level={4}>Places Near Me</GenZHeading>
        <GenZText size="sm" dim>
          Where TrustMesh people hang out IRL
        </GenZText>
        
        <div className="space-y-3">
          {discoverySpots.map((spot) => {
            const busyColors = {
              busy: 'text-boost-500',
              active: 'text-pri-500', 
              chill: 'text-sec-500'
            }
            
            return (
              <GenZCard key={spot.id} variant="glass" className={`p-4 ${genZClassNames.hoverScale} cursor-pointer`}>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{spot.icon}</div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <GenZText className="font-semibold">{spot.name}</GenZText>
                      <GenZChip variant="neutral" className="text-xs">
                        {spot.distance}
                      </GenZChip>
                    </div>
                    
                    <GenZText size="sm" className={`mb-1 ${busyColors[spot.busyLevel as keyof typeof busyColors]}`}>
                      {spot.activity}
                    </GenZText>
                    
                    <GenZText size="sm" dim className="mb-2">
                      {spot.vibe}
                    </GenZText>
                    
                    <GenZText size="sm" className="text-genz-text-dim">
                      {spot.type}
                    </GenZText>
                  </div>
                  
                  <GenZButton size="sm" variant="ghost" className="border border-pri-500/30">
                    <MapPin className="w-3 h-3 mr-1" />
                    Check in
                  </GenZButton>
                </div>
              </GenZCard>
            )
          })}
        </div>
      </div>
      
      {/* Trending Activities */}
      <div className="space-y-4">
        <GenZHeading level={4}>Trending Activities</GenZHeading>
        <GenZText size="sm" dim>
          What's happening right now
        </GenZText>
        
        <div className="space-y-2">
          {trendingActivities.map((activity) => (
            <GenZCard key={activity.id} variant="glass" className={`p-3 ${genZClassNames.hoverScale} cursor-pointer`}>
              <div className="flex items-center gap-3">
                <div className="text-xl">{activity.icon}</div>
                
                <div className="flex-1">
                  <GenZText className="font-semibold mb-1">{activity.name}</GenZText>
                  <GenZText size="sm" dim>{activity.description}</GenZText>
                </div>
                
                <div className="text-right">
                  <GenZText size="sm" className="text-boost-500 font-semibold">
                    {activity.activeNow}
                  </GenZText>
                  <GenZText size="sm" dim>
                    active now
                  </GenZText>
                </div>
              </div>
            </GenZCard>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function YourCrewPage() {
  // Core state
  const [bondedContacts, setBondedContacts] = useState<BondedContact[]>([])
  const [trustLevels, setTrustLevels] = useState<Map<string, { allocatedTo: number, receivedFrom: number }>>(new Map())
  const [sessionId, setSessionId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  
  // GenZ UI state (simplified)
  const [sendSignalModalOpen, setSendSignalModalOpen] = useState(false)
  const [addFriendOpen, setAddFriendOpen] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [allocateTrustModalOpen, setAllocateTrustModalOpen] = useState(false)
  const [selectedContactForTrust, setSelectedContactForTrust] = useState<Friend | null>(null)
  
  // Professional state management
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showFirstTimeGuide, setShowFirstTimeGuide] = useState(false)
  
  // Professional data loading with enhanced error handling
  const loadContacts = async () => {
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
      
      setBondedContacts(contacts)
      setTrustLevels(trustData)
      
      // Show first-time guide if no contacts
      if (contacts.length === 0) {
        setShowFirstTimeGuide(true)
      }
      
      console.log(`[GenZContacts] ✅ Loaded ${contacts.length} connections`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load your crew'
      console.error('[GenZContacts] ❌ Error:', error)
      setError(message)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }
  
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadContacts()
  }
  
  useEffect(() => {

    loadContacts()
    const unsubscribe = signalsStore.subscribe(loadContacts)
    return unsubscribe
  }, [])

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


  const handleSignalClick = (friend: Friend) => {
    setSelectedFriend(friend)
    setSendSignalModalOpen(true)
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

          {/* Campus Info */}
          <GenZCard variant="glass" className="p-3 mb-4">
            <div className="text-center">
              <GenZText size="sm" dim>
                Campus code: TM-UCLA • Your handle: @alex
              </GenZText>
            </div>
          </GenZCard>

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
      
      {/* Send Signal Modal */}
      {selectedFriend && (
        <SendSignalModal 
          isOpen={sendSignalModalOpen}
          onClose={() => {
            setSendSignalModalOpen(false)
            setSelectedFriend(null)
          }}
          recipient={{
            accountId: selectedFriend.id,
            knsName: selectedFriend.name,
            publicKey: '' // TODO: Get from contact data
          }}
        />
      )}
      
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
