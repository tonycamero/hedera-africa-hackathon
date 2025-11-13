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
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
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
import { genzRecognitionService, type RecognitionRequest } from '@/lib/genzRecognitionService'
import { getSessionId } from '@/lib/session'
import { getBondedContactsAdapter } from '@/lib/adapters/hcsContactsAdapter'
// Removed EnhancedHCSDataService - using pure HCS data flow
import { signalsStore } from '@/lib/stores/signalsStore'
import { getBondedContactsFromHCS } from '@/lib/services/HCSDataUtils'
import { TokenDetailModal } from './TokenDetailModal'

interface PeerRecommendationModalProps {
  children: React.ReactNode
}

// Icon mapping for GenZ tokens (icons are emojis, but we'll map categories to Lucide icons)
const iconMap: Record<string, any> = {
  // Social category fallback
  social: Users,
  // Academic category fallback
  academic: BookOpen,
  // Professional category fallback
  professional: Briefcase,
  // Default fallback
  default: Star
}

// Style mapping for GenZ categories - magenta base theme
const categoryStyles: Record<string, any> = {
  social: {
    color: 'from-fuchsia-500 to-pink-500',
    bgColor: 'bg-fuchsia-500/15',
    borderColor: 'border-fuchsia-500/40',
    filterColor: 'bg-fuchsia-500 text-white',
    filterHover: 'bg-fuchsia-500/20 text-fuchsia-200'
  },
  academic: {
    color: 'from-purple-500 to-fuchsia-500',
    bgColor: 'bg-purple-500/15',
    borderColor: 'border-purple-500/40',
    filterColor: 'bg-purple-500 text-white',
    filterHover: 'bg-purple-500/20 text-purple-200'
  },
  professional: {
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-500/15', 
    borderColor: 'border-pink-500/40',
    filterColor: 'bg-pink-500 text-white',
    filterHover: 'bg-pink-500/20 text-pink-200'
  }
}

// Get GenZ recognition tokens with UI styling
const getGenZRecognitions = () => {
  const tokensByCategory = genzRecognitionService.getTokensByCategory()
  const allTokens = Object.values(tokensByCategory).flat()
  
  return allTokens.map(token => ({
    ...token,
    icon: iconMap[token.icon] || Star,
    ...categoryStyles[token.category] || categoryStyles.professional
  }))
}

interface BondedContact {
  id?: string
  peerId: string
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
  const [selectedCategory, setSelectedCategory] = useState<string>('social')
  const [detailToken, setDetailToken] = useState<any | null>(null)
  
// Get GenZ recognition tokens
  const allGenZRecognitions = getGenZRecognitions()
  const genZRecognitions = selectedCategory === 'all' 
    ? allGenZRecognitions.sort((a, b) => a.trustValue - b.trustValue)
    : allGenZRecognitions.filter(token => token.category === selectedCategory).sort((a, b) => a.trustValue - b.trustValue)
  
