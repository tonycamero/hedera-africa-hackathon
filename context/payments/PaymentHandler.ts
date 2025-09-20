import type { PaymentContext } from "../../lib/types/ScendContext"
import { contextEngine } from "../../lib/context-engine/ContextEngine"
import { matterFiClient } from "../../packages/matterfi/MatterFiClient"
import { braleClient } from "../../packages/brale/BraleClient"

export async function handlePaymentContext(context: PaymentContext): Promise<void> {
  console.log(`[PaymentHandler] Processing payment context:`, context)

  const { to, amount, reason, campaignId, from } = context.payload

  if (!matterFiClient.isReady()) {
    await matterFiClient.initialize()
  }

  if (!braleClient.isReady()) {
    await braleClient.initialize()
  }

  try {
    const fromWallet = from
      ? matterFiClient.getWalletByUserId(from) || (await matterFiClient.provisionWallet(from))
      : null

    const toWallet = matterFiClient.getWalletByUserId(to) || (await matterFiClient.provisionWallet(to))

    if (!fromWallet && from) {
      console.error(`[PaymentHandler] Could not provision sender wallet for: ${from}`)
      return
    }

    const transfer = await matterFiClient.transferTRST(
      fromWallet?.address || "system",
      toWallet.address,
      amount,
      reason,
      campaignId,
    )

    console.log(`[PaymentHandler] TRST transfer initiated:`, transfer)

    await braleClient.processTransfer(transfer)

    const notificationContext = {
      type: "chat" as const,
      payload: {
        threadId: `wallet:${toWallet.address}`,
        action: "notify" as const,
        message: `You received ${amount} TRST${reason ? ` for: ${reason}` : ""}`,
        userId: to,
      },
      timestamp: Date.now(),
      source: "payment-loop",
    }

    await contextEngine.processContext(notificationContext)

    if (campaignId) {
      console.log(`[PaymentHandler] Triggering engagement for campaign: ${campaignId}`)

      const engagementContext = {
        type: "engagement" as const,
        payload: {
          campaignId,
          action: "reward" as const,
          userId: to,
        },
        timestamp: Date.now(),
        source: "payment-loop",
      }

      await contextEngine.processContext(engagementContext)
    }
  } catch (error) {
    console.error(`[PaymentHandler] Payment failed:`, error)

    if (from) {
      const errorContext = {
        type: "chat" as const,
        payload: {
          threadId: `wallet:${from}`,
          action: "notify" as const,
          message: `Payment failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          userId: from,
        },
        timestamp: Date.now(),
        source: "payment-loop",
      }

      await contextEngine.processContext(errorContext)
    }
  }
}

contextEngine.registerHandler("payment", handlePaymentContext)
