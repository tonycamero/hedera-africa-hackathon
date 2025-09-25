/**
 * Simple test to verify Hedera client connection and account balance
 */

require('dotenv').config({ path: '.env.local' })
const { Client, PrivateKey, AccountBalanceQuery } = require('@hashgraph/sdk')

async function testConnection() {
  const operatorId = process.env.HEDERA_OPERATOR_ID
  const operatorKey = process.env.HEDERA_OPERATOR_KEY
  const network = process.env.HEDERA_NETWORK ?? 'testnet'
  
  console.log(`Testing connection with:`)
  console.log(`  Operator ID: ${operatorId}`)
  console.log(`  Network: ${network}`)
  console.log(`  Key length: ${operatorKey?.length} chars`)
  
  if (!operatorId || !operatorKey) {
    throw new Error('Missing HEDERA_OPERATOR_ID or HEDERA_OPERATOR_KEY')
  }
  
  try {
    console.log('\nCreating client...')
    const client = Client.forName(network)
    
    console.log('Parsing private key...')
    const privateKey = PrivateKey.fromString(operatorKey)
    const publicKey = privateKey.publicKey
    
    console.log(`Public key: ${publicKey.toString()}`)
    
    client.setOperator(operatorId, privateKey)
    
    console.log('\nQuerying account balance...')
    const accountBalance = await new AccountBalanceQuery()
      .setAccountId(operatorId)
      .execute(client)
    
    console.log(`✅ Account balance: ${accountBalance.hbars.toString()}`)
    
    client.close()
    return true
    
  } catch (error: any) {
    console.error(`❌ Connection test failed:`, error.message)
    if (error.stack) {
      console.error('Stack trace:', error.stack)
    }
    return false
  }
}

if (require.main === module) {
  testConnection().then(success => {
    process.exit(success ? 0 : 1)
  })
}

module.exports = { testConnection }