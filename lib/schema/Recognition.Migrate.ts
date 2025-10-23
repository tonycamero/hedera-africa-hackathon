import type { RecognitionEnvelopeV1, LensType } from './RecognitionEnvelope.V1';
export function migrateToV1(input:any, lens:LensType): RecognitionEnvelopeV1 {
  const base = {
    schema:'tm.recognition' as const, version:1 as const, lens,
    id: input.id ?? input.txId ?? String(Date.now()),
    timestamp: input.timestamp ?? new Date().toISOString(),
    issuer: input.issuer ?? { wallet: input.from ?? 'unknown' },
    subject: input.subject ?? { wallet: input.to ?? 'unknown' },
    tx: input.tx ?? { hcsSeq: input.hcsSeq, topic: input.topic, mirrorTxId: input.mirrorTxId },
    features: { nfts: lens!=='professional', civic: lens==='civic', enterprise: lens==='professional' }
  };
  if(lens==='genz'){
    return { ...base, payload: { type:'hashinal', tokenId: input.tokenId ?? input.htsId ?? '', cardSlug: input.cardSlug ?? input.signalSlug ?? 'unknown', mediaUrl: input.mediaUrl, xp: input.xp ?? input.points ?? 0, boost: input.boostKind ? { kind: input.boostKind, amount: input.boostAmount ?? 0 } : undefined } };
  }
  if(lens==='civic'){
    return { ...base, payload: { type:'civic', action: input.action ?? input.type ?? 'SUPPORT_SAVED', campaignId: input.campaignId ?? 'default', data:{ eventId: input.eventId, ward: input.ward }, xp: input.xp ?? 0, nftCardRef: input.cardSlug ? { tokenId: input.tokenId, cardSlug: input.cardSlug } : undefined } };
  }
  return { ...base, payload: { type:'pro', badge: input.badge ?? 'DELIVERY', note: input.note, rbac: input.rbac } };
}
