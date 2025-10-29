// HCS-22 Initialization - Warmup from HCS history and live subscription
import { Client, TopicId } from '@hashgraph/sdk';
import { listSince } from '../../mirror/serverMirror';
import { decodeBase64Json } from '../../mirror/serverMirror';
import { reduceHcs22 } from './reducer';
import type { Hcs22Envelope } from './types';

let initialized = false;

/**
 * Initialize HCS-22 identity registry
 * 
 * 1. Warmup: Fetch last 7 days of identity events from Mirror Node
 * 2. Subscribe: Listen for new identity events in real-time
 * 
 * Call this on app startup (e.g., in Next.js instrumentation or custom server)
 */
export async function initHcs22() {
  if (initialized) {
    console.log('[HCS22 Init] Already initialized');
    return;
  }

  if (process.env.HCS22_ENABLED !== 'true') {
    console.log('[HCS22 Init] Skipping initialization (HCS22_ENABLED=false)');
    return;
  }

  const topicId = process.env.HCS22_IDENTITY_TOPIC_ID;
  if (!topicId) {
    console.warn('[HCS22 Init] Skipping initialization (HCS22_IDENTITY_TOPIC_ID not set)');
    return;
  }

  console.log('[HCS22 Init] Starting initialization for topic:', topicId);

  try {
    // Step 1: Warmup from last 7 days
    await warmupFromHistory(topicId);

    // Step 2: Subscribe to live events
    // Note: Live subscription is optional and can be enabled when needed
    // await subscribeLive(topicId);

    initialized = true;
    console.log('[HCS22 Init] Initialization complete');
  } catch (error: any) {
    console.error('[HCS22 Init] Initialization failed:', error.message);
    // Don't throw - allow app to continue without HCS-22
  }
}

/**
 * Warmup: Load historical identity events from Mirror Node
 * Fetches events from the last N days to populate in-memory state
 */
async function warmupFromHistory(topicId: string) {
  console.log('[HCS22 Warmup] Fetching historical events...');

  // Calculate timestamp for 7 days ago (in seconds.nanoseconds format)
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const sinceTimestamp = `${Math.floor(sevenDaysAgo / 1000)}.0`;

  try {
    const { messages, watermark } = await listSince(topicId, sinceTimestamp, 500, 0);
    console.log(`[HCS22 Warmup] Fetched ${messages.length} messages`);

    let processed = 0;
    let errors = 0;

    for (const msg of messages) {
      try {
        // Decode base64 message
        const event = decodeBase64Json(msg.message);
        
        if (!event || !event.t || !event.sub) {
          // Not an HCS-22 event, skip
          continue;
        }

        // Validate event type
        if (!['IDENTITY_BIND', 'IDENTITY_ASSERT', 'IDENTITY_ROTATE', 'IDENTITY_UNBIND'].includes(event.t)) {
          continue;
        }

        // Reduce the event
        reduceHcs22(event as Hcs22Envelope);
        processed++;
      } catch (error: any) {
        errors++;
        // Don't log every error, just count them
      }
    }

    console.log(`[HCS22 Warmup] Processed ${processed} identity events (${errors} errors, watermark: ${watermark})`);
  } catch (error: any) {
    console.error('[HCS22 Warmup] Failed to fetch historical events:', error.message);
    throw error;
  }
}

/**
 * Subscribe to live HCS events
 * 
 * Note: This requires maintaining a persistent connection to the Mirror Node
 * For Next.js apps, this is best done in a separate process or using
 * serverless-friendly polling instead
 * 
 * Uncomment and adapt when needed for production
 */
/*
async function subscribeLive(topicIdStr: string) {
  console.log('[HCS22 Subscribe] Starting live subscription...');

  try {
    const network = process.env.HEDERA_NETWORK ?? 'testnet';
    const client = Client.forName(network);
    const topicId = TopicId.fromString(topicIdStr);

    // Subscribe to new messages (starting from now)
    const subscription = new TopicMessageQuery()
      .setTopicId(topicId)
      .subscribe(client, (message) => {
        try {
          const decoded = Buffer.from(message.contents).toString('utf8');
          const event = JSON.parse(decoded) as Hcs22Envelope;
          
          if (event.t && event.sub) {
            reduceHcs22(event);
          }
        } catch (error: any) {
          console.warn('[HCS22 Subscribe] Failed to process message:', error.message);
        }
      });

    console.log('[HCS22 Subscribe] Live subscription active');
    
    // Handle cleanup on process exit
    process.on('SIGTERM', () => {
      console.log('[HCS22 Subscribe] Unsubscribing...');
      subscription.unsubscribe();
    });
  } catch (error: any) {
    console.error('[HCS22 Subscribe] Failed to start subscription:', error.message);
    throw error;
  }
}
*/

/**
 * Manually trigger a warmup (useful for testing or manual refresh)
 */
export async function manualWarmup() {
  const topicId = process.env.HCS22_IDENTITY_TOPIC_ID;
  if (!topicId) {
    throw new Error('HCS22_IDENTITY_TOPIC_ID not set');
  }

  console.log('[HCS22] Manual warmup triggered');
  await warmupFromHistory(topicId);
}
