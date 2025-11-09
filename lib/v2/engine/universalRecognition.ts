import {
  TMRecognitionV1,
  validateRecognition,
  createRecognitionEnvelope,
  validateLensData
} from '../schema/tm.recognition@1';
import { SpaceRegistry } from './spaceRegistry';
import { SpaceKey, HederaAccountId, LensType, SpacePolicyView } from '../schema/base';

/**
 * TrustMesh v2 Universal Recognition Engine
 * Unified handler for all lens types with type-safe switching and HCS integration
 */

// Recognition request types for each lens
export interface BaseRecognitionRequest {
  spaceId: SpaceKey;
  senderId: HederaAccountId;
  recipientId: HederaAccountId;
  correlationId?: string; // Optional client-supplied idempotency key
  metadata: {
    title: string;
    description?: string;
    category: string;
    skills?: string[];
    visibility?: 'public' | 'space' | 'private';
    attachments?: Array<{
      type: 'image' | 'document' | 'video' | 'link';
      url: string;
      title?: string;
    }>;
  };
  expiresAt?: string;
}

export interface GenZRecognitionRequest extends BaseRecognitionRequest {
  lens: 'genz';
  lensData: {
    vibeCheck?: 'fire' | 'mid' | 'cringe';
    streakCount?: number;
    socialProof?: string[];
  };
}

export interface ProfessionalRecognitionRequest extends BaseRecognitionRequest {
  lens: 'professional';
  lensData: {
    industryContext?: string;
    competencyLevel?: 'novice' | 'intermediate' | 'expert' | 'master';
    certificationRef?: string;
  };
}

export interface SocialRecognitionRequest extends BaseRecognitionRequest {
  lens: 'social';
  lensData: {
    communityImpact?: 'local' | 'regional' | 'national' | 'global';
    collaborationScore?: number;
  };
}

export interface BuilderRecognitionRequest extends BaseRecognitionRequest {
  lens: 'builder';
  lensData: {
    projectPhase?: 'concept' | 'prototype' | 'mvp' | 'production';
    techStack?: string[];
    githubRepo?: string;
  };
}

export type UniversalRecognitionRequest = 
  | GenZRecognitionRequest 
  | ProfessionalRecognitionRequest 
  | SocialRecognitionRequest 
  | BuilderRecognitionRequest;

// Recognition result with processing metadata
export interface RecognitionResult {
  recognition: TMRecognitionV1;
  processing: {
    validatedAt: string;
    processedAt: string;
    hcsSequenceNumber?: number;
    hcsConsensusTimestamp?: string;
    correlationId: string;
    spaceValidated: boolean;
    policyChecksComplete: boolean;
    rbacValidated: boolean;
    idempotencyKey: string;
  };
  event: {
    eventType: 'recognition.submitted';
    recognitionId: string;
    spaceId: SpaceKey;
    sender: HederaAccountId;
    timestamp: string;
  };
}

// HCS client interface for recognition events
interface RecognitionHCSClient {
  submitMessage(topicId: string, message: string): Promise<{
    sequenceNumber: number;
    consensusTimestamp: string;
  }>;
  getMessages(topicId: string, options?: { sinceSequence?: number; limit?: number }): Promise<Array<{
    message: string;
    sequenceNumber: number;
    consensusTimestamp: string;
  }>>;
}

// Recognition policy validation errors
export class RecognitionPolicyError extends Error {
  constructor(
    message: string,
    public policyViolation: string,
    public spaceId: SpaceKey
  ) {
    super(message);
    this.name = 'RecognitionPolicyError';
  }
}

export class RecognitionValidationError extends Error {
  constructor(
    message: string,
    public validationErrors: string[]
  ) {
    super(message);
    this.name = 'RecognitionValidationError';
  }
}

export class UniversalRecognitionEngine {
  private spaceRegistry: SpaceRegistry;
  private hcsClient: RecognitionHCSClient;
  private submissionCache: Map<string, RecognitionResult> = new Map(); // Simple idempotency cache
  private rateLimitBuckets: Map<string, { count: number; lastReset: number }> = new Map();

  constructor(spaceRegistry: SpaceRegistry, hcsClient: RecognitionHCSClient) {
    this.spaceRegistry = spaceRegistry;
    this.hcsClient = hcsClient;
  }

