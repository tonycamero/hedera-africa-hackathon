/**
 * TrustMesh v2 Signal Orchestrator
 * Orchestrates realistic recognition patterns for live hackathon demo
 * Fixes: Instance RNG, human cadence jitter, category alignment, HCS hook support
 */

import { getDemoSeedSystem } from './seed-system';
import { getReputationEngine } from '../store/reputationLedger';
import { DEMO_PERSONAS, getPersonaById, type DemoPersona } from './personas';
import { DEMO_SPACES_CONFIG } from './spaces';
import type { ReputationCategory } from '../store/reputationLedger';

export interface OrchestrationOptions {
  duration?: number; // milliseconds
  recognitionFrequency?: number; // recognitions per minute
  verbose?: boolean;
  randomSeed?: number;
  onEmit?: EmitHook; // optional HCS/API hook
}

export interface RecognitionTemplate {
  title: string;
  category: ReputationCategory;
  weight: number; // probability multiplier
  contexts: Array<{
    senderRoles: string[];
    recipientRoles: string[];
    spaces: string[];
    lenses: string[];
  }>;
}

// Optional callback for live HCS submission or API calls
export type EmitHook = (args: {
  spaceId: string;
  lens: string;
  senderId: string;
  recipientId: string;
  title: string;
  recognitionId: string;
  timestamp: string;
}) => Promise<void>;

export class SignalOrchestrator {
  private reputationEngine = getReputationEngine();
  private running = false;
  private timeoutId?: NodeJS.Timeout;
  private seq = 0; // per-run sequence counter
  private rng: () => number = Math.random; // instance RNG, not global

  // Recognition templates with aligned categories from reputationLedger.ts
  private recognitionTemplates: RecognitionTemplate[] = [
    {
      title: "Excellent collaboration on project deliverable",
      category: "collaboration",
      weight: 3,
      contexts: [{
        senderRoles: ["founder", "ops-manager", "mentor"],
        recipientRoles: ["ops-manager", "student", "community-builder"],
        spaces: ["tm.v2.startup-lab", "tm.v2.campus-hub"],
        lenses: ["professional", "builder"]
      }]
    },
    {
      title: "Outstanding leadership in team coordination",
      category: "leadership",
      weight: 2,
      contexts: [{
        senderRoles: ["founder", "mentor", "community-builder"],
        recipientRoles: ["student", "ops-manager"],
        spaces: ["tm.v2.startup-lab", "tm.v2.campus-hub"],
        lenses: ["professional", "genz", "social"]
      }]
    },
    {
      title: "Innovative solution to complex problem",
      category: "innovation",
      weight: 2,
      contexts: [{
        senderRoles: ["mentor", "client-partner", "founder"],
        recipientRoles: ["founder", "student", "ops-manager"],
        spaces: ["tm.v2.startup-lab"],
        lenses: ["builder", "professional"]
      }]
    },
    {
      title: "Exceptional learning progress and adaptation",
      category: "learning",
      weight: 3,
      contexts: [{
        senderRoles: ["mentor", "founder", "ops-manager"],
        recipientRoles: ["student"],
        spaces: ["tm.v2.startup-lab", "tm.v2.campus-hub"],
        lenses: ["professional", "genz", "builder"]
      }]
    },
    {
      title: "Strong community engagement and support",
      category: "community_building",
      weight: 2,
      contexts: [{
        senderRoles: ["community-builder", "mentor"],
        recipientRoles: ["student", "community-builder"],
        spaces: ["tm.v2.campus-hub"],
        lenses: ["social", "genz"]
      }]
    },
    {
      title: "Reliable execution under pressure",
      category: "reliability",
      weight: 2,
      contexts: [{
        senderRoles: ["founder", "client-partner", "ops-manager"],
        recipientRoles: ["ops-manager", "student"],
        spaces: ["tm.v2.startup-lab"],
        lenses: ["professional", "builder"]
      }]
    },
    {
      title: "Bridging different perspectives effectively",
      category: "cross_collaboration",
      weight: 1.5,
      contexts: [{
        senderRoles: ["mentor", "founder"],
        recipientRoles: ["student"],
        spaces: ["tm.v2.startup-lab", "tm.v2.campus-hub"],
        lenses: ["professional", "social", "builder"]
      }]
    },
    {
      title: "Positive social impact initiative",
      category: "social_impact",
      weight: 1.5,
      contexts: [{
        senderRoles: ["community-builder", "mentor"],
        recipientRoles: ["student", "community-builder"],
        spaces: ["tm.v2.campus-hub"],
        lenses: ["social", "genz"]
      }]
    },
    {
      title: "Delivered measurable business value",
      category: "business_value",
      weight: 2,
      contexts: [{
        senderRoles: ["client-partner", "founder"],
        recipientRoles: ["founder", "ops-manager"],
        spaces: ["tm.v2.startup-lab"],
        lenses: ["professional"]
      }]
    },
    {
      title: "Excellent mentorship and guidance",
      category: "mentorship", 
      weight: 2,
      contexts: [{
        senderRoles: ["mentor", "founder"],
        recipientRoles: ["student", "ops-manager"],
        spaces: ["tm.v2.startup-lab", "tm.v2.campus-hub"],
        lenses: ["professional", "social"]
      }]
    }
  ];

