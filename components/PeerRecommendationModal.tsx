"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Award,
  Trophy,
  Star,
  Target,
  Briefcase,
  Users,
  TrendingUp,
  Shield,
  Lightbulb,
  Handshake,
  BookOpen,
  Globe,
  Send,
  ChevronRight,
  UserCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { professionalRecognitionService, type RecognitionRequest } from '@/lib/professionalRecognitionService'
import { getSessionId } from '@/lib/session'
import { getBondedContactsAdapter } from '@/lib/adapters/hcsContactsAdapter'

interface PeerRecommendationModalProps {
  children: React.ReactNode
}

// Icon mapping for professional tokens
const iconMap: Record<string, any> = {
  // Leadership icons
  telescope: Target,
  users: Users,
  target: Target,
  heart: Award,
  'trending-up': TrendingUp,
  'user-plus': Users,
  shield: Shield,
  
  // Knowledge icons
  cpu: Shield,
  network: Globe,
  'bar-chart': TrendingUp,
  'book-open': BookOpen,
  'graduation-cap': BookOpen,
  search: Target,
  'shield-check': Shield,
  
  // Execution icons  
  truck: Send,
  settings: Star,
  'heart-handshake': Award,
  puzzle: Star,
  'git-branch': Handshake,
  'alert-triangle': Shield,
}

// Style mapping for categories
const categoryStyles: Record<string, any> = {
  leadership: {
    color: 'from-amber-500 to-yellow-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30'
  },
  knowledge: {
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30'
  },
  execution: {
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30'
  }
}

// Get professional recognition tokens with UI styling
const getProfessionalRecognitions = () => {
  const tokensByCategory = professionalRecognitionService.getTokensByCategory()
  const allTokens = Object.values(tokensByCategory).flat()
  
  return allTokens.map(token => ({
    ...token,
    icon: iconMap[token.icon] || Star,
    ...categoryStyles[token.category] || categoryStyles.execution
  }))
}

interface BondedContact {
  id: string
  handle: string
  bondedAt?: number
}

