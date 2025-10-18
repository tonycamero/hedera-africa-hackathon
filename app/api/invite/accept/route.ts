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
    const { slug } = body;

    if (!slug) {
      return NextResponse.json({ error: "Slug required" }, { status: 400 });
    }

    // Find the invite
    const invite = await prisma.invite.findUnique({ where: { slug } });
    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Prevent self-acceptance
    if (invite.inviterDid === issuer) {
      return NextResponse.json({ error: "Cannot accept your own invite" }, { status: 400 });
    }

    // Publish acceptance to HCS
    const hcsMessage = hcsEnvelope("INVITE_ACCEPTED", issuer, {
      slug,
      inviter: invite.inviterDid,
      invitee: issuer
    });
    
    await hcsPublish(hcsMessage);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Invite accept error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}