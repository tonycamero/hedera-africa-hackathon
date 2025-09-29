import { MirrorMessage, backfillFromRest, subscribeWs } from './MirrorBackfill';
import { signalsStore, SignalEvent } from '@/lib/stores/signalsStore';
import { TOPIC } from '@/lib/env';

interface HCSMessage {
  type: string;
  from: string;
  nonce?: number;
  ts: number;
  payload: any;
}

/**
 * Normalize Mirror messages to SignalEvent format for the UI store
 */
function mirrorToSignalEvent(message: MirrorMessage): SignalEvent | null {
  try {
    const hcsData = JSON.parse(message.decoded);
    
    // Map to standardized fields regardless of the original format
    // Handle both legacy format (type, from, ts, payload) and new format (type, actor, target, timestamp, metadata)
    // Also handle recognition format where recipient is in payload.to
    const normalized = {
      type: hcsData.type,
      from: hcsData.from || hcsData.actor,
      to: hcsData.to || hcsData.target || hcsData.payload?.to, // Recognition messages use payload.to
      ts: hcsData.ts || (hcsData.timestamp ? new Date(hcsData.timestamp).getTime() : Date.now()),
      payload: hcsData.payload || hcsData.metadata || {}
    };
    
    // Validate required fields
    if (!normalized.type || !normalized.from) {
      console.log(`[MirrorToStore] Skipping incomplete message:`, hcsData);
      return null;
    }

    // Determine signal class and direction based on normalized data
    let signalClass: SignalEvent['class'] = 'system';
    let signalType: SignalEvent['type'] = normalized.type.toUpperCase();
    let topicType: SignalEvent['topicType'] = 'SIGNAL';
    
    // Handle various message types from Mirror Node
    if (normalized.type.includes('contact') || normalized.type.includes('CONTACT')) {
      signalClass = 'contact';
      topicType = 'CONTACT';
      // Normalize contact types
      if (normalized.type.includes('request')) {
        signalType = 'CONTACT_REQUEST';
      } else if (normalized.type.includes('accept')) {
        signalType = 'CONTACT_ACCEPT';
      }
    } else if (normalized.type.includes('trust') || normalized.type.includes('TRUST')) {
      signalClass = 'trust';
      topicType = 'TRUST';
      // Normalize trust types
      if (normalized.type.includes('allocate')) {
        signalType = 'TRUST_ALLOCATE';
      } else if (normalized.type.includes('revoke')) {
        signalType = 'TRUST_REVOKE';
      }
    } else if (normalized.type.includes('profile') || normalized.type.includes('PROFILE')) {
      signalClass = 'system';
      topicType = 'PROFILE';
    } else if (normalized.type.includes('recognition') || normalized.type.includes('RECOGNITION') || normalized.type.includes('nft') || normalized.type.includes('NFT')) {
      signalClass = 'recognition';
      topicType = 'SIGNAL';
      if (normalized.type.includes('mint') || normalized.type.includes('MINT')) {
        signalType = 'RECOGNITION_MINT';
      } else if (normalized.type.includes('definition') || normalized.type.includes('DEFINITION')) {
        signalType = 'RECOGNITION_DEFINITION';
      }
    }

    // Preserve direction from original message or default to inbound
    const direction: SignalEvent['direction'] = hcsData.direction || 'inbound';
    
    const signalEvent: SignalEvent = {
      id: hcsData.id || `mirror_${message.topicId}_${message.sequenceNumber}`,
      class: signalClass,
      topicType,
      direction,
      actors: {
        from: normalized.from,
        to: normalized.to
      },
      payload: normalized.payload,
      ts: normalized.ts,
      status: 'onchain', // Data from Mirror is already on-chain
      type: signalType,
      meta: {
        tag: 'mirror_backfill',
        topicId: message.topicId,
        sequenceNumber: message.sequenceNumber,
        originalType: hcsData.type // Preserve original format for debugging
      }
    };

    return signalEvent;
    
  } catch (error) {
    console.error(`[MirrorToStore] Parse error for message:`, error, message.decoded);
    return null;
  }
}

/**
 * Process and store backfilled messages
 */
export function upsertMessages(messages: MirrorMessage[]): void {
  console.log(`[MirrorToStore] Processing ${messages.length} messages...`);
  
  const signalEvents: SignalEvent[] = messages
    .map(mirrorToSignalEvent)
    .filter(Boolean) as SignalEvent[];
    
  console.log(`[MirrorToStore] Normalized ${signalEvents.length} signal events`);
  
  // Add to store (the store handles deduplication by ID)
  signalEvents.forEach(event => {
    signalsStore.add(event);
  });
  
  console.log(`[MirrorToStore] Added ${signalEvents.length} events to SignalsStore`);
  
  // Verification log to check store state
  const allStoreEvents = signalsStore.getAllSignals();
  console.log(`[MirrorToStore] Store now contains ${allStoreEvents.length} total events`);
  
  if (signalEvents.length > 0) {
    console.log(`[MirrorToStore] Sample added event:`, {
      id: signalEvents[0].id,
      type: signalEvents[0].type,
      class: signalEvents[0].class,
      actors: signalEvents[0].actors
    });
  }
}

/**
 * Initialize comprehensive Mirror backfill + WebSocket with store integration
 */
export async function initializeMirrorWithStore(): Promise<() => void> {
  try {
    console.log('[MirrorToStore] Starting Mirror initialization with store integration...');
    
    // Get all topics to monitor
    const topics = [TOPIC.contacts, TOPIC.trust, TOPIC.profile, TOPIC.recognition].filter(Boolean);
    console.log('[MirrorToStore] Monitoring topics:', topics);
    
    if (topics.length === 0) {
      throw new Error('No topics configured for monitoring');
    }
    
    // 1) REST Backfill first - get historical data
    console.log('[MirrorToStore] Step 1: REST backfill...');
    const backfillResults = await Promise.allSettled(
      topics.map(topic => backfillFromRest(topic, 50))
    );
    
    const allMessages: MirrorMessage[] = [];
    backfillResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allMessages.push(...result.value);
        console.log(`[MirrorToStore] Backfilled ${topics[index]}: ${result.value.length} messages`);
        // Process messages immediately
        upsertMessages(result.value);
      } else {
        console.error(`[MirrorToStore] Backfill failed ${topics[index]}:`, result.reason);
      }
    });
    
    console.log(`[MirrorToStore] Total backfilled: ${allMessages.length} messages`);
    
    // 2) WebSocket subscriptions for live updates  
    console.log('[MirrorToStore] Step 2: WebSocket subscriptions...');
    const disposers = topics.map(topic => 
      subscribeWs(topic, (message) => {
        console.log(`[MirrorToStore] WS message ${topic}:`, message.sequenceNumber);
        // Process single message
        upsertMessages([message]);
      })
    );
    
    console.log(`[MirrorToStore] Mirror initialization complete. ${topics.length} topics, ${allMessages.length} historical messages loaded into store`);
    
    // Return cleanup function
    return () => {
      console.log('[MirrorToStore] Cleaning up subscriptions...');
      disposers.forEach(dispose => dispose());
    };
    
  } catch (error) {
    console.error('[MirrorToStore] Mirror initialization failed:', error);
    throw error;
  }
}