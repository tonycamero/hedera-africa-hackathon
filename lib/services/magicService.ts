// lib/services/magicService.ts
import { getSessionId } from '@/lib/session'

// Magic.link SDK would be imported in production
// import { Magic } from 'magic-sdk'

export interface MagicUser {
  issuer: string
  email?: string
  phoneNumber?: string
  publicAddress: string
  metadata?: {
    email?: string
    phoneNumber?: string
    isMfaEnabled?: boolean
  }
}

export interface AuthResult {
  success: boolean
  user?: MagicUser
  token?: string
  error?: string
}

class MagicService {
  private magic: any = null
  private initialized = false

  /**
   * Initialize Magic.link SDK
   */
  async initialize() {
    if (this.initialized) return

    try {
      // In production, this would initialize the actual Magic SDK
      // this.magic = new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!, {
      //   network: 'hedera-testnet', // or 'hedera-mainnet'
      //   locale: 'en_US'
      // })

      console.log('[Magic] Service initialized (mock)')
      this.initialized = true
    } catch (error) {
      console.error('[Magic] Failed to initialize:', error)
      throw new Error('Failed to initialize Magic authentication')
    }
  }

  /**
   * Authenticate with email
   */
  async loginWithEmail(email: string): Promise<AuthResult> {
    try {
      await this.initialize()

      console.log('[Magic] Authenticating with email:', email)

      // Mock Magic.link email authentication
      await new Promise(resolve => setTimeout(resolve, 2000))

      // In production:
      // const didToken = await this.magic.auth.loginWithEmailOTP({ email })
      // const userMetadata = await this.magic.user.getMetadata()

      const mockUser: MagicUser = {
        issuer: `did:ethr:0x${Math.random().toString(16).slice(2, 42)}`,
        email,
        publicAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
        metadata: {
          email,
          isMfaEnabled: false
        }
      }

      const mockToken = this.generateMockJWT(mockUser)

      // Store token in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('TOKEN', mockToken)
        localStorage.setItem('MAGIC_USER', JSON.stringify(mockUser))
      }

      console.log('[Magic] Email authentication successful')
      return {
        success: true,
        user: mockUser,
        token: mockToken
      }
    } catch (error) {
      console.error('[Magic] Email authentication failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email authentication failed'
      }
    }
  }

  /**
   * Authenticate with SMS
   */
  async loginWithSMS(phoneNumber: string): Promise<AuthResult> {
    try {
      await this.initialize()

      console.log('[Magic] Authenticating with SMS:', phoneNumber)

      // Mock Magic.link SMS authentication
      await new Promise(resolve => setTimeout(resolve, 2000))

      // In production:
      // const didToken = await this.magic.auth.loginWithSMS({ phoneNumber })
      // const userMetadata = await this.magic.user.getMetadata()

      const mockUser: MagicUser = {
        issuer: `did:ethr:0x${Math.random().toString(16).slice(2, 42)}`,
        phoneNumber,
        publicAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
        metadata: {
          phoneNumber,
          isMfaEnabled: false
        }
      }

      const mockToken = this.generateMockJWT(mockUser)

      // Store token in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('TOKEN', mockToken)
        localStorage.setItem('MAGIC_USER', JSON.stringify(mockUser))
      }

      console.log('[Magic] SMS authentication successful')
      return {
        success: true,
        user: mockUser,
        token: mockToken
      }
    } catch (error) {
      console.error('[Magic] SMS authentication failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS authentication failed'
      }
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<MagicUser | null> {
    try {
      if (typeof window === 'undefined') return null

      // Check if user is logged in
      const storedUser = localStorage.getItem('MAGIC_USER')
      const storedToken = localStorage.getItem('TOKEN')

      if (!storedUser || !storedToken) return null

      // In production, validate token with Magic:
      // const isLoggedIn = await this.magic.user.isLoggedIn()
      // if (!isLoggedIn) return null
      // return await this.magic.user.getMetadata()

      return JSON.parse(storedUser) as MagicUser
    } catch (error) {
      console.error('[Magic] Failed to get current user:', error)
      return null
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser()
      return !!user
    } catch (error) {
      return false
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // In production:
      // await this.magic.user.logout()

      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('TOKEN')
        localStorage.removeItem('MAGIC_USER')
      }

      console.log('[Magic] User logged out')
    } catch (error) {
      console.error('[Magic] Logout failed:', error)
      throw new Error('Failed to logout')
    }
  }

  /**
   * Get authentication token
   */
  async getToken(): Promise<string | null> {
    try {
      if (typeof window === 'undefined') return null

      const token = localStorage.getItem('TOKEN')
      if (!token) return null

      // In production, refresh token if needed:
      // const didToken = await this.magic.user.getIdToken()
      // return didToken

      return token
    } catch (error) {
      console.error('[Magic] Failed to get token:', error)
      return null
    }
  }

  /**
   * Generate mock JWT for testing
   */
  private generateMockJWT(user: MagicUser): string {
    // This is a mock JWT for testing - in production Magic handles this
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = btoa(JSON.stringify({
      iss: 'magic.link',
      sub: user.issuer,
      aud: process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      iat: Math.floor(Date.now() / 1000),
      email: user.email,
      phoneNumber: user.phoneNumber,
      publicAddress: user.publicAddress
    }))
    const signature = btoa('mock-signature')
    
    return `${header}.${payload}.${signature}`
  }

  /**
   * Create Hedera account associated with Magic wallet
   */
  async createHederaAccount(knsName?: string): Promise<{
    accountId: string
    publicKey: string
    knsName?: string
  }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      // Mock Hedera account creation
      await new Promise(resolve => setTimeout(resolve, 1500))

      // In production, this would:
      // 1. Use Magic's Hedera integration to create account
      // 2. Associate with KNS name if provided
      // 3. Set up initial HBAR balance
      // 4. Configure account for HCS messaging

      const mockAccountId = `0.0.${Math.floor(Math.random() * 1000000) + 100000}`
      
      console.log('[Magic] Created Hedera account:', mockAccountId)
      
      return {
        accountId: mockAccountId,
        publicKey: user.publicAddress,
        knsName
      }
    } catch (error) {
      console.error('[Magic] Failed to create Hedera account:', error)
      throw new Error('Failed to create Hedera account')
    }
  }
}

// Export singleton instance
export const magicService = new MagicService()

// Helper functions for components
export const useMagicAuth = () => {
  return {
    loginWithEmail: magicService.loginWithEmail.bind(magicService),
    loginWithSMS: magicService.loginWithSMS.bind(magicService),
    getCurrentUser: magicService.getCurrentUser.bind(magicService),
    isAuthenticated: magicService.isAuthenticated.bind(magicService),
    logout: magicService.logout.bind(magicService),
    getToken: magicService.getToken.bind(magicService)
  }
}