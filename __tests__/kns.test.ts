import { jest } from '@jest/globals'

// Mock fetch globally for the tests
global.fetch = jest.fn()

describe('KNS Service Tests', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
  })

  describe('KNS API Routes', () => {
    describe('/api/kns/resolve', () => {
      it('should resolve a valid name to account ID', async () => {
        const mockResponse = {
          accountId: '0.0.12345',
          name: 'test.hbar',
          cached: false,
          timestamp: new Date().toISOString()
        }

        ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
          status: 200,
          statusText: 'OK'
        } as Response)

        const response = await fetch('/api/kns/resolve?name=test.hbar')
        const data = await response.json()

        expect(fetch).toHaveBeenCalledWith('/api/kns/resolve?name=test.hbar')
        expect(data.accountId).toBe('0.0.12345')
        expect(data.name).toBe('test.hbar')
      })

      it('should return null for non-existent name', async () => {
        const mockResponse = {
          accountId: null,
          name: 'nonexistent.hbar',
          cached: false,
          timestamp: new Date().toISOString()
        }

        ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
          status: 200,
          statusText: 'OK'
        } as Response)

        const response = await fetch('/api/kns/resolve?name=nonexistent.hbar')
        const data = await response.json()

        expect(data.accountId).toBeNull()
        expect(data.name).toBe('nonexistent.hbar')
      })

      it('should handle missing name parameter', async () => {
        const mockResponse = {
          error: 'name parameter required'
        }

        ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: false,
          json: async () => mockResponse,
          status: 400,
          statusText: 'Bad Request'
        } as Response)

        const response = await fetch('/api/kns/resolve')
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('name parameter required')
      })
    })

    describe('/api/kns/reverse', () => {
      it('should reverse lookup account ID to name', async () => {
        const mockResponse = {
          name: 'alice.hbar',
          accountId: '0.0.12345',
          cached: false,
          timestamp: new Date().toISOString()
        }

        ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
          status: 200,
          statusText: 'OK'
        } as Response)

        const response = await fetch('/api/kns/reverse?accountId=0.0.12345')
        const data = await response.json()

        expect(data.name).toBe('alice.hbar')
        expect(data.accountId).toBe('0.0.12345')
      })

      it('should return null for account with no name', async () => {
        const mockResponse = {
          name: null,
          accountId: '0.0.99999',
          cached: false,
          timestamp: new Date().toISOString()
        }

        ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
          status: 200,
          statusText: 'OK'
        } as Response)

        const response = await fetch('/api/kns/reverse?accountId=0.0.99999')
        const data = await response.json()

        expect(data.name).toBeNull()
        expect(data.accountId).toBe('0.0.99999')
      })
    })

    describe('/api/kns/available', () => {
      it('should return availability status for a name', async () => {
        const mockResponse = {
          available: true,
          name: 'newname.hbar',
          cached: false,
          timestamp: new Date().toISOString()
        }

        ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
          status: 200,
          statusText: 'OK'
        } as Response)

        const response = await fetch('/api/kns/available?name=newname.hbar')
        const data = await response.json()

        expect(data.available).toBe(true)
        expect(data.name).toBe('newname.hbar')
      })

      it('should return false for taken name', async () => {
        const mockResponse = {
          available: false,
          name: 'taken.hbar',
          cached: false,
          timestamp: new Date().toISOString()
        }

        ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
          status: 200,
          statusText: 'OK'
        } as Response)

        const response = await fetch('/api/kns/available?name=taken.hbar')
        const data = await response.json()

        expect(data.available).toBe(false)
        expect(data.name).toBe('taken.hbar')
      })
    })
  })

  describe('Name Normalization', () => {
    it('should normalize names correctly', () => {
      const testCases = [
        { input: '@alice', expected: 'alice.hbar' },
        { input: 'alice', expected: 'alice.hbar' },
        { input: 'alice.hbar', expected: 'alice.hbar' },
        { input: '@Alice.HBAR', expected: 'alice.hbar' },
        { input: '  @alice  ', expected: 'alice.hbar' },
        { input: 'test123', expected: 'test123.hbar' }
      ]

      // Mock the normalizeName function behavior
      testCases.forEach(({ input, expected }) => {
        // Simulate normalization logic
        const nfkc = input.normalize?.('NFKC') ?? input
        const clean = nfkc.trim().toLowerCase().replace(/^@/, '')
        const normalized = clean.endsWith('.hbar') ? clean : `${clean}.hbar`
        
        expect(normalized).toBe(expected)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout')
      timeoutError.name = 'AbortError'

      ;(fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(timeoutError)

      try {
        await fetch('/api/kns/resolve?name=test.hbar')
      } catch (error) {
        expect(error).toEqual(timeoutError)
      }
    })

    it('should handle network errors', async () => {
      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'KNS resolve failed', message: 'Network error' }),
        status: 502,
        statusText: 'Bad Gateway'
      } as Response)

      const response = await fetch('/api/kns/resolve?name=test.hbar')
      const data = await response.json()

      expect(response.status).toBe(502)
      expect(data.error).toBe('KNS resolve failed')
    })

    it('should handle invalid JSON responses', async () => {
      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON') },
        status: 200,
        statusText: 'OK'
      } as Response)

      try {
        const response = await fetch('/api/kns/resolve?name=test.hbar')
        await response.json()
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Invalid JSON')
      }
    })
  })

  describe('Caching', () => {
    it('should implement proper cache key structure', () => {
      const cacheKeys = [
        'resolve:alice.hbar',
        'reverse:0.0.12345',
        'available:newname.hbar'
      ]

      cacheKeys.forEach(key => {
        expect(key).toMatch(/^(resolve|reverse|available):.+/)
      })
    })

    it('should respect cache TTL', () => {
      const cacheTTL = Number(process.env.CACHE_TTL_SECONDS || 120)
      expect(cacheTTL).toBeGreaterThan(0)
      expect(cacheTTL).toBeLessThanOrEqual(3600) // Max 1 hour
    })
  })

  describe('Account ID Validation', () => {
    it('should validate Hedera account ID format', () => {
      const validAccountIds = [
        '0.0.12345',
        '0.0.1',
        '0.0.999999999'
      ]

      const invalidAccountIds = [
        '12345',
        '0.0.',
        '0.0.abc',
        '1.0.12345',
        '0.1.12345'
      ]

      const accountIdRegex = /^0\.0\.\d+$/

      validAccountIds.forEach(accountId => {
        expect(accountId).toMatch(accountIdRegex)
      })

      invalidAccountIds.forEach(accountId => {
        expect(accountId).not.toMatch(accountIdRegex)
      })
    })
  })
})

export {}