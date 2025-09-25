/**
 * Temporary test route for HCS submission using a known open topic
 * This bypasses the account creation issue to test the submit flow
 */

import { NextRequest, NextResponse } from 'next/server'
import { TopicMessageSubmitTransaction, Client, PrivateKey } from '@hashgraph/sdk'

// Use a known open testnet topic that allows submissions from anyone
const OPEN_TEST_TOPIC = '0.0.4736' // This is a well-known open testnet topic

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log(`[Test Submit] Received:`, JSON.stringify(body, null, 2))
    
    // Create client without our problematic operator account
    // We'll try submitting without setting an operator (anonymous)
    const client = Client.forTestnet()
    
    const testMessage = JSON.stringify({
      ...body,
      timestamp: Math.floor(Date.now() / 1000),
      test: true,
      note: 'Test message from TrustMesh server'
    })
    
    console.log(`[Test Submit] Submitting to open topic ${OPEN_TEST_TOPIC}:`, testMessage)
    
    // Try anonymous submission (no operator set)
    const tx = new TopicMessageSubmitTransaction()
      .setTopicId(OPEN_TEST_TOPIC)
      .setMessage(testMessage)
    
    // Execute without operator (should work for open topics)
    const response = await tx.execute(client)
    const receipt = await response.getReceipt(client)
    
    console.log(`[Test Submit] Success!`)
    console.log(`  Transaction ID: ${response.transactionId}`)
    console.log(`  Consensus Timestamp: ${receipt.consensusTimestamp}`)
    console.log(`  Sequence Number: ${receipt.topicSequenceNumber}`)
    
    client.close()
    
    return NextResponse.json({ 
      ok: true,
      test: true,
      topicId: OPEN_TEST_TOPIC,
      transactionId: response.transactionId.toString(),
      consensusTimestamp: receipt.consensusTimestamp?.toString(),
      sequenceNumber: receipt.topicSequenceNumber?.toNumber(),
      message: 'Test submission to open topic successful'
    })
    
  } catch (error: any) {
    console.error(`[Test Submit] Error:`, error.message)
    return NextResponse.json({ 
      ok: false, 
      test: true,
      error: error.message,
      suggestion: 'This was a test submission to an open topic'
    }, { status: 400 })
  }
}