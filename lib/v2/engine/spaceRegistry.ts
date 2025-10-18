import {
  TMSpaceV1,
  validateSpace,
  createSpaceEnvelope,
  updateSpaceEnvelope,
  SpaceMetadata,
  TreasuryConfig,
  RecognitionPolicy,
  RBACConfig,
  ComplianceConfig
} from '../schema/tm.space@1';
import { SpaceKey } from '../schema/base';

/**
 * TrustMesh v2 Space Registry Service
 * Manages CRUD operations for spaces with HCS persistence and policy inheritance
 */

// HCS client interface (to be implemented with actual Hedera SDK)
interface HCSClient {
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

// Space event types for HCS persistence
export type SpaceEventType = 'space.created' | 'space.updated' | 'space.archived' | 'space.suspended';

export interface SpaceEvent {
  eventType: SpaceEventType;
  spaceId: SpaceKey;
  space: TMSpaceV1;
  timestamp: string;
  operatorAccountId: string;
}

// Separate type for space records with event metadata
export type SpaceRecord = {
  space: TMSpaceV1;
  eventMeta?: { sequenceNumber: number; consensusTimestamp: string };
};

// Policy inheritance configuration
export interface PolicyInheritanceConfig {
  // Which policies can be inherited from parent spaces
  inheritablePolicies: Array<keyof TMSpaceV1>;
  // Override rules: child can override parent policy
  allowOverrides: Array<keyof TMSpaceV1>;
  // Merge rules: child policy merges with parent (e.g., combine allowed lenses)
  mergeRules: Array<keyof TMSpaceV1>;
}

export class SpaceRegistry {
  private hcsClient: HCSClient;
  private globalSpaceTopic: string;
  private spaceCache: Map<SpaceKey, SpaceRecord> = new Map();
  private inheritanceConfig: PolicyInheritanceConfig;
  private loaded = false;
  private lastSequence?: number;

  constructor(
    hcsClient: HCSClient,
    globalSpaceTopic: string,
    inheritanceConfig?: Partial<PolicyInheritanceConfig>
  ) {
    this.hcsClient = hcsClient;
    this.globalSpaceTopic = globalSpaceTopic;
    this.inheritanceConfig = {
      inheritablePolicies: ['recognitionPolicy', 'rbacConfig', 'complianceConfig'],
      allowOverrides: ['recognitionPolicy', 'rbacConfig'],
      mergeRules: ['recognitionPolicy', 'complianceConfig'],
      ...inheritanceConfig
    };
  }

  /**
   * Create a new space and persist to HCS
   */
  async createSpace(
    input: Omit<TMSpaceV1, 'schema' | 'createdAt' | 'updatedAt' | 'configHash'>,
    operatorAccountId: string
  ): Promise<TMSpaceV1> {
    // Apply policy inheritance BEFORE enveloping and validation
    const inheritedConfig = await this.applyPolicyInheritanceToConfig(input);
    
    // Create envelope with inherited configuration
    const spaceEnvelope = createSpaceEnvelope(inheritedConfig);
    const validatedSpace = validateSpace(spaceEnvelope);

    // Create space event for HCS
    const spaceEvent: SpaceEvent = {
      eventType: 'space.created',
      spaceId: validatedSpace.spaceId,
      space: validatedSpace,
      timestamp: new Date().toISOString(),
      operatorAccountId
    };

    // Persist to HCS
    const hcsResult = await this.hcsClient.submitMessage(
      this.globalSpaceTopic,
      JSON.stringify(spaceEvent)
    );

    // Store in cache with event metadata separate from canonical config
    const spaceRecord: SpaceRecord = {
      space: validatedSpace,
      eventMeta: hcsResult
    };
    this.spaceCache.set(validatedSpace.spaceId, spaceRecord);
    this.lastSequence = Math.max(this.lastSequence || 0, hcsResult.sequenceNumber);

    return validatedSpace;
  }

