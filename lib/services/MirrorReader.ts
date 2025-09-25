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

export async function fetchTopicMessages(topicId: string, limit = 50) {
  const url = `${MIRROR_URL}/api/v1/topics/${topicId}/messages?limit=${limit}&order=desc`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Mirror ${res.status} ${topicId}`);
  const json = await res.json();
  const msgs: MirrorMsg[] = json?.messages ?? [];
  return msgs.map(m => ({
    topicId: m.topic_id,
    sequenceNumber: m.sequence_number,
    consensusTimestamp: m.consensus_timestamp,
    decoded: b64ToString(m.message),
  }));
}