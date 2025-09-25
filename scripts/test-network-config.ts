/**
 * Test different network configurations to isolate the issue
 */

require('dotenv').config({ path: '.env.local' })
const { Client, PrivateKey, AccountBalanceQuery, AccountInfoQuery } = require('@hashgraph/sdk')

async function testNetworkConfigs() {
  const operatorId = process.env.HEDERA_OPERATOR_ID
  const operatorKey = process.env.HEDERA_OPERATOR_KEY
  
  console.log(`Testing network configurations for account: ${operatorId}`)
  console.log(`SDK Version Info:`)
  
  try {
    const pkg = require('@hashgraph/sdk/package.json')
    console.log(`  @hashgraph/sdk version: ${pkg.version}`)
  } catch (e) {
    console.log('  Could not determine SDK version')
  }
  
  const privateKey = PrivateKey.fromString(operatorKey)
  console.log(`  Public Key: ${privateKey.publicKey.toStringDer()}`)
  
  // Test different network configurations
  const configs = [
    { name: 'testnet', config: Client.forTestnet() },
    { name: 'testnet (forName)', config: Client.forName('testnet') },
    { name: 'testnet (custom nodes)', config: Client.forNetwork({
      '0.testnet.hedera.com:50211': '0.0.3',
      '1.testnet.hedera.com:50211': '0.0.4', 
      '2.testnet.hedera.com:50211': '0.0.5',
      '3.testnet.hedera.com:50211': '0.0.6'
    })}
  ]
  
  for (const { name, config } of configs) {
    console.log(`\\n🌐 Testing ${name}...`)
    
    try {
      const client = config.setOperator(operatorId, privateKey)
      
      // Test balance query (this worked before)
      const balance = await new AccountBalanceQuery()
        .setAccountId(operatorId)
        .execute(client)
      
      console.log(`  ✅ Balance query: ${balance.hbars.toString()}`)
      
      // Test account info query (this failed before)  
      try {
        const accountInfo = await new AccountInfoQuery()
          .setAccountId(operatorId)
          .execute(client)
        
        console.log(`  ✅ Account info query successful`)
        console.log(`    Account key: ${accountInfo.key?.toString()}`)
        console.log(`    Key matches: ${accountInfo.key?.toString() === privateKey.publicKey.toStringDer()}`)
        
      } catch (infoError: any) {
        console.log(`  ❌ Account info query failed: ${infoError.message}`)
      }
      
      client.close()
      
    } catch (error: any) {
      console.log(`  ❌ Client setup failed: ${error.message}`)
    }
  }
}

if (require.main === module) {
  testNetworkConfigs().catch(console.error)
}
