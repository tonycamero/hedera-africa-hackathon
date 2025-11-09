/**
 * TrustMesh v2 Reputation Ledger
 * Production-ready reputation tracking with idempotency, bounds checking, and performance optimizations
 */

import crypto from 'crypto';
import { LensType } from '../schema/tm.recognition@1';

// Constrained category types for compile-time safety
export type ReputationCategory =
  | 'leadership' | 'innovation' | 'mentorship' | 'technical_guidance'
  | 'collaboration' | 'reliability' | 'communication' | 'peer_support'
  | 'delivery' | 'process_improvement' | 'networking' | 'social_impact'
  | 'community_building' | 'study_group' | 'business_value' | 'partnership'
  | 'team_coordination' | 'cross_collaboration' | 'learning' | 'career_development'
  | 'community_engagement' | 'advocacy' | 'skill_verification' | 'professional_growth';

export interface ReputationEntry {
  entryId: string;
  timestamp: string;
  personaId: string;
  hederaAccountId: string;
  spaceId: string;
  lens: LensType;
  
  // Score tracking
  previousScore: number;
  deltaScore: number; 
  newScore: number;
  
  // Recognition context that caused this reputation change
  recognitionId?: string;
  category?: ReputationCategory;
  sourcePersonaId?: string;
  
  // Calculation metadata
  reason: string;
  multiplier: number;
  basePoints: number;
  
  // Anti-gaming metadata
  dailySequence?: number; // nth recognition from this sender to recipient today
  diminishingFactor?: number; // applied reduction factor
}

export interface ReputationSummary {
  personaId: string;
  hederaAccountId: string;
  totalScore: number;
  scoresBySpace: Record<string, number>;
  scoresByLens: Record<LensType, number>;
  lastUpdated: string;
  entryCount: number;
}

// Anti-gaming guards interface
export interface ReputationGuards {
  canApplyDelta(ctx: {
    senderId: string;
    recipientId: string;
    spaceId: string;
    lens: LensType;
    ts: string;
  }): Promise<boolean>;
}

// Per-persona locks to prevent race conditions
const personaLocks = new Map<string, Promise<void>>();

async function withPersonaLock<T>(personaId: string, fn: () => Promise<T>): Promise<T> {
  const existingLock = personaLocks.get(personaId);
  
  const newLock = (async () => {
    if (existingLock) await existingLock;
    try {
      return await fn();
    } finally {
      // Clean up this lock if it's still the current one
      if (personaLocks.get(personaId) === newLock) {
        personaLocks.delete(personaId);
      }
    }
  })();
  
  personaLocks.set(personaId, newLock);
  return newLock;
}

class MockReputationStorage {
  private entries: ReputationEntry[] = [];
  private summaries = new Map<string, ReputationSummary>();
  private seen = new Set<string>(); // recognitionId tracking for idempotency
  private dailyPairCounts = new Map<string, number>(); // sender:recipient:date -> count

  async appendEntry(entry: ReputationEntry): Promise<void> {
    // Idempotency check
    if (entry.recognitionId && this.seen.has(entry.recognitionId)) {
      console.log(`[Reputation] Skipping duplicate recognition: ${entry.recognitionId}`);
      return;
    }
    if (entry.recognitionId) {
      this.seen.add(entry.recognitionId);
    }

    // Don't sort on every append - just push for performance
    this.entries.push(entry);
    this.updateSummaryIncremental(entry);
    
    console.log(`[Reputation] ${entry.personaId}: ${entry.previousScore} → ${entry.newScore} (+${entry.deltaScore}) [${entry.lens}@${entry.spaceId}]`);
  }

  private updateSummaryIncremental(entry: ReputationEntry): void {
    let summary = this.summaries.get(entry.personaId);
    
    if (!summary) {
      summary = {
        personaId: entry.personaId,
        hederaAccountId: entry.hederaAccountId,
        totalScore: 0,
        scoresBySpace: {},
        scoresByLens: { genz: 0, professional: 0, social: 0, builder: 0 } as Record<LensType, number>,
        lastUpdated: entry.timestamp,
        entryCount: 0
      };
    }

    // Incremental updates instead of O(n) recomputation
    summary.totalScore += entry.deltaScore;
    summary.scoresBySpace[entry.spaceId] = (summary.scoresBySpace[entry.spaceId] ?? 0) + entry.deltaScore;
    summary.scoresByLens[entry.lens] = (summary.scoresByLens[entry.lens] ?? 0) + entry.deltaScore;
    summary.lastUpdated = entry.timestamp;
    summary.entryCount += 1;
    
    this.summaries.set(entry.personaId, summary);
  }

