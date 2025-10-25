"use client"

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { type BondedContact } from '@/lib/stores/signalsStore'
import { getBondedContactsFromHCS, getTrustLevelsPerContact } from '@/lib/services/HCSDataUtils'
import { toLegacyEventArray } from '@/lib/services/HCSDataAdapter'
import { useHcsEvents } from '@/hooks/useHcsEvents'
import { getSessionId } from '@/lib/session'
import { AddContactModal } from '@/components/AddContactModal'
import { AddContactDialog } from '@/components/AddContactDialog'
import { PeerRecommendationModal } from '@/components/PeerRecommendationModal'
import { MobileActionSheet } from '@/components/MobileActionSheet'
import { 
  Search,
  MessageCircle,
  CheckCircle,
  User,
  Award,
  Trophy,
  QrCode,
  UserCheck,
  UserPlus,
  Send
} from 'lucide-react'
import { toast } from 'sonner'

export default function ContactsPage() {
  const trustFeed = useHcsEvents('trust', 2500)
  const contactFeed = useHcsEvents('contact', 2500)
  
  const [bondedContacts, setBondedContacts] = useState<BondedContact[]>([])
  const [trustLevels, setTrustLevels] = useState<Map<string, { allocatedTo: number, receivedFrom: number }>>(new Map())
  const [searchTerm, setSearchTerm] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetContact, setSheetContact] = useState<BondedContact | null>(null)
  
  const loadIdRef = useRef(0)

  useEffect(() => {
    let active = true
    
    const loadContacts = async () => {
      const myLoadId = ++loadIdRef.current
      try {
        setIsLoading(true)
        const currentSessionId = getSessionId()
        const effectiveSessionId = currentSessionId || 'tm-alex-chen'
        setSessionId(effectiveSessionId)
        
        const allEvents = toLegacyEventArray([
          ...trustFeed.items,
          ...contactFeed.items,
        ] as any)
        
        const contacts = getBondedContactsFromHCS(allEvents, effectiveSessionId)
        const trustData = getTrustLevelsPerContact(allEvents, effectiveSessionId)
        
        if (active && myLoadId === loadIdRef.current) {
          setBondedContacts(contacts)
          setTrustLevels(trustData)
          console.log(`[ContactsPage] Loaded ${contacts.length} contacts from HCS`)
        }
      } catch (error) {
        if (active && myLoadId === loadIdRef.current) {
          console.error('[ContactsPage] Failed to load contacts:', error)
          toast.error('Failed to load contacts')
        }
      } finally {
        if (active && myLoadId === loadIdRef.current) {
          setIsLoading(false)
        }
      }
    }

    loadContacts()
    
    return () => {
      active = false
    }
  }, [trustFeed.watermark, contactFeed.watermark])

  const filteredContacts = bondedContacts.filter(contact =>
    (contact.handle || contact.peerId || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const handleContactClick = (contact: BondedContact) => {
    setSheetContact(contact)
    setSheetOpen(true)
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
        <div className="text-xs text-white/60 mb-3">
          {bondedContacts.length} contacts • Recognition signals available
        </div>
        <PeerRecommendationModal>
          <Button className="w-full h-12 text-base font-medium bg-gradient-to-r from-[#FF6B35] to-yellow-400 text-black hover:from-[#FF6B35]/90 hover:to-yellow-400/90 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,107,53,0.4),0_0_40px_rgba(255,107,53,0.2)] hover:shadow-[0_0_25px_rgba(255,107,53,0.5),0_0_50px_rgba(255,107,53,0.3)]">
            <Award className="w-5 h-5 mr-2" />
            Send Signal
          </Button>
        </PeerRecommendationModal>
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
                
                return (
                  <div
                    key={contactId}
                    className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all border border-white/10 hover:border-[#FF6B35]/30"
                    onClick={() => handleContactClick(contact)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-yellow-500/20 border border-[#FF6B35]/30 flex items-center justify-center">
                        <User className="w-5 h-5 text-[#FF6B35]" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{displayName}</div>
                        <div className="text-xs text-white/60">
                          {trustData.allocatedTo > 0 && (
                            <span className="text-orange-500">Given: {trustData.allocatedTo}</span>
                          )}
                          {trustData.allocatedTo > 0 && trustData.receivedFrom > 0 && (
                            <span className="text-white/40 mx-1">•</span>
                          )}
                          {trustData.receivedFrom > 0 && (
                            <span className="text-[#FF6B35]">Received: {trustData.receivedFrom}</span>
                          )}
                          {trustData.allocatedTo === 0 && trustData.receivedFrom === 0 && (
                            <span className="text-white/40">Contact</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white/70 hover:text-[#FF6B35] hover:bg-[#FF6B35]/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        toast.info(`Message ${displayName}`)
                      }}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Mobile Action Sheet for contact details */}
      {sheetContact && (
        <MobileActionSheet
          isOpen={sheetOpen}
          onClose={() => setSheetOpen(false)}
          contact={sheetContact}
          trustData={trustLevels.get(sheetContact.peerId || '') || { allocatedTo: 0, receivedFrom: 0 }}
        />
      )}
    </div>
    </div>
  )
}
