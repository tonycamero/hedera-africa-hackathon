"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signalsStore, type BondedContact } from '@/lib/stores/signalsStore'
import { getBondedContactsFromHCS } from '@/lib/services/HCSDataUtils'
import { enhancedHCSDataService, type EnhancedContact } from '@/lib/services/EnhancedHCSDataService'
import { getSessionId } from '@/lib/session'
import { ContactProfileSheet } from '@/components/ContactProfileSheet'
import { AddContactModal } from '@/components/AddContactModal'
import { PeerRecommendationModal } from '@/components/PeerRecommendationModal'
import { 
  Search,
  MessageCircle,
  UserPlus,
  CheckCircle,
  Network,
  User,
  Users,
  Award,
  Trophy
} from 'lucide-react'
import { toast } from 'sonner'

// Enhanced HCS contacts will be loaded from the data service
// All contact data now comes from real Hedera testnet

export default function ContactsPage() {
  const [bondedContacts, setBondedContacts] = useState<BondedContact[]>([])
  const [enhancedContacts, setEnhancedContacts] = useState<EnhancedContact[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [addingContact, setAddingContact] = useState<string | null>(null)
  const [showAllSuggestions, setShowAllSuggestions] = useState(false)
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
        const contacts = getBondedContactsFromHCS(allEvents, effectiveSessionId)
        setBondedContacts(contacts)
        
        // Load enhanced contacts from enhanced service
        const enhanced = await enhancedHCSDataService.getEnhancedContacts()
        setEnhancedContacts(enhanced)
        
        console.log(`[ContactsPage] Loaded ${contacts.length} bonded contacts and ${enhanced.length} enhanced contacts`)
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

  const handleAddContact = async (suggestion: EnhancedContact) => {
    setAddingContact(suggestion.id)
    
    // Simulate adding contact with sparkle animation
    toast.success(`✨ Adding ${suggestion.name}...`, {
      description: "Building trust connection",
      duration: 2000,
    })
    
    setTimeout(() => {
      setAddingContact(null)
      toast.success(`🎉 ${suggestion.name} added to your network!`, {
        description: "You can now allocate trust tokens",
      })
      // In real app, would create contact request via signalsStore
    }, 1500)
  }

  const filteredContacts = bondedContacts.filter(contact =>
    (contact.handle || contact.peerId)
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const filteredSuggestions = enhancedContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.handle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-6">
      {/* Professional Header - BASELINE STRUCTURE */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00F6FF]" />
            Professional Contacts
          </h1>
          <p className="text-sm text-white/60">Build your professional network</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-[#00F6FF]/20 hover:bg-[#00F6FF]/30 text-[#00F6FF] border border-[#00F6FF]/30">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Send Recognition Tokens CTA */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-white/80 flex items-center gap-2">
          <Award className="w-4 h-4 text-[#00F6FF]" />
          Send Recognition Tokens
        </h2>
        
        {/* Recognition CTA card */}
        <div className="backdrop-blur-md bg-gradient-to-br from-[#00F6FF]/10 to-cyan-500/5 border border-[#00F6FF]/30 hover:border-[#00F6FF]/50 cursor-pointer transition-all duration-300 hover:scale-[1.02] rounded-lg p-4 relative overflow-hidden">
          {/* Subtle animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00F6FF]/5 to-transparent animate-pulse"></div>
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00F6FF]/30 to-cyan-500/20 flex items-center justify-center border border-[#00F6FF]/30">
                  <Trophy className="w-5 h-5 text-[#00F6FF]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Recognize Excellence</h3>
                  <p className="text-xs text-white/70">Award blockchain-verified professional tokens</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#00F6FF] font-medium">0.3-0.5</div>
                <div className="text-xs text-white/60">trust units</div>
              </div>
            </div>
            
            <PeerRecommendationModal>
              <Button className="w-full bg-gradient-to-r from-[#00F6FF]/80 to-cyan-500/80 hover:from-[#00F6FF] hover:to-cyan-500 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                <Award className="w-4 h-4 mr-2" />
                Recommend a Professional Peer
              </Button>
            </PeerRecommendationModal>
            
            <div className="mt-3 text-xs text-center text-white/60">
              🏆 21 professional tokens • 3 categories • Blockchain verified
            </div>
          </div>
        </div>
      </div>

      {/* Professional Suggestions */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-white/80 flex items-center gap-2">
          <Network className="w-4 h-4 text-[#00F6FF]" />
          Recommended Connections
        </h2>
        
        {/* Quick action card */}
        <div className="backdrop-blur-md bg-white/5 border border-[#00F6FF]/20 hover:border-[#00F6FF]/40 cursor-pointer transition-all duration-300 hover:scale-[1.02] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#00F6FF]/20 flex items-center justify-center">
                <Network className="w-5 h-5 text-[#00F6FF]" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Expand Network</h3>
                <p className="text-xs text-white/60">Find colleagues & partners</p>
              </div>
            </div>
          </div>
          <AddContactModal>
            <Button className="w-full bg-gradient-to-r from-[#00F6FF]/80 to-cyan-500/80 hover:from-[#00F6FF] hover:to-cyan-500 text-white font-medium">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Professional Contact
            </Button>
          </AddContactModal>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-white/40" />
        <Input
          placeholder="Search professional network..."
          className="pl-10 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-[#00F6FF] focus:ring-1 focus:ring-[#00F6FF]/20 rounded-lg transition-all duration-300 text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Your Contacts */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium text-white tracking-tight">Your Contacts</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00F6FF] mx-auto mb-4"></div>
              <p className="text-white/60 text-sm">Loading contacts from Hedera testnet...</p>
            </div>
          </div>
        ) : (
        <div className="space-y-1">
          {[...filteredSuggestions.slice(0, 6), ...filteredContacts.slice(0, 2)].map((contact, index) => {
            const isBonded = 'peerId' in contact || contact.status === 'bonded'
            const displayName = 'name' in contact ? contact.name : (contact.handle || `User ${contact.peerId.slice(-6)}`)
            const role = 'role' in contact ? contact.role : 'Trusted Contact'
            const company = 'company' in contact ? contact.company : 'Network Member'
            
            return (
              <div 
                key={contact.id || contact.peerId} 
                className="flex items-center justify-between py-3 px-3 backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg hover:border-[#00F6FF]/30 hover:bg-[#00F6FF]/5 transition-all duration-300 cursor-pointer group"
                onClick={() => setSelectedContactId(contact.id || contact.peerId)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 flex-shrink-0 ${
                    isBonded 
                      ? 'border-[#00F6FF] bg-[#00F6FF]/10 text-[#00F6FF]' 
                      : 'border-white/30 bg-white/5 text-white/60'
                  }`}>
                    {isBonded ? <CheckCircle className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-white text-sm truncate group-hover:text-[#00F6FF] transition-colors">{displayName}</div>
                    <div className="text-xs text-white/60 truncate">{role} • {company}</div>
                    {'trustScore' in contact && (
                      <div className="text-xs text-[#00F6FF]/80 mt-0.5">
                        Trust: {contact.trustScore.toFixed(1)} • {contact.mutualConnections} mutual
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {isBonded ? (
                    <>
                      <span className="text-xs px-1.5 py-0.5 bg-[#00F6FF]/20 text-[#00F6FF] rounded-full border border-[#00F6FF]/30">
                        ●
                      </span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-white/60 hover:text-[#00F6FF] hover:bg-[#00F6FF]/10 p-1.5"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle message action
                        }}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        size="sm" 
                        className="bg-[#00F6FF]/20 text-[#00F6FF] border border-[#00F6FF]/50 hover:bg-[#00F6FF]/30 text-xs px-2 py-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddContact(contact)
                        }}
                        disabled={addingContact === contact.id}
                      >
                        {addingContact === contact.id ? '+' : '+'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        )}
        
        {/* Contact Stats */}
        {!isLoading && (
          <div className="text-center py-2 text-white/60 text-xs">
            {filteredSuggestions.length + filteredContacts.length} contacts • {enhancedContacts.length} from HCS
          </div>
        )}
        
        {/* Recommend Action */}
        <div className="text-center py-4">
          <PeerRecommendationModal>
            <Button className="bg-transparent border border-white/20 text-white/70 hover:border-[#00F6FF]/50 hover:text-[#00F6FF] transition-all duration-300 text-sm px-4 py-2">
              Recommend a Peer
            </Button>
          </PeerRecommendationModal>
        </div>
      </div>
      
      {/* Contact Profile Sheet */}
      <ContactProfileSheet 
        peerId={selectedContactId} 
        onClose={() => setSelectedContactId(null)} 
      />
    </div>
  )
}
