"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Award, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getSessionId } from '@/lib/session'
import { recognitionSignals, type RecognitionSignal, type SignalCategory } from '@/lib/data/recognitionSignals'
import { SignalDetailModal } from './SignalDetailModal'
import { magic } from '@/lib/magic'
import { payTRSTToTreasury } from '@/lib/hedera/transferTRST'
import { signalsStore, type BondedContact } from '@/lib/stores/signalsStore'

interface SendSignalsModalProps {
  children: React.ReactNode
}

// Category styles matching the theme
const categoryStyles: Record<SignalCategory, { bgColor: string; borderColor: string; activeColor: string }> = {
  social: {
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    activeColor: 'bg-blue-500 text-white'
  },
  academic: {
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    activeColor: 'bg-purple-500 text-white'
  },
  professional: {
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    activeColor: 'bg-orange-500 text-white'
  },
  civic: {
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    activeColor: 'bg-green-500 text-white'
  }
}

export function SendSignalsModal({ children }: SendSignalsModalProps) {
  const [open, setOpen] = useState(false)
  const [selectedSignalId, setSelectedSignalId] = useState<string>('')
  const [selectedContactId, setSelectedContactId] = useState('')
  const [personalMessage, setPersonalMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [bondedContacts, setBondedContacts] = useState<BondedContact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<SignalCategory | 'all'>('all')
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailSignal, setDetailSignal] = useState<RecognitionSignal | null>(null)
  
  // Filter signals by category
  const filteredSignals = selectedCategory === 'all'
    ? recognitionSignals
    : recognitionSignals.filter(s => s.category === selectedCategory)
  
  // Calculate category counts
  const categoryCounts = {
    social: recognitionSignals.filter(s => s.category === 'social').length,
    academic: recognitionSignals.filter(s => s.category === 'academic').length,
    professional: recognitionSignals.filter(s => s.category === 'professional').length,
    civic: recognitionSignals.filter(s => s.category === 'civic').length,
    all: recognitionSignals.length
  }
  
  const selectedSignal = recognitionSignals.find(s => s.id === selectedSignalId)
  const selectedContact = bondedContacts.find(c => c.peerId === selectedContactId)
  
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
      
      if (!sessionId) {
        toast.error('Please sign in to send signals')
        return
      }
      
      // Load contacts directly from signalsStore (same as /contacts page)
      const contacts = signalsStore.getBondedContacts(sessionId)
      setBondedContacts(contacts)
      console.log(`[SendSignals] Loaded ${contacts.length} bonded contacts from signalsStore`)
    } catch (error) {
      console.error('[SendSignals] Error loading contacts:', error)
      toast.error('Failed to load contacts')
    } finally {
      setLoadingContacts(false)
    }
  }
  
  const handleSendSignal = async () => {
    console.log('[SendSignals] handleSendSignal called')
    console.log('[SendSignals] Selected signal:', selectedSignalId)
    console.log('[SendSignals] Selected contact:', selectedContactId)
    
    if (!selectedSignal || !selectedContactId) {
      toast.error('Please select a signal and a contact')
      return
    }
    
    const sessionId = getSessionId()
    if (!sessionId) {
      toast.error('Please sign in to send signals')
      return
    }
    
    console.log('[SendSignals] Starting send process...')
    setSending(true)
    
    try {
      // Get user's Hedera credentials from Magic
      if (!magic) {
        throw new Error('Magic SDK not initialized')
      }
      
      const { publicKeyDer, accountId } = await magic.hedera.getPublicKey()
      
      // Fetch sender's display name from user's localStorage profile
      let senderName = sessionId
      try {
        // Try to get display name from Magic user info
        const usersData = localStorage.getItem('tm:users')
        if (usersData) {
          const allUsers = JSON.parse(usersData)
          const currentUser = allUsers.find((u: any) => u.hederaAccountId === sessionId)
          if (currentUser?.displayName) {
            senderName = currentUser.displayName
          } else if (currentUser?.email) {
            // Fallback to email name
            const emailName = currentUser.email.split('@')[0]
            senderName = emailName || currentUser.email
          }
        }
      } catch (error) {
        console.warn('[SendSignals] Could not resolve sender profile:', error)
      }
      
      // Use contact's handle as recipient name
      const recipientName = selectedContact?.handle || selectedContactId
      
      // Create the canonical payload
      const payload = {
        fromAccountId: sessionId,
        toAccountId: selectedContactId,
        message: personalMessage || `Professional recognition: ${selectedSignal.name}`,
        trustAmount: selectedSignal.trustValue,
        metadata: {
          category: selectedSignal.category,
          tags: selectedSignal.tags,
          signalId: selectedSignal.id,
          rarity: selectedSignal.rarity
        },
        timestamp: Date.now()
      }
      
      // Create canonical string for signing
      const canonical = JSON.stringify(payload, Object.keys(payload).sort())
      const messageBytes = new TextEncoder().encode(canonical)
      
      // Sign with Magic (private key never exposed)
      const signatureBytes = await magic.hedera.sign(messageBytes)
      const signature = Buffer.from(signatureBytes).toString('hex')
      
      const signedPayload = {
        ...payload,
        signature,
        publicKey: publicKeyDer
      }
      
      // Submit to HCS mint endpoint
      const response = await fetch('/api/hcs/mint-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: selectedSignal.id,
          name: selectedSignal.name,
          category: selectedSignal.category,
          subtitle: selectedSignal.description,
          emoji: selectedSignal.icon,
          issuerId: sessionId,
          recipientId: selectedContactId,
          senderName,
          recipientName,
          trustAmount: selectedSignal.trustValue,
          message: personalMessage || `Recognition: ${selectedSignal.name}`,
          signature: signedPayload.signature,
          publicKey: signedPayload.publicKey,
          timestamp: signedPayload.timestamp
        })
      })
      
      const result = await response.json()
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to send signal')
      }
      
      // Execute TRST payment to treasury
      console.log(`[SendSignals] Mint successful, now paying ${result.trstCost} TRST to treasury`)
      try {
        const paymentTxId = await payTRSTToTreasury(result.trstCost)
        console.log(`[SendSignals] TRST payment successful: ${paymentTxId}`)
        
        toast.success('🎉 Signal sent on-chain!', {
          description: `${selectedSignal.icon} ${selectedSignal.name} → ${selectedContact?.handle || selectedContactId} (${result.trstCost} TRST)`,
          duration: 4000,
        })
      } catch (paymentError: any) {
        console.error('[SendSignals] TRST payment failed:', paymentError)
        toast.error('Signal minted but payment failed', {
          description: paymentError.message || 'TRST transfer failed',
          duration: 6000,
        })
        // Don't throw - mint succeeded even if payment failed
      }
      
      // Reset form
      setSelectedSignalId('')
      setSelectedContactId('')
      setPersonalMessage('')
      setSelectedCategory('all')
      setOpen(false)
      
    } catch (error: any) {
      console.error('[SendSignals] Error sending signal:', error)
      toast.error('Failed to send signal', {
        description: error.message || 'Please try again',
        duration: 4000,
      })
    } finally {
      setSending(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-white/20">
        <VisuallyHidden>
          <DialogDescription>Send recognition signals to your contacts</DialogDescription>
        </VisuallyHidden>
        
        {/* Header */}
        <DialogHeader className="border-b border-white/10 pb-4">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            <Award className="w-6 h-6 text-orange-500" />
            Send Recognition Signal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Contact Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Select Contact
            </label>
            {bondedContacts.length > 0 ? (
              <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                <SelectTrigger className="bg-slate-800/50 border-white/20 text-white">
                  <SelectValue placeholder={loadingContacts ? "Loading..." : "Choose a contact"} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/20">
                  {bondedContacts.map((contact) => (
                    <SelectItem 
                      key={contact.peerId} 
                      value={contact.peerId}
                      className="text-white hover:bg-white/10"
                    >
                      {contact.handle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-white/60 text-sm bg-slate-800/30 p-3 rounded border border-white/10">
                {loadingContacts ? 'Loading contacts...' : 'No bonded contacts found. Add contacts first.'}
              </div>
            )}
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Browse Signals by Category
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('all')}
                className={selectedCategory === 'all' ? 'bg-white text-black' : 'border-white/20 text-white hover:bg-white/10'}
              >
                All ({categoryCounts.all})
              </Button>
              {(['social', 'academic', 'professional', 'civic'] as SignalCategory[]).map((cat) => {
                const style = categoryStyles[cat]
                return (
                  <Button
                    key={cat}
                    size="sm"
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(cat)}
                    className={selectedCategory === cat ? style.activeColor : 'border-white/20 text-white hover:bg-white/10'}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)} ({categoryCounts[cat]})
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Signal Selection Grid */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Select Signal {selectedSignal && (
                <span className="text-orange-400 ml-2">
                  ({selectedSignal.trustValue} trust · {selectedSignal.rarity})
                </span>
              )}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[40vh] overflow-y-auto p-1 bg-slate-900/30 rounded-lg border border-white/10">
              {filteredSignals.map((signal) => {
                const isSelected = selectedSignalId === signal.id
                const style = categoryStyles[signal.category]
                
                return (
                  <button
                    key={signal.id}
                    onClick={() => {
                      setDetailSignal(signal)
                      setDetailModalOpen(true)
                    }}
                    className={`p-3 rounded-lg border transition-all text-center ${
                      isSelected
                        ? 'bg-white/20 border-white shadow-lg scale-105'
                        : `${style.bgColor} ${style.borderColor} hover:border-white/40 hover:scale-102`
                    }`}
                  >
                    <div className="text-3xl mb-1">{signal.icon}</div>
                    <div className="text-xs text-white font-medium leading-tight line-clamp-2">
                      {signal.name}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected Signal Details */}
          {selectedSignal && (
            <div className="bg-slate-800/50 p-4 rounded-lg border border-white/20">
              <div className="flex items-start gap-3">
                <div className="text-4xl">{selectedSignal.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg">{selectedSignal.name}</h3>
                  <p className="text-white/70 text-sm mt-1">{selectedSignal.description}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-1 rounded bg-white/10 text-white">
                      {selectedSignal.category}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-300">
                      {selectedSignal.rarity}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Personal Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Add a Message (Optional)
            </label>
            <Textarea
              placeholder="Why are you recognizing them?"
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/40 resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-white/50 text-right">
              {personalMessage.length}/500
            </div>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendSignal}
            disabled={!selectedSignal || !selectedContactId || sending}
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-400 hover:from-orange-600 hover:to-yellow-500 text-black font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {sending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sending to Hedera...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send Signal
              </>
            )}
          </Button>
        </div>
      </DialogContent>
      
      {/* Signal Detail Modal */}
      <SignalDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        signal={detailSignal}
        onSelect={() => {
          if (detailSignal) {
            setSelectedSignalId(detailSignal.id)
          }
        }}
        showSelectButton={true}
      />
    </Dialog>
  )
}