  /**
   * Submit a recognition through the universal engine
   */
  async submitRecognition(request: UniversalRecognitionRequest): Promise<RecognitionResult> {
    const startTime = new Date().toISOString();

    // Step 0: Basic request validation
    const validation = this.validateRecognitionRequest(request);
    if (!validation.isValid) {
      throw new RecognitionValidationError(
        'Invalid recognition request',
        validation.errors
      );
    }

    // Step 1: Idempotency check
    const idempotencyKey = request.correlationId || `${request.senderId}-${request.recipientId}-${Date.now()}`;
    const existingSubmission = this.submissionCache.get(idempotencyKey);
    if (existingSubmission) {
      return existingSubmission; // Return cached result
    }

    // Step 2: Self-recognition guard
    if (request.senderId === request.recipientId) {
      throw new RecognitionPolicyError(
        'Sender cannot equal recipient',
        'self_recognition_blocked',
        request.spaceId
      );
    }

    // Step 3: Expiry validation
    if (request.expiresAt) {
      const expiryDate = new Date(request.expiresAt);
      if (Number.isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
        throw new RecognitionPolicyError(
          'Invalid or past expiresAt',
          'invalid_expiry',
          request.spaceId
        );
      }
    }

    // Step 4: Ensure lensData exists for this lens
    if (!('lensData' in request) || !request.lensData) {
      throw new RecognitionPolicyError(
        'lensData is required',
        'missing_lens_data',
        request.spaceId
      );
    }

    // Step 5: Validate space exists and get policies
    const space = await this.spaceRegistry.getSpace(request.spaceId);
    if (!space) {
      throw new Error(`Space not found: ${request.spaceId}`);
    }

    const spacePolicy: SpacePolicyView = {
      spaceId: space.spaceId,
      hcsTopicId: space.hcsTopicId,
      recognitionPolicy: space.recognitionPolicy,
      rbacConfig: space.rbacConfig
    };
    
    const spaceValidated = true;

    // Step 6: Basic rate limiting check
    await this.checkRateLimit(request.senderId, request.spaceId);

    // Step 7: RBAC validation (simplified - would be more complex in real implementation)
    const rbacValidated = await this.validateRBAC(request.senderId, spacePolicy);

    // Step 8: Validate recognition request against space policies
    await this.validateRecognitionPolicy(request, spacePolicy);
    const policyChecksComplete = true;

    // Step 9: Create recognition envelope with proper lens data validation
    const recognitionEnvelope = createRecognitionEnvelope({
      spaceId: request.spaceId,
      senderId: request.senderId,
      recipientId: request.recipientId,
      lens: request.lens,
      metadata: {
        ...request.metadata,
        lensData: request.lensData,
        skills: request.metadata.skills || [],
        visibility: request.metadata.visibility || 'space',
        attachments: request.metadata.attachments || []
      },
      expiresAt: request.expiresAt,
      hcsTopicId: spacePolicy.hcsTopicId,
      correlationId: idempotencyKey
    });

    // Step 10: Validate the complete recognition
    const validatedRecognition = validateRecognition(recognitionEnvelope);
    const validatedAt = new Date().toISOString();

    // Step 11: Create event wrapper
    const event = {
      eventType: 'recognition.submitted' as const,
      recognitionId: validatedRecognition.recognitionId,
      spaceId: request.spaceId,
      sender: request.senderId,
      timestamp: new Date().toISOString()
    };

    // Step 12: Submit to HCS topic
    const hcsResult = await this.hcsClient.submitMessage(
      spacePolicy.hcsTopicId,
      JSON.stringify({ ...event, recognition: validatedRecognition })
    );

    const processedAt = new Date().toISOString();

    // Step 13: Create result with processing metadata
    const result: RecognitionResult = {
      recognition: validatedRecognition,
      processing: {
        validatedAt,
        processedAt,
        hcsSequenceNumber: hcsResult.sequenceNumber,
        hcsConsensusTimestamp: hcsResult.consensusTimestamp,
        correlationId: validatedRecognition.correlationId,
        spaceValidated,
        policyChecksComplete,
        rbacValidated,
        idempotencyKey
      },
      event
    };

    // Step 14: Cache result for idempotency
    this.submissionCache.set(idempotencyKey, result);

    return result;
  }

  /**
   * Submit recognition with lens-specific type safety
   */
  async submitGenZRecognition(request: GenZRecognitionRequest): Promise<RecognitionResult> {
    return this.submitRecognition(request);
  }

