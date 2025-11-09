#!/usr/bin/env tsx
/**
 * Create new clean HCS topics for TrustMesh migration
 * Run: pnpm tsx scripts/create-clean-topics.ts
 */

import { 
  Client, 
  TopicCreateTransaction, 
  PrivateKey, 
  AccountId 
} from '@hashgraph/sdk'

async function createCleanTopics() {
  console.log('🚀 Creating new clean HCS topics...\n')

  // Load credentials from environment
  const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!)
  const operatorKey = PrivateKey.fromStringED25519(process.env.HEDERA_OPERATOR_KEY!)
  
  const client = Client.forTestnet()
  client.setOperator(operatorId, operatorKey)

  const topics = {
    contact: { memo: 'TrustMesh Contact Exchange - Clean v2', submitKey: true },
    trust: { memo: 'TrustMesh Trust Allocation - Clean v2', submitKey: true },
    recognition: { memo: 'TrustMesh Recognition Catalog - Clean v2', submitKey: true },
    profile: { memo: 'TrustMesh User Profiles - Clean v2', submitKey: true },
  }

  const results: Record<string, string> = {}

  for (const [name, config] of Object.entries(topics)) {
    try {
      let txn = new TopicCreateTransaction()
        .setTopicMemo(config.memo)
        .setAdminKey(operatorKey)

      if (config.submitKey) {
        txn = txn.setSubmitKey(operatorKey)
      }

      const txnResponse = await txn.execute(client)
      const receipt = await txnResponse.getReceipt(client)
      const topicId = receipt.topicId!.toString()
      
      results[name] = topicId
      console.log(`✅ ${name.toUpperCase()}: ${topicId}`)
    } catch (error) {
      console.error(`❌ Failed to create ${name} topic:`, error)
      throw error
    }
  }

  console.log('\n📋 Topic Migration Reference:\n')
  console.log('OLD TOPICS → NEW TOPICS')
  console.log('=======================')
  console.log(`CONTACT:      0.0.6896006 → ${results.contact}`)
  console.log(`TRUST:        0.0.6896005 → ${results.trust}`)
  console.log(`RECOGNITION:  0.0.6895261 → ${results.recognition}`)
  console.log(`PROFILE:      0.0.6896008 → ${results.profile}`)
  
  console.log('\n📝 Update these in your .env.local:\n')
  console.log('# New Clean Topics (v2)')
  console.log(`TOPIC_CONTACT=${results.contact}`)
  console.log(`TOPIC_TRUST=${results.trust}`)
  console.log(`TOPIC_SIGNAL=${results.recognition}`)
  console.log(`TOPIC_RECOGNITION=${results.recognition}`)
  console.log(`TOPIC_PROFILE=${results.profile}`)
  console.log(`NEXT_PUBLIC_TOPIC_CONTACT=${results.contact}`)
  console.log(`NEXT_PUBLIC_TOPIC_TRUST=${results.trust}`)
  console.log(`NEXT_PUBLIC_TOPIC_SIGNAL=${results.recognition}`)
  console.log(`NEXT_PUBLIC_TOPIC_RECOGNITION=${results.recognition}`)
  console.log(`NEXT_PUBLIC_TOPIC_PROFILE=${results.profile}`)
  console.log(`NEXT_PUBLIC_HCS_RECOGNITION_TOPIC=${results.recognition}`)
  console.log(`NEXT_PUBLIC_PROFILE_TOPIC_ID=${results.profile}`)

  client.close()
  return results
}

// Run if called directly
if (require.main === module) {
  createCleanTopics()
    .then(() => {
      console.log('\n✅ All topics created successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Error creating topics:', error)
      process.exit(1)
    })
}

export { createCleanTopics }
