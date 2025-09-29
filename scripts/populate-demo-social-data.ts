#!/usr/bin/env tsx

/**
 * Populates HCS with Demo Social Data
 * 
 * Creates contacts, trust relationships, and profile data to make
 * /contacts and /circle pages functional with realistic demo data.
 */

// Demo profiles for the social graph
const demoProfiles = [
  {
    id: 'tm-sarah-dev',
    name: 'Sarah Chen',
    handle: '@sarah_codes',
    avatar: '👩‍💻',
    bio: 'Full-stack developer building the future of Web3',
    interests: ['DeFi', 'React', 'Solidity'],
    location: 'San Francisco, CA'
  },
  {
    id: 'tm-mike-design',
    name: 'Mike Rodriguez',
    handle: '@mike_creates',
    avatar: '🎨',
    bio: 'Product designer crafting beautiful user experiences',
    interests: ['Design', 'UX/UI', 'Figma'],
    location: 'Austin, TX'
  },
  {
    id: 'tm-lisa-crypto',
    name: 'Lisa Wang',
    handle: '@lisa_hodl',
    avatar: '💎',
    bio: 'Crypto researcher and DeFi protocol analyst',
    interests: ['Crypto', 'DeFi', 'Research'],
    location: 'New York, NY'
  },
  {
    id: 'tm-james-startup',
    name: 'James Kim',
    handle: '@james_builds',
    avatar: '🚀',
    bio: 'Serial entrepreneur building the next big thing',
    interests: ['Startups', 'AI', 'Blockchain'],
    location: 'Los Angeles, CA'
  },
  {
    id: 'tm-emily-writer',
    name: 'Emily Johnson',
    handle: '@emily_writes',
    avatar: '✍️',
    bio: 'Tech writer covering blockchain and emerging tech',
    interests: ['Writing', 'Journalism', 'Tech'],
    location: 'Seattle, WA'
  },
  {
    id: 'tm-david-trader',
    name: 'David Brown',
    handle: '@david_trades',
    avatar: '📈',
    bio: 'Crypto trader and market analyst',
    interests: ['Trading', 'TA', 'Markets'],
    location: 'Chicago, IL'
  },
  {
    id: 'tm-anna-researcher',
    name: 'Anna Petrov',
    handle: '@anna_research',
    avatar: '🔬',
    bio: 'Blockchain researcher and protocol developer',
    interests: ['Research', 'Consensus', 'Cryptography'],
    location: 'Boston, MA'
  },
  {
    id: 'tm-carlos-community',
    name: 'Carlos Silva',
    handle: '@carlos_leads',
    avatar: '🌟',
    bio: 'Community manager building vibrant ecosystems',
    interests: ['Community', 'Events', 'Networking'],
    location: 'Miami, FL'
  }
];

// Contact relationships (Alex -> Others)
const contactRelationships = [
  {
    from: 'tm-alex-chen',
    to: 'tm-sarah-dev',
    type: 'CONTACT_REQUEST',
    status: 'accepted',
    connectedAt: '2024-01-15',
    strength: 0.85,
    interactions: 23
  },
  {
    from: 'tm-alex-chen',
    to: 'tm-mike-design',
    type: 'CONTACT_REQUEST',
    status: 'accepted',
    connectedAt: '2024-01-18',
    strength: 0.72,
    interactions: 15
  },
  {
    from: 'tm-alex-chen',
    to: 'tm-lisa-crypto',
    type: 'CONTACT_REQUEST',
    status: 'accepted',
    connectedAt: '2024-01-22',
    strength: 0.91,
    interactions: 31
  },
  {
    from: 'tm-alex-chen',
    to: 'tm-james-startup',
    type: 'CONTACT_REQUEST',
    status: 'accepted',
    connectedAt: '2024-02-01',
    strength: 0.68,
    interactions: 12
  },
  {
    from: 'tm-alex-chen',
    to: 'tm-emily-writer',
    type: 'CONTACT_REQUEST',
    status: 'accepted',
    connectedAt: '2024-02-05',
    strength: 0.79,
    interactions: 19
  },
  {
    from: 'tm-alex-chen',
    to: 'tm-david-trader',
    type: 'CONTACT_REQUEST',
    status: 'pending',
    connectedAt: null,
    strength: 0,
    interactions: 0
  }
];

