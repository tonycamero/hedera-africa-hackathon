/**
 * Check account info to verify account setup
 */

require('dotenv').config({ path: '.env.local' })
const { Client, PrivateKey, AccountInfoQuery } = require('@hashgraph/sdk')

async function checkAccountInfo() {
  const operatorId = process.env.HEDERA_OPERATOR_ID
  const operatorKey = process.env.HEDERA_OPERATOR_KEY
  const network = process.env.HEDERA_NETWORK ?? 'testnet'
  
  console.log(`Checking account info for: ${operatorId}`)
  
  const client = Client.forName(network)
  const privateKey = PrivateKey.fromString(operatorKey)
  const publicKey = privateKey.publicKey
  
  client.setOperator(operatorId, privateKey)
  
  console.log(`Our public key: ${publicKey.toString()}`)
  
  try {
    console.log('Querying account info...')
    
    const accountInfo = await new AccountInfoQuery()
      .setAccountId(operatorId)
      .execute(client)
    
    console.log(`✅ Account info retrieved:`)
    console.log(`  Account ID: ${accountInfo.accountId}`)
    console.log(`  Balance: ${accountInfo.balance.toString()}`)
    console.log(`  Key: ${accountInfo.key?.toString()}`)
    console.log(`  Key matches: ${accountInfo.key?.toString() === publicKey.toString()}`)
    
    if (accountInfo.key?.toString() !== publicKey.toString()) {
      console.log('❌ Key mismatch! The private key does not match the account.')
      console.log(`Expected: ${publicKey.toString()}`)
      console.log(`Actual:   ${accountInfo.key?.toString()}`)
    }
    
  } catch (error: any) {
    console.error(`❌ Account info query failed:`, error.message)
    console.error('Full error:', error)
    if (error.transactionId) {
      console.error('Transaction ID:', error.transactionId.toString())
    }
  }
  
  client.close()
}

if (require.main === module) {
  checkAccountInfo().catch(console.error)
}

module.exports = { checkAccountInfo }