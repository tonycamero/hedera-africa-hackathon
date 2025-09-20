import type {
  TrustToken,
  TrustRelationship,
  TrustProfile,
  TrustTokenType,
  TrustScoreComponents,
  CircleToken,
  CircleInvitation,
  CircleNetwork,
  CircleTokenStatus,
} from "../../lib/types/TrustTypes"
import { hcsLogger } from "../hedera/HCSLogger"

export class TrustEngine {
  private tokens: Map<string, TrustToken> = new Map()
  private relationships: Map<string, TrustRelationship> = new Map()
  private profiles: Map<string, TrustProfile> = new Map()
  private circleInvitations: Map<string, CircleInvitation> = new Map()
  private circleNetworks: Map<string, CircleNetwork> = new Map()

  // Token weight configurations
  private readonly TOKEN_WEIGHTS = {
    contact: 1,
    recognition: 5,
    circle: 25,
  }

  // Issuer class modulation factors
  private readonly ISSUER_MODULATION = {
    peer: 1.0,
    institutional: 1.5,
    system: 0.8,
  }

  // Circle token constraints
  private readonly CIRCLE_TOKEN_LIMIT = 9

  async issueToken(
    type: TrustTokenType,
    issuer: string,
    recipient: string,
    reason?: string,
    context?: string,
  ): Promise<TrustToken> {
    if (type === "circle") {
      return await this.issueCircleToken(issuer, recipient, reason, context)
    }

    const tokenId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const token: TrustToken = {
      id: tokenId,
      type,
      issuer,
      recipient,
      weight: this.TOKEN_WEIGHTS[type],
      issuedAt: new Date(),
      isActive: true,
      metadata: { reason, context },
    }

    // Add frequency penalty for recognition tokens
    if (type === "recognition") {
      const recentTokens = this.getRecentTokens(issuer, recipient, "recognition", 24 * 60 * 60 * 1000) // 24 hours
      if (recentTokens.length > 0) {
        token.weight = Math.max(1, token.weight - recentTokens.length)
        console.log(`[TrustEngine] Applied frequency penalty: ${recentTokens.length} recent tokens`)
      }
    }

    this.tokens.set(tokenId, token)

    await hcsLogger.logTrustTokenIssued(type, issuer, recipient, tokenId, token.weight, reason)

    // Update profiles
    await this.updateProfile(issuer, token, "issued")
    await this.updateProfile(recipient, token, "received")

    // Update or create relationship
    await this.updateRelationship(issuer, recipient)

    console.log(`[TrustEngine] Issued ${type} token: ${issuer} → ${recipient} (weight: ${token.weight})`)
    return token
  }