  /**
   * Update an existing space
   */
  async updateSpace(
    spaceId: SpaceKey,
    updates: Partial<TMSpaceV1>,
    operatorAccountId: string
  ): Promise<TMSpaceV1> {
    // Get current space
    const currentSpace = await this.getSpace(spaceId);
    if (!currentSpace) {
      throw new Error(`Space not found: ${spaceId}`);
    }

    // Validate operator has permission to update (owner or admin)
    if (!currentSpace.adminAccountIds.includes(operatorAccountId)) {
      throw new Error(`Insufficient permissions to update space: ${spaceId}`);
    }

    // Update the space
    const updatedSpace = updateSpaceEnvelope(currentSpace, updates);
    
    // Apply inheritance after update but before validation
    const inheritedSpace = await this.applyPolicyInheritance(updatedSpace);
    const validatedSpace = validateSpace(inheritedSpace);

    // Create update event
    const spaceEvent: SpaceEvent = {
      eventType: 'space.updated',
      spaceId: validatedSpace.spaceId,
      space: validatedSpace,
      timestamp: new Date().toISOString(),
      operatorAccountId
    };

    // Persist to HCS
    const hcsResult = await this.hcsClient.submitMessage(
      this.globalSpaceTopic,
      JSON.stringify(spaceEvent)
    );

    // Update cache with new event metadata
    const spaceRecord: SpaceRecord = {
      space: validatedSpace,
      eventMeta: hcsResult
    };
    this.spaceCache.set(spaceId, spaceRecord);
    this.lastSequence = Math.max(this.lastSequence || 0, hcsResult.sequenceNumber);

    return validatedSpace;
  }

  /**
   * Get space by ID
   */
  async getSpace(spaceId: SpaceKey): Promise<TMSpaceV1 | null> {
    // Check cache first
    const cached = this.spaceCache.get(spaceId);
    if (cached) {
      return cached.space;
    }

    // Load from HCS if not loaded yet
    if (!this.loaded) {
      await this.loadSpacesFromHCS();
      const reloaded = this.spaceCache.get(spaceId);
      return reloaded?.space || null;
    }

    return null;
  }

  /**
   * List all spaces (optionally filtered)
   */
  async listSpaces(filter?: {
    parentSpaceId?: SpaceKey;
    category?: string;
    status?: TMSpaceV1['status'];
    adminAccountId?: string;
  }): Promise<TMSpaceV1[]> {
    // Ensure spaces are loaded
    if (!this.loaded) {
      await this.loadSpacesFromHCS();
    }

    let spaces = Array.from(this.spaceCache.values()).map(record => record.space);

    if (filter) {
      if (filter.parentSpaceId !== undefined) {
        spaces = spaces.filter(s => s.parentSpaceId === filter.parentSpaceId);
      }
      if (filter.category) {
        spaces = spaces.filter(s => s.metadata.category === filter.category);
      }
      if (filter.status) {
        spaces = spaces.filter(s => s.status === filter.status);
      }
      if (filter.adminAccountId) {
        spaces = spaces.filter(s => s.adminAccountIds.includes(filter.adminAccountId!));
      }
    }

    return spaces;
  }

  /**
   * Archive a space (soft delete)
   */
  async archiveSpace(spaceId: SpaceKey, operatorAccountId: string): Promise<TMSpaceV1> {
    return this.updateSpace(spaceId, { status: 'archived' }, operatorAccountId);
  }

  /**
   * Suspend a space (temporary disable)
   */
  async suspendSpace(spaceId: SpaceKey, operatorAccountId: string): Promise<TMSpaceV1> {
    return this.updateSpace(spaceId, { status: 'suspended' }, operatorAccountId);
  }

  /**
   * Reactivate a suspended space
   */
  async reactivateSpace(spaceId: SpaceKey, operatorAccountId: string): Promise<TMSpaceV1> {
    return this.updateSpace(spaceId, { status: 'active' }, operatorAccountId);
  }

  /**
   * Get space hierarchy (parent and children)
   */
  async getSpaceHierarchy(spaceId: SpaceKey): Promise<{
    space: TMSpaceV1;
    parent?: TMSpaceV1;
    children: TMSpaceV1[];
  }> {
    const space = await this.getSpace(spaceId);
    if (!space) {
      throw new Error(`Space not found: ${spaceId}`);
    }

    const parent = space.parentSpaceId ? await this.getSpace(space.parentSpaceId) : undefined;
    const children = await this.listSpaces({ parentSpaceId: spaceId });

    return { space, parent: parent || undefined, children };
  }

