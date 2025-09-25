"use client"

import { useEffect, useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AddContactDialog } from "@/components/AddContactDialog"
import { ContactProfileSheet } from "@/components/ContactProfileSheet"
import { signalsStore } from "@/lib/stores/signalsStore"
import { hcsFeedService } from "@/lib/services/HCSFeedService"
import { getBondedContactsFromHCS } from "@/lib/services/HCSDataUtils"
import { getSessionId } from "@/lib/session"
import { getRuntimeFlags } from "@/lib/runtimeFlags"
import { seedDemo } from "@/lib/demo/seed"

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

export default function ContactsPage() {
  const [q, setQ] = useState("")
  const [activePeer, setActivePeer] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState("")

  // Initialize session and seed data
  useEffect(() => {
    const currentSessionId = getSessionId()
    setSessionId(currentSessionId)
    
    // Seed demo data if needed
    seedDemo(signalsStore, currentSessionId)
  }, [])

  // State for HCS events
  const [hcsEvents, setHcsEvents] = useState<any[]>([])
  
  // Load HCS events
  useEffect(() => {
    if (!sessionId) return
    
    const loadHCSData = async () => {
      try {
        const events = await hcsFeedService.getAllFeedEvents()
        setHcsEvents(events)
      } catch (error) {
        console.error('[ContactsPage] Failed to load HCS events:', error)
        setHcsEvents([])
      }
    }
    
    loadHCSData()
    
    // Poll for updates
    const interval = setInterval(() => {
      if (hcsFeedService.isReady()) {
        loadHCSData()
      }
    }, 5000)
    
    return () => clearInterval(interval)
  }, [sessionId])

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

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <Input 
          placeholder="Search contacts" 
          value={q} 
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 bg-background text-foreground placeholder:text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]"
        />
        <AddContactDialog />
      </div>

      <Section title={`Bonded (${bonded.length})`}>
        {bonded.length === 0 ? (
          <Empty text="No bonded contacts yet. Add via QR to unlock trust." />
        ) : (
          bonded.map(c => (
            <Row 
              key={c.peerId} 
              c={c} 
              onOpen={() => setActivePeer(c.peerId)} 
            />
          ))
        )}
      </Section>

      <Section title={`Incoming requests (${incoming.length})`}>
        {incoming.length === 0 ? (
          <Empty text="No incoming requests." />
        ) : (
          incoming.map(c => (
            <Row 
              key={c.peerId} 
              c={c} 
              onOpen={() => setActivePeer(c.peerId)} 
              pending="in" 
            />
          ))
        )}
      </Section>

      <Section title={`Outgoing invites (${outgoing.length})`}>
        {outgoing.length === 0 ? (
          <Empty text="No outgoing invites." />
        ) : (
          outgoing.map(c => (
            <Row 
              key={c.peerId} 
              c={c} 
              onOpen={() => setActivePeer(c.peerId)} 
              pending="out" 
            />
          ))
        )}
      </Section>

      <Section title={`All contacts (${all.length})`}>
        {all.length === 0 ? (
          <Empty text="No contacts yet." />
        ) : (
          all.map(c => (
            <Row 
              key={c.peerId} 
              c={c} 
              onOpen={() => setActivePeer(c.peerId)} 
            />
          ))
        )}
      </Section>

      <ContactProfileSheet
        peerId={activePeer}
        onClose={() => setActivePeer(null)}
      />
    </div>
  )
}
