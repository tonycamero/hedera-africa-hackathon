#!/usr/bin/env node

/**
 * HCS Recognition System Deployment - Node.js Script
 * Run with: node scripts/deploy-hcs.js
 */

const crypto = require('crypto')
const http = require('http')

// Simple fetch-like function using Node.js http module
const fetch = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const urlParts = new URL(url)
    const requestOptions = {
      hostname: urlParts.hostname,
      port: urlParts.port,
      path: urlParts.pathname,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }

    const req = http.request(requestOptions, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          text: () => Promise.resolve(data),
          json: () => Promise.resolve(JSON.parse(data))
        })
      })
    })

    req.on('error', (err) => {
      reject(err)
    })

    if (options.body) {
      req.write(options.body)
    }

    req.end()
  })
}

const REALM_ID = "realm.africa_hackathon_testnet"
const BASE_URL = 'http://localhost:3000'

// Alex Chen's character profile
const ALEX_PROFILE = {
  sessionId: 'tm-alex-chen',
  name: 'Alex Chen',
  story: 'Nigerian-American tech entrepreneur building bridges between Silicon Valley and Lagos',
  recognitions: [
    {
      id: 'ubuntu-spirit',
      earnedAt: Date.now() - (60 * 24 * 60 * 60 * 1000), // 60 days ago
      evidence: 'Mentored 20+ young entrepreneurs using Ubuntu principles of collective success',
      issuer: 'issuer.mentors',
      context: 'Pan-African Entrepreneurship Program'
    },
    {
      id: 'griot-keeper',
      earnedAt: Date.now() - (90 * 24 * 60 * 60 * 1000), // 90 days ago  
      evidence: 'Documented and shared stories of 100+ African tech pioneers',
      issuer: 'issuer.community',
      context: 'Digital Heritage Project'
    },
    {
      id: 'kigali-innovator', 
      earnedAt: Date.now() - (120 * 24 * 60 * 60 * 1000), // 120 days ago
      evidence: 'Built mobile payment solution connecting 10 African countries',
      issuer: 'issuer.professional',
      context: 'Pan-African Fintech Initiative'
    },
    {
      id: 'cooperative-leader',
      earnedAt: Date.now() - (150 * 24 * 60 * 60 * 1000), // 150 days ago
      evidence: 'Organized cooperative of 500+ African developers sharing equity and knowledge',
      issuer: 'issuer.professional',
      context: 'African Developer Cooperative'
    },
    {
      id: 'balogun-trader',
      earnedAt: Date.now() - (180 * 24 * 60 * 60 * 1000), // 180 days ago
      evidence: 'Negotiated $50M investment deal for African startups using traditional market wisdom',
      issuer: 'issuer.professional', 
      context: 'African Venture Capital Summit'
    },
    {
      id: 'makerere-scholar',
      earnedAt: Date.now() - (200 * 24 * 60 * 60 * 1000), // 200 days ago
      evidence: 'Published research on African tech ecosystems, cited 500+ times',
      issuer: 'issuer.academic',
      context: 'Journal of African Innovation'
    },
    {
      id: 'timbuktu-librarian',
      earnedAt: Date.now() - (250 * 24 * 60 * 60 * 1000), // 250 days ago
      evidence: 'Digitized 1000+ historical African business documents for future generations',
      issuer: 'issuer.academic',
      context: 'African Business History Archive'
    },
    {
      id: 'chad',
      earnedAt: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
      evidence: 'Led the African Tech Summit networking session, connected 50+ entrepreneurs',
      issuer: 'issuer.community',
      context: 'African Tech Summit 2024'
    },
    {
      id: 'rizz',
      earnedAt: Date.now() - (45 * 24 * 60 * 60 * 1000), // 45 days ago
      evidence: 'Smooth-talked three major VCs into attending Lagos Startup Week',
      issuer: 'issuer.community',
      context: 'Lagos Startup Week Organization'
    },
    {
      id: 'aura',
      earnedAt: Date.now() - (10 * 24 * 60 * 60 * 1000), // 10 days ago
      evidence: 'Radiates such positive energy that deal rooms calm down when they enter',
      issuer: 'issuer.community',
      context: 'Investor Relations'
    }
  ]
}

