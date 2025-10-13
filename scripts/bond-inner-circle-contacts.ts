#!/usr/bin/env tsx

/**
 * Bond Inner Circle contacts on HCS
 * Creates CONTACT_ACCEPT messages to establish bonded relationships
 * This enables trust allocations to be counted properly
 * Uses HCS-21 enum format for reduced message size
 */

import { buildHcs21 } from '../lib/hcs21/build'

const ALEX_CHEN_ID = 'tm-alex-chen'
const API_BASE = 'http://localhost:3000'

// Contacts that need to be bonded for trust allocations to count
const CONTACTS_TO_BOND = [
  {
    id: 'tm-sekai-mandela',
    handle: 'Sekai Mandela',
    name: 'Sekai Mandela'
  },
  {
    id: 'tm-lisa-crypto', 
    handle: 'Lisa Crypto',
    name: 'Lisa Crypto'
  },
  {
    id: 'tm-boma-nwachukwu',
    handle: 'Boma Nwachukwu', 
    name: 'Boma Nwachukwu'
  },
  {
    id: 'tm-emily-writer',
    handle: 'Emily Writer',
    name: 'Emily Writer'
  },
  {
    id: 'tm-james-startup',
    handle: 'James Startup',
    name: 'James Startup'
  },
  {
    id: 'tm-aisha-diallo',
    handle: 'Aisha Diallo',
    name: 'Aisha Diallo'
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
    console.log(`✅ Contact bonded: ${envelope.type} seq=${result.sequenceNumber}`)
    return true
    
  } catch (error) {
    console.error('❌ Network error:', error)
    return false
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function bondInnerCircleContacts() {
  console.log('🤝 Bonding Inner Circle Contacts on HCS')
  console.log(`👤 Alex Chen: ${ALEX_CHEN_ID}`)
  console.log(`📊 Bonding ${CONTACTS_TO_BOND.length} contacts`)
  console.log()

  let successCount = 0
  let errorCount = 0

  for (const contact of CONTACTS_TO_BOND) {
    try {
      // Create bidirectional bonding:
      // 1. Alex accepts the contact's request (if needed)
      // 2. Contact accepts Alex's request
      
      console.log(`🤝 Bonding with ${contact.handle}...`)
      
      // Alex Chen accepts contact's request (HCS-21 Type 1)
      const alexAcceptEnvelope = buildHcs21('CONTACT_ACCEPT', ALEX_CHEN_ID, ++nonceCounter, {
        target: contact.id,
        acceptedAt: new Date().toISOString(),
        metadata: {
          handle: 'Alex Chen',
          name: contact.name,
          topicId: process.env.NEXT_PUBLIC_TOPIC_CONTACT || '0.0.6896006'
        }
      })

      const alexSuccess = await submitToHCS(alexAcceptEnvelope)
      if (alexSuccess) {
        successCount++
      } else {
        errorCount++
        continue // Skip the reciprocal if Alex's acceptance failed
      }

      await delay(500) // Small delay between related messages
      
      // Contact accepts Alex's request (reciprocal bonding, HCS-21 Type 1)
      const contactAcceptEnvelope = buildHcs21('CONTACT_ACCEPT', contact.id, ++nonceCounter, {
        target: ALEX_CHEN_ID,
        acceptedAt: new Date().toISOString(),
        metadata: {
          handle: contact.handle,
          name: 'Alex Chen',
          topicId: process.env.NEXT_PUBLIC_TOPIC_CONTACT || '0.0.6896006'
        }
      })

      const contactSuccess = await submitToHCS(contactAcceptEnvelope)
      if (contactSuccess) {
        successCount++
      } else {
        errorCount++
      }

      // Delay between different contacts
      await delay(1000)
      
    } catch (error) {
      console.error(`❌ Failed to bond with ${contact.handle}:`, error)
      errorCount++
    }
  }

  console.log()
  console.log('📈 Summary:')
  console.log(`✅ Successful contact bonding messages: ${successCount}`)
  console.log(`❌ Failed messages: ${errorCount}`)
  console.log()
  
  if (successCount > 0) {
    console.log('🎉 Contact bonding messages created on HCS!')
    console.log(`💡 Alex Chen should now show more bonded contacts`)
    console.log('💰 Trust allocations should now be counted properly')
    console.log('🔄 Wait a few seconds for HCS ingestion, then check:')
    console.log('   • http://localhost:3000/api/debug/topic?topic=contacts')
    console.log('   • http://localhost:3000/api/circle')
    console.log('   • Vercel preview deployment')
  } else {
    console.log('💥 No contact bonding messages were successful')
  }
}

// Run the script
bondInnerCircleContacts().catch(error => {
  console.error('💥 Script failed:', error)
  process.exit(1)
})