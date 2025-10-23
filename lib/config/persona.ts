import type { PersonaType, PersonaConfig } from './persona.types';
export const PERSONA_CONFIGS: Record<PersonaType, PersonaConfig> = {
  professional: { type:'professional', name:'TrustMesh Professional', tagline:'Enterprise Trust Networking',
    features:{ nftCollectibles:false, hashinals:false, civicEngagement:false, enterpriseRecognition:true, gamification:false },
    theme:{ name:'metallic', primaryColor:'#C0C0C0', secondaryColor:'#808080', accentColor:'#FFD700' },
    services:{ recognition:'professional', telemetry:false, kns:false },
    recognitionTokens:'professional', defaultSignals:['CONTACT_BOND_REQUEST_DIRECT','TRUST_ALLOCATE'] },
  genz: { type:'genz', name:'TrustMesh Campus', tagline:'Level Up Your Network',
    features:{ nftCollectibles:true, hashinals:true, civicEngagement:false, enterpriseRecognition:false, gamification:true },
    theme:{ name:'mobile-first', primaryColor:'#6366F1', secondaryColor:'#EC4899', accentColor:'#10B981' },
    services:{ recognition:'hashinal', telemetry:true, kns:true },
    recognitionTokens:'genz-nft', defaultSignals:['RECOGNITION_MINTED','NFT_COLLECTED','BOOST_RECEIVED'] },
  civic: { type:'civic', name:'TrustMesh Civic', tagline:'Power Your Campaign',
    features:{ nftCollectibles:true, hashinals:true, civicEngagement:true, enterpriseRecognition:false, gamification:true },
    theme:{ name:'glass-morphism', primaryColor:'#3B82F6', secondaryColor:'#8B5CF6', accentColor:'#F59E0B' },
    services:{ recognition:'civic', telemetry:true, kns:true },
    recognitionTokens:'civic-mixed', defaultSignals:['SUPPORT_SAVED','VOLUNTEER_SAVED','EVENT_RSVP'] }
};
let current: PersonaConfig | null = null;
export function getPersona(): PersonaConfig {
  if (!current) {
    const p = (process.env.NEXT_PUBLIC_TRUSTMESH_PERSONA || 'civic') as PersonaType;
    current = PERSONA_CONFIGS[p];
    if (typeof window !== 'undefined') console.log(`[Persona] Loaded: ${current.name}`);
  }
  return current;
}
export const isFeatureEnabled = (k: keyof PersonaConfig['features']) => getPersona().features[k];
export const getTheme = () => getPersona().theme;
export function getServiceMode<T extends keyof PersonaConfig['services']>(s: T){ return getPersona().services[s]; }
