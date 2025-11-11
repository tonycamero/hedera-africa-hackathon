/**
 * Tests for HcsCircleState incremental circle graph cache
 */

import { circleState, CircleNode } from '@/lib/stores/HcsCircleState'

describe('HcsCircleState', () => {
  beforeEach(() => {
    // Clear state before each test
    circleState.clear()
  })

  describe('addContactEvent', () => {
    it('builds correct neighbor set from CONTACT_ACCEPT events', () => {
      const events = [
        { type: 'CONTACT_ACCEPT' as const, actor: '0.0.111', target: '0.0.222', ts: Date.now(), metadata: {} },
        { type: 'CONTACT_ACCEPT' as const, actor: '0.0.111', target: '0.0.333', ts: Date.now(), metadata: {} }
      ]
      
      events.forEach(e => circleState.addContactEvent(e))
      
      const circle = circleState.getCircleFor('0.0.111')
      expect(circle.contacts).toHaveLength(2)
      expect(circle.contacts.map(c => c.accountId)).toContain('0.0.222')
      expect(circle.contacts.map(c => c.accountId)).toContain('0.0.333')
    })

    it('handles revocations correctly', () => {
      // Add contact
      circleState.addContactEvent({ 
        type: 'CONTACT_ACCEPT', 
        actor: '0.0.111', 
        target: '0.0.222', 
        ts: Date.now(),
        metadata: {} 
      })
      
      // Verify it exists
      let circle = circleState.getCircleFor('0.0.111')
      expect(circle.contacts).toHaveLength(1)
      
      // Revoke contact
      circleState.addContactEvent({ 
        type: 'CONTACT_REVOKE', 
        actor: '0.0.111', 
        target: '0.0.222', 
        ts: Date.now(),
        metadata: {} 
      })
      
      // Verify it's gone
      circle = circleState.getCircleFor('0.0.111')
      expect(circle.contacts).toHaveLength(0)
    })

    it('creates bidirectional edges for CONTACT_ACCEPT', () => {
      circleState.addContactEvent({ 
        type: 'CONTACT_ACCEPT', 
        actor: '0.0.111', 
        target: '0.0.222', 
        ts: Date.now(),
        metadata: {} 
      })
      
      // Check both directions
      const circle111 = circleState.getCircleFor('0.0.111')
      const circle222 = circleState.getCircleFor('0.0.222')
      
      expect(circle111.contacts.map(c => c.accountId)).toContain('0.0.222')
      expect(circle222.contacts.map(c => c.accountId)).toContain('0.0.111')
    })

    it('handles metadata correctly', () => {
      circleState.addContactEvent({ 
        type: 'CONTACT_ACCEPT', 
        actor: '0.0.111', 
        target: '0.0.222', 
        ts: Date.now(),
        metadata: { handle: 'Alice' } 
      })
      
      const circle = circleState.getCircleFor('0.0.111')
      const contact = circle.contacts.find(c => c.accountId === '0.0.222')
      
      expect(contact).toBeDefined()
      expect(contact?.handle).toBe('Alice')
    })

    it('skips events with missing target', () => {
      circleState.addContactEvent({ 
        type: 'CONTACT_ACCEPT', 
        actor: '0.0.111', 
        target: undefined, 
        ts: Date.now(),
        metadata: {} 
      })
      
      const circle = circleState.getCircleFor('0.0.111')
      expect(circle.contacts).toHaveLength(0)
    })
  })

  describe('addTrustEvent', () => {
    it('updates trust strength for existing contact', () => {
      // First establish contact
      circleState.addContactEvent({ 
        type: 'CONTACT_ACCEPT', 
        actor: '0.0.111', 
        target: '0.0.222', 
        ts: Date.now(),
        metadata: {} 
      })
      
      // Add trust
      circleState.addTrustEvent({
        type: 'TRUST_ALLOCATE',
        actor: '0.0.111',
        target: '0.0.222',
        ts: Date.now(),
        metadata: { amount: 5 }
      })
      
      const circle = circleState.getCircleFor('0.0.111')
      const edge = circle.edges.find(e => e.to === '0.0.222')
      
      expect(edge).toBeDefined()
      expect(edge?.strength).toBe(5)
    })

    it('accumulates trust strength over multiple allocations', () => {
      circleState.addContactEvent({ 
        type: 'CONTACT_ACCEPT', 
        actor: '0.0.111', 
        target: '0.0.222', 
        ts: Date.now(),
        metadata: {} 
      })
      
      circleState.addTrustEvent({
        type: 'TRUST_ALLOCATE',
        actor: '0.0.111',
        target: '0.0.222',
        ts: Date.now(),
        metadata: { amount: 3 }
      })
      
      circleState.addTrustEvent({
        type: 'TRUST_ALLOCATE',
        actor: '0.0.111',
        target: '0.0.222',
        ts: Date.now(),
        metadata: { amount: 2 }
      })
      
      const circle = circleState.getCircleFor('0.0.111')
      const edge = circle.edges.find(e => e.to === '0.0.222')
      
      expect(edge?.strength).toBe(5)
    })

    it('skips trust events with missing target', () => {
      circleState.addTrustEvent({
        type: 'TRUST_ALLOCATE',
        actor: '0.0.111',
        target: undefined,
        ts: Date.now(),
        metadata: { amount: 5 }
      })
      
      // Should not crash or create invalid state
      const circle = circleState.getCircleFor('0.0.111')
      expect(circle.contacts).toHaveLength(0)
    })
  })

  describe('getCircleFor', () => {
    it('returns empty circle for unknown user', () => {
      const circle = circleState.getCircleFor('0.0.999')
      
      expect(circle.centerNode).toBeNull()
      expect(circle.contacts).toHaveLength(0)
      expect(circle.edges).toHaveLength(0)
    })

    it('returns only first-degree connections', () => {
      // Create A → B → C chain
      circleState.addContactEvent({ 
        type: 'CONTACT_ACCEPT', 
        actor: '0.0.A', 
        target: '0.0.B', 
        ts: Date.now(),
        metadata: {} 
      })
      
      circleState.addContactEvent({ 
        type: 'CONTACT_ACCEPT', 
        actor: '0.0.B', 
        target: '0.0.C', 
        ts: Date.now(),
        metadata: {} 
      })
      
      // A should only see B, not C
      const circleA = circleState.getCircleFor('0.0.A')
      expect(circleA.contacts).toHaveLength(1)
      expect(circleA.contacts[0].accountId).toBe('0.0.B')
      
      // B should see both A and C
      const circleB = circleState.getCircleFor('0.0.B')
      expect(circleB.contacts).toHaveLength(2)
    })

    it('filters out revoked contacts', () => {
      circleState.addContactEvent({ 
        type: 'CONTACT_ACCEPT', 
        actor: '0.0.111', 
        target: '0.0.222', 
        ts: Date.now(),
        metadata: {} 
      })
      
      circleState.addContactEvent({ 
        type: 'CONTACT_ACCEPT', 
        actor: '0.0.111', 
        target: '0.0.333', 
        ts: Date.now(),
        metadata: {} 
      })
      
      // Revoke one
      circleState.addContactEvent({ 
        type: 'CONTACT_REVOKE', 
        actor: '0.0.111', 
        target: '0.0.222', 
        ts: Date.now(),
        metadata: {} 
      })
      
      const circle = circleState.getCircleFor('0.0.111')
      expect(circle.contacts).toHaveLength(1)
      expect(circle.contacts[0].accountId).toBe('0.0.333')
    })

    it('returns centerNode when user has established contacts', () => {
      circleState.addContactEvent({ 
        type: 'CONTACT_ACCEPT', 
        actor: '0.0.111', 
        target: '0.0.222', 
        ts: Date.now(),
        metadata: { handle: 'Alice' } 
      })
      
      const circle = circleState.getCircleFor('0.0.111')
      expect(circle.centerNode).not.toBeNull()
      expect(circle.centerNode?.accountId).toBe('0.0.111')
    })
  })

  describe('getContactsFor', () => {
    it('returns just contact list (convenience method)', () => {
      circleState.addContactEvent({ 
        type: 'CONTACT_ACCEPT', 
        actor: '0.0.111', 
        target: '0.0.222', 
        ts: Date.now(),
        metadata: {} 
      })
      
      circleState.addContactEvent({ 
        type: 'CONTACT_ACCEPT', 
        actor: '0.0.111', 
        target: '0.0.333', 
        ts: Date.now(),
        metadata: {} 
      })
      
      const contacts = circleState.getContactsFor('0.0.111')
      expect(contacts).toHaveLength(2)
      expect(contacts.every(c => 'accountId' in c && 'handle' in c)).toBe(true)
    })
  })

  describe('isReady', () => {
    it('returns false before any events processed', () => {
      expect(circleState.isReady()).toBe(false)
    })

    it('returns true after first event processed', () => {
      circleState.addContactEvent({ 
        type: 'CONTACT_ACCEPT', 
        actor: '0.0.111', 
        target: '0.0.222', 
        ts: Date.now(),
        metadata: {} 
      })
      
      expect(circleState.isReady()).toBe(true)
    })

    it('returns false after clear', () => {
      circleState.addContactEvent({ 
        type: 'CONTACT_ACCEPT', 
        actor: '0.0.111', 
        target: '0.0.222', 
        ts: Date.now(),
        metadata: {} 
      })
      
      expect(circleState.isReady()).toBe(true)
      
      circleState.clear()
      
      expect(circleState.isReady()).toBe(false)
    })
  })

  describe('getStats', () => {
    it('returns correct stats', () => {
      circleState.addContactEvent({ 
        type: 'CONTACT_ACCEPT', 
        actor: '0.0.111', 
        target: '0.0.222', 
        ts: Date.now(),
        metadata: {} 
      })
      
      circleState.addContactEvent({ 
        type: 'CONTACT_ACCEPT', 
        actor: '0.0.111', 
        target: '0.0.333', 
        ts: Date.now(),
        metadata: {} 
      })
      
      const stats = circleState.getStats()
      
      expect(stats.nodeCount).toBe(3) // 111, 222, 333
      expect(stats.edgeCount).toBeGreaterThan(0) // At least bidirectional edges
      expect(stats.ready).toBe(true)
      expect(stats.lastUpdated).toBeLessThanOrEqual(Date.now())
    })
  })

  describe('subscribe', () => {
    it('notifies listeners on state changes', () => {
      const listener = jest.fn()
      const unsubscribe = circleState.subscribe(listener)
      
      circleState.addContactEvent({ 
        type: 'CONTACT_ACCEPT', 
        actor: '0.0.111', 
        target: '0.0.222', 
        ts: Date.now(),
        metadata: {} 
      })
      
      expect(listener).toHaveBeenCalled()
      
      unsubscribe()
    })

    it('stops notifying after unsubscribe', () => {
      const listener = jest.fn()
      const unsubscribe = circleState.subscribe(listener)
      
      circleState.addContactEvent({ 
        type: 'CONTACT_ACCEPT', 
        actor: '0.0.111', 
        target: '0.0.222', 
        ts: Date.now(),
        metadata: {} 
      })
      
      expect(listener).toHaveBeenCalledTimes(1)
      
      unsubscribe()
      
      circleState.addContactEvent({ 
        type: 'CONTACT_ACCEPT', 
        actor: '0.0.111', 
        target: '0.0.333', 
        ts: Date.now(),
        metadata: {} 
      })
      
      // Should still be 1 (not called again)
      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('clear', () => {
    it('removes all nodes and edges', () => {
      circleState.addContactEvent({ 
        type: 'CONTACT_ACCEPT', 
        actor: '0.0.111', 
        target: '0.0.222', 
        ts: Date.now(),
        metadata: {} 
      })
      
      circleState.clear()
      
      const stats = circleState.getStats()
      expect(stats.nodeCount).toBe(0)
      expect(stats.edgeCount).toBe(0)
      expect(stats.ready).toBe(false)
    })

    it('notifies listeners', () => {
      const listener = jest.fn()
      circleState.subscribe(listener)
      
      circleState.clear()
      
      expect(listener).toHaveBeenCalled()
    })
  })

  describe('re-bonding scenarios', () => {
    it('handles re-bonding after revocation', () => {
      const ts1 = Date.now()
      const ts2 = ts1 + 1000
      const ts3 = ts2 + 1000
      
      // Initial bond
      circleState.addContactEvent({ 
        type: 'CONTACT_ACCEPT', 
        actor: '0.0.111', 
        target: '0.0.222', 
        ts: ts1,
        metadata: {} 
      })
      
      expect(circleState.getContactsFor('0.0.111')).toHaveLength(1)
      
      // Revoke
      circleState.addContactEvent({ 
        type: 'CONTACT_REVOKE', 
        actor: '0.0.111', 
        target: '0.0.222', 
        ts: ts2,
        metadata: {} 
      })
      
      expect(circleState.getContactsFor('0.0.111')).toHaveLength(0)
      
      // Re-bond
      circleState.addContactEvent({ 
        type: 'CONTACT_ACCEPT', 
        actor: '0.0.111', 
        target: '0.0.222', 
        ts: ts3,
        metadata: {} 
      })
      
      expect(circleState.getContactsFor('0.0.111')).toHaveLength(1)
    })
  })
})
