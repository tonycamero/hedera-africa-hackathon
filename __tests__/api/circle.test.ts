/**
 * @jest-environment node
 * 
 * Tests for /api/circle route
 * 
 * Verifies:
 * - Auth-scoped queries (CIR-2)
 * - 250 contact hard cap (CIR-3)
 * - Privacy preservation
 * - Observability logging
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/circle/route'
import { circleState } from '@/lib/stores/HcsCircleState'
import * as authModule from '@/lib/server/auth/requireMagicAuth'
import * as hcs22Module from '@/lib/server/hcs22/resolveOrProvision'

// Mock dependencies
jest.mock('@/lib/server/auth/requireMagicAuth')
jest.mock('@/lib/server/hcs22/resolveOrProvision')
jest.mock('@/lib/stores/HcsCircleState', () => ({
  circleState: {
    isReady: jest.fn(),
    getCircleFor: jest.fn(),
    getStats: jest.fn()
  }
}))

const mockRequireMagicAuth = authModule.requireMagicAuth as jest.MockedFunction<typeof authModule.requireMagicAuth>
const mockResolveOrProvision = hcs22Module.resolveOrProvision as jest.MockedFunction<typeof hcs22Module.resolveOrProvision>
const mockCircleState = circleState as jest.Mocked<typeof circleState>

describe('/api/circle', () => {
  const MOCK_ISSUER = 'did:ethr:0x1234567890123456789012345678901234567890'
  const MOCK_ACCOUNT_ID = '0.0.12345'

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default auth success
    mockRequireMagicAuth.mockResolvedValue({
      success: true,
      issuer: MOCK_ISSUER
    } as any)
    
    // Default HCS-22 resolution
    mockResolveOrProvision.mockResolvedValue({
      hederaAccountId: MOCK_ACCOUNT_ID
    } as any)
    
    // Default ready state
    mockCircleState.isReady.mockReturnValue(true)
  })

  afterEach(() => {
    // Reset mocks between tests
    jest.clearAllMocks()
    jest.resetAllMocks()
  })

  afterAll(() => {
    // Clear any outstanding timers / intervals
    jest.clearAllTimers()
    // Restore any spies to their original implementations
    jest.restoreAllMocks()
  })

  describe('Authentication (CIR-2)', () => {
    it('returns 401 when Magic auth fails', async () => {
      mockRequireMagicAuth.mockResolvedValue({
        success: false
      } as any)

      const req = new NextRequest('http://localhost:3000/api/circle')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Unauthorized')
    })

    it('returns 400 when Hedera account not bound', async () => {
      mockResolveOrProvision.mockResolvedValue({
        hederaAccountId: undefined
      } as any)

      const req = new NextRequest('http://localhost:3000/api/circle')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('No Hedera account')
    })
  })

  describe('Circle State Readiness (CIR-2)', () => {
    it('returns 202 when circle state is warming up', async () => {
      mockCircleState.isReady.mockReturnValue(false)

      const req = new NextRequest('http://localhost:3000/api/circle')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(202)
      expect(data.status).toBe('warming')
      expect(data.message).toContain('initializing')
    })
  })

  describe('Auth-Scoped Queries (CIR-2)', () => {
    it('queries only authenticated user\'s contacts', async () => {
      const mockCircle = {
        accountId: MOCK_ACCOUNT_ID,
        contacts: [
          {
            accountId: '0.0.11111',
            handle: '@alice',
            bondedAt: '2024-01-01T00:00:00Z',
            profileHrl: 'hcs://1/0.0.11111'
          },
          {
            accountId: '0.0.22222',
            handle: '@bob',
            bondedAt: '2024-01-02T00:00:00Z',
            profileHrl: 'hcs://1/0.0.22222'
          }
        ],
        edges: [],
        innerCircle: [],
        lastUpdated: '2024-01-15T00:00:00Z'
      }

      mockCircleState.getCircleFor.mockReturnValue(mockCircle)

      const req = new NextRequest('http://localhost:3000/api/circle')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.accountId).toBe(MOCK_ACCOUNT_ID)
      expect(data.bondedContacts).toHaveLength(2)
      
      // Verify scoped query was called with authenticated user's account
      expect(mockCircleState.getCircleFor).toHaveBeenCalledWith(MOCK_ACCOUNT_ID)
      expect(mockCircleState.getCircleFor).toHaveBeenCalledTimes(1)
    })

    it('returns minimal contact data (privacy-preserving)', async () => {
      const mockCircle = {
        accountId: MOCK_ACCOUNT_ID,
        contacts: [
          {
            accountId: '0.0.11111',
            handle: '@alice',
            bondedAt: '2024-01-01T00:00:00Z',
            profileHrl: 'hcs://1/0.0.11111',
            // Simulating extra fields that should NOT be exposed
            internalMetadata: 'sensitive',
            globalStats: { connections: 500 }
          }
        ],
        edges: [],
        innerCircle: [],
        lastUpdated: '2024-01-15T00:00:00Z'
      }

      mockCircleState.getCircleFor.mockReturnValue(mockCircle as any)

      const req = new NextRequest('http://localhost:3000/api/circle')
      const response = await GET(req)
      const data = await response.json()

      const contact = data.bondedContacts[0]
      expect(contact).toEqual({
        peerId: '0.0.11111',
        handle: '@alice',
        bondedAt: '2024-01-01T00:00:00Z',
        profileHrl: 'hcs://1/0.0.11111',
        isBonded: true
      })
      
      // Verify sensitive fields are excluded
      expect(contact.internalMetadata).toBeUndefined()
      expect(contact.globalStats).toBeUndefined()
    })

    it('calculates trust stats from edges', async () => {
      const mockCircle = {
        accountId: MOCK_ACCOUNT_ID,
        contacts: [
          { accountId: '0.0.11111', handle: '@alice', bondedAt: '2024-01-01T00:00:00Z', profileHrl: 'hcs://1/0.0.11111' }
        ],
        edges: [
          { from: MOCK_ACCOUNT_ID, to: '0.0.11111', strength: 30 },
          { from: MOCK_ACCOUNT_ID, to: '0.0.22222', strength: 25 },
          { from: MOCK_ACCOUNT_ID, to: '0.0.33333', strength: 20 }
        ],
        innerCircle: [],
        lastUpdated: '2024-01-15T00:00:00Z'
      }

      mockCircleState.getCircleFor.mockReturnValue(mockCircle)

      const req = new NextRequest('http://localhost:3000/api/circle')
      const response = await GET(req)
      const data = await response.json()

      expect(data.trustStats).toEqual({
        allocatedOut: 75, // 30 + 25 + 20
        maxSlots: 9,
        bondedContacts: 1
      })
    })
  })

  describe('Hard Cap Enforcement (CIR-3)', () => {
    it('returns at most 250 contacts', async () => {
      // Generate 300 contacts
      const contacts = Array.from({ length: 300 }, (_, i) => ({
        accountId: `0.0.${10000 + i}`,
        handle: `@user${i}`,
        bondedAt: `2024-01-01T00:00:00Z`,
        profileHrl: `hcs://1/0.0.${10000 + i}`
      }))

      const mockCircle = {
        accountId: MOCK_ACCOUNT_ID,
        contacts,
        edges: [],
        innerCircle: [],
        lastUpdated: '2024-01-15T00:00:00Z'
      }

      mockCircleState.getCircleFor.mockReturnValue(mockCircle)

      // Spy on console.warn to verify safeguard logging
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      const req = new NextRequest('http://localhost:3000/api/circle')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.bondedContacts).toHaveLength(250)
      
      // Verify warning was logged
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SAFEGUARD /circle] Contact count (300) exceeded limit, capped at 250')
      )

      warnSpy.mockRestore()
    })

    it('does not cap when contacts <= 250', async () => {
      const contacts = Array.from({ length: 100 }, (_, i) => ({
        accountId: `0.0.${10000 + i}`,
        handle: `@user${i}`,
        bondedAt: `2024-01-01T00:00:00Z`,
        profileHrl: `hcs://1/0.0.${10000 + i}`
      }))

      const mockCircle = {
        accountId: MOCK_ACCOUNT_ID,
        contacts,
        edges: [],
        innerCircle: [],
        lastUpdated: '2024-01-15T00:00:00Z'
      }

      mockCircleState.getCircleFor.mockReturnValue(mockCircle)

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      const req = new NextRequest('http://localhost:3000/api/circle')
      const response = await GET(req)
      const data = await response.json()

      expect(data.bondedContacts).toHaveLength(100)
      expect(warnSpy).not.toHaveBeenCalled()

      warnSpy.mockRestore()
    })
  })

  describe('Observability Logging (CIR-3)', () => {
    it('logs query metrics including latencies and node count', async () => {
      const mockCircle = {
        accountId: MOCK_ACCOUNT_ID,
        contacts: [
          { accountId: '0.0.11111', handle: '@alice', bondedAt: '2024-01-01T00:00:00Z', profileHrl: 'hcs://1/0.0.11111' }
        ],
        edges: [],
        innerCircle: [],
        lastUpdated: '2024-01-15T00:00:00Z'
      }

      mockCircleState.getCircleFor.mockReturnValue(mockCircle)

      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      const req = new NextRequest('http://localhost:3000/api/circle')
      await GET(req)

      // Verify observability logging
      expect(logSpy).toHaveBeenCalledWith(
        '[OBSERVABILITY /circle] Query metrics:',
        expect.objectContaining({
          account: MOCK_ACCOUNT_ID,
          authLatencyMs: expect.any(String),
          queryLatencyMs: expect.any(String),
          nodeCount: 1,
          cappedAt: null,
          totalLatencyMs: expect.any(String)
        })
      )

      logSpy.mockRestore()
    })

    it('includes cappedAt in logs when cap is enforced', async () => {
      const contacts = Array.from({ length: 300 }, (_, i) => ({
        accountId: `0.0.${10000 + i}`,
        handle: `@user${i}`,
        bondedAt: `2024-01-01T00:00:00Z`,
        profileHrl: `hcs://1/0.0.${10000 + i}`
      }))

      const mockCircle = {
        accountId: MOCK_ACCOUNT_ID,
        contacts,
        edges: [],
        innerCircle: [],
        lastUpdated: '2024-01-15T00:00:00Z'
      }

      mockCircleState.getCircleFor.mockReturnValue(mockCircle)

      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      const req = new NextRequest('http://localhost:3000/api/circle')
      await GET(req)

      expect(logSpy).toHaveBeenCalledWith(
        '[OBSERVABILITY /circle] Query metrics:',
        expect.objectContaining({
          nodeCount: 300,
          cappedAt: 250
        })
      )

      logSpy.mockRestore()
    })
  })

  describe('Error Handling', () => {
    it('returns 500 when circle query throws', async () => {
      mockCircleState.getCircleFor.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const req = new NextRequest('http://localhost:3000/api/circle')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Database connection failed')
    })
  })
})
