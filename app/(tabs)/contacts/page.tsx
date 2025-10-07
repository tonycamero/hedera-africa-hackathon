"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AddContactDialog } from "@/components/AddContactDialog"
import { signalsStore, type BondedContact } from "@/lib/stores/signalsStore"
import { getBondedContactsFromHCS } from "@/lib/services/HCSDataUtils"
import { getSessionId } from "@/lib/session"
import { 
  Users, 
  UserPlus, 
  Search,
  MessageCircle,
  UserCheck,
  Clock,
  Sparkles,
  Plus,
  TrendingUp
} from "lucide-react"
import { toast } from "sonner"

// Mock contact suggestions - in real app would come from API/HCS
const mockSuggestions = [
  { id: "sarah-kim", name: "Sarah Kim", mutuals: 3, status: "suggested", avatar: "👩‍💼", lastActive: "2h ago" },
  { id: "mike-rivera", name: "Mike Rivera", mutuals: 2, status: "recent", avatar: "👨‍💻", lastActive: "1h ago" },
  { id: "emily-patel", name: "Emily Patel", mutuals: 1, status: "suggested", avatar: "👩‍🎨", lastActive: "4h ago" },
  { id: "david-wong", name: "David Wong", mutuals: 4, status: "trending", avatar: "👨‍🔬", lastActive: "30m ago" },
  { id: "alex-johnson", name: "Alex Johnson", mutuals: 2, status: "suggested", avatar: "👨‍🎓", lastActive: "3h ago" }
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
    suggestion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    suggestion.status.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const displaySuggestions = showAllSuggestions ? filteredSuggestions : filteredSuggestions.slice(0, 3)

  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-6">
      {/* Header with Quick Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            👥 Contacts
            <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
          </h1>
          <div className="flex items-center gap-4 text-sm mt-1">
            <span className="text-muted-foreground">{bondedContacts.length} bonded</span>
            <span className="text-blue-600">•</span>
            <span className="text-muted-foreground">{mockSuggestions.length} fresh suggestions</span>
          </div>
        </div>
        <AddContactDialog />
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts or discover new people..."
          className="pl-10 bg-muted/30 border-2 focus:border-blue-400 transition-colors"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Fresh Suggestions Section */}
      {(!searchTerm || filteredSuggestions.length > 0) && (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-purple-50/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Fresh Suggestions
              </span>
              {!showAllSuggestions && filteredSuggestions.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllSuggestions(true)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  View All ({filteredSuggestions.length})
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {displaySuggestions.map((suggestion) => (
              <div key={suggestion.id} className="flex items-center justify-between p-4 bg-white/70 rounded-xl border border-blue-100 hover:border-blue-200 transition-all hover:shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="text-2xl animate-bounce">{suggestion.avatar}</div>
                  <div>
                    <div className="font-medium text-gray-900">{suggestion.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {suggestion.mutuals} mutual contacts
                      {suggestion.status === "recent" && (
                        <>
                          <span className="mx-1">•</span>
                          <Clock className="w-3 h-3" />
                          <span>Active {suggestion.lastActive}</span>
                        </>
                      )}
                      {suggestion.status === "trending" && (
                        <>
                          <span className="mx-1">•</span>
                          <TrendingUp className="w-3 h-3 text-orange-500" />
                          <span className="text-orange-600">Trending</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  onClick={() => handleAddContact(suggestion)}
                  disabled={addingContact === suggestion.id}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md"
                >
                  {addingContact === suggestion.id ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin mr-1" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </>
                  )}
                </Button>
              </div>
            ))}
            
            {showAllSuggestions && filteredSuggestions.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllSuggestions(false)}
                className="w-full text-muted-foreground"
              >
                Show Less
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Your Contacts Section */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              Your Network
            </span>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {bondedContacts.length} bonded
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? (
                <>
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No contacts found for "{searchTerm}"</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </>
              ) : (
                <>
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium mb-1">Build your network!</p>
                  <p className="text-sm">Add contacts above to start building trust connections</p>
                  <div className="mt-4">
                    <AddContactDialog />
                  </div>
                </>
              )}
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div key={contact.peerId} className="flex items-center justify-between p-4 bg-green-50/30 rounded-xl border border-green-100 hover:border-green-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-sm">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {contact.handle || `User ${contact.peerId.slice(-6)}`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Bonded {new Date(contact.bondedAt).toLocaleDateString()}
                      {contact.trustLevel && (
                        <>
                          <span className="mx-1">•</span>
                          <span className="text-green-600 font-medium">Trust Level {contact.trustLevel}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
                    ✓ Trusted
                  </Badge>
                  <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-gray-900">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
