/**
 * TrustMesh v2 End-to-End Test Suite - Phased Rollout Edition
 * 
 * Deployment Phase:
 * Phase 1: GenZ lens (first cut-over)
 * Phase 2: Professional lens 
 * Phase 3: Cannabis Pilot (full production)
 * 
 * Tests the complete flow:
 * Cash Deposit → TRST Mint → Recognition → Reward → Audit Trail
 * 
 * Uses real MatterFi sandbox + Hedera testnet + compliance storage
 */

import { test, expect, beforeAll, afterAll } from '@jest/globals';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Minor units helper
const toMinor = (tokens: number | string, decimals = 18) => {
  const [i = '0', f = ''] = String(tokens).split('.');
  const frac = (f + '0'.repeat(decimals)).slice(0, decimals);
  return BigInt(i + frac).toString();
};

// v2 Engine imports
import { submitRecognition } from '../../lib/v2/engine/universalRecognition';
import { processRecognitionContext } from '../../lib/v2/engine/contextHook';
import { processWebhookEvent } from '../../lib/v2/engine/compliance';
import { createMatterFiAdapter } from '../../lib/v2/adapters/MatterFiSettlementAdapter';
import { getSpaceById, createSpace } from '../../lib/v2/engine/spaceRegistry';
import { evaluatePolicy } from '../../lib/v2/engine/policyEngine';

// Types
import { Recognition } from '../../lib/v2/schema/tm.recognition@1';
import { Space } from '../../lib/v2/schema/tm.space@1';

// Test configuration
const E2E_CONFIG = {
  testTimeout: 60000, // 60s for network calls
  artifactsDir: './tests/e2e/artifacts',
  matterfiSandbox: {
    enabled: process.env.MATTERFI_SANDBOX_ENABLED === 'true',
    orgId: process.env.MATTERFI_SANDBOX_ORG_ID || 'test-org-123',
    apiKey: process.env.MATTERFI_SANDBOX_API_KEY || 'test-key-sandbox',
    webhookSecret: process.env.MATTERFI_WEBHOOK_SECRET || 'test-webhook-secret-456'
  },
  hederaTestnet: {
    enabled: process.env.HEDERA_TESTNET_ENABLED === 'true',
    accountId: process.env.HEDERA_ACCOUNT_ID || '0.0.123456',
    privateKey: process.env.HEDERA_PRIVATE_KEY || 'test-private-key'
  }
};

// Test space for E2E
let testSpace: Space;
let settlementAdapter: any;
let testArtifacts: any = {};

