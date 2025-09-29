/**
 * Step 5: Demo removal regression tests
 * Ensures demo paths are properly removed and production is clean
 */

import { describe, test, expect, beforeEach } from '@jest/globals'

describe('Step 5: Demo Removal Regression Tests', () => {
  beforeEach(() => {
    // Reset any global state before each test
    jest.clearAllMocks()
  })

  describe('Seed endpoints should be removed', () => {
    test('seed-demo endpoint should not exist', async () => {
      // In a real app test, you'd make actual HTTP requests
      // For now, we just test that the module doesn't exist
      expect(() => {
        require('@/app/api/seed-demo/route')
      }).toThrow()
    })

    test('seed-hcs endpoint should not exist', async () => {
      expect(() => {
        require('@/app/api/seed-hcs/route')
      }).toThrow()
    })

    test('seed-recognition endpoint should not exist', async () => {
      expect(() => {
        require('@/app/api/seed-recognition/route')
      }).toThrow()
    })
  })

  describe('Demo files should be removed', () => {
    test('demoProfiles.ts should not exist', () => {
      expect(() => {
        require('@/lib/data/demoProfiles')
      }).toThrow()
    })

    test('demo seed.ts should not exist', () => {
      expect(() => {
        require('@/lib/demo/seed')
      }).toThrow()
    })
  })

  describe('Session service should not default to Alex Chen', () => {
    test('getSessionId should not return tm-alex-chen in production', async () => {
      // Mock production environment
      const originalEnv = process.env.NODE_ENV
      const originalAllowDemo = process.env.ALLOW_DEMO
      
      process.env.NODE_ENV = 'production'
      process.env.ALLOW_DEMO = 'false'
      
      try {
        const { getSessionId } = await import('@/lib/session')
        const sessionId = getSessionId()
        
        expect(sessionId).not.toBe('tm-alex-chen')
        expect(sessionId).toMatch(/^tm-[a-z0-9]+$/) // Should be random format
      } finally {
        process.env.NODE_ENV = originalEnv
        process.env.ALLOW_DEMO = originalAllowDemo
      }
    })
  })

  describe('Demo guard should prevent access in production', () => {
    test('assertDemoAllowed should be no-op in production', async () => {
      const originalEnv = process.env.NODE_ENV
      const originalAllowDemo = process.env.ALLOW_DEMO
      
      process.env.NODE_ENV = 'production'  
      process.env.ALLOW_DEMO = 'false'
      
      try {
        const { assertDemoAllowed } = await import('@/lib/demo/guard')
        
        // Should not throw in production, just return false
        const result = assertDemoAllowed('test')
        expect(result).toBe(false)
      } finally {
        process.env.NODE_ENV = originalEnv
        process.env.ALLOW_DEMO = originalAllowDemo
      }
    })
  })

  describe('HCS services should not have demo methods', () => {
    test('HCSFeedService should not have enableSeedMode method', async () => {
      const { hcsFeedService } = await import('@/lib/services/HCSFeedService')
      
      // These methods should be removed
      expect((hcsFeedService as any).enableSeedMode).toBeUndefined()
      expect((hcsFeedService as any).disableSeedMode).toBeUndefined()
      expect((hcsFeedService as any).resetDemo).toBeUndefined()
    })
  })

  describe('Profile service should not have demo decoration', () => {
    test('createFreshProfile should not create Alex Chen profile', async () => {
      const { profileService } = await import('@/lib/profile/profileService')
      
      // Get a fresh profile (mocking private method access for testing)
      const profile = await (profileService as any).createFreshProfile()
      
      expect(profile.data.handle).not.toBe('@alex.chen')
      expect(profile.data.bio).not.toContain('Coffee enthusiast')
      expect(profile.data.handle).toBe('user_dev')
    })
  })

  describe('No references to seeded tag in signals store', () => {
    test('signalsStore should not have seeded tag logic', async () => {
      const { signalsStore } = await import('@/lib/stores/signalsStore')
      
      // Check the store implementation doesn't reference 'seeded' tags
      const storeStr = signalsStore.toString()
      expect(storeStr).not.toContain('seeded')
      expect(storeStr).not.toContain('meta.tag')
    })
  })
})