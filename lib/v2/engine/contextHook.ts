import { z } from 'zod';
import { getSpaceById } from './spaceRegistry';
import { evaluatePolicy } from './policyEngine';
import { SettlementPort } from '../ports/SettlementPort';
import { createMatterFiAdapter } from '../adapters/MatterFiSettlementAdapter';
import { Recognition, RecognitionLens } from '../schema/tm.recognition@1';

// Helpers for safe parsing and validation
const DIGITS = /^[0-9]+$/;
const toMinor = (v?: string) => (v && DIGITS.test(v)) ? v : null;

const safeReg = (pattern: string): RegExp | null => {
  try {
    // minimal guard: disallow catastrophic nested groups
    if (pattern.length > 256) return null;
    return new RegExp(pattern);
  } catch { return null; }
};

// resolve TokenRef from space treasury (simplified)
function tokenFromSpace(space: any): { token: { symbol: string; network: 'hedera'|'polygon'|'base'; id: string; decimals: number } } {
  // You likely have this in your space schema; adjust as needed.
  const network = space.treasuryConfig?.network ?? 'hedera';
  const id = space.treasuryConfig?.trstTokenId ?? '0.0.TRST'; // placeholder for Hedera; EVM would be 0x...
  const decimals = space.treasuryConfig?.tokenDecimals ?? 18;
  const symbol = space.treasuryConfig?.tokenSymbol ?? 'TRST';
  return { token: { symbol, network, id, decimals } };
}

// Context Hook Configuration Schema
const ContextRuleSchema = z.object({
  ruleId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  priority: z.number().default(100), // Lower = higher priority
  
  // Trigger conditions
  triggers: z.object({
    lensTypes: z.array(z.enum(['genz', 'professional', 'social', 'builder'])).optional(),
    spaceIds: z.array(z.string()).optional(),
    amountRange: z.object({
      min: z.string().optional(), // BigInt string
      max: z.string().optional()
    }).optional(),
    senderPatterns: z.array(z.string()).optional(), // Regex patterns
    recipientPatterns: z.array(z.string()).optional(),
    metadataFilters: z.record(z.any()).optional()
  }),
  
  // Reward action
  action: z.object({
    type: z.enum(['mint', 'transfer', 'burn', 'none']),
    targetSpace: z.string().optional(), // Space to mint/transfer to
    amount: z.string(), // BigInt string - base amount
    multiplier: z.number().default(1.0), // Dynamic multiplier
    metadata: z.record(z.any()).optional()
  }),
  
  // Rate limiting
  limits: z.object({
    perUser: z.object({
      count: z.number(),
      window: z.number() // seconds
    }).optional(),
    perSpace: z.object({
      count: z.number(), 
      window: z.number()
    }).optional(),
    global: z.object({
      count: z.number(),
      window: z.number()
    }).optional()
  }).optional()
});

type ContextRule = z.infer<typeof ContextRuleSchema>;

// Processing result
interface ContextProcessingResult {
  processed: boolean;
  ruleMatched?: string;
  rewardTriggered?: boolean;
  settlementTxId?: string;
  error?: string;
  metadata: {
    recognitionId: string;
    timestamp: string;
    processingTimeMs: number;
    rulesPrioritized: string[];
    rateLimitHit?: boolean;
  };
}

// In-memory cache for rate limiting (production would use Redis)
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

class ContextEngine {
  private settlementPort: SettlementPort;
  private rules: ContextRule[] = [];
  private enabled = true;

  constructor(settlementPort?: SettlementPort) {
    this.settlementPort = settlementPort || createMatterFiAdapter(); // uses env
    this.loadDefaultRules();
  }

