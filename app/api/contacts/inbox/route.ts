import { NextRequest, NextResponse } from "next/server";
import { getIssuer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readTopicMessages } from "@/lib/mirror";

export async function GET(req: NextRequest) {
  try {
    const me = await getIssuer(req);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const topicId = process.env.HEDERA_TOPIC_ID!;
    const messages = await readTopicMessages(topicId);

    // Get all direct requests targeting me
    const directRequests = messages.filter(msg => {
      const envelope = msg.envelope;
      return envelope?.type === "CONTACT_BOND_REQUEST_DIRECT" && 
             envelope?.payload?.invitee === me;
    });

    // Get all confirmations to filter out already confirmed requests
    const confirmations = new Set<string>();
    messages.forEach(msg => {
      const envelope = msg.envelope;
      if (envelope?.type === "CONTACT_BOND_CONFIRMED" && envelope.payload) {
        const { inviter, invitee } = envelope.payload;
        if (invitee === me) confirmations.add(inviter);
        if (inviter === me) confirmations.add(invitee);
      }
    });

    // Filter to pending requests only
    const pendingRequests = directRequests.filter(msg => {
      const inviter = msg.envelope?.payload?.inviter;
      return inviter && !confirmations.has(inviter);
    });

    // Get inviter user details
    const inviterIssuers = pendingRequests
      .map(msg => msg.envelope?.payload?.inviter)
      .filter(Boolean);

    const inviters = await prisma.user.findMany({
      where: { issuer: { in: inviterIssuers } },
      select: { 
        issuer: true, 
        displayName: true, 
        ward: true 
      }
    });

    // Combine request data with user details
    const requests = pendingRequests.map(msg => {
      const payload = msg.envelope?.payload;
      const inviter = inviters.find(u => u.issuer === payload?.inviter);
      
      return {
        nonce: payload?.nonce,
        inviter: inviter || { issuer: payload?.inviter, displayName: null, ward: payload?.ward },
        timestamp: msg.timestamp,
        ward: payload?.ward
      };
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Inbox error:", error);
    return NextResponse.json({ error: "Failed to get requests" }, { status: 500 });
  }
}