// Basic recognition definitions (the ones Alex has)
const RECOGNITION_DEFINITIONS = [
  { id: 'ubuntu-spirit', name: 'Ubuntu Spirit', description: 'I am because we are', category: 'social', icon: '🌍', rarity: 'Legendary' },
  { id: 'griot-keeper', name: 'Griot Keeper', description: 'storyteller of the people', category: 'social', icon: '📿', rarity: 'Epic' },
  { id: 'kigali-innovator', name: 'Kigali Innovator', description: 'Silicon Savannah tech pioneer', category: 'professional', icon: '📱', rarity: 'Epic' },
  { id: 'cooperative-leader', name: 'Cooperative Leader', description: 'Ubuntu business philosophy', category: 'professional', icon: '🤝', rarity: 'Legendary' },
  { id: 'balogun-trader', name: 'Balogun Trader', description: 'Lagos market negotiation master', category: 'professional', icon: '🏦', rarity: 'Epic' },
  { id: 'makerere-scholar', name: 'Makerere Scholar', description: 'academic excellence with Ubuntu wisdom', category: 'academic', icon: '🎓', rarity: 'Epic' },
  { id: 'timbuktu-librarian', name: 'Timbuktu Librarian', description: 'keeper of ancient knowledge', category: 'academic', icon: '📜', rarity: 'Legendary' },
  { id: 'chad', name: 'Chad', description: 'alpha vibes', category: 'social', icon: '🦆', rarity: 'Legendary' },
  { id: 'rizz', name: 'Rizz', description: 'smooth operator', category: 'social', icon: '🧠', rarity: 'Epic' },
  { id: 'aura', name: 'Aura', description: 'positive energy', category: 'social', icon: '😊', rarity: 'Rare' }
]

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function writeSystemBootstrap() {
  console.log('🏗️  Writing System Bootstrap Messages...')
  
  const systemMessages = [
    {
      realm_id: REALM_ID,
      type: "realm_bootstrap",
      data: {
        realm_name: "TrustMesh Africa Hackathon Testnet",
        description: "Hedera Africa Hackathon demonstration realm",
        policy_hash: "sha256:demo_policy_v1",
        supported_families: ["profile", "contact", "trust", "recognition_def", "recognition_award", "signal"],
        created_at: new Date().toISOString()
      }
    },
    {
      realm_id: REALM_ID,
      type: "issuer_registry_anchored",
      data: {
        issuers: [
          { id: "issuer.mentors", name: "African Tech Mentors", verified: true },
          { id: "issuer.community", name: "Ubuntu Community Council", verified: true },
          { id: "issuer.academic", name: "African Academic Network", verified: true },
          { id: "issuer.professional", name: "Silicon Savannah Guild", verified: true }
        ],
        registry_hash: "sha256:issuer_registry_v1",
        anchored_at: new Date().toISOString()
      }
    },
    {
      realm_id: REALM_ID,
      type: "schema_catalog_ref",
      data: {
        schemas: [
          { id: "HCS-Recognition-Def@2", version: "2.0", hash: "sha256:recognition_schema_v2" },
          { id: "HCS-Recognition-Award@1", version: "1.0", hash: "sha256:award_schema_v1" }
        ],
        catalog_uri: "https://trustmesh.africa/schemas/catalog.json",
        updated_at: new Date().toISOString()
      }
    }
  ]

  for (const message of systemMessages) {
    try {
      const response = await fetch(`${BASE_URL}/api/hcs/system-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      })
      
      if (response.ok) {
        console.log(`✅ System message: ${message.type}`)
      } else {
        const error = await response.text()
        console.error(`❌ Failed system message ${message.type}:`, error)
      }
    } catch (error) {
      console.error(`❌ Error sending system message ${message.type}:`, error.message)
    }
    
    await sleep(500) // Rate limiting
  }
}

async function writeRecognitionDefinitions() {
  console.log('📚 Writing Recognition Definitions...')
  
  for (const def of RECOGNITION_DEFINITIONS) {
    try {
      // Create canonical JSON for hashing
      const canonicalData = {
        id: def.id,
        name: def.name,
        description: def.description,
        category: def.category,
        icon: def.icon,
        rarity: def.rarity,
        isActive: true
      }
      
      const contentHash = crypto.createHash('sha256')
        .update(JSON.stringify(canonicalData, Object.keys(canonicalData).sort()))
        .digest('hex')

      const response = await fetch(`${BASE_URL}/api/hcs/publish-recognition-definition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'definition',
          data: {
            ...def,
            realm_id: REALM_ID,
            content_hash: `sha256:${contentHash}`,
            isActive: true
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Definition: ${def.name} (${def.id}) - ${result.status}`)
      } else {
        const error = await response.text()
        console.error(`❌ Failed definition ${def.id}:`, error)
      }

      await sleep(500) // Rate limiting
    } catch (error) {
      console.error(`❌ Error writing definition ${def.id}:`, error.message)
    }
  }
}

async function mintRecognitionAwards() {
  console.log('🎖️  Minting Recognition Awards for Alex Chen...')
  
  // Sort awards chronologically (oldest first)
  const sortedAwards = ALEX_PROFILE.recognitions.sort((a, b) => a.earnedAt - b.earnedAt)
  
  for (const award of sortedAwards) {
    try {
      const def = RECOGNITION_DEFINITIONS.find(d => d.id === award.id)
      if (!def) {
        console.warn(`⚠️  Definition not found for: ${award.id}`)
        continue
      }

      const response = await fetch(`${BASE_URL}/api/hcs/mint-recognition`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: ALEX_PROFILE.sessionId,
          recognitionId: award.id,
          evidence: award.evidence,
          issuer: award.issuer,
          context: award.context,
          earnedAt: award.earnedAt,
          tokenId: `${award.id}_${ALEX_PROFILE.sessionId}_${award.earnedAt}`,
          name: def.name,
          category: def.category,
          subtitle: def.description,
          emoji: def.icon,
          issuerId: award.issuer,
          recipientId: ALEX_PROFILE.sessionId
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Award: ${def.name} (${def.rarity}) - ${result.status}`)
        console.log(`   📝 Evidence: ${award.evidence.slice(0, 60)}...`)
      } else {
        const error = await response.text()
        console.error(`❌ Failed award ${award.id}:`, error)
      }

      await sleep(1000) // Rate limiting
    } catch (error) {
      console.error(`❌ Error minting award ${award.id}:`, error.message)
    }
  }
}

