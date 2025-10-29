export type SpendRequest = {
  accountId: string            // Hedera account
  amountTrst: number           // e.g., 1.0
  reason: 'lens_unlock' | 'mint' | 'other'
  metadata?: Record<string, unknown>
}

/**
 * SettlementPort - Adapter for TRST spending
 * 
 * Implementations can "lock", "burn", or transfer to fee sink.
 * For now: transfer to fee sink account configured in env.
 * 
 * TODO: Route to active provider (Brale/MatterFi/Hedera native)
 * when CraftTrust treasury integration is live
 */
export const settlementPort = {
  async spendTRST(req: SpendRequest) {
    const sink = process.env.TRST_FEE_SINK_ACCOUNT_ID // e.g., 0.0.xxxx
    
    if (!sink) {
      console.warn('[SettlementPort] TRST_FEE_SINK_ACCOUNT_ID not configured, using mock')
    }

    // TODO: Route to active provider (Brale/MatterFi/Hedera native)
    // return providers.active.transferTRST(req.accountId, sink, req.amountTrst, req.metadata)
    
    // Mock for now - return mock transaction
    const mockTxId = `trst-spend-${Date.now()}-${req.accountId.slice(-6)}`
    
    console.log('[SettlementPort] Mock TRST spend:', {
      from: req.accountId,
      to: sink || 'mock-treasury',
      amount: req.amountTrst,
      reason: req.reason,
      txId: mockTxId
    })

    return { 
      txId: mockTxId, 
      amount: req.amountTrst, 
      sink: sink || 'mock-treasury' 
    }
  }
}