describe('TrustMesh v2 E2E Flow', () => {
  
  beforeAll(async () => {
    // Ensure artifacts directory exists
    if (!existsSync(E2E_CONFIG.artifactsDir)) {
      mkdirSync(E2E_CONFIG.artifactsDir, { recursive: true });
    }

    // Initialize settlement adapter (real or mock based on config)
    settlementAdapter = createMatterFiAdapter();
    
    // Create test space
    testSpace = await setupTestSpace();
    
    console.log('🚀 E2E Test Setup Complete');
    console.log(`Test Space: ${testSpace.id}`);
    console.log(`MatterFi Sandbox: ${E2E_CONFIG.matterfiSandbox.enabled ? 'ENABLED' : 'MOCKED'}`);
    console.log(`Hedera Testnet: ${E2E_CONFIG.hederaTestnet.enabled ? 'ENABLED' : 'MOCKED'}`);
  }, E2E_CONFIG.testTimeout);

  afterAll(async () => {
    // Save test artifacts
    const artifactFile = join(E2E_CONFIG.artifactsDir, `e2e-run-${Date.now()}.json`);
    writeFileSync(artifactFile, JSON.stringify(testArtifacts, null, 2));
    console.log(`💾 Test artifacts saved: ${artifactFile}`);
  });

  test('01: Cash Deposit → TRST Mint (Settlement)', async () => {
    console.log('\n💰 Testing Cash Deposit → TRST Mint...');
    
    const depositAmount = toMinor(1000); // 1000 TRST in minor units
    
    // Simulate cash deposit → mint request
    const mintResult = await settlementAdapter.mintToSpace(
      testSpace.id,
      {
        symbol: 'TRST',
        network: 'hedera',
        id: testSpace.treasuryConfig.trstTokenId,
        decimals: 18
      },
      depositAmount,
      {
        idempotencyKey: `e2e-mint-${testSpace.id}`, // stable per space
        purpose: 'cash_deposit',
        tags: {
          depositMethod: 'cash_recycler',
          location: 'dispensary_alpha'
        }
      }
    );

    expect(mintResult).toBeDefined();
    expect(mintResult.txId).toBeDefined();
    expect(mintResult.status).toBe('confirmed'); // Fix: use status not success

    testArtifacts.cashDeposit = {
      amount: depositAmount,
      txId: mintResult.txId,
      timestamp: new Date().toISOString(),
      metadata: mintResult.metadata || {}
    };

    console.log(`✅ TRST Minted: ${depositAmount} → ${mintResult.txId}`);
  }, E2E_CONFIG.testTimeout);

  test('02: Recognition Submission (Phased Rollout)', async () => {
    console.log('\n🎯 Testing Recognition Submission - GenZ → Professional → Cannabis Pipeline...');
    
    // Phase 1: GenZ Lens (First Cut-over)
    const genZTests = [
      {
        lens: 'genz' as const,
        senderId: 'alice@genz.community',
        recipientId: 'bob@genz.community',
        amount: toMinor(25),
        message: 'Amazing collaboration on the hackathon! 🚀',
        phase: 'PHASE_1_GENZ',
        expectedReward: true
      },
      {
        lens: 'genz' as const,
        senderId: 'charlie@genz.community',
        recipientId: 'diana@genz.community', 
        amount: toMinor(15),
        message: 'Super creative approach to the problem',
        phase: 'PHASE_1_GENZ',
        expectedReward: true
      }
    ];

    // Phase 2: Professional Lens (Second Cut-over)
    const professionalTests = [
      {
        lens: 'professional' as const,
        senderId: 'manager@corp.example.com',
        recipientId: 'alice@corp.example.com',
        amount: toMinor(100),
        message: 'Outstanding Q4 performance metrics and team leadership',
        phase: 'PHASE_2_PROFESSIONAL',
        expectedReward: true
      },
      {
        lens: 'professional' as const,
        senderId: 'director@corp.example.com',
        recipientId: 'manager@corp.example.com',
        amount: toMinor(250),
        message: 'Exceptional project delivery and risk management',
        phase: 'PHASE_2_PROFESSIONAL', 
        expectedReward: true
      }
    ];

    // Phase 3: Cannabis Pilot (Future - included for pipeline testing)
    const cannabisTests = [
      {
        lens: 'cannabis' as const,
        senderId: 'budtender@dispensary.ca',
        recipientId: 'manager@dispensary.ca',
        amount: toMinor(75),
        message: 'Excellent customer service and compliance adherence',
        phase: 'PHASE_3_CANNABIS_PILOT',
        expectedReward: true
      }
    ];

    // Combined test suite - ordered by deployment phase
    const recognitionTests = [
      ...genZTests,
      ...professionalTests,
      ...cannabisTests // Included for pipeline, but may be disabled initially
    ];

    const recognitionResults = [];

    for (const testCase of recognitionTests) {
      const recognition = await submitRecognition({
        spaceId: testSpace.id,
        senderId: testCase.senderId,
        recipientId: testCase.recipientId,
        lens: testCase.lens,
        amount: testCase.amount,
        message: testCase.message,
        metadata: {
          testCase: true,
          lens: testCase.lens
        }
      });

      expect(recognition).toBeDefined();
      expect(recognition.id).toBeDefined();
      expect(recognition.lens).toBe(testCase.lens);
      expect(recognition.amount).toBe(testCase.amount);

      recognitionResults.push({
        lens: testCase.lens,
        phase: testCase.phase,
        recognition,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ [${testCase.phase}] ${testCase.lens} recognition: ${recognition.id}`);
    }

    // Organize results by deployment phase for phased rollout analysis
    testArtifacts.recognitions = recognitionResults;
    testArtifacts.recognitionsByPhase = {
      phase1GenZ: recognitionResults.filter(r => r.phase === 'PHASE_1_GENZ'),
      phase2Professional: recognitionResults.filter(r => r.phase === 'PHASE_2_PROFESSIONAL'),
      phase3Cannabis: recognitionResults.filter(r => r.phase === 'PHASE_3_CANNABIS_PILOT')
    };

    console.log(`📊 Phase Results: GenZ(${testArtifacts.recognitionsByPhase.phase1GenZ.length}), Professional(${testArtifacts.recognitionsByPhase.phase2Professional.length}), Cannabis(${testArtifacts.recognitionsByPhase.phase3Cannabis.length})`);
    
    
  }, E2E_CONFIG.testTimeout);

  test('03: Context Engine → Reward Trigger', async () => {
    console.log('\n🎁 Testing Context Engine reward triggering...');

    const rewardResults = [];

    for (const recResult of testArtifacts.recognitions) {
      const contextResult = await processRecognitionContext(recResult.recognition);

      expect(contextResult).toBeDefined();
      expect(contextResult.processed).toBe(true);
      
      // Should trigger rewards based on phased rollout lens priority
      if (contextResult.rewardTriggered) {
        expect(contextResult.settlementTxId).toBeDefined();
        // Phase 1: GenZ rules, Phase 2: Professional rules, Phase 3: Cannabis rules
        expect(['genz-peer-reward','genz-collaboration','professional-performance','professional-leadership','cannabis-compliance','cannabis-customer-service'])
          .toContain(contextResult.ruleMatched);
      }

      rewardResults.push({
        recognitionId: recResult.recognition.id,
        lens: recResult.lens,
        rewardTriggered: contextResult.rewardTriggered,
        settlementTxId: contextResult.settlementTxId,
        ruleMatched: contextResult.ruleMatched,
        processingTimeMs: contextResult.metadata.processingTimeMs
      });

      console.log(`✅ ${recResult.lens} reward: ${contextResult.rewardTriggered ? contextResult.settlementTxId : 'not triggered'}`);
    }

    testArtifacts.rewards = rewardResults;

    // Verify at least some rewards were triggered
    const triggeredCount = rewardResults.filter(r => r.rewardTriggered).length;
    expect(triggeredCount).toBeGreaterThan(0);
    
  }, E2E_CONFIG.testTimeout);

  test('04: Policy Engine Enforcement', async () => {
    console.log('\n🛡️ Testing Policy Engine enforcement...');

    const policyTests = [
      {
        action: 'settlement.mint',
        actorId: 'alice@example.com',
        targetId: 'bob@example.com',
        amount: toMinor(50),
        expectedAllowed: true,
        description: 'Normal mint within limits'
      },
      {
        action: 'settlement.mint', 
        actorId: 'restricted@example.com',
        targetId: 'bob@example.com',
        amount: toMinor(1_000_000), // Very large amount
        expectedAllowed: false,
        description: 'Excessive amount should be denied'
      },
      {
        action: 'settlement.transfer',
        actorId: 'alice@example.com',
        targetId: 'sanctioned@example.com',
        amount: toMinor(10),
        expectedAllowed: false,
        description: 'Transfer to sanctioned entity'
      }
    ];

    const policyResults = [];

    for (const testCase of policyTests) {
      const policyResult = await evaluatePolicy({
        action: testCase.action,
        actorId: testCase.actorId,
        targetId: testCase.targetId,
        spaceId: testSpace.id,
        amount: testCase.amount,
        metadata: { testCase: true }
      });

      expect(policyResult).toBeDefined();
      expect(policyResult.allowed).toBe(testCase.expectedAllowed);
      
      if (!testCase.expectedAllowed) {
        expect(policyResult.reason).toBeDefined();
      }

      policyResults.push({
        ...testCase,
        result: policyResult,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Policy ${testCase.description}: ${policyResult.allowed ? 'ALLOWED' : 'DENIED'}`);
    }

    testArtifacts.policyTests = policyResults;
    
  }, E2E_CONFIG.testTimeout);

  test('05: MatterFi Webhook Processing', async () => {
    console.log('\n📡 Testing MatterFi webhook processing...');

    // Simulate MatterFi webhook events (compliant schema)
    const nowSec = Math.floor(Date.now()/1000);
    const mockWebhookEvents = [
      {
        id: `wh_${Date.now()}_1`,
        type: 'settlement.transfer.completed',
        object: 'settlement',
        api_version: '2024-01',
        created: nowSec,
        data: { object: {
          facilityId: 'facility_alpha',
          spaceId: testSpace.id,
          accountId: 'acct_abc',
          amount: toMinor(1000),
          currency: 'TRST',
          transactionId: 'tx_' + Math.random().toString(36).slice(2),
          tokenId: testSpace.treasuryConfig.trstTokenId,
          status: 'confirmed',
          txHash: '0x' + Math.random().toString(16).slice(2),
          proofHash: '0x' + Math.random().toString(16).slice(2),
          hcsSequenceNumber: 42
        }},
        livemode: false,
        pending_webhooks: 0,
        request: { idempotency_key: 'idem_' + Math.random().toString(36).slice(2) }
      },
      {
        id: `wh_${Date.now()}_2`,
        type: 'settlement.mint.completed',
        object: 'settlement',
        api_version: '2024-01',
        created: nowSec,
        data: { object: {
          facilityId: 'facility_alpha',
          spaceId: testSpace.id,
          accountId: 'acct_xyz',
          amount: toMinor(500),
          currency: 'TRST',
          transactionId: 'mint_' + Math.random().toString(36).slice(2),
          tokenId: testSpace.treasuryConfig.trstTokenId,
          status: 'confirmed'
        }},
        livemode: false,
        pending_webhooks: 0
      }
    ];

    const webhookResults = [];

    for (const mockEvent of mockWebhookEvents) {
      const payload = JSON.stringify(mockEvent);
      const signature = generateMockSignature(payload);

      const processedEvent = await processWebhookEvent(
        payload,
        signature,
        {
          'x-matterfi-signature': signature,
          'content-type': 'application/json',
          'user-agent': 'MatterFi-Webhook/1.0'
        }
      );

      expect(processedEvent).toBeDefined();
      // processedEvent.eventType is normalized ('SETTLEMENT'/'ACCOUNT'/'AUDIT')
      expect(processedEvent.eventType).toBe('SETTLEMENT');
      expect(processedEvent.metadata?.matterfiEventId).toBe(mockEvent.id);
      expect(processedEvent.currency).toBe('TRST');
      expect(processedEvent.compliance.riskScore).toBeGreaterThanOrEqual(0);

      webhookResults.push({
        originalEvent: mockEvent,
        processedEvent,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Webhook processed: ${mockEvent.type} → ${processedEvent.eventType}`);
    }

    testArtifacts.webhooks = webhookResults;
    
  }, E2E_CONFIG.testTimeout);

  test('06: Audit Trail Verification', async () => {
    console.log('\n📋 Testing audit trail completeness...');

    // Verify all major events are captured in artifacts
    expect(testArtifacts.cashDeposit).toBeDefined();
    expect(testArtifacts.recognitions).toBeDefined();
    expect(testArtifacts.rewards).toBeDefined();
    expect(testArtifacts.policyTests).toBeDefined();
    expect(testArtifacts.webhooks).toBeDefined();

    // Verify event chain integrity
    expect(testArtifacts.recognitions.length).toBeGreaterThan(0);
    expect(testArtifacts.rewards.length).toEqual(testArtifacts.recognitions.length);

    // Create audit summary
    const auditSummary = {
      testRunId: `e2e-${Date.now()}`,
      timestamp: new Date().toISOString(),
      flowSteps: [
        'cash_deposit',
        'recognition_submission', 
        'reward_triggering',
        'policy_enforcement',
        'webhook_processing',
        'audit_trail_verification'
      ],
      counters: {
        recognitionsSubmitted: testArtifacts.recognitions.length,
        rewardsTriggered: testArtifacts.rewards.filter((r: any) => r.rewardTriggered).length,
        policyChecks: testArtifacts.policyTests.length,
        webhooksProcessed: testArtifacts.webhooks.length,
        totalTxIds: [
          testArtifacts.cashDeposit.txId,
          ...testArtifacts.rewards.filter((r: any) => r.settlementTxId).map((r: any) => r.settlementTxId)
        ].filter(Boolean).length
      },
      integrityChecks: {
        allRecognitionsHaveIds: testArtifacts.recognitions.every((r: any) => r.recognition.id),
        allRewardsLinked: testArtifacts.rewards.every((r: any) => r.recognitionId),
        policyEnforcementWorking: testArtifacts.policyTests.some((p: any) => !p.result.allowed),
        webhookProcessingWorking: testArtifacts.webhooks.every((w: any) => w.processedEvent.eventType)
      }
    };

    testArtifacts.auditSummary = auditSummary;

    // Verify integrity checks pass
    Object.values(auditSummary.integrityChecks).forEach(check => {
      expect(check).toBe(true);
    });

    console.log('✅ Audit trail complete and verified');
    console.log(`📊 Summary: ${auditSummary.counters.recognitionsSubmitted} recognitions → ${auditSummary.counters.rewardsTriggered} rewards → ${auditSummary.counters.totalTxIds} transactions`);
    
  }, E2E_CONFIG.testTimeout);

});

/**
 * Helper Functions
 */

async function setupTestSpace(): Promise<Space> {
  const testSpaceData = {
    name: 'E2E Test Space',
    description: 'Automated test space for v2 E2E flow',
    spaceType: 'test' as const,
    visibility: 'private' as const,
      governance: {
        // Phased rollout user management
        adminIds: [
          'test@example.com', 
          // Phase 1 GenZ admins
          'alice@genz.community', 'charlie@genz.community',
          // Phase 2 Professional admins  
          'manager@corp.example.com', 'director@corp.example.com',
          // Phase 3 Cannabis admins (for pipeline testing)
          'compliance@dispensary.ca'
        ],
        memberIds: [
          // GenZ community members (Phase 1)
          'alice@genz.community', 'bob@genz.community', 'charlie@genz.community', 'diana@genz.community',
          // Professional org members (Phase 2)
          'manager@corp.example.com', 'director@corp.example.com', 'alice@corp.example.com',
          // Cannabis facility members (Phase 3)
          'budtender@dispensary.ca', 'manager@dispensary.ca'
        ],
        policies: {
          // Lenses enabled per deployment phase
          allowedLenses: ['genz', 'professional', 'cannabis'] as const, // Phased rollout order
          requireApproval: false, // Start permissionless for testing
          moderationEnabled: true, // Enable for cannabis compliance
          phaseRollout: {
            phase1: { lenses: ['genz'], enabled: true },
            phase2: { lenses: ['professional'], enabled: true },
            phase3: { lenses: ['cannabis'], enabled: false } // Disabled until pilot ready
          }
        }
      },
    treasuryConfig: {
      network: 'hedera' as const,
      trstTokenId: '0.0.TRST',
      tokenSymbol: 'TRST',
      tokenDecimals: 18,
      limits: {
        maxMintPerDay: toMinor(10000), // 10k TRST
        maxTransferPerTx: toMinor(1000), // 1k TRST
        emergencyPauseEnabled: true
      }
    },
    metadata: {
      testSpace: true,
      createdBy: 'e2e-test-suite',
      deploymentPhase: 'phased-rollout-pipeline',
      rolloutPlan: {
        phase1: {
          name: 'GenZ Community Launch',
          lenses: ['genz'],
          targetDate: '2025-01-15',
          status: 'ready'
        },
        phase2: {
          name: 'Professional Expansion', 
          lenses: ['professional'],
          targetDate: '2025-02-01',
          status: 'ready'
        },
        phase3: {
          name: 'Cannabis Pilot',
          lenses: ['cannabis'],
          targetDate: '2025-03-01', 
          status: 'pipeline'
        }
      }
    }
  };

  const space = await createSpace(testSpaceData);
  
  // TODO: Grant test scopes to alice@example.com and manager@example.com for policy tests
  // This would be implemented once we have the test utility
  
  return space;
}

function generateMockSignature(payload: string): string {
  // Mock signature generation for testing
  // In real implementation, this would use the actual webhook secret
  const crypto = require('crypto');
  return `sha256=${crypto.createHmac('sha256', E2E_CONFIG.matterfiSandbox.webhookSecret).update(payload).digest('hex')}`;
}

// Jest configuration for E2E
export const jestConfig = {
  testTimeout: E2E_CONFIG.testTimeout,
  setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup.ts'],
  testMatch: ['<rootDir>/tests/e2e/**/*.spec.ts'],
  collectCoverage: false, // E2E tests don't need coverage
  verbose: true
};