  /**
   * Apply policy inheritance to a partial config (before enveloping)
   */
  private async applyPolicyInheritanceToConfig(
    input: Omit<TMSpaceV1, 'schema' | 'createdAt' | 'updatedAt' | 'configHash'>
  ): Promise<Omit<TMSpaceV1, 'schema' | 'createdAt' | 'updatedAt' | 'configHash'>> {
    if (!input.parentSpaceId) {
      return input; // Root space, no inheritance
    }

    const parentSpace = await this.getSpace(input.parentSpaceId);
    if (!parentSpace) {
      throw new Error(`Parent space not found: ${input.parentSpaceId}`);
    }

    // Apply inheritance rules to the input config
    let inheritedConfig = { ...input };

    for (const policyKey of this.inheritanceConfig.inheritablePolicies) {
      if (this.inheritanceConfig.mergeRules.includes(policyKey)) {
        // Merge policies (e.g., combine allowed lenses)
        inheritedConfig = this.mergePoliciesInConfig(inheritedConfig, parentSpace, policyKey);
      } else if (this.inheritanceConfig.allowOverrides.includes(policyKey)) {
        // Child can override, so keep child's policy if present
        if (!this.hasConfigPolicyOverride(input, policyKey)) {
          inheritedConfig = this.inheritPolicyInConfig(inheritedConfig, parentSpace, policyKey);
        }
      } else {
        // Inherit parent policy if child doesn't have meaningful config
        if (!this.hasConfigPolicyOverride(input, policyKey)) {
          inheritedConfig = this.inheritPolicyInConfig(inheritedConfig, parentSpace, policyKey);
        }
      }
    }

    return inheritedConfig;
  }

  /**
   * Apply policy inheritance to a full space (for updates)
   */
  private async applyPolicyInheritance(space: TMSpaceV1): Promise<TMSpaceV1> {
    if (!space.parentSpaceId) {
      return space; // Root space, no inheritance
    }

    const parentSpace = await this.getSpace(space.parentSpaceId);
    if (!parentSpace) {
      throw new Error(`Parent space not found: ${space.parentSpaceId}`);
    }

    // Recursively apply inheritance from parent chain
    const inheritedParent = await this.applyPolicyInheritance(parentSpace);
    
    // Apply inheritance rules
    let inheritedSpace = { ...space };

    for (const policyKey of this.inheritanceConfig.inheritablePolicies) {
      if (this.inheritanceConfig.mergeRules.includes(policyKey)) {
        // Merge policies (e.g., combine allowed lenses)
        inheritedSpace = this.mergePolicies(inheritedSpace, inheritedParent, policyKey);
      } else if (this.inheritanceConfig.allowOverrides.includes(policyKey)) {
        // Child can override, so keep child's policy if present
        if (!this.hasPolicyOverride(space, policyKey)) {
          inheritedSpace = this.inheritPolicy(inheritedSpace, inheritedParent, policyKey);
        }
      } else {
        // Inherit parent policy if child doesn't have meaningful config
        if (!this.hasPolicyOverride(space, policyKey)) {
          inheritedSpace = this.inheritPolicy(inheritedSpace, inheritedParent, policyKey);
        }
      }
    }

    return inheritedSpace;
  }

  /**
   * Check if config input has overridden a specific policy (more precise than full space check)
   */
  private hasConfigPolicyOverride(
    config: Omit<TMSpaceV1, 'schema' | 'createdAt' | 'updatedAt' | 'configHash'>,
    policyKey: keyof TMSpaceV1
  ): boolean {
    switch (policyKey) {
      case 'recognitionPolicy':
        const rp = config.recognitionPolicy;
        return !!rp && Array.isArray(rp.allowedLenses) && rp.allowedLenses.length > 0;
      case 'rbacConfig':
        const rc = config.rbacConfig;
        return !!rc && (rc.roles.length > 0 || rc.defaultRole !== 'member' || rc.requiresInvitation !== false);
      case 'complianceConfig':
        const cc = config.complianceConfig;
        return !!cc && (cc.jurisdiction !== undefined || cc.requiresKYC !== undefined || cc.requiresKYB !== undefined);
      default:
        return config[policyKey as keyof typeof config] != null;
    }
  }

