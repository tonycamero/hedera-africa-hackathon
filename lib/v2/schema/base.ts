import { z } from 'zod';
import { createHash } from 'crypto';

/**
 * TrustMesh v2 Base Schema Primitives
 * Shared types and utilities across all v2 schemas
 */

// Core Hedera primitives
export const HederaAccountIdSchema = z.string().regex(/^0\.0\.\d+$/, 'Invalid Hedera Account ID');
export const HederaTopicIdSchema = z.string().regex(/^0\.0\.\d+$/, 'Invalid Hedera Topic ID');

// Space identification (human-readable keys like tm.v2.crafttrust.dispensary-1)
export const SpaceKeySchema = z.string().regex(/^[a-z0-9](?:[a-z0-9._-]{2,63})$/i, 'Invalid Space Key');

// UUID-based identifiers
export const CorrelationIdSchema = z.string().uuid('Invalid Correlation ID');

// Shared utilities for deterministic hashing
export const stableStringify = (obj: any): string => {
  const keys = (x: any) => Object.keys(x).sort();
  const recur = (x: any): any => {
    if (Array.isArray(x)) return x.map(recur);
    if (x && typeof x === 'object') {
      const o: any = {};
      for (const k of keys(x)) o[k] = recur(x[k]);
      return o;
    }
    return x;
  };
  return JSON.stringify(recur(obj));
};

// SHA-256 hex (sync) using Node crypto
export const sha256Hex = (s: string) => createHash('sha256').update(s).digest('hex');

// Type exports
export type HederaAccountId = z.infer<typeof HederaAccountIdSchema>;
export type HederaTopicId = z.infer<typeof HederaTopicIdSchema>;
export type SpaceKey = z.infer<typeof SpaceKeySchema>;
export type CorrelationId = z.infer<typeof CorrelationIdSchema>;

// Lens type (avoiding circular import from recognition schema)
export type LensType = 'genz' | 'professional' | 'social' | 'builder';

// Minimal space policy view (avoiding circular import from space schema)
export interface SpacePolicyView {
  spaceId: SpaceKey;
  hcsTopicId: string;
  recognitionPolicy: {
    allowedLenses: LensType[];
    requiresEvidence: boolean;
    maxAttachments: number;
    skillsRequired: boolean;
    allowedCategories: string[];
    maxRecognitionsPerDay?: number;
    maxRecognitionsPerUser?: number;
    requiresModeration: boolean;
    autoApprove: boolean;
  };
  rbacConfig: {
    defaultRole: string;
    requiresInvitation: boolean;
    allowSelfRegistration: boolean;
  };
}
