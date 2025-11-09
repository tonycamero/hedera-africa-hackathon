#!/usr/bin/env tsx
/**
 * Seed ONLY the recognition token catalog to new clean HCS topics
 * - No demo contacts
 * - No demo trust allocations  
 * - Schema version v:2
 * - Unique jti per definition
 * - origin:seed marker for easy filtering
 * 
 * Run: pnpm tsx scripts/seed-catalog-only-v2.ts
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// Load the recognition tokens catalog
const catalogPath = path.join(process.cwd(), 'recognition-tokens-clean.json')
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'))

console.log(`🌱 Seeding ${catalog.length} recognition token definitions to clean topics\n`)

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000'
const OPERATOR_ACCOUNT = process.env.HEDERA_OPERATOR_ID || '0.0.5864559'

// Nonce counter (monotonically increasing per session)
let nonce = Math.floor(Date.now() / 1000)

/**
 * Create v2 envelope for catalog definition
 */
function createCatalogEnvelope(token: any) {
  const timestamp = Math.floor(Date.now() / 1000)
  const jti = crypto.randomUUID() // Unique ID for each definition
  
  const envelope = {
    // Envelope metadata (required by HCS submit API)
    type: 'RECOGNITION_DEFINITION',
    from: OPERATOR_ACCOUNT,
    nonce: nonce++,
    ts: timestamp,
    
    // v2 schema payload
    payload: {
      v: 2, // Schema version v2
      t: 'catalog.definition@2', // Type namespace
      jti, // Unique identifier
      aud: 'trustmesh', // Audience filter
      origin: 'seed', // Mark as seed data for filtering
      
      // Catalog definition data
      def: {
        id: token.id,
        name: token.name,
        description: token.description,
        icon: token.icon,
        category: token.category,
        rarity: token.rarity,
      },
      
      // Metadata
      iat: timestamp,
      exp: timestamp + (365 * 24 * 60 * 60), // 1 year validity
    }
  }
  
  return envelope
}

/**
 * Submit envelope to HCS via API
 */
async function submitToHCS(envelope: any): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/hcs/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope)
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error(`❌ Failed (${response.status}): ${error}`)
      return false
    }
    
    const result = await response.json()
    return result.ok === true
  } catch (error) {
    console.error(`❌ Network error:`, error)
    return false
  }
}

/**
 * Main seeding function
 */
async function seedCatalog() {
  let successCount = 0
  let failCount = 0
  
  console.log('📋 Submitting recognition token definitions...\n')
  
  for (const [index, token] of catalog.entries()) {
    const envelope = createCatalogEnvelope(token)
    const progress = `[${index + 1}/${catalog.length}]`
    
    process.stdout.write(`${progress} ${token.name} (${token.id})... `)
    
    const success = await submitToHCS(envelope)
    
    if (success) {
      console.log('✅')
      successCount++
    } else {
      console.log('❌')
      failCount++
    }
    
    // Rate limit: 10 TPS max on Hedera testnet
    await new Promise(resolve => setTimeout(resolve, 150))
  }
  
  console.log('\n' + '='.repeat(60))
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Failed:  ${failCount}`)
  console.log(`📊 Total:   ${catalog.length}`)
  console.log('='.repeat(60))
  
  if (failCount > 0) {
    console.log('\n⚠️  Some definitions failed to submit. Check logs above.')
    process.exit(1)
  } else {
    console.log('\n🎉 All recognition tokens seeded successfully!')
    process.exit(0)
  }
}

// Run if called directly
if (require.main === module) {
  seedCatalog().catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })
}

export { seedCatalog, createCatalogEnvelope }
