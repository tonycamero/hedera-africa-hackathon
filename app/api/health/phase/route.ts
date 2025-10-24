import { NextResponse } from "next/server";
import { CURRENT_PHASE, ENABLED_LENSES, COMPLIANCE } from "../../../../lib/bootstrap/phaseFlags";

export async function GET() {
  return NextResponse.json({
    current: CURRENT_PHASE,
    lenses: ENABLED_LENSES,
    compliance: COMPLIANCE,
    timestamp: new Date().toISOString(),
    health: "ok"
  });
}