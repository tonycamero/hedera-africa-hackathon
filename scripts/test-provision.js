#!/usr/bin/env node
/**
 * Test HCS-22 Account Provisioning
 * 
 * Tests the full provision-and-bind flow:
 * 1. Dust transfer to EVM alias
 * 2. Account auto-creation
 * 3. BIND event publishing
 * 
 * Usage: node scripts/test-provision.js <evmAddress> <issuer>
 * Example: node scripts/test-provision.js 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5 did:ethr:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5
 */

require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

async function testProvision() {
  const evmAddress = process.argv[2];
  const issuer = process.argv[3];

  if (!evmAddress || !issuer) {
    console.error('❌ Usage: node scripts/test-provision.js <evmAddress> <issuer>');
    console.error('   Example: node scripts/test-provision.js 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5 did:ethr:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5');
    process.exit(1);
  }

  console.log('🧪 Testing HCS-22 Provision Flow...\n');
  console.log(`🔑 EVM Address: ${evmAddress}`);
  console.log(`🆔 Issuer: ${issuer}\n`);

  // Validate environment
  if (!process.env.HCS22_IDENTITY_TOPIC_ID) {
    console.error('❌ Missing HCS22_IDENTITY_TOPIC_ID in .env.local');
    process.exit(1);
  }

  try {
    // Import provision function
    const { provisionAndBind } = require('../lib/server/hcs22/provision');

    console.log('📝 Step 1: Check for existing account via Mirror...');
    
    // Create test email hash
    const emailHash = crypto.createHash('sha256')
      .update('test@example.com')
      .digest('hex');

    console.log('📝 Step 2: Provision account (or return existing)...\n');
    
    const result = await provisionAndBind({
      evmAddress,
      issuer,
      emailHash,
    });

    console.log('\n✅ Provision Success!\n');
    console.log('═══════════════════════════════════════════');
    console.log(`📋 Hedera Account ID: ${result.accountId}`);
    console.log(`💳 Transaction ID: ${result.txId || 'N/A (existing account)'}`);
    console.log(`🆕 Was Created: ${result.wasCreated}`);
    console.log('═══════════════════════════════════════════\n');

    if (result.wasCreated) {
      console.log('📝 Step 3: BIND event was published to HCS');
      console.log(`   Topic: ${process.env.HCS22_IDENTITY_TOPIC_ID}`);
      console.log('\nNext steps:');
      console.log('1. Wait ~5 seconds for Mirror Node to index');
      console.log('2. Check Mirror Node:');
      console.log(`   curl "https://testnet.mirrornode.hedera.com/api/v1/accounts?evm_address=${evmAddress}"`);
      console.log('3. Check HCS topic messages:');
      console.log(`   curl "https://testnet.mirrornode.hedera.com/api/v1/topics/${process.env.HCS22_IDENTITY_TOPIC_ID}/messages?limit=5"`);
      console.log('4. Test resolution:');
      console.log(`   curl -X POST http://localhost:3000/api/identity/resolve -H "Content-Type: application/json" -d '{"issuer":"${issuer}"}'`);
    } else {
      console.log('Account already existed - no BIND event published');
      console.log('\nTest resolution:');
      console.log(`curl -X POST http://localhost:3000/api/identity/resolve -H "Content-Type: application/json" -d '{"issuer":"${issuer}"}'`);
    }

    console.log();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Provision failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testProvision();
