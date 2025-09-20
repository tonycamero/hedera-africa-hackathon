export type TrustEventType =
  | "trust_token_issued"
  | "trust_token_revoked"
  | "circle_token_issued"
  | "circle_token_activated"
  | "circle_token_revoked"
  | "circle_invitation_sent"
  | "circle_invitation_accepted"
  | "payment_sent"
  | "payment_received"
  | "nft_minted"
  | "nft_revoked"
  | "campaign_created"
  | "campaign_joined"
  | "message_sent"
  | "trust_score_updated"

export interface TrustEvent {
  id: string
  type: TrustEventType
  timestamp: string
  actor: string
  target?: string
  data: Record<string, any>
  signature?: string
  topicId: string
  sequenceNumber?: number
}

export interface HCSMessage {
  id: string
  topicId: string
  message: string
  timestamp: Date
  sequenceNumber: number
  consensusTimestamp?: string
  runningHash?: string
}

export interface TrustAuditLog {
  userId: string
  events: TrustEvent[]
  totalEvents: number
  firstEvent?: Date
  lastEvent?: Date
  eventTypes: Record<TrustEventType, number>
}
