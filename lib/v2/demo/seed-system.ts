/**
 * TrustMesh v2 Demo Seeding System
 * Initialize personas, spaces, and reputation scores for hackathon demo
 */

import { createMockSpaceRegistry } from '../engine/spaceRegistry';
import { getReputationEngine } from '../store/reputationLedger';
import type { ReputationCategory } from '../store/reputationLedger';
import { DEMO_PERSONAS, getPersonaById } from './personas';
import { DEMO_SPACES_CONFIG, DEMO_HCS_TOPICS } from './spaces';

export interface SeedOptions {
  resetData?: boolean;
  verbose?: boolean;
}

export class DemoSeedSystem {
  private registry = createMockSpaceRegistry();
  private reputationEngine = getReputationEngine();
  private seeded = false;

  async seedDemo(options: SeedOptions = {}): Promise<void> {
    const { resetData = true, verbose = true } = options;

    // Idempotency guard
    if (this.seeded && !resetData) {
      if (verbose) console.log('✅ Demo already seeded. Use resetData: true to re-seed.');
      return;
    }

    if (verbose) console.log('🌱 Starting TrustMesh v2 Demo Seeding...');

    // Reset existing data if requested
    if (resetData) {
      if (verbose) console.log('🧹 Clearing existing data...');
      this.registry.clearCache();
      this.reputationEngine.reset();
    }

    // 1. Seed spaces
    await this.seedSpaces(verbose);

    // 2. Initialize persona reputation scores
    await this.initializePersonas(verbose);

    // 3. Generate some initial recognition history with organic timing
    await this.seedInitialRecognitions(verbose);

    this.seeded = true;

    if (verbose) {
      console.log('✅ Demo seeding completed successfully!');
      console.log('\n📊 Demo Status:');
      console.log(`- Spaces: ${DEMO_SPACES_CONFIG.length}`);
      console.log(`- Personas: ${DEMO_PERSONAS.length}`);
      console.log(`- Reputation entries: ${this.reputationEngine.getEntryCount()}`);
      console.log('\n🔗 HCS Topics:');
      Object.entries(DEMO_HCS_TOPICS).forEach(([key, topicId]) => {
        console.log(`- ${key}: ${topicId}`);
      });
    }
  }

  private async seedSpaces(verbose: boolean): Promise<void> {
    if (verbose) console.log('🏗️  Seeding demo spaces...');

    for (const spaceConfig of DEMO_SPACES_CONFIG) {
      try {
        const space = await this.registry.createSpace(spaceConfig, spaceConfig.ownerAccountId);
        if (verbose) {
          console.log(`✅ Created space: ${space.spaceId} (${space.metadata.name})`);
        }
      } catch (error) {
        if (verbose) {
          console.warn(`⚠️  Failed to create space ${spaceConfig.spaceId}:`, error);
        }
      }
    }
  }

  private async initializePersonas(verbose: boolean): Promise<void> {
    if (verbose) console.log('👥 Initializing persona reputation scores...');

    for (const persona of DEMO_PERSONAS) {
      try {
        // Fixed: Use correct 3-parameter signature (no lens parameter)
        await this.reputationEngine.initializePersona(
          persona.id,
          persona.hederaAccountId,
          persona.initialReputationScore
        );

        if (verbose) {
          console.log(`✅ Initialized ${persona.name} (${persona.id}): ${persona.initialReputationScore} pts`);
        }
      } catch (error) {
        if (verbose) {
          console.warn(`⚠️  Failed to initialize ${persona.name}:`, error);
        }
      }
    }
  }

