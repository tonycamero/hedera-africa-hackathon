#!/usr/bin/env tsx

/**
 * Create Inner Circle trust allocations on HCS
 * This will send TRUST_ALLOCATE signals from tm-alex-chen to select bonded contacts
 * Uses HCS-21 enum format for reduced message size
 */

import { buildHcs21 } from '../lib/hcs21/build'

const ALEX_CHEN_ID = 'tm-alex-chen'
const API_BASE = 'http://localhost:3000'

// Inner circle designations - people Alex Chen trusts
const INNER_CIRCLE_ALLOCATIONS = [
  {
    to: 'tm-sekai-mandela',
    handle: 'Sekai Mandela',
    weight: 1,
    category: 'leadership',
    note: 'Excellent leadership and strategic thinking in community building'
  },
  {
    to: 'tm-lisa-crypto',
    handle: 'Lisa Crypto',
    weight: 1,
    category: 'expertise',
    note: 'Deep crypto knowledge and reliable research insights'
  },
  {
    to: 'tm-boma-nwachukwu', 
    handle: 'Boma Nwachukwu',
    weight: 1,
    category: 'technical',
    note: 'Strong technical skills and problem-solving abilities'
  },
  {
    to: 'tm-emily-writer',
    handle: 'Emily Writer',
    weight: 1,
    category: 'communication',
    note: 'Excellent communication and content creation skills'
  },
  {
    to: 'tm-james-startup',
    handle: 'James Startup',
    weight: 1,
    category: 'business',
    note: 'Great business acumen and startup experience'
  },
  {
    to: 'tm-aisha-diallo',
    handle: 'Aisha Diallo', 
    weight: 1,
    category: 'design',
    note: 'Creative design thinking and user experience expertise'
  }
]

let nonceCounter = Math.floor(Date.now() / 1000) * 1000 // Start with timestamp-based nonce

async function submitToHCS(envelope: any): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/hcs/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(envelope)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`❌ HCS Submit failed (${response.status}):`, error)
      return false
    }

    const result = await response.json()
    console.log(`✅ Trust allocated to ${envelope.payload.target}: seq=${result.sequenceNumber}`)
    return true
    
  } catch (error) {
    console.error('❌ Network error:', error)
    return false
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function createInnerCircleAllocations() {
  console.log('🔥 Creating Inner Circle Trust Allocations on HCS')
  console.log(`👤 From: ${ALEX_CHEN_ID}`)
  console.log(`📊 Allocating trust to ${INNER_CIRCLE_ALLOCATIONS.length} contacts`)
  console.log()

  let successCount = 0
  let errorCount = 0

  for (const allocation of INNER_CIRCLE_ALLOCATIONS) {
    try {
      // HCS-21 format with enum (Type 3 = TRUST_ALLOCATE)
      const envelope = buildHcs21('TRUST_ALLOCATE', ALEX_CHEN_ID, ++nonceCounter, {
        target: allocation.to,
        weight: allocation.weight,
        category: allocation.category,
        note: allocation.note,
        allocatedAt: new Date().toISOString()
      })

      console.log(`🎯 Allocating trust to ${allocation.handle} (${allocation.category})...`)
      
      const success = await submitToHCS(envelope)
      if (success) {
        successCount++
      } else {
        errorCount++
      }

      // Small delay between submissions to avoid rate limiting
      await delay(1000)
      
    } catch (error) {
      console.error(`❌ Failed to allocate trust to ${allocation.handle}:`, error)
      errorCount++
    }
  }

  console.log()
  console.log('📈 Summary:')
  console.log(`✅ Successful trust allocations: ${successCount}`)
  console.log(`❌ Failed allocations: ${errorCount}`)
  console.log()
  
  if (successCount > 0) {
    console.log('🎉 Inner Circle data created on HCS!')
    console.log(`💡 Alex Chen should now show ${successCount}/9 trust allocations`)
    console.log('🔄 Wait a few seconds for HCS ingestion, then check:')
    console.log('   • http://localhost:3000/circle')
    console.log('   • http://localhost:3001/circle (if running)')
    console.log('   • Vercel preview deployment')
  } else {
    console.log('💥 No trust allocations were successful')
  }
}

// Run the script
createInnerCircleAllocations().catch(error => {
  console.error('💥 Script failed:', error)
  process.exit(1)
})