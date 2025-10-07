"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AddContactDialog } from "@/components/AddContactDialog"
import { signalsStore, type BondedContact } from "@/lib/stores/signalsStore"
import { getBondedContactsFromHCS } from "@/lib/services/HCSDataUtils"
import { getSessionId } from "@/lib/session"
import { 
  Search,
  MessageCircle,
  UserPlus,
  CheckCircle,
  Clock,
  Network,
  User
} from "lucide-react"
import { toast } from "sonner"

// Mock professional suggestions
const mockSuggestions = [
  { id: "sarah-kim", name: "Sarah Kim", status: "bonded", role: "Engineering Lead", company: "TechCorp", mutuals: 3 },
  { id: "mike-rivera", name: "Mike Rivera", status: "pending", role: "Product Manager", company: "Startup.io", mutuals: 2 },
  { id: "emily-patel", name: "Emily Patel", status: "bonded", role: "Strategy Director", company: "Consultancy", mutuals: 1 }
]

export default function ContactsPage() {
  const [bondedContacts, setBondedContacts] = useState<BondedContact[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [addingContact, setAddingContact] = useState<string | null>(null)
  const [showAllSuggestions, setShowAllSuggestions] = useState(false)

  useEffect(() => {
    const loadContacts = () => {
      const currentSessionId = getSessionId()
      const effectiveSessionId = currentSessionId || 'tm-alex-chen'
      setSessionId(effectiveSessionId)
      
      const allEvents = signalsStore.getAll()
      const contacts = getBondedContactsFromHCS(allEvents, effectiveSessionId)
      setBondedContacts(contacts)
    }

    loadContacts()
    
    // Subscribe to updates
    const unsubscribe = signalsStore.subscribe(loadContacts)
    return unsubscribe
  }, [])

  const handleAddContact = async (suggestion: any) => {
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

  const filteredSuggestions = mockSuggestions.filter(suggestion =>
    suggestion.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Professional Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium text-white mb-2 tracking-tight">
            Build Your Network
          </h1>
          <p className="text-sm sm:text-base text-white/70 font-light">
            Trust begins with contact.
          </p>
        </div>
        <Button className="bg-transparent border border-[#00F6FF] text-[#00F6FF] hover:bg-[#00F6FF]/10 transition-all duration-300 text-sm sm:text-base px-3 sm:px-4">
          <UserPlus className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Add Contact</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Graph Preview Placeholder */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 sm:p-8">
        <div className="flex items-center justify-center h-24 sm:h-32">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#00F6FF] rounded-full animate-pulse"></div>
            <div className="w-px h-6 sm:h-8 bg-[#00F6FF]/30"></div>
            <Network className="w-6 h-6 sm:w-8 sm:h-8 text-[#00F6FF]/60" />
            <div className="w-px h-6 sm:h-8 bg-[#00F6FF]/30"></div>
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#00F6FF] rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
          </div>
        </div>
        <p className="text-center text-white/50 text-xs sm:text-sm mt-3 sm:mt-4">Interactive network visualization</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 sm:left-4 top-3 sm:top-4 h-4 w-4 sm:h-5 sm:w-5 text-white/40" />
        <Input
          placeholder="Search your network..."
          className="pl-10 sm:pl-12 py-3 sm:py-4 bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-[#00F6FF] focus:ring-1 focus:ring-[#00F6FF]/20 rounded-xl transition-all duration-300 text-sm sm:text-base"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Your Contacts */}
      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-lg sm:text-xl font-medium text-white tracking-tight">Your Contacts</h2>
        <div className="space-y-1">
          {[...filteredSuggestions, ...filteredContacts.slice(0, 2)].map((contact, index) => {
            const isBonded = 'peerId' in contact || contact.status === 'bonded'
            const displayName = 'name' in contact ? contact.name : (contact.handle || `User ${contact.peerId.slice(-6)}`)
            const role = 'role' in contact ? contact.role : 'Trusted Contact'
            const company = 'company' in contact ? contact.company : 'Network Member'
            
            return (
              <div key={contact.id || contact.peerId} className="flex items-center justify-between py-3 sm:py-4 px-4 sm:px-6 backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl hover:border-[#00F6FF]/30 transition-all duration-300">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 flex-shrink-0 ${
                    isBonded 
                      ? 'border-[#00F6FF] bg-[#00F6FF]/10 text-[#00F6FF]' 
                      : 'border-white/30 bg-white/5 text-white/60'
                  }`}>
                    {isBonded ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : <User className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-white text-sm sm:text-base truncate">{displayName}</div>
                    <div className="text-xs sm:text-sm text-white/60 truncate">{role} • {company}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  {isBonded ? (
                    <>
                      <span className="text-xs px-1.5 sm:px-2 py-1 bg-[#00F6FF]/20 text-[#00F6FF] rounded-full border border-[#00F6FF]/30">
                        ● Bonded
                      </span>
                      <Button size="sm" variant="ghost" className="text-white/60 hover:text-[#00F6FF] hover:bg-[#00F6FF]/10 p-2">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-xs px-1.5 sm:px-2 py-1 bg-white/10 text-white/60 rounded-full">
                        ○ Pending
                      </span>
                      <div className="flex gap-1 sm:gap-2">
                        <Button size="sm" className="bg-[#00F6FF]/20 text-[#00F6FF] border border-[#00F6FF]/50 hover:bg-[#00F6FF]/30 text-xs px-2 sm:px-3">
                          Bond
                        </Button>
                        <Button size="sm" variant="ghost" className="text-white/40 hover:text-white/60 text-xs px-2 sm:px-3">
                          Decline
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Recommend Action */}
        <div className="text-center py-6 sm:py-8">
          <Button className="bg-transparent border border-white/20 text-white/70 hover:border-[#00F6FF]/50 hover:text-[#00F6FF] transition-all duration-300 text-sm sm:text-base px-4 sm:px-6">
            Recommend a Peer
          </Button>
        </div>
      </div>
    </div>
  )
}
