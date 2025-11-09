# 📘 TRUSTMESH × XMTP INTEGRATION OVERVIEW

**Codebase:** `trustmesh_hackathon`  
**Objective Window:** Nov – Dec 2025  
**Owner:** Scend Tech / Tony Camero  
**Agent of Record:** Warp.dev

---

## 🔭 1. Technical Trajectory – High-Level Arc

| Phase | Codename                        | Goal                                                                 | Key Deliverables                                                                              |
| ----- | ------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **0** | Baseline Freeze                 | Freeze HCS core + SignalsStore v1                                    | Confirm ingestion and contact bonding stable; tag repo `pre-xmtp`.                            |
| **1** | **Sidecar XMTP** 🚀 (Nov)       | Add real-time chat layer on top of dual-key identity (EVM + Hedera). | Messaging tab, dual-key identity, Magic signer + XMTP client, HCS contacts as messaging list. |
| **2** | Context Threads (Jan 2026)      | Fuse messages ↔ trust events via ContextEngine.                      | NLP intent detection + suggestion chips ("Send Recognition").                                 |
| **3** | Anchored Messaging (Feb 2026)   | Optional HCS hash anchoring for auditability.                        | `anchorService`, verify-on-Hedera UI.                                                         |
| **4** | Intelligence Loop (Spring 2026) | Full context awareness + TRST-based incentives.                      | Sentiment loops, badges, streaks, zk-proof reputation.                                        |

### System Roles

* **Hedera HCS = Economic Memory** (immutable trust & recognition).
* **XMTP = Social Nervous System** (real-time encrypted communication).
* **Context Engine = Cognitive Bridge** (links messages ↔ on-chain events).

### Guiding Principles

* **Dual-Key Sovereignty:** EVM key = human expression (XMTP); Hedera key = ledger auth.
* **Bounded Experiments:** Every feature can be rolled back without risk to HCS state.
* **Normie UX:** No wallet pop-ups, no signatures for chat. Everything happens behind Magic auth.

---

## ⚙️ 2. Phase 1 – Sidecar XMTP Sprint Plan

**Duration:** ≈ 3 weeks  
**Goal:** Deliver a working, opt-in messaging layer that uses XMTP for bonded HCS contacts — no SignalsStore changes.

---

### 🧩 Deliverables Summary

1. **Dual-Key Identity**
   * `ScendIdentity` type → `{ evmAddress, hederaAccountId, xmtpEnabled?, xmtpInboxId? }`
   * `resolveScendIdentity()` pulls from Magic + HCS-22.

2. **XMTP Client & Hook**
   * `getXmtpClient()` singleton using Magic signer.
   * `useXmtpClient(identity)` hook for React components.

3. **Identity Provider**
   * Global React context exposing `{ identity, xmtpClient }` throughout the app.

4. **Messaging UI**
   * `/messages` tab in App Router.
   * `ConversationList` + `MessageThread` + `MessageComposer`.

5. **Contact Integration**
   * Messages tab lists only HCS-bonded contacts (`CONTACT_ACCEPT`).
   * Each contact resolved to EVM address via HCS-22; check XMTP reachability (`canMessage`).
   * Non-reachable → "Invite to Messaging".

6. **Feature Flag & Safety**
   * `NEXT_PUBLIC_XMTP_ENABLED` (default false).
   * Fail-soft behavior → no break to Circle/Recognition flows.

---

## 🧱 3. Ticket Pack (Implementation Checklist)

### Sprint Week 1: Foundation

#### **T1: Add Dependencies & Flag**
```bash
# Install XMTP SDK and ethers for signing
pnpm add @xmtp/xmtp-js ethers

# Add to .env.local:
NEXT_PUBLIC_XMTP_ENABLED=false  # Start disabled
NEXT_PUBLIC_XMTP_ENV=dev        # Use dev network for testing
```

**Files to create:**
- `lib/config/xmtp.ts` - Export `XMTP_ENABLED`, `XMTP_ENV` from env vars

**Acceptance:**
- [ ] App builds with flag true/false
- [ ] No errors when XMTP imports are present but flag is false

---

#### **T2: Define `ScendIdentity` & Resolver**
**Create:** `lib/identity/ScendIdentity.ts`
```typescript
export interface ScendIdentity {
  evmAddress: string              // Magic wallet (0x...)
  hederaAccountId: string         // HCS-22 resolved (0.0.xxxxx)
  handle: string                  // Display name
  profileHrl: string              // hcs://11/{topic}/{id}
  xmtpEnabled?: boolean           // Has XMTP keys provisioned
  xmtpInboxId?: string            // XMTP installation ID
  canSignXMTP: boolean            // Can sign XMTP messages
  canSignHedera: boolean          // Has Hedera operator access
}

export interface HCS22Binding {
  topicId: string
  consensusTimestamp: string
  evmAddress: string
  hederaAccountId: string
  verified: boolean
}
```

