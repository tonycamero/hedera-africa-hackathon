const BASE = (() => {
  const rawUrl = process.env.NEXT_PUBLIC_MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com';
  // Strip any existing /api/v1 and add it once to prevent duplication
  const cleanUrl = rawUrl.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
  return `${cleanUrl}/api/v1`;
})();
const ORIGIN = (() => { try { return new URL(BASE).origin; } catch { return 'https://testnet.mirrornode.hedera.com'; } })();

const mem: Record<string, { at: number; data: any[]; watermark?: string }> = {};

export async function listSince(topicId: string, since?: string, pageLimit = 200, ttlMs = 3000) {
  // cache key is topic + since
  const k = `${topicId}:${since || '0'}`;
  const now = Date.now();
  if (mem[k] && now - mem[k].at < ttlMs) return { messages: mem[k].data, watermark: mem[k].watermark };

  let url = `${BASE}/topics/${topicId}/messages?order=asc&limit=${pageLimit}`;
  if (since) url += `&timestamp=gt:${since}`;

  console.log(`[serverMirror] Fetching from: ${url}`);
  console.log(`[serverMirror] BASE URL: ${BASE}`);
  console.log(`[serverMirror] Topic ID: ${topicId}`);

  const out: any[] = [];
  let next = url;
  let lastTs = since || '0.0';

  for (let hops = 0; hops < 10 && next; hops++) {
    const res = await fetch(next, { cache: 'no-store' });
    console.log(`[serverMirror] Hop ${hops}: status ${res.status}, url: ${next}`);
    if (!res.ok) {
      console.error(`[serverMirror] Fetch failed: ${res.status} ${res.statusText}`);
      const errorText = await res.text();
      console.error(`[serverMirror] Error body:`, errorText);
      throw new Error(`Mirror ${res.status}`);
    }
    const json = await res.json();
    console.log(`[serverMirror] Received ${json.messages?.length || 0} messages`);
    for (const m of json.messages || []) {
      out.push(m);
      lastTs = m.consensus_timestamp;
    }
    const link = json.links?.next;
    next = link ? (link.startsWith('http') ? link : `${ORIGIN}${link}`) : '';
  }

  mem[k] = { at: now, data: out, watermark: lastTs };
  return { messages: out, watermark: lastTs };
}

export function decodeBase64Json(b64: string): any | null {
  try { return JSON.parse(Buffer.from(b64, 'base64').toString('utf8')); }
  catch { return null; }
}

// Legacy function for backward compatibility
export async function fetchTopicMessages(topicId: string, limit = 200, ttlMs = 5000) {
  const { messages } = await listSince(topicId, undefined, limit, ttlMs);
  return messages.map((m: any) => {
    const utf8 = Buffer.from(m.message, 'base64').toString('utf8');
    let json: any = null;
    try { 
      json = JSON.parse(utf8);
    } catch {}
    return { ...m, decoded: utf8, json };
  });
}
