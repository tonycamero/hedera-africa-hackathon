import { describe, it, expect, beforeEach } from '@jest/globals'
import { signalsStore, SignalEvent } from '../lib/stores/signalsStore'

const now = Date.now()
const base = (over: Partial<SignalEvent> = {}): SignalEvent => ({
  type: 'CONTACT_REQUEST',
  actor: 'tm-a',
  target: 'tm-b',
  ts: now,
  topicId: '0.0.123',
  source: 'hcs',
  ...over
})

describe('SignalsStore invariants', () => {
  beforeEach(() => {
    // Clear the store before each test
    signalsStore.clear()
  })

  test('normalization shape required', () => {
    const e = base()
    signalsStore.add(e)
    const all = signalsStore.getAll()
    expect(all[0]).toMatchObject({
      type: 'CONTACT_REQUEST',
      actor: 'tm-a',
      target: 'tm-b',
      topicId: '0.0.123',
      source: 'hcs'
    })
    expect(typeof all[0].ts).toBe('number')
    expect(all[0].id).toBeDefined() // Should auto-generate ID
  })

  test('scope filtering (my)', () => {
    signalsStore.addMany([
      base({ actor: 'tm-me', target: 'tm-x' }),
      base({ actor: 'tm-x', target: 'tm-me', type: 'CONTACT_ACCEPT' }),
      base({ actor: 'tm-y', target: 'tm-z' }),
    ])
    const my = signalsStore.getScoped({ scope: 'my', sessionId: 'tm-me' })
    expect(my.map(e => e.type).sort()).toEqual(['CONTACT_ACCEPT', 'CONTACT_REQUEST'])
  })

  test('scope filtering (global)', () => {
    signalsStore.addMany([
      base({ actor: 'tm-me', target: 'tm-x' }),
      base({ actor: 'tm-x', target: 'tm-me', type: 'CONTACT_ACCEPT' }),
      base({ actor: 'tm-y', target: 'tm-z' }),
    ])
    const global = signalsStore.getScoped({ scope: 'global', sessionId: 'tm-me' })
    expect(global.length).toBe(3) // Shows all signals regardless of sessionId
  })

  test('no demo branching in queries', () => {
    // Even if we push an event that once had meta.tag='seeded',
    // store queries never check it.
    signalsStore.add(base({ metadata: { tag: 'seeded' } }))
    const all = signalsStore.getAll()
    expect(all.length).toBe(1)
    
    // Store treats it like any other signal
    const scoped = signalsStore.getScoped({ scope: 'my', sessionId: 'tm-a' })
    expect(scoped.length).toBe(1) // No filtering based on metadata.tag
  })

  test('summary reports counts by type & source', () => {
    signalsStore.addMany([
      base({ type: 'RECOGNITION_MINT', source: 'hcs' }),
      base({ type: 'RECOGNITION_MINT', source: 'hcs-cached' }),
      base({ type: 'CONTACT_ACCEPT', source: 'hcs' }),
    ])
    const s = signalsStore.getSummary()
    expect(s.countsByType).toMatchObject({ RECOGNITION_MINT: 2, CONTACT_ACCEPT: 1 })
    expect(s.countsBySource).toMatchObject({ 'hcs': 2, 'hcs-cached': 1 })
    expect(s.total).toBe(3)
  })

  test('memory cap works without demo logic', () => {
    // Add signals up to cap
    const signals = Array.from({ length: 205 }, (_, i) => base({ 
      actor: `tm-${i}`, 
      ts: now + i // Different timestamps
    }))
    
    signalsStore.addMany(signals)
    
    // Should be capped at HARD_CAP (200)
    const all = signalsStore.getAll()
    expect(all.length).toBe(200)
    
    // Most recent signals should be preserved (LRU)
    expect(all[0].actor).toBe('tm-204') // Most recent first
    expect(all[199].actor).toBe('tm-5') // 200th from end
  })

  test('type filtering works', () => {
    signalsStore.addMany([
      base({ type: 'CONTACT_REQUEST' }),
      base({ type: 'CONTACT_ACCEPT' }),
      base({ type: 'TRUST_ALLOCATE' }),
    ])
    
    const contactEvents = signalsStore.getScoped({ 
      scope: 'global', 
      sessionId: 'tm-any',
      types: ['CONTACT_REQUEST', 'CONTACT_ACCEPT']
    })
    
    expect(contactEvents.length).toBe(2)
    expect(contactEvents.every(e => e.type.startsWith('CONTACT_'))).toBe(true)
  })

  test('recognition helpers work', () => {
    signalsStore.addMany([
      base({ type: 'RECOGNITION_MINT', target: 'tm-alice' }),
      base({ type: 'RECOGNITION_MINT', target: 'tm-bob' }),
      base({ type: 'CONTACT_REQUEST', target: 'tm-alice' }),
    ])
    
    const aliceRecognitions = signalsStore.getRecognitionsFor('tm-alice')
    expect(aliceRecognitions.length).toBe(1)
    expect(aliceRecognitions[0].type).toBe('RECOGNITION_MINT')
  })

  test('recognition definitions can be stored', () => {
    const def = { id: 'test-token', name: 'Test Token', category: 'social' }
    signalsStore.upsertRecognitionDefinition(def)
    
    const defs = signalsStore.getRecognitionDefinitions()
    expect(defs['test-token']).toEqual(def)
  })

  test('getSince works correctly', () => {
    const baseTime = Date.now()
    signalsStore.addMany([
      base({ ts: baseTime - 1000 }),
      base({ ts: baseTime }),
      base({ ts: baseTime + 1000 }),
    ])
    
    const recent = signalsStore.getSince(baseTime)
    expect(recent.length).toBe(2) // Equal and after baseTime
  })

  test('getByActor and getByActorOrTarget work', () => {
    signalsStore.addMany([
      base({ actor: 'tm-alice', target: 'tm-bob' }),
      base({ actor: 'tm-bob', target: 'tm-alice' }),
      base({ actor: 'tm-charlie', target: 'tm-dave' }),
    ])
    
    const byAlice = signalsStore.getByActor('tm-alice')
    expect(byAlice.length).toBe(1)
    
    const aliceInvolved = signalsStore.getByActorOrTarget('tm-alice')
    expect(aliceInvolved.length).toBe(2) // As actor and as target
  })

  test('listener subscription works', () => {
    let callCount = 0
    const unsubscribe = signalsStore.subscribe(() => { callCount++ })
    
    signalsStore.add(base())
    expect(callCount).toBe(1)
    
    unsubscribe()
    signalsStore.add(base({ actor: 'tm-different' }))
    expect(callCount).toBe(1) // Shouldn't increment after unsubscribe
  })
})