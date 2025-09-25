import type { SignalEvent } from "@/lib/stores/signalsStore";
import type { DerivedState } from "@/lib/cache/sessionCache";

export function computeDerivedFromSignals(signals: SignalEvent[], me: string): DerivedState {
  // Trust outbound
  const myTrust = signals.filter(s => s.class === "trust" && (s.actors.from === me));
  const slotsUsed = myTrust.filter(s => s.type !== "TRUST_REVOKE" && s.type !== "TRUST_DECLINE").length;
  const slotsAvail = Math.max(0, 9 - slotsUsed);

  // Inbound bonded top9 (weight desc, then newest)
  const inboundBonded = signals.filter(s =>
    s.class === "trust" &&
    s.actors.to === me &&
    s.type !== "TRUST_REVOKE" &&
    s.type !== "TRUST_DECLINE"
  );

  const top9 = inboundBonded
    .sort((a, b) => {
      const wa = (a.payload?.weight ?? 1), wb = (b.payload?.weight ?? 1);
      if (wb !== wa) return wb - wa;
      return b.ts - a.ts;
    })
    .slice(0, 9)
    .map(s => s.id);

  const lastConsensusISO = signals.length
    ? new Date(Math.max(...signals.map(s => s.ts))).toISOString()
    : undefined;

  return { outboundUsed: slotsUsed, outboundAvail: slotsAvail, inboundTop9Ids: top9, lastConsensusISO };
}