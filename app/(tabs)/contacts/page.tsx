"use client"

import { useEffect, useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AddContactDialog } from "@/components/AddContactDialog"
import { ContactProfileSheet } from "@/components/ContactProfileSheet"
import { signalsStore } from "@/lib/stores/signalsStore"
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

  const { bonded, incoming, outgoing, all } = useMemo(() => {
    if (!sessionId) {
      return { bonded: [], incoming: [], outgoing: [], all: [] }
    }

    // Derive contacts from signals: group by peer, compute bonded, lastSeen, profileHrl
    const contacts = signalsStore.deriveContacts(sessionId) as ContactType[]
    
    const filter = (arr: ContactType[]) =>
      arr.filter(c => 
        q ? (
          c.handle?.toLowerCase().includes(q.toLowerCase()) || 
          c.peerId.includes(q)
        ) : true
      )

    // Get contact signals to determine pending states
    const flags = getRuntimeFlags()
    const contactSignals = signalsStore.getSignals({ 
      class: "contact",
      scope: flags.scope,
      sessionId
    })

    // Separate bonded from pending
    const bondedContacts = filter(contacts.filter(c => c.bonded))
    
    // Find contacts with only inbound requests (not accepted)
    const incomingRequests = filter(
      contacts.filter(c => {
        const hasInboundRequest = contactSignals.some(s => 
          s.type === "CONTACT_REQUEST" && 
          s.direction === "inbound" && 
          s.actors.from === c.peerId
        )
        const hasAccept = contactSignals.some(s => 
          s.type === "CONTACT_ACCEPT" && 
          (s.actors.from === c.peerId || s.actors.to === c.peerId)
        )
        return hasInboundRequest && !hasAccept
      })
    )
    
    // Find contacts with only outbound requests (not accepted)
    const outgoingRequests = filter(
      contacts.filter(c => {
        const hasOutboundRequest = contactSignals.some(s => 
          s.type === "CONTACT_REQUEST" && 
          s.direction === "outbound" && 
          s.actors.to === c.peerId
        )
        const hasAccept = contactSignals.some(s => 
          s.type === "CONTACT_ACCEPT" && 
          (s.actors.from === c.peerId || s.actors.to === c.peerId)
        )
        return hasOutboundRequest && !hasAccept
      })
    )

    return {
      bonded: bondedContacts,
      incoming: incomingRequests,
      outgoing: outgoingRequests,
      all: filter(contacts)
    }
  }, [q, sessionId])

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