**Create:** `lib/identity/resolveScendIdentity.ts`
```typescript
export async function resolveScendIdentity(): Promise<ScendIdentity> {
  // 1. Get Magic.link user
  const magic = await import('@/lib/magic')
  const isLoggedIn = await magic.magic?.user.isLoggedIn()
  
  if (!isLoggedIn) throw new Error('Not authenticated')
  
  const metadata = await magic.magic!.user.getInfo()
  const evmAddress = metadata.publicAddress!
  
  // 2. Resolve Hedera account via HCS-22
  const hederaAccountId = await getResolvedAccountId() // existing helper
  
  if (!hederaAccountId) {
    throw new Error('No Hedera account binding found')
  }
  
  // 3. Check XMTP provisioning (future)
  const xmtpEnabled = false // Phase 1: default false
  
  return {
    evmAddress,
    hederaAccountId,
    handle: metadata.email?.split('@')[0] || 'User',
    profileHrl: `hcs://11/${TOPIC_PROFILE}/${hederaAccountId}`,
    xmtpEnabled,
    canSignXMTP: true,  // Magic can always sign
    canSignHedera: true // Assume operator access
  }
}
```

**Acceptance:**
- [ ] `resolveScendIdentity()` returns valid EVM + Hedera IDs
- [ ] Throws error if not authenticated
- [ ] TypeScript types exported correctly

---

#### **T3: XMTP Client Helper**
**Create:** `lib/xmtp/client.ts`
```typescript
import { Client } from '@xmtp/xmtp-js'
import { Wallet } from 'ethers'
import { XMTP_ENABLED, XMTP_ENV } from '@/lib/config/xmtp'

let cachedClient: Client | null = null

export async function getXmtpClient(evmAddress: string): Promise<Client | null> {
  if (!XMTP_ENABLED) {
    console.warn('[XMTP] Feature disabled')
    return null
  }
  
  if (cachedClient) return cachedClient
  
  try {
    // Get Magic signer
    const { magic } = await import('@/lib/magic')
    if (!magic) throw new Error('Magic not initialized')
    
    // Create ethers Wallet from Magic provider
    const provider = await magic.wallet.getProvider()
    const ethersProvider = new ethers.providers.Web3Provider(provider)
    const signer = ethersProvider.getSigner()
    
    // Initialize XMTP client
    const client = await Client.create(signer, { env: XMTP_ENV })
    cachedClient = client
    
    console.log('[XMTP] Client initialized for:', evmAddress)
    return client
    
  } catch (error) {
    console.error('[XMTP] Failed to initialize client:', error)
    return null
  }
}

export function clearXmtpClient() {
  cachedClient = null
}
```

**Acceptance:**
- [ ] Client initializes with Magic signer
- [ ] Returns null if flag disabled (no crash)
- [ ] Singleton pattern works (cache)

---

### Sprint Week 2: Hooks & Context

#### **T4: React Hook `useXmtpClient`**
**Create:** `lib/xmtp/hooks/useXmtpClient.ts`
```typescript
'use client'

import { useState, useEffect } from 'react'
import { Client } from '@xmtp/xmtp-js'
import { getXmtpClient, clearXmtpClient } from '../client'

export function useXmtpClient(evmAddress?: string) {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    if (!evmAddress) {
      setLoading(false)
      return
    }
    
    let mounted = true
    
    async function initClient() {
      try {
        setLoading(true)
        const xmtpClient = await getXmtpClient(evmAddress)
        
        if (mounted) {
          setClient(xmtpClient)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error)
          setClient(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    initClient()
    
    return () => {
      mounted = false
      clearXmtpClient() // Cleanup on unmount
    }
  }, [evmAddress])
  
  return { client, loading, error }
}
```

**Acceptance:**
- [ ] Hook manages loading/error state
- [ ] Cleans up on unmount
- [ ] Works with null evmAddress

---

#### **T5: Identity Provider Context**
**Create:** `app/providers/IdentityProvider.tsx`
```typescript
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ScendIdentity, resolveScendIdentity } from '@/lib/identity/ScendIdentity'
import { useXmtpClient } from '@/lib/xmtp/hooks/useXmtpClient'
import { Client } from '@xmtp/xmtp-js'

