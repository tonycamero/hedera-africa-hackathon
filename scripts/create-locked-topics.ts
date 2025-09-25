/**
 * Script to create locked HCS topics for secure server-side submission
 * Topics will have submit keys set to our operator account public key
 */

require('dotenv').config({ path: '.env.local' })
const { Client, PrivateKey, TopicCreateTransaction } = require('@hashgraph/sdk')

function mustGet(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

async function createLockedTopics() {
  const operatorId = mustGet('HEDERA_OPERATOR_ID')
  const operatorKey = mustGet('HEDERA_OPERATOR_KEY')
  const network = process.env.HEDERA_NETWORK ?? 'testnet'
  
  const client = Client.forName(network)
  const privateKey = PrivateKey.fromString(operatorKey)
  const publicKey = privateKey.publicKey
  
  client.setOperator(operatorId, privateKey)
  
  console.log(`Creating locked topics with operator ${operatorId}`)
  console.log(`Public key: ${publicKey.toString()}`)
  console.log(`Network: ${network}`)
  
  const topics = [
    { name: 'PROFILE', memo: 'TrustMesh Profile Updates' },
    { name: 'CONTACT', memo: 'TrustMesh Contact Requests' },
    { name: 'TRUST', memo: 'TrustMesh Trust Allocations' },
    { name: 'SIGNAL', memo: 'TrustMesh Signal Feed' },
    { name: 'RECOGNITION', memo: 'TrustMesh Recognition Minting' },
  ]
  
  const results: Record<string, string> = {}
  
  for (const topic of topics) {
    console.log(`\nCreating ${topic.name} topic...`)
    
    try {
      const tx = await new TopicCreateTransaction()
        .setTopicMemo(topic.memo)
        .setSubmitKey(publicKey) // Lock topic to our operator key
        .execute(client)
        
      const receipt = await tx.getReceipt(client)
      const topicId = receipt.topicId!.toString()
      
      results[topic.name] = topicId
      console.log(`✅ ${topic.name}: ${topicId}`)
      
    } catch (error: any) {
      console.error(`❌ Failed to create ${topic.name} topic:`, error.message)
    }
  }
  
  console.log('\n🎉 Topic creation complete!')
  console.log('\n📝 Environment variables to update:')
  
  for (const [name, topicId] of Object.entries(results)) {
    console.log(`NEXT_PUBLIC_TOPIC_${name}=${topicId}`)
  }
  
  client.close()
}

if (require.main === module) {
  createLockedTopics().catch(console.error)
}

module.exports = { createLockedTopics }