// Trust relationships (Circle of 9 Trust) - 1:1 binary allocation
const trustRelationships = [
  {
    from: 'tm-alex-chen',
    to: 'tm-sarah-dev',
    type: 'TRUST_ALLOCATE',
    amount: 1,  // Binary: 1 trust slot allocated
    category: 'professional',
    note: 'Excellent developer, always delivers quality work',
    allocatedAt: '2024-01-20'
  },
  {
    from: 'tm-alex-chen',
    to: 'tm-lisa-crypto',
    type: 'TRUST_ALLOCATE',
    amount: 1,  // Binary: 1 trust slot allocated
    category: 'expertise',
    note: 'Deep crypto knowledge, reliable research',
    allocatedAt: '2024-01-25'
  },
  {
    from: 'tm-alex-chen',
    to: 'tm-mike-design',
    type: 'TRUST_ALLOCATE',
    amount: 1,  // Binary: 1 trust slot allocated
    category: 'creative',
    note: 'Great design skills, good collaboration',
    allocatedAt: '2024-02-02'
  },
  {
    from: 'tm-alex-chen',
    to: 'tm-emily-writer',
    type: 'TRUST_ALLOCATE',
    amount: 1,  // Binary: 1 trust slot allocated
    category: 'communication',
    note: 'Clear writing, good at explaining complex topics',
    allocatedAt: '2024-02-10'
  },
  {
    from: 'tm-alex-chen',
    to: 'tm-james-startup',
    type: 'TRUST_ALLOCATE',
    amount: 1,  // Binary: 1 trust slot allocated
    category: 'business',
    note: 'Good business instincts, networking skills',
    allocatedAt: '2024-02-15'
  },
  // Incoming trust (others -> Alex) - also 1:1
  {
    from: 'tm-sarah-dev',
    to: 'tm-alex-chen',
    type: 'TRUST_ALLOCATE',
    amount: 1,  // Binary: 1 trust slot allocated
    category: 'leadership',
    note: 'Great project leadership and vision',
    allocatedAt: '2024-01-22'
  },
  {
    from: 'tm-lisa-crypto',
    to: 'tm-alex-chen',
    type: 'TRUST_ALLOCATE',
    amount: 1,  // Binary: 1 trust slot allocated
    category: 'technical',
    note: 'Solid technical skills and understanding',
    allocatedAt: '2024-01-28'
  }
];

