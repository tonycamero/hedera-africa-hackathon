/**
 * Policy Engine - TrustMesh v2
 * 
 * Space-level RBAC enforcement and treasury rules for cannabis compliance
 * Integrates with CraftTrust facility-scoped permissions and regulatory requirements
 */

import type { TMSpaceV1, TreasuryConfig, RecognitionPolicy, RBACConfig } from '../schema/tm.space@1';
import type { ContactResolution, AccountRef } from '../util/resolveContact';
import type { LensType } from '../schema/tm.recognition@1';

// Timezone-aware business hours utility
function withinHours(tz: string, start: string, end: string, nowISO?: string): boolean {
  // Mock DateTime implementation (replace with luxon in production)
  const now = nowISO ? new Date(nowISO) : new Date();
  const [sh, sm = 0] = start.split(':').map(Number);
  const [eh, em = 0] = end.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  const curMins = now.getHours() * 60 + now.getMinutes();
  
  // Support overnight windows (e.g., 20:00–06:00)
  return startMins <= endMins 
    ? (curMins >= startMins && curMins <= endMins)
    : (curMins >= startMins || curMins <= endMins);
}

// Safe minor unit parsing with validation
const MINOR_RE = /^[0-9]+$/;
function parseMinor(v?: string): bigint | null {
  if (!v) return null;
  if (!MINOR_RE.test(v)) return null;
  return BigInt(v);
}

// Policy evaluation result with deterministic decision payload
export interface PolicyEvaluation {
  decisionId: string;        // UUID for audit trails
  policyVersion: 'v2.0';     // Bump when rules change
  allowed: boolean;
  reason?: string;
  violations: PolicyViolation[];
  normalized: Required<Pick<PolicyContext, 'spaceId' | 'actorId' | 'action'>> & { 
    amount?: string; 
    lens?: LensType;
    targetId?: string;
  };
  metadata: {
    appliedPolicies: string[];
    evaluationTime: number;
    riskScore: number;
  };
}

// Policy violation details
export interface PolicyViolation {
  code: string;
  message: string;
  severity: 'warning' | 'error' | 'critical';
  category: 'rbac' | 'treasury' | 'compliance' | 'limits';
  context?: any;
}

// Enhanced action types for cannabis treasury
export type PolicyAction = 
  | 'recognition.create'
  | 'recognition.approve'
  | 'recognition.moderate'
  | 'settlement.mint'
  | 'settlement.transfer'
  | 'settlement.burn'
  | 'treasury.view_balance'
  | 'treasury.view_history'
  | 'treasury.configure'
  | 'space.configure'
  | 'space.invite_member'
  | 'compliance.export'
  | 'compliance.audit'
  | 'facility.license_check'
  | 'seed_to_sale.trace';

// Policy context for evaluation
export interface PolicyContext {
  spaceId: string;
  actorId: string;           // Account performing the action
  targetId?: string;         // Target account (for transfers, etc.)
  action: PolicyAction;
  amount?: string;           // For financial operations (in minor units)
  lens?: LensType;           // For recognition operations
  metadata?: any;            // Additional context
}

// Separated treasury and recognition scopes
export type TreasuryScope = 
  | 'treasury:read'
  | 'treasury:balances.read'
  | 'treasury:tx.read'
  | 'treasury:tx.create'
  | 'treasury:invoice.create'
  | 'treasury:invoice.read'
  | 'treasury:settlement.read'
  | 'treasury:config.write'
  | 'treasury:export'
  | 'treasury:dev.mint'
  | 'treasury:compliance.read'
  | 'treasury:compliance.write';

export type RecognitionScope = 
  | 'recognition:create'
  | 'recognition:approve'
  | 'recognition:moderate'
  | 'recognition:view';

export type PolicyScope = TreasuryScope | RecognitionScope;

// Cannabis-specific compliance rules
export interface CannabisComplianceRules {
  requiresKYC: boolean;
  requiresKYB: boolean;
  maxDailyTransfers: string;   // Minor units
  maxSingleTransfer: string;   // Minor units  
  allowedBusinessHours: {
    start: string;             // "09:00"
    end: string;               // "17:00"
    timezone: string;          // "America/Los_Angeles"
  };
  blockedJurisdictions: string[];
  facilityLicenseRequired: boolean;
  seedToSaleTraceability: boolean;
}

