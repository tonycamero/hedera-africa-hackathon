/**
 * Generate fresh Hedera keys and create new account
 * This ensures we have a working key/account pair with no legacy issues
 */

require('dotenv').config({ path: '.env.local' })
const { Client, PrivateKey, AccountCreateTransaction, Hbar } = require('@hashgraph/sdk')

async function generateFreshAccount() {
  console.log('🔐 Generating fresh Hedera account...')
  
  // Use existing account to fund the new one (temporary)
  const fundingId = process.env.HEDERA_OPERATOR_ID
  const fundingKey = process.env.HEDERA_OPERATOR_KEY
  const network = process.env.HEDERA_NETWORK ?? 'testnet'
  
  if (!fundingId || !fundingKey) {
    console.error('❌ Need existing account to fund new one. Set HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY')
    process.exit(1)
  }
  
  // Generate brand new key pair
  console.log('Generating new ED25519 key pair...')
  const newPrivateKey = PrivateKey.generateED25519()
  const newPublicKey = newPrivateKey.publicKey
  
  console.log(`✅ New Private Key (DER): ${newPrivateKey.toStringDer()}`)
  console.log(`✅ New Public Key (DER):  ${newPublicKey.toStringDer()}`)
  
  try {
    // Connect with funding account
    const client = Client.forName(network)
    const fundingPrivateKey = PrivateKey.fromString(fundingKey)
    client.setOperator(fundingId, fundingPrivateKey)
    
    console.log(`\n💰 Using funding account ${fundingId} to create new account...`)
    
    // Create new account with 100 HBAR
    const createTx = await new AccountCreateTransaction()
      .setKey(newPublicKey)
      .setInitialBalance(Hbar.fromTinybars(10000000000)) // 100 HBAR
      .setAccountMemo('TrustMesh HCS Server Account')
      .execute(client)
    
    const receipt = await createTx.getReceipt(client)
    const newAccountId = receipt.accountId!.toString()
    
    console.log(`🎉 New account created: ${newAccountId}`)
    console.log(`💰 Initial balance: 100 HBAR`)
    console.log(`🔗 Explorer: https://hashscan.io/testnet/account/${newAccountId}`)
    
    // Test the new account immediately
    console.log(`\n🧪 Testing new account...`)
    
    const testClient = Client.forName(network)
    testClient.setOperator(newAccountId, newPrivateKey)
    
    // Simple balance query to verify
    const { AccountBalanceQuery } = require('@hashgraph/sdk')
    const balance = await new AccountBalanceQuery()
      .setAccountId(newAccountId)
      .execute(testClient)
    
    console.log(`✅ New account balance verified: ${balance.hbars.toString()}`)
    
    // Test topic creation with new account
    console.log(`\n📝 Testing topic creation with new account...`)
    const { TopicCreateTransaction } = require('@hashgraph/sdk')
    
    const topicTx = await new TopicCreateTransaction()
      .setTopicMemo('Test Topic - Fresh Account')
      .execute(testClient)
    
    const topicReceipt = await topicTx.getReceipt(testClient)
    const testTopicId = topicReceipt.topicId!.toString()
    
    console.log(`✅ Test topic created: ${testTopicId}`)
    console.log(`🔗 Topic explorer: https://hashscan.io/testnet/topic/${testTopicId}`)
    
    // Output environment variables
    console.log(`\n📋 UPDATE YOUR .env.local WITH THESE VALUES:`)
    console.log(`# Fresh Hedera Account (Generated ${new Date().toISOString()})`)
    console.log(`HEDERA_OPERATOR_ID=${newAccountId}`)
    console.log(`HEDERA_OPERATOR_KEY=${newPrivateKey.toStringDer()}`)
    console.log(`\n# Test topic for immediate use:`)
    console.log(`TEST_TOPIC_ID=${testTopicId}`)
    
    client.close()
    testClient.close()
    
    return {
      accountId: newAccountId,
      privateKey: newPrivateKey.toStringDer(),
      publicKey: newPublicKey.toStringDer(),
      testTopicId
    }
    
  } catch (error: any) {
    console.error(`❌ Account creation failed:`, error.message)
    if (error.status) {
      console.error(`Status: ${error.status}`)
    }
    process.exit(1)
  }
}

if (require.main === module) {
  generateFreshAccount().catch(console.error)
}

module.exports = { generateFreshAccount }