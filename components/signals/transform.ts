import { formatISO } from "date-fns";

export function recognitionItemsToActivity(items: any[]) {
  // Expect { json, consensus_timestamp } where json.type === 'RECOGNITION_MINT' (or your shape)
  return items
    .filter(i => i?.json)
    .map((i, idx) => {
      const j = i.json;
      const cat = j.payload?.category || j.payload?.name || j.payload?.definitionSlug || 'Signal';
      const rarity = j.payload?.rarity || 'Regular';
      const to = j.payload?.to || j.payload?.owner || 'unknown';
      const note = j.payload?.note || j.payload?.inscription || '';
      return {
        id: `live_${i.sequence_number}_${idx}`,
        type: 'mint' as const,
        signal: {
          instance_id: j.payload?.id || `${i.topic_id}:${i.sequence_number}`,
          type_id: j.payload?.definitionId || j.payload?.definitionSlug || 'custom@1',
          issuer_pub: j.from || j.payload?.mintedBy || 'unknown',
          recipient_pub: to,
          issued_at: formatISO(new Date(Number(i.consensus_timestamp.split('.')[0]) * 1000)),
          metadata: {
            category: cat,
            rarity,
            inscription: note,
            labels: (j.payload?.labels as string[]) || [],
          }
        },
        actor: j.from || 'Someone',
        timestamp: new Date(Number(i.consensus_timestamp.split('.')[0]) * 1000),
        isFromNetwork: true
      }
    });
}