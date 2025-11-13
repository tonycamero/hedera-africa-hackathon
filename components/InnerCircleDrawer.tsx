'use client'

import { useEffect, useState } from 'react'
import { X, User, MessageCircle, Plus, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type BondedContact, signalsStore } from '@/lib/stores/signalsStore'
import { getSessionId } from '@/lib/session'
import { toast } from 'sonner'

interface InnerCircleDrawerProps {
  isOpen: boolean
  onClose: () => void
  circleMembers: BondedContact[]
  trustLevels: Map<string, { allocatedTo: number; receivedFrom: number }>
  allocatedOut: number
  maxSlots: number
  allContacts: BondedContact[] // All bonded contacts to select from
}

// Circle LED Visualization
function TrustCircleVisualization({ allocatedOut, maxSlots }: { allocatedOut: number; maxSlots: number }) {
  const totalSlots = maxSlots
  const dots = Array.from({ length: totalSlots }, (_, i) => {
    const angle = (i * 360) / totalSlots - 90
    const radian = (angle * Math.PI) / 180
    const radius = 35
    const x = Math.cos(radian) * radius + 48
    const y = Math.sin(radian) * radius + 48

    let ledStyle = ''
    let innerStyle = ''
    
    if (i < allocatedOut) {
      ledStyle = 'bg-gradient-to-br from-emerald-400 to-green-600 shadow-[0_0_12px_rgba(34,197,94,0.6)] border-2 border-emerald-300'
      innerStyle = 'bg-gradient-to-br from-emerald-300 to-green-500'
    } else {
      ledStyle = 'bg-gradient-to-br from-gray-300 to-gray-500 shadow-md border-2 border-gray-200 opacity-50'
      innerStyle = 'bg-gradient-to-br from-gray-200 to-gray-400'
    }

    return (
      <div
        key={i}
        className={`absolute w-5 h-5 rounded-full transform -translate-x-2.5 -translate-y-2.5 ${ledStyle}`}
        style={{ left: x, top: y }}
      >
        <div className={`absolute inset-1 rounded-full ${innerStyle}`} />
        <div className="absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-white opacity-70" />
      </div>
    )
  })

  return (
    <div className="relative w-24 h-24 mx-auto">
      {dots}
      <div 
        className="absolute flex items-center justify-center w-8 h-8"
        style={{ left: 48, top: 48, transform: 'translate(-50%, -50%)' }}
      >
        <span className="text-2xl animate-pulse leading-none">🔥</span>
      </div>
    </div>
  )
}