  constructor(private onEmit?: EmitHook) {}

  async startOrchestration(options: OrchestrationOptions = {}): Promise<void> {
    const {
      duration = 300000, // 5 minutes default
      recognitionFrequency = 4, // 4 per minute
      verbose = true,
      randomSeed,
      onEmit
    } = options;

    if (this.running) {
      if (verbose) console.log('⚠️  Orchestration already running');
      return;
    }

    // Set instance RNG (no global Math.random override)
    if (randomSeed) {
      this.rng = this.createSeededRandom(randomSeed);
    } else {
      this.rng = Math.random;
    }

    // Update emit hook if provided
    if (onEmit) {
      this.onEmit = onEmit;
    }

    // Ensure demo is seeded first
    const seedSystem = getDemoSeedSystem();
    if (!seedSystem.isSeeded()) {
      if (verbose) console.log('🌱 Auto-seeding demo for orchestration...');
      await seedSystem.seedDemo({ verbose: false });
    }

    this.running = true;
    this.seq = 0;

    if (verbose) {
      console.log('🎭 Starting Signal Orchestration');
      console.log(`⏱️  Duration: ${duration / 1000}s`);
      console.log(`📡 Frequency: ${recognitionFrequency} recognitions/min`);
      console.log('🎯 Simulating organic trust network activity...\n');
    }

    // Human cadence with jitter (recursive setTimeout instead of setInterval)
    const baseMs = Math.floor(60000 / recognitionFrequency);
    
    const tick = async (): Promise<void> => {
      if (!this.running) return;

      try {
        await this.generateRecognition(verbose);
      } catch (error) {
        if (verbose) {
          console.error('❌ Error generating recognition:', error);
        }
      }

      if (this.running) {
        // Add ±25% jitter for human feel (75%-125% of base interval)
        const jitter = baseMs * (0.75 + this.rng() * 0.5);
        this.timeoutId = setTimeout(tick, jitter);
      }
    };

    // Start first tick
    await tick();

    // Auto-stop after duration
    setTimeout(() => {
      this.stopOrchestration(verbose);
    }, duration);

    if (verbose) {
      console.log(`✅ Orchestration started. Will run for ${duration / 1000}s`);
    }
  }

  stopOrchestration(verbose = true): void {
    if (!this.running) return;

    this.running = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }

