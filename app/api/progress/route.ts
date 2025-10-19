import { NextRequest, NextResponse } from "next/server";
import { getIssuer } from "@/lib/auth";
import { signalsStore } from "@/lib/stores/signalsStore";

export async function GET(req: NextRequest) {
  try {
    const issuer = await getIssuer(req);
    if (!issuer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use signalsStore to read bonded contacts from universal recognition system
    // This follows the same pattern as Professional and GenZ lenses
    const contactBondEvents = signalsStore.getByType('CONTACT_BOND_CONFIRMED');
    
    // Count unique bonded contacts for this user
    const bondedContacts = new Set<string>();
    contactBondEvents.forEach(event => {
      if (event.metadata?.inviter === issuer) {
        bondedContacts.add(event.metadata.invitee);
      }
      if (event.metadata?.invitee === issuer) {
        bondedContacts.add(event.metadata.inviter);
      }
    });
    
    const accepted = bondedContacts.size;

    return NextResponse.json({
      accepted,
      unlocked3: accepted >= 3,
      unlocked9: accepted >= 9
    });
  } catch (error) {
    console.error("Progress error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
