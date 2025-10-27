"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Smartphone, User, Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { GenZButton, GenZCard, GenZHeading, GenZText, GenZInput, GenZChip } from '@/components/ui/genz-design-system'
import { toast } from 'sonner'
import { knsService } from '@/lib/services/knsService'
import { getSessionId } from '@/lib/session'
import { magicService, type MagicUser } from '@/lib/services/magicService'
import { magic } from '@/lib/magic'

interface OnboardingStep {
  id: string
  title: string
  description: string
  completed: boolean
}

export default function GenZOnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [desiredName, setDesiredName] = useState('')
  const [bio, setBio] = useState('')
  const [magicUser, setMagicUser] = useState<any>(null)
  const [knsAvailable, setKnsAvailable] = useState<boolean | null>(null)
  const [checkingKns, setCheckingKns] = useState(false)

  // Check if user is logged in with Magic
  useEffect(() => {
    const users = localStorage.getItem('tm:users')
    if (users) {
      const parsed = JSON.parse(users)
      if (parsed.length > 0) {
        setMagicUser(parsed[0])
        setCurrentStep(0) // Start at profile setup
      } else {
        // No Magic user, redirect to landing
        router.push('/')
      }
    } else {
      router.push('/')
    }
  }, [])
  
  const steps: OnboardingStep[] = [
    {
      id: 'profile',
      title: 'Create Your Profile',
      description: 'Set up your TrustMesh identity to start exchanging recognitions',
      completed: false
    }
  ]

  // Mock Magic.link integration - in production this would use actual Magic SDK
  const handleMagicAuth = async (method: 'email' | 'sms') => {
    setIsLoading(true)
    try {
      // Mock Magic.link authentication
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockUser = {
        issuer: 'did:ethr:0x1234...abcd',
        email: method === 'email' ? email : undefined,
        phoneNumber: method === 'sms' ? phone : undefined,
        publicAddress: '0x1234567890abcdef1234567890abcdef12345678'
      }
      
      setMagicUser(mockUser)
      
      // Store Magic token in localStorage (as per external context)
      localStorage.setItem('TOKEN', 'magic-jwt-token-here')
      
      toast.success('🪄 Connected with Magic!', {
        description: 'Your secure wallet is ready'
      })
      
      setCurrentStep(1)
    } catch (error) {
      toast.error('Authentication failed')
      console.error('Magic auth error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Check KNS name availability
  const checkKnsAvailability = async (name: string) => {
    if (!name || name.length < 3) return
    
    setCheckingKns(true)
    try {
      // In production, this would check actual KNS availability
      // For now, simulate the check
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const formatted = knsService.formatName(name)
      
      // Mock availability check - in production use KNS API
      const isAvailable = !['alex', 'john', 'jane', 'test', 'admin'].includes(name.toLowerCase())
      setKnsAvailable(isAvailable)
      
      if (isAvailable) {
        toast.success(`${formatted} is available! 🎉`)
      } else {
        toast.error(`${formatted} is taken. Try another name.`)
      }
    } catch (error) {
      console.error('KNS check error:', error)
      toast.error('Failed to check name availability')
    } finally {
      setCheckingKns(false)
    }
  }

  // Debounced KNS checking
  useEffect(() => {
    if (desiredName.length >= 3) {
      const timer = setTimeout(() => {
        checkKnsAvailability(desiredName)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setKnsAvailable(null)
    }
  }, [desiredName])

  const handleClaimName = async () => {
    if (!knsAvailable || !desiredName) return
    
    setIsLoading(true)
    try {
      // Mock KNS name claiming - in production integrate with KNS registry
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const formattedName = knsService.formatName(desiredName)
      
      toast.success(`🔥 Claimed ${formattedName}!`, {
        description: 'Your name is now registered on Hedera'
      })
      
      setCurrentStep(2)
    } catch (error) {
      toast.error('Failed to claim name')
      console.error('KNS claim error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteOnboarding = async () => {
    if (!magicUser || !desiredName) {
      toast.error('Please enter your display name')
      return
    }

    setIsLoading(true)
    try {
      const magicToken = localStorage.getItem('MAGIC_TOKEN')
      if (!magicToken) {
        throw new Error('Not authenticated with Magic. Please log in again.')
      }

      console.log('[Onboarding] Signing profile client-side with Magic Hedera extension...')
      
      // 1) Get user's Hedera public key from Magic extension (client-side)
      const { publicKeyDer, accountId } = await magic.hedera.getPublicKey()
      
      // 2) Build canonical profile payload
      const fullPayload = {
        type: 'PROFILE_UPDATE',
        accountId: magicUser.hederaAccountId || accountId || '0.0.0',
        displayName: desiredName,
        bio: bio || `TrustMesh user - ${magicUser.email}`,
        avatar: '',
        timestamp: new Date().toISOString(),
      }
      
      // 3) Canonicalize & sign with Magic's client-side signer
      const canonical = JSON.stringify(fullPayload)
      const signatureBytes = await magic.hedera.sign(new TextEncoder().encode(canonical))
      
      const signedPayload = {
        ...fullPayload,
        publicKeyDer: Array.from(new Uint8Array(publicKeyDer)),
        signature: Buffer.from(signatureBytes).toString('hex'),
      }
      
      console.log('[Onboarding] Profile signed via Magic (client-side)')
      console.log('[Onboarding] Signature:', signedPayload.signature.slice(0, 16) + '...')

      // 4) Send to backend for verification & persistence
      const verifyResp = await fetch('/api/hedera/verify-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${magicToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signedPayload),
      })
      
      if (!verifyResp.ok) {
        const err = await verifyResp.text()
        throw new Error(`Profile verification failed: ${err}`)
      }

      // 5) Create HCS-11 profile after verification passes
      const response = await fetch('/api/hcs/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signedPayload)
      })

      if (!response.ok) {
        throw new Error('Failed to create profile')
      }

      const result = await response.json()
      console.log('[Onboarding] Profile created:', result)
      
      toast.success('🎯 Profile created!', {
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

  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-float">🔥</div>
          <GenZHeading level={1} className="mb-2">Welcome to TrustMesh</GenZHeading>
          <GenZText className="text-lg">Build your trust network, earn recognition</GenZText>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                step.completed ? 'bg-genz-success text-ink' :
                currentStep === index ? 'bg-pri-500 text-white' :
                'bg-genz-border text-genz-text-dim'
              }`}>
                {step.completed ? <CheckCircle className="w-4 h-4" /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  step.completed ? 'bg-genz-success' : 'bg-genz-border'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Profile Creation Form */}
        {magicUser && (
          <GenZCard variant="glass" className="p-6 space-y-6">
            <div className="text-center">
              <GenZHeading level={3} className="mb-2">Create Your Profile</GenZHeading>
              <GenZText dim>Set up your TrustMesh identity to start exchanging recognitions</GenZText>
              <GenZText size="sm" dim className="mt-2">Logged in as: {magicUser.email}</GenZText>
            </div>

            <div className="space-y-4">
              {/* Display Name */}
              <div className="space-y-3">
                <GenZText className="font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Display Name
                </GenZText>
                <GenZInput
                  type="text"
                  placeholder="Your name or handle"
                  value={desiredName}
                  onChange={(e) => setDesiredName(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Bio (optional) */}
              <div className="space-y-3">
                <GenZText className="font-medium">
                  Bio (optional)
                </GenZText>
                <GenZInput
                  type="text"
                  placeholder="Tell others about yourself"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full"
                />
              </div>

              <GenZButton
                variant="boost"
                onClick={handleCompleteOnboarding}
                disabled={!desiredName || isLoading}
                className="w-full"
                glow={!!desiredName}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Create Profile
              </GenZButton>
            </div>

            <GenZCard variant="glass" className="p-3 bg-pri-500/5 border-pri-500/20">
              <GenZText size="sm" className="text-center">
                Your profile will be published to Hedera HCS for contact exchange
              </GenZText>
            </GenZCard>
          </GenZCard>
        )}

        {/* Step 2: KNS Name Claiming */}
        {currentStep === 1 && (
          <GenZCard variant="glass" className="p-6 space-y-6">
            <div className="text-center">
              <GenZHeading level={3} className="mb-2">{steps[1].title}</GenZHeading>
              <GenZText dim>{steps[1].description}</GenZText>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <GenZText className="font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Your TrustMesh Name
                </GenZText>
                
                <div className="relative">
                  <GenZInput
                    type="text"
                    placeholder="yourname"
                    value={desiredName}
                    onChange={(e) => setDesiredName(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    className="w-full pr-16"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <GenZText size="sm" dim>.hbar</GenZText>
                  </div>
                </div>

                {/* Name Status */}
                {desiredName.length >= 3 && (
                  <div className="flex items-center gap-2">
                    {checkingKns ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-pri-500" />
                        <GenZText size="sm">Checking availability...</GenZText>
                      </>
                    ) : knsAvailable === true ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-genz-success" />
                        <GenZText size="sm" className="text-genz-success">
                          {knsService.formatName(desiredName)} is available!
                        </GenZText>
                      </>
                    ) : knsAvailable === false ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-genz-danger" />
                        <GenZText size="sm" className="text-genz-danger">
                          {knsService.formatName(desiredName)} is taken
                        </GenZText>
                      </>
                    ) : null}
                  </div>
                )}

                <GenZButton
                  variant="boost"
                  onClick={handleClaimName}
                  disabled={!knsAvailable || isLoading}
                  className="w-full"
                  glow={knsAvailable === true}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Claim {desiredName ? knsService.formatName(desiredName) : 'Your Name'}
                </GenZButton>
              </div>
            </div>

            <GenZCard variant="glass" className="p-3 bg-sec-500/5 border-sec-500/20">
              <GenZText size="sm" className="text-center">
                🌐 Your .hbar name works across the entire Hedera ecosystem
              </GenZText>
            </GenZCard>
          </GenZCard>
        )}

        {/* Step 3: Profile Setup */}
        {currentStep === 2 && (
          <GenZCard variant="glass" className="p-6 space-y-6">
            <div className="text-center">
              <GenZHeading level={3} className="mb-2">{steps[2].title}</GenZHeading>
              <GenZText dim>{steps[2].description}</GenZText>
            </div>

            <div className="space-y-4">
              {/* Profile Summary */}
              <GenZCard variant="glass" className="p-4 bg-boost-500/5 border-boost-500/20">
                <div className="text-center space-y-2">
                  <div className="text-4xl">🔥</div>
                  <GenZHeading level={4}>{knsService.formatName(desiredName)}</GenZHeading>
                  <GenZText size="sm" dim>Connected via {magicUser?.email ? 'Email' : 'SMS'}</GenZText>
                </div>
              </GenZCard>

              <div className="grid grid-cols-2 gap-3">
                <GenZCard variant="glass" className="p-3 text-center">
                  <div className="text-2xl mb-1">💫</div>
                  <GenZText size="sm">Trust Score</GenZText>
                  <GenZText className="font-bold">0</GenZText>
                </GenZCard>
                
                <GenZCard variant="glass" className="p-3 text-center">
                  <div className="text-2xl mb-1">🎯</div>
                  <GenZText size="sm">Circle Slots</GenZText>
                  <GenZText className="font-bold">0/9</GenZText>
                </GenZCard>
              </div>

              <GenZButton
                variant="boost"
                onClick={handleCompleteOnboarding}
                disabled={isLoading}
                className="w-full py-4 text-lg font-bold"
                glow
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                Start Building Trust
              </GenZButton>
            </div>

            <GenZCard variant="glass" className="p-3 bg-pri-500/5 border-pri-500/20">
              <GenZText size="sm" className="text-center">
                🚀 Ready to connect with friends and earn recognition tokens!
              </GenZText>
            </GenZCard>
          </GenZCard>
        )}

        {/* Skip for Testing */}
        {currentStep < 2 && (
          <div className="text-center">
            <GenZButton
              variant="ghost"
              size="sm"
              onClick={() => router.push('/contacts')}
              className="text-genz-text-dim hover:text-genz-text"
            >
              Skip for now
            </GenZButton>
          </div>
        )}
      </div>
    </div>
  )
}