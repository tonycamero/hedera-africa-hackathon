"use client";

const MIRROR_URL = process.env.NEXT_PUBLIC_MIRROR_NODE_URL || "https://testnet.mirrornode.hedera.com";

type MirrorMsg = {
  consensus_timestamp: string;
  message: string; // base64
  sequence_number: number;
  topic_id: string;
};

function b64ToString(b64: string) {
  try {
    if (typeof atob !== "undefined") return atob(b64);
    // SSR fallback
    // @ts-ignore
    return Buffer.from(b64, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

export async function fetchTopicMessages(topicId: string, limit = 50, sinceTimestamp?: string) {
  // Build URL with watermark support (P1 fix from situation brief)
  let url = `${MIRROR_URL}/topics/${topicId}/messages?limit=${limit}&order=asc`; // Changed to asc for proper watermarking
  
  if (sinceTimestamp) {
    url += `&timestamp=gt:${sinceTimestamp}`;
  }
  
  console.log(`[MirrorReader] Fetching: ${url}`);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Mirror ${res.status} ${topicId}`);
  const json = await res.json();
  const msgs: MirrorMsg[] = json?.messages ?? [];
  
  console.log(`[MirrorReader] Topic ${topicId}: ${msgs.length} messages ${sinceTimestamp ? `since ${sinceTimestamp}` : ''}`);
  
  // Return with next_since watermark (max consensus_ns)
  const maxTimestamp = msgs.length > 0 
    ? msgs[msgs.length - 1].consensus_timestamp // Last message since we're in asc order
    : sinceTimestamp;
  
  return {
    messages: msgs.map(m => ({
      topicId: m.topic_id,
      sequenceNumber: m.sequence_number,
      consensusTimestamp: m.consensus_timestamp,
      decoded: b64ToString(m.message),
    })),
    next_since: maxTimestamp,
    links: json.links // Include pagination links
  };
}
