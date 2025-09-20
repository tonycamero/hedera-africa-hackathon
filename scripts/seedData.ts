import { Client, TopicMessageSubmitTransaction, PrivateKey } from '@hashgraph/sdk';
import { createHash } from 'crypto';
import * as fs from 'fs';
require('dotenv').config({ path: '.env.local' });

interface MessageEnvelope {
  type: string;
  from: string;
  nonce: number;
  ts: number;
  payload: any;
  sig: string;
}

interface DemoAccount {
  id: string;
  privateKey: PrivateKey;
  handle: string;
  bio: string;
  nonce: number;
}

interface SeedSummary {
  profiles: number;
  contacts: number;
  trusts: number;
  signals: number;
  totalMessages: number;
  accounts: string[];
}

class TrustMeshSeeder {
  private client: Client;
  private operatorKey: PrivateKey;
  private topics: Record<string, string>;
  private accounts: DemoAccount[] = [];
  private summary: SeedSummary = {
    profiles: 0,
    contacts: 0,
    trusts: 0,
    signals: 0,
    totalMessages: 0,
    accounts: []
  };

  constructor() {
    this.client = Client.forTestnet().setOperator(
      process.env.HEDERA_OPERATOR_ID!,
      PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY!)
    );
    this.operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY!);

    this.topics = {
      profile: process.env.TOPIC_PROFILE!,
      contact: process.env.TOPIC_CONTACT!,
      trust: process.env.TOPIC_TRUST!,
      signal: process.env.TOPIC_SIGNAL!
    };
  }

  private async createDemoAccounts(): Promise<void> {
    console.log('👥 Creating demo accounts...\n');

    const demoUsers = [
      { handle: 'alice_dev', bio: 'Blockchain developer passionate about trust networks' },
      { handle: 'bob_designer', bio: 'UX designer focused on decentralized social platforms' },
      { handle: 'carol_pm', bio: 'Product manager building the future of social trust' },
      { handle: 'dave_security', bio: 'Security researcher specializing in consensus protocols' },
      { handle: 'eve_community', bio: 'Community manager fostering authentic connections' },
      { handle: 'frank_researcher', bio: 'Academic researcher in social network dynamics' },
      { handle: 'grace_architect', bio: 'System architect designing scalable trust infrastructure' },
      { handle: 'henry_founder', bio: 'Startup founder revolutionizing digital identity' },
      { handle: 'iris_investor', bio: 'Angel investor backing decentralized social platforms' },
      { handle: 'jack_advisor', bio: 'Technical advisor with expertise in distributed systems' }
    ];

    for (let i = 0; i < demoUsers.length; i++) {
      // For demo purposes, create deterministic private keys
      const seed = `trustmesh_demo_${i}_${demoUsers[i].handle}`;
      const hash = createHash('sha256').update(seed).digest();
      const privateKey = PrivateKey.fromBytes(hash.subarray(0, 32));
      
      // Use operator account for simplicity in demo (real implementation would create separate accounts)
      const accountId = process.env.HEDERA_OPERATOR_ID!;

      this.accounts.push({
        id: accountId,
        privateKey: privateKey,
        handle: demoUsers[i].handle,
        bio: demoUsers[i].bio,
        nonce: 0
      });

      console.log(`✅ ${demoUsers[i].handle}: ${accountId}`);
    }

    this.summary.accounts = this.accounts.map(acc => `${acc.handle} (${acc.id})`);
    console.log(`\\n📊 Created ${this.accounts.length} demo accounts`);
  }

  private createMessageHash(envelope: Omit<MessageEnvelope, 'sig'>): string {
    const message = `${envelope.type}|${envelope.from}|${envelope.nonce}|${envelope.ts}|${JSON.stringify(envelope.payload)}`;
    return createHash('sha256').update(message).digest('hex');
  }

  private async publishMessage(
    topicId: string, 
    account: DemoAccount, 
    messageType: string, 
    payload: any
  ): Promise<void> {
    account.nonce++;
    
    const envelope: Omit<MessageEnvelope, 'sig'> = {
      type: messageType,
      from: account.id,
      nonce: account.nonce,
      ts: Math.floor(Date.now() / 1000),
      payload
    };

    // Create hash and sign (simplified for demo - real implementation would use proper signing)
    const messageHash = this.createMessageHash(envelope);
    const signature = account.privateKey.sign(Buffer.from(messageHash, 'hex')).toString('hex');

    const signedEnvelope: MessageEnvelope = {
      ...envelope,
      sig: signature
    };

    // Submit to HCS
    const transaction = new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(JSON.stringify(signedEnvelope))
      .freezeWith(this.client);

    // Sign with operator key for submission
    const signedTx = await transaction.sign(this.operatorKey);
    await signedTx.execute(this.client);
    
    this.summary.totalMessages++;
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  private async seedProfiles(): Promise<void> {
    console.log('\\n📋 Seeding user profiles...');

    for (const account of this.accounts) {
      const profilePayload = {
        handle: account.handle,
        bio: account.bio,
        visibility: Math.random() > 0.7 ? 'contacts' : 'public',
        location: ['San Francisco, CA', 'New York, NY', 'London, UK', 'Toronto, CA', 'Berlin, DE'][Math.floor(Math.random() * 5)]
      };

      await this.publishMessage(this.topics.profile, account, 'PROFILE_UPDATE', profilePayload);
      this.summary.profiles++;
      
      console.log(`  ✅ ${account.handle} profile created`);
    }
  }

  private async seedContacts(): Promise<void> {
    console.log('\\n🤝 Seeding contact connections...');

    // Create 8-10 bidirectional contact pairs
    const connectionPairs = [
      [0, 1], [1, 2], [2, 3], [0, 4], [4, 5], 
      [3, 6], [6, 7], [5, 8], [7, 9], [8, 0]
    ];

    for (const [i, j] of connectionPairs) {
      const accountA = this.accounts[i];
      const accountB = this.accounts[j];

      // A sends request to B
      const requestPayload = {
        to: accountB.id,
        fromProfileId: accountA.id,
        fromProfileHrl: `hcs://11/${this.topics.profile}/${accountA.nonce - 1}` // Reference to profile
      };

      await this.publishMessage(this.topics.contact, accountA, 'CONTACT_REQUEST', requestPayload);
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // B accepts request from A
      const requestHash = createHash('sha256').update(JSON.stringify({
        type: 'CONTACT_REQUEST',
        from: accountA.id,
        payload: requestPayload
      })).digest('hex');

      const acceptPayload = {
        of: requestHash,
        to: accountA.id,
        toProfileId: accountB.id,
        toProfileHrl: `hcs://11/${this.topics.profile}/${accountB.nonce - 1}` // Reference to profile
      };

      await this.publishMessage(this.topics.contact, accountB, 'CONTACT_ACCEPT', acceptPayload);
      this.summary.contacts += 2; // Count both request and accept
      
      console.log(`  ✅ ${accountA.handle} ↔ ${accountB.handle} connected`);
    }
  }

  private async seedTrustAllocations(): Promise<void> {
    console.log('\\n🎯 Seeding trust allocations (Circle of 9)...');

    // Create realistic trust patterns
    const trustAllocations = [
      { from: 0, to: 1, weight: 3 }, // alice trusts bob highly
      { from: 0, to: 2, weight: 2 }, // alice trusts carol moderately  
      { from: 0, to: 4, weight: 1 }, // alice trusts eve minimally
      { from: 1, to: 0, weight: 2 }, // bob trusts alice back
      { from: 1, to: 3, weight: 3 }, // bob trusts dave highly
      { from: 2, to: 0, weight: 1 }, // carol trusts alice
      { from: 2, to: 3, weight: 2 }, // carol trusts dave
      { from: 3, to: 1, weight: 3 }, // dave trusts bob
      { from: 4, to: 5, weight: 2 }, // eve trusts frank
      { from: 5, to: 8, weight: 1 }  // frank trusts iris
    ];

    for (const { from, to, weight } of trustAllocations) {
      const fromAccount = this.accounts[from];
      const toAccount = this.accounts[to];

      const trustPayload = {
        to: toAccount.id,
        weight: weight
      };

      await this.publishMessage(this.topics.trust, fromAccount, 'TRUST_ALLOCATE', trustPayload);
      this.summary.trusts++;
      
      console.log(`  ✅ ${fromAccount.handle} → ${toAccount.handle} (weight: ${weight})`);
    }

    // Add one trust revocation to demonstrate the feature
    const revokePayload = { to: this.accounts[1].id };
    await this.publishMessage(this.topics.trust, this.accounts[0], 'TRUST_REVOKE', revokePayload);
    this.summary.trusts++;
    console.log(`  🔄 ${this.accounts[0].handle} revoked trust from ${this.accounts[1].handle}`);
  }

  private async seedSignals(): Promise<void> {
    console.log('\\n🏆 Seeding recognition signals...');

    const signalTemplates = [
      { tokenId: 'sig-001', kind: 'achievement', name: 'Code Review Champion', issuer: this.accounts[0] },
      { tokenId: 'sig-002', kind: 'skill', name: 'System Design Expert', issuer: this.accounts[3] },
      { tokenId: 'sig-003', kind: 'community', name: 'Helpful Mentor', issuer: this.accounts[4] },
      { tokenId: 'sig-004', kind: 'innovation', name: 'Protocol Pioneer', issuer: this.accounts[7] },
      { tokenId: 'sig-005', kind: 'collaboration', name: 'Team Builder', issuer: this.accounts[2] }
    ];

    for (const signal of signalTemplates) {
      // Mint signal to a random recipient
      const recipient = this.accounts[Math.floor(Math.random() * this.accounts.length)];
      
      const mintPayload = {
        tokenId: signal.tokenId,
        kind: signal.kind,
        name: signal.name,
        uri: `ipfs://QmHash${signal.tokenId}`, // Mock IPFS URI
        to: recipient.id
      };

      await this.publishMessage(this.topics.signal, signal.issuer, 'SIGNAL_MINT', mintPayload);
      this.summary.signals++;
      
      console.log(`  ✅ ${signal.issuer.handle} issued "${signal.name}" to ${recipient.handle}`);

      // 40% chance to transfer the signal to someone else
      if (Math.random() < 0.4) {
        const newOwner = this.accounts[Math.floor(Math.random() * this.accounts.length)];
        if (newOwner.id !== recipient.id) {
          const transferPayload = {
            tokenId: signal.tokenId,
            to: newOwner.id
          };

          await this.publishMessage(this.topics.signal, recipient, 'SIGNAL_TRANSFER', transferPayload);
          this.summary.signals++;
          
          console.log(`  🔄 ${recipient.handle} transferred "${signal.name}" to ${newOwner.handle}`);
        }
      }
    }
  }

  private printSummary(): void {
    console.log('\\n🎉 Seeding Complete!\\n');
    console.log('📊 Summary Report:');
    console.log('┌─────────────────┬──────────┐');
    console.log('│ Message Type    │ Count    │');
    console.log('├─────────────────┼──────────┤');
    console.log(`│ Profiles        │ ${this.summary.profiles.toString().padStart(8)} │`);
    console.log(`│ Contacts        │ ${this.summary.contacts.toString().padStart(8)} │`);
    console.log(`│ Trust Actions   │ ${this.summary.trusts.toString().padStart(8)} │`);
    console.log(`│ Signals         │ ${this.summary.signals.toString().padStart(8)} │`);
    console.log('├─────────────────┼──────────┤');
    console.log(`│ Total Messages  │ ${this.summary.totalMessages.toString().padStart(8)} │`);
    console.log('└─────────────────┴──────────┘');
    
    console.log('\\n📋 Demo Accounts:');
    this.summary.accounts.forEach((account, i) => {
      console.log(`${(i + 1).toString().padStart(2)}. ${account}`);
    });

    console.log('\\n🚀 Ready for Demo!');
    console.log('\\nNext steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Login with Magic.link using any email');
    console.log('3. Explore the seeded data in the Activity Feed');
    console.log('4. Test profile updates, contacts, and trust allocations');
  }

  async seed(): Promise<void> {
    console.log('🌱 TrustMesh Demo Data Seeder\\n');

    // Validate environment
    if (!this.topics.profile || !this.topics.contact || !this.topics.trust || !this.topics.signal) {
      console.error('❌ Missing topic IDs in .env.local');
      console.error('   Run: npx ts-node scripts/setup.ts first');
      process.exit(1);
    }

    console.log('📋 Topic Configuration:');
    console.log(`   Profile: ${this.topics.profile}`);
    console.log(`   Contact: ${this.topics.contact}`);
    console.log(`   Trust:   ${this.topics.trust}`);
    console.log(`   Signal:  ${this.topics.signal}`);

    await this.createDemoAccounts();
    await this.seedProfiles();
    await this.seedContacts();  
    await this.seedTrustAllocations();
    await this.seedSignals();
    
    this.printSummary();
    this.client.close();
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const seeder = new TrustMeshSeeder();
seeder.seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});