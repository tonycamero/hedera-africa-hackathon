/**
 * Tests for token-gated mode detection
 */

import { describe, it, expect } from '@jest/globals'
import { detectLayoutMode } from '../mode-detector'
import type { UserTokens } from '../token-types'

describe('Token-gated mode detection', () => {
  const baseContext = {
    pathname: '/signals',
    isAuthenticated: true,
  }

  it('returns vip mode for legendary NFT holder', () => {
    const tokens: UserTokens = {
      nfts: ['networking-goat@1'],
      badges: [],
      memberships: [],
      trustLevel: 5,
    }

    const mode = detectLayoutMode({ ...baseContext, userTokens: tokens })
    expect(mode).toBe('vip')
  })

  it('returns civic-leader mode for trust level 9', () => {
    const tokens: UserTokens = {
      nfts: [],
      badges: [],
      memberships: [],
      trustLevel: 9,
    }

    const mode = detectLayoutMode({ ...baseContext, userTokens: tokens })
    expect(mode).toBe('civic-leader')
  })

  it('returns premium mode for PRO_ANNUAL member', () => {
    const tokens: UserTokens = {
      nfts: [],
      badges: [],
      memberships: ['PRO_ANNUAL'],
      trustLevel: 5,
    }

    const mode = detectLayoutMode({ ...baseContext, userTokens: tokens })
    expect(mode).toBe('premium')
  })

  it('returns collector mode for 10+ NFTs', () => {
    const tokens: UserTokens = {
      nfts: Array.from({ length: 10 }, (_, i) => `nft-${i}`),
      badges: [],
      memberships: [],
      trustLevel: 5,
    }

    const mode = detectLayoutMode({ ...baseContext, userTokens: tokens })
    expect(mode).toBe('collector')
  })

  it('prioritizes vip over other token-gated modes', () => {
    const tokens: UserTokens = {
      nfts: ['networking-goat@1', ...Array.from({ length: 10 }, (_, i) => `nft-${i}`)],
      badges: [],
      memberships: ['PRO_ANNUAL'],
      trustLevel: 9,
    }

    const mode = detectLayoutMode({ ...baseContext, userTokens: tokens })
    expect(mode).toBe('vip')
  })

  it('falls back to app mode when no tokens qualify', () => {
    const tokens: UserTokens = {
      nfts: ['regular-nft'],
      badges: [],
      memberships: [],
      trustLevel: 3,
    }

    const mode = detectLayoutMode({ ...baseContext, userTokens: tokens })
    expect(mode).toBe('app')
  })

  it('requires authentication for token-gated modes', () => {
    const tokens: UserTokens = {
      nfts: ['networking-goat@1'],
      badges: [],
      memberships: [],
      trustLevel: 9,
    }

    const mode = detectLayoutMode({ 
      pathname: '/signals',
      isAuthenticated: false,
      userTokens: tokens 
    })
    
    expect(mode).toBe('app')
  })

  it('returns viral mode for public paths even with tokens', () => {
    const tokens: UserTokens = {
      nfts: ['networking-goat@1'],
      badges: [],
      memberships: [],
      trustLevel: 9,
    }

    const mode = detectLayoutMode({ 
      pathname: '/collections/123',
      isAuthenticated: true,
      userTokens: tokens 
    })
    
    expect(mode).toBe('viral')
  })
})
