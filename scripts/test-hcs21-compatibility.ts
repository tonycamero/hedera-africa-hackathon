#!/usr/bin/env tsx

/**
 * Test HCS-21 backward compatibility
 * Verifies both legacy and HCS-21 messages are processed correctly
 */

import { normalizeHcsMessage } from '../lib/ingest/normalizers'
import { buildHcs21 } from '../lib/hcs21/build'

function testMessageProcessing() {
  console.log('🧪 Testing HCS-21 Backward Compatibility\n')

  // Test 1: Legacy message format
  const legacyMessage = {
    topic_id: '0.0.6896005',
    sequence_number: 123,
    consensus_timestamp: '1760324000.123456000',
    message: Buffer.from(JSON.stringify({
      type: 'TRUST_ALLOCATE',
      from: 'tm-alice',
      nonce: 1001,
      ts: 1760324000,
      payload: {
        actor: 'tm-alice',
        target: 'tm-bob',
        weight: 1,
        category: 'technical'
      }
    })).toString('base64')
  }

  // Test 2: HCS-21 message format
  const hcs21Envelope = buildHcs21('TRUST_ALLOCATE', 'tm-alice', 1002, {
    target: 'tm-bob',
    weight: 1,
    category: 'technical'
  })

  const hcs21Message = {
    topic_id: '0.0.6896005', 
    sequence_number: 124,
    consensus_timestamp: '1760324001.123456000',
    message: Buffer.from(JSON.stringify(hcs21Envelope)).toString('base64')
  }

  // Process both messages
  const legacyResult = normalizeHcsMessage(legacyMessage, 'hcs')
  const hcs21Result = normalizeHcsMessage(hcs21Message, 'hcs')

  console.log('📨 Legacy Message Result:')
  console.log('  Type:', legacyResult?.type)
  console.log('  Actor:', legacyResult?.actor) 
  console.log('  Target:', legacyResult?.target)
  console.log('  Metadata keys:', Object.keys(legacyResult?.metadata || {}))

  console.log('\n📨 HCS-21 Message Result:')
  console.log('  Type:', hcs21Result?.type)
  console.log('  Actor:', hcs21Result?.actor)
  console.log('  Target:', hcs21Result?.target) 
  console.log('  Metadata keys:', Object.keys(hcs21Result?.metadata || {}))

  // Verify both produce equivalent SignalEvents
  const success = 
    legacyResult?.type === hcs21Result?.type &&
    legacyResult?.actor === hcs21Result?.actor &&
    legacyResult?.target === hcs21Result?.target

  console.log('\n✅ Results:', success ? 'COMPATIBLE' : 'INCOMPATIBLE')
  
  if (success) {
    console.log('🎉 Both message formats produce equivalent SignalEvents!')
    console.log('📦 HCS-21 message is', 
      JSON.stringify(legacyMessage.message).length - JSON.stringify(hcs21Message.message).length,
      'bytes smaller')
  } else {
    console.log('❌ Message processing compatibility issue detected')
  }
}

// Run the test
testMessageProcessing()