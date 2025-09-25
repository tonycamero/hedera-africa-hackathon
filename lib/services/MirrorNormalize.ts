import type { MirrorEvent } from "./MirrorNodeReader";
import type { SignalEvent } from "@/lib/stores/signalsStore";

// Your HCS messages are already published as HCSFeedEvent JSON.
// We just map that to your SignalEvent used by the UI.

type HCSFeedEvent = {
  id: string;
  type: "contact_request" | "contact_accept" | "trust_allocate" | "trust_revoke" | "recognition_mint" | "system_update";
  timestamp: string;
  actor: string;
  target?: string;
  metadata: {
    handle?: string;
    name?: string;
    weight?: number;
    category?: string;
    description?: string;
    rarity?: string;
    explorerUrl?: string;
    topicId?: string;
    // optional extra fields...
  };
  status: "onchain" | "local" | "error";
  direction: "inbound" | "outbound";
  topicId: string;
  sequenceNumber?: number;
};

function topicTypeOf(id: string, ids: { contacts?: string|null; trust?: string|null; recognition?: string|null; profile?: string|null }) {
  if (id && ids.contacts && id === ids.contacts) return "CONTACT" as const;
  if (id && ids.trust && id === ids.trust) return "TRUST" as const;
  if (id && ids.recognition && id === ids.recognition) return "SIGNAL" as const;
  return "PROFILE" as const;
}

export function toSignalEvents(
  mirrorEvents: MirrorEvent<HCSFeedEvent>[],
  topicIds: { contacts?: string|null; trust?: string|null; recognition?: string|null; profile?: string|null }
): SignalEvent[] {
  return mirrorEvents
    .map(me => {
      const e = me.raw;
      if (!e || !e.type) return null;

      let type: SignalEvent["type"];
      let clazz: SignalEvent["class"];

      switch (e.type) {
        case "contact_request": type = "CONTACT_REQUEST"; clazz = "contact"; break;
        case "contact_accept":  type = "CONTACT_ACCEPT";  clazz = "contact"; break;
        case "trust_allocate":  type = "TRUST_ALLOCATE";  clazz = "trust";   break;
        case "trust_revoke":    type = "TRUST_REVOKE";    clazz = "trust";   break;
        case "recognition_mint":type = "NFT_MINT";        clazz = "recognition"; break;
        default:                type = "SYSTEM_UPDATE";   clazz = "system";
      }

      // prefer consensus time from Mirror
      const ts = +new Date(me.consensusTimeISO);

      return {
        id: e.id || `${me.topicId}-${me.sequenceNumber}`,
        type,
        class: clazz,
        status: "onchain", // these are from Mirror, so confirmed
        direction: e.direction || "inbound",
        ts,
        actors: { from: e.actor, to: e.target },
        payload: {
          handle: e.metadata?.handle,
          name: e.metadata?.name,
          weight: e.metadata?.weight,
          category: e.metadata?.category,
          description: e.metadata?.description,
          explorerUrl: e.metadata?.explorerUrl,
        },
        topicType: topicTypeOf(e.topicId || me.topicId, topicIds),
      } as SignalEvent;
    })
    .filter(Boolean) as SignalEvent[];
}