export function InnerCircleDrawer({
  isOpen,
  onClose,
  circleMembers,
  trustLevels,
  allocatedOut,
  maxSlots,
  allContacts,
}: InnerCircleDrawerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isAllocating, setIsAllocating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isVisible) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-full max-w-sm bg-gradient-to-br from-[#1a0a1f] via-[#2a1030] to-[#1a0a1f] z-50 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div>
              <h2 className="text-xl font-bold text-white">Inner Circle</h2>
              <p className="text-sm text-white/60">{allocatedOut} of {maxSlots} slots filled</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* LED Visualization */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <TrustCircleVisualization allocatedOut={allocatedOut} maxSlots={maxSlots} />
              <p className="text-center text-xs text-white/60 mt-4">
                Your most trusted relationships
              </p>
            </div>

            {/* Circle Members */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Circle Members</h3>
              {circleMembers.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <p className="text-sm">No Inner Circle members yet</p>
                  <p className="text-xs mt-2">Allocate trust from Contacts</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {circleMembers.map((member) => {
                    const trustData = trustLevels.get(member.peerId || '') || { allocatedTo: 0, receivedFrom: 0 }
                    const displayName = member.handle || `User ${member.peerId?.slice(-6)}`
                    
                    return (
                      <div
                        key={member.peerId}
                        className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-yellow-500/20 border border-[#FF6B35]/30 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-[#FF6B35]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">{displayName}</div>
                          <div className="text-xs text-white/60">
                            {trustData.allocatedTo > 0 && (
                              <span className="text-orange-500 font-medium">
                                Trust: {trustData.allocatedTo} 🔥
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-white/70 hover:text-[#FF6B35] hover:bg-[#FF6B35]/10 flex-shrink-0"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Add Member Button */}
            {allocatedOut < maxSlots && (
              <div className="bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded-lg p-4">
                <p className="text-sm text-white font-medium mb-3">
                  {maxSlots - allocatedOut} slots available
                </p>
                <Button
                  className="w-full h-10 bg-gradient-to-r from-[#FF6B35] to-yellow-400 text-black hover:from-[#FF6B35]/90 hover:to-yellow-400/90"
                  onClick={() => setShowAddModal(true)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setShowAddModal(false)}
          />
          
          <div className="relative max-w-md w-full max-h-[70vh] flex flex-col bg-gradient-to-br from-slate-900/95 to-slate-800/90 backdrop-blur-xl border-2 border-[#FF6B35]/40 rounded-lg shadow-[0_0_40px_rgba(255,107,53,0.3)]">
            <div className="flex-1 overflow-y-auto p-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 w-6 h-6 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              
              <h2 className="text-xl font-bold text-white mb-4">Add to Circle</h2>
              <p className="text-sm text-white/70 mb-6">
                Select a bonded contact to allocate trust
              </p>
            
              <div className="space-y-2">
                {(() => {
                  const availableContacts = allContacts.filter(contact => {
                    const trustData = trustLevels.get(contact.peerId || '')
                    return !trustData || trustData.allocatedTo === 0
                  })
                  
                  if (availableContacts.length === 0) {
                    return (
                      <div className="text-center py-8 text-white/60">
                        <p className="text-sm">No available contacts</p>
                        <p className="text-xs mt-2">All your contacts are already in the circle</p>
                      </div>
                    )
                  }
                  
                  return availableContacts.map((contact) => {
                    const displayName = contact.handle || `User ${contact.peerId?.slice(-6)}`
                    return (
                      <div 
                        key={contact.peerId}
                        className="flex items-center justify-between p-3 bg-slate-800/40 hover:bg-slate-800/60 rounded-lg cursor-pointer transition-all border border-[#FF6B35]/20 hover:border-[#FF6B35]/40"
                        onClick={async () => {
                          if (isAllocating) return
                          setIsAllocating(true)
                          setShowAddModal(false)
                          
                          try {
                            const sessionId = getSessionId()
                            if (!sessionId) throw new Error('Not authenticated')
                            
                            toast.loading(`Adding ${displayName}...`, { id: 'trust-add' })
                            
                            // Optimistic update
                            const optimisticEvent = {
                              id: `trust_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                              type: 'TRUST_ALLOCATE' as const,
                              actor: sessionId,
                              target: contact.peerId,
                              ts: Date.now(),
                              topicId: '0.0.6896005',
                              metadata: { weight: 1 },
                              source: 'hcs-cached' as const
                            }
                            signalsStore.add(optimisticEvent)
                            
                            // Submit to blockchain
                            const response = await fetch('/api/trust/allocate', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                sessionId,
                                targetId: contact.peerId,
                                weight: 1
                              })
                            })
                            
                            const result = await response.json()
                            if (!result.success) throw new Error(result.error)
                            
                            toast.success(`${displayName} added to circle!`, { id: 'trust-add' })
                          } catch (error) {
                            console.error('Failed to add member:', error)
                            toast.error('Failed to add member', { id: 'trust-add' })
                          } finally {
                            setIsAllocating(false)
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-yellow-500/20 border border-[#FF6B35]/30 flex items-center justify-center">
                            <User className="w-5 h-5 text-[#FF6B35]" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{displayName}</div>
                            <div className="text-xs text-white/60">Bonded Contact</div>
                          </div>
                        </div>
                        <Plus className="w-5 h-5 text-[#FF6B35]" />
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
