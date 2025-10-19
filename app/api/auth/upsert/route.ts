import { NextRequest, NextResponse } from "next/server";
import { getIssuer, upsertUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    console.log('[Auth Upsert] Starting request...');
    
    const issuer = await getIssuer(req);
    console.log('[Auth Upsert] Issuer:', issuer ? 'found' : 'not found');
    if (!issuer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { email, ward, emailOptIn } = body;
    console.log('[Auth Upsert] Request body:', { email, ward, emailOptIn });

    console.log('[Auth Upsert] Calling upsertUser...');
    const user = await upsertUser(issuer, { email, ward, emailOptIn });
    console.log('[Auth Upsert] User upserted successfully:', user?.id);

    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        ward: user.ward,
        emailOptIn: user.emailOptIn
      }
    });
  } catch (error) {
    console.error('[Auth Upsert] Detailed error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    return NextResponse.json({ 
      error: "Setup failed", 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 });
  }
}
