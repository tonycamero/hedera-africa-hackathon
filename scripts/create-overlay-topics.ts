/**
 * Create HCS Topics for Cultural Overlay Catalogs
 * 
 * Creates two new topics:
 * 1. TrustMesh Recognition GenZ Overlay
 * 2. TrustMesh Recognition African Overlay
 * 
 * Usage:
 *   tsx scripts/create-overlay-topics.ts
 * 
 * Requirements:
 *   - HEDERA_OPERATOR_ID in .env.local
 *   - HEDERA_OPERATOR_KEY in .env.local
 */

import { Client, TopicCreateTransaction, PrivateKey } from '@hashgraph/sdk'
import dotenv from 'dotenv'
import path from 'path'

// Load environment
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

interface TopicCreationResult {
  name: string
  topicId: string
  success: boolean
  error?: string
}

async function createOverlayTopics(): Promise<TopicCreationResult[]> {
  const operatorId = process.env.HEDERA_OPERATOR_ID
  const operatorKey = process.env.HEDERA_OPERATOR_KEY
  const network = process.env.HEDERA_NETWORK || 'testnet'

  if (!operatorId || !operatorKey) {
    throw new Error(
      'Missing Hedera credentials. Set HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY in .env.local'
    )
  }

  console.log(`\n📡 Connecting to Hedera ${network}...`)
  console.log(`   Operator: ${operatorId}\n`)

  // Create client
  const client =
    network === 'mainnet'
      ? Client.forMainnet()
      : Client.forTestnet()

  client.setOperator(operatorId, PrivateKey.fromStringDer(operatorKey))

  const results: TopicCreationResult[] = []

  // Topic 1: GenZ Overlay
  console.log('🔨 Creating topic: TrustMesh Recognition GenZ Overlay...')
  try {
    const txGenZ = new TopicCreateTransaction()
      .setTopicMemo('TrustMesh Recognition GenZ Overlay - Cultural variants for GenZ lens')
      .setAdminKey(client.operatorPublicKey!)
      .setSubmitKey(client.operatorPublicKey!)

    const responseGenZ = await txGenZ.execute(client)
    const receiptGenZ = await responseGenZ.getReceipt(client)
    const topicIdGenZ = receiptGenZ.topicId!.toString()

    console.log(`   ✅ Created: ${topicIdGenZ}`)

    results.push({
      name: 'GenZ Overlay',
      topicId: topicIdGenZ,
      success: true
    })
  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message}`)
    results.push({
      name: 'GenZ Overlay',
      topicId: '',
      success: false,
      error: error.message
    })
  }

  // Topic 2: African Overlay
  console.log('\n🔨 Creating topic: TrustMesh Recognition African Overlay...')
  try {
    const txAfrican = new TopicCreateTransaction()
      .setTopicMemo('TrustMesh Recognition African Overlay - Cultural variants for African lens')
      .setAdminKey(client.operatorPublicKey!)
      .setSubmitKey(client.operatorPublicKey!)

    const responseAfrican = await txAfrican.execute(client)
    const receiptAfrican = await responseAfrican.getReceipt(client)
    const topicIdAfrican = receiptAfrican.topicId!.toString()

    console.log(`   ✅ Created: ${topicIdAfrican}`)

    results.push({
      name: 'African Overlay',
      topicId: topicIdAfrican,
      success: true
    })
  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message}`)
    results.push({
      name: 'African Overlay',
      topicId: '',
      success: false,
      error: error.message
    })
  }

  await client.close()

  return results
}

// Main execution
async function main() {
  console.log('╔════════════════════════════════════════════════════╗')
  console.log('║  TrustMesh Cultural Overlay Topic Creation        ║')
  console.log('╚════════════════════════════════════════════════════╝')

  try {
    const results = await createOverlayTopics()

    console.log('\n' + '='.repeat(60))
    console.log('📋 SUMMARY')
    console.log('='.repeat(60))

    const allSuccessful = results.every(r => r.success)

    results.forEach(result => {
      const status = result.success ? '✅' : '❌'
      console.log(`\n${status} ${result.name}`)
      if (result.success) {
        console.log(`   Topic ID: ${result.topicId}`)
      } else {
        console.log(`   Error: ${result.error}`)
      }
    })

    if (allSuccessful) {
      console.log('\n' + '='.repeat(60))
      console.log('📝 NEXT STEPS')
      console.log('='.repeat(60))
      console.log('\n1. Add these to your .env.local:\n')

      const genzTopic = results.find(r => r.name === 'GenZ Overlay')
      const africanTopic = results.find(r => r.name === 'African Overlay')

      console.log(`NEXT_PUBLIC_TOPIC_RECOGNITION_GENZ=${genzTopic?.topicId}`)
      console.log(`NEXT_PUBLIC_TOPIC_RECOGNITION_AFRICAN=${africanTopic?.topicId}`)

      console.log('\n2. Restart your dev server:\n')
      console.log('   pnpm dev')

      console.log('\n3. Verify registry loads correctly:')
      console.log('   Check console for "[Registry] ✅ Validated and froze topic registry"')

      console.log('\n4. Proceed with catalog seeding (see STEP_6_CULTURAL_OVERLAY_DEPLOYMENT.md)')

      console.log('\n' + '='.repeat(60))
      console.log('✅ ALL TOPICS CREATED SUCCESSFULLY')
      console.log('='.repeat(60) + '\n')
    } else {
      console.log('\n' + '='.repeat(60))
      console.log('❌ SOME TOPICS FAILED TO CREATE')
      console.log('='.repeat(60))
      console.log('\nCheck errors above and retry.\n')
      process.exit(1)
    }
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message)
    console.error('\nStack trace:', error.stack)
    process.exit(1)
  }
}

main()
