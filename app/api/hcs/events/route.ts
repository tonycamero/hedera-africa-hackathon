import { NextRequest, NextResponse } from "next/server";
import { listSince, decodeBase64Json } from "@/lib/mirror/serverMirror";

// Map canonical types → topic envs
const TOPICS = {
  profile: process.env.TOPIC_PROFILE,
  contact: process.env.TOPIC_CONTACT,
  trust: process.env.TOPIC_TRUST,
  recognition: process.env.TOPIC_SIGNAL || process.env.TOPIC_RECOGNITION,
};

export async function GET(req: NextRequest) {
  try {
    const type = (req.nextUrl.searchParams.get("type") || "trust") as keyof typeof TOPICS;
    const since = req.nextUrl.searchParams.get("since") || undefined;
    const limit = Number(req.nextUrl.searchParams.get("limit") || 200);
    const topicId = TOPICS[type];
    if (!topicId) return NextResponse.json({ ok:false, error:`No topic for ${type}` }, { status: 400 });

    const { messages, watermark } = await listSince(topicId, since, Math.min(limit, 200));
    const decoded = messages.map((m: any) => ({
      consensus_timestamp: m.consensus_timestamp,
      sequence_number: m.sequence_number,
      topic_id: m.topic_id,
      json: decodeBase64Json(m.message),
    }));
    return NextResponse.json({ ok:true, type, watermark, items: decoded });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || "mirror_failed" }, { status: 500 });
  }
}