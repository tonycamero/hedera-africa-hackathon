#!/usr/bin/env node
/**
 * Test HCS-22 Event Publishing
 * 
 * Publishes a test IDENTITY_BIND event to verify:
 * 1. HCS topic is writable
 * 2. Event format is correct
 * 3. Reducer processes events properly
 */

require('dotenv').config({ path: '.env.local' });
const { Client, TopicMessageSubmitTransaction, AccountId, PrivateKey } = require('@hashgraph/sdk');

async function publishTestEvent() {
  console.log('🧪 Publishing Test HCS-22 Event...\n');

  // Validate environment
  if (!process.env.HCS22_IDENTITY_TOPIC_ID) {
    console.error('❌ Missing HCS22_IDENTITY_TOPIC_ID in .env.local');
    console.error('   Run: node scripts/create-identity-topic.js first');
    process.exit(1);
  }

  if (!process.env.HEDERA_OPERATOR_ID || !process.env.HEDERA_OPERATOR_KEY) {
    console.error('❌ Missing HEDERA_OPERATOR_ID or HEDERA_OPERATOR_KEY');
    process.exit(1);
  }

  const topicId = process.env.HCS22_IDENTITY_TOPIC_ID;
  const network = process.env.HEDERA_NETWORK || 'testnet';

  console.log(`📡 Network: ${network}`);
  console.log(`📋 Topic ID: ${topicId}`);
  console.log(`🔑 Operator: ${process.env.HEDERA_OPERATOR_ID}\n`);

  try {
    // Initialize client
    const client = Client.forName(network);
    const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID);
    
    // Handle different key formats
    let operatorKey;
    const keyStr = process.env.HEDERA_OPERATOR_KEY;
    if (keyStr.startsWith('0x')) {
      operatorKey = PrivateKey.fromStringECDSA(keyStr.slice(2));
    } else if (keyStr.length > 64) {
      operatorKey = PrivateKey.fromStringDer(keyStr);
    } else {
      operatorKey = PrivateKey.fromString(keyStr);
    }
    
    client.setOperator(operatorId, operatorKey);

    // Create test IDENTITY_BIND event
    const testEvent = {
      t: 'IDENTITY_BIND',
      v: 1,
      sub: 'did:ethr:0x742d35cc6634c0532925a3b844bc9e7595f0beb5',  // Test issuer
      iat: new Date().toISOString(),
      chain: network,
      payload: {
        evm_address: '0x742d35cc6634c0532925a3b844bc9e7595f0beb5',
        hedera_account_id: '0.0.999999',  // Test account
        create_tx_id: '0.0.123456@1234567890.000000000',
        email_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',  // SHA256 of empty string (privacy preserved)
        bind_method: 'test-script',
      },
    };

    console.log('📝 Test Event:');
    console.log(JSON.stringify(testEvent, null, 2));
    console.log();

    // Publish to HCS
    console.log('📤 Publishing to HCS topic...');
    const tx = await new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(JSON.stringify(testEvent))
      .execute(client);

    console.log(`⏳ Transaction ID: ${tx.transactionId.toString()}`);
    
    const receipt = await tx.getReceipt(client);
    const sequenceNumber = receipt.topicSequenceNumber.toNumber();

    console.log('\n✅ Success!\n');
    console.log('═══════════════════════════════════════════');
    console.log(`📊 Sequence Number: ${sequenceNumber}`);
    console.log(`📋 Topic ID: ${topicId}`);
    console.log('═══════════════════════════════════════════\n');
    console.log('Next steps:');
    console.log('1. Check server logs for [HCS22 Warmup] or [HCS22 Reducer]');
    console.log('2. Query Mirror Node:');
    console.log(`   curl "https://${network}.mirrornode.hedera.com/api/v1/topics/${topicId}/messages/${sequenceNumber}"`);
    console.log('3. Check health endpoint:');
    console.log('   curl http://localhost:3000/api/health | jq .hcs22.bindings\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error publishing event:', error.message);
    console.error(error);
    process.exit(1);
  }
}

publishTestEvent();