  private async seedInitialRecognitions(verbose: boolean): Promise<void> {
    if (verbose) console.log('🎯 Seeding initial recognition patterns...');

    // Create some historical recognitions with organic timing
    const recognitionSeeds = [
      // Business context recognitions
      {
        senderPersonaId: 'founder-alex',
        recipientPersonaId: 'ops-manager-sam',
        spaceId: 'tm.v2.startup-lab',
        lens: 'professional' as const,
        category: 'reliability' as ReputationCategory,
        title: 'Exceptional project delivery under tight deadline'
      },
      {
        senderPersonaId: 'ops-manager-sam',
        recipientPersonaId: 'student-charlie',
        spaceId: 'tm.v2.startup-lab',
        lens: 'professional' as const,
        category: 'learning' as ReputationCategory,
        title: 'Quick adaptation to our development processes'
      },
      
      // Campus context recognitions
      {
        senderPersonaId: 'student-brooklyn',
        recipientPersonaId: 'student-avery',
        spaceId: 'tm.v2.campus-hub',
        lens: 'genz' as const,
        category: 'collaboration' as ReputationCategory,
        title: 'Amazing teamwork in the hackathon project'
      },
      {
        senderPersonaId: 'student-avery',
        recipientPersonaId: 'student-brooklyn',
        spaceId: 'tm.v2.campus-hub',
        lens: 'genz' as const,
        category: 'leadership' as ReputationCategory,
        title: 'Natural leadership in organizing study groups'
      },
      
      // Cross-context recognitions (mentor connecting both worlds)
      {
        senderPersonaId: 'mentor-dana',
        recipientPersonaId: 'founder-alex',
        spaceId: 'tm.v2.startup-lab',
        lens: 'builder' as const,
        category: 'innovation' as ReputationCategory,
        title: 'Innovative approach to solving complex logistics problems'
      },
      {
        senderPersonaId: 'mentor-dana',
        recipientPersonaId: 'student-brooklyn',
        spaceId: 'tm.v2.campus-hub',
        lens: 'social' as const,
        category: 'community_building' as ReputationCategory,
        title: 'Outstanding community leadership and mentorship'
      },

      // Charlie as bridge between spaces
      {
        senderPersonaId: 'student-charlie',
        recipientPersonaId: 'ops-manager-sam',
        spaceId: 'tm.v2.startup-lab',
        lens: 'professional' as const,
        category: 'cross_collaboration' as ReputationCategory,
        title: 'Excellent bridge between academic and business perspectives'
      },

      // Additional recognitions for richer demo
      {
        senderPersonaId: 'client-partner-jordan',
        recipientPersonaId: 'founder-alex',
        spaceId: 'tm.v2.startup-lab',
        lens: 'professional' as const,
        category: 'business_value' as ReputationCategory,
        title: 'Delivered exceptional ROI on logistics optimization'
      },
      {
        senderPersonaId: 'community-river',
        recipientPersonaId: 'student-brooklyn',
        spaceId: 'tm.v2.campus-hub',
        lens: 'social' as const,
        category: 'social_impact' as ReputationCategory,
        title: 'Led impactful community outreach initiative'
      }
    ];

    // Stagger recognition times across last 3 hours for organic feel
    let baseTime = Date.now() - 3 * 60 * 60 * 1000; // 3 hours ago
    let seq = 0;
    const lensDistribution: Record<string, number> = {};

    for (const recognition of recognitionSeeds) {
      try {
        // Advance 2-5 minutes each loop for organic timing
        baseTime += (2 + Math.floor(Math.random() * 4)) * 60 * 1000;
        
        const senderPersona = getPersonaById(recognition.senderPersonaId);
        const recipientPersona = getPersonaById(recognition.recipientPersonaId);
        
        if (!senderPersona || !recipientPersona) {
          if (verbose) console.warn(`⚠️  Persona not found for recognition: ${recognition.senderPersonaId} -> ${recognition.recipientPersonaId}`);
          continue;
        }

        // Create deterministic unique recognition ID
        const recognitionId = `seed-${recognition.senderPersonaId}-${recognition.recipientPersonaId}-${baseTime}-${seq++}`;

        // Fixed: Use correct positional parameter signature
        const reputationEntry = await this.reputationEngine.updatePersonaReputation(
          recognition.recipientPersonaId,
          recipientPersona.hederaAccountId,
          recognition.spaceId,
          recognition.lens,
          recognition.category,
          recognitionId,
          {
            senderPersonaId: recognition.senderPersonaId,
            title: recognition.title
          }
        );

        // Track lens distribution for summary
        lensDistribution[recognition.lens] = (lensDistribution[recognition.lens] || 0) + 1;

        if (verbose) {
          console.log(`✅ ${senderPersona.name} → ${recipientPersona.name}: +${reputationEntry.deltaScore} pts (${recognition.category})`);
        }

      } catch (error) {
        if (verbose) {
          console.warn(`⚠️  Failed to seed recognition:`, error);
        }
      }
    }

    // Summary log for the demo
    if (verbose) {
      const total = Object.values(lensDistribution).reduce((sum, count) => sum + count, 0);
      const summary = Object.entries(lensDistribution)
        .map(([lens, count]) => `${count} ${lens}`)
        .join(', ');
      console.log(`🎛  Seeded ${total} recognitions: ${summary}`);
    }
  }