  async getPersonaSummary(personaId: string): Promise<ReputationSummary | null> {
    return this.summaries.get(personaId) || null;
  }

  async getAllSummaries(): Promise<ReputationSummary[]> {
    return Array.from(this.summaries.values()).sort((a, b) => b.totalScore - a.totalScore);
  }

  async getEntriesByPersona(personaId: string, limit = 50): Promise<ReputationEntry[]> {
    const filtered = this.entries.filter(entry => entry.personaId === personaId);
    // Sort only when querying, not on every append
    return filtered
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }

  async getEntriesBySpace(spaceId: string, limit = 100): Promise<ReputationEntry[]> {
    const filtered = this.entries.filter(entry => entry.spaceId === spaceId);
    return filtered
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }

  async getEntriesByLens(lens: LensType, limit = 100): Promise<ReputationEntry[]> {
    const filtered = this.entries.filter(entry => entry.lens === lens);
    return filtered
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }

  async getLeaderboard(
    spaceId?: string,
    lens?: LensType,
    limit = 10
  ): Promise<Array<{ personaId: string; score: number; rank: number }>> {
    const summaries = Array.from(this.summaries.values());
    
    let scores = summaries.map(s => ({
      personaId: s.personaId,
      score: spaceId 
        ? (s.scoresBySpace[spaceId] || 0)
        : lens
        ? s.scoresByLens[lens]
        : s.totalScore
    }));
    
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, limit);
    
    return scores.map((s, index) => ({
      ...s,
      rank: index + 1
    }));
  }

  // Anti-gaming: track daily pair interactions
  getDailyPairCount(senderId: string, recipientId: string, date: string): number {
    const key = `${senderId}:${recipientId}:${date}`;
    return this.dailyPairCounts.get(key) || 0;
  }

  incrementDailyPairCount(senderId: string, recipientId: string, date: string): number {
    const key = `${senderId}:${recipientId}:${date}`;
    const count = (this.dailyPairCounts.get(key) || 0) + 1;
    this.dailyPairCounts.set(key, count);
    return count;
  }

  // Initialize persona with starting reputation
  async initializePersona(
    personaId: string,
    hederaAccountId: string,
    initialScore: number,
    lens: LensType = 'professional'
  ): Promise<void> {
    const entry: ReputationEntry = {
      entryId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      personaId,
      hederaAccountId,
      spaceId: '__initial__',
      lens,
      previousScore: 0,
      deltaScore: initialScore,
      newScore: initialScore,
      reason: 'Initial reputation score',
      multiplier: 1.0,
      basePoints: initialScore
    };

    await this.appendEntry(entry);
  }

  // Reset all data (for demo purposes)
  reset(): void {
    this.entries = [];
    this.summaries.clear();
    this.seen.clear();
    this.dailyPairCounts.clear();
  }

  // Get entry count for debugging
  getEntryCount(): number {
    return this.entries.length;
  }
}

// Reputation scoring logic with bounds checking and anti-gaming
export class ReputationEngine {
  private storage = new MockReputationStorage();
  private guards?: ReputationGuards;

  constructor(guards?: ReputationGuards) {
    this.guards = guards;
  }

  // Lens-specific scoring with clamped multipliers
  private readonly LENS_SCORING = {
    genz: { basePoints: 3, multiplierRange: [1.0, 1.5] as const },
    professional: { basePoints: 10, multiplierRange: [1.0, 2.0] as const },
    social: { basePoints: 5, multiplierRange: [1.0, 1.8] as const },
    builder: { basePoints: 20, multiplierRange: [1.5, 3.0] as const }
  };

