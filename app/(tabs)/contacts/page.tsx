"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { type BondedContact, signalsStore } from '@/lib/stores/signalsStore'
import { getSessionId } from '@/lib/session'
import { AddContactModal } from '@/components/AddContactModal'
import { AddContactDialog } from '@/components/AddContactDialog'
import { CreateRecognitionModal } from '@/components/recognition/CreateRecognitionModal'
import { ContactProfileSheet } from '@/components/ContactProfileSheet'
import { useRemainingMints } from '@/lib/hooks/useRemainingMints'
import { 
  Search,
  MessageCircle,
  User,
  Award,
  Trophy,
  QrCode,
  UserCheck,
  UserPlus
} from 'lucide-react'
import { toast } from 'sonner'

export default function ContactsPage() {
  const [bondedContacts, setBondedContacts] = useState<BondedContact[]>([])
  const [trustLevels, setTrustLevels] = useState<Map<string, { allocatedTo: number, receivedFrom: number }>>(new Map())
  const [searchTerm, setSearchTerm] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null)
  const [selectedContact, setSelectedContact] = useState<BondedContact | null>(null)
  const [showRecognitionModal, setShowRecognitionModal] = useState(false)
  const [recognitionRecipient, setRecognitionRecipient] = useState<{ accountId: string; handle?: string } | null>(null)
  
  // Mint counter hook
  const { loading: mintsLoading, remainingMints, trstBalance, cost, needsTopUp } = useRemainingMints(sessionId)

  useEffect(() => {
    const loadContacts = async () => {
      try {
        setIsLoading(true)
        const currentSessionId = getSessionId()
        
        // If no session (not authenticated), don't try to load from backend
        if (!currentSessionId) {
          console.log('[ContactsPage] No session ID - user not authenticated')
          setSessionId('') // Empty session indicates unauthenticated state
          setIsLoading(false)
          return
        }
        
        setSessionId(currentSessionId)
        
        console.log('[ContactsPage] Loading contacts for Hedera Account ID:', currentSessionId)
        
        // Load from server-side API (same as circle page)
        const response = await fetch(`/api/circle?sessionId=${currentSessionId}`)
        const data = await response.json()
        
        console.log('[ContactsPage] API response:', data)
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to load contacts')
        }
        
        // Merge optimistic CONTACT_ACCEPT events from local store
        const optimisticContacts = signalsStore.getAll().filter(e => 
          (e.type === 'CONTACT_ACCEPT' || e.type === 'CONTACT_MIRROR') &&
          (e.actor === currentSessionId || e.target === currentSessionId) &&
          e.source === 'hcs-cached' &&
          e.ts > Date.now() - 60000 // Only consider events from last minute
        )
        
        const allContacts = [...data.bondedContacts]
        
        optimisticContacts.forEach(event => {
          const contactId = event.actor === effectiveSessionId ? event.target : event.actor
          const contactMetadata = event.metadata as any
          
          // Check if this contact is already in the list from HCS
          const existsInHCS = allContacts.some(c => 
            c.peerId === contactId || 
            c.peerId === contactMetadata?.from?.acct ||
            c.peerId === contactMetadata?.to?.acct
          )
          
          if (!existsInHCS && contactId) {
            // Add optimistic contact with pending indicator
            allContacts.push({
              peerId: contactId,
              handle: contactMetadata?.from?.handle || contactMetadata?.to?.handle || contactId,
              hrl: contactMetadata?.from?.hrl || contactMetadata?.to?.hrl || `hrl:tm/${contactId}`,
              bondedAt: new Date(event.ts).toISOString(),
              isPending: true // Mark as pending confirmation
            })
            console.log(`[ContactsPage] Added optimistic contact bond: ${contactId}`)
          }
        })
        
        setBondedContacts(allContacts)
        
        // Convert trust levels object back to Map
        const trustLevelsMap = new Map<string, { allocatedTo: number, receivedFrom: number }>()
        Object.entries(data.trustLevels).forEach(([key, value]) => {
          trustLevelsMap.set(key, value as { allocatedTo: number, receivedFrom: number })
        })
        
        // Merge optimistic TRUST_ALLOCATE events from local store (same as circle page)
        const localTrustEvents = signalsStore.getAll().filter(e => 
          e.type === 'TRUST_ALLOCATE' && 
          e.actor === currentSessionId &&
          e.source === 'hcs-cached' &&
          e.ts > Date.now() - 60000 // Only consider events from last minute
        )
        
        localTrustEvents.forEach(event => {
          const targetId = event.target
          if (targetId && !trustLevelsMap.has(targetId)) {
            // This trust allocation hasn't arrived from HCS yet, add it optimistically
            trustLevelsMap.set(targetId, { allocatedTo: 1, receivedFrom: 0 })
            console.log(`[ContactsPage] Added optimistic trust allocation to ${targetId}`)
          }
        })
        
        setTrustLevels(trustLevelsMap)
        
        console.log(`[ContactsPage] Loaded ${data.bondedContacts.length} contacts from HCS`)
      } catch (error) {
        console.error('[ContactsPage] Failed to load contacts:', error)
        toast.error('Failed to load contacts')
      } finally {
        setIsLoading(false)
      }
    }

    loadContacts()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadContacts, 30000)
    return () => clearInterval(interval)
  }, [])

  // Sort contacts: Inner Circle members (with trust allocated) first, then others
  const sortedContacts = [...bondedContacts].sort((a, b) => {
    const aTrust = trustLevels.get(a.peerId || '')?.allocatedTo || 0
    const bTrust = trustLevels.get(b.peerId || '')?.allocatedTo || 0
    
    // Sort by trust allocated (descending), then by name
    if (aTrust !== bTrust) {
      return bTrust - aTrust
    }
    
    const aName = a.handle || a.peerId || ''
    const bName = b.handle || b.peerId || ''
    return aName.localeCompare(bName)
  })
  
  const filteredContacts = sortedContacts.filter(contact =>
    (contact.handle || contact.peerId || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const handleContactClick = (contact: BondedContact) => {
    setSelectedPeerId(contact.peerId || null)
    setSelectedContact(contact)
  }

  // Show authentication prompt if no session
  if (!sessionId && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0a1f] via-[#2a1030] to-[#1a0a1f]">
        <div className="max-w-md mx-auto px-4 py-20 space-y-6 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-orange-400/30 to-orange-500/20 flex items-center justify-center border border-orange-500/30">
            <UserCheck className="w-10 h-10 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">Sign in to view your contacts</h2>
          <p className="text-white/60">Connect with Magic to access your trusted network on the blockchain</p>
          <Button 
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-[#FF6B35] to-yellow-400 text-black hover:from-[#FF6B35]/90 hover:to-yellow-400/90"
          >
            Sign in with Magic
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a1f] via-[#2a1030] to-[#1a0a1f]"><div className="max-w-md mx-auto px-4 py-4 space-y-6">

      {/* Card 1: QR Contact Exchange - Network Growth Engine */}
      <div className="sheen-sweep bg-gradient-to-br from-panel/90 to-panel/80 border-2 border-[#FF6B35]/20 shadow-[0_0_30px_rgba(255,107,53,0.15),0_0_60px_rgba(255,107,53,0.05)] rounded-lg p-4 relative overflow-hidden before:absolute before:inset-0 before:rounded-lg before:p-[1px] before:bg-gradient-to-r before:from-[#FF6B35]/20 before:via-transparent before:to-[#FF6B35]/20 before:-z-10 before:animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400/30 to-yellow-500/20 flex items-center justify-center border border-orange-500/30">
              <UserCheck className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Grow Your Trusted Network</h3>
              <div className="text-xs text-orange-500 font-medium">Add professional contacts to increase your Trust Score!</div>
            </div>
          </div>
        </div>
        <div className="text-xs text-white/60 mb-3">
          QR code exchange • Instant blockchain bonding • Build trust circles
        </div>
        <div className="flex gap-2">
          <AddContactDialog>
            <Button className="flex-1 h-9 text-sm font-medium bg-gradient-to-r from-[#FF6B35] to-yellow-400 text-black hover:from-[#FF6B35]/90 hover:to-yellow-400/90 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,107,53,0.4),0_0_40px_rgba(255,107,53,0.2)] hover:shadow-[0_0_25px_rgba(255,107,53,0.5),0_0_50px_rgba(255,107,53,0.3)]">
              <QrCode className="w-4 h-4 mr-2" />
              QR Exchange
            </Button>
          </AddContactDialog>
          <AddContactModal>
            <Button variant="outline" className="border-orange-500/30 text-orange-500 hover:bg-emerald-500/20">
              <UserPlus className="w-4 h-4 mr-1" />
              Invite
            </Button>
          </AddContactModal>
        </div>
      </div>

      {/* Card 2: Send Recognition Signal */}
      <div className="sheen-sweep bg-gradient-to-br from-panel/90 to-panel/80 border-2 border-[#FF6B35]/20 shadow-[0_0_30px_rgba(255,107,53,0.15),0_0_60px_rgba(255,107,53,0.05)] rounded-lg p-4 relative overflow-hidden before:absolute before:inset-0 before:rounded-lg before:p-[1px] before:bg-gradient-to-r before:from-[#FF6B35]/20 before:via-transparent before:to-[#FF6B35]/20 before:-z-10 before:animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35]/30 to-yellow-500/20 flex items-center justify-center border border-[#FF6B35]/30">
              <Trophy className="w-5 h-5 text-[#FF6B35]" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Send Recognition Signals to Peers</h3>
              <div className="text-xs text-[#FF6B35] font-medium">Increases their trust score!</div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-white/60 mb-3">
          <span>{bondedContacts.length} contacts • Recognition signals available</span>
          {!mintsLoading && typeof trstBalance === 'number' && (
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${
                needsTopUp
                  ? 'border-amber-500/50 bg-amber-500/20 text-amber-300 animate-pulse'
                  : remainingMints > 50
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-purple-500/30 bg-purple-500/10 text-purple-400'
              }`}
              title={`TRST balance: ${trstBalance.toFixed(2)} • Cost per mint: ${cost.toFixed(2)}${needsTopUp ? ' • Time to top up!' : ''}`}
            >
              🎟️ {remainingMints} left{needsTopUp ? ' - Top up!' : ''}
            </div>
          )}
        </div>
        <Button 
          onClick={() => {
            // Set first contact as recipient (TODO: add contact picker)
            const firstContact = bondedContacts[0]
            if (firstContact) {
              setRecognitionRecipient({ 
                accountId: firstContact.peerId || sessionId, 
                handle: firstContact.handle 
              })
              setShowRecognitionModal(true)
            } else {
              toast.error('No contacts available')
            }
          }}
          className="w-full h-12 text-base font-medium bg-gradient-to-r from-[#FF6B35] to-yellow-400 text-black hover:from-[#FF6B35]/90 hover:to-yellow-400/90 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,107,53,0.4),0_0_40px_rgba(255,107,53,0.2)] hover:shadow-[0_0_25px_rgba(255,107,53,0.5),0_0_50px_rgba(255,107,53,0.3)]"
        >
          <Award className="w-5 h-5 mr-2" />
          Send Signal
        </Button>
      </div>

      {/* All Contacts with Trust Levels */}
      <div className="sheen-sweep bg-gradient-to-br from-panel/90 to-panel/80 border-2 border-white/20 shadow-[0_0_25px_rgba(255,255,255,0.1),0_0_50px_rgba(255,255,255,0.05)] rounded-lg p-4 relative overflow-hidden before:absolute before:inset-0 before:rounded-lg before:p-[1px] before:bg-gradient-to-r before:from-white/10 before:via-transparent before:to-white/10 before:-z-10 before:animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">All Contacts</h3>
            <span className="text-sm text-white/60">({bondedContacts.length})</span>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-white/40" />
            <Input
              placeholder="Search contacts..."
              className="pl-7 h-8 w-32 bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-[#FF6B35] text-xs rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8 text-white/60 text-sm">
            <div className="animate-pulse">Loading contacts from Hedera...</div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredContacts.length === 0 ? (
              <div className="text-center py-8 text-white/60">
                <p className="text-sm">No contacts found</p>
                <p className="text-xs mt-2">Add contacts to get started</p>
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const contactId = contact.peerId || contact.id
                const trustData = trustLevels.get(contactId || '') || { allocatedTo: 0, receivedFrom: 0 }
                const displayName = contact.handle || `User ${contactId?.slice(-6) || 'Unknown'}`
                const isBonded = contact.isBonded !== false // Default to true for backward compatibility
                
                return (
                  <div
                    key={contactId}
                    className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all border border-white/10 hover:border-[#FF6B35]/30"
                    onClick={() => handleContactClick(contact)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-yellow-500/20 border border-[#FF6B35]/30 flex items-center justify-center">
                        <User className="w-5 h-5 text-[#FF6B35]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-white">{displayName}</div>
                          {contact.isPending ? (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/20 border border-purple-500/40 text-purple-300 animate-pulse"
                              title="Confirming on Hedera... (~3-5 sec)"
                            >
                              ⏱️ Confirming
                            </span>
                          ) : isBonded ? (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                              title="Mutual acceptance complete - can send signals"
                            >
                              ✓ Bonded
                            </span>
                          ) : (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 border border-amber-500/30 text-amber-400"
                              title="Pending acceptance"
                            >
                              ⏳ Pending
                            </span>
                          )}
                        </div>
                        <div className="text-xs">
                          {trustData.allocatedTo > 0 ? (
                            <span className="text-orange-500 font-medium">Given: {trustData.allocatedTo} 🔥</span>
                          ) : (
                            <span className="text-white/60">Contact</span>
                          )}
                          {trustData.receivedFrom > 0 && (
                            <>
                              <span className="text-white/40 mx-1">•</span>
                              <span className="text-[#FF6B35] font-medium">Received: {trustData.receivedFrom}</span>
                            </>
                          )}
                          {trustData.allocatedTo === 0 && trustData.receivedFrom === 0 && (
                            <span className="text-white/40">Contact</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isBonded ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white/70 hover:text-[#FF6B35] hover:bg-[#FF6B35]/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          toast.info(`Message ${displayName}`)
                        }}
                        title="Send message"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white/40 cursor-not-allowed"
                        disabled
                        title="Bond with this contact first"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Contact Profile Sheet */}
      {selectedContact && (
        <ContactProfileSheet
          peerId={selectedPeerId}
          contactHandle={selectedContact.handle}
          onClose={() => {
            setSelectedPeerId(null)
            setSelectedContact(null)
          }}
        />
      )}
      
      {/* Recognition Modal */}
      {showRecognitionModal && recognitionRecipient && (
        <CreateRecognitionModal
          to={recognitionRecipient}
          onClose={() => {
            setShowRecognitionModal(false)
            setRecognitionRecipient(null)
          }}
          onSuccess={() => {
            setShowRecognitionModal(false)
            setRecognitionRecipient(null)
            toast.success('Recognition sent!')
          }}
        />
      )}
    </div>
    </div>
  )
}
