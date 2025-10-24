'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SignalType, SignalInstance } from '@/lib/types/signals-collectible'
import { getCategoryIcon, getRarityTheme, formatRarityDisplay } from '@/lib/ui/signal-rarities'
import { GenZButton, GenZCard, GenZText, GenZHeading } from '@/components/ui/genz-design-system'
import { User, Send, Sparkles, Database, Zap, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { signalsStore, type BondedContact } from '@/lib/stores/signalsStore'
import { getBondedContactsFromHCS } from '@/lib/services/HCSDataUtils'
import { getSessionId } from '@/lib/session'

interface MintSignalFlowProps {
  selectedType: SignalType
  onBack: () => void
  onComplete: (signal: SignalInstance) => void
}

export function MintSignalFlow({ selectedType, onBack, onComplete }: MintSignalFlowProps) {
  const [step, setStep] = useState<'recipient' | 'inscription' | 'preview' | 'minting'>('recipient')
  const [recipient, setRecipient] = useState('')
  const [inscription, setInscription] = useState('')
  const [contacts, setContacts] = useState<BondedContact[]>([])
  const [loading, setLoading] = useState(true)
  
  const theme = getRarityTheme(selectedType.rarity)

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      const sessionId = getSessionId() || 'tm-alex-chen'
      const allEvents = signalsStore.getAll()
      const bondedContacts = getBondedContactsFromHCS(allEvents, sessionId)
      setContacts(bondedContacts)
    } catch (error) {
      console.error('Failed to load contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMint = async () => {
    setStep('minting')
    
    try {
      // Get user session info
      const issuerId = getSessionId() || 'tm-alex-chen'
      
      // Convert recipient handle to account ID (simplified for demo)
      // In production, this would do proper handle-to-accountId resolution
      const recipientId = recipient.startsWith('0.0.') ? recipient : '0.0.123456' // Demo fallback
      
      console.log('[MintSignalFlow] Minting hashinal NFT:', {
        recipientId,
        recognitionId: selectedType.base_id || selectedType.category.toLowerCase(),
        issuerId,
        inscriptionLength: inscription.length
      })
      
      // Call our new hashinal minting API
      const response = await fetch('/api/hashinals/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId,
          recognitionId: selectedType.base_id || selectedType.category.toLowerCase(),
          inscription,
          issuerId
        })
      })
      
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || `Server error: ${response.status}`)
      }
      
      console.log('[MintSignalFlow] Hashinal minted successfully:', result.data)
      
      // Create SignalInstance object with hashinal data
      const newSignal: SignalInstance = {
        instance_id: result.data.serialNumber || `inst_${Date.now()}`,
        type_id: selectedType.type_id,
        issuer_pub: issuerId,
        recipient_pub: recipient,
        issued_at: result.data.mintedAt || new Date().toISOString(),
        metadata: {
          category: selectedType.category,
          rarity: selectedType.rarity,
          inscription,
          labels: selectedType.example_labels?.slice(0, 3) || [selectedType.category],
          // Include hashinal-specific metadata
          tokenId: result.data.tokenId,
          serialNumber: result.data.serialNumber,
          transactionId: result.data.transactionId,
          hcsReference: result.data.hcsReference,
          isHashinal: true
        }
      }

      toast.success('Hashinal NFT minted! 🎨⚡', {
        description: `${selectedType.category} recognition NFT created for ${recipient}`,
        duration: 5000
      })

      onComplete(newSignal)
      
    } catch (error: any) {
      console.error('[MintSignalFlow] Minting failed:', error)
      
      toast.error('Minting failed 😞', {
        description: error.message || 'Failed to create recognition NFT. Please try again.',
        duration: 6000
      })
      
      // Go back to preview step so user can retry
      setStep('preview')
    }
  }

  const canProceed = () => {
    switch (step) {
      case 'recipient':
        return recipient.trim().length > 0
      case 'inscription':
        return true // Inscription is optional
      case 'preview':
        return true
      default:
        return false
    }
  }

  if (step === 'minting') {
    return (
      <GenZCard variant="glass" className="p-8">
        <div className="text-center space-y-4">
          <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-2xl animate-pulse`}>
            {getCategoryIcon(selectedType.category)}
          </div>
          <div>
            <GenZHeading level={3} className="mb-2">Minting Hashinal NFT...</GenZHeading>
            <GenZText size="sm" dim>Creating transferable recognition token on Hedera</GenZText>
            <GenZText size="xs" dim className="mt-1">This creates a real NFT that can be owned, traded, and transferred!</GenZText>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
            <GenZText size="xs" dim>HCS-5 Standard</GenZText>
          </div>
        </div>
      </GenZCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-sm`}>
              {getCategoryIcon(selectedType.category)}
            </div>
            <div>
              <h3 className="font-semibold text-sm">{selectedType.category}</h3>
              <Badge variant="secondary" className="text-xs">
                {formatRarityDisplay(selectedType.rarity)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {['recipient', 'inscription', 'preview'].map((stepName, idx) => (
          <div key={stepName} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              step === stepName ? 'bg-blue-500 text-white' :
              ['recipient', 'inscription'].indexOf(step) > ['recipient', 'inscription'].indexOf(stepName) ? 'bg-green-500 text-white' :
              'bg-gray-200 text-gray-600'
            }`}>
              {idx + 1}
            </div>
            {idx < 2 && (
              <div className={`w-8 h-0.5 ${
                ['recipient', 'inscription'].indexOf(step) > idx ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <GenZCard variant="glass" className="p-6">
        {step === 'recipient' && (
          <div className="space-y-4">
            <div>
              <GenZHeading level={4} className="mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Select Recipient
              </GenZHeading>
              <GenZText size="sm" dim>Who should receive this signal?</GenZText>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Recipient Handle</label>
                <Input
                  placeholder="Enter recipient's handle (e.g., @username)"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Quick Select from Contacts */}
              {contacts.length > 0 && (
                <div>
                  <GenZText size="sm" dim className="mb-2">Or select from your network:</GenZText>
                  <div className="grid grid-cols-2 gap-2">
                    {contacts.slice(0, 4).map((contact) => {
                      const displayName = contact.handle || `User${contact.peerId?.slice(-3)}`
                      return (
                        <Button
                          key={contact.peerId}
                          variant="outline"
                          size="sm"
                          onClick={() => setRecipient(displayName)}
                          className="text-left justify-start"
                        >
                          <User className="w-3 h-3 mr-2" />
                          {displayName}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'inscription' && (
          <div className="space-y-4">
            <div>
              <GenZHeading level={4} className="mb-2">Write Props (Optional)</GenZHeading>
              <GenZText size="sm" dim>Why does {recipient} deserve this {selectedType.category} recognition?</GenZText>
            </div>

            <div className="space-y-3">
              <Textarea
                placeholder={`Be specific. What did they do? What context? (optional, max 280)`}
                value={inscription}
                onChange={(e) => setInscription(e.target.value)}
                className="min-h-24"
                maxLength={280}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>This message is permanently attached to the NFT</span>
                <span>{inscription.length}/280</span>
              </div>
            </div>

            {/* Suggested Labels */}
            <div>
              <GenZText size="sm" dim className="mb-2">Suggested labels:</GenZText>
              <div className="flex flex-wrap gap-1">
                {selectedType.example_labels.map((label, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div>
              <GenZHeading level={4} className="mb-2">Preview Signal</GenZHeading>
              <GenZText size="sm" dim>Review your signal before minting</GenZText>
            </div>

            {/* Preview Card */}
            <Card className={`p-4 bg-gradient-to-br ${theme.gradient} ${theme.glow} shadow-xl border-2 ${theme.border} relative overflow-hidden`}>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getCategoryIcon(selectedType.category)}</div>
                    <div>
                      <h4 className="font-bold text-white">{selectedType.category}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {formatRarityDisplay(selectedType.rarity)}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right text-white/70 text-xs">
                    <div>To: {recipient}</div>
                    <div>Now</div>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-white font-medium leading-relaxed">
                    "{inscription}"
                  </p>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {selectedType.example_labels.slice(0, 3).map((label, idx) => (
                    <Badge key={idx} variant="outline" className="text-white/90 border-white/30 bg-white/10 text-xs">
                      {label}
                    </Badge>
                  ))}
                </div>

                <div className="text-white/70 text-xs border-t border-white/20 pt-2">
                  From: {getSessionId() || 'tm-alex-chen'}
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-center">
              <Badge className={`${getDataSourceBadgeColor('signals')} flex items-center gap-1`}>
                {getDataSourceLabel('signals') === 'Mock Data' ? <Database className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                Will mint via {getDataSourceLabel('signals')}
              </Badge>
            </div>
          </div>
        )}
      </GenZCard>

      {/* Actions */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => {
            if (step === 'recipient') onBack()
            else if (step === 'inscription') setStep('recipient')
            else if (step === 'preview') setStep('inscription')
          }}
          disabled={step === 'recipient'}
        >
          Back
        </Button>
        
        <GenZButton
          variant="boost"
          onClick={() => {
            if (step === 'recipient') setStep('inscription')
            else if (step === 'inscription') setStep('preview')
            else if (step === 'preview') handleMint()
          }}
          disabled={!canProceed()}
          className="px-6"
          glow={step === 'preview'}
        >
          {step === 'preview' ? (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Mint Signal
            </>
          ) : (
            <>
              Continue
              <Send className="w-4 h-4 ml-2" />
            </>
          )}
        </GenZButton>
      </div>
    </div>
  )
}