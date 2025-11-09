import { z } from 'zod';
import { 
  HederaAccountIdSchema, 
  HederaTopicIdSchema, 
  SpaceKeySchema,
  stableStringify,
  sha256Hex
} from './base';

/**
 * TrustMesh v2 Space Schema
 * Defines governance, policy, and treasury configuration for recognition spaces
 */

// Treasury configuration
export const TreasuryConfigSchema = z.object({
  // Settlement provider configuration
  settlementProvider: z.enum(['matterfi', 'brale', 'hedera_native']).default('matterfi'),
  
  // Token configuration
  tokenSymbol: z.string().min(1).max(10).default('TRST'),
  tokenDecimals: z.number().int().min(0).max(18).default(18), // EVM standard default
  
  // Custodial account details
  custodialAccountId: z.string().optional(), // Provider-specific account ID
  hederaAccountId: HederaAccountIdSchema.optional(),
  
  // Treasury limits and controls
  dailyMintLimit: z.number().min(0).optional(),
  maxSingleTransfer: z.number().min(0).optional(),
  requiresApproval: z.boolean().default(false),
  
  // Settlement configuration
  autoSettlement: z.boolean().default(true),
  settlementThreshold: z.number().min(0).optional(),
});

// Policy configuration for recognitions
export const RecognitionPolicySchema = z.object({
  // Allowed lens types for this space
  allowedLenses: z.array(z.enum(['genz', 'professional', 'social', 'builder'])).min(1),
  
  // Recognition limits
  maxRecognitionsPerDay: z.number().int().min(1).optional(),
  maxRecognitionsPerUser: z.number().int().min(1).optional(),
  
  // Approval requirements
  requiresModeration: z.boolean().default(false),
  autoApprove: z.boolean().default(true),
  
  // Content validation
  requiresEvidence: z.boolean().default(false),
  maxAttachments: z.number().int().min(0).max(10).default(5),
  
  // Reward configuration
  enableRewards: z.boolean().default(true),
  rewardMultiplier: z.number().min(0).max(10).default(1),
  
  // Skills and categories
  allowedCategories: z.array(z.string()).default([]),
  skillsRequired: z.boolean().default(false),
});

// RBAC (Role-Based Access Control) configuration
export const RBACConfigSchema = z.object({
  // Space roles (hierarchical)
  roles: z.array(z.object({
    roleId: z.string(),
    name: z.string(),
    description: z.string().optional(),
    permissions: z.array(z.string()),
    inherits: z.array(z.string()).optional(), // Role inheritance
  })).default([]),
  
  // Default role for new members
  defaultRole: z.string().default('member'),
  
  // Invitation requirements
  requiresInvitation: z.boolean().default(false),
  allowSelfRegistration: z.boolean().default(true),
});

// Compliance and audit configuration
export const ComplianceConfigSchema = z.object({
  // Data retention
  retentionPeriod: z.number().int().min(30).default(2555), // ~7 years default
  
  // Privacy settings
  allowsDataExport: z.boolean().default(true),
  allowsDataDeletion: z.boolean().default(false), // Immutable by default
  
  // Audit requirements
  requiresAuditLog: z.boolean().default(true),
  auditRetention: z.number().int().min(90).default(2555),
  
  // Regulatory compliance
  jurisdiction: z.string().optional(), // e.g., "US-CA", "EU-GDPR"
  complianceFramework: z.array(z.string()).default([]), // e.g., ["SOX", "GDPR"]
  
  // KYC/KYB requirements
  requiresKYC: z.boolean().default(false),
  requiresKYB: z.boolean().default(false),
})
.superRefine((val, ctx) => {
  // Ensure audit retention is at least as long as data retention
  if (val.auditRetention < val.retentionPeriod) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'auditRetention must be >= retentionPeriod for compliance',
      path: ['auditRetention'],
    });
  }
});

