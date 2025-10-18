import { NextRequest, NextResponse } from "next/server";
import { getIssuer } from "@/lib/auth";
import { readTopic } from "@/lib/mirror";

export async function GET(req: NextRequest) {
  try {
    const issuer = await getIssuer(req);
    if (!issuer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Read HCS messages to count accepted invites
    const topicId = process.env.HEDERA_TOPIC_ID;
    if (!topicId) {
      return NextResponse.json({ error: "Topic ID not configured" }, { status: 500 });
    }

    const messages = await readTopic(topicId);
    
    // Count INVITE_ACCEPTED where user was the inviter
    const accepted = messages.filter(msg => 
      msg.type === "INVITE_ACCEPTED" && 
      msg.payload?.inviter === issuer
    ).length;

    return NextResponse.json({
      accepted,
      unlocked3: accepted >= 3,
      unlocked9: accepted >= 9
    });
  } catch (error) {
    console.error("Progress error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}