export type HookItem = { json: any; consensus_timestamp: string; topic_id: string; sequence_number: number };

export function toLegacyEventArray(items: HookItem[]) {
  // mimic what your utils expect (plain JSON events, newest last)
  return items
    .filter(i => !!i.json)
    .map(i => {
      // Parse timestamp safely with defensive validation
      let ts = Date.now(); // fallback to current time
      if (i.consensus_timestamp && typeof i.consensus_timestamp === 'string') {
        try {
          const parts = i.consensus_timestamp.split('.');
          const seconds = Number(parts[0]) || 0;
          const nanos = Number(parts[1]) || 0;
          ts = seconds * 1000 + nanos / 1000000;
        } catch (err) {
          console.error('[HCSDataAdapter] Failed to parse timestamp:', i.consensus_timestamp, err);
        }
      } else {
        console.warn('[HCSDataAdapter] Missing or invalid consensus_timestamp:', i.consensus_timestamp);
      }
      
      const event = {
        ...i.json,
        // Normalize type to uppercase for compatibility with HCSDataUtils
        type: (typeof i.json.type === 'string' ? i.json.type : String(i.json.type || '')).toUpperCase(),
        _ts: i.consensus_timestamp || '',
        _topic: i.topic_id || '',
        _seq: i.sequence_number || 0,
        // Add timestamp as numeric for sorting
        ts
      };
      return event;
    })
    .sort((a, b) => (a._ts < b._ts ? -1 : 1));
}
