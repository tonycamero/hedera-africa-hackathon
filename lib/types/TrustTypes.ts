export type TrustTokenType = "contact" | "recognition" | "circle"
export type IssuerClass = "peer" | "institutional" | "system"
export type CircleTokenStatus = "pending" | "active" | "revoked"

export interface TrustToken {
  id: string
  type: TrustTokenType
  issuer: string
  recipient: string
  weight: number
  issuedAt: Date
  expiresAt?: Date
  isActive: boolean
  metadata?: {
    reason?: string
    context?: string
    campaignId?: string
  }
}

export interface CircleToken extends TrustToken {
  type: "circle"
  status: CircleTokenStatus
  acceptedAt?: Date
  mutualTokenId?: string // ID of the reciprocal circle token
}

export interface TrustRelationship {
  id: string
  userA: string
  userB: string
  tokens: TrustToken[]
  mutualCircleTokens: boolean
  trustScore: number
  lastUpdated: Date
  createdAt: Date
}

export interface TrustProfile {
  userId: string
  totalScore: number
  tokenCounts: {
    contact: { issued: number; received: number }
    recognition: { issued: number; received: number }
    circle: { issued: number; received: number }
  }
  relationships: string[] // relationship IDs
  circleUnlocked: boolean
  lastActivity: Date
  issuerClass: IssuerClass
}

export interface CircleInvitation {
  id: string
  from: string
  to: string
  message?: string
  createdAt: Date
  expiresAt: Date
  status: "pending" | "accepted" | "declined" | "expired"
  circleTokenId?: string
}

export interface CircleNetwork {
  userId: string
  activeCircles: string[] // User IDs with mutual circle tokens
  pendingOutbound: string[] // Users we've sent circle tokens to
  pendingInbound: string[] // Users who've sent us circle tokens
  availableSlots: number // Remaining circle token slots (out of 9)
  isUnlocked: boolean // Has 9 mutual circle connections
  networkScore: number // Total circle network value
}

export interface TrustScoreComponents {
  contactScore: number
  recognitionScore: number
  circleScore: number
  frequencyPenalty: number
  issuerModulation: number
  finalScore: number
}
