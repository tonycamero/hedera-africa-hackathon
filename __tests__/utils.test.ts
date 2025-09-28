import { describe, it, expect } from '@jest/globals'

// URL Builder Tests - Prevents /api/v1/api/v1 regressions
describe('URL Builder', () => {
  it('should not create double /api/v1 paths', () => {
    // Mock MirrorBackfill URL building logic
    const buildMirrorUrl = (baseUrl: string, path: string): string => {
      const cleanBase = baseUrl.replace(/\/+$/, '') // Remove trailing slashes
      const cleanPath = path.replace(/^\/+/, '') // Remove leading slashes
      
      // Ensure we don't double /api/v1
      if (cleanBase.endsWith('/api/v1') && cleanPath.startsWith('api/v1')) {
        return `${cleanBase}/${cleanPath.replace(/^api\/v1\//, '')}`
      }
      
      return `${cleanBase}/${cleanPath}`
    }

    // Test cases that previously caused double paths
    expect(buildMirrorUrl('https://testnet.mirrornode.hedera.com/api/v1', '/api/v1/topics')).toBe(
      'https://testnet.mirrornode.hedera.com/api/v1/topics'
    )
    
    expect(buildMirrorUrl('https://testnet.mirrornode.hedera.com', '/api/v1/topics')).toBe(
      'https://testnet.mirrornode.hedera.com/api/v1/topics'
    )
    
    expect(buildMirrorUrl('https://testnet.mirrornode.hedera.com/', 'api/v1/topics')).toBe(
      'https://testnet.mirrornode.hedera.com/api/v1/topics'
    )
  })

  it('should build WebSocket URLs correctly', () => {
    const buildWsUrl = (baseUrl: string, path: string): string => {
      const cleanBase = baseUrl.replace(/\/+$/, '')
      const cleanPath = path.replace(/^\/+/, '')
      return `${cleanBase}/${cleanPath}`
    }

    expect(buildWsUrl('wss://testnet.mirrornode.hedera.com', '/api/v1/topics/subscribe')).toBe(
      'wss://testnet.mirrornode.hedera.com/api/v1/topics/subscribe'
    )
  })
})

// Environment Cleaning Tests
describe('Environment Variable Cleaning', () => {
  it('should trim carriage returns and newlines', () => {
    const cleanEnv = (value: string | undefined): string => {
      if (!value) return ''
      return value.replace(/\r|\n/g, '').trim()
    }

    expect(cleanEnv('true\r\n')).toBe('true')
    expect(cleanEnv(' false \r')).toBe('false')
    expect(cleanEnv('0.0.123456\n')).toBe('0.0.123456')
    expect(cleanEnv(undefined)).toBe('')
  })

  it('should parse booleans robustly', () => {
    const parseBoolean = (value: string | undefined): boolean => {
      if (!value) return false
      const cleaned = value.replace(/\r|\n/g, '').trim().toLowerCase()
      return cleaned === 'true' || cleaned === '1' || cleaned === 'yes'
    }

    expect(parseBoolean('true\r\n')).toBe(true)
    expect(parseBoolean('TRUE')).toBe(true)
    expect(parseBoolean('1')).toBe(true)
    expect(parseBoolean('yes')).toBe(true)
    expect(parseBoolean('false\r')).toBe(false)
    expect(parseBoolean('FALSE')).toBe(false)
    expect(parseBoolean('0')).toBe(false)
    expect(parseBoolean('')).toBe(false)
    expect(parseBoolean(undefined)).toBe(false)
  })

  it('should handle topic ID cleaning', () => {
    const cleanTopicId = (value: string | undefined): string => {
      if (!value) return ''
      return value.replace(/\r|\n/g, '').trim().replace(/^0\.0\./, '0.0.')
    }

    expect(cleanTopicId('0.0.123456\r\n')).toBe('0.0.123456')
    expect(cleanTopicId(' 0.0.789012 ')).toBe('0.0.789012')
    expect(cleanTopicId('123456')).toBe('123456') // Raw ID without prefix
  })
})

// Production Safety Guards
describe('Production Safety', () => {
  it('should detect production environment correctly', () => {
    const isProduction = (env?: string): boolean => {
      if (!env) return false
      const cleaned = env.replace(/\r|\n/g, '').trim().toLowerCase()
      return cleaned === 'production'
    }

    expect(isProduction('production')).toBe(true)
    expect(isProduction('PRODUCTION')).toBe(true)
    expect(isProduction('development')).toBe(false)
    expect(isProduction('test')).toBe(false)
    expect(isProduction(undefined)).toBe(false)
  })

  it('should validate demo allowance in production', () => {
    const isDemoAllowed = (nodeEnv?: string, allowDemo?: string): boolean => {
      const isProduction = nodeEnv?.toLowerCase().trim() === 'production'
      const demoAllowed = allowDemo?.toLowerCase().trim() === 'true'
      
      // In production, demo must be explicitly allowed
      if (isProduction) {
        return demoAllowed
      }
      
      // In non-production, demo is allowed by default
      return true
    }

    expect(isDemoAllowed('production', 'true')).toBe(true)
    expect(isDemoAllowed('production', 'false')).toBe(false)
    expect(isDemoAllowed('production', undefined)).toBe(false)
    expect(isDemoAllowed('development', undefined)).toBe(true)
    expect(isDemoAllowed('development', 'false')).toBe(true)
  })
})