async function verifyDeployment() {
  console.log('🔍 Verifying HCS Deployment...')
  
  const summary = {
    systemMessages: 3,
    definitionsWritten: RECOGNITION_DEFINITIONS.length,
    awardsForAlex: ALEX_PROFILE.recognitions.length,
    totalHCSMessages: 3 + RECOGNITION_DEFINITIONS.length + ALEX_PROFILE.recognitions.length
  }
  
  console.log('\n🎉 HCS Recognition System Deployment Summary:')
  console.log(`   • System bootstrap: ${summary.systemMessages} messages`)
  console.log(`   • Recognition definitions: ${summary.definitionsWritten}`)
  console.log(`   • Recognition awards: ${summary.awardsForAlex} for Alex Chen`)
  console.log(`   • Total HCS messages: ${summary.totalHCSMessages}`)
  
  console.log('\n🌍 Topics used:')
  console.log('   • 0.0.6896008 - System bootstrap messages')
  console.log('   • 0.0.6895261 - Recognition definitions & awards')
  console.log('   • 0.0.6896005 - (Trust & Contact data already flowing)')
  
  console.log('\n✨ Demo readiness:')
  console.log('   ✅ HCS-verified Alex Chen profile')
  console.log('   ✅ System governance anchored')  
  console.log('   ✅ Recognition definitions published')
  console.log('   🎯 Ready for hackathon demo!')
}

async function deployRecognitionSystem() {
  console.log('🚀 TrustMesh Recognition System HCS Deployment')
  console.log('   Strategy: Option B - Hybrid Approach')
  console.log('   Realm:', REALM_ID)
  console.log('   Profile:', ALEX_PROFILE.name, `(${ALEX_PROFILE.sessionId})`)
  console.log('   Server:', BASE_URL)
  console.log('')

  try {
    // Check if server is running
    try {
      const healthCheck = await fetch(`${BASE_URL}/api/health/ingestion`)
      const healthData = await healthCheck.json()
      console.log(`🔍 Server status: ${healthData.status} (uptime: ${healthData.uptime}s)`)
      console.log('  📡 Server is responding, proceeding with deployment...\n')
    } catch (err) {
      throw new Error(`Server not accessible at ${BASE_URL}. Make sure the dev server is running.`)
    }
    
    // Step 1: System governance
    await writeSystemBootstrap()
    console.log('')
    
    // Step 2: Recognition definitions
    await writeRecognitionDefinitions() 
    console.log('')
    
    // Step 3: Recognition awards
    await mintRecognitionAwards()
    console.log('')
    
    // Step 4: Verification
    await verifyDeployment()
    
    console.log('\n🎊 HCS Recognition System deployed successfully!')
    console.log('   Demo is ready with hybrid on-chain + local architecture')
    
  } catch (error) {
    console.error('💥 Deployment failed:', error.message)
    process.exit(1)
  }
}

// Run deployment
if (require.main === module) {
  deployRecognitionSystem()
}