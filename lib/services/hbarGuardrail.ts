/**
 * HBAR Auto-Top-Up Guardrail
 * 
 * Ensures sufficient HBAR balance before any transaction.
 * Auto-tops up if balance falls below threshold.
 */

const MIRROR_NODE_URL = process.env.NEXT_PUBLIC_HEDERA_NETWORK === 'mainnet'
  ? 'https://mainnet-public.mirrornode.hedera.com'
  : 'https://testnet.mirrornode.hedera.com'

const MIN_BALANCE_HBAR = 0.01 // Minimum balance required for transactions
const TOP_UP_AMOUNT = 10 // Amount to request when topping up

interface BalanceResponse {
  balance: {
    balance: number // in tinybars
  }
}

/**
 * Check HBAR balance via Mirror Node
 */
export async function checkHbarBalance(accountId: string): Promise<number> {
  try {
    const response = await fetch(`${MIRROR_NODE_URL}/api/v1/accounts/${accountId}`)
    
    if (!response.ok) {
      throw new Error(`Mirror Node API error: ${response.status}`)
    }
    
    const data: BalanceResponse = await response.json()
    const hbarBalance = data.balance.balance / 100_000_000 // Convert tinybars to HBAR
    
    console.log(`[HBAR Guardrail] Balance for ${accountId}: ${hbarBalance} HBAR`)
    return hbarBalance
  } catch (error) {
    console.error('[HBAR Guardrail] Failed to check balance:', error)
    throw error
  }
}

/**
 * Request HBAR top-up via funding endpoint
 */
async function requestTopUp(accountId: string): Promise<void> {
  try {
    console.log(`[HBAR Guardrail] Requesting top-up for ${accountId}`)
    
    const response = await fetch('/api/hedera/account/fund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Top-up request failed')
    }
    
    console.log(`[HBAR Guardrail] Top-up successful for ${accountId}`)
  } catch (error) {
    console.error('[HBAR Guardrail] Top-up failed:', error)
    throw error
  }
}

/**
 * Ensure account has sufficient HBAR, auto-top-up if needed
 * 
 * @throws Error if balance cannot be ensured
 */
export async function ensureHbar(
  accountId: string,
  minBalance: number = MIN_BALANCE_HBAR
): Promise<void> {
  // Check current balance
  let balance = await checkHbarBalance(accountId)
  
  if (balance >= minBalance) {
    console.log(`[HBAR Guardrail] Balance sufficient: ${balance} >= ${minBalance}`)
    return
  }
  
  console.log(`[HBAR Guardrail] Balance low: ${balance} < ${minBalance}, triggering auto-top-up`)
  
  // Request top-up
  await requestTopUp(accountId)
  
  // Wait for top-up to propagate (5 seconds)
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  // Re-check balance
  balance = await checkHbarBalance(accountId)
  
  if (balance < minBalance) {
    throw new Error(
      `Auto-top-up failed: balance still ${balance} HBAR after top-up request`
    )
  }
  
  console.log(`[HBAR Guardrail] Balance restored: ${balance} HBAR`)
}

/**
 * Check if balance is low (for warnings)
 */
export function isBalanceLow(balance: number): boolean {
  return balance < 0.5
}

/**
 * Check if balance is critical (for errors)
 */
export function isBalanceCritical(balance: number): boolean {
  return balance < 0.1
}