export function PeerRecommendationModal({ children }: PeerRecommendationModalProps) {
  const [open, setOpen] = useState(false)
  const [selectedRecognitions, setSelectedRecognitions] = useState<string[]>([])
  const [selectedContactId, setSelectedContactId] = useState('')
  const [peerName, setPeerName] = useState('')
  const [peerEmail, setPeerEmail] = useState('')
  const [personalMessage, setPersonalMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [bondedContacts, setBondedContacts] = useState<BondedContact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  // Get professional recognition tokens
  const allProfessionalRecognitions = getProfessionalRecognitions()
  const professionalRecognitions = selectedCategory === 'all' 
    ? allProfessionalRecognitions 
    : allProfessionalRecognitions.filter(token => token.category === selectedCategory)
  
  // Category definitions
  const categories = [
    { id: 'all', name: 'All', count: allProfessionalRecognitions.length },
    { id: 'leadership', name: 'Leadership', count: allProfessionalRecognitions.filter(t => t.category === 'leadership').length },
    { id: 'knowledge', name: 'Knowledge', count: allProfessionalRecognitions.filter(t => t.category === 'knowledge').length },
    { id: 'execution', name: 'Execution', count: allProfessionalRecognitions.filter(t => t.category === 'execution').length }
  ]
  
  // Load bonded contacts when modal opens
  useEffect(() => {
    if (open) {
      loadBondedContacts()
    }
  }, [open])
  
  const loadBondedContacts = async () => {
    try {
      setLoadingContacts(true)
      const sessionId = getSessionId()
      console.log('[PeerRecommendationModal] Loading bonded contacts for session:', sessionId)
      
      const contacts = await getBondedContactsAdapter(sessionId)
      console.log('[PeerRecommendationModal] Loaded bonded contacts:', contacts)
      
      setBondedContacts(contacts)
    } catch (error) {
      console.error('Failed to load bonded contacts:', error)
    } finally {
      setLoadingContacts(false)
    }
  }

  const handleRecognitionToggle = (recognitionId: string) => {
    setSelectedRecognitions(prev => 
      prev.includes(recognitionId)
        ? prev.filter(id => id !== recognitionId)
        : [...prev, recognitionId]
    )
  }
  
  const handleContactSelection = (contactId: string) => {
    setSelectedContactId(contactId)
    const contact = bondedContacts.find(c => c.id === contactId)
    if (contact) {
      setPeerName(contact.handle || contact.id)
      // For bonded contacts, we use their wallet address as recipientId
      setPeerEmail('') // Clear email since we have wallet address
    }
  }

  const handleSendRecommendation = async () => {
    if (!peerName || selectedRecognitions.length === 0) {
      toast.error('Please enter peer name and select at least one recognition')
      return
    }

    setSending(true)
    
    try {
      // Get current user info
      const sessionId = getSessionId()
      const senderName = sessionId.replace('tm-', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      
      // Send each recognition token individually
      const results = []
      const successfulTokens = []
      
      for (const tokenId of selectedRecognitions) {
        // Determine recipient ID - use wallet address for bonded contacts, fallback to email or generated ID
        const selectedContact = bondedContacts.find(c => c.id === selectedContactId)
        const recipientId = selectedContact?.id || peerEmail || `peer-${peerName.toLowerCase().replace(/\s+/g, '-')}`
        
        const request: RecognitionRequest = {
          recipientId,
          recipientName: peerName,
          tokenId,
          message: personalMessage || `Professional recognition from ${senderName}`,
          senderId: sessionId,
          senderName
        }
        
        const result = await professionalRecognitionService.sendRecognition(request)
        results.push(result)
        
        if (result.success) {
          successfulTokens.push(tokenId)
        }
      }
      
      const successCount = results.filter(r => r.success).length
      
      if (successCount > 0) {
        toast.success('🏆 Professional recognition sent to Hedera!', {
          description: `${successCount} tokens (${totalTrust.toFixed(1)} trust units) recorded on blockchain`,
          duration: 3000,
        })
        
        setTimeout(() => {
          setSending(false)
          toast.success('✨ Recognition tokens delivered on-chain!', {
            description: `${peerName} has received blockchain-verified professional endorsement`,
            duration: 4000,
          })
          
          // Reset form
          setPeerName('')
          setPeerEmail('')
          setPersonalMessage('')
          setSelectedRecognitions([])
          setSelectedContactId('')
          setSelectedCategory('all')
          setOpen(false)
        }, 2000)
      } else {
        throw new Error('Failed to send any recognition tokens')
      }
      
    } catch (error) {
      setSending(false)
      console.error('Recognition sending failed:', error)
      toast.error('❌ Failed to send recognition', {
        description: error instanceof Error ? error.message : 'Please try again',
        duration: 4000,
      })
    }
  }

  const selectedTokens = allProfessionalRecognitions.filter(r => 
    selectedRecognitions.includes(r.id)
  )
  const totalTrust = selectedTokens.reduce((sum, token) => sum + token.trustValue, 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl mx-auto bg-gradient-to-br from-slate-900/85 to-slate-800/80 backdrop-blur-xl border-2 border-[#00F6FF]/40 shadow-[0_0_40px_rgba(0,246,255,0.3),0_0_80px_rgba(0,246,255,0.1)] rounded-[10px] p-0 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-[#00F6FF]/20">
          <DialogTitle className="text-white text-2xl font-bold bg-gradient-to-r from-white to-[#00F6FF] bg-clip-text text-transparent flex items-center gap-2">
            <Award className="w-5 h-5 text-[#00F6FF]" />
            Recommend a Professional Peer
          </DialogTitle>
          <DialogDescription className="text-white/60 text-sm mt-2">
            Recognize your colleague's professional excellence with blockchain-verified tokens
          </DialogDescription>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1: Select Recipient - Bonded Contacts First */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#00F6FF] text-white text-xs font-bold flex items-center justify-center">1</div>
              <h3 className="text-lg font-semibold text-white">Select Recipient</h3>
            </div>
            
            {/* Bonded Contacts Dropdown - Priority */}
            {bondedContacts.length > 0 ? (
              <div className="space-y-3">
                <div className="bg-[#00F6FF]/10 border border-[#00F6FF]/30 rounded-lg p-3">
                  <Label className="text-sm font-medium text-white flex items-center gap-2 mb-2">
                    <UserCheck className="w-4 h-4 text-[#00F6FF]" />
                    Choose from your bonded contacts (recommended)
                  </Label>
                  <Select value={selectedContactId} onValueChange={handleContactSelection}>
                    <SelectTrigger className="bg-slate-800/50 border-white/20 text-white focus:border-[#00F6FF] focus:ring-1 focus:ring-[#00F6FF]/20">
                      <SelectValue placeholder={loadingContacts ? "Loading contacts..." : "Select a bonded contact"} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/20">
                      {bondedContacts.map((contact) => (
                        <SelectItem 
                          key={contact.id} 
                          value={contact.id}
                          className="text-white hover:bg-white/10 focus:bg-white/10"
                        >
                          <div className="flex items-center gap-3 py-1">
                            <UserCheck className="w-4 h-4 text-[#00F6FF]" />
                            <div>
                              <div className="font-medium">{contact.handle || `User ${contact.id.slice(-6)}`}</div>
                              <div className="text-xs text-white/60">Wallet: {contact.id.slice(0, 12)}...</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedContactId && (
                    <div className="mt-2 p-2 bg-[#00F6FF]/10 rounded border border-[#00F6FF]/20">
                      <p className="text-xs text-[#00F6FF] flex items-center gap-2">
                        <UserCheck className="w-3 h-3" />
                        Using wallet address: {selectedContactId.slice(0, 16)}...
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="text-center text-xs text-white/60">
                  or enter external contact details below ↓
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <p className="text-sm text-white/70">No bonded contacts found. Enter recipient details below.</p>
              </div>
            )}
          </div>

          {/* Step 2: Recognition Tokens */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#00F6FF] text-white text-xs font-bold flex items-center justify-center">2</div>
                <h3 className="text-lg font-semibold text-white">Choose Recognition Tokens</h3>
              </div>
              {selectedRecognitions.length > 0 && (
                <div className="text-sm text-[#00F6FF]">
                  {selectedRecognitions.length} selected • {totalTrust.toFixed(1)} trust units
                </div>
              )}
            </div>
            
            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((category) => {
                const isActive = selectedCategory === category.id
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-[#00F6FF] text-white shadow-[0_0_10px_rgba(0,246,255,0.4)]' 
                        : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {category.name} ({category.count})
                  </button>
                )
              })}
            </div>
            
            {/* Filtered results indicator */}
            {selectedCategory !== 'all' && (
              <div className="text-xs text-white/60 mb-2">
                Showing {professionalRecognitions.length} {selectedCategory} tokens
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {professionalRecognitions.map((recognition) => {
                        const Icon = recognition.icon
                        const isSelected = selectedRecognitions.includes(recognition.id)
                        
                        return (
                          <div
                            key={recognition.id}
                            onClick={() => handleRecognitionToggle(recognition.id)}
                            className={`cursor-pointer transition-all duration-200 p-2 rounded-md border ${
                              isSelected 
                                ? `${recognition.bgColor} ${recognition.borderColor}` 
                                : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                            } relative group`}
                            title={recognition.description}
                          >
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gradient-to-br from-slate-800 to-slate-900 text-white text-xs rounded-lg shadow-xl border border-[#00F6FF]/30 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[100] w-[66.66%] min-w-48 max-w-sm text-center whitespace-normal backdrop-blur-sm">
                              <div className="font-semibold mb-1 text-[#00F6FF]">{recognition.name}</div>
                              <div className="text-white/90 leading-relaxed">{recognition.description}</div>
                              <div className="text-xs text-[#00F6FF] mt-1 font-medium">{recognition.trustValue} trust units</div>
                              {/* Tooltip Arrow */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                                <div className="border-4 border-transparent border-t-slate-800"></div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`p-1 rounded-md bg-gradient-to-br ${recognition.color} ${isSelected ? 'shadow-lg' : ''} flex-shrink-0`}>
                                <Icon className="w-3 h-3 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className={`font-medium text-xs truncate ${isSelected ? 'text-white' : 'text-white/90'}`}>
                                  {recognition.name}
                                </h4>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs text-[#00F6FF] font-medium">
                                    {recognition.trustValue}
                                  </span>
                                  <span className={`text-xs px-1 py-0.5 rounded-sm ${recognition.bgColor} ${isSelected ? 'text-white/90' : 'text-white/60'} truncate max-w-[60px]`}>
                                    {recognition.category}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {/* Selection indicator */}
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-[#00F6FF] flex items-center justify-center">
                                <ChevronRight className="w-2 h-2 text-white transform rotate-45" />
                              </div>
                            )}
                            
                            {/* Tooltip indicator - subtle dot that appears on hover */}
                            <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                          </div>
                        )
                      })}
            </div>
          </div>

          {/* Step 3: External Contact Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center">3</div>
              <h3 className="text-lg font-semibold text-white">External Contact Details</h3>
              <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/70">
                {selectedContactId ? 'Optional - Override bonded contact' : 'Required for external contacts'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="peerName" className="text-sm font-medium text-white/80">
                  Full Name *
                </Label>
                <Input
                  id="peerName"
                  placeholder="John Smith"
                  value={peerName}
                  onChange={(e) => setPeerName(e.target.value)}
                  className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#00F6FF] focus:ring-1 focus:ring-[#00F6FF]/20"
                />
              </div>
              <div>
                <Label htmlFor="peerEmail" className="text-sm font-medium text-white/80">
                  Email Address {selectedContactId ? '(optional - wallet address preferred)' : ''}
                </Label>
                <Input
                  id="peerEmail"
                  type="email"
                  placeholder="john.smith@company.com"
                  value={peerEmail}
                  onChange={(e) => setPeerEmail(e.target.value)}
                  className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#00F6FF] focus:ring-1 focus:ring-[#00F6FF]/20"
                />
              </div>
            </div>
          </div>

          {/* Personal Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium text-white/80">
              Personal Message (Optional)
            </Label>
            <Textarea
              id="message"
              placeholder="Add a personal note about why you're recognizing this colleague..."
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#00F6FF] focus:ring-1 focus:ring-[#00F6FF]/20 resize-none"
              rows={3}
            />
          </div>

          {/* Send Button */}
          <div className="space-y-4">
            <Button
              onClick={handleSendRecommendation}
              disabled={!peerName || selectedRecognitions.length === 0 || sending}
              className="w-full bg-gradient-to-r from-[#00F6FF]/80 to-cyan-500/80 hover:from-[#00F6FF] hover:to-cyan-500 text-white font-medium py-3 text-base"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sending Recognition...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send Professional Recognition ({selectedRecognitions.length} tokens)
                </>
              )}
            </Button>
            
            <div className="bg-slate-800/30 p-4 rounded-[8px] border border-[#00F6FF]/10 backdrop-blur-sm">
              <p className="text-xs text-white/90 text-center leading-relaxed">
                🔒 Recognition tokens are immutably recorded on Hedera Consensus Service<br/>
                Your peer will receive a verified professional endorsement
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}