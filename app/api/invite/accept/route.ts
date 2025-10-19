import { NextRequest, NextResponse } from "next/server";
import { getIssuer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hcsEnvelope, hcsPublish } from "@/lib/hedera";

export async function POST(req: NextRequest) {
  try {
    const inviteeDid = await getIssuer(req);
    if (!inviteeDid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await req.json();
    if (!slug) {
      return NextResponse.json({ error: "Slug required" }, { status: 400 });
    }

    const invite = await prisma.invite.findUnique({ where: { slug } });
    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (invite.inviterDid === inviteeDid) {
      return NextResponse.json({ error: "Cannot accept your own invite" }, { status: 400 });
    }

    // Idempotent accept + maxUses enforcement + bond create
    try {
      await prisma.$transaction(async (tx) => {
        // Capacity check
        const freshInvite = await tx.invite.findUnique({ where: { slug } });
        if (!freshInvite) throw new Error("Invite not found");
        if (freshInvite.usesCount >= freshInvite.maxUses) {
          throw new Error("Invite max uses reached");
        }

        // Idempotent acceptance
        try {
          await tx.inviteAcceptance.create({
            data: { slug, inviteeDid }
          });
          
          // If we successfully inserted a new acceptance, bump usesCount
          await tx.invite.update({
            where: { slug },
            data: { usesCount: { increment: 1 } }
          });
        } catch (e: any) {
          // Unique violation? Already accepted by this invitee → ignore
          if (!/unique/i.test(String(e?.message))) throw e;
        }

        // Idempotent bond (directional) - this is the key for instant progress!
        try {
          await tx.contactBond.create({
            data: {
              inviterDid: freshInvite.inviterDid,
              inviteeDid,
              source: "invite_accept"
            }
          });
        } catch (e: any) {
          if (!/unique/i.test(String(e?.message))) throw e;
        }
      });
    } catch (e: any) {
      // Surface capacity errors, otherwise proceed if it was idempotent
      if (/max uses/i.test(String(e?.message))) {
        return NextResponse.json({ error: "Invite max uses reached" }, { status: 400 });
      }
    }

    // Emit HCS bond (audit + interop); safe to not block UX on failures  
    try {
      const bondEnvelope = hcsEnvelope("CONTACT_BOND_CONFIRMED", inviteeDid, {
        inviter: invite.inviterDid,
        invitee: inviteeDid,
        slug,
        source: "invite_accept",
        ts: Date.now()
      });
      
      // Fire & forget - don't block UX on HCS latency
      hcsPublish(bondEnvelope).catch((e) => 
        console.warn("[HCS] bond publish failed:", e)
      );
    } catch (e) {
      console.warn("[HCS] envelope/publish error:", e);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Invite accept error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