  /**
   * Load default reward rules for common recognition patterns
   */
  private loadDefaultRules(): void {
    const defaultRules: ContextRule[] = [
      // GenZ Lens: Peer recognition with small rewards
      {
        ruleId: 'genz-peer-reward',
        name: 'GenZ Peer Recognition Reward',
        description: 'Small TRST reward for peer recognition in GenZ lens',
        enabled: true,
        priority: 10,
        triggers: {
          lensTypes: ['genz'],
          amountRange: { min: '1', max: '100' }
        },
        action: {
          type: 'mint',
          amount: '5', // 5 TRST base
          multiplier: 1.0,
          metadata: { source: 'genz_peer_recognition' }
        },
        limits: {
          perUser: { count: 10, window: 86400 }, // 10 per day
          perSpace: { count: 100, window: 86400 } // 100 per space per day
        }
      },

      // Professional Lens: Performance-based rewards
      {
        ruleId: 'professional-performance',
        name: 'Professional Performance Reward',
        description: 'Higher rewards for professional achievements',
        enabled: true,
        priority: 5,
        triggers: {
          lensTypes: ['professional'],
          amountRange: { min: '10' }
        },
        action: {
          type: 'mint',
          amount: '25', // 25 TRST base
          multiplier: 2.0, // Double the recognition amount
          metadata: { source: 'professional_performance' }
        },
        limits: {
          perUser: { count: 5, window: 86400 },
          perSpace: { count: 50, window: 86400 }
        }
      },

      // Social Lens: Community engagement
      {
        ruleId: 'social-engagement',
        name: 'Social Engagement Reward',
        description: 'Rewards for social contributions and engagement',
        enabled: true,
        priority: 15,
        triggers: {
          lensTypes: ['social']
        },
        action: {
          type: 'mint',
          amount: '3', // 3 TRST base
          multiplier: 1.5,
          metadata: { source: 'social_engagement' }
        },
        limits: {
          perUser: { count: 20, window: 86400 },
          perSpace: { count: 200, window: 86400 }
        }
      },

      // Builder Lens: Innovation rewards
      {
        ruleId: 'builder-innovation',
        name: 'Builder Innovation Reward',
        description: 'High rewards for builder contributions and innovation',
        enabled: true,
        priority: 1, // Highest priority
        triggers: {
          lensTypes: ['builder'],
          amountRange: { min: '1' }
        },
        action: {
          type: 'mint',
          amount: '50', // 50 TRST base
          multiplier: 3.0, // Triple multiplier
          metadata: { source: 'builder_innovation' }
        },
        limits: {
          perUser: { count: 3, window: 86400 },
          perSpace: { count: 20, window: 86400 }
        }
      }
    ];

    this.rules = defaultRules.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Process a recognition event and trigger appropriate rewards
   */
  async processRecognition(recognition: Recognition): Promise<ContextProcessingResult> {
    const startTime = Date.now();
    
    try {
      console.log(`[ContextHook] Processing recognition: ${recognition.id} (${recognition.lens})`);

      if (!this.enabled) {
        return {
          processed: false,
          error: 'Context engine disabled',
          metadata: {
            recognitionId: recognition.id,
            timestamp: new Date().toISOString(),
            processingTimeMs: Date.now() - startTime,
            rulesPrioritized: []
          }
        };
      }

      // 1) Policy check first
      const space = await getSpaceById(recognition.spaceId);
      if (!space) {
        throw new Error(`Space not found: ${recognition.spaceId}`);
      }

      const policyResult = await evaluatePolicy({
        action: 'settlement.mint',  // <- FIX: use canonical policy action
        actorId: recognition.senderId,
        targetId: recognition.recipientId,
        spaceId: recognition.spaceId,
        amount: recognition.amount, // must be minor-units
        metadata: { lens: recognition.lens, recognitionId: recognition.id }
      });

      if (!policyResult.allowed) {
        console.log(`[ContextHook] Policy denied: ${policyResult.reason}`);
        return {
          processed: false,
          error: `Policy violation: ${policyResult.reason}`,
          metadata: {
            recognitionId: recognition.id,
            timestamp: new Date().toISOString(),
            processingTimeMs: Date.now() - startTime,
            rulesPrioritized: []
          }
        };
      }

      // 2) Find matching rule
      const rulesPrioritized = this.rules.filter(r => r.enabled).map(r => r.ruleId);
      const matchedRule = this.findMatchingRule(recognition);
      
      if (!matchedRule) {
        console.log(`[ContextHook] No matching rule for recognition: ${recognition.id}`);
        return {
          processed: true,
          metadata: {
            recognitionId: recognition.id,
            timestamp: new Date().toISOString(),
            processingTimeMs: Date.now() - startTime,
            rulesPrioritized
          }
        };
      }

      // 3) Rate limit check
      const rateLimitKey = this.getRateLimitKey(matchedRule, recognition);
      const rateLimitResult = this.checkRateLimit(matchedRule, rateLimitKey);
      
      if (!rateLimitResult.allowed) {
        console.log(`[ContextHook] Rate limit hit: ${rateLimitKey}`);
        return {
          processed: true,
          ruleMatched: matchedRule.ruleId,
          rewardTriggered: false,
          metadata: {
            recognitionId: recognition.id,
            timestamp: new Date().toISOString(),
            processingTimeMs: Date.now() - startTime,
            rulesPrioritized,
            rateLimitHit: true
          }
        };
      }

      // 4) Execute reward action
      let settlementTxId: string | undefined;
      
      if (matchedRule.action.type === 'mint') {
        // validate amounts as minor units
        const baseMinor = toMinor(matchedRule.action.amount);
        const recMinor  = toMinor(recognition.amount || '0');

        if (!baseMinor || !recMinor) {
          throw new Error('Invalid minor-unit amount in rule or recognition');
        }

        // multiplier: do integer math: final = base + floor(rec * multiplier)
        // Avoid float errors by scaling to 1e4
        const SCALE = 10_000n;
        const mult = BigInt(Math.round((matchedRule.action.multiplier ?? 1) * Number(SCALE)));
        const finalAmount = BigInt(baseMinor) + (BigInt(recMinor) * mult / SCALE);

        const targetSpace = matchedRule.action.targetSpace || recognition.spaceId;
        const { token } = tokenFromSpace(space);

        console.log(`[ContextHook] Minting ${finalAmount} TRST to space ${targetSpace} for ${recognition.recipientId}`);

        // SettlementPort: mintToSpace(spaceId, tokenRef, amountMinor, metadata)
        const res = await this.settlementPort.mintToSpace(
          targetSpace,
          token,
          finalAmount.toString(),
          {
            idempotencyKey: recognition.id, // dedupe
            purpose: 'recognition_reward',
            recognitionId: recognition.id,
            tags: {
              ruleId: matchedRule.ruleId,
              lens: recognition.lens,
              originalAmount: recMinor,
              multiplier: String(matchedRule.action.multiplier ?? 1)
            }
          }
        );

        // Update rate limit counter only if we actually minted
        this.updateRateLimit(rateLimitKey, rateLimitResult.resetTime);

        settlementTxId = res.txId;
        console.log(`[ContextHook] Reward triggered: ${settlementTxId}`);
      } else if (matchedRule.action.type === 'transfer' || matchedRule.action.type === 'burn') {
        // TODO: Implement transfer/burn actions if needed
        console.warn(`[ContextHook] Action type '${matchedRule.action.type}' not yet implemented`);
      }

      return {
        processed: true,
        ruleMatched: matchedRule.ruleId,
        rewardTriggered: !!settlementTxId,
        settlementTxId,
        metadata: {
          recognitionId: recognition.id,
          timestamp: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
          rulesPrioritized
        }
      };

    } catch (error: any) {
      console.error(`[ContextHook] Error processing recognition ${recognition.id}:`, error);
      
      return {
        processed: false,
        error: error.message || 'Unknown processing error',
        metadata: {
          recognitionId: recognition.id,
          timestamp: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
          rulesPrioritized: []
        }
      };
    }
  }

  /**
   * Find the first matching rule based on triggers (safe version)
   */
  private findMatchingRule(recognition: Recognition): ContextRule | null {
    const amtMinor = toMinor(recognition.amount || '');
    // If amount is present but invalid, no rule should match on amount range
    const amount = amtMinor ? BigInt(amtMinor) : null;

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      if (rule.triggers.lensTypes && !rule.triggers.lensTypes.includes(recognition.lens)) continue;
      if (rule.triggers.spaceIds && !rule.triggers.spaceIds.includes(recognition.spaceId)) continue;

      if (rule.triggers.amountRange && amount !== null) {
        const min = rule.triggers.amountRange.min && DIGITS.test(rule.triggers.amountRange.min) ? BigInt(rule.triggers.amountRange.min) : null;
        const max = rule.triggers.amountRange.max && DIGITS.test(rule.triggers.amountRange.max) ? BigInt(rule.triggers.amountRange.max) : null;
        if (min !== null && amount < min) continue;
        if (max !== null && amount > max) continue;
      }

      if (rule.triggers.senderPatterns) {
        const ok = rule.triggers.senderPatterns.some(p => {
          const re = safeReg(p);
          return re ? re.test(recognition.senderId) : false;
        });
        if (!ok) continue;
      }

      if (rule.triggers.recipientPatterns) {
        const ok = rule.triggers.recipientPatterns.some(p => {
          const re = safeReg(p);
          return re ? re.test(recognition.recipientId) : false;
        });
        if (!ok) continue;
      }

      return rule;
    }
    return null;
  }

