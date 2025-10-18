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
    const { door, phone, ride, notes } = body;

    // Publish volunteer roles to HCS (no PII)
    const hcsMessage = hcsEnvelope("VOLUNTEER_SAVED", issuer, {
      roles: {
        door: !!door,
        phone: !!phone,
        ride: !!ride
      }
    });
    
    await hcsPublish(hcsMessage);

    // Note: Could store notes in DB if needed for ops (add volunteer_notes column)
    // For v1, we'll skip storing notes

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Volunteer save error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}