const { Client, TopicCreateTransaction, PrivateKey } = require('@hashgraph/sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

interface TopicConfig {
  name: string;
  memo: string;
  envKey: string;
  publicEnvKey: string;
}

const TOPICS: TopicConfig[] = [
  { 
    name: 'PROFILE', 
    memo: 'TrustMesh HCS-11 Profiles', 
    envKey: 'TOPIC_PROFILE',
    publicEnvKey: 'NEXT_PUBLIC_TOPIC_PROFILE'
  },
  { 
    name: 'CONTACT', 
    memo: 'TrustMesh Contact Tokens', 
    envKey: 'TOPIC_CONTACT',
    publicEnvKey: 'NEXT_PUBLIC_TOPIC_CONTACT'
  },
  { 
    name: 'TRUST', 
    memo: 'TrustMesh Circle of 9 Trust', 
    envKey: 'TOPIC_TRUST',
    publicEnvKey: 'NEXT_PUBLIC_TOPIC_TRUST'
  },
  { 
    name: 'SIGNAL', 
    memo: 'TrustMesh Recognition Signals', 
    envKey: 'TOPIC_SIGNAL',
    publicEnvKey: 'NEXT_PUBLIC_TOPIC_SIGNAL'
  }
];

async function createTopics() {
  console.log('🚀 TrustMesh HCS Topic Setup\n');

  // Validate environment
  const operatorId = process.env.HEDERA_OPERATOR_ID;
  const operatorKey = process.env.HEDERA_OPERATOR_KEY;

  if (!operatorId || !operatorKey) {
    console.error('❌ Missing Hedera credentials in .env.local');
    console.error('   Required: HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY');
    process.exit(1);
  }

  console.log(`📋 Operator Account: ${operatorId}`);
  console.log(`🌐 Network: ${process.env.HEDERA_NETWORK || 'testnet'}\n`);

  const client = Client.forTestnet().setOperator(
    operatorId,
    PrivateKey.fromString(operatorKey)
  );

  const envPath = path.resolve('.env.local');
  let envContent = '';
  
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    console.error('❌ Cannot read .env.local file');
    process.exit(1);
  }

  const topicResults: { name: string; id: string; }[] = [];

  for (const topic of TOPICS) {
    try {
      console.log(`Creating ${topic.name} topic...`);
      
      const transaction = new TopicCreateTransaction()
        .setTopicMemo(topic.memo)
        .setAdminKey(client.operatorPublicKey!)
        .setSubmitKey(client.operatorPublicKey!)
        .freezeWith(client);

      const response = await transaction.execute(client);
      const receipt = await response.getReceipt(client);
      const topicId = receipt.topicId!.toString();

      console.log(`✅ ${topic.name}: ${topicId}`);
      topicResults.push({ name: topic.name, id: topicId });
      
      // Update both private and public env variables
      const envRegex = new RegExp(`^${topic.envKey}=.*$`, 'm');
      const publicEnvRegex = new RegExp(`^${topic.publicEnvKey}=.*$`, 'm');
      
      if (envContent.match(envRegex)) {
        envContent = envContent.replace(envRegex, `${topic.envKey}=${topicId}`);
      } else {
        envContent += `\n${topic.envKey}=${topicId}`;
      }

      if (envContent.match(publicEnvRegex)) {
        envContent = envContent.replace(publicEnvRegex, `${topic.publicEnvKey}=${topicId}`);
      } else {
        envContent += `\n${topic.publicEnvKey}=${topicId}`;
      }
      
      // Small delay between topic creations
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Failed to create ${topic.name} topic:`, error);
      throw error;
    }
  }

  // Write updated env file
  fs.writeFileSync(envPath, envContent);
  console.log('\n📝 Updated .env.local with topic IDs');

  // Display summary
  console.log('\n🎉 Setup Complete!\n');
  console.log('📋 Topic Summary:');
  console.log('┌─────────────┬─────────────────────────┐');
  console.log('│ Topic       │ ID                      │');
  console.log('├─────────────┼─────────────────────────┤');
  
  topicResults.forEach(topic => {
    console.log(`│ ${topic.name.padEnd(11)} │ ${topic.id.padEnd(23)} │`);
  });
  
  console.log('└─────────────┴─────────────────────────┘');
  
  console.log('\n🚀 Ready for TrustMesh development!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Test Magic.link authentication');
  console.log('3. Create your first profile');
  
  client.close();
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

createTopics().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});