async function publishToHCS(envelope: any): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3000/api/hcs/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(envelope)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`HTTP ${response.status}: ${error}`);
      return false;
    }

    const result = await response.json();
    console.log(`📡 Published to HCS successfully`);
    return true;
    
  } catch (error) {
    console.error('Network error:', error);
    return false;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function populateDemoSocialData() {
  console.log('🚀 Starting Demo Social Data Population');
  console.log(`👥 Profiles to create: ${demoProfiles.length}`);
  console.log(`🤝 Contact relationships: ${contactRelationships.length}`);
  console.log(`💎 Trust relationships: ${trustRelationships.length}`);
  
  let successCount = 0;
  let errorCount = 0;

  // 1. Create profile updates
  console.log('\n📝 Creating profile updates...');
  for (const profile of demoProfiles) {
    try {
      const envelope = {
        type: 'PROFILE_UPDATE',
        from: profile.id,
        nonce: Date.now() + Math.random(),
        ts: Math.floor(Date.now() / 1000),
        payload: {
          userId: profile.id,
          name: profile.name,
          handle: profile.handle,
          avatar: profile.avatar,
          bio: profile.bio,
          interests: profile.interests,
          location: profile.location,
          updatedAt: new Date().toISOString()
        }
      };

      const success = await publishToHCS(envelope);
      if (success) {
        console.log(`✅ Profile: ${profile.name}`);
        successCount++;
      } else {
        console.error(`❌ Failed: ${profile.name}`);
        errorCount++;
      }

      await delay(300); // Rate limiting
      
    } catch (error) {
      console.error(`❌ Error creating profile for ${profile.name}:`, error);
      errorCount++;
    }
  }

  // 2. Create contact relationships
  console.log('\n🤝 Creating contact relationships...');
  for (const contact of contactRelationships) {
    try {
      const envelope = {
        type: 'CONTACT_REQUEST',
        from: contact.from,
        nonce: Date.now() + Math.random(),
        ts: Math.floor(Date.now() / 1000),
        payload: {
          from: contact.from,
          to: contact.to,
          status: contact.status,
          connectedAt: contact.connectedAt,
          strength: contact.strength,
          interactions: contact.interactions,
          requestedAt: new Date().toISOString()
        }
      };

      const success = await publishToHCS(envelope);
      if (success) {
        console.log(`✅ Contact: ${contact.from} -> ${contact.to} (${contact.status})`);
        successCount++;
      } else {
        console.error(`❌ Failed: ${contact.from} -> ${contact.to}`);
        errorCount++;
      }

      // Also create acceptance if status is accepted
      if (contact.status === 'accepted') {
        await delay(200);
        
        const acceptEnvelope = {
          type: 'CONTACT_ACCEPT',
          from: contact.to,
          nonce: Date.now() + Math.random(),
          ts: Math.floor(Date.now() / 1000),
          payload: {
            from: contact.to,
            to: contact.from,
            originalRequestFrom: contact.from,
            acceptedAt: new Date().toISOString()
          }
        };

        await publishToHCS(acceptEnvelope);
        console.log(`✅ Accepted: ${contact.to} -> ${contact.from}`);
      }

      await delay(300);
      
    } catch (error) {
      console.error(`❌ Error creating contact ${contact.from} -> ${contact.to}:`, error);
      errorCount++;
    }
  }

  // 3. Create trust relationships
  console.log('\n💎 Creating trust relationships...');
  for (const trust of trustRelationships) {
    try {
      const envelope = {
        type: 'TRUST_ALLOCATE',
        from: trust.from,
        nonce: Date.now() + Math.random(),
        ts: Math.floor(Date.now() / 1000),
        payload: {
          from: trust.from,
          to: trust.to,
          amount: trust.amount,
          category: trust.category,
          note: trust.note,
          allocatedAt: trust.allocatedAt,
          timestamp: new Date().toISOString()
        }
      };

      const success = await publishToHCS(envelope);
      if (success) {
        console.log(`✅ Trust: ${trust.from} -> ${trust.to} (${trust.amount} trust)`);
        successCount++;
      } else {
        console.error(`❌ Failed: ${trust.from} -> ${trust.to}`);
        errorCount++;
      }

      await delay(300);
      
    } catch (error) {
      console.error(`❌ Error creating trust ${trust.from} -> ${trust.to}:`, error);
      errorCount++;
    }
  }

  console.log('\n🎉 Demo Social Data Population Complete!');
  console.log(`✅ Successfully created: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📊 Total processed: ${successCount + errorCount}`);
  console.log('\n💡 Next steps:');
  console.log('1. Wait 30-60 seconds for HCS ingestion');
  console.log('2. Refresh /contacts and /circle pages');
  console.log('3. Check that Alex has bonded contacts and trust relationships');
  console.log('4. Verify Circle of (9) Trust visualization is active');
}

// Main execution
async function main() {
  console.log('👥 HCS Demo Social Data Population Script');
  console.log('=========================================');
  
  console.log('\n⚠️  WARNING: This will publish demo social data to HCS');
  console.log('   Make sure the development server is running on localhost:3000');
  
  console.log('\n⏱️  Starting in 3 seconds...');
  await delay(3000);
  
  await populateDemoSocialData();
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

export { populateDemoSocialData };