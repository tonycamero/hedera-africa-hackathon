"use client"

import { useEffect, useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { AddContactDialog } from "@/components/AddContactDialog"
import { ContactProfileSheet } from "@/components/ContactProfileSheet"
import { signalsStore } from "@/lib/stores/signalsStore"
import { getBondedContactsFromHCS } from "@/lib/services/HCSDataUtils"
import { getSessionId } from "@/lib/session"
import { getRuntimeFlags } from "@/lib/runtimeFlags"
import { seedDemo } from "@/lib/demo/seed"
import { 
  Users, 
  Search, 
  Share2, 
  MessageCircle, 
  Calendar, 
  Heart, 
  UserPlus,
  Zap,
  MapPin,
  Star,
  Sparkles
} from "lucide-react"
import { toast } from "sonner"

type ContactType = {
  peerId: string
  handle: string
  bonded: boolean
  lastSeen?: string
  profileHrl?: string
  trustWeightOut?: number
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-[hsl(var(--secondary-foreground))] mb-2">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="text-xs text-[hsl(var(--muted-foreground))] border border-dashed rounded p-3">
      {text}
    </div>
  )
}

function Row({ 
  c, 
  onOpen, 
  pending 
}: { 
  c: ContactType; 
  onOpen: () => void; 
  pending?: "in" | "out" 
}) {
  return (
    <Card className="bg-card border border-[hsl(var(--border))]/80 hover:border-primary/50 cursor-pointer" onClick={onOpen}>
      <CardContent className="p-3 flex items-center gap-3">
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-blue-100 text-blue-600">
            {(c.handle || c.peerId).slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="text-sm font-medium text-foreground">
            {c.handle || c.peerId}
          </div>
          <div className="text-xs text-[hsl(var(--muted-foreground))]">
            {c.lastSeen || "—"}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {pending === "in" && (
            <Badge className="bg-amber-400/20 text-amber-300">
              Request
            </Badge>
          )}
          {pending === "out" && (
            <Badge className="bg-blue-400/20 text-blue-300">
              Invited
            </Badge>
          )}
          {c.bonded && (
            <Badge className="bg-emerald-400/20 text-emerald-300">
              Bonded
            </Badge>
          )}
          {c.trustWeightOut && c.trustWeightOut > 0 && (
            <Badge className="bg-emerald-400/20 text-emerald-300">
              Trust {c.trustWeightOut}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function SocialFeedPage() {
  const [q, setQ] = useState("")
  const [activePeer, setActivePeer] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState("")
  const [hcsEvents, setHcsEvents] = useState<any[]>([])  
  const [showEventModal, setShowEventModal] = useState(false)

  // Load data from SignalsStore (single source of truth)
  useEffect(() => {
    const loadFromSignalsStore = () => {
      try {
        const currentSessionId = getSessionId()
        setSessionId(currentSessionId)
        console.log('🚀 [ContactsPage] Loading from SignalsStore (single source)...')
        console.log('📋 [ContactsPage] Session ID:', currentSessionId)
        
        // Get all events from SignalsStore
        const allStoreEvents = signalsStore.getAll()
        
        console.log('📡 [ContactsPage] Loaded', allStoreEvents.length, 'events from SignalsStore')
        
        // Set events for contact processing
        setHcsEvents(allStoreEvents)
        
        console.log('✅ [ContactsPage] Data loaded from SignalsStore:', {
          events: allStoreEvents.length,
          session: currentSessionId
        })
        
      } catch (error) {
        console.error('❌ [ContactsPage] SignalsStore load failed:', error)
        const currentSessionId = getSessionId()
        setSessionId(currentSessionId)
        setHcsEvents([])
      }
    }
    
    // Initial load
    loadFromSignalsStore()
    
    // Subscribe to SignalsStore changes
    const unsubscribe = signalsStore.subscribe(() => {
      console.log('📡 [ContactsPage] SignalsStore updated, refreshing...')
      loadFromSignalsStore()
    })
    
    return unsubscribe
  }, [])

  const { bonded, incoming, outgoing, all } = useMemo(() => {
    if (!sessionId) {
      return { bonded: [], incoming: [], outgoing: [], all: [] }
    }

    // Use ONLY HCS events for consistency with Circle page - no local signalsStore mixing
    const hcsBondedContacts = getBondedContactsFromHCS(hcsEvents, sessionId)
    
    // Convert HCS bonded contacts to ContactType format
    const contacts: ContactType[] = hcsBondedContacts.map(contact => ({
      peerId: contact.peerId,
      handle: contact.handle || contact.peerId,
      bonded: true, // All from getBondedContactsFromHCS are bonded
      lastSeen: new Date(contact.bondedAt).toLocaleDateString(),
      profileHrl: undefined,
      trustWeightOut: contact.trustLevel
    }))
    
    // Get pending requests from HCS events only (no local mixing)
    const contactEvents = hcsEvents.filter(e => e.class === 'contact')
    const pendingContacts: ContactType[] = []
    
    const filter = (arr: ContactType[]) =>
      arr.filter(c => 
        q ? (
          c.handle?.toLowerCase().includes(q.toLowerCase()) || 
          c.peerId.includes(q)
        ) : true
      )

    // Process HCS contact events to find pending states
    const requestMap = new Map<string, { hasRequest: boolean; hasAccept: boolean; isInbound: boolean }>()
    
    contactEvents.forEach(event => {
      const isInbound = event.actors.to === sessionId
      const isOutbound = event.actors.from === sessionId
      
      if (!isInbound && !isOutbound) return
      
      const peerId = isInbound ? event.actors.from : event.actors.to
      if (!peerId) return
      
      if (!requestMap.has(peerId)) {
        requestMap.set(peerId, { hasRequest: false, hasAccept: false, isInbound: false })
      }
      
      const entry = requestMap.get(peerId)!
      
      if (event.type === 'CONTACT_REQUEST') {
        entry.hasRequest = true
        entry.isInbound = isInbound
      } else if (event.type === 'CONTACT_ACCEPT') {
        entry.hasAccept = true
      }
    })
    
    // Find pending contacts (requests without accepts)
    const incomingRequests: ContactType[] = []
    const outgoingRequests: ContactType[] = []
    
    requestMap.forEach((entry, peerId) => {
      if (entry.hasRequest && !entry.hasAccept) {
        const contact: ContactType = {
          peerId,
          handle: `User ${peerId.slice(-6)}`,
          bonded: false,
          lastSeen: 'Pending',
          trustWeightOut: 0
        }
        
        if (entry.isInbound) {
          incomingRequests.push(contact)
        } else {
          outgoingRequests.push(contact)
        }
      }
    })

    // Use HCS bonded contacts only (no duplicates)
    const bondedContacts = filter(contacts)

    console.log('[ContactsPage] Debug data:')
    console.log('  - HCS Events:', hcsEvents.length)
    console.log('  - Contact Events:', contactEvents.length)
    console.log('  - HCS Bonded Contacts:', hcsBondedContacts)
    console.log('  - Request Map:', Object.fromEntries(requestMap))
    console.log('  - Incoming Requests:', incomingRequests)
    console.log('  - Outgoing Requests:', outgoingRequests)
    
    return {
      bonded: bondedContacts,
      incoming: filter(incomingRequests),
      outgoing: filter(outgoingRequests),
      all: filter([...contacts, ...incomingRequests, ...outgoingRequests])
    }
  }, [q, sessionId, hcsEvents])

  // Mock social data for demo
  const mockCommunityFeed = [
    {
      type: "event",
      title: "Campus Fair",
      description: "Join to Connect!",
      participants: 42,
      icon: Calendar,
      color: "neon-coral"
    },
    {
      type: "event", 
      title: "Study Group",
      description: "CS Students Meetup",
      participants: 18,
      icon: Users,
      color: "neon-orange"
    }
  ]

  const mockSuggestions = [
    {
      peerId: "sarah-kim",
      handle: "Sarah Kim",
      mutuals: 3,
      trustScore: "High",
      context: "From Campus Fair",
      avatar: "SK"
    },
    {
      peerId: "mike-rivera", 
      handle: "Mike Rivera",
      mutuals: 1,
      trustScore: "Medium",
      context: "From Study Group",
      avatar: "MR"
    },
    {
      peerId: "alex-chen",
      handle: "Alex Chen", 
      mutuals: 5,
      trustScore: "High",
      context: "Mutual Friend",
      avatar: "AC"
    }
  ]

  const handleJoinEvent = (eventTitle: string) => {
    toast.success(`🎉 Joined ${eventTitle}!`, {
      description: "You'll get notified when others join too"
    })
  }

  const handleAddContact = (contact: any) => {
    toast.success(`✨ Added ${contact.handle}!`, {
      description: "Sent connection request with context"
    })
  }

  const handleShareInvite = (contact: any) => {
    toast.info(`🔗 Invite link created for ${contact.handle}`, {
      description: "Share to boost your mutual network!"
    })
  }

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-6">
      {/* Social Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-neon-coral" />
            Social Contacts
          </h1>
          <p className="text-sm text-white/60">Discover & connect with your community</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-neon-coral/20 hover:bg-neon-coral/30 text-neon-coral border border-neon-coral/30">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Community Feed Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-white/80 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-neon-orange" />
          Community Feed
        </h2>
        
        {mockCommunityFeed.map((event, i) => {
          const IconComponent = event.icon
          return (
            <Card key={i} className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 hover:border-orange-500/50 cursor-pointer transition-all duration-300 hover:scale-[1.02]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-${event.color}/20 flex items-center justify-center`}>
                      <IconComponent className={`w-5 h-5 text-${event.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{event.title}</h3>
                      <p className="text-xs text-white/60">{event.description}</p>
                    </div>
                  </div>
                  <Badge className="bg-neon-orange/20 text-neon-orange border border-neon-orange/30">
                    <Users className="w-3 h-3 mr-1" />
                    {event.participants}
                  </Badge>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleJoinEvent(event.title)}
                  className="w-full bg-gradient-to-r from-orange-500/80 to-red-500/80 hover:from-orange-500 hover:to-red-500 text-white font-medium"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Join & Add Contacts
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Suggestions Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-white/80 flex items-center gap-2">
          <Zap className="w-4 h-4 text-neon-peach" />
          Suggested Connections
        </h2>
        
        {mockSuggestions.map((contact, i) => (
          <Card key={i} className="bg-card/50 border border-orange-400/20 hover:border-orange-400/40 cursor-pointer transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-12 h-12 ring-2 ring-orange-400/30">
                  <AvatarFallback className="bg-gradient-to-br from-orange-500/20 to-red-500/20 text-orange-300 font-bold">
                    {contact.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{contact.handle}</h3>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs">
                      {contact.trustScore} Trust
                    </Badge>
                  </div>
                  <p className="text-xs text-white/60">{contact.mutuals} mutual connections</p>
                  <p className="text-xs text-orange-300">{contact.context}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleAddContact(contact)}
                  className="flex-1 bg-neon-coral/20 hover:bg-neon-coral/30 text-neon-coral border border-neon-coral/30"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Add & Chat
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleShareInvite(contact)}
                  className="border-orange-400/30 text-orange-300 hover:bg-orange-400/10"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Your Network Summary */}
      <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-neon-coral" />
              Your Network
            </h3>
            <Badge className="bg-neon-orange/20 text-neon-orange border border-neon-orange/30">
              {bonded.length} Connected
            </Badge>
          </div>
          <p className="text-sm text-white/60 mb-3">
            {bonded.length > 0 ? `Tap to message your ${bonded.length} connections` : "Start building your trust network!"}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {bonded.slice(0, 4).map((contact, i) => (
                <Avatar key={i} className="w-8 h-8 ring-2 ring-background" onClick={() => setActivePeer(contact.peerId)}>
                  <AvatarFallback className="bg-gradient-to-br from-orange-500/20 to-red-500/20 text-orange-300 text-xs">
                    {contact.handle.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {bonded.length > 4 && (
                <div className="w-8 h-8 rounded-full bg-muted ring-2 ring-background flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">+{bonded.length - 4}</span>
                </div>
              )}
            </div>
            <Button size="sm" variant="outline" className="border-orange-400/30 text-orange-300 hover:bg-orange-400/10">
              <MessageCircle className="w-4 h-4 mr-1" />
              Message All
            </Button>
          </div>
        </CardContent>
      </Card>

      <ContactProfileSheet
        peerId={activePeer}
        onClose={() => setActivePeer(null)}
      />
    </div>
  )
}