  /**
   * Check if child space has overridden a specific policy (refined logic)
   */
  private hasPolicyOverride(space: TMSpaceV1, policyKey: keyof TMSpaceV1): boolean {
    switch (policyKey) {
      case 'recognitionPolicy':
        return !!space.recognitionPolicy && 
               Array.isArray(space.recognitionPolicy.allowedLenses) && 
               space.recognitionPolicy.allowedLenses.length > 0;
      case 'rbacConfig':
        return !!space.rbacConfig && 
               (space.rbacConfig.roles.length > 0 || 
                space.rbacConfig.defaultRole !== 'member' || 
                space.rbacConfig.requiresInvitation !== false);
      case 'complianceConfig':
        return !!space.complianceConfig && 
               (space.complianceConfig.jurisdiction !== undefined || 
                space.complianceConfig.requiresKYC !== undefined || 
                space.complianceConfig.requiresKYB !== undefined);
      default:
        return space[policyKey] != null;
    }
  }

  /**
   * Inherit a policy from parent to child
   */
  private inheritPolicy(child: TMSpaceV1, parent: TMSpaceV1, policyKey: keyof TMSpaceV1): TMSpaceV1 {
    if (policyKey === 'complianceConfig') {
      // Merge compliance config: parent values fill in undefined child values
      const childCC = child.complianceConfig;
      const parentCC = parent.complianceConfig;
      return {
        ...child,
        complianceConfig: {
          ...parentCC,
          ...childCC,
          // Parent fills in undefined child values
          requiresKYC: childCC.requiresKYC !== undefined ? childCC.requiresKYC : parentCC.requiresKYC,
          requiresKYB: childCC.requiresKYB !== undefined ? childCC.requiresKYB : parentCC.requiresKYB,
          jurisdiction: childCC.jurisdiction !== undefined ? childCC.jurisdiction : parentCC.jurisdiction,
        }
      };
    }
    return {
      ...child,
      [policyKey]: parent[policyKey]
    };
  }

  /**
   * Inherit a policy in config (before enveloping)
   */
  private inheritPolicyInConfig(
    config: Omit<TMSpaceV1, 'schema' | 'createdAt' | 'updatedAt' | 'configHash'>,
    parent: TMSpaceV1,
    policyKey: keyof TMSpaceV1
  ): Omit<TMSpaceV1, 'schema' | 'createdAt' | 'updatedAt' | 'configHash'> {
    if (policyKey === 'complianceConfig') {
      // Merge compliance config: parent values fill in undefined child values
      const childCC = config.complianceConfig;
      const parentCC = parent.complianceConfig;
      return {
        ...config,
        complianceConfig: {
          ...parentCC,
          ...childCC,
          // Parent fills in undefined child values
          requiresKYC: childCC.requiresKYC !== undefined ? childCC.requiresKYC : parentCC.requiresKYC,
          requiresKYB: childCC.requiresKYB !== undefined ? childCC.requiresKYB : parentCC.requiresKYB,
          jurisdiction: childCC.jurisdiction !== undefined ? childCC.jurisdiction : parentCC.jurisdiction,
        }
      };
    }
    return {
      ...config,
      [policyKey]: parent[policyKey]
    };
  }

  /**
   * Merge policies between parent and child (full spaces)
   */
  private mergePolicies(child: TMSpaceV1, parent: TMSpaceV1, policyKey: keyof TMSpaceV1): TMSpaceV1 {
    if (policyKey === 'recognitionPolicy') {
      const childPolicy = child.recognitionPolicy;
      const parentPolicy = parent.recognitionPolicy;
      
      // Merge allowed lenses (union)
      const mergedAllowedLenses = Array.from(new Set([
        ...parentPolicy.allowedLenses,
        ...childPolicy.allowedLenses
      ]));

      // Child overrides other settings, but lenses are merged
      return {
        ...child,
        recognitionPolicy: {
          ...childPolicy,
          allowedLenses: mergedAllowedLenses
        }
      };
    }
    
    if (policyKey === 'complianceConfig') {
      // Merge compliance config: parent values fill in undefined child values
      const childCC = child.complianceConfig;
      const parentCC = parent.complianceConfig;
      return {
        ...child,
        complianceConfig: {
          ...parentCC,
          ...childCC,
          // Parent fills in undefined child values
          requiresKYC: childCC.requiresKYC !== undefined ? childCC.requiresKYC : parentCC.requiresKYC,
          requiresKYB: childCC.requiresKYB !== undefined ? childCC.requiresKYB : parentCC.requiresKYB,
          jurisdiction: childCC.jurisdiction !== undefined ? childCC.jurisdiction : parentCC.jurisdiction,
        }
      };
    }

    // Default: child overrides parent
    return child;
  }

