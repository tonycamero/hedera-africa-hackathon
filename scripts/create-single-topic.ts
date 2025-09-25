/**
 * Simple test to create a single HCS topic
 */

require('dotenv').config({ path: '.env.local' })
const { Client, PrivateKey, TopicCreateTransaction } = require('@hashgraph/sdk')

async function createSingleTopic() {
  const operatorId = process.env.HEDERA_OPERATOR_ID
  const operatorKey = process.env.HEDERA_OPERATOR_KEY
  const network = process.env.HEDERA_NETWORK ?? 'testnet'
  
  console.log(`Creating topic with operator: ${operatorId}`)
  
  const client = Client.forName(network)
  const privateKey = PrivateKey.fromString(operatorKey)
  const publicKey = privateKey.publicKey
  
  client.setOperator(operatorId, privateKey)
  
  console.log(`Public key: ${publicKey.toString()}`)
  
  try {
    console.log('Creating topic without submit key first...')
    
    // Try creating without submit key first
    const tx1 = await new TopicCreateTransaction()
      .setTopicMemo('TrustMesh Test Topic - No Submit Key')
      .execute(client)
      
    const receipt1 = await tx1.getReceipt(client)
    const topicId1 = receipt1.topicId!.toString()
    console.log(`✅ Topic without submit key: ${topicId1}`)
    
    console.log('Creating topic WITH submit key...')
    
    // Now try with submit key
    const tx2 = await new TopicCreateTransaction()
      .setTopicMemo('TrustMesh Test Topic - With Submit Key')
      .setSubmitKey(publicKey)
      .execute(client)
      
    const receipt2 = await tx2.getReceipt(client)
    const topicId2 = receipt2.topicId!.toString()
    console.log(`✅ Topic with submit key: ${topicId2}`)
    
    console.log('\n🎉 Both topics created successfully!')
    
  } catch (error: any) {
    console.error(`❌ Topic creation failed:`, error.message)
    if (error.status) {
      console.error(`Status: ${error.status}`)
    }
  }
  
  client.close()
}

if (require.main === module) {
  createSingleTopic().catch(console.error)
}

module.exports = { createSingleTopic }