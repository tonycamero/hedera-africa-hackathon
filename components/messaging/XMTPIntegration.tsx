"use client"

import { useState, useEffect } from 'react'
import { MessageCircle, Send, Check, AlertCircle } from 'lucide-react'
import { GenZButton, GenZCard, GenZText, GenZHeading, GenZModal } from '@/components/ui/genz-design-system'
import { toast } from 'sonner'

interface XMTPIntegrationProps {
  recipient: {
    address: string
    name: string
  }
  isOpen: boolean
  onClose: () => void
}

// Mock XMTP functionality - in production this would use actual XMTP SDK
export function XMTPIntegration({ recipient, isOpen, onClose }: XMTPIntegrationProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<Array<{
    id: string
    text: string
    sender: string
    timestamp: Date
    encrypted: boolean
  }>>([])

  // Mock XMTP connection
  useEffect(() => {
    if (isOpen) {
      // Simulate connection to XMTP network
      setTimeout(() => {
        setIsConnected(true)
        // Load some mock conversation history
        setMessages([
          {
            id: '1',
            text: 'Hey! Just sent you a TrustMesh signal 🔥',
            sender: 'me',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            encrypted: true
          },
          {
            id: '2',
            text: 'Thanks! That recognition meant a lot 🙏',
            sender: recipient.address,
            timestamp: new Date(Date.now() - 2 * 60 * 1000),
            encrypted: true
          }
        ])
      }, 1000)
    }
  }, [isOpen, recipient.address])

  const handleSendMessage = async () => {
    if (!message.trim()) return

    setIsSending(true)
    
    try {
      // Mock XMTP send - in production this would use XMTP SDK
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newMessage = {
        id: Date.now().toString(),
        text: message,
        sender: 'me',
        timestamp: new Date(),
        encrypted: true
      }
      
      setMessages(prev => [...prev, newMessage])
      setMessage('')
      
      toast.success('Message sent securely via XMTP! 🔐')
    } catch (error) {
      toast.error('Failed to send message')
      console.error('XMTP send error:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleAddContact = async () => {
    try {
      // Mock adding contact from address book
      toast.success('Contact added from phone! 📱', {
        description: `${recipient.name} can now receive TrustMesh invites`
      })
    } catch (error) {
      toast.error('Failed to add contact')
    }
  }

  const handleSMSInvite = async () => {
    try {
      const inviteText = `Join me on TrustMesh! Build your trust network: https://trustmesh.app/invite`
      const smsUrl = `sms:?body=${encodeURIComponent(inviteText)}`
      window.location.href = smsUrl
      
      toast.success('SMS invite ready! 📱')
    } catch (error) {
      toast.error('SMS invite failed')
    }
  }

  return (
    <GenZModal isOpen={isOpen} onClose={onClose} title={`Message ${recipient.name}`}>
      <div className="space-y-4">
        {/* Connection Status */}
        <GenZCard variant="glass" className="p-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
            <GenZText size="sm">
              {isConnected ? 'Encrypted messaging active' : 'Connecting to XMTP...'}
            </GenZText>
            {isConnected && <Check className="w-3 h-3 text-green-500" />}
          </div>
        </GenZCard>

        {/* Message History */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
              <GenZCard 
                variant="glass" 
                className={`p-3 max-w-xs ${
                  msg.sender === 'me' 
                    ? 'bg-boost-500/10 border-boost-500/30' 
                    : 'bg-pri-500/10 border-pri-500/30'
                }`}
              >
                <GenZText size="sm">{msg.text}</GenZText>
                <div className="flex items-center gap-2 mt-2">
                  <GenZText size="sm" dim>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </GenZText>
                  {msg.encrypted && (
                    <div className="w-3 h-3 text-green-500" title="End-to-end encrypted">🔐</div>
                  )}
                </div>
              </GenZCard>
            </div>
          ))}
        </div>

        {/* Message Input */}
        {isConnected ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Send encrypted message..."
                className="flex-1 px-3 py-2 bg-panel border border-genz-border rounded-lg text-genz-text placeholder:text-genz-text-dim focus:outline-none focus:ring-2 focus:ring-pri-500/50"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                maxLength={280}
              />
              <GenZButton
                variant="boost"
                onClick={handleSendMessage}
                disabled={!message.trim() || isSending}
                glow={message.trim().length > 0}
              >
                <Send className="w-4 h-4" />
              </GenZButton>
            </div>
            
            <div className="text-right">
              <GenZText size="sm" dim>{message.length}/280</GenZText>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <GenZText>Connecting to secure messaging...</GenZText>
          </div>
        )}

        {/* Contact Actions */}
        <GenZCard variant="glass" className="p-4 bg-sec-500/5 border-sec-500/20">
          <GenZHeading level={4} className="mb-3">Contact Actions</GenZHeading>
          <div className="grid grid-cols-2 gap-2">
            <GenZButton size="sm" variant="outline" onClick={handleAddContact}>
              📱 Add to Phone
            </GenZButton>
            <GenZButton size="sm" variant="outline" onClick={handleSMSInvite}>
              💬 SMS Invite
            </GenZButton>
          </div>
        </GenZCard>

        {/* XMTP Info */}
        <GenZCard variant="glass" className="p-3 bg-pri-500/5 border-pri-500/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-pri-500 flex-shrink-0 mt-0.5" />
            <GenZText size="sm" dim>
              Messages are end-to-end encrypted via XMTP protocol. Your wallet controls the keys.
            </GenZText>
          </div>
        </GenZCard>
      </div>
    </GenZModal>
  )
}

// Quick XMTP Message Button Component
export function XMTPMessageButton({ 
  recipient, 
  className = "" 
}: { 
  recipient: { address: string; name: string }
  className?: string 
}) {
  const [showXMTP, setShowXMTP] = useState(false)

  return (
    <>
      <GenZButton
        size="sm"
        variant="ghost"
        className={`w-8 h-8 p-0 ${className}`}
        onClick={() => setShowXMTP(true)}
        title="Send encrypted message"
      >
        <MessageCircle className="w-3 h-3" />
      </GenZButton>
      
      <XMTPIntegration
        recipient={recipient}
        isOpen={showXMTP}
        onClose={() => setShowXMTP(false)}
      />
    </>
  )
}