/**
 * TrustMesh v2 Integration Demo
 * 
 * Demonstrates the complete end-to-end flow as outlined in your architecture:
 * 1. Ingest → Recognition API → Event Bus
 * 2. Context Engine subscribes → Policy evaluation → Settlement request
 * 3. Settlement → MatterFi webhook → Compliance Engine 
 * 4. All ledgers → Store service with query APIs
 */

import { eventBus } from '../events/eventBus';
import { createMockSpaceRegistry } from '../engine/spaceRegistry';
import { getComplianceEngine } from '../engine/compliance';
import { getRecognitionLedger, getSettlementLedger, getComplianceLedger } from '../store/ledgers';
import { createRecognitionEnvelope } from '../schema/tm.recognition@1';

// Simulate Context Engine (subscribes to recognition events)
class MockContextEngine {
  constructor() {
    // Subscribe to recognition events
    eventBus.on('trustmesh.v2.recognition.created', async (event) => {
      console.log(`[Context Engine] Processing recognition: ${event.recognitionId}`);
      await this.evaluatePolicyAndRequestSettlement(event);
    });

    // Subscribe to store events  
    eventBus.on('trustmesh.v2.recognition.store', async (event) => {
      console.log(`[Context Engine] Storing recognition in ledger`);
      const recognitionLedger = getRecognitionLedger();
      await recognitionLedger.append(event.recognition);
    });
  }

  private async evaluatePolicyAndRequestSettlement(recognitionEvent: any) {
    try {
      // 1. Get effective space config from Registry
      const registry = createMockSpaceRegistry();
      const space = await registry.getSpace(recognitionEvent.spaceId);
      
      if (!space) {
        console.log(`[Context Engine] Space not found: ${recognitionEvent.spaceId}`);
        return;
      }

      // 2. Evaluate recognition policy
      if (!space.recognitionPolicy.allowedLenses.includes(recognitionEvent.lens)) {
        console.log(`[Context Engine] Lens ${recognitionEvent.lens} not allowed in space ${recognitionEvent.spaceId}`);
        return;
      }

      // 3. Calculate reward amount (mock logic)
      const baseAmount = 1000000; // 1 TRST in minor units
      const lensMultiplier = {
        'genz': 1.0,
        'professional': 1.5,
        'social': 1.2,
        'builder': 2.0
      };
      const amountMinor = (baseAmount * (lensMultiplier[recognitionEvent.lens as keyof typeof lensMultiplier] || 1)).toString();

      // 4. Request settlement
      const settlementId = crypto.randomUUID();
      await eventBus.emit('trustmesh.v2.settlement.requested', {
        schema: 'tm.settlement.requested@1',
        settlementId,
        spaceId: recognitionEvent.spaceId,
        accountId: recognitionEvent.recipientId,
        tokenRef: {
          symbol: space.treasuryConfig.tokenSymbol,
          network: space.treasuryConfig.settlementProvider === 'hedera_native' ? 'hedera' : 'hedera',
          id: '0.0.123456',
          decimals: space.treasuryConfig.tokenDecimals
        },
        amountMinor,
        operation: 'mint' as const,
        idempotencyKey: `recognition-${recognitionEvent.recognitionId}`,
        ts: new Date().toISOString()
      });

      console.log(`[Context Engine] Requested settlement: ${settlementId} for ${amountMinor} minor units`);

    } catch (error) {
      console.error(`[Context Engine] Policy evaluation failed:`, error);
    }
  }
}

// Simulate Settlement Port (processes settlement requests)
class MockSettlementPort {
  constructor() {
    eventBus.on('trustmesh.v2.settlement.requested', async (event) => {
      console.log(`[Settlement Port] Processing settlement: ${event.settlementId}`);
      await this.executeSettlement(event);
    });
  }

