import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const events = await prisma.event.findMany({
      where: {
        startsAt: {
          gte: new Date()
        }
      },
      orderBy: {
        startsAt: "asc"
      }
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Events list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}