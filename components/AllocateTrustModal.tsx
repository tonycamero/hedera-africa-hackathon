'use client'

import { useState } from 'react'
import { GenZButton, GenZCard, GenZHeading, GenZText, GenZModal } from '@/components/ui/genz-design-system'
import { Users, Heart, Star, Crown, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AllocateTrustModalProps {
  isOpen: boolean
  onClose: () => void
  contact: {
    id: string
    name: string
    handle: string
  }
  currentCapacity: {
    allocated: number
    maxSlots: number
    available: number
  }
  onAllocate: (contactId: string, level: number) => Promise<void>
}

const TRUST_LEVELS = [
  {
    level: 1,
    name: 'Trusted Contact',
    description: 'Basic trust allocation',
    icon: Users,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/20',
    borderColor: 'border-blue-400/30'
  },
  {
    level: 2,
    name: 'Close Friend',
    description: 'Strong trust bond',
    icon: Heart,
    color: 'text-pink-400',
    bgColor: 'bg-pink-400/20',
    borderColor: 'border-pink-400/30'
  },
  {
    level: 3,
    name: 'Inner Circle',
    description: 'Maximum trust level',
    icon: Crown,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/20',
    borderColor: 'border-yellow-400/30'
  }
]

export function AllocateTrustModal({
  isOpen,
  onClose,
  contact,
  currentCapacity,
  onAllocate
}: AllocateTrustModalProps) {
  const [selectedLevel, setSelectedLevel] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showStakeIntent, setShowStakeIntent] = useState(false)
  
  // Feature flag for TRST staking (future)
  const FEATURE_STAKING = process.env.NEXT_PUBLIC_FEATURE_TRUST_STAKING === 'true'

  const handleAllocate = async () => {
    if (currentCapacity.available <= 0) {
      toast.error('Circle is full!', {
        description: 'Revoke an existing allocation first'
      })
      return
    }

    try {
      setIsSubmitting(true)
      await onAllocate(contact.id, selectedLevel)
      
      toast.success('Trust allocated!', {
        description: `${contact.name} added to your Circle at level ${selectedLevel}`
      })
      
      onClose()
    } catch (error) {
      console.error('Trust allocation failed:', error)
      toast.error('Allocation failed', {
        description: error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedLevelData = TRUST_LEVELS.find(l => l.level === selectedLevel)!
  const Icon = selectedLevelData.icon

  return (
    <GenZModal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-pri-400 to-boost-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <GenZHeading level={2} className="mb-2">
            Allocate Trust
          </GenZHeading>
          <GenZText dim>
            Add {contact.name} to your Circle
          </GenZText>
        </div>

        {/* Capacity Warning */}
        {currentCapacity.available <= 0 ? (
          <div className="bg-red-400/10 border border-red-400/30 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <GenZText className="text-red-400 font-semibold mb-1">
                Circle Full ({currentCapacity.allocated}/{currentCapacity.maxSlots})
              </GenZText>
              <GenZText size="sm" dim>
                Revoke an existing allocation to add {contact.name}
              </GenZText>
            </div>
          </div>
        ) : (
          <div className="bg-boost-400/10 border border-boost-400/30 rounded-xl p-4">
            <GenZText className="text-boost-400 font-semibold mb-1">
              Available Slots: {currentCapacity.available}/{currentCapacity.maxSlots}
            </GenZText>
            <GenZText size="sm" dim>
              After allocation: {currentCapacity.available - 1} slots remaining
            </GenZText>
          </div>
        )}

        {/* Trust Level Selector */}
        <div>
          <GenZText className="font-semibold mb-3">Select Trust Level</GenZText>
          <div className="space-y-3">
            {TRUST_LEVELS.map((level) => {
              const LevelIcon = level.icon
              const isSelected = selectedLevel === level.level
              
              return (
                <button
                  key={level.level}
                  onClick={() => setSelectedLevel(level.level)}
                  disabled={currentCapacity.available <= 0}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? `${level.bgColor} ${level.borderColor} scale-105`
                      : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30'
                  } ${currentCapacity.available <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isSelected ? level.bgColor : 'bg-white/10'
                    }`}>
                      <LevelIcon className={`w-5 h-5 ${
                        isSelected ? level.color : 'text-white/60'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <GenZText className={`font-semibold ${isSelected ? 'text-white' : 'text-white/80'}`}>
                        Level {level.level} - {level.name}
                      </GenZText>
                      <GenZText size="sm" dim className={isSelected ? 'text-white/70' : ''}>
                        {level.description}
                      </GenZText>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-boost-400 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* TRST Staking Toggle (Feature Flagged) */}
        {FEATURE_STAKING && (
          <div className="bg-white/5 rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <GenZText className="font-semibold">Back with TRST</GenZText>
              <button
                onClick={() => setShowStakeIntent(!showStakeIntent)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  showStakeIntent ? 'bg-boost-400' : 'bg-white/20'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  showStakeIntent ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
            <GenZText size="sm" dim>
              Optional: Stake TRST tokens to strengthen this trust bond
            </GenZText>
          </div>
        )}

        {/* Preview */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/20">
          <GenZText className="font-semibold mb-3">Preview</GenZText>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-400 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <GenZText className="font-semibold">{contact.name}</GenZText>
              <GenZText size="sm" dim>{contact.handle}</GenZText>
            </div>
            <div className="text-center">
              <Icon className={`w-6 h-6 mx-auto mb-1 ${selectedLevelData.color}`} />
              <GenZText size="sm" className={selectedLevelData.color}>
                Level {selectedLevel}
              </GenZText>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <GenZButton
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </GenZButton>
          <GenZButton
            variant="boost"
            onClick={handleAllocate}
            disabled={currentCapacity.available <= 0 || isSubmitting}
            className="flex-1"
            glow
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Allocating...
              </>
            ) : (
              `Allocate Trust`
            )}
          </GenZButton>
        </div>
      </div>
    </GenZModal>
  )
}