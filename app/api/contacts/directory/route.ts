import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getIssuer } from "@/lib/auth";
import { readTopic } from "@/lib/mirror";

export async function GET(req: NextRequest) {
  try {
    const me = await getIssuer(req);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ward = req.nextUrl.searchParams.get("ward") || undefined;
    const query = (req.nextUrl.searchParams.get("query") || "").trim();

    // Get my existing bonded contacts to exclude from directory
    const topicId = process.env.HEDERA_TOPIC_ID!;
    const messages = await readTopic(topicId);
    
    const bonded = new Set<string>();
    messages.forEach(msg => {
      if (msg?.type === "CONTACT_BOND_CONFIRMED" && msg?.payload) {
        const { inviter, invitee } = msg.payload;
        if (inviter === me) bonded.add(invitee);
        if (invitee === me) bonded.add(inviter);
      }
    });

    // Build database query for opt-in users
    const where: any = { 
      directoryOptIn: true, 
      issuer: { not: me },
      displayName: { not: null } // Only show users who've set a display name
    };
    
    if (ward) where.ward = ward;
    if (query) {
      where.displayName = { 
        contains: query, 
        mode: "insensitive" 
      };
    }

    const results = await prisma.user.findMany({
      where,
      take: 50,
      orderBy: { createdAt: "desc" },
      select: { 
        issuer: true, 
        displayName: true, 
        ward: true 
      }
    });

    // Filter out bonded contacts
    const people = results.filter(person => !bonded.has(person.issuer));

    return NextResponse.json({ people });
  } catch (error) {
    console.error("Directory error:", error);
    return NextResponse.json({ error: "Failed to get directory" }, { status: 500 });
  }
}