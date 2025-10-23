export type PersonaType = 'professional' | 'genz' | 'civic';
export interface PersonaConfig {
  type: PersonaType; name: string; tagline: string;
  features: { nftCollectibles:boolean; hashinals:boolean; civicEngagement:boolean; enterpriseRecognition:boolean; gamification:boolean; };
  theme: { name: 'metallic'|'mobile-first'|'glass-morphism'; primaryColor:string; secondaryColor:string; accentColor:string; };
  services: { recognition: 'professional'|'hashinal'|'civic'; telemetry:boolean; kns:boolean; };
  recognitionTokens: 'professional'|'genz-nft'|'civic-mixed';
  defaultSignals: string[];
}
