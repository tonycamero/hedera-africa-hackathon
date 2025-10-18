import { NextRequest, NextResponse } from "next/server";
import { getIssuer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hcsPublish, hcsEnvelope } from "@/lib/hedera";

export async function POST(req: NextRequest) {
  try {
    const issuer = await getIssuer(req);
    if (!issuer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { supports, yardSign, topIssue, contactPref } = body;

    // Get user ward
    const user = await prisma.user.findUnique({ where: { issuer } });
    if (!user?.ward) {
      return NextResponse.json({ error: "User ward required" }, { status: 400 });
    }

    // Publish minimal non-PII data to HCS
    const hcsMessage = hcsEnvelope("SUPPORT_SAVED", issuer, {
      supports: !!supports,
      ward: user.ward
    });
    
    await hcsPublish(hcsMessage);

    // Optionally store contact preference in DB for ops
    if (contactPref) {
      await prisma.user.update({
        where: { issuer },
        data: { smsOptIn: contactPref === "sms" }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Support save error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}