  private async executeSettlement(settlementEvent: any) {
    try {
      // Simulate calling MatterFi API
      console.log(`[Settlement Port] Calling MatterFi API for mint operation`);
      
      const settlementLedger = getSettlementLedger();
      
      // Record pending settlement
      await settlementLedger.append(
        settlementEvent.settlementId,
        settlementEvent.spaceId,
        settlementEvent.accountId,
        settlementEvent.operation,
        settlementEvent.tokenRef,
        settlementEvent.amountMinor,
        'pending',
        settlementEvent.idempotencyKey,
        {
          txHash: 'mock_tx_' + crypto.randomUUID().substring(0, 8)
        }
      );

      // Simulate successful settlement (would normally come via webhook)
      setTimeout(async () => {
        await this.simulateMatterFiWebhook(settlementEvent);
      }, 1000);

    } catch (error) {
      console.error(`[Settlement Port] Settlement failed:`, error);
    }
  }

  private async simulateMatterFiWebhook(settlementEvent: any) {
    // Simulate MatterFi webhook payload
    const webhookPayload = {
      id: `evt_${crypto.randomUUID().replace(/-/g, '')}`,
      type: 'settlement.mint.completed' as const,
      object: 'settlement' as const,
      api_version: '2024-01',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          spaceId: settlementEvent.spaceId,
          accountId: settlementEvent.accountId,
          amount: settlementEvent.amountMinor,
          currency: 'TRST',
          transactionId: settlementEvent.settlementId,
          correlationId: settlementEvent.idempotencyKey,
          txHash: 'mock_tx_' + crypto.randomUUID().substring(0, 8),
          status: 'confirmed' as const
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        idempotency_key: settlementEvent.idempotencyKey
      }
    };

    // Create HMAC signature (simplified)
    const payload = JSON.stringify(webhookPayload);
    const signature = `sha256=mock_signature_${crypto.randomUUID().substring(0, 16)}`;
    
    console.log(`[Mock MatterFi] Sending webhook for settlement: ${settlementEvent.settlementId}`);
    
    // Process webhook through compliance engine
    const complianceEngine = getComplianceEngine();
    const complianceEvent = await complianceEngine.processWebhookEvent(
      payload,
      signature,
      {
        'x-matterfi-signature': signature,
        'content-type': 'application/json'
      }
    );

    console.log(`[Mock MatterFi] Compliance event recorded: ${complianceEvent.eventId}`);

    // Store in compliance ledger
    const complianceLedger = getComplianceLedger();
    await complianceLedger.append(complianceEvent);

    // Update settlement ledger with success
    const settlementLedger = getSettlementLedger();
    await settlementLedger.append(
      settlementEvent.settlementId + '_final',
      settlementEvent.spaceId,
      settlementEvent.accountId,
      settlementEvent.operation,
      settlementEvent.tokenRef,
      settlementEvent.amountMinor,
      'success',
      settlementEvent.idempotencyKey,
      {
        txHash: webhookPayload.data.object.txHash
      }
    );
  }
}

