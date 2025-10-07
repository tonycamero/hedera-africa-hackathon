import { signalsStore, type SignalEvent } from './stores/signalsStore'

// Enhanced professional demo personas for hackathon
const DEMO_CONTACTS = [
  { 
    id: '0.0.1234567', 
    name: 'Maya Patel', 
    handle: 'maya_fintech',
    role: 'FinTech Lead',
    company: 'Hedera Labs',
    bio: 'Building the future of decentralized finance in Africa',
    skills: ['DeFi', 'Smart Contracts', 'Financial Innovation'],
    location: 'Lagos, Nigeria'
  },
  { 
    id: '0.0.2345678', 
    name: 'Jordan Kim', 
    handle: 'jordan_blockchain',
    role: 'Blockchain Architect',
    company: 'African Dev Corp',
    bio: 'Scaling Web3 infrastructure across emerging markets',
    skills: ['HCS', 'Consensus', 'Distributed Systems'],
    location: 'Cape Town, South Africa'
  },
  { 
    id: '0.0.3456789', 
    name: 'Amara Okafor', 
    handle: 'amara_impact',
    role: 'Impact Investor',
    company: 'Pan-African Ventures',
    bio: 'Investing in technology that drives economic inclusion',
    skills: ['Impact Investing', 'Market Development', 'Social Innovation'],
    location: 'Accra, Ghana'
  },
  { 
    id: '0.0.4567890', 
    name: 'Kwame Asante', 
    handle: 'kwame_ecosystems',
    role: 'Ecosystem Builder',
    company: 'AfriTech Hub',
    bio: 'Connecting entrepreneurs across the African tech ecosystem',
    skills: ['Community Building', 'Partnership Development', 'Mentorship'],
    location: 'Nairobi, Kenya'
  },
  { 
    id: '0.0.5678901', 
    name: 'Zara Mohammed', 
    handle: 'zara_research',
    role: 'Research Scientist',
    company: 'University of Cairo',
    bio: 'Researching computational trust and reputation systems',
    skills: ['Machine Learning', 'Trust Networks', 'Academic Research'],
    location: 'Cairo, Egypt'
  }
]

// Achievement/Recognition templates for hackathon demo
const DEMO_ACHIEVEMENTS = [
  {
    label: 'Ecosystem Pioneer',
    category: 'professional',
    emoji: '🚀',
    description: 'Early adopter of Hedera technology in African markets',
    rarity: 'epic',
    xp: 50,
    issuer: 'Hedera Africa Hackathon'
  },
  {
    label: 'Trust Builder',
    category: 'social',
    emoji: '🤝',
    description: 'Established trusted relationships across multiple networks',
    rarity: 'rare',
    xp: 25,
    issuer: 'TrustMesh Network'
  },
  {
    label: 'Community Leader',
    category: 'community',
    emoji: '🌟',
    description: 'Mentored 10+ developers in the African tech ecosystem',
    rarity: 'rare',
    xp: 30,
    issuer: 'AfriTech Collective'
  },
  {
    label: 'Innovation Champion',
    category: 'academic',
    emoji: '💡',
    description: 'Published research on decentralized trust systems',
    rarity: 'legendary',
    xp: 75,
    issuer: 'Academic Consortium'
  },
  {
    label: 'First Adopter',
    category: 'special',
    emoji: '⭐',
    description: 'Among the first 100 users on TrustMesh',
    rarity: 'legendary',
    xp: 100,
    issuer: 'TrustMesh Genesis'
  }
]

export function seedDemoSignals(operatorId: string) {
  const baseTs = Date.now()
  const hour = 60 * 60 * 1000
  
  // Clear existing signals first
  signalsStore.clearSignals()
  
  console.log('[SeedData] Seeding enhanced demo network for operator:', operatorId)
  
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
      payload: { 
        handle: contact.handle, 
        name: contact.name,
        role: contact.role,
        company: contact.company,
        bio: contact.bio,
        skills: contact.skills,
        location: contact.location,
        source: 'hedera_africa_hackathon'
      },
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
  
  // Seed achievement/recognition signals
  console.log('[SeedData] Adding achievement signals...')
  DEMO_ACHIEVEMENTS.forEach((achievement, index) => {
    const achievementTs = baseTs - (10 - index) * hour // Spread over last 10 hours
    const recognitionSignal: SignalEvent = {
      id: `recognition_${achievement.label.replace(/\s/g, '_').toLowerCase()}_${index}`,
      class: 'recognition',
      topicType: 'RECOGNITION',
      direction: 'inbound', // Received by operator
      actors: { from: DEMO_CONTACTS[index % DEMO_CONTACTS.length].id, to: operatorId },
      payload: {
        label: achievement.label,
        category: achievement.category,
        description: achievement.description,
        rarity: achievement.rarity,
        xp: achievement.xp,
        issuer: achievement.issuer,
        evidence: `https://hedera-africa-hackathon.dev/evidence/${achievement.label.replace(/\s/g, '-').toLowerCase()}`,
        metadata: {
          consensusTimestamp: new Date(achievementTs).toISOString(),
          hcsTopicId: '0.0.6895261',
          verified: true
        }
      },
      ts: achievementTs,
      status: 'onchain',
      seen: true,
      type: 'RECOGNITION_MINT',
      consensusTimestamp: new Date(achievementTs).toISOString()
    }
    signalsStore.add(recognitionSignal)
  })
  
  // Add some cross-network recognition signals (others recognizing contacts)
  DEMO_CONTACTS.slice(0, 3).forEach((contact, index) => {
    const crossRecognitionTs = baseTs - (6 - index) * hour
    const crossSignal: SignalEvent = {
      id: `cross_recognition_${contact.handle}_${index}`,
      class: 'recognition',
      topicType: 'RECOGNITION',
      direction: 'outbound', // Sent by operator to contact
      actors: { from: operatorId, to: contact.id },
      payload: {
        label: index === 0 ? 'Innovation Partner' : index === 1 ? 'Trusted Advisor' : 'Community Champion',
        category: 'professional',
        description: `Recognized for outstanding contribution to the ${contact.company} ecosystem`,
        rarity: 'rare',
        xp: 20,
        issuer: 'TrustMesh Hackathon Demo',
        evidence: `https://trustmesh.africa/recognition/${contact.handle}`,
        metadata: {
          consensusTimestamp: new Date(crossRecognitionTs).toISOString(),
          hcsTopicId: '0.0.6895261',
          verified: true
        }
      },
      ts: crossRecognitionTs,
      status: 'onchain',
      seen: true,
      type: 'RECOGNITION_MINT',
      consensusTimestamp: new Date(crossRecognitionTs).toISOString()
    }
    signalsStore.add(crossSignal)
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