'use client'

import React, { useState, useEffect, useMemo } from 'react'
import QRCodeLib from 'qrcode'
import { UserPlus, QrCode, Search, Users, Copy } from 'lucide-react'
import { GenZModal, GenZButton, GenZInput, GenZHeading, GenZText, genZClassNames } from '@/components/ui/genz-design-system'
import { getSessionProfile } from '@/lib/session'
import { toast } from 'sonner'

interface GenZAddFriendModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GenZAddFriendModal({ isOpen, onClose }: GenZAddFriendModalProps) {
  const [activeTab, setActiveTab] = useState<'scan' | 'search'>('scan')
  const [searchQuery, setSearchQuery] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [sessionProfile, setSessionProfile] = useState<any>(null)
  
  // Load session profile
  useEffect(() => {
    getSessionProfile().then(setSessionProfile)
  }, [])
  
  // Build profile sharing payload
  const profilePayload = useMemo(() => {
    if (!sessionProfile) return ''
    
    const shareData = {
      type: 'TRUSTMESH_PROFILE',
      sessionId: sessionProfile.sessionId,
      handle: sessionProfile.handle,
      profileHrl: sessionProfile.profileHrl,
      timestamp: Date.now()
    }
    
    return btoa(JSON.stringify(shareData))
  }, [sessionProfile])
  
  // Generate QR code
  useEffect(() => {
    if (profilePayload && isOpen) {
      QRCodeLib.toDataURL(profilePayload, { 
        margin: 2, 
        width: 256,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
        .then(setQrDataUrl)
        .catch(console.error)
    }
  }, [profilePayload, isOpen])

  const handleCopyLink = () => {
    if (profilePayload) {
      navigator.clipboard.writeText(profilePayload)
      toast.success('Profile link copied! 🔥', { description: 'Share this to connect instantly' })
    }
  }

  const handleSearch = () => {
    // TODO: Implement friend search
    console.log('Searching for:', searchQuery)
  }

  return (
    <GenZModal isOpen={isOpen} onClose={onClose} title="Add Friend">
      <div className="space-y-6">
        {/* Compact Hero */}
        <div className="text-center mb-4">
          <GenZHeading level={3} className="flex items-center justify-center gap-2 mb-1">
            🔥 Share Your QR
          </GenZHeading>
          <GenZText size="sm" dim>
            Show this to connect instantly!
          </GenZText>
        </div>

        {/* QR Content */}
        <div>
            <div className="text-center space-y-4">
              {/* Compact QR Code */}
              <div className="w-32 h-32 mx-auto bg-white rounded-lg p-2 shadow-lg">
                {qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt="Your TrustMesh QR Code" 
                    className="w-full h-full object-contain" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-pri-500 animate-pulse" />
                  </div>
                )}
              </div>
              
              <GenZText size="sm" className="text-center">
                They scan → instant connection! 🔥
              </GenZText>

              <GenZButton
                variant="boost"
                glow
                onClick={handleCopyLink}
                className="w-full"
                disabled={!profilePayload}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy My Link
              </GenZButton>
            </div>
        </div>

        {/* Compact Actions */}
        <div className="flex gap-2 pt-3 border-t border-genz-border/30">
          <GenZButton
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            className="flex-1"
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy
          </GenZButton>
          
          <GenZButton
            variant="ghost"
            size="sm"
            onClick={() => {
              if (navigator.share && qrDataUrl) {
                navigator.share({
                  title: 'Join my crew on TrustMesh!',
                  text: 'Scan to connect 🔥',
                  url: window.location.origin + '/add/' + profilePayload
                })
              } else {
                handleCopyLink()
              }
            }}
            className="flex-1"
          >
            <Search className="w-3 h-3 mr-1" />
            Share
          </GenZButton>
        </div>
      </div>
    </GenZModal>
  )
}