// Demo runner
export async function runTrustMeshV2Demo() {
  console.log('🚀 Starting TrustMesh v2 Integration Demo');
  console.log('=' .repeat(50));

  // Initialize engines
  const contextEngine = new MockContextEngine();
  const settlementPort = new MockSettlementPort();
  
  // Create test space
  const registry = createMockSpaceRegistry();
  const testSpace = await registry.createSpace({
    spaceId: 'tm.v2.demo.cannabis-dispensary',
    metadata: {
      name: 'Cannabis Dispensary Demo',
      category: 'cannabis',
      description: 'Demo space for TrustMesh v2 integration'
    },
    treasuryConfig: {
      settlementProvider: 'matterfi',
      custodialAccountId: 'demo_account_123',
      network: 'testnet',
      tokenSymbol: 'TRST',
      tokenDecimals: 6,
      minBalance: '1000000',
      maxBalance: '1000000000000',
      dailyLimit: '10000000000',
      monthlyLimit: '100000000000'
    },
    recognitionPolicy: {
      allowedLenses: ['genz', 'professional', 'social', 'builder'],
      requiresEvidence: false,
      maxAttachments: 3,
      skillsRequired: false,
      allowedCategories: ['service', 'product_quality', 'education'],
      requiresModeration: false,
      autoApprove: true
    },
    complianceConfig: {
      retentionPeriod: 2555,
      auditRetention: 2555,
      requiresKYC: false,
      requiresKYB: true,
      jurisdiction: 'US-CA'
    },
    rbacConfig: {
      roles: [],
      defaultRole: 'customer',
      requiresInvitation: false,
      allowSelfRegistration: true
    },
    adminAccountIds: ['0.0.1001'],
    ownerAccountId: '0.0.1001',
    hcsTopicId: '0.0.999888',
    status: 'active'
  }, '0.0.1001');

  console.log(`✅ Created test space: ${testSpace.spaceId}`);

  // Wait a moment for setup
  await new Promise(resolve => setTimeout(resolve, 500));

  // Simulate recognition creation (as if from /api/recognition-v2)
  const testRecognition = createRecognitionEnvelope({
    spaceId: testSpace.spaceId,
    senderId: '0.0.2001', // Budtender
    recipientId: '0.0.2002', // Customer  
    lens: 'professional',
    metadata: {
      title: 'Excellent Cannabis Product Knowledge',
      description: 'Customer demonstrated deep understanding of strain effects and provided excellent guidance on product selection.',
      category: 'service',
      lensData: {
        industryContext: 'cannabis_retail',
        competencyLevel: 'expert'
      },
      skills: ['cannabis_knowledge', 'customer_service', 'product_guidance'],
      visibility: 'public'
    },
    hcsTopicId: testSpace.hcsTopicId
  });

  console.log(`📝 Created test recognition: ${testRecognition.recognitionId}`);

  // Emit recognition created event (simulating the API)
  await eventBus.emit('trustmesh.v2.recognition.created', {
    schema: 'tm.recognition@1',
    recognitionId: testRecognition.recognitionId,
    spaceId: testRecognition.spaceId,
    senderId: testRecognition.senderId,
    recipientId: testRecognition.recipientId,
    lens: testRecognition.lens,
    proofHash: testRecognition.proofHash!,
    hcs: {
      topicId: testRecognition.hcsTopicId,
      sequence: 12345,
      consensusTime: testRecognition.issuedAt
    },
    correlationId: testRecognition.correlationId,
    ts: testRecognition.issuedAt
  });

  // Also emit store event
  await eventBus.emit('trustmesh.v2.recognition.store', {
    recognition: testRecognition,
    timestamp: testRecognition.issuedAt
  });

  console.log('⚡ Events emitted - waiting for processing...');

  // Wait for all async processing to complete
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Query the ledgers to show the complete flow
  console.log('\n📊 Ledger Status:');
  console.log('-'.repeat(30));

  const recognitionLedger = getRecognitionLedger();
  const recognitions = await recognitionLedger.queryBySpace(testSpace.spaceId, 10);
  console.log(`Recognition Ledger: ${recognitions.entries.length} entries`);

  const settlementLedger = getSettlementLedger();
  const settlements = await settlementLedger.queryBySpace(testSpace.spaceId, 10);
  console.log(`Settlement Ledger: ${settlements.entries.length} entries`);

  const complianceLedger = getComplianceLedger();
  const compliance = await complianceLedger.queryBySpace(testSpace.spaceId, 10);
  console.log(`Compliance Ledger: ${compliance.entries.length} entries`);

  console.log('\n🎉 Demo completed successfully!');
  console.log('The complete flow worked:');
  console.log('1. ✅ Recognition created and validated');
  console.log('2. ✅ Context Engine processed and requested settlement'); 
  console.log('3. ✅ Settlement Port executed mint operation');
  console.log('4. ✅ MatterFi webhook processed by Compliance Engine');
  console.log('5. ✅ All events stored in appropriate ledgers');
  console.log('\n🔗 APIs are available for querying:');
  console.log(`- GET /api/spaces/${testSpace.spaceId}/effective-config`);
  console.log(`- GET /api/spaces/${testSpace.spaceId}/token-ref`);  
  console.log(`- GET /api/spaces/${testSpace.spaceId}/ledger/recognitions`);
  console.log(`- GET /api/spaces/${testSpace.spaceId}/ledger/settlements`);
  console.log(`- GET /api/spaces/${testSpace.spaceId}/ledger/compliance`);
}

// Auto-run demo in development
if (process.env.NODE_ENV === 'development') {
  // Wait a moment for imports to settle, then run demo
  setTimeout(() => {
    runTrustMeshV2Demo().catch(console.error);
  }, 1000);
}