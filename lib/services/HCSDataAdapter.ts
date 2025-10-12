export type HookItem = { json: any; consensus_timestamp: string; topic_id: string; sequence_number: number };

export function toLegacyEventArray(items: HookItem[]) {
  // mimic what your utils expect (plain JSON events, newest last)
  return items
    .filter(i => !!i.json)
    .map(i => {
      const event = {
        ...i.json,
        // Normalize type to uppercase for compatibility with HCSDataUtils
        type: (i.json.type || '').toUpperCase(),
        _ts: i.consensus_timestamp,
        _topic: i.topic_id,
        _seq: i.sequence_number,
        // Add timestamp as numeric for sorting
        ts: Number(i.consensus_timestamp.split('.')[0]) * 1000 + Number(i.consensus_timestamp.split('.')[1] || 0) / 1000000
      };
      return event;
    })
    .sort((a, b) => (a._ts < b._ts ? -1 : 1));
}