// Space metadata and branding
export const SpaceMetadataSchema = z.object({
  // Basic information
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  
  // Branding
  logoUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  
  // Contact information
  website: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  
  // Social links (including both x and twitter for transition period)
  socialLinks: z.array(z.object({
    platform: z.enum(['x', 'twitter', 'linkedin', 'discord', 'telegram', 'github']),
    url: z.string().url(),
  })).max(10).default([]),
  
  // Tags and categorization
  tags: z.array(z.string()).max(20).default([]),
  category: z.enum([
    'education', 'healthcare', 'technology', 'finance', 'cannabis',
    'nonprofit', 'government', 'community', 'research', 'other'
  ]).default('other'),
});

// Core space envelope
export const TMSpaceV1Schema = z.object({
  // Schema versioning
  schema: z.literal('tm.space@1'),
  
  // Unique identifiers
  spaceId: SpaceKeySchema,
  parentSpaceId: SpaceKeySchema.optional(), // For hierarchical spaces
  
  // Space metadata
  metadata: SpaceMetadataSchema,
  
  // Configuration
  treasuryConfig: TreasuryConfigSchema,
  recognitionPolicy: RecognitionPolicySchema,
  rbacConfig: RBACConfigSchema,
  complianceConfig: ComplianceConfigSchema,
  
  // Governance
  adminAccountIds: z.array(HederaAccountIdSchema).min(1), // At least one admin
  ownerAccountId: HederaAccountIdSchema,
  
  // HCS integration
  hcsTopicId: HederaTopicIdSchema,
  eventTopicId: HederaTopicIdSchema.optional(), // Separate topic for space events
  
  // Lifecycle
  status: z.enum(['active', 'suspended', 'archived']).default('active'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  
  // Cryptographic integrity
  configHash: z.string().optional(), // SHA-256 of configuration
  signature: z.string().optional(),
  signatureAlgo: z.enum(['ed25519', 'secp256k1']).optional(),
})
.strict()
.superRefine((val, ctx) => {
  // Provider-specific requirements
  if (val.treasuryConfig.settlementProvider === 'hedera_native' && !val.treasuryConfig.hederaAccountId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'hedera_native requires treasuryConfig.hederaAccountId',
      path: ['treasuryConfig', 'hederaAccountId'],
    });
  }
  if (val.treasuryConfig.settlementProvider === 'matterfi' && !val.treasuryConfig.custodialAccountId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'matterfi requires treasuryConfig.custodialAccountId',
      path: ['treasuryConfig', 'custodialAccountId'],
    });
  }
  
  // Owner must be an admin
  if (!val.adminAccountIds.includes(val.ownerAccountId)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'ownerAccountId must be included in adminAccountIds',
      path: ['ownerAccountId'],
    });
  }
  
  // Moderation vs autoApprove sanity check
  if (val.recognitionPolicy.requiresModeration && val.recognitionPolicy.autoApprove) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'requiresModeration conflicts with autoApprove=true',
      path: ['recognitionPolicy', 'autoApprove'],
    });
  }
});

// Type exports
export type TreasuryConfig = z.infer<typeof TreasuryConfigSchema>;
export type RecognitionPolicy = z.infer<typeof RecognitionPolicySchema>;
export type RBACConfig = z.infer<typeof RBACConfigSchema>;
export type ComplianceConfig = z.infer<typeof ComplianceConfigSchema>;
export type SpaceMetadata = z.infer<typeof SpaceMetadataSchema>;
export type TMSpaceV1 = z.infer<typeof TMSpaceV1Schema>;

// Validation helpers
export const validateSpace = (data: unknown): TMSpaceV1 => {
  return TMSpaceV1Schema.parse(data);
};

export const isValidSpace = (data: unknown): data is TMSpaceV1 => {
  return TMSpaceV1Schema.safeParse(data).success;
};

