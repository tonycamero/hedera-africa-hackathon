import { SignalEvent } from '../stores/signalsStore'
import { getRuntimeFlags } from '../runtimeFlags'

export const SEED_TAG = "seeded"

export function shouldPublishToHCS(evt: SignalEvent): boolean {
  return process.env.NEXT_PUBLIC_HCS_ENABLED === "true" && evt.meta?.tag !== SEED_TAG
}

export function createSeedData(sessionId?: string): SignalEvent[] {
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const hour = 60 * 60 * 1000

  // Generate fake user IDs that don't clash with real sessions
  const users = [
    'tm-alice47',
    'tm-bob23k',
    'tm-carol91',
    'tm-dave15x',
    'tm-eve88y',
    'tm-frank12'
  ]

  const seedEvents: SignalEvent[] = []

  // Bonded contact pair 1: Alice
  const currentSessionId = sessionId || 'session-demo'
  const aliceRequestHash = 'sha256-alice-request-hash'
  seedEvents.push({
    id: `seed_contact_req_alice`,
    class: "contact",
    topicType: "CONTACT",
    direction: "inbound",
    actors: { from: users[0], to: currentSessionId },
    payload: {
      to: currentSessionId,
      fromProfileId: users[0],
      fromProfileHrl: 'hcs://11/0.0.6889641/42',
      handle: 'Alice Chen'
    },
    ts: now - (3 * day),
    status: "onchain",
    seen: true,
    type: "CONTACT_REQUEST",
    meta: { tag: SEED_TAG }
  })

  seedEvents.push({
    id: `seed_contact_accept_alice`,
    class: "contact",
    topicType: "CONTACT", 
    direction: "outbound",
    actors: { from: currentSessionId, to: users[0] },
    payload: {
      of: aliceRequestHash,
      to: users[0],
      toProfileId: currentSessionId,
      toProfileHrl: 'hcs://11/0.0.6889641/77',
      handle: 'Alice Chen'
    },
    ts: now - (3 * day) + (3 * 1000), // 3 seconds after request
    status: "onchain",
    seen: true,
    type: "CONTACT_ACCEPT",
    meta: { tag: SEED_TAG }
  })

  // Bonded contact pair 2: Bob
  const bobRequestHash = 'sha256-bob-request-hash'
  seedEvents.push({
    id: `seed_contact_req_bob`,
    class: "contact",
    topicType: "CONTACT",
    direction: "inbound",
    actors: { from: users[1], to: currentSessionId },
    payload: {
      to: currentSessionId,
      fromProfileId: users[1],
      fromProfileHrl: 'hcs://11/0.0.6889641/58',
      handle: 'Bob Martinez'
    },
    ts: now - (2 * day),
    status: "onchain",
    seen: true,
    type: "CONTACT_REQUEST",
    meta: { tag: SEED_TAG }
  })

  seedEvents.push({
    id: `seed_contact_accept_bob`,
    class: "contact",
    topicType: "CONTACT", 
    direction: "outbound",
    actors: { from: currentSessionId, to: users[1] },
    payload: {
      of: bobRequestHash,
      to: users[1],
      toProfileId: currentSessionId,
      toProfileHrl: 'hcs://11/0.0.6889641/79',
      handle: 'Bob Martinez'
    },
    ts: now - (2 * day) + (4 * 1000), // 4 seconds after request
    status: "onchain",
    seen: true,
    type: "CONTACT_ACCEPT",
    meta: { tag: SEED_TAG }
  })

  // Bonded contact pair 3: Carol
  const carolRequestHash = 'sha256-carol-request-hash'
  seedEvents.push({
    id: `seed_contact_req_carol`,
    class: "contact",
    topicType: "CONTACT",
    direction: "inbound",
    actors: { from: users[2], to: currentSessionId },
    payload: {
      to: currentSessionId,
      fromProfileId: users[2],
      fromProfileHrl: 'hcs://11/0.0.6889641/91',
      handle: 'Carol Wang'
    },
    ts: now - (1 * day),
    status: "onchain",
    seen: true,
    type: "CONTACT_REQUEST",
    meta: { tag: SEED_TAG }
  })

  seedEvents.push({
    id: `seed_contact_accept_carol`,
    class: "contact",
    topicType: "CONTACT", 
    direction: "outbound",
    actors: { from: currentSessionId, to: users[2] },
    payload: {
      of: carolRequestHash,
      to: users[2],
      toProfileId: currentSessionId,
      toProfileHrl: 'hcs://11/0.0.6889641/92',
      handle: 'Carol Wang'
    },
    ts: now - (1 * day) + (2 * 1000), // 2 seconds after request
    status: "onchain",
    seen: true,
    type: "CONTACT_ACCEPT",
    meta: { tag: SEED_TAG }
  })

  // Trust allocations to bonded contacts
  seedEvents.push({
    id: `seed_trust_alloc_alice`,
    class: "trust",
    topicType: "TRUST",
    direction: "outbound", 
    actors: { from: currentSessionId, to: users[0] },
    payload: {
      to: users[0],
      weight: 3,
      reason: "excellent_code_reviews"
    },
    ts: now - (2 * day) + (6 * hour), // 6 hours after bonding
    status: "onchain",
    seen: true,
    type: "TRUST_ALLOCATE",
    meta: { tag: SEED_TAG }
  })

  seedEvents.push({
    id: `seed_trust_alloc_bob`,
    class: "trust",
    topicType: "TRUST",
    direction: "outbound",
    actors: { from: currentSessionId, to: users[1] },
    payload: {
      to: users[1], 
      weight: 2,
      reason: "great_ux_feedback"
    },
    ts: now - (1 * day) + (12 * hour), // 12 hours after bonding
    status: "onchain",
    seen: true,
    type: "TRUST_ALLOCATE",
    meta: { tag: SEED_TAG }
  })

  // Incoming trust allocation
  seedEvents.push({
    id: `seed_trust_alloc_from_carol`,
    class: "trust",
    topicType: "TRUST",
    direction: "inbound",
    actors: { from: users[2], to: currentSessionId },
    payload: {
      to: currentSessionId, 
      weight: 1,
      reason: "helpful_insights"
    },
    ts: now - (6 * hour),
    status: "onchain",
    seen: false,
    type: "TRUST_ALLOCATE",
    meta: { tag: SEED_TAG }
  })

  // Pending contact requests (not accepted yet)
  seedEvents.push({
    id: `seed_contact_req_dave_pending`,
    class: "contact",
    topicType: "CONTACT",
    direction: "inbound",
    actors: { from: users[3], to: currentSessionId },
    payload: {
      to: currentSessionId,
      fromProfileId: users[3],
      fromProfileHrl: 'hcs://11/0.0.6889641/123',
      handle: 'Dave Kim'
    },
    ts: now - (2 * hour), // 2 hours ago
    status: "local",
    seen: false,
    type: "CONTACT_REQUEST",
    meta: { tag: SEED_TAG }
  })

  // Outgoing contact request (waiting for response)
  seedEvents.push({
    id: `seed_contact_req_eve_outgoing`,
    class: "contact",
    topicType: "CONTACT",
    direction: "outbound",
    actors: { from: currentSessionId, to: users[4] },
    payload: {
      to: users[4],
      fromProfileId: currentSessionId,
      fromProfileHrl: 'hcs://11/0.0.6889641/77',
      handle: 'Eve Thompson'
    },
    ts: now - (30 * 60 * 1000), // 30 min ago
    status: "local",
    seen: true,
    type: "CONTACT_REQUEST",
    meta: { tag: SEED_TAG }
  })

  // Recognition signal mints (hashinals) for current session
  seedEvents.push({
    id: `seed_signal_mint_social`,
    class: "recognition",
    topicType: "SIGNAL",
    direction: "inbound",
    actors: { from: 'system-issuer', to: currentSessionId },
    payload: {
      tokenId: '#0847',
      name: 'Community Leader',
      kind: 'social',
      subtitle: 'Organized 5+ blockchain meetups',
      emoji: '👑',
      to: currentSessionId,
      uri: 'hcs://11/0.0.6889644/847',
      metadata: { category: 'social', issuer: 'system-issuer' }
    },
    ts: now - (7 * day),
    status: "onchain",
    seen: true,
    type: "SIGNAL_MINT",
    meta: { tag: SEED_TAG }
  })

  seedEvents.push({
    id: `seed_signal_mint_academic`,
    class: "recognition",
    topicType: "SIGNAL",
    direction: "inbound",
    actors: { from: 'ethereum-foundation', to: currentSessionId },
    payload: {
      tokenId: '#1247',
      name: 'Solidity Expert',
      kind: 'academic',
      subtitle: 'Advanced smart contract certification',
      emoji: '📜',
      to: currentSessionId,
      uri: 'hcs://11/0.0.6889644/1247',
      metadata: { category: 'academic', issuer: 'ethereum-foundation' }
    },
    ts: now - (30 * day),
    status: "onchain",
    seen: true,
    type: "SIGNAL_MINT",
    meta: { tag: SEED_TAG }
  })

  seedEvents.push({
    id: `seed_signal_mint_professional`,
    class: "recognition",
    topicType: "SIGNAL",
    direction: "inbound",
    actors: { from: 'tech-skills-dao', to: currentSessionId },
    payload: {
      tokenId: '#2156',
      name: 'Full-Stack Developer',
      kind: 'professional',
      subtitle: '3+ years React & Node.js',
      emoji: '💻',
      to: currentSessionId,
      uri: 'hcs://11/0.0.6889644/2156',
      metadata: { category: 'professional', issuer: 'tech-skills-dao' }
    },
    ts: now - (60 * day),
    status: "onchain",
    seen: true,
    type: "SIGNAL_MINT",
    meta: { tag: SEED_TAG }
  })

  // System announcements
  seedEvents.push({
    id: `seed_system_1`,
    class: "system",
    topicType: "PROFILE",
    direction: "inbound",
    actors: { from: "system", to: "all" },
    payload: {
      type: "platform_update",
      message: "TrustMesh network now supports instant settlements",
      version: "v2.1.0"
    },
    ts: now - (6 * hour),
    status: "onchain",
    seen: true,
    type: "SYSTEM_ANNOUNCEMENT",
    meta: { tag: SEED_TAG }
  })

  // More trust activity to show network effects
  seedEvents.push({
    id: `seed_trust_alloc_3`,
    class: "trust",
    topicType: "TRUST",
    direction: "outbound",
    actors: { from: users[4], to: users[5] },
    payload: {
      to: users[5],
      weight: 1,
      reason: "first_collaboration"
    },
    ts: now - (30 * 60 * 1000), // 30 min ago
    status: "local",
    seen: false,
    type: "TRUST_ALLOCATE",
    meta: { tag: SEED_TAG }
  })

  // Return all seed events (no filtering needed now that we're using the session correctly)
  return seedEvents
}

export function seedDemo(signalsStore: any, sessionId?: string): void {
  const flags = getRuntimeFlags()
  
  // Only seed if enabled and not in live mode
  if (!flags.seedOn || flags.isLiveMode) {
    return
  }

  console.log('[Seed] Adding demo data to signals store')
  
  const seedData = createSeedData(sessionId)
  
  seedData.forEach(event => {
    signalsStore.addSignal(event)
  })
  
  console.log(`[Seed] Added ${seedData.length} demo events`)
}

export function removeSeedData(signalsStore: any): void {
  console.log('[Seed] Removing all seeded data')
  
  // This would need to be implemented in the signals store
  signalsStore.removeByTag(SEED_TAG)
}

export function isSeedEvent(event: SignalEvent): boolean {
  return event.meta?.tag === SEED_TAG
}