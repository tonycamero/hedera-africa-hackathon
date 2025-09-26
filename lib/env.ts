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

// Clean other environment variables  
export const MIRROR_REST = clean(process.env.NEXT_PUBLIC_MIRROR_NODE_URL) || "https://testnet.mirrornode.hedera.com/api/v1";
export const MIRROR_WS = clean(process.env.NEXT_PUBLIC_MIRROR_NODE_WS) || "wss://testnet.mirrornode.hedera.com:5600";
export const HCS_ENABLED = cleanBool(process.env.NEXT_PUBLIC_HCS_ENABLED);
export const DEMO_SEED = cleanBool(process.env.NEXT_PUBLIC_DEMO_SEED);
export const DEMO_MODE = cleanBool(process.env.NEXT_PUBLIC_DEMO_MODE);

// Session ID (cleaned)
export const SESSION_ID = clean(process.env.NEXT_PUBLIC_SESSION_ID) || "tm-alex-chen";

// Hedera client configuration
export const HEDERA_NETWORK = clean(process.env.NEXT_PUBLIC_HEDERA_NETWORK) || 'testnet';
export const HEDERA_OPERATOR_ID = clean(process.env.HEDERA_OPERATOR_ID);
export const HEDERA_OPERATOR_KEY = clean(process.env.HEDERA_OPERATOR_KEY);

// Registry configuration
export const REGISTRY_ID = clean(process.env.NEXT_PUBLIC_TRUSTMESH_REGISTRY_ID);