    if (verbose) {
      console.log(`\n🛑 Signal Orchestration stopped`);
      console.log(`📊 Generated ${this.seq} recognitions during session\n`);
    }
  }

  private async generateRecognition(verbose: boolean): Promise<void> {
    // Select weighted recognition template
    const template = this.selectWeightedTemplate();
    if (!template) return;

    // Find matching personas and context
    const context = this.selectRandomContext(template.contexts);
    const { sender, recipient } = this.selectPersonaPair(context);
    
    if (!sender || !recipient || sender.id === recipient.id) {
      if (verbose) console.log('⚠️  Could not find suitable persona pair');
      return;
    }

    // Select appropriate space and lens
    const spaceId = this.selectRandomItem(context.spaces);
    const lens = this.selectRandomItem(context.lenses);

    try {
      // Unique stable recognition ID with per-run sequence
      const recognitionId = `orchestrated-${Date.now()}-${this.seq++}-${Math.floor(this.rng() * 1e6)}`;
      const timestamp = new Date().toISOString();

      // Core reputation update
      const reputationEntry = await this.reputationEngine.updatePersonaReputation({
        personaId: recipient.id,
        hederaAccountId: recipient.hederaAccountId,
        spaceId,
        lens: lens as any,
        category: template.category,
        recognitionId,
        context: {
          senderPersonaId: sender.id,
          title: template.title
        }
      });

      // Optional HCS/API emit hook
      if (this.onEmit) {
        await this.onEmit({
          spaceId,
          lens,
          senderId: sender.id,
          recipientId: recipient.id,
          title: template.title,
          recognitionId,
          timestamp
        });
      }

      if (verbose) {
        const emoji = this.getCategoryEmoji(template.category);
        console.log(`${emoji} ${sender.name} → ${recipient.name}: +${reputationEntry.deltaScore} pts`);
        console.log(`   "${template.title}" (${template.category} • ${lens} lens • ${this.getSpaceName(spaceId)})`);
      }

    } catch (error) {
      if (verbose) {
        console.warn(`⚠️  Failed to generate recognition: ${sender.name} → ${recipient.name}`, error);
      }
    }
  }

  private selectWeightedTemplate(): RecognitionTemplate | null {
    const totalWeight = this.recognitionTemplates.reduce((sum, t) => sum + t.weight, 0);
    let random = this.rng() * totalWeight;

    for (const template of this.recognitionTemplates) {
      random -= template.weight;
      if (random <= 0) {
        return template;
      }
    }

    return this.recognitionTemplates[0]; // fallback
  }

  private selectRandomContext(contexts: RecognitionTemplate['contexts']) {
    return contexts[Math.floor(this.rng() * contexts.length)];
  }

  private selectPersonaPair(context: RecognitionTemplate['contexts'][0]): {
    sender: DemoPersona | null;
    recipient: DemoPersona | null;
  } {
    // Helper for context matching
    const inContext = (p: DemoPersona, roles: string[]) =>
      roles.some(role => p.role.includes(role)) && 
      p.spaces.some(space => context.spaces.includes(space));

    // Find suitable personas
    const senders = DEMO_PERSONAS.filter(p => inContext(p, context.senderRoles));
    const recipients = DEMO_PERSONAS.filter(p => inContext(p, context.recipientRoles));

    if (senders.length === 0 || recipients.length === 0) {
      return { sender: null, recipient: null };
    }

    // Prevent self-recognition with retry safety
    let sender = this.selectRandomItem(senders);
    let recipient = this.selectRandomItem(recipients);
    let attempts = 10;
    
    while (sender.id === recipient.id && attempts-- > 0) {
      recipient = this.selectRandomItem(recipients);
    }

    return { sender, recipient };
  }

  private selectRandomItem<T>(items: T[]): T {
    return items[Math.floor(this.rng() * items.length)];
  }

  private getCategoryEmoji(category: ReputationCategory): string {
    const emojiMap: Record<ReputationCategory, string> = {
      collaboration: '🤝', leadership: '👑', innovation: '💡', mentorship: '🎯',
      technical_guidance: '🔧', reliability: '⚡', communication: '💬', peer_support: '🫱🏽‍🫲🏻',
      delivery: '📦', process_improvement: '⚙️', networking: '🌐', social_impact: '🌍',
      community_building: '🌟', study_group: '📚', business_value: '💼', partnership: '🤝',
      team_coordination: '👥', cross_collaboration: '🌉', learning: '📖', career_development: '📈',
      community_engagement: '🏘️', advocacy: '📢', skill_verification: '✅', professional_growth: '🌱'
    };
    return emojiMap[category] || '✨';
  }

  private getSpaceName(spaceId: string): string {
    const space = DEMO_SPACES_CONFIG.find(s => s.spaceId === spaceId);
    return space?.metadata.name || spaceId;
  }

  // Seeded random number generator for deterministic results
  private createSeededRandom(seed: number) {
    return function() {
      seed = Math.imul(16807, seed) >>> 0;
      return (seed >>> 8) / (1 << 24);
    };
  }

  // Status methods
  isRunning(): boolean {
    return this.running;
  }

  getRecognitionCount(): number {
    return this.seq;
  }

  // Demo scenarios with different cadences
  async runQuickDemo(verbose = true): Promise<void> {
    await this.startOrchestration({
      duration: 60000, // 1 minute
      recognitionFrequency: 8, // 8 per minute (fast demo)
      verbose
    });
  }

  async runExtendedDemo(verbose = true): Promise<void> {
    await this.startOrchestration({
      duration: 300000, // 5 minutes
      recognitionFrequency: 3, // 3 per minute (realistic pace)
      verbose
    });
  }

  async runDeterministicDemo(seed = 12345, verbose = true): Promise<void> {
    await this.startOrchestration({
      duration: 120000, // 2 minutes
      recognitionFrequency: 6, // 6 per minute
      randomSeed: seed,
      verbose
    });
  }

  // Live demo scenario for judges
  async runJudgeDemo(verbose = true): Promise<void> {
    await this.startOrchestration({
      duration: 180000, // 3 minutes
      recognitionFrequency: 5, // 5 per minute (active but not overwhelming)
      verbose
    });
  }
}

// Global orchestrator instance
let globalOrchestrator: SignalOrchestrator;

export function getSignalOrchestrator(): SignalOrchestrator {
  if (!globalOrchestrator) {
    globalOrchestrator = new SignalOrchestrator();
  }
  return globalOrchestrator;
}

// Convenience functions
export async function startOrchestration(options?: OrchestrationOptions): Promise<void> {
  return getSignalOrchestrator().startOrchestration(options);
}

export function stopOrchestration(verbose = true): void {
  getSignalOrchestrator().stopOrchestration(verbose);
}

export async function runQuickDemo(): Promise<void> {
  return getSignalOrchestrator().runQuickDemo();
}

export async function runExtendedDemo(): Promise<void> {
  return getSignalOrchestrator().runExtendedDemo();
}

export async function runDeterministicDemo(seed?: number): Promise<void> {
  return getSignalOrchestrator().runDeterministicDemo(seed);
}

export async function runJudgeDemo(): Promise<void> {
  return getSignalOrchestrator().runJudgeDemo();
}