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
    const hcsData: HCSMessage = JSON.parse(message.decoded);
    
    if (!hcsData.type || !hcsData.from || !hcsData.ts) {
      console.log(`[MirrorToStore] Skipping incomplete message:`, hcsData);
      return null;
    }

    // Determine signal class and direction
    let signalClass: SignalEvent['class'] = 'system';
    let signalType: SignalEvent['type'] = hcsData.type;
    let topicType: SignalEvent['topicType'] = 'SIGNAL';
    
    if (hcsData.type.includes('CONTACT')) {
      signalClass = 'contact';
      topicType = 'CONTACT';
    } else if (hcsData.type.includes('TRUST')) {
      signalClass = 'trust';
      topicType = 'TRUST';
    } else if (hcsData.type.includes('PROFILE')) {
      signalClass = 'system';
      topicType = 'PROFILE';
    } else if (hcsData.type.includes('RECOGNITION') || hcsData.type.includes('NFT')) {
      signalClass = 'recognition';
      topicType = 'SIGNAL';
    }

    // Determine direction (simplified - could be enhanced based on current session)
    // For now, assume outbound if from matches known pattern, inbound otherwise
    const direction: SignalEvent['direction'] = 'inbound'; // Default, could be enhanced
    
    const signalEvent: SignalEvent = {
      id: `mirror_${message.topicId}_${message.sequenceNumber}`,
      class: signalClass,
      topicType,
      direction,
      actors: {
        from: hcsData.from,
        to: hcsData.payload?.target || hcsData.payload?.to
      },
      payload: hcsData.payload || {},
      ts: hcsData.ts * 1000, // Convert to milliseconds
      status: 'onchain', // Data from Mirror is already on-chain
      type: signalType,
      meta: {
        tag: 'mirror_backfill',
        topicId: message.topicId,
        sequenceNumber: message.sequenceNumber
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
    signalsStore.addSignal(event);
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