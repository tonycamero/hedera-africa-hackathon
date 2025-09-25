// Browser + Node-safe Mirror Node reader for HCS messages
// Reads multiple topics, de-dupes by (topicId, sequence_number), returns newest-first.

type MirrorMsg = {
  consensus_timestamp: string;
  message: string;           // base64
  topic_id: string;
  sequence_number: number;
};

export type MirrorEvent<T = unknown> = {
  topicId: string;
  sequenceNumber: number;
  consensusTimeISO: string;
  raw: T;
};

const MIRROR =
  (typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_MIRROR_NODE_URL || process.env.MIRROR_NODE_URL)
    : (process.env.MIRROR_NODE_URL || process.env.NEXT_PUBLIC_MIRROR_NODE_URL))
  || "https://testnet.mirrornode.hedera.com";

// cross-env base64 decode
function b64decode(b64: string): string {
  if (typeof atob === "function") return atob(b64);
  return Buffer.from(b64, "base64").toString("utf8");
}

async function fetchTopicPage(topicId: string, limit = 50, next?: string) {
  const base = `${MIRROR}/api/v1/topics/${topicId}/messages?order=desc&limit=${limit}`;
  const url = next ? next : base;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Mirror ${topicId} ${r.status}`);
  const j = await r.json();
  return j as { messages: MirrorMsg[]; links?: { next?: string } };
}

export class MirrorNodeReader {
  private topics: string[];
  private seen = new Set<string>(); // `${topicId}#${seq}`
  private latestByTopic = new Map<string, number>(); // highest seq we've returned
  private isRunning = false;

  constructor(topics: string[]) {
    this.topics = topics.filter(Boolean);
  }

  setTopics(topics: string[]) {
    this.topics = topics.filter(Boolean);
  }

  stop() { this.isRunning = false; }

  // One-shot read: grab recent pages for each topic, merge, decode, de-dupe
  async readRecent(limitPerTopic = 50): Promise<MirrorEvent[]> {
    const batches = await Promise.all(
      this.topics.map(t => fetchTopicPage(t, limitPerTopic).catch(() => ({ messages: [] as MirrorMsg[] })))
    );

    const merged: MirrorEvent[] = [];
    for (let i = 0; i < this.topics.length; i++) {
      const topicId = this.topics[i];
      const msgs = (batches[i]?.messages ?? []);
      for (const m of msgs) {
        const key = `${topicId}#${m.sequence_number}`;
        if (this.seen.has(key)) continue;

        // keep only msgs newer than last seen seq for this topic (optional optimization)
        const maxSeq = this.latestByTopic.get(topicId) || 0;
        if (m.sequence_number <= maxSeq) continue;

        let raw: any = null;
        try {
          raw = JSON.parse(b64decode(m.message));
        } catch {
          // skip non-JSON messages
          continue;
        }

        const iso = new Date(Number(m.consensus_timestamp.split(".")[0]) * 1000).toISOString();
        merged.push({
          topicId,
          sequenceNumber: m.sequence_number,
          consensusTimeISO: iso,
          raw,
        });

        this.seen.add(key);
        this.latestByTopic.set(topicId, Math.max(maxSeq, m.sequence_number));
      }
    }

    // newest first
    merged.sort((a, b) => +new Date(b.consensusTimeISO) - +new Date(a.consensusTimeISO));
    return merged;
  }
}