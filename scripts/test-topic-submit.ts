/**
 * Test topic message submission to existing topics
 */

require('dotenv').config({ path: '.env.local' })
const { Client, PrivateKey, TopicMessageSubmitTransaction } = require('@hashgraph/sdk')

async function testTopicSubmit() {
  const operatorId = process.env.HEDERA_OPERATOR_ID
  const operatorKey = process.env.HEDERA_OPERATOR_KEY
  const network = process.env.HEDERA_NETWORK ?? 'testnet'
  
  // Use our existing recognition topic
  const testTopicId = process.env.NEXT_PUBLIC_TOPIC_RECOGNITION || '0.0.6895261'
  
  console.log(`Testing message submission to topic: ${testTopicId}`)
  console.log(`Using operator: ${operatorId}`)
  
  const client = Client.forName(network)
  const privateKey = PrivateKey.fromString(operatorKey)
  
  client.setOperator(operatorId, privateKey)
  
  const testMessage = JSON.stringify({
    type: 'TEST_MESSAGE',
    from: operatorId,
    timestamp: Math.floor(Date.now() / 1000),
    message: 'Testing server-side topic submission'
  })
  
  console.log(`Message: ${testMessage}`)
  
  try {
    console.log('Submitting message to topic...')
    
    const tx = await new TopicMessageSubmitTransaction()
      .setTopicId(testTopicId)
      .setMessage(testMessage)
      .execute(client)
      
    const receipt = await tx.getReceipt(client)
    
    console.log(`✅ Message submitted successfully!`)
    console.log(`  Transaction ID: ${tx.transactionId}`)
    console.log(`  Consensus Timestamp: ${receipt.consensusTimestamp}`)
    console.log(`  Topic Sequence Number: ${receipt.topicSequenceNumber}`)
    
  } catch (error: any) {
    console.error(`❌ Topic submission failed:`, error.message)
    console.error('Status:', error.status)
  }
  
  client.close()
}

if (require.main === module) {
  testTopicSubmit().catch(console.error)
}

module.exports = { testTopicSubmit }