interface IdentityContextValue {
  identity: ScendIdentity | null
  xmtpClient: Client | null
  loading: boolean
  error: Error | null
}

const IdentityContext = createContext<IdentityContextValue>({
  identity: null,
  xmtpClient: null,
  loading: true,
  error: null
})

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<ScendIdentity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  // Initialize identity
  useEffect(() => {
    async function init() {
      try {
        const resolved = await resolveScendIdentity()
        setIdentity(resolved)
      } catch (err) {
        console.warn('[IdentityProvider] Failed to resolve identity:', err)
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }
    
    init()
  }, [])
  
  // Initialize XMTP client if identity resolved
  const { client: xmtpClient } = useXmtpClient(identity?.evmAddress)
  
  return (
    <IdentityContext.Provider value={{ identity, xmtpClient, loading, error }}>
      {children}
    </IdentityContext.Provider>
  )
}

export function useIdentity() {
  return useContext(IdentityContext)
}
```

**Modify:** `app/layout.tsx`
```typescript
import { IdentityProvider } from './providers/IdentityProvider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <IdentityProvider>
          {/* existing providers */}
          {children}
        </IdentityProvider>
      </body>
    </html>
  )
}
```

**Acceptance:**
- [ ] Identity resolves on app load
- [ ] XMTP client initializes if identity present
- [ ] `useIdentity()` hook works in any component

---

### Sprint Week 3: UI & Integration

#### **T6: Messages Tab Routing**
**Create:** `app/(tabs)/messages/page.tsx`
```typescript
'use client'

import { useIdentity } from '@/app/providers/IdentityProvider'
import { XMTP_ENABLED } from '@/lib/config/xmtp'

export default function MessagesPage() {
  const { identity, xmtpClient, loading } = useIdentity()
  
  if (!XMTP_ENABLED) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Messaging Disabled</h1>
        <p className="text-muted-foreground">
          XMTP messaging is currently disabled. Contact admin to enable.
        </p>
      </div>
    )
  }
  
  if (loading) {
    return <div className="p-8">Loading identity...</div>
  }
  
  if (!identity) {
    return <div className="p-8">Please log in to access messaging.</div>
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Messages</h1>
      
      {!xmtpClient ? (
        <div className="text-center p-8">
          <p>XMTP client not initialized. Check console for errors.</p>
        </div>
      ) : (
        <div>
          <p>Identity: {identity.evmAddress}</p>
          <p>Hedera: {identity.hederaAccountId}</p>
          <p>XMTP: Ready ✅</p>
          {/* T7-T9: Replace with ConversationList */}
        </div>
      )}
    </div>
  )
}
```

**Modify:** `app/(tabs)/layout.tsx` - Add Messages tab
```typescript
// Add to navigation
<Link href="/messages">
  <MessageCircle className="w-5 h-5" />
  <span>Messages</span>
</Link>
```

**Acceptance:**
- [ ] `/messages` route works
- [ ] Shows "disabled" message if flag off
- [ ] Shows identity + XMTP status if flag on

---

#### **T7: Contact Resolver Service**
**Create:** `lib/services/contactsForMessaging.ts`
```typescript
import { signalsStore } from '@/lib/stores/signalsStore'
import { getResolvedAccountId } from '@/lib/session'
import { Client } from '@xmtp/xmtp-js'

export interface MessagingContact {
  hederaAccountId: string
  evmAddress?: string
  handle: string
  canMessage: boolean
  bondedAt: number
}

export async function getContactsForMessaging(
  xmtpClient: Client | null
): Promise<MessagingContact[]> {
  // 1. Get bonded contacts from SignalsStore
  const sessionId = await getResolvedAccountId()
  if (!sessionId) return []
  
  const bondEvents = signalsStore.getAll().filter(e => 
    e.type === 'CONTACT_ACCEPT' && 
    (e.actor === sessionId || e.target === sessionId)
  )
  
  const contacts: MessagingContact[] = []
  
  for (const event of bondEvents) {
    const peerId = event.actor === sessionId ? event.target : event.actor
    if (!peerId) continue
    
    // 2. Resolve Hedera → EVM via HCS-22
    // TODO: Implement reverse lookup in identity resolver
    // For now, use placeholder
    const evmAddress = undefined
    
    // 3. Check XMTP reachability
    let canMessage = false
    if (xmtpClient && evmAddress) {
      try {
        canMessage = await xmtpClient.canMessage(evmAddress)
      } catch (err) {
        console.warn(`[Contacts] Can't check XMTP for ${peerId}:`, err)
      }
    }
    
    contacts.push({
      hederaAccountId: peerId,
      evmAddress,
      handle: event.metadata?.handle || `User ${peerId.slice(-6)}`,
      canMessage,
      bondedAt: event.ts
    })
  }
  
  return contacts
}
```

**Acceptance:**
- [ ] Returns bonded HCS contacts
- [ ] Checks XMTP reachability (canMessage)
- [ ] Handles missing EVM addresses gracefully

---

#### **T8: Conversation List UI**
**Create:** `components/messages/ConversationList.tsx`
```typescript
'use client'

