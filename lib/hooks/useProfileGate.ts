'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { profileService } from '@/lib/profile/profileService'

/**
 * Profile Gate Hook
 * Enforces HCS-11 profile creation before accessing the app
 */
export function useProfileGate() {
  const router = useRouter()
  const pathname = usePathname()
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Pages that don't require profile
  const PUBLIC_ROUTES = ['/', '/login', '/onboard', '/signals']
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

  useEffect(() => {
    async function checkProfile() {
      // Skip check for public routes
      if (isPublicRoute) {
        setIsLoading(false)
        return
      }

      try {
        // Check if user is logged in with Magic
        const usersData = localStorage.getItem('tm:users')
        if (!usersData) {
          // Not logged in, redirect to landing
          router.push('/')
          return
        }

        const [user] = JSON.parse(usersData)
        if (!user?.hederaAccountId) {
          // No Hedera account, redirect to landing
          router.push('/')
          return
        }

        // Check if HCS-11 profile exists
        const profile = await profileService.getProfileSnapshot()
        
        // Valid profile must have:
        // 1. HCS HRL (not local://)
        // 2. Custom handle (not default "user_dev")
        // 3. Recent timestamp (within 24h or stored)
        const hasValidProfile = 
          profile &&
          profile.profileHrl &&
          profile.profileHrl.startsWith('hcs://11/') &&
          profile.data.handle !== 'user_dev'

        setHasProfile(hasValidProfile)

        // Redirect to onboarding if no valid profile
        if (!hasValidProfile) {
          console.log('[ProfileGate] No valid HCS-11 profile found, redirecting to onboarding')
          router.push('/onboard')
        }
      } catch (error) {
        console.error('[ProfileGate] Error checking profile:', error)
        // On error, assume no profile and redirect to onboarding
        setHasProfile(false)
        router.push('/onboard')
      } finally {
        setIsLoading(false)
      }
    }

    checkProfile()
  }, [pathname, router, isPublicRoute])

  return {
    hasProfile,
    isLoading,
    isProtected: !isPublicRoute
  }
}