  // Diminishing returns schedule for repeated sender->recipient
  private readonly DIMINISHING_RETURNS = [1.0, 0.8, 0.6, 0.5, 0.3, 0.1];

  async calculateReputationDelta(
    lens: LensType,
    category: ReputationCategory,
    recognitionContext: {
      senderPersonaId: string;
      recipientPersonaId: string;
      spaceId: string;
      title: string;
      timestamp: string;
    }
  ): Promise<{ deltaScore: number; multiplier: number; basePoints: number; reason: string; diminishingFactor: number }> {
    const lensConfig = this.LENS_SCORING[lens];
    const basePoints = lensConfig.basePoints;
    const [minM, maxM] = lensConfig.multiplierRange;
    const multiplierRange = maxM - minM;
    
    // Category-based multiplier adjustments
    const categoryMultipliers: Record<ReputationCategory, number> = {
      // High-value categories
      'leadership': 0.8, 'innovation': 0.7, 'mentorship': 0.9, 'technical_guidance': 0.8,
      
      // Medium-value categories  
      'collaboration': 0.5, 'reliability': 0.6, 'communication': 0.4, 'peer_support': 0.3,
      'social_impact': 0.6, 'community_building': 0.5, 'career_development': 0.4,
      
      // Base categories
      'delivery': 0.2, 'process_improvement': 0.3, 'networking': 0.2, 'study_group': 0.3,
      'business_value': 0.4, 'partnership': 0.5, 'team_coordination': 0.3,
      'cross_collaboration': 0.4, 'learning': 0.2, 'community_engagement': 0.3,
      'advocacy': 0.4, 'skill_verification': 0.5, 'professional_growth': 0.4
    };
    
    let multiplier = minM + multiplierRange * (categoryMultipliers[category] || 0.1);
    
    // Space context bonuses
    if (recognitionContext.spaceId.includes('startup-lab') && lens === 'professional') {
      multiplier += 0.2;
    }
    if (recognitionContext.spaceId.includes('campus-hub') && lens === 'genz') {
      multiplier += 0.3;
    }
    
    // Clamp multiplier to valid range
    multiplier = Math.max(minM, Math.min(multiplier, maxM));
    
    // Anti-gaming: diminishing returns for repeated sender->recipient
    const date = recognitionContext.timestamp.split('T')[0]; // YYYY-MM-DD
    const dailyCount = this.storage.incrementDailyPairCount(
      recognitionContext.senderPersonaId,
      recognitionContext.recipientPersonaId,
      date
    );
    
    const diminishingFactor = this.DIMINISHING_RETURNS[Math.min(dailyCount - 1, this.DIMINISHING_RETURNS.length - 1)] || 0.1;
    
    const deltaScore = Math.round(basePoints * multiplier * diminishingFactor);
    const reason = `${lens} recognition for ${category} in ${recognitionContext.spaceId}${diminishingFactor < 1 ? ` (${dailyCount}x today, ${Math.round(diminishingFactor * 100)}%)` : ''}`;
    
    return { deltaScore, multiplier, basePoints, reason, diminishingFactor };
  }

  async updatePersonaReputation(input: {
    personaId: string;
    hederaAccountId: string;
    spaceId: string;
    lens: LensType;
    category: ReputationCategory;
    recognitionId: string;
    context: { senderPersonaId: string; title: string };
    ts?: string;
  }): Promise<ReputationEntry> {
    const timestamp = input.ts || new Date().toISOString();
    
    return withPersonaLock(input.personaId, async () => {
      // Anti-gaming guard check
      if (this.guards) {
        const canApply = await this.guards.canApplyDelta({
          senderId: input.context.senderPersonaId,
          recipientId: input.personaId,
          spaceId: input.spaceId,
          lens: input.lens,
          ts: timestamp
        });
        
        if (!canApply) {
          throw new Error(`Reputation delta blocked by guards: ${input.context.senderPersonaId} -> ${input.personaId}`);
        }
      }

      // Get current reputation
      const currentSummary = await this.storage.getPersonaSummary(input.personaId);
      const currentScore = currentSummary?.totalScore || 0;
      
      // Calculate delta with anti-gaming
      const { deltaScore, multiplier, basePoints, reason, diminishingFactor } = 
        await this.calculateReputationDelta(
          input.lens,
          input.category,
          {
            senderPersonaId: input.context.senderPersonaId,
            recipientPersonaId: input.personaId,
            spaceId: input.spaceId,
            title: input.context.title,
            timestamp
          }
        );
      
      // Create reputation entry
      const entry: ReputationEntry = {
        entryId: crypto.randomUUID(),
        timestamp,
        personaId: input.personaId,
        hederaAccountId: input.hederaAccountId,
        spaceId: input.spaceId,
        lens: input.lens,
        previousScore: currentScore,
        deltaScore,
        newScore: currentScore + deltaScore,
        recognitionId: input.recognitionId,
        category: input.category,
        sourcePersonaId: input.context.senderPersonaId,
        reason,
        multiplier,
        basePoints,
        diminishingFactor
      };
      
      await this.storage.appendEntry(entry);
      return entry;
    });
  }

