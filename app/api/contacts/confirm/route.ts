import { NextRequest, NextResponse } from "next/server";
import { getIssuer } from "@/lib/auth";
import { fairfieldVoiceService } from "@/lib/services/FairfieldVoiceService";

export async function POST(req: NextRequest) {
  try {
    const me = await getIssuer(req);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { inviterIssuer, slug } = await req.json();
    
    if (!inviterIssuer && !slug) {
      return NextResponse.json({ error: "inviterIssuer or slug required" }, { status: 400 });
    }

    // Send civic signal via FairfieldVoiceService (universal lens pattern)
    const result = await fairfieldVoiceService.sendCivicSignal({
      type: 'CONTACT_BOND_CONFIRMED',
      actor: me,
      payload: {
        inviter: inviterIssuer || null,
        invitee: me,
        slug: slug || null,
        timestamp: Date.now()
      }
    });
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact confirm error:", error);
    return NextResponse.json({ error: "Failed to confirm contact" }, { status: 500 });
  }
}