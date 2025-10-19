import { NextRequest, NextResponse } from "next/server";
import { getIssuer, getUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const issuer = await getIssuer(req);
    if (!issuer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data
    const user = await getUser(issuer);
    
    // Count bonds
    const bondCount = await prisma.contactBond.count({ 
      where: { inviterDid: issuer } 
    });

    return NextResponse.json({ 
      issuer,
      user,
      bondCount,
      hasWard: !!user?.ward,
      progress: {
        accepted: bondCount,
        unlocked3: bondCount >= 3,
        unlocked9: bondCount >= 9
      }
    });
  } catch (error) {
    console.error("Debug user error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 });
  }
}