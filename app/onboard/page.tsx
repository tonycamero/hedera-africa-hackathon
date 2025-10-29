"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Loader2, Gift, Coins } from 'lucide-react'
import { Button, Card, Input, Text } from '@/components/ui/kit'
import { toast } from 'sonner'
import { magic } from '@/lib/magic'
import { toHex } from '@/lib/util/hex'
import { stableStringify } from '@/lib/util/stableStringify'
import AppShell from '@/components/layout/AppShell'
import { OnboardingCarousel } from '@/components/OnboardingCarousel'
import ChooseFirstLens from '@/components/onboarding/ChooseFirstLens'
import { LENSES, type LensKey } from '@/lib/lens/lensConfig'

export default function OnboardingPage() {
  const router = useRouter()
  const [bootLoading, setBootLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [desiredName, setDesiredName] = useState('')
  const [bio, setBio] = useState('')
  const [magicUser, setMagicUser] = useState<any>(null)
  const [stipendAccepted, setStipendAccepted] = useState(false)
  const [stipendLoading, setStipendLoading] = useState(false)
  const [showCarousel, setShowCarousel] = useState(false)
  const [firstLensSet, setFirstLensSet] = useState(false)
  const [firstLens, setFirstLens] = useState<LensKey | null>(null)

  useEffect(() => {
    async function checkAuth() {
      const users = localStorage.getItem('tm:users')
      if (users) {
        const parsed = JSON.parse(users)
        if (parsed.length > 0) {
          setMagicUser(parsed[0])
          
          const stipendAcceptedKey = `tm:stipend:${parsed[0].hederaAccountId}`
          const alreadyAccepted = localStorage.getItem(stipendAcceptedKey) === 'true'
          setStipendAccepted(alreadyAccepted)
          
          // Show carousel for first-time users
          const hasSeenCarousel = localStorage.getItem('tm:carousel:seen') === 'true'
          setShowCarousel(!hasSeenCarousel && !alreadyAccepted)
          
          // Check if lens already initialized (resume-friendly)
          try {
            const token = await magic?.user.getIdToken()
            if (token) {
              const res = await fetch('/api/profile/get-lens', { 
                headers: { Authorization: `Bearer ${token}` }
              })
              if (res.ok) {
                const lens = await res.json()
                if (Array.isArray(lens?.owned) && lens.owned.length > 0) {
                  setFirstLensSet(true)
                  setFirstLens(lens.active)
                }
              }
            }
          } catch (err) {
            // Ignore lens check errors
          }
        } else {
          router.push('/')
        }
      } else {
        router.push('/')
      }
      setBootLoading(false)
    }
    checkAuth()
  }, [router])

  const handleAcceptStipend = async () => {
    if (!magicUser || stipendLoading || stipendAccepted) return
    
    setStipendLoading(true)
    try {
      const magicToken = await magic?.user.getIdToken()
      if (!magicToken) throw new Error('Not authenticated')
      
      const accountId = magicUser.hederaAccountId
      
      console.log('[Onboarding] Requesting stipend (HBAR + TRST will auto-associate)...')
      
      // Now request the fund transfer (HBAR + TRST)
      const response = await fetch('/api/hedera/account/fund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${magicToken}`
        },
        body: JSON.stringify({
          accountId,
          email: magicUser.email
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to transfer stipend')
      }
      
      const result = await response.json()
      console.log('[Onboarding] Stipend transferred:', result)
      
      // Mark stipend as accepted in localStorage to prevent double-claim
      const stipendAcceptedKey = `tm:stipend:${accountId}`
      localStorage.setItem(stipendAcceptedKey, 'true')
      
      setStipendAccepted(true)
      toast.success('Stipend accepted', {
        description: 'You received 1 HBAR + 1.35 TRST'
      })
    } catch (error: any) {
      console.error('[Onboarding] Stipend error:', error)
      toast.error('Failed to accept stipend', {
        description: error.message
      })
    } finally {
      setStipendLoading(false)
    }
  }

  const handleCompleteOnboarding = async () => {
    // Validate minimum required fields
    if (!magicUser) {
      toast.error('Not authenticated')
      return
    }
    
    if (!desiredName || desiredName.trim().length < 2) {
      toast.error('Display name must be at least 2 characters')
      return
    }
    
    if (!stipendAccepted) {
      toast.error('Please accept your stipend first')
      return
    }

    setIsLoading(true)
    try {
      console.log('[Onboarding] Getting fresh Magic DID token...')
      
      // Get a fresh DID token from Magic (tokens expire quickly)
      const magicToken = await magic?.user.getIdToken()
      if (!magicToken) {
        throw new Error('Not authenticated with Magic. Please log in again.')
      }

      console.log('[Onboarding] Signing profile with Magic Hedera extension...')
      
      if (!magic) {
        throw new Error('Magic SDK not initialized')
      }
      
      // 1) Get user's Hedera account info from stored user (account was created during login)
      const { publicKeyDer } = await magic.hedera.getPublicKey()
      const accountId = magicUser.hederaAccountId
      console.log('[Onboarding] Magic Hedera account:', accountId)
      
      // 2) Build canonical profile payload
      const timestamp = new Date().toISOString()
      const fullPayload = {
        type: 'PROFILE_UPDATE',
        accountId: accountId,
        displayName: desiredName,
        bio: bio || `TrustMesh user - ${magicUser.email}`,
        avatar: '',
        timestamp,
      }
      
      // 3) Sign with Magic's Hedera signer (client-side, keys never exposed)
      const canonical = stableStringify(fullPayload)
      const messageBytes = new TextEncoder().encode(canonical)
      const signatureBytes = await magic.hedera.sign(messageBytes)
      
      // 4) Convert to serializable formats
      const pubKeyArray = Array.from(new Uint8Array(publicKeyDer))
      const signatureHex = toHex(new Uint8Array(signatureBytes))
      
      const signedPayload = {
        ...fullPayload,
        publicKey: pubKeyArray,
        signature: signatureHex,
      }
      
      console.log('[Onboarding] Profile signed:', signatureHex.slice(0, 16) + '...')

      // 5) Submit to HCS with signature
      const response = await fetch('/api/hcs/profile', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${magicToken}`
        },
        body: JSON.stringify(signedPayload)
      })

      if (!response.ok) {
        throw new Error('Failed to create profile')
      }

      const result = await response.json()
      console.log('[Onboarding] Profile created:', result)
      
      toast.success('Profile created', {
        description: 'You can now exchange recognitions with others'
      })
      
      // Redirect to contacts
      router.push('/contacts')
    } catch (error: any) {
      toast.error('Failed to create profile')
      console.error('Profile creation error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCarouselComplete = () => {
    localStorage.setItem('tm:carousel:seen', 'true')
    setShowCarousel(false)
  }

  if (bootLoading) {
    return (
      <AppShell variant="auth">
        <Card className="p-6 space-y-4 bg-panel border-white/10">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <Text>Loading your session…</Text>
          </div>
        </Card>
      </AppShell>
    )
  }

  if (showCarousel) {
    return (
      <AppShell variant="auth">
        <OnboardingCarousel onComplete={handleCarouselComplete} />
      </AppShell>
    )
  }

  return (
    <AppShell 
      variant="auth" 
      title="Welcome to TrustMesh" 
      subtitle="Build your trust network and exchange recognition"
    >
      <div className="space-y-6">
        {/* Stipend Acceptance */}
        {magicUser && !stipendAccepted && (
          <Card className="p-6 space-y-6 bg-panel border-white/10">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-2">Get Your Welcome Stipend</h2>
              <p className="text-white/70">Accept your starter tokens to begin using TrustMesh</p>
            </div>

            <div className="space-y-4">
              <Card className="p-4 bg-panel/50 border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-boost-500" />
                    <Text className="font-semibold">1.00 HBAR</Text>
                  </div>
                  <Text size="sm" dim>for network fees</Text>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-pri-500" />
                    <Text className="font-semibold">1.35 TRST</Text>
                  </div>
                  <Text size="sm" dim>recognition credits</Text>
                </div>
              </Card>

              <Button
                onClick={handleAcceptStipend}
                disabled={stipendLoading || stipendAccepted}
                className="w-full"
              >
                {stipendLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Gift className="w-4 h-4 mr-2" />}
                {stipendAccepted ? 'Stipend Accepted ✓' : 'Accept Stipend'}
              </Button>

              <p className="text-xs text-center text-white/70">
                By accepting, we'll set up your account to receive TRST tokens
              </p>
            </div>
          </Card>
        )}

        {/* First Lens Selection (one-time) */}
        {magicUser && stipendAccepted && !firstLensSet && (
          <ChooseFirstLens
            onSelected={(lens) => { 
              setFirstLens(lens)
              setFirstLensSet(true)
              localStorage.setItem('tm:lens', JSON.stringify({
                active: lens,
                owned: [lens],
                lastSwitch: new Date().toISOString(),
                unlocks: {}
              }))
            }}
            className="mb-6"
          />
        )}

        {/* Profile Creation Form (gated on first lens) */}
        {magicUser && stipendAccepted && firstLensSet && (
          <Card className="p-6 space-y-6 bg-panel border-white/10">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-2">Create Your Profile</h2>
              <p className="text-white/70">Set up your TrustMesh identity to start exchanging recognitions</p>
              <p className="text-xs text-white/70 mt-2">Logged in as: {magicUser.email}</p>
              {firstLens && (
                <p className="text-xs text-white/60 mt-1">
                  Initial lens: {LENSES[firstLens].label} {LENSES[firstLens].emoji}
                </p>
              )}
            </div>

            <div className="space-y-4">
              {/* Display Name */}
              <div className="space-y-3">
                <p className="text-white font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Display Name
                </p>
                <Input
                  type="text"
                  placeholder="Your name or handle"
                  value={desiredName}
                  onChange={(e) => setDesiredName(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Bio (optional) */}
              <div className="space-y-3">
                <p className="text-white font-medium">Bio (optional)</p>
                <Input
                  type="text"
                  placeholder="Tell others about yourself"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full"
                />
              </div>

              <Button
                onClick={handleCompleteOnboarding}
                disabled={!desiredName || desiredName.trim().length < 2 || isLoading}
                className="w-full"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Create Profile
              </Button>
              
              <p className="text-xs text-center text-white/70">
                Min 2 characters required
              </p>
            </div>

            <Card className="p-3 bg-panel/50 border-white/10">
              <p className="text-xs text-center text-white/80">
                Your profile will be published to Hedera HCS for contact exchange
              </p>
            </Card>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
