import { NextRequest, NextResponse } from "next/server";
import { getIssuer } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const me = await getIssuer(req);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { displayName, directoryOptIn } = await req.json();
    
    if (displayName && displayName.length > 50) {
      return NextResponse.json({ error: "Display name too long" }, { status: 400 });
    }
    
    const user = await prisma.user.upsert({
      where: { issuer: me },
      create: { 
        issuer: me,
        displayName: displayName || null,
        directoryOptIn: !!directoryOptIn 
      },
      update: { 
        displayName: displayName || null,
        directoryOptIn: !!directoryOptIn 
      }
    });
    
    return NextResponse.json({ 
      issuer: user.issuer, 
      displayName: user.displayName, 
      directoryOptIn: user.directoryOptIn, 
      ward: user.ward 
    });
  } catch (error) {
    console.error("Contact opt-in error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const me = await getIssuer(req);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const user = await prisma.user.findUnique({
      where: { issuer: me },
      select: { issuer: true, displayName: true, directoryOptIn: true, ward: true }
    });
    
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json({ error: "Failed to get profile" }, { status: 500 });
  }
}