  // Category definitions - GenZ categories
  const categories = [
    { id: 'social', name: 'Social', count: allGenZRecognitions.filter(t => t.category === 'social').length },
    { id: 'academic', name: 'Academic', count: allGenZRecognitions.filter(t => t.category === 'academic').length },
    { id: 'professional', name: 'Professional', count: allGenZRecognitions.filter(t => t.category === 'professional').length },
    { id: 'all', name: 'All', count: allGenZRecognitions.length }
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
      
      // Load bonded contacts directly from signalsStore (same as contacts page)
      const contacts = signalsStore.getBondedContacts(effectiveSessionId)
      setBondedContacts(contacts)
      console.log(`[PeerRecommendationModal] Loaded ${contacts.length} bonded contacts from signalsStore`)
      
      // Pure HCS data flow - no enhanced contacts needed
      setEnhancedContacts([])
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
    const bondedContact = bondedContacts.find(c => c.peerId === contactId)
    if (bondedContact) {
      setPeerName(bondedContact.handle)
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
        // Determine recipient ID - use peerId for bonded contacts, fallback to email or generated ID
        const selectedContact = bondedContacts.find(c => c.peerId === selectedContactId)
        const recipientId = selectedContact?.peerId || peerEmail || `peer-${peerName.toLowerCase().replace(/\s+/g, '-')}`
        
        const request: RecognitionRequest = {
          recipientId,
          recipientName: peerName,
          tokenId,
          message: personalMessage || `Professional recognition from ${senderName}`,
          senderId: sessionId,
          senderName
        }
        
        const result = await genzRecognitionService.sendRecognition(request)
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

  const selectedTokens = allGenZRecognitions.filter(r => 
    selectedRecognitions.includes(r.id)
  )
  const totalTrust = selectedTokens.reduce((sum, token) => sum + token.trustValue, 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
        <DialogContent className="!fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 w-80 max-w-[calc(100vw-2rem)] z-[100] modal-magenta-base sheen-sweep modal-magenta-border rounded-[10px] p-0 animate-in zoom-in-90 fade-in-0 duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] relative before:absolute before:inset-0 before:rounded-[10px] before:p-[2px] before:bg-gradient-to-r before:from-[#FF6B35]/40 before:via-transparent before:to-[#FF6B35]/40 before:-z-10 before:animate-pulse">
          <VisuallyHidden>
            <DialogDescription>Send recognition signals to your contacts</DialogDescription>
          </VisuallyHidden>
          {/* Compact Header */}
        <div className="p-4 pb-3 border-b border-fuchsia-500/20">
          <DialogTitle className="bg-gradient-to-r from-white via-fuchsia-400 to-pink-500 bg-clip-text text-transparent text-lg font-bold flex items-center gap-2">
            <Award className="w-4 h-4 text-fuchsia-500" />
            Send this Signal!
          </DialogTitle>
        </div>

        <div className="p-4 space-y-4">
          {/* Quick Recipient Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white">Pick from your trusted contacts list:</Label>
            {(bondedContacts.length > 0 || enhancedContacts.length > 0) ? (
              <Select value={selectedContactId} onValueChange={handleContactSelection}>
                <SelectTrigger className="bg-black/30 border-white/20 text-white focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/50 transition-all">
                  <SelectValue placeholder={loadingContacts ? "Loading..." : "Select contact"} />
                </SelectTrigger>
                <SelectContent className="z-[200] max-h-[300px] overflow-y-auto bg-slate-900/95 border-fuchsia-500/30">
                  {/* Bonded contacts first */}
                  {bondedContacts.map((contact) => (
                    <SelectItem key={contact.peerId} value={contact.peerId} className="text-white hover:bg-fuchsia-500/20">
                      {contact.handle}
                    </SelectItem>
                  ))}
                  {/* Enhanced contacts */}
                  {enhancedContacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id} className="text-white hover:bg-fuchsia-500/20">
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
                className="bg-black/30 border-white/20 text-white placeholder:text-white/40 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/50 transition-all"
              />
            )}
          </div>

          {/* Recognition Tokens - Compact Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-white">Browse tokens by category:</Label>
              {selectedRecognitions.length > 0 && (
                <span className="text-xs text-fuchsia-400">{totalTrust.toFixed(1)} trust units</span>
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
                        ? (category.id === 'all' ? 'bg-yellow-500 text-black' : categoryStyle.filterColor)
                        : (category.id === 'all' ? 'bg-white/10 text-white/70 hover:bg-white/20' : `${categoryStyle.filterHover} hover:${categoryStyle.filterHover}`)
                    }`}
                  >
                    {category.name}
                  </button>
                )
              })}
            </div>
            
            {/* Token Grid - Cleaner Layout */}
            <div className="grid grid-cols-3 gap-2 max-h-[40vh] overflow-y-auto">
              {genZRecognitions.map((recognition) => {
                const Icon = recognition.icon
                const isSelected = selectedRecognitions.includes(recognition.id)
                
                return (
                  <div
                    key={recognition.id}
                    onClick={() => handleTokenDetail(recognition)}
                    className={`cursor-pointer p-3 rounded-lg border transition-all text-center ${
                      isSelected 
                        ? 'bg-white/10 border-white shadow-lg' 
                        : 'bg-panel border-white/20 hover:border-white/40'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Icon className="w-6 h-6 text-white" />
                      <div className="text-xs text-white font-medium leading-tight">{recognition.name}</div>
                      <div className="text-xs text-white/60">{recognition.trustValue}</div>
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
              className="bg-black/30 border-white/20 text-white placeholder:text-white/40 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/50 transition-all resize-none"
              rows={2}
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendRecommendation}
            disabled={!peerName || selectedRecognitions.length === 0 || sending}
            className="w-full bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600 text-white font-semibold py-3 shadow-[0_0_20px_rgba(217,70,239,0.5)] hover:shadow-[0_0_30px_rgba(217,70,239,0.7)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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