// Builder utilities
export const createSpaceEnvelope = (
  input: Omit<TMSpaceV1, 'schema' | 'createdAt' | 'updatedAt' | 'configHash'>
): TMSpaceV1 => {
  const now = new Date().toISOString();
  const envelope: TMSpaceV1 = {
    schema: 'tm.space@1',
    createdAt: now,
    updatedAt: now,
    ...input,
  };
  
  // Generate config hash for integrity (exclude timestamps and signature)
  const configForHash = {
    schema: envelope.schema,
    spaceId: envelope.spaceId,
    metadata: envelope.metadata,
    treasuryConfig: envelope.treasuryConfig,
    recognitionPolicy: envelope.recognitionPolicy,
    rbacConfig: envelope.rbacConfig,
    complianceConfig: envelope.complianceConfig,
    adminAccountIds: envelope.adminAccountIds,
    ownerAccountId: envelope.ownerAccountId,
  };
  
  envelope.configHash = sha256Hex(stableStringify(configForHash));
  return envelope;
};

// Update helper for bumping updatedAt and re-hashing
export const updateSpaceEnvelope = (prev: TMSpaceV1, patch: Partial<TMSpaceV1>): TMSpaceV1 => {
  const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
  
  // Regenerate config hash
  const configForHash = {
    schema: next.schema,
    spaceId: next.spaceId,
    metadata: next.metadata,
    treasuryConfig: next.treasuryConfig,
    recognitionPolicy: next.recognitionPolicy,
    rbacConfig: next.rbacConfig,
    complianceConfig: next.complianceConfig,
    adminAccountIds: next.adminAccountIds,
    ownerAccountId: next.ownerAccountId,
  };
  
  next.configHash = sha256Hex(stableStringify(configForHash));
  return next;
};

// Default configurations for common space types
export const createEducationSpaceDefaults = (): Partial<TMSpaceV1> => ({
  metadata: {
    name: '',
    category: 'education' as const,
    tags: ['education', 'learning', 'skills'],
  },
  recognitionPolicy: {
    allowedLenses: ['genz', 'professional', 'social'],
    requiresModeration: false,
    autoApprove: true,
    enableRewards: true,
    rewardMultiplier: 1.2, // Boost education rewards
  },
  rbacConfig: {
    defaultRole: 'student',
    requiresInvitation: false,
    allowSelfRegistration: true,
  },
  complianceConfig: {
    requiresAuditLog: true,
    allowsDataExport: true,
    jurisdiction: 'US-CA',
  },
});

export const createCannabisSpaceDefaults = (): Partial<TMSpaceV1> => ({
  metadata: {
    name: '',
    category: 'cannabis' as const,
    tags: ['cannabis', 'compliance', 'regulated'],
  },
  recognitionPolicy: {
    allowedLenses: ['professional', 'social'],
    requiresModeration: true, // Higher scrutiny
    autoApprove: false, // Explicit approval required
    requiresEvidence: true,
    enableRewards: true,
  },
  rbacConfig: {
    defaultRole: 'member',
    requiresInvitation: true, // Controlled access
    allowSelfRegistration: false,
  },
  complianceConfig: {
    requiresAuditLog: true,
    requiresKYC: true,
    requiresKYB: true, // Business verification
    jurisdiction: 'US-CA', // California cannabis regs
    complianceFramework: ['280E', 'CA-CDPH'],
  },
});

export const createTechSpaceDefaults = (): Partial<TMSpaceV1> => ({
  metadata: {
    name: '',
    category: 'technology' as const,
    tags: ['tech', 'development', 'innovation'],
  },
  recognitionPolicy: {
    allowedLenses: ['builder', 'professional'],
    requiresEvidence: true, // Code/demo proof
    enableRewards: true,
  },
  rbacConfig: {
    defaultRole: 'contributor',
    allowSelfRegistration: true,
  },
  complianceConfig: {
    requiresAuditLog: true,
    allowsDataExport: true,
  },
});