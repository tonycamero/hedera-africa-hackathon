import { NextRequest, NextResponse } from "next/server";
import { getIssuer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ulid } from "ulid";
import { APP_MODE } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    console.log('[Invite Create] Starting request...');
    const issuer = await getIssuer(req);
    if (!issuer) {
      console.log('[Invite Create] No issuer found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log('[Invite Create] Issuer found:', issuer);

    const body = await req.json();
    const { slug: providedSlug, maxUses = 1 } = body;
    console.log('[Invite Create] Request body:', { providedSlug, maxUses });

    // Get user ward
    const user = await prisma.user.findUnique({ where: { issuer } });
    console.log('[Invite Create] User found:', { id: user?.id, ward: user?.ward });
    if (!user?.ward) {
      return NextResponse.json({ error: "User ward required" }, { status: 400 });
    }

    const slug = providedSlug || ulid().toLowerCase();
    console.log('[Invite Create] Generated slug:', slug);

    // Store in Neon (database-first for Fairfield mode)
    const invite = await prisma.invite.create({
      data: {
        slug,
        inviterDid: issuer,
        ward: user.ward,
        maxUses
      }
    });
    console.log('[Invite Create] Invite created in DB:', invite.slug);

    // Skip HCS publishing in Fairfield mode (database-first approach)
    if (APP_MODE === 'fairfield') {
      console.log('[Invite Create] Fairfield mode - skipping HCS publishing');
    } else {
      console.log('[Invite Create] Would publish to HCS in other modes');
      // TODO: Add HCS publishing for other modes if needed
    }

    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
    const inviteUrl = `${baseUrl}/join?ref=${invite.slug}`;
    console.log('[Invite Create] Invite URL created:', inviteUrl);
    
    return NextResponse.json({
      slug: invite.slug,
      url: inviteUrl
    });
  } catch (error) {
    console.error('[Invite Create] Detailed error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json({ 
      error: "Failed to create invite",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
