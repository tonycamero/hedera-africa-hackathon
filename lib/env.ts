// Environment utilities with whitespace cleaning to prevent CR/LF issues
export const clean = (s?: string | null) => (s ?? '').replace(/\r|\n/g, '').trim();
const trim = (s?: string | null) => (s ?? '').trim().replace(/\/+$/,'');

const cleanBool = (s?: string | null) => {
  const v = clean(s).toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'on';
};

// Ensure REST endpoint has exactly one /api/v1
const ensureRest = (base: string) =>
  /\/api\/v1$/.test(base) ? base : `${base}/api/v1`;

// App configuration
export const APP_MODE = (process.env.NEXT_PUBLIC_APP_MODE || 'fairfield').toLowerCase();
export const IS_PROD = process.env.NODE_ENV === 'production';

// Check if we're in Fairfield Voice mode
const isFairfieldMode = () => APP_MODE === "fairfield";

// Mirror endpoints (guard the double api/v1 issue)
export const MIRROR_REST = ensureRest(trim(process.env.NEXT_PUBLIC_MIRROR_REST) || 'https://testnet.mirrornode.hedera.com');
export const MIRROR_WS = trim(process.env.NEXT_PUBLIC_MIRROR_WS) || 'wss://testnet.mirrornode.hedera.com';

// Topics (empty = disabled)
export const TOPIC = {
  profile: clean(process.env.NEXT_PUBLIC_TOPIC_PROFILE),
  contacts: clean(process.env.NEXT_PUBLIC_TOPIC_CONTACTS),
  trust: clean(process.env.NEXT_PUBLIC_TOPIC_TRUST),
  signal: clean(process.env.NEXT_PUBLIC_TOPIC_SIGNAL),
  recognition: clean(process.env.NEXT_PUBLIC_TOPIC_RECOGNITION),
};

// Fairfield Voice uses a single HCS topic for all events
const FAIRFIELD_TOPIC = clean(process.env.HEDERA_TOPIC_ID);

// Ingestion-compatible topic mapping (normalized names)
export const TOPICS = isFairfieldMode() ? {
  contacts: FAIRFIELD_TOPIC,
  trust: FAIRFIELD_TOPIC, 
  profile: FAIRFIELD_TOPIC,
  signal: FAIRFIELD_TOPIC,
  recognition: FAIRFIELD_TOPIC,
} as const : {
  contacts: TOPIC.contacts,
  trust: TOPIC.trust,
  profile: TOPIC.profile,
  signal: TOPIC.signal,
  recognition: TOPIC.recognition,
} as const;

export type TopicKey = keyof typeof TOPICS;

// Feature flags (explicit opt-in)
export const BOOT = {
  DEMO: cleanBool(process.env.NEXT_PUBLIC_BOOT_DEMO),
  HCS_INGEST: cleanBool(process.env.NEXT_PUBLIC_BOOT_INGEST) !== false, // default true
};

// Derived "should we start this" checks
export const SHOULD_INGEST = BOOT.HCS_INGEST && (
  !!TOPIC.contacts || !!TOPIC.recognition || !!TOPIC.signal || !!TOPIC.trust || !!TOPIC.profile
);

// Validation helpers
export const getValidTopics = () => {
  return Object.entries(TOPICS)
    .filter(([, id]) => !!id && /^0\.0\.\d+$/.test(id))
    .map(([name, id]) => ({ name, id }));
};

export const shouldBootHCS = () => {
  const validTopics = getValidTopics();
  return SHOULD_INGEST && validTopics.length > 0 && MIRROR_REST && MIRROR_WS;
};

export const NODE_ENV = clean(process.env.NODE_ENV) || 'development';

export const HCS_ENABLED = cleanBool(process.env.NEXT_PUBLIC_HCS_ENABLED) !== false;

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