  /**
   * Generate rate limit key (scoped by space for perUser)
   */
  private getRateLimitKey(rule: ContextRule, recognition: Recognition): string {
    if (rule.limits?.perUser) {
      return `user:${rule.ruleId}:${recognition.spaceId}:${recognition.recipientId}`;
    } else if (rule.limits?.perSpace) {
      return `space:${rule.ruleId}:${recognition.spaceId}`;
    } else if (rule.limits?.global) {
      return `global:${rule.ruleId}`;
    }
    return `none:${rule.ruleId}`;
  }

  /**
   * Check if action is within rate limits
   */
  private checkRateLimit(rule: ContextRule, key: string): { allowed: boolean; resetTime: number } {
    if (!rule.limits) return { allowed: true, resetTime: 0 };

    const limit = rule.limits.perUser || rule.limits.perSpace || rule.limits.global;
    if (!limit) return { allowed: true, resetTime: 0 };

    const now = Date.now();
    const windowMs = limit.window * 1000;
    const resetTime = now + windowMs;
    
    const cached = rateLimitCache.get(key);
    
    if (!cached || now > cached.resetTime) {
      // Reset window
      return { allowed: true, resetTime };
    }
    
    if (cached.count >= limit.count) {
      return { allowed: false, resetTime: cached.resetTime };
    }
    
    return { allowed: true, resetTime: cached.resetTime };
  }

  /**
   * Update rate limit counter
   */
  private updateRateLimit(key: string, resetTime: number): void {
    const cached = rateLimitCache.get(key);
    
    if (!cached || Date.now() > cached.resetTime) {
      rateLimitCache.set(key, { count: 1, resetTime });
    } else {
      rateLimitCache.set(key, { count: cached.count + 1, resetTime: cached.resetTime });
    }
  }

  /**
   * Admin methods for rule management
   */
  addRule(rule: ContextRule): void {
    ContextRuleSchema.parse(rule); // Validate
    this.rules.push(rule);
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(r => r.ruleId === ruleId);
    if (index >= 0) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  getRules(): ContextRule[] {
    return [...this.rules];
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Singleton instance
const contextEngine = new ContextEngine();

/**
 * Main export: Process recognition event through context engine
 */
export async function processRecognitionContext(recognition: Recognition): Promise<ContextProcessingResult> {
  return contextEngine.processRecognition(recognition);
}

/**
 * Admin exports for rule management
 */
export { ContextEngine, ContextRule, ContextProcessingResult };
export const getContextEngine = () => contextEngine;