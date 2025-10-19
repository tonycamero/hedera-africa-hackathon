import { NextRequest, NextResponse } from "next/server";
import { getIssuer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fairfieldVoiceService } from "@/lib/services/FairfieldVoiceService";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const inviter = await getIssuer(req);
    if (!inviter) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { targetIssuer } = await req.json();
    
    if (!targetIssuer || targetIssuer === inviter) {
      return NextResponse.json({ error: "Invalid target" }, { status: 400 });
    }

    // Get my ward info
    const me = await prisma.user.findUnique({ 
      where: { issuer: inviter },
      select: { ward: true }
    });
    
    if (!me?.ward) {
      return NextResponse.json({ error: "Ward required" }, { status: 400 });
    }

    // Verify target user exists and is opt-in
    const target = await prisma.user.findUnique({
      where: { issuer: targetIssuer },
      select: { directoryOptIn: true }
    });
    
    if (!target || !target.directoryOptIn) {
      return NextResponse.json({ error: "Target user not available" }, { status: 400 });
    }

    // Create unique request nonce
    const nonce = crypto.randomBytes(8).toString("hex");
    
    // Send civic signal via FairfieldVoiceService (universal lens pattern)
    const result = await fairfieldVoiceService.sendCivicSignal({
      type: 'CONTACT_BOND_REQUEST_DIRECT',
      actor: inviter,
      payload: {
        inviter,
        invitee: targetIssuer,
        ward: me.ward,
        nonce
      }
    });
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true, nonce });
  } catch (error) {
    console.error("Contact request error:", error);
    return NextResponse.json({ error: "Failed to send request" }, { status: 500 });
  }
}