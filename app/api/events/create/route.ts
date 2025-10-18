import { NextRequest, NextResponse } from "next/server";
import { getIssuer, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const issuer = await getIssuer(req);
    if (!issuer || !isAdmin(issuer)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, startsAt, location, details } = body;

    if (!title || !startsAt || !location) {
      return NextResponse.json({ 
        error: "Title, startsAt, and location are required" 
      }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        title,
        startsAt: new Date(startsAt),
        location,
        details
      }
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Event create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}