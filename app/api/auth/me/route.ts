import { NextRequest, NextResponse } from "next/server";
import { getIssuer, getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const issuer = await getIssuer(req);
    if (!issuer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUser(issuer);
    
    return NextResponse.json({ 
      user: user ? {
        id: user.id,
        email: user.email,
        ward: user.ward,
        emailOptIn: user.emailOptIn,
        hasCompletedSetup: !!user.ward
      } : null
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}