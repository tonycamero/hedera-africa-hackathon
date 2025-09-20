import { type BadgeMetadata, type BadgeDefinition, BADGE_DEFINITIONS, type BadgeCategory } from "@/lib/types/BadgeTypes"
import { HederaClient } from "@/packages/hedera/HederaClient"

export class BadgeEngine {
  private hederaClient: HederaClient
  private userBadges: Map<string, BadgeMetadata[]> = new Map()

  constructor() {
    this.hederaClient = new HederaClient()
  }

  // Issue a badge to a user
  async issueBadge(badgeId: string, issuer: string, recipient: string, notes?: string): Promise<BadgeMetadata> {
    const badgeDefinition = BADGE_DEFINITIONS.find((b) => b.id === badgeId)
    if (!badgeDefinition) {
      throw new Error(`Badge definition not found: ${badgeId}`)
    }

    const badge: BadgeMetadata = {
      name: badgeDefinition.name,
      type: "badge",
      category: badgeDefinition.category,
      issuer,
      recipient,
      timestamp: new Date().toISOString(),
      status: "active",
      encrypted_notes: notes,
      description: badgeDefinition.description,
      rarity: badgeDefinition.rarity,
    }

    // Log to HCS for immutable record
    await this.hederaClient.submitMessage("badge-issuance", {
      type: "badge_issued",
      badge_id: badgeId,
      issuer,
      recipient,
      timestamp: badge.timestamp,
    })

    // Store locally (in production, this would be in a database)
    const userBadgeList = this.userBadges.get(recipient) || []
    userBadgeList.push(badge)
    this.userBadges.set(recipient, userBadgeList)

    return badge
  }

  // Revoke a badge
  async revokeBadge(recipient: string, badgeName: string, issuer: string, reason?: string): Promise<void> {
    const userBadges = this.userBadges.get(recipient) || []
    const badge = userBadges.find((b) => b.name === badgeName && b.issuer === issuer)

    if (!badge) {
      throw new Error("Badge not found")
    }

    badge.status = "revoked"
    badge.revocation_reason = reason

    // Log revocation to HCS
    await this.hederaClient.submitMessage("badge-revocation", {
      type: "badge_revoked",
      badge_name: badgeName,
      issuer,
      recipient,
      reason,
      timestamp: new Date().toISOString(),
    })
  }

  // Get user's badges
  getUserBadges(userId: string): BadgeMetadata[] {
    return this.userBadges.get(userId) || []
  }

  // Get badges by category
  getBadgesByCategory(userId: string, category: BadgeCategory): BadgeMetadata[] {
    const userBadges = this.getUserBadges(userId)
    return userBadges.filter((badge) => badge.category === category && badge.status === "active")
  }

  // Get badge definitions for display
  getBadgeDefinitions(): BadgeDefinition[] {
    return BADGE_DEFINITIONS
  }

  // Calculate badge score (for trust scoring integration)
  calculateBadgeScore(userId: string): number {
    const badges = this.getUserBadges(userId).filter((b) => b.status === "active")

    return badges.reduce((score, badge) => {
      const multiplier = badge.rarity === "legendary" ? 10 : badge.rarity === "rare" ? 5 : 1
      return score + multiplier
    }, 0)
  }
}
