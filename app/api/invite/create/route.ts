import { NextRequest, NextResponse } from "next/server";
import { getIssuer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hcsPublish, hcsEnvelope } from "@/lib/hedera";
import { ulid } from "ulid";

export async function POST(req: NextRequest) {
  try {
    const issuer = await getIssuer(req);
    if (!issuer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { slug: providedSlug, maxUses = 1 } = body;

    // Get user ward
    const user = await prisma.user.findUnique({ where: { issuer } });
    if (!user?.ward) {
      return NextResponse.json({ error: "User ward required" }, { status: 400 });
    }

    const slug = providedSlug || ulid().toLowerCase();

    // Store in Neon
    const invite = await prisma.invite.create({
      data: {
        slug,
        inviterDid: issuer,
        ward: user.ward,
        maxUses
      }
    });

    // Publish to HCS
    const hcsMessage = hcsEnvelope("INVITE_CREATED", issuer, {
      slug,
      inviter: issuer,
      ward: user.ward
    });
    
    await hcsPublish(hcsMessage);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
    return NextResponse.json({
      slug: invite.slug,
      url: `${baseUrl}/join?ref=${invite.slug}`
    });
  } catch (error) {
    console.error("Invite create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}