  async initializePersona(
    personaId: string, 
    hederaAccountId: string,
    initialScore: number,
    lens: LensType = 'professional'
  ): Promise<void> {
    await this.storage.initializePersona(personaId, hederaAccountId, initialScore, lens);
  }

  // Query methods
  async getPersonaSummary(personaId: string): Promise<ReputationSummary | null> {
    return this.storage.getPersonaSummary(personaId);
  }

  async getAllSummaries(): Promise<ReputationSummary[]> {
    return this.storage.getAllSummaries();
  }

  async getLeaderboard(params?: { 
    spaceId?: string; 
    lens?: LensType; 
    limit?: number; 
  }): Promise<Array<{ personaId: string; score: number; rank: number }>> {
    const { spaceId, lens, limit = 10 } = params || {};
    return this.storage.getLeaderboard(spaceId, lens, limit);
  }

  async getPersonaHistory(personaId: string): Promise<ReputationEntry[]> {
    return this.storage.getEntriesByPersona(personaId);
  }

  // Demo utilities
  reset(): void {
    this.storage.reset();
    // Clear persona locks
    personaLocks.clear();
  }

  getEntryCount(): number {
    return this.storage.getEntryCount();
  }
}

// Clean interface for Context Engine integration
export interface ReputationPort {
  updatePersonaReputation(input: {
    personaId: string;
    hederaAccountId: string;
    spaceId: string;
    lens: LensType;
    category: ReputationCategory;
    recognitionId: string;
    context: { senderPersonaId: string; title: string };
    ts?: string;
  }): Promise<ReputationEntry>;

  getPersonaSummary(personaId: string): Promise<ReputationSummary | null>;
  getLeaderboard(params?: { spaceId?: string; lens?: LensType; limit?: number }): Promise<Array<{ personaId: string; score: number; rank: number }>>;
}

// Global instance implementing the clean interface
class ReputationPortImpl implements ReputationPort {
  private engine: ReputationEngine;

  constructor() {
    this.engine = new ReputationEngine();
  }

  async updatePersonaReputation(input: {
    personaId: string;
    hederaAccountId: string;
    spaceId: string;
    lens: LensType;
    category: ReputationCategory;
    recognitionId: string;
    context: { senderPersonaId: string; title: string };
    ts?: string;
  }): Promise<ReputationEntry> {
    return this.engine.updatePersonaReputation(input);
  }

  async getPersonaSummary(personaId: string): Promise<ReputationSummary | null> {
    return this.engine.getPersonaSummary(personaId);
  }

  async getLeaderboard(params?: { spaceId?: string; lens?: LensType; limit?: number }): Promise<Array<{ personaId: string; score: number; rank: number }>> {
    return this.engine.getLeaderboard(params);
  }

  // Internal methods for demo management
  getEngine(): ReputationEngine {
    return this.engine;
  }
}

let globalReputationPort: ReputationPortImpl;

export function getReputationPort(): ReputationPortImpl {
  if (!globalReputationPort) {
    globalReputationPort = new ReputationPortImpl();
  }
  return globalReputationPort;
}

// Export the engine for advanced use cases
export function getReputationEngine(): ReputationEngine {
  return getReputationPort().getEngine();
}