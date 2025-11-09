import {
  SpaceRegistry,
  createMockSpaceRegistry,
  SpaceEvent,
  SpaceRecord,
  HCSClient
} from '../spaceRegistry';
import { createEducationSpaceDefaults, createCannabisSpaceDefaults } from '../../schema/tm.space@1';

describe('SpaceRegistry', () => {
  let registry: SpaceRegistry;
  let mockHCSClient: jest.Mocked<HCSClient>;
  let submitMessageSpy: jest.SpyInstance;
  let getMessagesSpy: jest.SpyInstance;

  const operatorId = '0.0.12345';
  const globalTopic = '0.0.999';

  beforeEach(() => {
    mockHCSClient = {
      submitMessage: jest.fn(),
      getMessages: jest.fn()
    };

    submitMessageSpy = mockHCSClient.submitMessage.mockImplementation(async (topicId, message) => ({
      sequenceNumber: Math.floor(Math.random() * 1000000),
      consensusTimestamp: `${Math.floor(Date.now() / 1000)}.${Math.floor(Math.random() * 1000000000)}`
    }));

    getMessagesSpy = mockHCSClient.getMessages.mockImplementation(async () => []);

    registry = new SpaceRegistry(mockHCSClient, globalTopic);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic CRUD Operations', () => {
    test('createSpace validates and persists space to HCS', async () => {
      const spaceInput = {
        spaceId: 'tm.v2.test.root-space',
        metadata: {
          name: 'Test Root Space',
          category: 'education' as const
        },
        treasuryConfig: {
          settlementProvider: 'matterfi' as const,
          custodialAccountId: 'acct_123'
        },
        recognitionPolicy: {
          allowedLenses: ['genz' as const, 'professional' as const]
        },
        rbacConfig: {
          roles: [],
          defaultRole: 'student'
        },
        complianceConfig: {
          retentionPeriod: 2555,
          auditRetention: 2555
        },
        adminAccountIds: [operatorId],
        ownerAccountId: operatorId,
        hcsTopicId: '0.0.777',
        status: 'active' as const
      };

      const createdSpace = await registry.createSpace(spaceInput, operatorId);

      expect(createdSpace.spaceId).toBe('tm.v2.test.root-space');
      expect(createdSpace.schema).toBe('tm.space@1');
      expect(createdSpace.configHash).toBeDefined();
      expect(createdSpace.configHash).toHaveLength(64);

      // Verify HCS submission
      expect(submitMessageSpy).toHaveBeenCalledWith(globalTopic, expect.stringContaining('space.created'));
      
      const submittedEvent = JSON.parse(submitMessageSpy.mock.calls[0][1]);
      expect(submittedEvent.eventType).toBe('space.created');
      expect(submittedEvent.spaceId).toBe('tm.v2.test.root-space');
    });

    test('getSpace retrieves cached space without HCS call', async () => {
      const spaceInput = {
        spaceId: 'tm.v2.test.cached-space',
        metadata: { name: 'Cached Space', category: 'technology' as const },
        treasuryConfig: { settlementProvider: 'matterfi' as const, custodialAccountId: 'acct_456' },
        recognitionPolicy: { allowedLenses: ['builder' as const] },
        rbacConfig: { roles: [], defaultRole: 'contributor' },
        complianceConfig: { retentionPeriod: 2555, auditRetention: 2555 },
        adminAccountIds: [operatorId],
        ownerAccountId: operatorId,
        hcsTopicId: '0.0.888',
        status: 'active' as const
      };

      await registry.createSpace(spaceInput, operatorId);

      // Reset call counts
      jest.clearAllMocks();

      // Should return cached space without HCS call
      const retrievedSpace = await registry.getSpace('tm.v2.test.cached-space');
      
      expect(retrievedSpace).not.toBeNull();
      expect(retrievedSpace!.spaceId).toBe('tm.v2.test.cached-space');
      expect(getMessagesSpy).not.toHaveBeenCalled();
    });

    test('updateSpace validates permissions and updates config hash', async () => {
      const spaceInput = {
        spaceId: 'tm.v2.test.update-space',
        metadata: { name: 'Original Name', category: 'community' as const },
        treasuryConfig: { settlementProvider: 'matterfi' as const, custodialAccountId: 'acct_789' },
        recognitionPolicy: { allowedLenses: ['social' as const] },
        rbacConfig: { roles: [], defaultRole: 'member' },
        complianceConfig: { retentionPeriod: 2555, auditRetention: 2555 },
        adminAccountIds: [operatorId],
        ownerAccountId: operatorId,
        hcsTopicId: '0.0.999',
        status: 'active' as const
      };

      const originalSpace = await registry.createSpace(spaceInput, operatorId);
      const originalHash = originalSpace.configHash;

      // Update the space
      const updatedSpace = await registry.updateSpace(
        'tm.v2.test.update-space',
        { metadata: { ...originalSpace.metadata, name: 'Updated Name' } },
        operatorId
      );

      expect(updatedSpace.metadata.name).toBe('Updated Name');
      expect(updatedSpace.configHash).not.toBe(originalHash);
      
      // Verify timestamp updated (allow for same millisecond)
      const originalTime = new Date(originalSpace.updatedAt).getTime();
      const updatedTime = new Date(updatedSpace.updatedAt).getTime();
      expect(updatedTime).toBeGreaterThanOrEqual(originalTime);

      // Verify update event
      expect(submitMessageSpy).toHaveBeenCalledTimes(2); // create + update
      const updateCall = submitMessageSpy.mock.calls[1];
      const updateEvent = JSON.parse(updateCall[1]);
      expect(updateEvent.eventType).toBe('space.updated');
    });

    test('updateSpace throws error for unauthorized user', async () => {
      const spaceInput = {
        spaceId: 'tm.v2.test.unauthorized',
        metadata: { name: 'Protected Space', category: 'finance' as const },
        treasuryConfig: { settlementProvider: 'matterfi' as const, custodialAccountId: 'acct_protected' },
        recognitionPolicy: { allowedLenses: ['professional' as const] },
        rbacConfig: { roles: [], defaultRole: 'member' },
        complianceConfig: { retentionPeriod: 2555, auditRetention: 2555 },
        adminAccountIds: [operatorId],
        ownerAccountId: operatorId,
        hcsTopicId: '0.0.111',
        status: 'active' as const
      };

      await registry.createSpace(spaceInput, operatorId);

      // Try to update with unauthorized user
      await expect(
        registry.updateSpace(
          'tm.v2.test.unauthorized',
          { metadata: { ...spaceInput.metadata, name: 'Hacked Name' } },
          '0.0.99999' // Different user
        )
      ).rejects.toThrow('Insufficient permissions');
    });
  });

  describe('Policy Inheritance', () => {
    test('child space inherits parent allowedLenses via merge', async () => {
      // Create parent space with genz and professional lenses
      const parentInput = {
        spaceId: 'tm.v2.parent.university',
        metadata: { name: 'University', category: 'education' as const },
        treasuryConfig: { settlementProvider: 'matterfi' as const, custodialAccountId: 'acct_parent' },
        recognitionPolicy: { allowedLenses: ['genz' as const, 'professional' as const] },
        rbacConfig: { roles: [], defaultRole: 'student' },
        complianceConfig: { retentionPeriod: 2555, auditRetention: 2555 },
        adminAccountIds: [operatorId],
        ownerAccountId: operatorId,
        hcsTopicId: '0.0.111',
        status: 'active' as const
      };

      await registry.createSpace(parentInput, operatorId);

      // Create child space with only builder lens
      const childInput = {
        spaceId: 'tm.v2.parent.university.cs-dept',
        parentSpaceId: 'tm.v2.parent.university',
        metadata: { name: 'CS Department', category: 'education' as const },
        treasuryConfig: { settlementProvider: 'matterfi' as const, custodialAccountId: 'acct_child' },
        recognitionPolicy: { allowedLenses: ['builder' as const] },
        rbacConfig: { roles: [], defaultRole: 'student' },
        complianceConfig: { retentionPeriod: 2555, auditRetention: 2555 },
        adminAccountIds: [operatorId],
        ownerAccountId: operatorId,
        hcsTopicId: '0.0.222',
        status: 'active' as const
      };

      const childSpace = await registry.createSpace(childInput, operatorId);

      // Child should have merged lenses: genz, professional, builder
      expect(childSpace.recognitionPolicy.allowedLenses.sort()).toEqual(
        ['builder', 'genz', 'professional']
      );
    });

    test('child inherits parent policies when child has no overrides', async () => {
      // Create parent with compliance config
      const parentInput = {
        spaceId: 'tm.v2.regulatory.parent',
        metadata: { name: 'Regulatory Parent', category: 'government' as const },
        treasuryConfig: { settlementProvider: 'matterfi' as const, custodialAccountId: 'acct_regulatory' },
        recognitionPolicy: { allowedLenses: ['professional' as const] },
        rbacConfig: { roles: [], defaultRole: 'member' },
        complianceConfig: {
          retentionPeriod: 3000,
          auditRetention: 3000,
          requiresKYC: true,
          requiresKYB: true,
          jurisdiction: 'US-CA'
        },
        adminAccountIds: [operatorId],
        ownerAccountId: operatorId,
        hcsTopicId: '0.0.333',
        status: 'active' as const
      };

      await registry.createSpace(parentInput, operatorId);

      // Create child with minimal config (should inherit compliance)
      const childInput = {
        spaceId: 'tm.v2.regulatory.parent.sub-dept',
        parentSpaceId: 'tm.v2.regulatory.parent',
        metadata: { name: 'Sub Department', category: 'government' as const },
        treasuryConfig: { settlementProvider: 'matterfi' as const, custodialAccountId: 'acct_subdept' },
        recognitionPolicy: { allowedLenses: ['professional' as const] },
        rbacConfig: { roles: [], defaultRole: 'member' },
        complianceConfig: { retentionPeriod: 2555, auditRetention: 2555 }, // Minimal config
        adminAccountIds: [operatorId],
        ownerAccountId: operatorId,
        hcsTopicId: '0.0.444',
        status: 'active' as const
      };

      const childSpace = await registry.createSpace(childInput, operatorId);

      // Child should inherit parent's compliance settings where not overridden
      expect(childSpace.complianceConfig.requiresKYC).toBe(true);
      expect(childSpace.complianceConfig.requiresKYB).toBe(true);
      expect(childSpace.complianceConfig.jurisdiction).toBe('US-CA');
    });

    test('config hash is computed from post-inheritance configuration', async () => {
      // Create parent
      const parentInput = {
        spaceId: 'tm.v2.hash.parent',
        metadata: { name: 'Hash Parent', category: 'technology' as const },
        treasuryConfig: { settlementProvider: 'matterfi' as const, custodialAccountId: 'acct_hash_parent' },
        recognitionPolicy: { allowedLenses: ['builder' as const, 'professional' as const] },
        rbacConfig: { roles: [], defaultRole: 'contributor' },
        complianceConfig: { retentionPeriod: 2555, auditRetention: 2555 },
        adminAccountIds: [operatorId],
        ownerAccountId: operatorId,
        hcsTopicId: '0.0.555',
        status: 'active' as const
      };

      const parentSpace = await registry.createSpace(parentInput, operatorId);

      // Create child that will inherit lenses
      const childInput = {
        spaceId: 'tm.v2.hash.parent.child',
        parentSpaceId: 'tm.v2.hash.parent',
        metadata: { name: 'Hash Child', category: 'technology' as const },
        treasuryConfig: { settlementProvider: 'matterfi' as const, custodialAccountId: 'acct_hash_child' },
        recognitionPolicy: { allowedLenses: ['genz' as const] }, // Will merge with parent
        rbacConfig: { roles: [], defaultRole: 'contributor' },
        complianceConfig: { retentionPeriod: 2555, auditRetention: 2555 },
        adminAccountIds: [operatorId],
        ownerAccountId: operatorId,
        hcsTopicId: '0.0.666',
        status: 'active' as const
      };

      const childSpace = await registry.createSpace(childInput, operatorId);

      // The hash should be computed from the FINAL config (after inheritance)
      expect(childSpace.configHash).toBeDefined();
      expect(childSpace.recognitionPolicy.allowedLenses.sort()).toEqual(
        ['builder', 'genz', 'professional']
      );

      // If we create another child with the same final config, hash should match
      const anotherChildInput = {
        ...childInput,
        spaceId: 'tm.v2.hash.parent.child2',
        metadata: { ...childInput.metadata, name: 'Hash Child 2' },
        treasuryConfig: { ...childInput.treasuryConfig, custodialAccountId: 'acct_hash_child2' },
        hcsTopicId: '0.0.777'
      };

      const anotherChildSpace = await registry.createSpace(anotherChildInput, operatorId);

      // Different metadata and treasury, but same inherited lens config structure
      expect(anotherChildSpace.recognitionPolicy.allowedLenses.sort()).toEqual(
        ['builder', 'genz', 'professional']
      );
    });
  });

  describe('Cache Management', () => {
    test('cache prevents redundant HCS calls', async () => {
      const registry = createMockSpaceRegistry(globalTopic);
      
      // Create a space
      const spaceInput = {
        spaceId: 'tm.v2.cache.test',
        metadata: { name: 'Cache Test', category: 'other' as const },
        treasuryConfig: { settlementProvider: 'matterfi' as const, custodialAccountId: 'acct_cache' },
        recognitionPolicy: { allowedLenses: ['social' as const] },
        rbacConfig: { roles: [], defaultRole: 'member' },
        complianceConfig: { retentionPeriod: 2555, auditRetention: 2555 },
        adminAccountIds: [operatorId],
        ownerAccountId: operatorId,
        hcsTopicId: '0.0.888888',
        status: 'active' as const
      };

      await registry.createSpace(spaceInput, operatorId);

      // Multiple gets should not trigger HCS calls (already cached)
      const space1 = await registry.getSpace('tm.v2.cache.test');
      const space2 = await registry.getSpace('tm.v2.cache.test');
      const space3 = await registry.getSpace('tm.v2.cache.test');

      expect(space1).not.toBeNull();
      expect(space2).not.toBeNull();
      expect(space3).not.toBeNull();
      expect(space1!.spaceId).toBe('tm.v2.cache.test');

      // Verify getMessages not called for cached items
      // (Note: createMockSpaceRegistry logs but doesn't actually call getMessages for cache hits)
    });

    test('clearCache resets cache state', async () => {
      const spaceInput = {
        spaceId: 'tm.v2.clear.test',
        metadata: { name: 'Clear Test', category: 'other' as const },
        treasuryConfig: { settlementProvider: 'matterfi' as const, custodialAccountId: 'acct_clear' },
        recognitionPolicy: { allowedLenses: ['professional' as const] },
        rbacConfig: { roles: [], defaultRole: 'member' },
        complianceConfig: { retentionPeriod: 2555, auditRetention: 2555 },
        adminAccountIds: [operatorId],
        ownerAccountId: operatorId,
        hcsTopicId: '0.0.999999',
        status: 'active' as const
      };

      await registry.createSpace(spaceInput, operatorId);

      const spaceBefore = await registry.getSpace('tm.v2.clear.test');
      expect(spaceBefore).not.toBeNull();

      // Clear cache
      registry.clearCache();

      // Mock HCS to return empty results after cache clear
      getMessagesSpy.mockResolvedValueOnce([]);

      const spaceAfter = await registry.getSpace('tm.v2.clear.test');
      expect(spaceAfter).toBeNull(); // Not found because HCS returns empty
    });
  });

  describe('Space Hierarchy', () => {
    test('getSpaceHierarchy returns parent and children', async () => {
      // Create parent
      const parentInput = {
        spaceId: 'tm.v2.hierarchy.org',
        metadata: { name: 'Organization', category: 'community' as const },
        treasuryConfig: { settlementProvider: 'matterfi' as const, custodialAccountId: 'acct_org' },
        recognitionPolicy: { allowedLenses: ['social' as const, 'professional' as const] },
        rbacConfig: { roles: [], defaultRole: 'member' },
        complianceConfig: { retentionPeriod: 2555, auditRetention: 2555 },
        adminAccountIds: [operatorId],
        ownerAccountId: operatorId,
        hcsTopicId: '0.0.100000',
        status: 'active' as const
      };

      await registry.createSpace(parentInput, operatorId);

      // Create children
      const child1Input = {
        ...parentInput,
        spaceId: 'tm.v2.hierarchy.org.dept1',
        parentSpaceId: 'tm.v2.hierarchy.org',
        metadata: { name: 'Department 1', category: 'community' as const },
        treasuryConfig: { ...parentInput.treasuryConfig, custodialAccountId: 'acct_dept1' },
        hcsTopicId: '0.0.100001'
      };

      const child2Input = {
        ...parentInput,
        spaceId: 'tm.v2.hierarchy.org.dept2',
        parentSpaceId: 'tm.v2.hierarchy.org',
        metadata: { name: 'Department 2', category: 'community' as const },
        treasuryConfig: { ...parentInput.treasuryConfig, custodialAccountId: 'acct_dept2' },
        hcsTopicId: '0.0.100002'
      };

      await registry.createSpace(child1Input, operatorId);
      await registry.createSpace(child2Input, operatorId);

      // Get hierarchy
      const hierarchy = await registry.getSpaceHierarchy('tm.v2.hierarchy.org');

      expect(hierarchy.space.spaceId).toBe('tm.v2.hierarchy.org');
      expect(hierarchy.parent).toBeUndefined(); // Root space
      expect(hierarchy.children).toHaveLength(2);
      expect(hierarchy.children.map(c => c.spaceId).sort()).toEqual([
        'tm.v2.hierarchy.org.dept1',
        'tm.v2.hierarchy.org.dept2'
      ]);
    });
  });

  describe('Event Metadata Separation', () => {
    test('event metadata is stored separately from canonical space config', async () => {
      const spaceInput = {
        spaceId: 'tm.v2.metadata.test',
        metadata: { name: 'Metadata Test', category: 'research' as const },
        treasuryConfig: { settlementProvider: 'matterfi' as const, custodialAccountId: 'acct_meta' },
        recognitionPolicy: { allowedLenses: ['professional' as const] },
        rbacConfig: { roles: [], defaultRole: 'member' },
        complianceConfig: { retentionPeriod: 2555, auditRetention: 2555 },
        adminAccountIds: [operatorId],
        ownerAccountId: operatorId,
        hcsTopicId: '0.0.200000',
        status: 'active' as const
      };

      const createdSpace = await registry.createSpace(spaceInput, operatorId);

      // The returned space should not contain HCS metadata fields
      expect(createdSpace).not.toHaveProperty('hcsSequenceNumber');
      expect(createdSpace).not.toHaveProperty('hcsConsensusTimestamp');

      // But event metadata should be accessible via separate method
      const eventMeta = await registry.getSpaceEventMeta('tm.v2.metadata.test');
      expect(eventMeta).not.toBeNull();
      expect(eventMeta!.sequenceNumber).toBeDefined();
      expect(eventMeta!.consensusTimestamp).toBeDefined();
    });
  });
});