  /**
   * Merge policies in config (before enveloping)
   */
  private mergePoliciesInConfig(
    config: Omit<TMSpaceV1, 'schema' | 'createdAt' | 'updatedAt' | 'configHash'>,
    parent: TMSpaceV1,
    policyKey: keyof TMSpaceV1
  ): Omit<TMSpaceV1, 'schema' | 'createdAt' | 'updatedAt' | 'configHash'> {
    if (policyKey === 'recognitionPolicy') {
      const childPolicy = config.recognitionPolicy;
      const parentPolicy = parent.recognitionPolicy;
      
      // Merge allowed lenses (union)
      const mergedAllowedLenses = Array.from(new Set([
        ...parentPolicy.allowedLenses,
        ...childPolicy.allowedLenses
      ]));

      // Child overrides other settings, but lenses are merged
      return {
        ...config,
        recognitionPolicy: {
          ...childPolicy,
          allowedLenses: mergedAllowedLenses
        }
      };
    }
    
    if (policyKey === 'complianceConfig') {
      // Merge compliance config: parent values fill in undefined child values
      const childCC = config.complianceConfig;
      const parentCC = parent.complianceConfig;
      return {
        ...config,
        complianceConfig: {
          ...parentCC,
          ...childCC,
          // Parent fills in undefined child values
          requiresKYC: childCC.requiresKYC !== undefined ? childCC.requiresKYC : parentCC.requiresKYC,
          requiresKYB: childCC.requiresKYB !== undefined ? childCC.requiresKYB : parentCC.requiresKYB,
          jurisdiction: childCC.jurisdiction !== undefined ? childCC.jurisdiction : parentCC.jurisdiction,
        }
      };
    }

    // Default: child overrides parent
    return config;
  }

  /**
   * Load all spaces from HCS into cache (with loading flag)
   */
  private async loadSpacesFromHCS(): Promise<void> {
    if (this.loaded) return;

    try {
      const messages = await this.hcsClient.getMessages(this.globalSpaceTopic, {
        sinceSequence: this.lastSequence,
        limit: 1000 // Reasonable batch size
      });
      
      // Process messages in order to reconstruct current state
      for (const message of messages) {
        try {
          const spaceEvent: SpaceEvent = JSON.parse(message.message);
          
          // Apply event to cache
          switch (spaceEvent.eventType) {
            case 'space.created':
            case 'space.updated':
              const spaceRecord: SpaceRecord = {
                space: spaceEvent.space,
                eventMeta: {
                  sequenceNumber: message.sequenceNumber,
                  consensusTimestamp: message.consensusTimestamp
                }
              };
              this.spaceCache.set(spaceEvent.spaceId, spaceRecord);
              this.lastSequence = Math.max(this.lastSequence || 0, message.sequenceNumber);
              break;
            case 'space.archived':
            case 'space.suspended':
              // These are handled via space.updated events with status changes
              break;
          }
        } catch (parseError) {
          console.warn(`Failed to parse space event: ${parseError}`);
        }
      }

      this.loaded = true;
    } catch (error) {
      console.error(`Failed to load spaces from HCS: ${error}`);
      throw error;
    }
  }

  /**
   * Get event metadata for a space (useful for debugging/auditing)
   */
  async getSpaceEventMeta(spaceId: SpaceKey): Promise<{ sequenceNumber: number; consensusTimestamp: string } | null> {
    const record = this.spaceCache.get(spaceId);
    if (!record) {
      await this.loadSpacesFromHCS();
      const reloaded = this.spaceCache.get(spaceId);
      return reloaded?.eventMeta || null;
    }
    return record.eventMeta || null;
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.spaceCache.clear();
    this.loaded = false;
    this.lastSequence = undefined;
  }
}

// Factory function for creating space registry with mock HCS client
export function createMockSpaceRegistry(globalSpaceTopic: string = '0.0.999'): SpaceRegistry {
  const mockHCSClient: HCSClient = {
    async submitMessage(topicId: string, message: string) {
      console.log(`[MOCK HCS] Submit to ${topicId}: ${message.substring(0, 100)}...`);
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

  return new SpaceRegistry(mockHCSClient, globalSpaceTopic);
}

// Export types for use in other modules
export type { HCSClient, SpaceEvent, PolicyInheritanceConfig, SpaceRecord };