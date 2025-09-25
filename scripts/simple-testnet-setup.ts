/**
 * Simple testnet setup - create account with minimal configuration
 */

const { Client, PrivateKey, AccountCreateTransaction, Hbar } = require('@hashgraph/sdk')

// Use fresh keys we generated
const newPrivateKey = PrivateKey.fromStringDer('302e020100300506032b6570042204202267a023b942ad57e3d085371cea10ba277593770710ec28515fe72f0160bb94')
const newPublicKey = newPrivateKey.publicKey

console.log('🔐 Fresh Keys Generated:')
console.log(`Private Key: ${newPrivateKey.toStringDer()}`)
console.log(`Public Key: ${newPublicKey.toStringDer()}`)

console.log('\n📋 FOR TESTNET FAUCET:')
console.log('1. Visit: https://portal.hedera.com/faucet')
console.log(`2. Paste Public Key: ${newPublicKey.toStringDer()}`)
console.log('3. Request testnet account creation')
console.log('4. Copy the account ID from the response')
console.log('5. Update .env.local with the new credentials')

console.log('\n⚡ ENVIRONMENT UPDATE:')
console.log('Add these to .env.local:')
console.log(`HEDERA_OPERATOR_ID=0.0.NEW_ACCOUNT_ID_FROM_FAUCET`)
console.log(`HEDERA_OPERATOR_KEY=${newPrivateKey.toStringDer()}`)

console.log('\n✅ Once updated, test with:')
console.log('pnpm ts-node scripts/test-hedera-connection.ts')

// Simple test function that can be used once we have the account ID
async function testNewAccount(accountId: string) {
  console.log(`\n🧪 Testing account ${accountId}...`)
  
  const client = Client.forTestnet().setOperator(accountId, newPrivateKey)
  
  try {
    const { AccountBalanceQuery } = require('@hashgraph/sdk')
    const balance = await new AccountBalanceQuery()
      .setAccountId(accountId)
      .execute(client)
    
    console.log(`✅ Balance: ${balance.hbars.toString()}`)
    
    // Try creating a test topic
    const { TopicCreateTransaction } = require('@hashgraph/sdk')
    const topicTx = await new TopicCreateTransaction()
      .setTopicMemo('TrustMesh Test - Fresh Account')
      .execute(client)
      
    const receipt = await topicTx.getReceipt(client)
    const topicId = receipt.topicId!.toString()
    
    console.log(`✅ Test topic created: ${topicId}`)
    console.log(`🔗 https://hashscan.io/testnet/topic/${topicId}`)
    
    return { success: true, accountId, topicId }
    
  } catch (error: any) {
    console.error(`❌ Test failed: ${error.message}`)
    return { success: false, error: error.message }
  } finally {
    client.close()
  }
}

// Export for potential programmatic use
module.exports = { testNewAccount, newPrivateKey, newPublicKey }