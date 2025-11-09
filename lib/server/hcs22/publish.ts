// HCS-22 Publisher - Wraps existing submitToTopic with HCS22-specific logic
import { submitToTopic } from '../../hedera/serverClient';
import type { Hcs22Envelope } from './types';

const topicId = process.env.HCS22_IDENTITY_TOPIC_ID;

/**
 * Publish an HCS-22 identity event to the identity registry topic
 * Non-blocking; logs errors but doesn't throw (caller can decide retry strategy)
 */
export async function publishHcs22(event: Hcs22Envelope) {
  if (process.env.HCS22_ENABLED !== 'true') {
    console.log(`[HCS22] Skip publish (HCS22_ENABLED=${process.env.HCS22_ENABLED})`);
    return { skipped: true, reason: 'feature_disabled' };
  }

  if (!topicId) {
    console.warn(`[HCS22] Skip publish (HCS22_IDENTITY_TOPIC_ID not set)`);
    return { skipped: true, reason: 'no_topic_id' };
  }

  try {
    const message = JSON.stringify(event);
    console.log(`[HCS22] Publishing ${event.t} for ${event.sub} to topic ${topicId}`);
    
    const result = await submitToTopic(topicId, message);
    
    console.log(`[HCS22] Published ${event.t} for ${event.sub}: seq=${result.sequenceNumber}, txId=${result.transactionId}`);
    return { 
      success: true,
      ...result 
    };
  } catch (error: any) {
    console.error(`[HCS22] Publish failed for ${event.t}:`, error.message);
    // Non-blocking; caller can retry if needed
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Publish HCS-22 event asynchronously (fire-and-forget)
 * Useful for non-critical audit trail publishing
 */
export function publishHcs22Async(event: Hcs22Envelope) {
  publishHcs22(event).catch(err => {
    console.warn(`[HCS22] Async publish failed for ${event.t}:`, err);
  });
}
