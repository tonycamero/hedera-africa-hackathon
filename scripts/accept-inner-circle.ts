#!/usr/bin/env tsx

/**
 * Accept Inner Circle trust allocations on HCS
 * This will send TRUST_ACCEPT signals from the contacts back to tm-alex-chen
 */

const ALEX_CHEN_ID = 'tm-alex-chen'
const API_BASE = 'http://localhost:3000'

// Inner circle people who will accept Alex's trust
const INNER_CIRCLE_ACCEPTANCES = [
  {
    from: 'tm-sekai-mandela',
    handle: 'Sekai Mandela'
  },
  {
    from: 'tm-lisa-crypto',
    handle: 'Lisa Crypto'
  },
  {
    from: 'tm-boma-nwachukwu', 
    handle: 'Boma Nwachukwu'
  },
  {
    from: 'tm-emily-writer',
    handle: 'Emily Writer'
  },
  {
    from: 'tm-james-startup',
    handle: 'James Startup'
  },
  {
    from: 'tm-aisha-diallo',
    handle: 'Aisha Diallo'
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
    console.log(`✅ Trust accepted by ${envelope.from}: seq=${result.sequenceNumber}`)
    return true
    
  } catch (error) {
    console.error('❌ Network error:', error)
    return false
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function acceptInnerCircleAllocations() {
  console.log('🤝 Accepting Inner Circle Trust Allocations on HCS')
  console.log(`👤 To: ${ALEX_CHEN_ID}`)
  console.log(`📊 Accepting trust from ${INNER_CIRCLE_ACCEPTANCES.length} contacts`)
  console.log()

  let successCount = 0
  let errorCount = 0

  for (const acceptance of INNER_CIRCLE_ACCEPTANCES) {
    try {
      const envelope = {
        type: 'TRUST_ACCEPT',
        from: acceptance.from,
        nonce: ++nonceCounter, // Monotonic increasing nonce
        ts: Math.floor(Date.now() / 1000), // Unix timestamp
        payload: {
          actor: acceptance.from,
          target: ALEX_CHEN_ID,
          acceptedAt: new Date().toISOString(),
          weight: 1 // Accepting the 1 trust unit allocated
        }
      }

      console.log(`🤝 ${acceptance.handle} accepting Alex's trust...`)
      
      const success = await submitToHCS(envelope)
      if (success) {
        successCount++
      } else {
        errorCount++
      }

      // Small delay between submissions to avoid rate limiting
      await delay(1000)
      
    } catch (error) {
      console.error(`❌ Failed for ${acceptance.handle}:`, error)
      errorCount++
    }
  }

  console.log()
  console.log('📈 Summary:')
  console.log(`✅ Successful trust acceptances: ${successCount}`)
  console.log(`❌ Failed acceptances: ${errorCount}`)
  console.log()
  
  if (successCount > 0) {
    console.log('🎉 Inner Circle acceptances created on HCS!')
    console.log(`💡 Alex Chen should now show ${successCount}/9 ACTIVE trust allocations`)
    console.log('🔄 Wait a few seconds for HCS ingestion, then check:')
    console.log('   • http://localhost:3000/circle')
    console.log('   • http://localhost:3001/circle (if running)')
    console.log('   • Vercel preview deployment')
  } else {
    console.log('💥 No trust acceptances were successful')
  }
}

// Run the script
acceptInnerCircleAllocations().catch(error => {
  console.error('💥 Script failed:', error)
  process.exit(1)
})