// Policy engine errors
export class PolicyEngineError extends Error {
  constructor(
    message: string,
    public code: 'POLICY_VIOLATION' | 'SPACE_NOT_FOUND' | 'INVALID_CONTEXT' | 'EVALUATION_ERROR',
    public violations?: PolicyViolation[]
  ) {
    super(message);
    this.name = 'PolicyEngineError';
  }
}

// Mock space registry with CraftTrust facility integration
class MockSpaceRegistry {
  private spaces = new Map<string, TMSpaceV1>();
  private userCapabilities = new Map<string, Map<string, PolicyScope[]>>();

  constructor() {
    this.seedCannabisSpaces();
  }

  private seedCannabisSpaces() {
    // Green Valley Dispensary space with cannabis compliance
    const greenValleySpace: TMSpaceV1 = {
      schema: 'tm.space@1',
      spaceId: 'tm.v2.crafttrust.dispensary-1',
      metadata: {
        name: 'Green Valley Dispensary',
        description: 'California licensed cannabis dispensary',
        category: 'cannabis',
        tags: ['cannabis', 'dispensary', 'california', 'licensed']
      },
      treasuryConfig: {
        settlementProvider: 'matterfi',
        tokenSymbol: 'TRST',
        tokenDecimals: 18,
        custodialAccountId: 'acct_dispensary_1',
        dailyMintLimit: 100000000, // $100k in minor units  
        maxSingleTransfer: 50000000, // $50k in minor units
        requiresApproval: true,
        autoSettlement: false // Manual oversight for cannabis compliance
      },
      recognitionPolicy: {
        allowedLenses: ['professional', 'social'],
        maxRecognitionsPerDay: 50,
        requiresModeration: true,
        autoApprove: false,
        enableRewards: true,
        rewardMultiplier: 1.0,
        requiresEvidence: true // Cannabis operations require proof
      },
      rbacConfig: {
        roles: [
          {
            roleId: 'owner',
            name: 'Facility Owner',
            description: 'Licensed facility owner with full control',
            permissions: ['*']
          },
          {
            roleId: 'finance_manager', 
            name: 'Finance Manager',
            description: 'Treasury operations and compliance manager',
            permissions: ['treasury:*', 'recognition:*', 'compliance:*']
          },
          {
            roleId: 'clerk',
            name: 'Dispensary Clerk',
            description: 'Point-of-sale and basic recognition operations',
            permissions: ['recognition:create', 'treasury:balances.read', 'treasury:invoice.create']
          },
          {
            roleId: 'viewer',
            name: 'Compliance Viewer',
            description: 'Read-only access for auditors and regulators',
            permissions: ['treasury:read', 'recognition:view', 'compliance:read']
          }
        ],
        defaultRole: 'clerk',
        requiresInvitation: true,
        allowSelfRegistration: false
      },
      complianceConfig: {
        retentionPeriod: 2555, // 7 years for cannabis compliance
        requiresAuditLog: true,
        requiresKYC: true,
        requiresKYB: true,
        jurisdiction: 'US-CA',
        complianceFramework: ['280E', 'CA-CDPH', 'CA-DCC', 'CDFA']
      },
      adminAccountIds: ['0.0.12345'],
      ownerAccountId: '0.0.12345',
      hcsTopicId: '0.0.6895261',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.spaces.set(greenValleySpace.spaceId, greenValleySpace);

    // Seed CraftTrust RBAC capabilities
    const ownerScopes: PolicyScope[] = [
      'treasury:read', 'treasury:balances.read', 'treasury:tx.read', 'treasury:tx.create',
      'treasury:invoice.create', 'treasury:invoice.read', 'treasury:settlement.read',
      'treasury:config.write', 'treasury:export', 'treasury:compliance.read',
      'treasury:compliance.write', 'treasury:dev.mint',
      'recognition:create', 'recognition:approve', 'recognition:moderate', 'recognition:view'
    ];
    
    const financeScopes: PolicyScope[] = [
      'treasury:read', 'treasury:balances.read', 'treasury:tx.read', 'treasury:tx.create',
      'treasury:invoice.create', 'treasury:invoice.read', 'treasury:settlement.read',
      'treasury:export', 'treasury:compliance.read', 'treasury:compliance.write',
      'recognition:create', 'recognition:approve', 'recognition:view'
    ];
    
    const clerkScopes: PolicyScope[] = [
      'treasury:read', 'treasury:balances.read', 'treasury:invoice.create', 'treasury:invoice.read',
      'recognition:create', 'recognition:view'
    ];

    const viewerScopes: PolicyScope[] = [
      'treasury:read', 'treasury:balances.read', 'recognition:view'
    ];

    // Map accounts to capabilities
    this.setUserCapabilities('0.0.12345', greenValleySpace.spaceId, ownerScopes);       // Owner
    this.setUserCapabilities('0.0.12346', greenValleySpace.spaceId, financeScopes);     // Finance Manager  
    this.setUserCapabilities('acct_gv_clerk', greenValleySpace.spaceId, clerkScopes);   // Clerk
    this.setUserCapabilities('0.0.98765', greenValleySpace.spaceId, viewerScopes);      // External Auditor
  }

  private setUserCapabilities(accountId: string, spaceId: string, scopes: PolicyScope[]) {
    if (!this.userCapabilities.has(accountId)) {
      this.userCapabilities.set(accountId, new Map());
    }
    this.userCapabilities.get(accountId)!.set(spaceId, scopes);
  }

  async getSpace(spaceId: string): Promise<TMSpaceV1 | null> {
    return this.spaces.get(spaceId) || null;
  }

  async getUserCapabilities(accountId: string, spaceId: string): Promise<PolicyScope[]> {
    const userCaps = this.userCapabilities.get(accountId);
    return userCaps?.get(spaceId) || [];
  }
}

// Main Policy Engine with cannabis compliance
export class PolicyEngine {
  private spaceRegistry: MockSpaceRegistry;
  private complianceRules: CannabisComplianceRules;