  private async issueCircleToken(
    issuer: string,
    recipient: string,
    reason?: string,
    context?: string,
  ): Promise<CircleToken> {
    const issuerNetwork = await this.getOrCreateCircleNetwork(issuer)

    // Validate 9-token limit
    if (issuerNetwork.availableSlots <= 0) {
      throw new Error(
        `Circle token limit exceeded. You have used all 9 circle token slots. Revoke existing tokens to issue new ones.`,
      )
    }

    // Check if already has relationship
    if (issuerNetwork.activeCircles.includes(recipient) || issuerNetwork.pendingOutbound.includes(recipient)) {
      throw new Error(`Circle relationship already exists or is pending with ${recipient}`)
    }

    const tokenId = `circle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Check for reciprocal circle token
    const reciprocalToken = this.findPendingCircleToken(recipient, issuer)
    const status: CircleTokenStatus = reciprocalToken ? "active" : "pending"

    const circleToken: CircleToken = {
      id: tokenId,
      type: "circle",
      issuer,
      recipient,
      weight: status === "active" ? this.TOKEN_WEIGHTS.circle : 0, // Only active tokens have weight
      issuedAt: new Date(),
      isActive: status === "active",
      status,
      mutualTokenId: reciprocalToken?.id,
      metadata: { reason, context },
    }

    if (reciprocalToken) {
      // Activate both tokens
      circleToken.acceptedAt = new Date()
      reciprocalToken.status = "active"
      reciprocalToken.isActive = true
      reciprocalToken.weight = this.TOKEN_WEIGHTS.circle
      reciprocalToken.acceptedAt = new Date()
      reciprocalToken.mutualTokenId = tokenId

      await hcsLogger.logCircleTokenActivated(issuer, recipient, tokenId, reciprocalToken.id)

      console.log(`[TrustEngine] Mutual circle tokens activated: ${issuer} ↔ ${recipient}`)
    } else {
      await hcsLogger.logCircleTokenIssued(issuer, recipient, tokenId, status)
    }

    this.tokens.set(tokenId, circleToken)

    // Update circle networks
    await this.updateCircleNetwork(issuer)
    await this.updateCircleNetwork(recipient)

    // Update profiles
    await this.updateProfile(issuer, circleToken, "issued")
    await this.updateProfile(recipient, circleToken, "received")

    // Update relationship
    await this.updateRelationship(issuer, recipient)

    console.log(`[TrustEngine] Issued circle token: ${issuer} → ${recipient} (status: ${status})`)
    return circleToken
  }

  async revokeToken(tokenId: string, reason?: string): Promise<void> {
    const token = this.tokens.get(tokenId)
    if (!token) {
      throw new Error(`Token not found: ${tokenId}`)
    }

    token.isActive = false
    token.metadata = { ...token.metadata, revokedReason: reason }

    await hcsLogger.logTrustTokenRevoked(token.type, token.issuer, token.recipient, tokenId, reason)

    // Update profiles
    await this.updateProfile(token.issuer, token, "revoked_issued")
    await this.updateProfile(token.recipient, token, "revoked_received")

    // Recalculate relationship
    await this.updateRelationship(token.issuer, token.recipient)

    console.log(`[TrustEngine] Revoked token: ${tokenId} - ${reason}`)
  }

  async revokeCircleToken(tokenId: string, reason?: string): Promise<void> {
    const token = this.tokens.get(tokenId) as CircleToken
    if (!token || token.type !== "circle") {
      throw new Error(`Circle token not found: ${tokenId}`)
    }

    if (token.status === "revoked") {
      throw new Error(`Circle token already revoked: ${tokenId}`)
    }

    // Revoke the token
    token.status = "revoked"
    token.isActive = false
    token.weight = 0
    token.metadata = { ...token.metadata, revokedReason: reason }

    await hcsLogger.logCircleTokenRevoked(token.issuer, token.recipient, tokenId, reason)

    // If there's a mutual token, handle it
    if (token.mutualTokenId) {
      const mutualToken = this.tokens.get(token.mutualTokenId) as CircleToken
      if (mutualToken && mutualToken.status === "active") {
        // Mutual token becomes pending again
        mutualToken.status = "pending"
        mutualToken.isActive = false
        mutualToken.weight = 0
        mutualToken.acceptedAt = undefined
        mutualToken.mutualTokenId = undefined

        console.log(`[TrustEngine] Mutual circle token reverted to pending: ${mutualToken.id}`)
      }
    }

    // Update circle networks
    await this.updateCircleNetwork(token.issuer)
    await this.updateCircleNetwork(token.recipient)

    // Update profiles
    await this.updateProfile(token.issuer, token, "revoked_issued")
    await this.updateProfile(token.recipient, token, "revoked_received")

    // Update relationship
    await this.updateRelationship(token.issuer, token.recipient)

    console.log(`[TrustEngine] Revoked circle token: ${tokenId} - ${reason}`)
  }

  async createCircleInvitation(from: string, to: string, message?: string): Promise<CircleInvitation> {
    const invitationId = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const invitation: CircleInvitation = {
      id: invitationId,
      from,
      to,
      message,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: "pending",
    }

    this.circleInvitations.set(invitationId, invitation)

    await hcsLogger.logCircleInvitationSent(from, to, invitationId, message)

    console.log(`[TrustEngine] Created circle invitation: ${from} → ${to}`)

    return invitation
  }

  async acceptCircleInvitation(invitationId: string): Promise<void> {
    const invitation = this.circleInvitations.get(invitationId)
    if (!invitation) {
      throw new Error(`Circle invitation not found: ${invitationId}`)
    }

    if (invitation.status !== "pending") {
      throw new Error(`Circle invitation is not pending: ${invitation.status}`)
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = "expired"
      throw new Error("Circle invitation has expired")
    }

    await hcsLogger.logCircleInvitationAccepted(invitation.from, invitation.to, invitationId)

    // Issue circle tokens in both directions
    const tokenA = await this.issueCircleToken(invitation.from, invitation.to, "Circle invitation accepted")
    const tokenB = await this.issueCircleToken(invitation.to, invitation.from, "Circle invitation accepted")

    invitation.status = "accepted"
    invitation.circleTokenId = tokenA.id

    console.log(`[TrustEngine] Circle invitation accepted: ${invitation.from} ↔ ${invitation.to}`)
  }

  private async updateRelationship(userA: string, userB: string): Promise<void> {
    const relationshipId = this.getRelationshipId(userA, userB)
    let relationship = this.relationships.get(relationshipId)

    if (!relationship) {
      relationship = {
        id: relationshipId,
        userA,
        userB,
        tokens: [],
        mutualCircleTokens: false,
        trustScore: 0,
        lastUpdated: new Date(),
        createdAt: new Date(),
      }
      this.relationships.set(relationshipId, relationship)
    }

    // Update tokens in relationship
    relationship.tokens = Array.from(this.tokens.values()).filter(
      (t) => (t.issuer === userA && t.recipient === userB) || (t.issuer === userB && t.recipient === userA),
    )

    // Check for mutual circle tokens
    const circleTokensAtoB = relationship.tokens.filter(
      (t) => t.type === "circle" && t.issuer === userA && t.recipient === userB && t.isActive,
    )
    const circleTokensBtoA = relationship.tokens.filter(
      (t) => t.type === "circle" && t.issuer === userB && t.recipient === userA && t.isActive,
    )

    relationship.mutualCircleTokens = circleTokensAtoB.length > 0 && circleTokensBtoA.length > 0

    // Calculate trust score
    const oldScore = relationship.trustScore
    const scoreComponents = await this.calculateTrustScore(userA, userB)
    relationship.trustScore = scoreComponents.finalScore
    relationship.lastUpdated = new Date()

    if (Math.abs(oldScore - relationship.trustScore) >= 1) {
      await hcsLogger.logTrustScoreUpdated(userA, userB, oldScore, relationship.trustScore, {
        contactScore: scoreComponents.contactScore,
        recognitionScore: scoreComponents.recognitionScore,
        circleScore: scoreComponents.circleScore,
        frequencyPenalty: scoreComponents.frequencyPenalty,
        issuerModulation: scoreComponents.issuerModulation,
      })
    }

    console.log(`[TrustEngine] Updated relationship ${userA} ↔ ${userB}: score=${relationship.trustScore}`)
  }

  private findPendingCircleToken(issuer: string, recipient: string): CircleToken | null {
    for (const token of this.tokens.values()) {
      if (
        token.type === "circle" &&
        token.issuer === issuer &&
        token.recipient === recipient &&
        (token as CircleToken).status === "pending"
      ) {
        return token as CircleToken
      }
    }
    return null
  }

  async getOrCreateCircleNetwork(userId: string): Promise<CircleNetwork> {
    let network = this.circleNetworks.get(userId)

    if (!network) {
      network = {
        userId,
        activeCircles: [],
        pendingOutbound: [],
        pendingInbound: [],
        availableSlots: this.CIRCLE_TOKEN_LIMIT,
        isUnlocked: false,
        networkScore: 0,
      }
      this.circleNetworks.set(userId, network)
    }

    return network
  }

  private async updateCircleNetwork(userId: string): Promise<void> {
    const network = await this.getOrCreateCircleNetwork(userId)
    const userTokens = Array.from(this.tokens.values()).filter(
      (t) => t.type === "circle" && (t.issuer === userId || t.recipient === userId),
    ) as CircleToken[]

    // Reset network state
    network.activeCircles = []
    network.pendingOutbound = []
    network.pendingInbound = []

    // Categorize circle relationships
    for (const token of userTokens) {
      if (token.status === "revoked") continue

      const otherUser = token.issuer === userId ? token.recipient : token.issuer
      const isOutbound = token.issuer === userId

      if (token.status === "active") {
        if (!network.activeCircles.includes(otherUser)) {
          network.activeCircles.push(otherUser)
        }
      } else if (token.status === "pending") {
        if (isOutbound) {
          network.pendingOutbound.push(otherUser)
        } else {
          network.pendingInbound.push(otherUser)
        }
      }
    }

    // Calculate available slots (based on outbound tokens only)
    const outboundTokens = userTokens.filter((t) => t.issuer === userId && t.status !== "revoked")
    network.availableSlots = this.CIRCLE_TOKEN_LIMIT - outboundTokens.length

    // Check unlock status
    network.isUnlocked = network.activeCircles.length >= this.CIRCLE_TOKEN_LIMIT

    // Calculate network score
    network.networkScore = network.activeCircles.length * this.TOKEN_WEIGHTS.circle

    console.log(
      `[TrustEngine] Updated circle network for ${userId}: ${network.activeCircles.length} active, ${network.pendingOutbound.length} pending out, ${network.pendingInbound.length} pending in`,
    )
  }

  async calculateTrustScore(userA: string, userB: string): Promise<TrustScoreComponents> {
    const relationshipId = this.getRelationshipId(userA, userB)
    const relationship = this.relationships.get(relationshipId)

    if (!relationship) {
      return {
        contactScore: 0,
        recognitionScore: 0,
        circleScore: 0,
        frequencyPenalty: 0,
        issuerModulation: 0,
        finalScore: 0,
      }
    }

    const activeTokens = relationship.tokens.filter((t) => t.isActive)

    // Calculate base scores by token type
    const contactScore = activeTokens.filter((t) => t.type === "contact").reduce((sum, t) => sum + t.weight, 0)

    const recognitionScore = activeTokens.filter((t) => t.type === "recognition").reduce((sum, t) => sum + t.weight, 0)

    const circleScore = activeTokens.filter((t) => t.type === "circle").reduce((sum, t) => sum + t.weight, 0)

    // Calculate frequency penalty
    const recentRecognitionTokens = activeTokens.filter(
      (t) => t.type === "recognition" && Date.now() - t.issuedAt.getTime() < 24 * 60 * 60 * 1000,
    )
    const frequencyPenalty = Math.max(0, recentRecognitionTokens.length - 1) * 2

    // Calculate issuer modulation
    const profileA = await this.getOrCreateProfile(userA)
    const profileB = await this.getOrCreateProfile(userB)
    const avgModulation =
      (this.ISSUER_MODULATION[profileA.issuerClass] + this.ISSUER_MODULATION[profileB.issuerClass]) / 2

    const baseScore = contactScore + recognitionScore + circleScore
    const issuerModulation = baseScore * (avgModulation - 1)
    const finalScore = Math.max(0, baseScore + issuerModulation - frequencyPenalty)

    return {
      contactScore,
      recognitionScore,
      circleScore,
      frequencyPenalty,
      issuerModulation,
      finalScore,
    }
  }

  async getOrCreateProfile(userId: string): Promise<TrustProfile> {
    let profile = this.profiles.get(userId)

    if (!profile) {
      profile = {
        userId,
        totalScore: 0,
        tokenCounts: {
          contact: { issued: 0, received: 0 },
          recognition: { issued: 0, received: 0 },
          circle: { issued: 0, received: 0 },
        },
        relationships: [],
        circleUnlocked: false,
        lastActivity: new Date(),
        issuerClass: "peer",
      }
      this.profiles.set(userId, profile)
    }

    return profile
  }

  private async updateProfile(userId: string, token: TrustToken, action: string): Promise<void> {
    const profile = await this.getOrCreateProfile(userId)

    const isIssued = action.includes("issued")
    const isRevoked = action.includes("revoked")
    const direction = isIssued ? "issued" : "received"

    if (isRevoked) {
      profile.tokenCounts[token.type][direction] = Math.max(0, profile.tokenCounts[token.type][direction] - 1)
    } else {
      profile.tokenCounts[token.type][direction]++
    }

    // Check circle unlock condition (9 mutual circle connections)
    if (token.type === "circle" && !isRevoked) {
      const mutualCircleCount = Array.from(this.relationships.values()).filter(
        (r) => (r.userA === userId || r.userB === userId) && r.mutualCircleTokens,
      ).length

      profile.circleUnlocked = mutualCircleCount >= this.CIRCLE_TOKEN_LIMIT
    }

    profile.lastActivity = new Date()

    // Recalculate total score
    await this.recalculateProfileScore(userId)
  }

  private async recalculateProfileScore(userId: string): Promise<void> {
    const profile = await this.getOrCreateProfile(userId)
    const userRelationships = Array.from(this.relationships.values()).filter(
      (r) => r.userA === userId || r.userB === userId,
    )

    profile.totalScore = userRelationships.reduce((sum, r) => sum + r.trustScore, 0)
  }

  private getRelationshipId(userA: string, userB: string): string {
    return [userA, userB].sort().join(":")
  }

  private getRecentTokens(issuer: string, recipient: string, type: TrustTokenType, timeWindow: number): TrustToken[] {
    const cutoff = Date.now() - timeWindow
    return Array.from(this.tokens.values()).filter(
      (t) =>
        t.issuer === issuer &&
        t.recipient === recipient &&
        t.type === type &&
        t.isActive &&
        t.issuedAt.getTime() > cutoff,
    )
  }

  // Public getters
  getProfile(userId: string): TrustProfile | null {
    return this.profiles.get(userId) || null
  }

  getRelationship(userA: string, userB: string): TrustRelationship | null {
    const relationshipId = this.getRelationshipId(userA, userB)
    return this.relationships.get(relationshipId) || null
  }

  getUserTokens(userId: string): TrustToken[] {
    return Array.from(this.tokens.values()).filter((t) => (t.issuer === userId || t.recipient === userId) && t.isActive)
  }

  getAllProfiles(): TrustProfile[] {
    return Array.from(this.profiles.values())
  }

  getAllRelationships(): TrustRelationship[] {
    return Array.from(this.relationships.values())
  }

  getCircleNetwork(userId: string): CircleNetwork | null {
    return this.circleNetworks.get(userId) || null
  }

  getCircleInvitations(userId: string): CircleInvitation[] {
    return Array.from(this.circleInvitations.values()).filter(
      (inv) => (inv.from === userId || inv.to === userId) && inv.status === "pending",
    )
  }

  getCircleTokens(userId: string): CircleToken[] {
    return Array.from(this.tokens.values()).filter(
      (t) => t.type === "circle" && (t.issuer === userId || t.recipient === userId),
    ) as CircleToken[]
  }
}

export const trustEngine = new TrustEngine()
