import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock sessionStorage for tests
const createMockStorage = () => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get _store() { return store } // for testing
  }
}

const mockStorage = createMockStorage()

describe('Session Hardening', () => {
  beforeEach(() => {
    // Clear all mocks and storage before each test
    jest.resetModules()
    mockStorage.clear()
    
    // Reset jsdom sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: mockStorage,
      writable: true,
      configurable: true
    })
    
    // Mock location search
    delete (window as any).location
    window.location = { search: '' } as any
    
    // Reset environment mocks
    process.env.NEXT_PUBLIC_ALLOW_DEMO = 'off'
    process.env.NEXT_PUBLIC_DEMO_SEED = 'off'
    process.env.NEXT_PUBLIC_HCS_ENABLED = 'false'
  })

  describe('getSessionId() hardening', () => {
    it('does not return tm-alex-chen when ALLOW_DEMO=false', async () => {
      // Ensure ALLOW_DEMO is false
      process.env.NEXT_PUBLIC_ALLOW_DEMO = 'off'
      
      const { getSessionId } = await import('../lib/session')
      const id = getSessionId()
      
      expect(id).not.toBe('tm-alex-chen')
      expect(id.startsWith('tm-')).toBe(true)
      expect(id.length).toBeGreaterThan(10) // Should be generated format
    })

    it('returns tm-alex-chen only when ALLOW_DEMO=on + demo mode', async () => {
      // Enable demo mode
      process.env.NEXT_PUBLIC_ALLOW_DEMO = 'on'
      process.env.NEXT_PUBLIC_DEMO_SEED = 'on'
      
      jest.resetModules() // Clear module cache to pick up new env
      const { getSessionId } = await import('../lib/session')
      
      const id = getSessionId()
      expect(id).toBe('tm-alex-chen')
    })

    it('returns tm-alex-chen when ALLOW_DEMO=on and not live mode', async () => {
      // Enable demo but without explicit seed flag
      process.env.NEXT_PUBLIC_ALLOW_DEMO = 'on'
      window.location.search = '' // No ?live=1
      
      jest.resetModules()
      const { getSessionId } = await import('../lib/session')
      
      const id = getSessionId()
      expect(id).toBe('tm-alex-chen')
    })

    it('generates random session when ALLOW_DEMO=on but live mode forced', async () => {
      // Enable demo but force live mode via URL
      process.env.NEXT_PUBLIC_ALLOW_DEMO = 'on'
      window.location.search = '?live=1'
      
      jest.resetModules()
      const { getSessionId } = await import('../lib/session')
      
      const id = getSessionId()
      expect(id).not.toBe('tm-alex-chen')
      expect(id.startsWith('tm-')).toBe(true)
    })

    it('respects existing sessionStorage id', async () => {
      process.env.NEXT_PUBLIC_ALLOW_DEMO = 'off'
      
      // Pre-populate sessionStorage
      mockStorage.setItem('tm_session_id', 'tm-fixed123')
      
      jest.resetModules()
      const { getSessionId } = await import('../lib/session')
      
      const id = getSessionId()
      expect(id).toBe('tm-fixed123')
    })

    it('generates new id when resetSession() called', async () => {
      process.env.NEXT_PUBLIC_ALLOW_DEMO = 'off'
      
      jest.resetModules()
      const { getSessionId, resetSession } = await import('../lib/session')
      
      // Get initial session
      const id1 = getSessionId()
      expect(mockStorage._store['tm_session_id']).toBe(id1)
      
      // Reset and get new session
      resetSession()
      expect(mockStorage._store['tm_session_id']).toBeUndefined()
      
      const id2 = getSessionId()
      expect(id2).not.toBe(id1)
      expect(id2.startsWith('tm-')).toBe(true)
    })

    it('handles ephemeral mode correctly', async () => {
      process.env.NEXT_PUBLIC_ALLOW_DEMO = 'off'
      
      jest.resetModules()
      const { getSessionId } = await import('../lib/session')
      
      // Ephemeral mode should not use sessionStorage
      const id = getSessionId(true) // ephemeral=true
      expect(mockStorage._store['tm_session_id']).toBeUndefined()
      
      // But should still generate valid ID
      expect(id.startsWith('tm-')).toBe(true)
    })
  })

  describe('getSessionProfile() hardening', () => {
    it('does not decorate profile when ALLOW_DEMO=false', async () => {
      process.env.NEXT_PUBLIC_ALLOW_DEMO = 'off'
      
      jest.resetModules()
      const { getSessionProfile } = await import('../lib/session')
      
      const profile = await getSessionProfile()
      
      // Should get a generated session ID
      expect(profile.sessionId).not.toBe('tm-alex-chen')
      expect(profile.handle).toBe(profile.sessionId) // Not decorated
      expect(profile.handle).not.toBe('@alex.chen')
    })

    it('decorates profile only when ALLOW_DEMO=on and alex session', async () => {
      process.env.NEXT_PUBLIC_ALLOW_DEMO = 'on'
      process.env.NEXT_PUBLIC_DEMO_SEED = 'on'
      
      jest.resetModules()
      const { getSessionProfile } = await import('../lib/session')
      
      const profile = await getSessionProfile()
      
      expect(profile.sessionId).toBe('tm-alex-chen')
      expect(profile.handle).toBe('@alex.chen')
      expect(profile.profileHrl).toContain('tm-alex-chen')
    })
  })

  describe('Production safety', () => {
    it('never allows demo when ALLOW_DEMO=off regardless of other flags', async () => {
      // Try to force demo with all possible flags
      process.env.NEXT_PUBLIC_ALLOW_DEMO = 'off'
      process.env.NEXT_PUBLIC_DEMO_SEED = 'on'
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true'
      window.location.search = '' // No live flag
      
      jest.resetModules()
      const { getSessionId } = await import('../lib/session')
      
      const id = getSessionId()
      expect(id).not.toBe('tm-alex-chen')
    })

    it('validates ALLOW_DEMO flag format strictly', async () => {
      // Only 'on' should enable demo
      const testCases = ['true', 'yes', '1', 'ON', 'True', 'enabled', '']
      
      for (const value of testCases) {
        process.env.NEXT_PUBLIC_ALLOW_DEMO = value
        
        jest.resetModules()
        const { getSessionId } = await import('../lib/session')
        
        const id = getSessionId()
        expect(id).not.toBe('tm-alex-chen')
      }
      
      // Only 'on' should work
      process.env.NEXT_PUBLIC_ALLOW_DEMO = 'on'
      jest.resetModules()
      const { getSessionId: getSessionIdOn } = await import('../lib/session')
      expect(getSessionIdOn()).toBe('tm-alex-chen')
    })
  })
})