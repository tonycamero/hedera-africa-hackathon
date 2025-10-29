'use client'

import React, { useState, useEffect } from 'react'
import { User, Plus, ExternalLink } from 'lucide-react'

interface PublicContactCardProps {
  accountId: string
  handle?: string
}

interface ContactProfile {
  handle: string
  displayName?: string
  avatar?: string
  verified?: boolean
}

export function PublicContactCard({ accountId, handle }: PublicContactCardProps) {
  const [profile, setProfile] = useState<ContactProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Try to fetch from public API using accountId
        const response = await fetch(`/api/u/${accountId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setProfile({
              handle: data.profile.handle,
              displayName: data.profile.displayName,
              avatar: data.profile.avatar,
              verified: data.profile.verified
            })
            return
          }
        }
        
        // Fallback to mock profile data
        const mockProfile: ContactProfile = {
          handle: handle || `user_${accountId.slice(-6)}`,
          displayName: handle ? `${handle.charAt(0).toUpperCase()}${handle.slice(1)}` : `User ${accountId.slice(-6)}`,
          avatar: undefined,
          verified: false
        }
        setProfile(mockProfile)
      } catch (error) {
        console.error('[PublicContactCard] Failed to load profile:', error)
        // Fallback to mock data
        const mockProfile: ContactProfile = {
          handle: handle || `user_${accountId.slice(-6)}`,
          displayName: handle ? `${handle.charAt(0).toUpperCase()}${handle.slice(1)}` : `User ${accountId.slice(-6)}`,
          avatar: undefined,
          verified: false
        }
        setProfile(mockProfile)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [accountId, handle])

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full animate-pulse" />
          <div className="flex-1">
            <div className="h-4 bg-white/20 rounded animate-pulse mb-2" />
            <div className="h-3 bg-white/20 rounded animate-pulse w-2/3" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null // Don't block the Boost page if profile fails to load
  }

  const handleAddContact = () => {
    // In production, this would deep-link to the main app
    const appUrl = `/?add_contact=${accountId}`
    window.open(appUrl, '_blank')
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
          {profile.avatar ? (
            <img 
              src={profile.avatar} 
              alt={profile.displayName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="h-8 w-8 text-white" />
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-medium truncate">
              {profile.displayName || profile.handle}
            </h3>
            {profile.verified && (
              <div className="text-blue-400 text-xs">✓</div>
            )}
          </div>
          
          <div className="text-blue-200 text-sm truncate">
            @{profile.handle}
          </div>
          
          <div className="text-xs text-blue-300 truncate mt-1">
            {accountId}
          </div>
        </div>

        {/* Add Contact Button */}
        <button
          onClick={handleAddContact}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-white text-sm font-medium transition-all hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          Add Contact
        </button>
      </div>

      {/* Footer note */}
      <div className="mt-4 pt-4 border-t border-white/20">
        <div className="text-xs text-blue-300 text-center">
          Connect with {profile.displayName} on TrustMesh to build your trust network
        </div>
      </div>
    </div>
  )
}