export type LensType = 'genz'|'civic'|'professional';
export interface RecognitionEnvelopeV1 {
  schema:'tm.recognition'; version:1; lens:LensType;
  id:string; timestamp:string;
  issuer:{wallet:string; name?:string}; subject:{wallet:string; name?:string};
  tx?:{hcsSeq?:number; topic?:string; mirrorTxId?:string};
  features?:{nfts?:boolean;civic?:boolean;enterprise?:boolean};
  payload: GenZPayload | CivicPayload | ProPayload;
}
export interface GenZPayload { type:'hashinal'; tokenId:string; cardSlug:string; mediaUrl?:string; xp?:number; boost?:{kind:'social'|'mentor'|'impact'; amount:number}; }
export interface CivicPayload { type:'civic'; action:'SUPPORT_SAVED'|'VOLUNTEER_SAVED'|'EVENT_RSVP'; campaignId:string; data?:{eventId?:string; ward?:string}; xp?:number; nftCardRef?:{tokenId?:string; cardSlug?:string}; }
export interface ProPayload { type:'pro'; badge:'RELIABILITY'|'MENTORSHIP'|'DELIVERY'|'LEADERSHIP'; note?:string; rbac?:{role?:'admin'|'manager'|'member'; scope?:string}; }
