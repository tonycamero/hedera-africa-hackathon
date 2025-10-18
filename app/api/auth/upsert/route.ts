import { NextRequest, NextResponse } from "next/server";
import { getIssuer, upsertUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const issuer = await getIssuer(req);
    if (!issuer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { phone, ward, smsOptIn } = body;

    const user = await upsertUser(issuer, { phone, ward, smsOptIn });

    return NextResponse.json({ 
      user: {
        id: user.id,
        phone: user.phone,
        ward: user.ward,
        smsOptIn: user.smsOptIn
      }
    });
  } catch (error) {
    console.error("Auth upsert error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}