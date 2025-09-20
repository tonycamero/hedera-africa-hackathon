import { type SignalMetadata, type SignalDefinition, SIGNAL_DEFINITIONS, type SignalCategory } from "@/lib/types/SignalTypes"
import { HederaClient } from "@/packages/hedera/HederaClient"

export class SignalEngine {
  private hederaClient: HederaClient
  private userSignals: Map<string, SignalMetadata[]> = new Map()

  constructor() {
    this.hederaClient = new HederaClient()
  }

  // Issue a signal to a user
  async issueSignal(signalId: string, issuer: string, recipient: string, notes?: string): Promise<SignalMetadata> {
    const signalDefinition = SIGNAL_DEFINITIONS.find((s) => s.id === signalId)
    if (!signalDefinition) {
      throw new Error(`Signal definition not found: ${signalId}`)
    }

    const signal: SignalMetadata = {
      name: signalDefinition.name,
      type: "signal",
      category: signalDefinition.category,
      issuer,
      recipient,
      timestamp: new Date().toISOString(),
      status: "active",
      encrypted_notes: notes,
      description: signalDefinition.description,
    }

    // Log to HCS for immutable record
    await this.hederaClient.submitMessage("signal-issuance", {
      type: "signal_issued",
      signal_id: signalId,
      issuer,
      recipient,
      timestamp: signal.timestamp,
    })

    // Store locally (in production, this would be in a database)
    const userSignalList = this.userSignals.get(recipient) || []
    userSignalList.push(signal)
    this.userSignals.set(recipient, userSignalList)

    return signal
  }

  // Revoke a signal
  async revokeSignal(recipient: string, signalName: string, issuer: string, reason?: string): Promise<void> {
    const userSignals = this.userSignals.get(recipient) || []
    const signal = userSignals.find((s) => s.name === signalName && s.issuer === issuer)

    if (!signal) {
      throw new Error("Signal not found")
    }

    signal.status = "revoked"
    signal.revocation_reason = reason

    // Log revocation to HCS
    await this.hederaClient.submitMessage("signal-revocation", {
      type: "signal_revoked",
      signal_name: signalName,
      issuer,
      recipient,
      reason,
      timestamp: new Date().toISOString(),
    })
  }

  // Get user's signals
  getUserSignals(userId: string): SignalMetadata[] {
    return this.userSignals.get(userId) || []
  }

  // Get signals by category
  getSignalsByCategory(userId: string, category: SignalCategory): SignalMetadata[] {
    const userSignals = this.getUserSignals(userId)
    return userSignals.filter((signal) => signal.category === category && signal.status === "active")
  }

  // Get signal definitions for display
  getSignalDefinitions(): SignalDefinition[] {
    return SIGNAL_DEFINITIONS
  }

  // Calculate signal score (for trust scoring integration)
  calculateSignalScore(userId: string): number {
    const signals = this.getUserSignals(userId).filter((s) => s.status === "active")
    
    // Simple scoring: 1 point per signal, with category weights
    return signals.reduce((score, signal) => {
      const categoryWeight = {
        institutional: 3,
        professional: 2,
        academic: 2,
        "peer-to-peer": 1.5,
        experimental: 1
      }[signal.category] || 1

      return score + categoryWeight
    }, 0)
  }
}