  async submitProfessionalRecognition(request: ProfessionalRecognitionRequest): Promise<RecognitionResult> {
    return this.submitRecognition(request);
  }

  async submitSocialRecognition(request: SocialRecognitionRequest): Promise<RecognitionResult> {
    return this.submitRecognition(request);
  }

  async submitBuilderRecognition(request: BuilderRecognitionRequest): Promise<RecognitionResult> {
    return this.submitRecognition(request);
  }

  /**
   * Basic RBAC validation (simplified implementation)
   * In production, this would integrate with the full RBAC system
   */
  private async validateRBAC(senderId: HederaAccountId, spacePolicy: SpacePolicyView): Promise<boolean> {
    // TODO: Implement full RBAC validation
    // For now, basic checks:
    
    // If space requires invitation, sender should be verified member
    if (spacePolicy.rbacConfig.requiresInvitation) {
      // Would check if sender is in space member list
      // For now, assume valid
    }

    // Check if sender has 'recognize:create' permission
    // Would integrate with the treasury RBAC system from the context
    
    return true; // Simplified - assume authorized
  }

  /**
   * Basic rate limiting (in-memory token bucket)
   */
  private async checkRateLimit(senderId: HederaAccountId, spaceId: SpaceKey): Promise<void> {
    const bucketKey = `${senderId}:${spaceId}`;
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour window
    const maxRequests = 50; // 50 requests per hour per sender per space

    const bucket = this.rateLimitBuckets.get(bucketKey) || { count: 0, lastReset: now };

    // Reset bucket if window expired
    if (now - bucket.lastReset > windowMs) {
      bucket.count = 0;
      bucket.lastReset = now;
    }

    // Check limit
    if (bucket.count >= maxRequests) {
      throw new RecognitionPolicyError(
        `Rate limit exceeded: ${maxRequests} requests per hour`,
        'rate_limit_exceeded',
        spaceId
      );
    }

    bucket.count++;
    this.rateLimitBuckets.set(bucketKey, bucket);
  }

  /**
   * Validate recognition request against space recognition policies
   */
  private async validateRecognitionPolicy(
    request: UniversalRecognitionRequest,
    spacePolicy: SpacePolicyView
  ): Promise<void> {
    const policy = spacePolicy.recognitionPolicy;

    // Check if lens is allowed in this space
    if (!policy.allowedLenses.includes(request.lens)) {
      throw new RecognitionPolicyError(
        `Lens '${request.lens}' is not allowed in space '${request.spaceId}'`,
        'disallowed_lens',
        request.spaceId
      );
    }

    // Validate lens-specific data
    try {
      validateLensData(request.lens, request.lensData);
    } catch (error) {
      throw new RecognitionPolicyError(
        `Invalid lens data for '${request.lens}': ${error}`,
        'invalid_lens_data',
        request.spaceId
      );
    }

    // Check evidence requirements
    if (policy.requiresEvidence) {
      const hasEvidence = request.metadata.attachments && request.metadata.attachments.length > 0;
      if (!hasEvidence) {
        throw new RecognitionPolicyError(
          `Evidence is required for recognitions in space '${request.spaceId}'`,
          'evidence_required',
          request.spaceId
        );
      }
    }

    // Check attachment limits
    const attachmentCount = request.metadata.attachments?.length || 0;
    if (attachmentCount > policy.maxAttachments) {
      throw new RecognitionPolicyError(
        `Too many attachments: ${attachmentCount}. Maximum allowed: ${policy.maxAttachments}`,
        'attachment_limit_exceeded',
        request.spaceId
      );
    }

    // Check skills requirement
    if (policy.skillsRequired) {
      const hasSkills = request.metadata.skills && request.metadata.skills.length > 0;
      if (!hasSkills) {
        throw new RecognitionPolicyError(
          `Skills are required for recognitions in space '${request.spaceId}'`,
          'skills_required',
          request.spaceId
        );
      }
    }

    // Check allowed categories (if specified)
    if (policy.allowedCategories && policy.allowedCategories.length > 0) {
      if (!policy.allowedCategories.includes(request.metadata.category)) {
        throw new RecognitionPolicyError(
          `Category '${request.metadata.category}' is not allowed in space '${request.spaceId}'. Allowed: ${policy.allowedCategories.join(', ')}`,
          'disallowed_category',
          request.spaceId
        );
      }
    }

    // TODO: Check per-day and per-user limits
    if (policy.maxRecognitionsPerDay || policy.maxRecognitionsPerUser) {
      // Would need to query recent HCS messages or a read model
      // For now, add TODO marker
      console.warn(`TODO: Implement per-day/per-user recognition limits for space ${request.spaceId}`);
    }
  }