  constructor(spaceRegistry?: MockSpaceRegistry) {
    this.spaceRegistry = spaceRegistry || new MockSpaceRegistry();
    this.complianceRules = {
      requiresKYC: true,
      requiresKYB: true,
      maxDailyTransfers: '1000000000', // $1M daily limit for cannabis operations
      maxSingleTransfer: '500000000',  // $500k single transfer limit
      allowedBusinessHours: {
        start: '06:00', // Cannabis business hours (California typical)
        end: '22:00',
        timezone: 'America/Los_Angeles'
      },
      blockedJurisdictions: ['CN', 'KP', 'IR', 'AF'], // Federal sanctions + high-risk
      facilityLicenseRequired: true,
      seedToSaleTraceability: true
    };
  }

  /**
   * Evaluate policy with deterministic decision payload
   */
  async evaluatePolicy(context: PolicyContext, actorContact?: ContactResolution, targetContact?: ContactResolution): Promise<PolicyEvaluation> {
    const startTime = Date.now();
    const decisionId = crypto.randomUUID();
    const violations: PolicyViolation[] = [];
    const appliedPolicies: string[] = [];

    try {
      const space = await this.spaceRegistry.getSpace(context.spaceId);
      if (!space) {
        throw new PolicyEngineError(`Space not found: ${context.spaceId}`, 'SPACE_NOT_FOUND');
      }

      // RBAC evaluation
      const rbacViolations = await this.evaluateRBAC(context, space, actorContact);
      if (rbacViolations.length) {
        violations.push(...rbacViolations);
        appliedPolicies.push('rbac');
      }

      // Treasury limits evaluation
      if (this.isTreasuryAction(context.action)) {
        const treasuryViolations = await this.evaluateTreasuryLimits(context, space);
        if (treasuryViolations.length) {
          violations.push(...treasuryViolations);
          appliedPolicies.push('treasury_limits');
        }
      }

      // Compliance evaluation (enhanced for cannabis)
      const complianceViolations = await this.evaluateCompliance(context, space, actorContact, targetContact);
      if (complianceViolations.length) {
        violations.push(...complianceViolations);
        appliedPolicies.push('compliance');
      }

      // Recognition policy evaluation
      if (context.action.startsWith('recognition.')) {
        const recognitionViolations = await this.evaluateRecognitionPolicy(context, space);
        if (recognitionViolations.length) {
          violations.push(...recognitionViolations);
          appliedPolicies.push('recognition_policy');
        }
      }

      // Only critical violations block execution
      const allowed = violations.every(v => v.severity !== 'critical');

      return {
        decisionId,
        policyVersion: 'v2.0',
        allowed,
        reason: allowed 
          ? undefined 
          : `Policy violations: ${violations.filter(v => v.severity === 'critical').map(v => v.code).join(',')}`,
        violations,
        normalized: {
          spaceId: context.spaceId,
          actorId: context.actorId,
          action: context.action,
          amount: context.amount,
          lens: context.lens,
          targetId: context.targetId
        },
        metadata: {
          appliedPolicies,
          evaluationTime: Date.now() - startTime,
          riskScore: this.calculateRiskScore(violations, context)
        }
      };

    } catch (error) {
      throw new PolicyEngineError(
        `Policy evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EVALUATION_ERROR'
      );
    }
  }

  /**
   * Check if user has specific scope in space
   */
  async hasScope(actorId: string, spaceId: string, requiredScope: PolicyScope): Promise<boolean> {
    try {
      const userScopes = await this.spaceRegistry.getUserCapabilities(actorId, spaceId);
      return userScopes.includes(requiredScope) || 
             userScopes.includes('treasury:*' as PolicyScope) ||
             userScopes.includes('recognition:*' as PolicyScope);
    } catch (error) {
      console.warn(`Failed to check scope ${requiredScope} for ${actorId} in ${spaceId}:`, error);
      return false;
    }
  }

  /**
   * Get effective permissions for user in space  
   */
  async getUserPermissions(actorId: string, spaceId: string): Promise<PolicyScope[]> {
    return this.spaceRegistry.getUserCapabilities(actorId, spaceId);
  }

  // Private evaluation methods
  private async evaluateRBAC(context: PolicyContext, space: TMSpaceV1, actorContact?: ContactResolution): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];

    // Map actions to required scopes (separated treasury vs recognition)
    const scopeMapping: Record<PolicyAction, PolicyScope> = {
      'recognition.create': 'recognition:create',
      'recognition.approve': 'recognition:approve', 
      'recognition.moderate': 'recognition:moderate',
      'settlement.mint': 'treasury:tx.create',
      'settlement.transfer': 'treasury:tx.create',
      'settlement.burn': 'treasury:tx.create',
      'treasury.view_balance': 'treasury:balances.read',
      'treasury.view_history': 'treasury:tx.read',
      'treasury.configure': 'treasury:config.write',
      'space.configure': 'treasury:config.write',
      'space.invite_member': 'treasury:config.write',
      'compliance.export': 'treasury:export',
      'compliance.audit': 'treasury:compliance.read',
      'facility.license_check': 'treasury:compliance.read',
      'seed_to_sale.trace': 'treasury:compliance.read'
    };

    const requiredScope = scopeMapping[context.action];
    if (requiredScope) {
      const hasPermission = await this.hasScope(context.actorId, context.spaceId, requiredScope);
      if (!hasPermission) {
        violations.push({
          code: 'RBAC_INSUFFICIENT_PERMISSIONS',
          message: `Actor ${context.actorId} lacks required scope: ${requiredScope}`,
          severity: 'critical',
          category: 'rbac',
          context: { requiredScope, action: context.action }
        });
      }
    }

    return violations;
  }

  private async evaluateTreasuryLimits(context: PolicyContext, space: TMSpaceV1): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];
    const cfg = space.treasuryConfig;
    const amt = parseMinor(context.amount || '');

    // Validate amount format first
    if (context.amount && !amt) {
      violations.push({
        code: 'AMOUNT_INVALID',
        message: 'Amount must be minor units (digits only)',
        severity: 'critical',
        category: 'treasury'
      });
      return violations;
    }

    if (!amt) return violations;

    // Single transaction limit
    if (cfg.maxSingleTransfer && amt > BigInt(cfg.maxSingleTransfer)) {
      violations.push({
        code: 'TREASURY_SINGLE_LIMIT_EXCEEDED',
        message: `Amount ${context.amount} exceeds single transfer limit ${cfg.maxSingleTransfer}`,
        severity: 'critical',
        category: 'treasury',
        context: { amount: context.amount, limit: cfg.maxSingleTransfer }
      });
    }

    // Daily mint limit (for cannabis compliance)
    if (context.action === 'settlement.mint' && cfg.dailyMintLimit && amt > BigInt(cfg.dailyMintLimit)) {
      violations.push({
        code: 'TREASURY_DAILY_MINT_EXCEEDED',
        message: 'Mint amount exceeds daily limit',
        severity: 'error',
        category: 'treasury',
        context: { amount: context.amount, dailyLimit: cfg.dailyMintLimit }
      });
    }

    // Approval required (non-blocking but actionable)
    if (cfg.requiresApproval && cfg.maxSingleTransfer) {
      const threshold = BigInt(cfg.maxSingleTransfer);
      if (amt > threshold) {
        violations.push({
          code: 'TREASURY_APPROVAL_REQUIRED',
          message: 'Amount over threshold — approval required',
          severity: 'error', // Blocks auto-execution but not UI flow
          category: 'treasury',
          context: { 
            threshold: cfg.maxSingleTransfer,
            route: 'approval.workflows.high_value_tx'
          }
        });
      }
    }

    return violations;
  }

  private async evaluateCompliance(context: PolicyContext, space: TMSpaceV1, actorContact?: ContactResolution, targetContact?: ContactResolution): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];
    const complianceConfig = space.complianceConfig;

    // KYC/KYB checks for both actor and target on treasury operations
    if (this.isTreasuryAction(context.action)) {
      // Actor KYC/KYB validation
      if (complianceConfig.requiresKYC && actorContact?.metadata?.kycStatus !== 'verified') {
        violations.push({
          code: 'COMPLIANCE_KYC_REQUIRED',
          message: 'Actor KYC verification required',
          severity: 'critical',
          category: 'compliance',
          context: { actorId: context.actorId, kycStatus: actorContact?.metadata?.kycStatus }
        });
      }

      if (complianceConfig.requiresKYB && actorContact?.metadata?.kybStatus !== 'verified') {
        violations.push({
          code: 'COMPLIANCE_KYB_REQUIRED',
          message: 'Actor KYB verification required',
          severity: 'critical',
          category: 'compliance',
          context: { actorId: context.actorId, kybStatus: actorContact?.metadata?.kybStatus }
        });
      }

      // Target KYB validation for transfers
      if (complianceConfig.requiresKYB && context.targetId && targetContact?.metadata?.kybStatus !== 'verified') {
        violations.push({
          code: 'COMPLIANCE_TARGET_KYB_REQUIRED',
          message: 'Target KYB verification required',
          severity: 'critical',
          category: 'compliance',
          context: { targetId: context.targetId }
        });
      }
    }

    // Cannabis facility license requirement
    if (this.isTreasuryAction(context.action) && this.complianceRules.facilityLicenseRequired && 
        actorContact?.source === 'matterfi' && !actorContact.metadata?.facilityLicense) {
      violations.push({
        code: 'COMPLIANCE_FACILITY_LICENSE_REQUIRED',
        message: 'Cannabis facility license required',
        severity: 'critical',
        category: 'compliance',
        context: { actorId: context.actorId }
      });
    }

    // Jurisdiction blocking (both actor and target)
    const blocked = this.complianceRules.blockedJurisdictions;
    if (blocked?.length) {
      const isBlocked = (contact?: ContactResolution) => {
        const cc = contact?.metadata?.countryCode || contact?.metadata?.jurisdictionCode;
        return !!(cc && blocked.includes(cc));
      };

      if (isBlocked(actorContact) || isBlocked(targetContact)) {
        violations.push({
          code: 'COMPLIANCE_BLOCKED_JURISDICTION',
          message: 'Jurisdiction not permitted',
          severity: 'critical',
          category: 'compliance'
        });
      }
    }

    // Business hours (skip for auto-settlement)
    if (!space.treasuryConfig?.autoSettlement && !this.isWithinBusinessHours(space)) {
      violations.push({
        code: 'COMPLIANCE_BUSINESS_HOURS',
        message: 'Outside allowed business hours',
        severity: 'warning',
        category: 'compliance',
        context: { currentTime: new Date().toISOString() }
      });
    }

    return violations;
  }

  private async evaluateRecognitionPolicy(context: PolicyContext, space: TMSpaceV1): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];
    const policy = space.recognitionPolicy;
    if (!policy) return violations;

    // Lens type validation
    if (context.lens && !policy.allowedLenses.includes(context.lens)) {
      violations.push({
        code: 'RECOGNITION_LENS_NOT_ALLOWED',
        message: `Lens ${context.lens} not allowed`,
        severity: 'critical',
        category: 'limits',
        context: { lens: context.lens, allowedLenses: policy.allowedLenses }
      });
    }

    // Moderation requirement
    if (policy.requiresModeration && context.action === 'recognition.create') {
      violations.push({
        code: 'RECOGNITION_MODERATION_REQUIRED',
        message: 'Requires moderation before approval',
        severity: 'error',
        category: 'limits'
      });
    }

    return violations;
  }

  private isTreasuryAction(action: PolicyAction): boolean {
    return action.startsWith('treasury.') || action.startsWith('settlement.');
  }

  private isWithinBusinessHours(space: TMSpaceV1, nowISO?: string): boolean {
    const businessHours = this.complianceRules.allowedBusinessHours;
    const tz = businessHours.timezone;
    return withinHours(tz, businessHours.start, businessHours.end, nowISO);
  }

  private calculateRiskScore(violations: PolicyViolation[], context: PolicyContext): number {
    let score = 0;
    
    violations.forEach(violation => {
      switch (violation.severity) {
        case 'critical': score += 10; break;
        case 'error': score += 5; break;
        case 'warning': score += 1; break;
      }
    });

    // Additional risk factors for cannabis operations
    if (context.amount && parseMinor(context.amount) && parseMinor(context.amount)! > BigInt('100000000')) { // $100k+
      score += 3;
    }

    if (context.action.includes('mint') || context.action.includes('burn')) {
      score += 2; // Minting/burning is higher risk
    }

    if (context.action === 'compliance.export') {
      score += 1; // Compliance exports need tracking
    }

    return Math.min(score / 20, 1.0); // Normalize to 0-1
  }
}

// Global policy engine instance
let globalPolicyEngine: PolicyEngine | null = null;

export function getPolicyEngine(): PolicyEngine {
  if (!globalPolicyEngine) {
    globalPolicyEngine = new PolicyEngine();
  }
  return globalPolicyEngine;
}

// Convenience functions
export async function evaluatePolicy(context: PolicyContext, actorContact?: ContactResolution, targetContact?: ContactResolution): Promise<PolicyEvaluation> {
  return getPolicyEngine().evaluatePolicy(context, actorContact, targetContact);
}

export async function hasScope(actorId: string, spaceId: string, scope: PolicyScope): Promise<boolean> {
  return getPolicyEngine().hasScope(actorId, spaceId, scope);
}

export async function enforcePolicy(context: PolicyContext, actorContact?: ContactResolution, targetContact?: ContactResolution): Promise<void> {
  const evaluation = await evaluatePolicy(context, actorContact, targetContact);
  
  if (!evaluation.allowed) {
    throw new PolicyEngineError(
      evaluation.reason || 'Policy violation',
      'POLICY_VIOLATION',
      evaluation.violations
    );
  }
}

// Type guards and utilities
export function isCriticalViolation(violation: PolicyViolation): boolean {
  return violation.severity === 'critical';
}

export function hasComplianceViolations(evaluation: PolicyEvaluation): boolean {
  return evaluation.violations.some(v => v.category === 'compliance' && v.severity === 'critical');
}

export function requiresApproval(evaluation: PolicyEvaluation): boolean {
  return evaluation.violations.some(v => v.code === 'TREASURY_APPROVAL_REQUIRED');
}

export function getTreasuryScopes(): TreasuryScope[] {
  return [
    'treasury:read',
    'treasury:balances.read', 
    'treasury:tx.read',
    'treasury:tx.create',
    'treasury:invoice.create',
    'treasury:invoice.read',
    'treasury:settlement.read',
    'treasury:config.write',
    'treasury:export',
    'treasury:dev.mint',
    'treasury:compliance.read',
    'treasury:compliance.write'
  ];
}

export function getRecognitionScopes(): RecognitionScope[] {
  return [
    'recognition:create',
    'recognition:approve',
    'recognition:moderate',
    'recognition:view'
  ];
}