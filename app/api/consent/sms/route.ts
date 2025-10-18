import { NextRequest, NextResponse } from "next/server";
import { getIssuer } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const issuer = await getIssuer(req);
    if (!issuer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (!action || !["opt_in", "opt_out", "help"].includes(action)) {
      return NextResponse.json({ 
        error: "Action must be opt_in, opt_out, or help" 
      }, { status: 400 });
    }

    // Log consent action
    await prisma.consentLog.create({
      data: {
        issuer,
        channel: "email",
        action
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Consent SMS error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}