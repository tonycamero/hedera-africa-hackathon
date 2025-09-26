// Environment utilities with whitespace cleaning to prevent CR/LF issues
export const clean = (s?: string | null) => (s ?? '').replace(/\r|\n/g, '').trim();

// Clean topic environment variables
export const TOPIC = {
  profile: clean(process.env.NEXT_PUBLIC_TOPIC_PROFILE),
  contacts: clean(process.env.NEXT_PUBLIC_TOPIC_CONTACT),
  trust: clean(process.env.NEXT_PUBLIC_TOPIC_TRUST),
  feed: clean(process.env.NEXT_PUBLIC_TOPIC_SIGNAL),
  recognition: clean(process.env.NEXT_PUBLIC_TOPIC_RECOGNITION),
  system: clean(process.env.NEXT_PUBLIC_TOPIC_SIGNAL), // Using signal topic as system
};

// Clean other environment variables
export const MIRROR_REST = clean(process.env.NEXT_PUBLIC_MIRROR_NODE_URL);
export const MIRROR_WS = clean(process.env.NEXT_PUBLIC_MIRROR_NODE_WS);
export const HCS_ENABLED = clean(process.env.NEXT_PUBLIC_HCS_ENABLED) === "true";
export const DEMO_SEED = clean(process.env.NEXT_PUBLIC_DEMO_SEED);
export const DEMO_MODE = clean(process.env.NEXT_PUBLIC_DEMO_MODE) === 'true';

// Hedera client configuration
export const HEDERA_NETWORK = clean(process.env.NEXT_PUBLIC_HEDERA_NETWORK) || 'testnet';
export const HEDERA_OPERATOR_ID = clean(process.env.HEDERA_OPERATOR_ID);
export const HEDERA_OPERATOR_KEY = clean(process.env.HEDERA_OPERATOR_KEY);

// Registry configuration
export const REGISTRY_ID = clean(process.env.NEXT_PUBLIC_TRUSTMESH_REGISTRY_ID);