  // Helper methods for demo management
  async getPersonaReputations(): Promise<Array<{
    persona: typeof DEMO_PERSONAS[0];
    reputation: any;
  }>> {
    const results = [];
    
    for (const persona of DEMO_PERSONAS) {
      const reputation = await this.reputationEngine.getPersonaSummary(persona.id);
      results.push({ persona, reputation });
    }
    
    return results.sort((a, b) => (b.reputation?.totalScore || 0) - (a.reputation?.totalScore || 0));
  }

  async getSpaceSummaries(): Promise<Array<{
    spaceId: string;
    name: string;
    personas: number;
    averageReputation: number;
  }>> {
    const results = [];
    
    for (const spaceConfig of DEMO_SPACES_CONFIG) {
      const personasInSpace = DEMO_PERSONAS.filter(p => p.spaces.includes(spaceConfig.spaceId));
      
      let totalReputation = 0;
      let personaCount = 0;
      
      for (const persona of personasInSpace) {
        const reputation = await this.reputationEngine.getPersonaSummary(persona.id);
        if (reputation) {
          totalReputation += reputation.totalScore;
          personaCount++;
        }
      }
      
      results.push({
        spaceId: spaceConfig.spaceId,
        name: spaceConfig.metadata.name,
        personas: personaCount,
        averageReputation: personaCount > 0 ? Math.round(totalReputation / personaCount) : 0
      });
    }
    
    return results;
  }

  async printDemoStatus(): Promise<void> {
    console.log('\n🎯 TrustMesh v2 Demo Status Report');
    console.log('=' .repeat(50));

    // Space summaries
    const spaceSummaries = await this.getSpaceSummaries();
    console.log('\n📍 Spaces:');
    spaceSummaries.forEach(space => {
      console.log(`  ${space.name}: ${space.personas} personas, avg ${space.averageReputation} reputation`);
    });

    // Top personas by reputation
    const personaReputations = await this.getPersonaReputations();
    console.log('\n🏆 Top Personas by Reputation:');
    personaReputations.slice(0, 5).forEach((entry, index) => {
      const score = entry.reputation?.totalScore || 0;
      console.log(`  ${index + 1}. ${entry.persona.name} (${entry.persona.role}): ${score} pts`);
    });

    // Recent activity
    console.log(`\n📈 Total Reputation Entries: ${this.reputationEngine.getEntryCount()}`);
    
    console.log('\n🌐 HCS Topics:');
    Object.entries(DEMO_HCS_TOPICS).forEach(([key, topicId]) => {
      console.log(`  ${key}: ${topicId}`);
    });
  }

  // Demo management methods
  reset(): void {
    this.seeded = false;
    this.registry.clearCache();
    this.reputationEngine.reset();
  }

  isSeeded(): boolean {
    return this.seeded;
  }
}

// Global seed system instance
let globalSeedSystem: DemoSeedSystem;

export function getDemoSeedSystem(): DemoSeedSystem {
  if (!globalSeedSystem) {
    globalSeedSystem = new DemoSeedSystem();
  }
  return globalSeedSystem;
}

// Convenience functions
export async function seedDemo(options?: SeedOptions): Promise<void> {
  return getDemoSeedSystem().seedDemo(options);
}

export async function printDemoStatus(): Promise<void> {
  return getDemoSeedSystem().printDemoStatus();
}

export function resetDemo(): void {
  getDemoSeedSystem().reset();
}