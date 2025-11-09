/**
 * TrustMesh v2 Event Bus
 * Central event routing with typed event contracts
 */

import { z } from 'zod';

// Event schemas as you specified
export const RecognitionCreatedEventSchema = z.object({
  schema: z.literal('tm.recognition@1'),
  recognitionId: z.string(),
  spaceId: z.string(),
  senderId: z.string(),
  recipientId: z.string(),
  lens: z.enum(['genz', 'professional', 'social', 'builder']),
  amountMinor: z.string().optional(),
  proofHash: z.string(),
  hcs: z.object({
    topicId: z.string(),
    sequence: z.number(),
    consensusTime: z.string()
  }).optional(),
  correlationId: z.string(),
  ts: z.string().datetime()
});

export const ComplianceEventRecordedSchema = z.object({
  schema: z.literal('tm.compliance.event@1'),
  eventId: z.string(),
  spaceId: z.string(),
  eventType: z.enum(['SETTLEMENT', 'ACCOUNT', 'COMPLIANCE', 'AUDIT']),
  risk: z.object({
    score: z.number().min(0).max(1),
    classification: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  }),
  metadata: z.object({
    matterfiEventId: z.string().optional(),
    txHash: z.string().optional(),
    chainHash: z.string().optional()
  }),
  ts: z.string().datetime()
});

export const SettlementRequestedEventSchema = z.object({
  schema: z.literal('tm.settlement.requested@1'),
  settlementId: z.string(),
  spaceId: z.string(),
  accountId: z.string(),
  tokenRef: z.object({
    symbol: z.string(),
    network: z.enum(['hedera', 'ethereum', 'polygon']),
    id: z.string(),
    decimals: z.number()
  }),
  amountMinor: z.string(),
  operation: z.enum(['mint', 'transfer', 'burn']),
  idempotencyKey: z.string(),
  ts: z.string().datetime()
});

// Type exports
export type RecognitionCreatedEvent = z.infer<typeof RecognitionCreatedEventSchema>;
export type ComplianceEventRecorded = z.infer<typeof ComplianceEventRecordedSchema>;
export type SettlementRequestedEvent = z.infer<typeof SettlementRequestedEventSchema>;

// Event type registry
export type EventTypeRegistry = {
  'trustmesh.v2.recognition.created': RecognitionCreatedEvent;
  'trustmesh.v2.compliance.event.recorded': ComplianceEventRecorded;
  'trustmesh.v2.settlement.requested': SettlementRequestedEvent;
  'trustmesh.v2.webhook.matterfi.received': {
    eventId: string;
    rawPayload: Record<string, unknown>;
    signature: string;
    ts: string;
  };
  'trustmesh.v2.recognition.store': {
    recognition: any;
    timestamp: string;
  };
};

export type EventHandler<T = any> = (event: T) => Promise<void> | void;

/**
 * Simple event bus implementation
 * In production, replace with Kafka/NATS/SQS
 */
export class EventBus {
  private static instance: EventBus;
  private handlers: Map<string, EventHandler[]> = new Map();
  private deadLetterQueue: Array<{ topic: string; event: any; error: Error; timestamp: string }> = [];

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to events with typed handler
   */
  on<K extends keyof EventTypeRegistry>(
    topic: K,
    handler: EventHandler<EventTypeRegistry[K]>
  ): void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, []);
    }
    this.handlers.get(topic)!.push(handler);
  }

  /**
   * Emit event to all subscribers
   */
  async emit<K extends keyof EventTypeRegistry>(
    topic: K,
    event: EventTypeRegistry[K]
  ): Promise<void> {
    const handlers = this.handlers.get(topic) || [];
    
    console.log(`[EventBus] Emitting ${topic} to ${handlers.length} handlers`, {
      eventId: (event as any).recognitionId || (event as any).eventId || (event as any).settlementId,
      timestamp: (event as any).ts || new Date().toISOString()
    });

    // Execute handlers concurrently
    const promises = handlers.map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`[EventBus] Handler failed for ${topic}:`, error);
        this.deadLetterQueue.push({
          topic,
          event,
          error: error as Error,
          timestamp: new Date().toISOString()
        });
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Get dead letter queue entries for debugging
   */
  getDeadLetterQueue() {
    return this.deadLetterQueue.slice();
  }

  /**
   * Clear handlers (useful for testing)
   */
  clearHandlers(): void {
    this.handlers.clear();
    this.deadLetterQueue.length = 0;
  }
}

/**
 * Convenience functions for validating and emitting events
 */
export const validateAndEmit = {
  recognitionCreated: async (event: RecognitionCreatedEvent) => {
    const validated = RecognitionCreatedEventSchema.parse(event);
    await EventBus.getInstance().emit('trustmesh.v2.recognition.created', validated);
  },

  complianceEventRecorded: async (event: ComplianceEventRecorded) => {
    const validated = ComplianceEventRecordedSchema.parse(event);
    await EventBus.getInstance().emit('trustmesh.v2.compliance.event.recorded', validated);
  },

  settlementRequested: async (event: SettlementRequestedEvent) => {
    const validated = SettlementRequestedEventSchema.parse(event);
    await EventBus.getInstance().emit('trustmesh.v2.settlement.requested', validated);
  }
};

// Export singleton instance
export const eventBus = EventBus.getInstance();