"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signalsStore, type BondedContact } from '@/lib/stores/signalsStore'
import { getBondedContactsFromHCS, getTrustLevelsPerContact } from '@/lib/services/HCSDataUtils'
// Removed EnhancedHCSDataService - using pure HCS data flow
import { getSessionId } from '@/lib/session'
import { ContactProfileSheet } from '@/components/ContactProfileSheet'
import { AddContactModal } from '@/components/AddContactModal'
import { AddContactDialog } from '@/components/AddContactDialog'
import { PeerRecommendationModal } from '@/components/PeerRecommendationModal'
import { 
  Search,
  MessageCircle,
  CheckCircle,
  User,
  Award,
  Trophy,
  QrCode,
  UserCheck,
  UserPlus
} from 'lucide-react'
import { toast } from 'sonner'

// Enhanced HCS contacts will be loaded from the data service
// All contact data now comes from real Hedera testnet

export default function ContactsPage() {
  const [bondedContacts, setBondedContacts] = useState<BondedContact[]>([])
  const [trustLevels, setTrustLevels] = useState<Map<string, { allocatedTo: number, receivedFrom: number }>>(new Map())
  const [searchTerm, setSearchTerm] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)

  useEffect(() => {
    const loadContacts = async () => {
      try {
        setIsLoading(true)
        const currentSessionId = getSessionId()
        const effectiveSessionId = currentSessionId || 'tm-alex-chen'
        setSessionId(effectiveSessionId)
        
        // Load bonded contacts from HCS
        const allEvents = signalsStore.getAll()
        console.log('🔍 [ContactsPage] Effective session ID:', effectiveSessionId)
        console.log('🔍 [ContactsPage] Total events from signals store:', allEvents.length)
        const contacts = getBondedContactsFromHCS(allEvents, effectiveSessionId)
        console.log('🔍 [ContactsPage] Bonded contacts returned:', contacts)
        setBondedContacts(contacts)
        
        // Get trust levels for all contacts
        const trustData = getTrustLevelsPerContact(allEvents, effectiveSessionId)
        console.log('🔍 [ContactsPage] Trust levels calculated:', trustData)
        setTrustLevels(trustData)
        
        console.log(`[ContactsPage] Loaded ${contacts.length} bonded contacts from pure HCS data`)
      } catch (error) {
        console.error('[ContactsPage] Failed to load contacts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadContacts()
    
    // Subscribe to updates
    const unsubscribe = signalsStore.subscribe(loadContacts)
    return unsubscribe
  }, [])

  // Pure HCS data - no mock contact addition needed

  const filteredContacts = bondedContacts.filter(contact =>
    (contact.handle || contact.peerId)
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-6">
      {/* Unified Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button size="sm" className="bg-[#00F6FF]/20 hover:bg-[#00F6FF]/30 text-[#00F6FF] border border-[#00F6FF]/30">
            <Search className="w-4 h-4" />
          </Button>
          <span className="text-sm text-white/70">{bondedContacts.length} Total Contacts</span>
        </div>
      </div>

      {/* Card 1: Send Token */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-[#00F6FF]/30 hover:border-[#00F6FF]/50 cursor-pointer transition-all duration-300 hover:scale-[1.02] rounded-lg p-4 relative overflow-hidden shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00F6FF]/30 to-cyan-500/20 flex items-center justify-center border border-[#00F6FF]/30">
              <Trophy className="w-5 h-5 text-[#00F6FF]" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Send Recognition Signals to Peers</h3>
              <div className="text-xs text-[#00F6FF] font-medium">Increases their trust score!</div>
            </div>
          </div>
        </div>
        <div className="text-xs text-white/60 mb-3">
          {bondedContacts.length} contacts • Recognition signals available
        </div>
        <PeerRecommendationModal>
          <Button className="w-full bg-gradient-to-r from-[#00F6FF]/80 to-cyan-500/80 hover:from-[#00F6FF] hover:to-cyan-500 text-white font-medium">
            <Award className="w-4 h-4 mr-2" />
            Send Signal
          </Button>
        </PeerRecommendationModal>
      </div>

      {/* Card 2: QR Contact Exchange - Network Growth Engine */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-emerald-500/30 hover:border-emerald-500/50 cursor-pointer transition-all duration-300 hover:scale-[1.02] rounded-lg p-4 relative overflow-hidden shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/30 to-green-500/20 flex items-center justify-center border border-emerald-500/30">
              <UserCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Grow Your Trusted Network</h3>
              <div className="text-xs text-emerald-400 font-medium">Add professional contacts to increase your Trust Score!</div>
            </div>
          </div>
        </div>
        <div className="text-xs text-white/60 mb-3">
          QR code exchange • Instant blockchain bonding • Build trust circles
        </div>
        <div className="flex gap-2">
          <AddContactDialog>
            <Button className="flex-1 bg-gradient-to-r from-emerald-500/80 to-green-500/80 hover:from-emerald-500 hover:to-green-500 text-white font-medium">
              <QrCode className="w-4 h-4 mr-2" />
              QR Exchange
            </Button>
          </AddContactDialog>
          <AddContactModal>
            <Button variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20">
              <UserPlus className="w-4 h-4 mr-1" />
              Invite
            </Button>
          </AddContactModal>
        </div>
      </div>

      {/* All Contacts with Trust Levels */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10 rounded-lg p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">All Contacts</h3>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-white/40" />
            <Input
              placeholder="Search contacts..."
              className="pl-7 h-8 w-32 bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-[#00F6FF] text-xs rounded"
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
          <>
            {/* All Bonded Contacts */}
            <div className="space-y-3">
              {filteredContacts.map((contact, index) => {
                const contactId = contact.peerId || contact.id
                const trustData = trustLevels.get(contactId) || { allocatedTo: 0, receivedFrom: 0 }
                const displayName = contact.handle || `User ${contactId?.slice(-6) || 'Unknown'}`
                
                // Parse first and last name from handle
                let firstName = displayName
                let lastName = ''
                const nameParts = displayName.split(' ')
                if (nameParts.length > 1) {
                  firstName = nameParts[0]
                  lastName = nameParts.slice(1).join(' ')
                }
                
                return (
                  <div 
                    key={contactId || index}
                    className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors group"
                    onClick={() => setSelectedContactId(contactId)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00F6FF]/20 to-cyan-500/20 border border-[#00F6FF]/30 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-[#00F6FF]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-white font-semibold">{firstName}</span>
                          {lastName && <span className="text-white font-semibold">{lastName}</span>}
                        </div>
                        <div className="text-xs text-white/60 mt-1">Bonded Contact</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Trust Given */}
                      <div className="text-center">
                        <div className="text-sm font-bold text-green-400">{trustData.allocatedTo}</div>
                        <div className="text-xs text-white/60">Given</div>
                      </div>
                      
                      {/* Trust Received */}
                      <div className="text-center">
                        <div className="text-sm font-bold text-blue-400">{trustData.receivedFrom}</div>
                        <div className="text-xs text-white/60">Received</div>
                      </div>
                      
                      {/* Actions */}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-white/60 hover:text-[#00F6FF] h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { 
                          e.stopPropagation()
                          toast.info(`Opening chat with ${firstName}...`)
                        }}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
              
              {/* Pure HCS bonded contacts only - no enhanced/mock contacts */}
              
              {/* Empty State */}
              {filteredContacts.length === 0 && (
                <div className="text-center py-8 text-white/60">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium mb-1">No contacts found</p>
                  <p className="text-xs">Start building your professional network with HCS!</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Contact Profile Sheet */}
      <ContactProfileSheet 
        peerId={selectedContactId} 
        onClose={() => setSelectedContactId(null)} 
      />
    </div>
  )
}
