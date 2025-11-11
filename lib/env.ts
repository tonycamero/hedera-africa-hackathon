// Environment utilities with whitespace cleaning to prevent CR/LF issues
export const clean = (s?: string | null) => (s ?? '').replace(/\r|\n/g, '').trim();

export const cleanBool = (s?: string | null) => {
  const v = clean(s).toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'on';
};

// Clean topic environment variables
export const TOPIC = {
  profile: clean(process.env.NEXT_PUBLIC_TOPIC_PROFILE),
  contacts: clean(process.env.NEXT_PUBLIC_TOPIC_CONTACT),
  trust: clean(process.env.NEXT_PUBLIC_TOPIC_TRUST),
  feed: clean(process.env.NEXT_PUBLIC_TOPIC_SIGNAL),
  recognition: clean(process.env.NEXT_PUBLIC_TOPIC_RECOGNITION),
  system: clean(process.env.NEXT_PUBLIC_TOPIC_SIGNAL), // Using signal topic as system
};

// Ingestion-compatible topic mapping (normalized names)
export const TOPICS = {
  contacts: TOPIC.contacts,
  trust: TOPIC.trust,
  profile: TOPIC.profile,
  signal: TOPIC.feed,
  recognition: TOPIC.recognition,
} as const;

export type TopicKey = keyof typeof TOPICS;

// Clean other environment variables - ensure Mirror REST URL has /api/v1
export const MIRROR_REST = (() => {
  const rawUrl = clean(process.env.NEXT_PUBLIC_MIRROR_NODE_URL) || "https://testnet.mirrornode.hedera.com";
  // Strip any existing /api/v1 and add it once
  const cleanUrl = rawUrl.replace(/\/$/, '').replace(/\/api\/v1$/, '');
  return `${cleanUrl}/api/v1`;
})();
export const MIRROR_WS = clean(process.env.NEXT_PUBLIC_MIRROR_NODE_WS) || "wss://testnet.mirrornode.hedera.com:5600";
export const NODE_ENV = clean(process.env.NODE_ENV) || 'development';

export const HCS_ENABLED =
  ['true','1','yes','on'].includes((process.env.NEXT_PUBLIC_HCS_ENABLED ?? '').trim().toLowerCase());

// GenZ Lens Feature Flag
export const GENZ_LENS = cleanBool(process.env.GENZ_LENS) || cleanBool(process.env.NEXT_PUBLIC_GENZ_LENS);

// Session ID (cleaned)
export const SESSION_ID = clean(process.env.NEXT_PUBLIC_SESSION_ID) || "tm-alex-chen";

// Hedera client configuration
export const HEDERA_NETWORK = clean(process.env.NEXT_PUBLIC_HEDERA_NETWORK) || 'testnet';
export const HEDERA_OPERATOR_ID = clean(process.env.HEDERA_OPERATOR_ID);
export const HEDERA_OPERATOR_KEY = clean(process.env.HEDERA_OPERATOR_KEY);

// Registry configuration
export const REGISTRY_ID = clean(process.env.NEXT_PUBLIC_TRUSTMESH_REGISTRY_ID);

// Ingestion configuration
export const INGEST_DEBUG = NODE_ENV === 'development';
export const BACKFILL_PAGE_SIZE = parseInt(process.env.HCS_BACKFILL_PAGE_SIZE || '100');
export const WS_RECONNECT_MAX_BACKOFF = parseInt(process.env.HCS_WS_MAX_BACKOFF || '15000');
export const CURSOR_STORAGE_PREFIX = 'hcs-cursor';
export const WS_RECONNECT_JITTER_MAX = 250;

// WebSocket configuration
export const WS_ENABLED = cleanBool(process.env.NEXT_PUBLIC_HCS_WS_ENABLED) ?? true;
export const REST_POLL_INTERVAL = parseInt(process.env.HCS_REST_POLL_INTERVAL || '10000'); // 10 seconds default
