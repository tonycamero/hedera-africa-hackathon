import type { TrustEvent, TrustEventType, HCSMessage, TrustAuditLog } from "../../lib/types/HCSTypes"
import { hederaClient } from "./HederaClient"

export class HCSLogger {
  private messages: Map<string, HCSMessage> = new Map()
  private events: Map<string, TrustEvent> = new Map()
  private auditLogs: Map<string, TrustAuditLog> = new Map()
  private globalTrustTopicId: string | null = null

  async initialize(): Promise<void> {
    console.log("[HCSLogger] Initializing trust event logging...")

    if (!hederaClient.isReady()) {
      await hederaClient.initialize()
    }

    // Create global trust topic for all trust events
    const globalTopic = await hederaClient.createHCS10Topic(
      "TrustMesh Global Trust Events",
      "Immutable log of all trust interactions in the TrustMesh network",
    )

    this.globalTrustTopicId = globalTopic.topicId
    console.log(`[HCSLogger] Global trust topic created: ${this.globalTrustTopicId}`)
  }

  async logTrustEvent(
    type: TrustEventType,
    actor: string,
    target?: string,
    data?: Record<string, any>,
  ): Promise<TrustEvent> {
    if (!this.globalTrustTopicId) {
      await this.initialize()
    }

    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const trustEvent: TrustEvent = {
      id: eventId,
      type,
      timestamp: new Date().toISOString(),
      actor,
      target,
      data: data || {},
      topicId: this.globalTrustTopicId!,
    }

    // Submit to HCS
    const message = JSON.stringify(trustEvent)
    await hederaClient.submitMessage(this.globalTrustTopicId!, message)

    // Store locally for querying
    this.events.set(eventId, trustEvent)

    // Update audit logs
    await this.updateAuditLog(actor, trustEvent)
    if (target && target !== actor) {
      await this.updateAuditLog(target, trustEvent)
    }

    console.log(`[HCSLogger] Trust event logged: ${type} by ${actor}${target ? ` → ${target}` : ""}`)
    return trustEvent
  }

  async logTrustTokenIssued(
    tokenType: string,
    issuer: string,
    recipient: string,
    tokenId: string,
    weight: number,
    reason?: string,
  ): Promise<void> {
    await this.logTrustEvent("trust_token_issued", issuer, recipient, {
      tokenType,
      tokenId,
      weight,
      reason,
    })
  }

  async logTrustTokenRevoked(
    tokenType: string,
    issuer: string,
    recipient: string,
    tokenId: string,
    reason?: string,
  ): Promise<void> {
    await this.logTrustEvent("trust_token_revoked", issuer, recipient, {
      tokenType,
      tokenId,
      reason,
    })
  }

  async logCircleTokenIssued(issuer: string, recipient: string, tokenId: string, status: string): Promise<void> {
    await this.logTrustEvent("circle_token_issued", issuer, recipient, {
      tokenId,
      status,
    })
  }

  async logCircleTokenActivated(userA: string, userB: string, tokenIdA: string, tokenIdB: string): Promise<void> {
    await this.logTrustEvent("circle_token_activated", userA, userB, {
      tokenIdA,
      tokenIdB,
      mutualActivation: true,
    })
  }

  async logCircleTokenRevoked(issuer: string, recipient: string, tokenId: string, reason?: string): Promise<void> {
    await this.logTrustEvent("circle_token_revoked", issuer, recipient, {
      tokenId,
      reason,
    })
  }

  async logCircleInvitationSent(from: string, to: string, invitationId: string, message?: string): Promise<void> {
    await this.logTrustEvent("circle_invitation_sent", from, to, {
      invitationId,
      message,
    })
  }

  async logCircleInvitationAccepted(from: string, to: string, invitationId: string): Promise<void> {
    await this.logTrustEvent("circle_invitation_accepted", to, from, {
      invitationId,
    })
  }

  async logPaymentSent(from: string, to: string, amount: number, reason: string, campaignId?: string): Promise<void> {
    await this.logTrustEvent("payment_sent", from, to, {
      amount,
      reason,
      campaignId,
      currency: "TRST",
    })
  }

  async logMessageSent(from: string, to: string, messageType: string, conversationId?: string): Promise<void> {
    await this.logTrustEvent("message_sent", from, to, {
      messageType,
      conversationId,
    })
  }

  async logTrustScoreUpdated(
    userA: string,
    userB: string,
    oldScore: number,
    newScore: number,
    components: Record<string, number>,
  ): Promise<void> {
    await this.logTrustEvent("trust_score_updated", userA, userB, {
      oldScore,
      newScore,
      components,
    })
  }

  private async updateAuditLog(userId: string, event: TrustEvent): Promise<void> {
    let auditLog = this.auditLogs.get(userId)

    if (!auditLog) {
      auditLog = {
        userId,
        events: [],
        totalEvents: 0,
        eventTypes: {} as Record<TrustEventType, number>,
      }
      this.auditLogs.set(userId, auditLog)
    }

    auditLog.events.push(event)
    auditLog.totalEvents++
    auditLog.lastEvent = new Date(event.timestamp)

    if (!auditLog.firstEvent) {
      auditLog.firstEvent = new Date(event.timestamp)
    }

    // Update event type counts
    auditLog.eventTypes[event.type] = (auditLog.eventTypes[event.type] || 0) + 1

    // Keep only last 100 events per user for memory management
    if (auditLog.events.length > 100) {
      auditLog.events = auditLog.events.slice(-100)
    }
  }

  async getAuditLog(userId: string): Promise<TrustAuditLog | null> {
    return this.auditLogs.get(userId) || null
  }

  async getUserEvents(userId: string, limit = 50): Promise<TrustEvent[]> {
    const auditLog = this.auditLogs.get(userId)
    if (!auditLog) return []

    return auditLog.events.slice(-limit).reverse()
  }

  async getEventsByType(eventType: TrustEventType, limit = 50): Promise<TrustEvent[]> {
    const allEvents = Array.from(this.events.values())
    return allEvents
      .filter((event) => event.type === eventType)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  async getEventsBetweenUsers(userA: string, userB: string, limit = 50): Promise<TrustEvent[]> {
    const allEvents = Array.from(this.events.values())
    return allEvents
      .filter(
        (event) =>
          (event.actor === userA && event.target === userB) || (event.actor === userB && event.target === userA),
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  async verifyEvent(eventId: string): Promise<boolean> {
    const event = this.events.get(eventId)
    if (!event) return false

    // TODO: Implement actual HCS verification
    // This would query the HCS topic and verify the event exists
    console.log(`[HCSLogger] Verifying event ${eventId} on topic ${event.topicId}`)
    return true
  }

  async getGlobalStats(): Promise<{
    totalEvents: number
    eventsByType: Record<TrustEventType, number>
    activeUsers: number
    topicId: string | null
  }> {
    const allEvents = Array.from(this.events.values())
    const eventsByType = {} as Record<TrustEventType, number>
    const activeUsers = new Set<string>()

    for (const event of allEvents) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1
      activeUsers.add(event.actor)
      if (event.target) activeUsers.add(event.target)
    }

    return {
      totalEvents: allEvents.length,
      eventsByType,
      activeUsers: activeUsers.size,
      topicId: this.globalTrustTopicId,
    }
  }

  getAllEvents(limit = 100): Promise<TrustEvent[]> {
    const allEvents = Array.from(this.events.values())
    return Promise.resolve(
      allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit),
    )
  }

  isReady(): boolean {
    return this.globalTrustTopicId !== null
  }
}

export const hcsLogger = new HCSLogger()
