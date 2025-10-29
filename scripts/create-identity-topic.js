#!/usr/bin/env node
/**
 * Create HCS-22 Identity Registry Topic
 * 
 * Creates a new Hedera Consensus Service topic for identity binding events.
 * Topic ID should be added to .env.local as HCS22_IDENTITY_TOPIC_ID
 */

require('dotenv').config({ path: '.env.local' });
const { Client, TopicCreateTransaction, AccountId, PrivateKey } = require('@hashgraph/sdk');

async function createIdentityTopic() {
  console.log('🚀 Creating HCS-22 Identity Registry Topic...\n');

  // Validate environment
  if (!process.env.HEDERA_OPERATOR_ID || !process.env.HEDERA_OPERATOR_KEY) {
    console.error('❌ Missing HEDERA_OPERATOR_ID or HEDERA_OPERATOR_KEY in .env.local');
    process.exit(1);
  }

  const network = process.env.HEDERA_NETWORK || 'testnet';
  console.log(`📡 Network: ${network}`);
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

    // Create topic
    console.log('📝 Submitting TopicCreateTransaction...');
    const tx = await new TopicCreateTransaction()
      .setTopicMemo('HCS-22 Identity Registry - TrustMesh')
      .execute(client);

    console.log(`⏳ Transaction ID: ${tx.transactionId.toString()}`);
    
    // Get receipt
    const receipt = await tx.getReceipt(client);
    const topicId = receipt.topicId.toString();

    console.log('\n✅ Success!\n');
    console.log('═══════════════════════════════════════════');
    console.log(`📋 Topic ID: ${topicId}`);
    console.log('═══════════════════════════════════════════\n');
    console.log('Next steps:');
    console.log('1. Add to .env.local:');
    console.log(`   HCS22_ENABLED=true`);
    console.log(`   HCS22_IDENTITY_TOPIC_ID=${topicId}`);
    console.log('2. Restart your dev server');
    console.log('3. Check health: curl http://localhost:3000/api/health\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating topic:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createIdentityTopic();
