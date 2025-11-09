import { z } from 'zod';
import { 
  HederaAccountIdSchema, 
  HederaTopicIdSchema, 
  SpaceKeySchema, 
  CorrelationIdSchema,
  stableStringify,
  sha256Hex
} from './base';

/**
 * TrustMesh v2 Recognition Schema
 * Universal schema for cross-lens recognitions with immutable HCS envelope
 */

// Lens type enumeration
export const LensTypeSchema = z.enum(['genz', 'professional', 'social', 'builder']);

// Lens-specific data schemas (defined before metadata to use in validation)
export const GenZLensDataSchema = z.object({
  vibeCheck: z.enum(['fire', 'mid', 'cringe']).optional(),
  streakCount: z.number().int().min(0).optional(),
  socialProof: z.array(z.string()).optional(),
});

export const ProfessionalLensDataSchema = z.object({
  industryContext: z.string().optional(),
  competencyLevel: z.enum(['novice', 'intermediate', 'expert', 'master']).optional(),
  certificationRef: z.string().optional(),
});

export const SocialLensDataSchema = z.object({
  communityImpact: z.enum(['local', 'regional', 'national', 'global']).optional(),
  collaborationScore: z.number().min(0).max(100).optional(),
});

export const BuilderLensDataSchema = z.object({
  projectPhase: z.enum(['concept', 'prototype', 'mvp', 'production']).optional(),
  techStack: z.array(z.string()).optional(),
  githubRepo: z.string().url().optional(),
});

const LensSchemas: Record<z.infer<typeof LensTypeSchema>, z.ZodTypeAny> = {
  genz: GenZLensDataSchema,
  professional: ProfessionalLensDataSchema,
  social: SocialLensDataSchema,
  builder: BuilderLensDataSchema,
};

// Recognition metadata schema
export const RecognitionMetadataSchema = z.object({
  // Core recognition data
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().min(1).max(50),
  
  // Lens-specific metadata (validated against lens later via superRefine)
  lensData: z.record(z.unknown()).default({}),
  
  // Skill/competency tags
  skills: z.array(z.string()).max(20).default([]),
  
  // Privacy level
  visibility: z.enum(['public', 'space', 'private']).default('space'),
  
  // Media attachments (IPFS hashes or URLs)
  attachments: z.array(z.object({
    type: z.enum(['image', 'document', 'video', 'link']),
    url: z.string().url(),
    title: z.string().optional(),
  })).max(5).default([]),
});

// Core recognition envelope
export const TMRecognitionV1Schema = z.object({
  // Schema versioning
  schema: z.literal('tm.recognition@1'),
  
  // Unique identifiers
  recognitionId: z.string().uuid(),
  correlationId: CorrelationIdSchema,
  
  // Space and identity context
  spaceId: SpaceKeySchema,
  senderId: HederaAccountIdSchema,
  recipientId: HederaAccountIdSchema,
  
  // Lens classification
  lens: LensTypeSchema,
  
  // Recognition payload
  metadata: RecognitionMetadataSchema,
  
  // Timestamps (ISO 8601)
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  
  // Cryptographic integrity (agnostic signature algorithm)
  signature: z.string().optional(),
  signatureAlgo: z.enum(['ed25519', 'secp256k1']).optional(),
  proofHash: z.string().optional(), // SHA-256 hash for verification
  
  // HCS integration
  hcsTopicId: HederaTopicIdSchema,
  hcsSequenceNumber: z.number().int().positive().optional(), // Set after HCS submission
  hcsConsensusTimestamp: z.string().optional(), // Hedera format: "seconds.nanos"
})
.strict()
.superRefine((val, ctx) => {
  // Enforce lensData shape based on lens type
  const schema = LensSchemas[val.lens];
  const result = schema.safeParse(val.metadata?.lensData ?? {});
  if (!result.success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `metadata.lensData invalid for lens=${val.lens}: ${result.error.message}`,
      path: ['metadata', 'lensData'],
    });
  }
});

// Type exports
export type LensType = z.infer<typeof LensTypeSchema>;
export type RecognitionMetadata = z.infer<typeof RecognitionMetadataSchema>;
export type TMRecognitionV1 = z.infer<typeof TMRecognitionV1Schema>;

// Validation helpers
export const validateRecognition = (data: unknown): TMRecognitionV1 => {
  return TMRecognitionV1Schema.parse(data);
};

export const isValidRecognition = (data: unknown): data is TMRecognitionV1 => {
  return TMRecognitionV1Schema.safeParse(data).success;
};


// Builder utilities
export const createRecognitionId = (): string => {
  return crypto.randomUUID();
};

export const createCorrelationId = (): string => {
  return crypto.randomUUID();
};

export const createRecognitionEnvelope = (
  input: Omit<TMRecognitionV1, 'schema' | 'recognitionId' | 'correlationId' | 'issuedAt' | 'proofHash'>
): TMRecognitionV1 => {
  // Validate required fields before creating envelope
  if (!input.spaceId || !input.senderId || !input.recipientId || !input.lens || !input.metadata || !input.hcsTopicId) {
    throw new Error('Missing required fields: spaceId, senderId, recipientId, lens, metadata, hcsTopicId are required');
  }
  
  const envelope: TMRecognitionV1 = {
    schema: 'tm.recognition@1',
    recognitionId: createRecognitionId(),
    correlationId: createCorrelationId(),
    issuedAt: new Date().toISOString(),
    ...input,
  };
  
  // Canonical payload for proof hash (deterministic ordering)
  const payloadForHash = {
    schema: envelope.schema,
    recognitionId: envelope.recognitionId,
    spaceId: envelope.spaceId,
    senderId: envelope.senderId,
    recipientId: envelope.recipientId,
    lens: envelope.lens,
    metadata: envelope.metadata,
    issuedAt: envelope.issuedAt,
  };
  
  envelope.proofHash = sha256Hex(stableStringify(payloadForHash));
  return envelope;
};

// Lens data validation by type (helper function)
export const validateLensData = (lens: LensType, data: unknown) => {
  const schema = LensSchemas[lens];
  if (!schema) {
    throw new Error(`Unknown lens type: ${lens}`);
  }
  return schema.parse(data);
};