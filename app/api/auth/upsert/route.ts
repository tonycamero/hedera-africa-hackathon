import { NextRequest, NextResponse } from "next/server";
import { getIssuer, upsertUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const issuer = await getIssuer(req);
    if (!issuer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { email, ward, emailOptIn } = body;

    const user = await upsertUser(issuer, { email, ward, emailOptIn });

    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        ward: user.ward,
        emailOptIn: user.emailOptIn
      }
    });
  } catch (error) {
    console.error("Auth upsert error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}