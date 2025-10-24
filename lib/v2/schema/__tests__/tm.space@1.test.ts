import {
  validateSpace,
  isValidSpace,
  createSpaceEnvelope,
  updateSpaceEnvelope,
  createCannabisSpaceDefaults,
  createEducationSpaceDefaults,
  createTechSpaceDefaults,
  TMSpaceV1Schema
} from '../tm.space@1';

describe('TM Space V1 Schema', () => {
  const validBaseSpace = {
    spaceId: 'tm.v2.crafttrust.dispensary-1',
    metadata: {
      name: 'CraftTrust Dispensary 1',
      category: 'cannabis' as const,
      tags: []
    },
    treasuryConfig: {
      settlementProvider: 'matterfi' as const,
      tokenSymbol: 'TRST',
      tokenDecimals: 18,
      custodialAccountId: 'acct_123'
    },
    recognitionPolicy: {
      allowedLenses: ['professional' as const, 'social' as const],
      autoApprove: false,
      requiresModeration: true,
      enableRewards: true,
      maxAttachments: 5
    },
    rbacConfig: {
      roles: [],
      defaultRole: 'member',
      requiresInvitation: true,
      allowSelfRegistration: false
    },
    complianceConfig: {
      retentionPeriod: 2555,
      allowsDataExport: true,
      requiresAuditLog: true,
      auditRetention: 2555
    },
    adminAccountIds: ['0.0.12345'],
    ownerAccountId: '0.0.12345',
    hcsTopicId: '0.0.777',
    status: 'active' as const
  };

  describe('Valid Space Examples', () => {
    test('Cannabis space validates successfully', () => {
      const envelope = createSpaceEnvelope(validBaseSpace);
      
      expect(() => validateSpace(envelope)).not.toThrow();
      expect(isValidSpace(envelope)).toBe(true);
      expect(envelope.schema).toBe('tm.space@1');
      expect(envelope.configHash).toBeDefined();
      expect(envelope.configHash).toHaveLength(64); // SHA-256 hex
    });

    test('Education space validates successfully', () => {
      const educationDefaults = createEducationSpaceDefaults();
      const educationSpace = createSpaceEnvelope({
        ...validBaseSpace,
        ...educationDefaults,
        spaceId: 'tm.v2.ucla.cs-dept',
        metadata: {
          ...educationDefaults.metadata!,
          name: 'UCLA Computer Science Department'
        },
        treasuryConfig: {
          ...validBaseSpace.treasuryConfig,
          custodialAccountId: 'acct_edu_123'
        }
      });
      
      expect(() => validateSpace(educationSpace)).not.toThrow();
      expect(educationSpace.metadata.category).toBe('education');
      expect(educationSpace.recognitionPolicy.rewardMultiplier).toBe(1.2);
    });

    test('Tech space validates successfully', () => {
      const techDefaults = createTechSpaceDefaults();
      const techSpace = createSpaceEnvelope({
        ...validBaseSpace,
        ...techDefaults,
        spaceId: 'tm.v2.hackathon.buidl-week',
        metadata: {
          ...techDefaults.metadata!,
          name: 'Buidl Week Hackathon'
        },
        treasuryConfig: {
          ...validBaseSpace.treasuryConfig,
          custodialAccountId: 'acct_tech_123'
        }
      });
      
      expect(() => validateSpace(techSpace)).not.toThrow();
      expect(techSpace.recognitionPolicy.allowedLenses).toEqual(['builder', 'professional']);
    });
  });

  describe('Business Rules Validation', () => {
    test('MatterFi provider requires custodialAccountId', () => {
      const invalidSpace = {
        ...validBaseSpace,
        treasuryConfig: {
          ...validBaseSpace.treasuryConfig,
          settlementProvider: 'matterfi' as const,
          custodialAccountId: undefined // Missing required field
        }
      };
      
      const envelope = createSpaceEnvelope(invalidSpace as any);
      expect(isValidSpace(envelope)).toBe(false);
      
      const result = TMSpaceV1Schema.safeParse(envelope);
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map(i => i.message);
        expect(messages.some(m => m.includes('matterfi requires treasuryConfig.custodialAccountId'))).toBe(true);
      }
    });

    test('Hedera native provider requires hederaAccountId', () => {
      const invalidSpace = {
        ...validBaseSpace,
        treasuryConfig: {
          ...validBaseSpace.treasuryConfig,
          settlementProvider: 'hedera_native' as const,
          custodialAccountId: undefined,
          hederaAccountId: undefined // Missing required field
        }
      };
      
      const envelope = createSpaceEnvelope(invalidSpace as any);
      expect(isValidSpace(envelope)).toBe(false);
      
      const result = TMSpaceV1Schema.safeParse(envelope);
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map(i => i.message);
        expect(messages.some(m => m.includes('hedera_native requires treasuryConfig.hederaAccountId'))).toBe(true);
      }
    });

    test('Owner must be included in adminAccountIds', () => {
      const invalidSpace = {
        ...validBaseSpace,
        adminAccountIds: ['0.0.99999'], // Owner not included
        ownerAccountId: '0.0.12345'
      };
      
      const envelope = createSpaceEnvelope(invalidSpace);
      expect(isValidSpace(envelope)).toBe(false);
      
      const result = TMSpaceV1Schema.safeParse(envelope);
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map(i => i.message);
        expect(messages.some(m => m.includes('ownerAccountId must be included in adminAccountIds'))).toBe(true);
      }
    });

    test('Moderation conflicts with autoApprove=true', () => {
      const invalidSpace = {
        ...validBaseSpace,
        recognitionPolicy: {
          ...validBaseSpace.recognitionPolicy,
          requiresModeration: true,
          autoApprove: true // Conflicting configuration
        }
      };
      
      const envelope = createSpaceEnvelope(invalidSpace);
      expect(isValidSpace(envelope)).toBe(false);
      
      const result = TMSpaceV1Schema.safeParse(envelope);
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map(i => i.message);
        expect(messages.some(m => m.includes('requiresModeration conflicts with autoApprove=true'))).toBe(true);
      }
    });

    test('Audit retention must be >= retention period', () => {
      const invalidSpace = {
        ...validBaseSpace,
        complianceConfig: {
          ...validBaseSpace.complianceConfig,
          retentionPeriod: 2555,
          auditRetention: 1000 // Less than retention period
        }
      };
      
      const envelope = createSpaceEnvelope(invalidSpace);
      expect(isValidSpace(envelope)).toBe(false);
      
      const result = TMSpaceV1Schema.safeParse(envelope);
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map(i => i.message);
        expect(messages.some(m => m.includes('auditRetention must be >= retentionPeriod'))).toBe(true);
      }
    });
  });

  describe('Update Envelope Functionality', () => {
    test('updateSpaceEnvelope bumps updatedAt and recalculates hash', async () => {
      const envelope = createSpaceEnvelope(validBaseSpace);
      const originalUpdatedAt = envelope.updatedAt;
      const originalHash = envelope.configHash;
      
      // Wait to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const updated = updateSpaceEnvelope(envelope, {
        metadata: {
          ...envelope.metadata,
          name: 'Updated Name'
        }
      });
      
      expect(updated.updatedAt).not.toBe(originalUpdatedAt);
      expect(updated.configHash).not.toBe(originalHash); // Hash should change
      expect(updated.metadata.name).toBe('Updated Name');
    });
  });

  describe('Default Configurations', () => {
    test('Cannabis defaults have correct compliance settings', () => {
      const defaults = createCannabisSpaceDefaults();
      
      expect(defaults.metadata?.category).toBe('cannabis');
      expect(defaults.recognitionPolicy?.requiresModeration).toBe(true);
      expect(defaults.recognitionPolicy?.autoApprove).toBe(false);
      expect(defaults.rbacConfig?.requiresInvitation).toBe(true);
      expect(defaults.rbacConfig?.allowSelfRegistration).toBe(false);
      expect(defaults.complianceConfig?.requiresKYC).toBe(true);
      expect(defaults.complianceConfig?.requiresKYB).toBe(true);
      expect(defaults.complianceConfig?.complianceFramework).toEqual(['280E', 'CA-CDPH']);
    });

    test('Education defaults promote open access', () => {
      const defaults = createEducationSpaceDefaults();
      
      expect(defaults.metadata?.category).toBe('education');
      expect(defaults.recognitionPolicy?.rewardMultiplier).toBe(1.2);
      expect(defaults.recognitionPolicy?.autoApprove).toBe(true);
      expect(defaults.rbacConfig?.requiresInvitation).toBe(false);
      expect(defaults.rbacConfig?.allowSelfRegistration).toBe(true);
      expect(defaults.rbacConfig?.defaultRole).toBe('student');
    });

    test('Tech defaults require evidence for builders', () => {
      const defaults = createTechSpaceDefaults();
      
      expect(defaults.metadata?.category).toBe('technology');
      expect(defaults.recognitionPolicy?.allowedLenses).toEqual(['builder', 'professional']);
      expect(defaults.recognitionPolicy?.requiresEvidence).toBe(true);
      expect(defaults.rbacConfig?.defaultRole).toBe('contributor');
    });
  });

  describe('Schema Field Validation', () => {
    test('Invalid space key format fails validation', () => {
      const invalidSpace = {
        ...validBaseSpace,
        spaceId: 'invalid space key with spaces'
      };
      
      const envelope = createSpaceEnvelope(invalidSpace as any);
      expect(isValidSpace(envelope)).toBe(false);
    });

    test('Invalid Hedera account ID format fails validation', () => {
      const invalidSpace = {
        ...validBaseSpace,
        ownerAccountId: 'invalid-account-id'
      };
      
      const envelope = createSpaceEnvelope(invalidSpace as any);
      expect(isValidSpace(envelope)).toBe(false);
    });

    test('Social links platform validation works', () => {
      const spaceWithSocial = {
        ...validBaseSpace,
        metadata: {
          ...validBaseSpace.metadata,
          socialLinks: [
            { platform: 'x' as const, url: 'https://x.com/crafttrust' },
            { platform: 'github' as const, url: 'https://github.com/crafttrust' }
          ]
        }
      };
      
      const envelope = createSpaceEnvelope(spaceWithSocial);
      expect(isValidSpace(envelope)).toBe(true);
      expect(envelope.metadata.socialLinks).toHaveLength(2);
    });

    test('Token decimals validation (0-18 range)', () => {
      const validSpace18 = {
        ...validBaseSpace,
        treasuryConfig: { ...validBaseSpace.treasuryConfig, tokenDecimals: 18 }
      };
      
      const validSpace0 = {
        ...validBaseSpace,
        treasuryConfig: { ...validBaseSpace.treasuryConfig, tokenDecimals: 0 }
      };
      
      const invalidSpace = {
        ...validBaseSpace,
        treasuryConfig: { ...validBaseSpace.treasuryConfig, tokenDecimals: 25 }
      };
      
      expect(isValidSpace(createSpaceEnvelope(validSpace18))).toBe(true);
      expect(isValidSpace(createSpaceEnvelope(validSpace0))).toBe(true);
      expect(isValidSpace(createSpaceEnvelope(invalidSpace as any))).toBe(false);
    });

    test('Borderline space key validation', () => {
      // Test max length (64 chars) with allowed characters
      const maxLengthKey = 'tm.v2.' + 'a'.repeat(58); // 64 total chars
      const validSpaceMaxLength = {
        ...validBaseSpace,
        spaceId: maxLengthKey
      };
      expect(isValidSpace(createSpaceEnvelope(validSpaceMaxLength))).toBe(true);

      // Test with dots and underscores
      const complexKey = 'tm.v2.org_name.sub-dept.location-1';
      const validSpaceComplex = {
        ...validBaseSpace,
        spaceId: complexKey
      };
      expect(isValidSpace(createSpaceEnvelope(validSpaceComplex))).toBe(true);
    });
  });

  describe('Builder Utilities', () => {
    test('createSpaceEnvelope adds required fields', () => {
      const envelope = createSpaceEnvelope(validBaseSpace);
      
      expect(envelope.schema).toBe('tm.space@1');
      expect(envelope.createdAt).toBeDefined();
      expect(envelope.updatedAt).toBeDefined();
      expect(envelope.configHash).toBeDefined();
      
      // Verify ISO 8601 timestamp format
      expect(new Date(envelope.createdAt).toISOString()).toBe(envelope.createdAt);
      expect(new Date(envelope.updatedAt).toISOString()).toBe(envelope.updatedAt);
    });

    test('Config hash is deterministic for same config', () => {
      const envelope1 = createSpaceEnvelope(validBaseSpace);
      const envelope2 = createSpaceEnvelope(validBaseSpace);
      
      // Same configuration should produce same hash (deterministic)
      expect(envelope1.configHash).toBe(envelope2.configHash);
      expect(envelope1.configHash).toHaveLength(64);
      expect(envelope2.configHash).toHaveLength(64);
    });

    test('Different configs produce different hashes', () => {
      const envelope1 = createSpaceEnvelope(validBaseSpace);
      const envelope2 = createSpaceEnvelope({
        ...validBaseSpace,
        metadata: {
          ...validBaseSpace.metadata,
          name: 'Different Name'
        }
      });
      
      expect(envelope1.configHash).not.toBe(envelope2.configHash);
    });
  });

  describe('Edge Cases and Error Boundaries', () => {
    test('Hierarchical spaces with parent relationships', () => {
      const parentSpace = createSpaceEnvelope({
        ...validBaseSpace,
        spaceId: 'tm.v2.parent.org'
      });
      
      const childSpace = createSpaceEnvelope({
        ...validBaseSpace,
        spaceId: 'tm.v2.parent.org.sub-dept',
        parentSpaceId: 'tm.v2.parent.org'
      });
      
      expect(isValidSpace(parentSpace)).toBe(true);
      expect(isValidSpace(childSpace)).toBe(true);
      expect(childSpace.parentSpaceId).toBe('tm.v2.parent.org');
    });

    test('Treasury thresholds logical validation', () => {
      const spaceWithThresholds = createSpaceEnvelope({
        ...validBaseSpace,
        treasuryConfig: {
          ...validBaseSpace.treasuryConfig,
          dailyMintLimit: 1000,
          maxSingleTransfer: 500, // Should be <= dailyMintLimit
          settlementThreshold: 100
        }
      });
      
      expect(isValidSpace(spaceWithThresholds)).toBe(true);
      expect(spaceWithThresholds.treasuryConfig.maxSingleTransfer).toBeLessThanOrEqual(
        spaceWithThresholds.treasuryConfig.dailyMintLimit!
      );
    });

    test('Multiple admin accounts validation', () => {
      const multiAdminSpace = createSpaceEnvelope({
        ...validBaseSpace,
        adminAccountIds: ['0.0.12345', '0.0.67890', '0.0.99999'],
        ownerAccountId: '0.0.12345' // Must be in admin list
      });
      
      expect(isValidSpace(multiAdminSpace)).toBe(true);
      expect(multiAdminSpace.adminAccountIds).toHaveLength(3);
      expect(multiAdminSpace.adminAccountIds).toContain(multiAdminSpace.ownerAccountId);
    });
  });
});