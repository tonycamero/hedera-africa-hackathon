import { NextRequest, NextResponse } from "next/server";
import { getIssuer } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const me = await getIssuer(req);
    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Count bonds from DB (instant, no HCS latency)
    const accepted = await prisma.contactBond.count({ 
      where: { inviterDid: me } 
    });

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