  /**
   * Get recognition statistics by lens type
   */
  async getRecognitionStats(spaceId: SpaceKey): Promise<{
    totalRecognitions: number;
    byLens: Record<LensType, number>;
    recentActivity: Array<{
      recognitionId: string;
      lens: LensType;
      category: string;
      timestamp: string;
    }>;
  }> {
    // TODO: This would typically query HCS messages or a read model
    // For now, return mock data structure
    return {
      totalRecognitions: 0,
      byLens: {
        genz: 0,
        professional: 0,
        social: 0,
        builder: 0
      },
      recentActivity: []
    };
  }

  /**
   * Validate that a recognition request is well-formed before submission
   */
  validateRecognitionRequest(request: UniversalRecognitionRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Basic validation
    if (!request.spaceId) errors.push('spaceId is required');
    if (!request.senderId) errors.push('senderId is required');
    if (!request.recipientId) errors.push('recipientId is required');
    if (!request.lens) errors.push('lens is required');

    // Hedera Account ID format validation
    const hederaRegex = /^0\.0\.\d+$/;
    if (request.senderId && !hederaRegex.test(request.senderId)) {
      errors.push('senderId must be valid Hedera Account ID format (0.0.xxxxx)');
    }
    if (request.recipientId && !hederaRegex.test(request.recipientId)) {
      errors.push('recipientId must be valid Hedera Account ID format (0.0.xxxxx)');
    }

    // Metadata validation
    if (!request.metadata?.title?.trim()) {
      errors.push('metadata.title is required');
    }
    if (request.metadata?.title && request.metadata.title.length > 200) {
      errors.push('metadata.title must be 200 characters or less');
    }
    if (!request.metadata?.category?.trim()) {
      errors.push('metadata.category is required');
    }

    // Lens-specific validation
    if (!request.lensData) {
      errors.push('lensData is required');
    } else {
      try {
        validateLensData(request.lens, request.lensData);
      } catch (error) {
        errors.push(`Invalid lens data: ${error}`);
      }
    }

    // Attachment validation
    if (request.metadata?.attachments) {
      for (const [index, attachment] of request.metadata.attachments.entries()) {
        if (!attachment.url) {
          errors.push(`Attachment ${index + 1}: URL is required`);
        }
        if (!['image', 'document', 'video', 'link'].includes(attachment.type)) {
          errors.push(`Attachment ${index + 1}: Invalid type '${attachment.type}'`);
        }
        try {
          new URL(attachment.url);
        } catch {
          errors.push(`Attachment ${index + 1}: Invalid URL format`);
        }
      }
    }

    // ExpiresAt validation
    if (request.expiresAt) {
      const expiryDate = new Date(request.expiresAt);
      if (Number.isNaN(expiryDate.getTime())) {
        errors.push('expiresAt must be valid ISO 8601 date');
      } else if (expiryDate <= new Date()) {
        errors.push('expiresAt must be in the future');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Clear caches (useful for testing)
   */
  clearCaches(): void {
    this.submissionCache.clear();
    this.rateLimitBuckets.clear();
  }
}

// Factory function for creating recognition engine with mock HCS client
export function createMockRecognitionEngine(spaceRegistry: SpaceRegistry): UniversalRecognitionEngine {
  const mockHCSClient: RecognitionHCSClient = {
    async submitMessage(topicId: string, message: string) {
      console.log(`[MOCK HCS] Submit recognition to ${topicId}: ${message.substring(0, 100)}...`);
      return {
        sequenceNumber: Math.floor(Math.random() * 1000000),
        consensusTimestamp: `${Math.floor(Date.now() / 1000)}.${Math.floor(Math.random() * 1000000000)}`
      };
    },

    async getMessages(topicId: string, options?: { sinceSequence?: number; limit?: number }) {
      console.log(`[MOCK HCS] Get messages from ${topicId}, options:`, options);
      return []; // Empty for now, would contain previously persisted events
    }
  };

  return new UniversalRecognitionEngine(spaceRegistry, mockHCSClient);
}

// Export types for use in API routes
export type { RecognitionHCSClient };