import { useEffect, useState } from 'react'
import { MessagingContact, getContactsForMessaging } from '@/lib/services/contactsForMessaging'
import { useIdentity } from '@/app/providers/IdentityProvider'
import { Button } from '@/components/ui/button'
import { MessageCircle, UserPlus } from 'lucide-react'

export function ConversationList() {
  const { xmtpClient } = useIdentity()
  const [contacts, setContacts] = useState<MessagingContact[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function loadContacts() {
      setLoading(true)
      const contactList = await getContactsForMessaging(xmtpClient)
      setContacts(contactList)
      setLoading(false)
    }
    
    loadContacts()
  }, [xmtpClient])
  
  if (loading) {
    return <div className="p-4">Loading contacts...</div>
  }
  
  if (contacts.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground mb-4">
          No bonded contacts yet. Add contacts in the Contacts tab first.
        </p>
      </div>
    )
  }
  
  return (
    <div className="space-y-2">
      {contacts.map(contact => (
        <div key={contact.hederaAccountId} className="p-4 border rounded-lg flex justify-between items-center">
          <div>
            <p className="font-semibold">{contact.handle}</p>
            <p className="text-sm text-muted-foreground">{contact.hederaAccountId}</p>
          </div>
          
          {contact.canMessage ? (
            <Button>
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </Button>
          ) : (
            <Button variant="outline" disabled>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite to Messaging
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
```

**Update:** `app/(tabs)/messages/page.tsx` to use `<ConversationList />`

**Acceptance:**
- [ ] Lists bonded HCS contacts
- [ ] Shows "Message" or "Invite" based on canMessage
- [ ] Handles empty state

---

#### **T9: Thread View & Composer**
**Create:** `app/(tabs)/messages/[id]/page.tsx`
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useIdentity } from '@/app/providers/IdentityProvider'
import { MessageThread } from '@/components/messages/MessageThread'
import { MessageComposer } from '@/components/messages/MessageComposer'

export default function ThreadPage() {
  const { id } = useParams()
  const { xmtpClient } = useIdentity()
  const [conversation, setConversation] = useState<any>(null)
  
  useEffect(() => {
    async function loadConversation() {
      if (!xmtpClient) return
      
      // Get conversation by peer address (id = EVM address)
      const conv = await xmtpClient.conversations.newConversation(id as string)
      setConversation(conv)
    }
    
    loadConversation()
  }, [id, xmtpClient])
  
  if (!conversation) {
    return <div className="p-4">Loading conversation...</div>
  }
  
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto">
        <MessageThread conversation={conversation} />
      </div>
      <div className="border-t p-4">
        <MessageComposer conversation={conversation} />
      </div>
    </div>
  )
}
```

**Create:** `components/messages/MessageThread.tsx`
```typescript
'use client'

import { useState, useEffect } from 'react'
import { MessageBubble } from './MessageBubble'

export function MessageThread({ conversation }: { conversation: any }) {
  const [messages, setMessages] = useState<any[]>([])
  
  useEffect(() => {
    async function loadMessages() {
      const msgs = await conversation.messages()
      setMessages(msgs)
    }
    
    loadMessages()
    
    // Subscribe to new messages
    const stream = conversation.streamMessages()
    ;(async () => {
      for await (const msg of stream) {
        setMessages(prev => [...prev, msg])
      }
    })()
    
    return () => stream.return()
  }, [conversation])
  
  return (
    <div className="space-y-4 p-4">
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </div>
  )
}
```

**Create:** `components/messages/MessageBubble.tsx`
```typescript
export function MessageBubble({ message }: { message: any }) {
  const isSent = message.senderAddress === 'me' // TODO: compare with identity
  
  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-md p-3 rounded-lg ${
        isSent ? 'bg-primary text-primary-foreground' : 'bg-muted'
      }`}>
        <p>{message.content}</p>
        <p className="text-xs opacity-70 mt-1">
          {new Date(message.sent).toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}
```

**Create:** `components/messages/MessageComposer.tsx`
```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'

export function MessageComposer({ conversation }: { conversation: any }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  
  async function handleSend() {
    if (!message.trim()) return
    
    setSending(true)
    try {
      await conversation.send(message)
      setMessage('')
    } catch (err) {
      console.error('[Composer] Failed to send:', err)
    } finally {
      setSending(false)
    }
  }
  
  return (
    <div className="flex gap-2">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="flex-1"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
          }
        }}
      />
      <Button onClick={handleSend} disabled={sending || !message.trim()}>
        <Send className="w-4 h-4" />
      </Button>
    </div>
  )
}
```

**Acceptance:**
- [ ] Thread view loads messages
- [ ] New messages appear in real-time
- [ ] Composer sends messages
- [ ] Enter key sends (Shift+Enter for new line)

---

#### **T10: Smoke & Integration Tests**
**Create:** `__tests__/xmtp-integration.test.ts`
```typescript
import { describe, it, expect } from '@jest/globals'
import { resolveScendIdentity } from '@/lib/identity/ScendIdentity'
import { getXmtpClient } from '@/lib/xmtp/client'

describe('XMTP Integration', () => {
  it('should resolve identity with EVM + Hedera', async () => {
    // Mock Magic auth
    const identity = await resolveScendIdentity()
    expect(identity.evmAddress).toMatch(/^0x[a-fA-F0-9]{40}$/)
    expect(identity.hederaAccountId).toMatch(/^0\.0\.\d+$/)
  })
  
  it('should initialize XMTP client with Magic signer', async () => {
    const client = await getXmtpClient('0x1234...')
    expect(client).toBeDefined()
  })
  
  it('should fail gracefully when XMTP disabled', async () => {
    process.env.NEXT_PUBLIC_XMTP_ENABLED = 'false'
    const client = await getXmtpClient('0x1234...')
    expect(client).toBeNull()
  })
})
```

**Manual Test Checklist:**
- [ ] Two Magic users can authenticate
- [ ] Both see each other in contacts list (after HCS bond)
- [ ] User A can send message to User B
- [ ] User B receives message in real-time
- [ ] If XMTP fails, Circle/Recognition tabs still work

---

## 🎯 4. Acceptance Definition for Sidecar XMTP v0.1

✅  App builds with XMTP flag on/off.  
✅  Dual-key identity resolves correctly (EVM + Hedera).  
✅  HCS-bonded contacts load with reachability status.  
✅  Users can send and receive messages via XMTP.  
✅  No changes made to SignalsStore or HCS pipeline.  
✅  All errors fail softly; core app continues to run.  
✅  Git tag `xmtp-sidecar-v0.1` on successful merge.

---

## 🧠 5. Next Sprint Preview (For Warp to Stage)

**Phase 2 – Context Threads (Milestone Dec–Jan)**

* Add `messageAnalyzer` (NLP intent stub).
* ContextEngine hook `onMessage()` → surface suggestion chips.
* `SignalsStore` extended with `MESSAGE_WITH_*` types.
* A/B metrics: thread-to-action rate and t₁ time-to-first-message.

---

## 📍 Repo Actions for Warp Now

1. ✅ Finish merging outstanding pre-XMTP branches (DONE)
2. ✅ Create new branch `feature/xmtp-sidecar-v0.1` (DONE - using feature/xmtp-nervous-system)
3. 🚀 Implement tickets T1 → T10 in order
4. 🚀 Commit + push to GitHub with descriptive messages
5. 🚀 Tag on merge: `xmtp-sidecar-v0.1`

---

## 📊 Sprint Execution Tracking

| Ticket | Status | Assignee | Notes |
|--------|--------|----------|-------|
| T1 | 🟡 Ready | Warp | Dependencies + config |
| T2 | ⚪ Blocked | Warp | Depends on T1 |
| T3 | ⚪ Blocked | Warp | Depends on T2 |
| T4 | ⚪ Blocked | Warp | Depends on T3 |
| T5 | ⚪ Blocked | Warp | Depends on T4 |
| T6 | ⚪ Blocked | Warp | Depends on T5 |
| T7 | ⚪ Blocked | Warp | Depends on T5 |
| T8 | ⚪ Blocked | Warp | Depends on T7 |
| T9 | ⚪ Blocked | Warp | Depends on T8 |
| T10 | ⚪ Blocked | Warp | Final validation |

**Legend:**  
🟢 Complete | 🟡 Ready | 🔵 In Progress | ⚪ Blocked | 🔴 Blocked (Issue)

---

**Status**: 🚀 Ready for T1 Execution  
**Branch**: `feature/xmtp-nervous-system`  
**Last Updated**: 2025-11-09  
**Next Review**: After T5 (Identity Provider complete)
