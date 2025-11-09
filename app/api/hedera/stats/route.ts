import { NextResponse } from "next/server";
import { topics as getTopics } from '@/lib/registry/serverRegistry';

const MIRROR = process.env.NEXT_PUBLIC_MIRROR_NODE_URL || "https://testnet.mirrornode.hedera.com/api/v1";
const topicRegistry = getTopics();
const topics = {
  contact: topicRegistry.contacts,
  trust: topicRegistry.trust,
  recognition: topicRegistry.recognition,
  profile: topicRegistry.profile,
};

export async function GET() {
  async function topicInfo(id?: string | null) {
    if (!id) return null;
    const base = `${MIRROR}/topics/${id}`;
    try {
      const [t, recent] = await Promise.all([
        fetch(base).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${base}/messages?limit=20&order=desc`).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
      return { id, info: t, recent: recent?.messages ?? [] };
    } catch {
      return { id, info: null, recent: [] };
    }
  }

  const data = {
    contact: await topicInfo(topics.contact),
    trust: await topicInfo(topics.trust),
    recognition: await topicInfo(topics.recognition),
    profile: await topicInfo(topics.profile),
  };

  return NextResponse.json({ data });
}
