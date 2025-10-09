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
// Removed EnhancedHCSDataService - using pure HCS data flow
import { signalsStore } from '@/lib/stores/signalsStore'
import { getBondedContactsFromHCS } from '@/lib/services/HCSDataUtils'
import { TokenDetailModal } from './TokenDetailModal'

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

// Style mapping for categories - Earth tones
const categoryStyles: Record<string, any> = {
  leadership: {
    color: 'from-orange-600 to-orange-500',
    bgColor: 'bg-orange-500/15',
    borderColor: 'border-orange-500/40',
    filterColor: 'bg-orange-500 text-white',
    filterHover: 'bg-orange-500/20 text-orange-200'
  },
  knowledge: {
    color: 'from-emerald-600 to-teal-500', 
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/40',
    filterColor: 'bg-emerald-600 text-white',
    filterHover: 'bg-emerald-500/20 text-emerald-200'
  },
  execution: {
    color: 'from-purple-600 to-purple-500',
    bgColor: 'bg-purple-500/15', 
    borderColor: 'border-purple-500/40',
    filterColor: 'bg-purple-500 text-white',
    filterHover: 'bg-purple-500/20 text-purple-200'
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
  const [enhancedContacts, setEnhancedContacts] = useState<any[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('leadership')
  const [detailToken, setDetailToken] = useState<any | null>(null)
  
  // Get professional recognition tokens
  const allProfessionalRecognitions = getProfessionalRecognitions()
  const professionalRecognitions = selectedCategory === 'all' 
    ? allProfessionalRecognitions.sort((a, b) => a.trustValue - b.trustValue)
    : allProfessionalRecognitions.filter(token => token.category === selectedCategory).sort((a, b) => a.trustValue - b.trustValue)
  
  // Category definitions - Leadership first, All last
  const categories = [
    { id: 'leadership', name: 'Leadership', count: allProfessionalRecognitions.filter(t => t.category === 'leadership').length },
    { id: 'knowledge', name: 'Knowledge', count: allProfessionalRecognitions.filter(t => t.category === 'knowledge').length },
    { id: 'execution', name: 'Execution', count: allProfessionalRecognitions.filter(t => t.category === 'execution').length },
    { id: 'all', name: 'All', count: allProfessionalRecognitions.length }
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
      const effectiveSessionId = sessionId || 'tm-alex-chen'
      console.log('[PeerRecommendationModal] Loading contacts for session:', effectiveSessionId)
      
      // Load bonded contacts from HCS (same as contacts page)
      const allEvents = signalsStore.getAll()
      const contacts = getBondedContactsFromHCS(allEvents, effectiveSessionId)
      setBondedContacts(contacts)
      
      // Pure HCS data flow - no enhanced contacts needed
      setEnhancedContacts([])
      
      console.log(`[PeerRecommendationModal] Loaded ${contacts.length} bonded contacts (pure HCS data)`)
    } catch (error) {
      console.error('Failed to load contacts:', error)
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
  
  const handleTokenDetail = (token: any) => {
    setDetailToken(token)
  }
  
  const handleContactSelection = (contactId: string) => {
    setSelectedContactId(contactId)
    // Check bonded contacts first
    const bondedContact = bondedContacts.find(c => (c.id || c.peerId) === contactId)
    if (bondedContact) {
      setPeerName(bondedContact.handle || bondedContact.id || bondedContact.peerId)
      setPeerEmail('') // Clear email since we have wallet address
      return
    }
    // Check enhanced contacts
    const enhancedContact = enhancedContacts.find(c => c.id === contactId)
    if (enhancedContact) {
      setPeerName(enhancedContact.name)
      setPeerEmail('') // Clear email
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
      
        <DialogContent className="w-80 max-w-[20rem] mx-auto bg-gradient-to-br from-slate-900/85 to-slate-800/80 backdrop-blur-xl border-2 border-[#00F6FF]/40 shadow-[0_0_40px_rgba(0,246,255,0.3),0_0_80px_rgba(0,246,255,0.1)] rounded-[10px] p-0 animate-in zoom-in-90 fade-in-0 duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
        {/* Compact Header */}
        <div className="p-4 pb-3 border-b border-[#00F6FF]/20">
          <DialogTitle className="text-white text-lg font-bold flex items-center gap-2">
            <Award className="w-4 h-4 text-[#00F6FF]" />
            Send this Signal!
          </DialogTitle>
        </div>

        <div className="p-4 space-y-4">
          {/* Quick Recipient Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white">Pick from your trusted contacts list:</Label>
            {(bondedContacts.length > 0 || enhancedContacts.length > 0) ? (
              <Select value={selectedContactId} onValueChange={handleContactSelection}>
                <SelectTrigger className="bg-slate-800 border-white/20 text-white focus:border-[#00F6FF]">
                  <SelectValue placeholder={loadingContacts ? "Loading..." : "Select contact"} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/20">
                  {/* Bonded contacts first */}
                  {bondedContacts.map((contact) => (
                    <SelectItem key={contact.id || contact.peerId} value={contact.id || contact.peerId} className="text-white hover:bg-slate-700">
                      {contact.handle || `User ${(contact.id || contact.peerId).slice(-6)}`}
                    </SelectItem>
                  ))}
                  {/* Enhanced contacts */}
                  {enhancedContacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id} className="text-white hover:bg-slate-700">
                      {contact.name} - {contact.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="Enter recipient name"
                value={peerName}
                onChange={(e) => setPeerName(e.target.value)}
                className="bg-slate-800 border-white/20 text-white placeholder:text-white/40 focus:border-[#00F6FF]"
              />
            )}
          </div>

          {/* Recognition Tokens - Compact Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-white">Browse tokens by category:</Label>
              {selectedRecognitions.length > 0 && (
                <span className="text-xs text-[#00F6FF]">{totalTrust.toFixed(1)} trust units</span>
              )}
            </div>
            
            {/* Quick Category Filter */}
            <div className="flex gap-1">
              {categories.slice(0, 4).map((category) => {
                const isActive = selectedCategory === category.id
                const categoryStyle = categoryStyles[category.id] || categoryStyles.execution
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-2 py-1 rounded text-xs font-medium transition ${
                      isActive 
                        ? (category.id === 'all' ? 'bg-[#00F6FF] text-black' : categoryStyle.filterColor)
                        : (category.id === 'all' ? 'bg-white/10 text-white/70 hover:bg-white/20' : `${categoryStyle.filterHover} hover:${categoryStyle.filterHover}`)
                    }`}
                  >
                    {category.name}
                  </button>
                )
              })}
            </div>
            
            {/* Compact Token Grid */}
            <div className="grid grid-cols-3 gap-1">
              {professionalRecognitions.map((recognition) => {
                const Icon = recognition.icon
                const isSelected = selectedRecognitions.includes(recognition.id)
                
                return (
                  <div
                    key={recognition.id}
                    onClick={() => handleTokenDetail(recognition)}
                    className={`cursor-pointer p-1.5 rounded border transition-all ${
                      isSelected 
                        ? `${recognition.bgColor} ${recognition.borderColor}` 
                        : 'bg-slate-800 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <div className={`p-1 rounded border ${
                        recognition.category === 'leadership' ? 'border-orange-400/50 bg-orange-400/10' :
                        recognition.category === 'knowledge' ? 'border-emerald-400/50 bg-emerald-400/10' :
                        recognition.category === 'execution' ? 'border-purple-400/50 bg-purple-400/10' : 'border-[#00F6FF]/50 bg-[#00F6FF]/10'
                      }`}>
                        <Icon className={`w-2.5 h-2.5 ${
                          recognition.category === 'leadership' ? 'text-orange-400' :
                          recognition.category === 'knowledge' ? 'text-emerald-400' :
                          recognition.category === 'execution' ? 'text-purple-400' : 'text-[#00F6FF]'
                        }`} />
                      </div>
                      <div className="text-[10px] text-white text-center truncate w-full leading-tight">{recognition.name}</div>
                      <div className={`text-[10px] font-medium ${
                        recognition.category === 'leadership' ? 'text-orange-400' :
                        recognition.category === 'knowledge' ? 'text-emerald-400' :
                        recognition.category === 'execution' ? 'text-purple-400' : 'text-[#00F6FF]'
                      }`}>{recognition.trustValue}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Optional Message */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white">Message (Optional):</Label>
            <Textarea
              placeholder="Why are you recognizing them?"
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              className="bg-slate-800 border-white/20 text-white placeholder:text-white/40 focus:border-[#00F6FF] resize-none"
              rows={2}
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendRecommendation}
            disabled={!peerName || selectedRecognitions.length === 0 || sending}
            className="w-full bg-gradient-to-r from-[#00F6FF] to-cyan-500 hover:from-[#00F6FF]/90 hover:to-cyan-500/90 text-black font-medium py-3"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Signal ({selectedRecognitions.length})
              </>
            )}
          </Button>
        </div>
        
        {/* Token Detail Modal */}
        <TokenDetailModal
          token={detailToken}
          isSelected={detailToken ? selectedRecognitions.includes(detailToken.id) : false}
          onClose={() => setDetailToken(null)}
          onSelect={() => {
            if (detailToken) {
              handleRecognitionToggle(detailToken.id)
              setDetailToken(null)
            }
          }}
          onSend={handleSendRecommendation}
          selectedCount={selectedRecognitions.length}
          sending={sending}
        />
      </DialogContent>
    </Dialog>
  )
}