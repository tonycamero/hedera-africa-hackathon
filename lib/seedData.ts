import { signalsStore, type SignalEvent } from './stores/signalsStore'

const DEMO_CONTACTS = [
  { id: '0.0.1234567', name: 'Alice Chen', handle: 'alice_dev' },
  { id: '0.0.2345678', name: 'Bob Smith', handle: 'bob_crypto' }, 
  { id: '0.0.3456789', name: 'Carol Wang', handle: 'carol_web3' },
  { id: '0.0.4567890', name: 'David Kim', handle: 'david_builder' },
  { id: '0.0.5678901', name: 'Emma Davis', handle: 'emma_design' }
]

export function seedDemoSignals(operatorId: string) {
  const baseTs = Date.now()
  const hour = 60 * 60 * 1000
  
  // Clear existing signals first
  signalsStore.clearSignals()
  
  console.log('[SeedData] Seeding demo signals for operator:', operatorId)
  
  // Seed contact requests (some accepted, some pending)
  DEMO_CONTACTS.forEach((contact, index) => {
    const requestTs = baseTs - (5 - index) * hour
    
    // Outbound contact request
    const outboundRequest: SignalEvent = {
      id: `contact_request_out_${contact.id}`,
      class: 'contact',
      topicType: 'CONTACT',
      direction: 'outbound',
      actors: { from: operatorId, to: contact.id },
      payload: { handle: contact.handle, name: contact.name },
      ts: requestTs,
      status: 'onchain',
      seen: true,
      type: 'CONTACT_REQUEST'
    }
    signalsStore.add(outboundRequest)
    
    // Accept responses for first 3 contacts (bonded)
    if (index < 3) {
      const acceptTs = requestTs + 30 * 60 * 1000 // 30 minutes later
      const acceptance: SignalEvent = {
        id: `contact_accept_${contact.id}`,
        class: 'contact', 
        topicType: 'CONTACT',
        direction: 'inbound',
        actors: { from: contact.id, to: operatorId },
        payload: { 
          requestHash: `hash_${contact.id}`,
          handle: `${operatorId.slice(-4)}`,
          name: 'Demo User'
        },
        ts: acceptTs,
        status: 'onchain',
        seen: true,
        type: 'CONTACT_ACCEPT'
      }
      signalsStore.add(acceptance)
    }
  })
  
  // Seed trust allocations to bonded contacts
  const bondedContacts = DEMO_CONTACTS.slice(0, 3)
  bondedContacts.forEach((contact, index) => {
    const trustTs = baseTs - (2 - index) * hour
    const trustAllocation: SignalEvent = {
      id: `trust_allocate_${contact.id}`,
      class: 'trust',
      topicType: 'TRUST', 
      direction: 'outbound',
      actors: { from: operatorId, to: contact.id },
      payload: { weight: index + 1 }, // weights 1, 2, 3
      ts: trustTs,
      status: 'onchain',
      seen: true,
      type: 'TRUST_ALLOCATE'
    }
    signalsStore.add(trustAllocation)
  })
  
  // Seed some inbound trust allocations
  bondedContacts.slice(0, 2).forEach((contact, index) => {
    const inboundTrustTs = baseTs - (1.5 - index * 0.5) * hour
    const inboundTrust: SignalEvent = {
      id: `trust_inbound_${contact.id}`,
      class: 'trust',
      topicType: 'TRUST',
      direction: 'inbound', 
      actors: { from: contact.id, to: operatorId },
      payload: { weight: 2 },
      ts: inboundTrustTs,
      status: 'onchain',
      seen: true,
      type: 'TRUST_ALLOCATE'
    }
    signalsStore.add(inboundTrust)
  })
  
  // Add some recent activity (last 30 minutes)
  const recentTs = baseTs - 30 * 60 * 1000
  
  // Recent contact request from new person
  const recentContact: SignalEvent = {
    id: `contact_request_recent`,
    class: 'contact',
    topicType: 'CONTACT', 
    direction: 'inbound',
    actors: { from: '0.0.9876543', to: operatorId },
    payload: { handle: 'frank_new', name: 'Frank Wilson' },
    ts: recentTs,
    status: 'onchain',
    seen: false,
    type: 'CONTACT_REQUEST'
  }
  signalsStore.add(recentContact)
  
  // Very recent trust allocation (5 minutes ago)
  const veryRecentTs = baseTs - 5 * 60 * 1000
  const recentTrust: SignalEvent = {
    id: `trust_very_recent`,
    class: 'trust',
    topicType: 'TRUST',
    direction: 'outbound',
    actors: { from: operatorId, to: DEMO_CONTACTS[0].id },
    payload: { weight: 1 },
    ts: veryRecentTs,
    status: 'local', // Still pending on-chain
    seen: false,
    type: 'TRUST_ALLOCATE'
  }
  signalsStore.add(recentTrust)
  
  console.log('[SeedData] Seeded signals:', {
    contacts: DEMO_CONTACTS.length * 2 + 1, // requests + accepts + 1 recent
    trustAllocations: bondedContacts.length + 2 + 1, // outbound + inbound + recent
    total: signalsStore.getAllSignals().length
  })
  
  // Update status of very recent trust to onchain after 2 seconds (simulate processing)
  setTimeout(() => {
    signalsStore.updateSignalStatus(recentTrust.id, 'onchain')
    console.log('[SeedData] Updated recent trust allocation to onchain status')
  }, 2000)
}

export function clearDemoData() {
  signalsStore.clearSignals()
  console.log('[SeedData] Cleared all demo signals')
}