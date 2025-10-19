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

    // Find all CONTACT_BOND_CONFIRMED events involving me
    const bonds = messages.filter(msg => {
      const envelope = msg.envelope;
      return envelope?.type === "CONTACT_BOND_CONFIRMED" && 
             envelope?.payload &&
             (envelope.payload.inviter === me || envelope.payload.invitee === me);
    });

    // Extract unique partner issuers with earliest timestamp
    const partnerIssuers = new Map<string, number>();
    for (const msg of bonds) {
      const payload = msg.envelope?.payload;
      if (!payload) continue;
      
      const { inviter, invitee } = payload;
      const timestamp = msg.timestamp || Date.now();
      const partner = inviter === me ? invitee : inviter;
      
      if (!partnerIssuers.has(partner) || timestamp < partnerIssuers.get(partner)!) {
        partnerIssuers.set(partner, timestamp);
      }
    }

    // Get user details for partners
    const partners = await prisma.user.findMany({
      where: { 
        issuer: { in: Array.from(partnerIssuers.keys()) }
      },
      select: { 
        issuer: true, 
        displayName: true, 
        ward: true 
      }
    });

    // Combine with timestamps
    const contacts = partners.map(partner => ({
      ...partner,
      since: partnerIssuers.get(partner.issuer)
    }));

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error("Get bonded contacts error:", error);
    return NextResponse.json({ error: "Failed to get contacts" }, { status: 500 });
  }
}