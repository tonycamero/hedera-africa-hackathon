"use client"

import { useState, useEffect } from 'react'
import { Zap, Heart, Send, TrendingUp, User, Star } from 'lucide-react'
import { SendSignalModal } from '@/components/SendSignalModal'
import { signalsStore, type BondedContact } from '@/lib/stores/signalsStore'
import { getBondedContactsFromHCS, getTrustLevelsPerContact } from '@/lib/services/HCSDataUtils'
import { getSessionId } from '@/lib/session'
import { GenZButton, GenZCard, GenZHeading, GenZText, genZClassNames } from '@/components/ui/genz-design-system'
import { toast } from 'sonner'

// RecognitionSignal interface for boost feed
interface RecognitionSignal {
  id: string
  senderName: string
  recipientName: string
  signalText: string
  timestamp: number
  boostCount: number
  isBoosted: boolean
  isFromMyNetwork: boolean
}

export default function SignalsPage() {
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [bondedContacts, setBondedContacts] = useState<BondedContact[]>([])
  const [trustLevels, setTrustLevels] = useState<Map<string, { allocatedTo: number, receivedFrom: number }>>(new Map())
  const [sessionId, setSessionId] = useState("")
  const [loading, setLoading] = useState(true)

  // Load contacts and trust data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const currentSessionId = getSessionId()
        const effectiveSessionId = currentSessionId || 'tm-alex-chen'
        setSessionId(effectiveSessionId)
        
        const allEvents = signalsStore.getAll()
        const contacts = getBondedContactsFromHCS(allEvents, effectiveSessionId)
        const trustData = getTrustLevelsPerContact(allEvents, effectiveSessionId)
        
        setBondedContacts(contacts)
        setTrustLevels(trustData)
        
        console.log(`[SignalsPage] Loaded ${contacts.length} contacts with trust data`)
      } catch (error) {
        console.error('[SignalsPage] Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
    
    const unsubscribe = signalsStore.subscribe(loadData)
    return unsubscribe
  }, [])

  // Get my inner circle (people I've allocated trust to)
  const myInnerCircle = bondedContacts.filter(contact => {
    const trustData = trustLevels.get(contact.peerId || '') || { allocatedTo: 0, receivedFrom: 0 }
    return trustData.allocatedTo > 0
  })

  // Generate recognition signals for boost feed
  const generateRecognitionSignals = (): RecognitionSignal[] => {
    const recognitionTemplates = [
      "Just got accepted to Google internship! 🎉",
      "Presented research at Stanford today 📊",
      "Won the hackathon with our team! 🏆", 
      "Got into my dream graduate program ✨",
      "Just published my first paper 📝",
      "Landed my first job offer! 💼",
      "Made Dean's List this semester 🌟",
      "Startup got funding! 🚀",
      "Finished marathon in under 4 hours! 🏃",
      "Art piece accepted to gallery 🎨"
    ]
    
    const networkNames = bondedContacts.map(c => c.handle || `User${c.peerId?.slice(-3)}`) 
    const allNames = [...networkNames, 'Maya', 'Sam', 'Chris', 'Taylor', 'Devon']
    
    return Array.from({ length: 8 }, (_, i) => ({
      id: `signal-${i}`,
      senderName: allNames[Math.floor(Math.random() * allNames.length)],
      recipientName: allNames[Math.floor(Math.random() * allNames.length)],
      signalText: recognitionTemplates[i % recognitionTemplates.length],
      timestamp: Date.now() - (Math.random() * 6 * 60 * 60 * 1000), // Last 6 hours
      boostCount: Math.floor(Math.random() * 12),
      isBoosted: Math.random() > 0.7,
      isFromMyNetwork: Math.random() > 0.3 // 70% from my network
    }))
  }
  
  const [recognitionSignals] = useState<RecognitionSignal[]>(generateRecognitionSignals())

  const handleBoostSignal = (signal: RecognitionSignal) => {
    // Toggle boost state
    signal.isBoosted = !signal.isBoosted
    signal.boostCount += signal.isBoosted ? 1 : -1
    
    toast.success(signal.isBoosted ? 'Boosted! ⚡' : 'Boost removed', {
      description: signal.isBoosted ? `Amplified ${signal.recipientName}'s achievement!` : undefined
    })
  }

  // Quick send contacts (inner circle + recent contacts)
  const quickSendContacts = myInnerCircle.slice(0, 4)

  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-md mx-auto px-4 py-4 space-y-6">
        {/* Header */}
        <div className="text-center">
          <GenZHeading level={1} className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-6 h-6 text-pri-500 animate-breathe-glow" />
            Send Signals
          </GenZHeading>
          <GenZText dim>Recognize achievements • Boost your network</GenZText>
        </div>

        {/* Send Signal Section */}
        <GenZCard variant="glass" className="p-6">
          <div className="text-center mb-4">
            <GenZHeading level={3} className="mb-2 flex items-center justify-center gap-2">
              <Send className="w-5 h-5 text-pri-500" />
              Send Recognition
            </GenZHeading>
            <GenZText size="sm" dim>Send signals to your network</GenZText>
          </div>
          
          <div className="space-y-4">
            {/* Main Send Button */}
            <GenZButton
              onClick={() => setSendModalOpen(true)}
              variant="boost"
              size="lg"
              className="w-full py-4 text-lg font-bold transform hover:scale-105 transition-all duration-300"
              glow
            >
              <Heart className="w-5 h-5 mr-2" />
              Send Signal
            </GenZButton>
            
            {/* Quick Send to Inner Circle */}
            {quickSendContacts.length > 0 && (
              <div>
                <GenZText size="sm" dim className="mb-2">Quick send to inner circle:</GenZText>
                <div className="grid grid-cols-2 gap-2">
                  {quickSendContacts.map((contact) => {
                    const displayName = contact.handle || `User${contact.peerId?.slice(-3)}`
                    return (
                      <GenZButton
                        key={contact.peerId}
                        variant="ghost"
                        size="sm"
                        className="border border-pri-500/30 text-left justify-start"
                        onClick={() => setSendModalOpen(true)}
                      >
                        <User className="w-3 h-3 mr-2" />
                        {displayName}
                      </GenZButton>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </GenZCard>

        {/* Boost Recognition Section */}
        <GenZCard variant="glass" className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-pri-500 animate-breathe-glow" />
              <GenZHeading level={4}>Boost Recognition</GenZHeading>
            </div>
            <GenZText size="sm" dim>{recognitionSignals.length} signals</GenZText>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4 animate-float">⚡</div>
                <GenZText dim>Loading signals...</GenZText>
              </div>
            ) : recognitionSignals.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4 animate-float">🎯</div>
                <GenZText className="mb-2">No signals to boost yet</GenZText>
                <GenZText size="sm" dim>Check back as your network shares achievements</GenZText>
              </div>
            ) : (
              recognitionSignals.map((signal) => (
                <GenZCard key={signal.id} variant="glass" className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pri-500/20 to-sec-500/20 border border-pri-500/30 flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 text-pri-500" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <GenZText className="font-medium text-sm">{signal.senderName}</GenZText>
                        {signal.isFromMyNetwork && (
                          <div className="w-2 h-2 rounded-full bg-pri-500 animate-breathe-glow" title="From your network" />
                        )}
                      </div>
                      
                      <GenZText size="sm" className="mb-2 leading-relaxed">
                        {signal.signalText}
                      </GenZText>
                      
                      <div className="flex items-center justify-between">
                        <GenZText size="sm" dim>
                          {new Date(signal.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </GenZText>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Zap className={`w-3 h-3 ${signal.boostCount > 3 ? 'text-pri-500' : 'text-genz-text-dim'}`} />
                            <span className={`text-xs font-mono ${signal.boostCount > 3 ? 'text-pri-500 font-bold' : 'text-genz-text-dim'}`}>
                              {signal.boostCount}
                            </span>
                          </div>
                          
                          <GenZButton
                            size="sm"
                            variant={signal.isBoosted ? 'boost' : 'ghost'}
                            onClick={() => handleBoostSignal(signal)}
                            className={`${signal.isBoosted ? 'shadow-glow' : ''} px-3`}
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            {signal.isBoosted ? 'Boosted' : 'Boost'}
                          </GenZButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </GenZCard>
              ))
            )}
          </div>
        </GenZCard>
      </div>

      {/* Send Signal Modal */}
      <SendSignalModal 
        isOpen={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
      />
    </div>
  )
}