import { MIRROR_REST, MIRROR_WS, TOPIC, clean } from '@/lib/env';

export interface MirrorMessage {
  topicId: string;
  sequenceNumber: number;
  timestamp: string;
  message: string;
  decoded: string;
}

export async function backfillFromRest(topicId: string, limit = 50): Promise<MirrorMessage[]> {
  const cleanTopicId = clean(topicId);
  // MIRROR_REST already includes /api/v1, so use it directly
  const url = `${MIRROR_REST}/topics/${encodeURIComponent(cleanTopicId)}/messages?limit=${limit}&order=desc`;
  
  console.log(`[MirrorBackfill] REST backfill ${cleanTopicId}:`, url);
  
  try {
    const res = await fetch(url, { 
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrustMesh/1.0'
      }
    });
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error');
      throw new Error(`REST ${res.status} ${res.statusText} for ${url}: ${errorText}`);
    }
    
    const json = await res.json();
    const messages = json?.messages || [];
    
    console.log(`[MirrorBackfill] Topic ${cleanTopicId}: ${messages.length} messages`);
    
    // Convert to our format
    return messages.map((msg: any) => ({
      topicId: cleanTopicId,
      sequenceNumber: msg.sequence_number,
      timestamp: msg.consensus_timestamp,
      message: msg.message,
      decoded: msg.message ? Buffer.from(msg.message, 'base64').toString('utf8') : ''
    }));
    
  } catch (error) {
    console.error(`[MirrorBackfill] Failed for topic ${cleanTopicId}:`, error);
    throw error;
  }
}

export function subscribeWs(topicId: string, onMessage: (msg: MirrorMessage) => void): () => void {
  const cleanTopicId = clean(topicId);
  const wsBase = MIRROR_WS?.includes(':5600') ? MIRROR_WS : `${MIRROR_WS}:5600`;
  const url = `${wsBase}/api/v1/topics/${encodeURIComponent(cleanTopicId)}/messages`;
  
  console.log(`[MirrorBackfill] WS subscribe ${cleanTopicId}:`, url);
  
  let ws: WebSocket | null = null;
  
  try {
    ws = new WebSocket(url);
    
    ws.addEventListener('open', () => {
      console.log(`[MirrorBackfill] WS connected ${cleanTopicId}`);
    });
    
    ws.addEventListener('error', (error) => {
      console.error(`[MirrorBackfill] WS error ${cleanTopicId}:`, error);
    });
    
    ws.addEventListener('close', (event) => {
      console.log(`[MirrorBackfill] WS closed ${cleanTopicId}:`, event.code, event.reason);
    });
    
    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        const message: MirrorMessage = {
          topicId: cleanTopicId,
          sequenceNumber: data.sequence_number,
          timestamp: data.consensus_timestamp,
          message: data.message,
          decoded: data.message ? Buffer.from(data.message, 'base64').toString('utf8') : ''
        };
        onMessage(message);
      } catch (parseError) {
        console.error(`[MirrorBackfill] WS parse error ${cleanTopicId}:`, parseError, event.data);
      }
    });
    
  } catch (error) {
    console.error(`[MirrorBackfill] WS connection failed ${cleanTopicId}:`, error);
  }
  
  // Return cleanup function
  return () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log(`[MirrorBackfill] Closing WS ${cleanTopicId}`);
      ws.close();
    }
  };
}

export async function initializeFeed(): Promise<() => void> {
  try {
    console.log('[MirrorBackfill] Starting feed initialization...');
    
    // Get all topics to monitor
    const topics = [TOPIC.contacts, TOPIC.trust, TOPIC.profile, TOPIC.recognition].filter(Boolean);
    console.log('[MirrorBackfill] Monitoring topics:', topics);
    
    if (topics.length === 0) {
      throw new Error('No topics configured for monitoring');
    }
    
    // 1) REST Backfill first
    console.log('[MirrorBackfill] Step 1: REST backfill...');
    const backfillResults = await Promise.allSettled(
      topics.map(topic => backfillFromRest(topic, 50))
    );
    
    const allMessages: MirrorMessage[] = [];
    backfillResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allMessages.push(...result.value);
        console.log(`[MirrorBackfill] Backfill ${topics[index]}: ${result.value.length} messages`);
      } else {
        console.error(`[MirrorBackfill] Backfill failed ${topics[index]}:`, result.reason);
      }
    });
    
    console.log(`[MirrorBackfill] Total backfilled: ${allMessages.length} messages`);
    
    // 2) WebSocket subscriptions for live updates
    console.log('[MirrorBackfill] Step 2: WebSocket subscriptions...');
    const disposers = topics.map(topic => 
      subscribeWs(topic, (message) => {
        console.log(`[MirrorBackfill] WS message ${topic}:`, message.sequenceNumber);
        // TODO: Add to store/cache for live updates
      })
    );
    
    console.log(`[MirrorBackfill] Feed initialization complete. ${backfillResults.length} topics, ${allMessages.length} historical messages`);
    
    // Return cleanup function
    return () => {
      console.log('[MirrorBackfill] Cleaning up subscriptions...');
      disposers.forEach(dispose => dispose());
    };
    
  } catch (error) {
    console.error('[MirrorBackfill] Feed initialization failed:', error);
    throw error;
  }
}