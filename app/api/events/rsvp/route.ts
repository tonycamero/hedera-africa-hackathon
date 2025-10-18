import { NextRequest, NextResponse } from "next/server";
import { getIssuer } from "@/lib/auth";
import { hcsPublish, hcsEnvelope } from "@/lib/hedera";

export async function POST(req: NextRequest) {
  try {
    const issuer = await getIssuer(req);
    if (!issuer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    // Publish RSVP to HCS
    const hcsMessage = hcsEnvelope("EVENT_RSVP", issuer, {
      eventId
    });
    
    await hcsPublish(hcsMessage);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Event RSVP error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}