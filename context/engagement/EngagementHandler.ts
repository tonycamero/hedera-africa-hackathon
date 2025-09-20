import type { EngagementContext } from "../../lib/types/ScendContext"
import { contextEngine } from "../../lib/context-engine/ContextEngine"
import { hederaClient } from "../../packages/hedera/HederaClient"

export async function handleEngagementContext(context: EngagementContext): Promise<void> {
  console.log(`[EngagementHandler] Processing engagement context:`, context)

  const { campaignId, action, nftId, userId } = context.payload

  if (!hederaClient.isReady()) {
    await hederaClient.initialize()
  }

  try {
    switch (action) {
      case "join":
        await handleCampaignJoin(campaignId, userId)
        break

      case "complete":
        await handleCampaignComplete(campaignId, userId)
        break

      case "reward":
        await handleRewardIssuance(campaignId, userId)
        break

      default:
        console.warn(`[EngagementHandler] Unknown action: ${action}`)
    }
  } catch (error) {
    console.error(`[EngagementHandler] Error processing engagement:`, error)
  }
}

async function handleCampaignJoin(campaignId: string, userId?: string): Promise<void> {
  if (!userId) {
    console.error("[EngagementHandler] User ID required for campaign join")
    return
  }

  console.log(`[EngagementHandler] User ${userId} joining campaign ${campaignId}`)

  let campaign = hederaClient.getCampaign(campaignId)
  if (!campaign) {
    campaign = await hederaClient.createCampaign(`Campaign ${campaignId}`, "Auto-generated campaign from engagement")
  }

  await hederaClient.joinCampaign(campaignId, userId)

  const chatContext = {
    type: "chat" as const,
    payload: {
      threadId: `wallet:${userId}`,
      action: "notify" as const,
      message: `You've joined campaign: ${campaign.name}`,
      userId,
    },
    timestamp: Date.now(),
    source: "engagement-loop",
  }

  await contextEngine.processContext(chatContext)
}

async function handleCampaignComplete(campaignId: string, userId?: string): Promise<void> {
  if (!userId) {
    console.error("[EngagementHandler] User ID required for campaign completion")
    return
  }

  console.log(`[EngagementHandler] User ${userId} completed campaign ${campaignId}`)

  const campaign = hederaClient.getCampaign(campaignId)
  if (!campaign) {
    console.error(`[EngagementHandler] Campaign not found: ${campaignId}`)
    return
  }

  const nft = await hederaClient.mintHashinal(campaignId, userId, {
    name: `${campaign.name} Completion`,
    description: `Reward for completing ${campaign.name}`,
    attributes: {
      campaign: campaign.name,
      completedAt: new Date().toISOString(),
      type: "completion_reward",
    },
  })

  const chatContext = {
    type: "chat" as const,
    payload: {
      threadId: `wallet:${userId}`,
      action: "notify" as const,
      message: `Congratulations! You've earned a hashinal NFT for completing ${campaign.name}`,
      userId,
    },
    timestamp: Date.now(),
    source: "engagement-loop",
  }

  await contextEngine.processContext(chatContext)
}

async function handleRewardIssuance(campaignId: string, userId?: string): Promise<void> {
  if (!userId) {
    console.error("[EngagementHandler] User ID required for reward issuance")
    return
  }

  console.log(`[EngagementHandler] Issuing reward for campaign ${campaignId} to ${userId}`)

  const campaign = hederaClient.getCampaign(campaignId)
  if (!campaign) {
    console.error(`[EngagementHandler] Campaign not found: ${campaignId}`)
    return
  }

  const nft = await hederaClient.mintHashinal(campaignId, userId, {
    name: `${campaign.name} Participation`,
    description: `Reward for participating in ${campaign.name}`,
    attributes: {
      campaign: campaign.name,
      rewardedAt: new Date().toISOString(),
      type: "participation_reward",
    },
  })

  const chatContext = {
    type: "chat" as const,
    payload: {
      threadId: `wallet:${userId}`,
      action: "notify" as const,
      message: `You've earned a hashinal NFT reward! Token: ${nft.tokenId}:${nft.serialNumber}`,
      userId,
    },
    timestamp: Date.now(),
    source: "engagement-loop",
  }

  await contextEngine.processContext(chatContext)
}

contextEngine.registerHandler("engagement", handleEngagementContext)
