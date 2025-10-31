// lib/services/trstBalanceService.ts

const MIRROR_BASE = process.env.HEDERA_MIRROR_BASE || "https://testnet.mirrornode.hedera.com"
const TRST_TOKEN_ID = process.env.NEXT_PUBLIC_TRST_TOKEN_ID || "0.0.5361653"

export interface TRSTBalance {
  accountId: string
  balance: number
  decimals: number
  tokenId: string
  lastUpdated: string
  isDemo?: boolean // Flag for demo/stub balances
}

/**
 * Get TRST token balance for a Hedera account from Mirror Node
 */
export async function getTRSTBalance(accountId: string): Promise<TRSTBalance> {
  try {
    const url = `${MIRROR_BASE}/api/v1/accounts/${accountId}/tokens?token.id=${TRST_TOKEN_ID}`
    
    console.log(`[TRST Balance] Fetching balance for ${accountId}`)
    
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Mirror Node responded with ${response.status}`)
    }

    const data = await response.json()
    const tokenData = data.tokens?.[0]

    if (!tokenData) {
      // Account has no TRST tokens associated
      return {
        accountId,
        balance: 0,
        decimals: 0,
        tokenId: TRST_TOKEN_ID,
        lastUpdated: new Date().toISOString()
      }
    }

    // Convert balance from smallest unit (considering decimals)
    const balance = parseInt(tokenData.balance) / Math.pow(10, tokenData.decimals || 0)

    console.log(`[TRST Balance] ${accountId} has ${balance} TRST`)

    return {
      accountId,
      balance,
      decimals: tokenData.decimals || 0,
      tokenId: TRST_TOKEN_ID,
      lastUpdated: new Date().toISOString()
    }
  } catch (error: any) {
    console.error(`[TRST Balance] Error fetching balance for ${accountId}:`, error.message)
    throw new Error(`Failed to fetch TRST balance: ${error.message}`)
  }
}

/**
 * Check if account has sufficient TRST balance
 */
export async function hasSufficientTRST(
  accountId: string,
  requiredAmount: number
): Promise<{ sufficient: boolean; current: number; required: number }> {
  const balanceInfo = await getTRSTBalance(accountId)
  
  return {
    sufficient: balanceInfo.balance >= requiredAmount,
    current: balanceInfo.balance,
    required: requiredAmount
  }
}

/**
 * Debit TRST from user's balance (record transaction)
 * 
 * **HACKATHON/DEMO MODE**: This only records the debit in-memory.
 * In production, this would trigger actual TRST token transfers via TransferTransaction.
 * 
 * Note: This records the intent. Actual token transfer happens via Hedera transaction.
 */
export interface TRSTDebitRecord {
  accountId: string
  amount: number
  action: string
  timestamp: string
  transactionId?: string
}

// In-memory debit ledger (HACKATHON/DEMO - in production, use database + actual token transfers)
const debitLedger: TRSTDebitRecord[] = []

export function recordTRSTDebit(
  accountId: string,
  amount: number,
  action: string,
  transactionId?: string
): TRSTDebitRecord {
  const record: TRSTDebitRecord = {
    accountId,
    amount,
    action,
    timestamp: new Date().toISOString(),
    transactionId
  }
  
  debitLedger.push(record)
  
  console.log(`[TRST Debit] Recorded ${amount} TRST debit for ${accountId} (${action})`)
  
  return record
}

/**
 * Get debit history for an account
 */
export function getDebitHistory(accountId: string): TRSTDebitRecord[] {
  return debitLedger.filter(record => record.accountId === accountId)
}

/**
 * Calculate total debits for an account
 */
export function getTotalDebits(accountId: string): number {
  return debitLedger
    .filter(record => record.accountId === accountId)
    .reduce((sum, record) => sum + record.amount, 0)
}

/**
 * Get adjusted TRST balance (on-chain balance minus in-memory debits)
 * 
 * This provides accurate balance display in DEMO/HACKATHON mode where
 * debits are recorded in-memory but not yet executed on-chain.
 * 
 * In production, once debits trigger actual token transfers, this function
 * can be simplified to just call getTRSTBalance().
 */
export async function getAdjustedTRSTBalance(accountId: string): Promise<TRSTBalance> {
  const onChainBalance = await getTRSTBalance(accountId)
  const totalDebits = getTotalDebits(accountId)
  
  const adjustedBalance = Math.max(0, onChainBalance.balance - totalDebits)
  
  console.log(`[TRST Balance] Adjusted balance for ${accountId}: ${onChainBalance.balance} - ${totalDebits} = ${adjustedBalance}`)
  
  return {
    ...onChainBalance,
    balance: adjustedBalance,
    isDemo: totalDebits > 0 // Flag to indicate this includes in-memory adjustments
  }
}
