import { NextRequest, NextResponse } from 'next/server'
import { Magic } from '@magic-sdk/admin'
import {  Client, AccountBalanceQuery, TransferTransaction, Hbar, AccountId } from '@hashgraph/sdk'
import { logTxServer } from '@/lib/telemetry/txLog'

const magic = new Magic(process.env.MAGIC_SECRET_KEY!)

// Top-up thresholds
const TOP_UP_THRESHOLD = 0.005 // HBAR - trigger top-up when below this
const TOP_UP_AMOUNT = 0.1 // HBAR - amount to top-up

/**
 * Auto top-up user's HBAR balance for gas fees
 * 
 * POST /api/hedera/topup
 * Body: { accountId: string }
 * Authorization: Bearer <Magic DID token>
 */
export async function POST(req: NextRequest) {
  try {
    // 1) Validate Magic DID token
    const auth = req.headers.get('Authorization') || ''
    const didToken = auth.replace(/^Bearer\s+/i, '')
    if (!didToken) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
    }
    
    await magic.token.validate(didToken)
    const meta = await magic.users.getMetadataByToken(didToken)

    // 2) Parse request
    const body = await req.json()
    const { accountId } = body

    if (!accountId) {
      return NextResponse.json({ error: 'Missing accountId' }, { status: 400 })
    }

    // 3) Check current balance
    const client = Client.forTestnet()
    const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!)
    const operatorKey = process.env.HEDERA_OPERATOR_KEY!
    
    client.setOperator(operatorId, operatorKey)

    const balanceQuery = new AccountBalanceQuery()
      .setAccountId(AccountId.fromString(accountId))
    
    const balance = await balanceQuery.execute(client)
    const hbarBalance = balance.hbars.toBigNumber().toNumber()

    console.log(`[topup] Account ${accountId} has ${hbarBalance} HBAR`)

    // 4) Top-up if below threshold
    if (hbarBalance < TOP_UP_THRESHOLD) {
      console.log(`[topup] Balance below ${TOP_UP_THRESHOLD}, topping up ${TOP_UP_AMOUNT} HBAR`)

      const transferTx = await new TransferTransaction()
        .addHbarTransfer(operatorId, new Hbar(-TOP_UP_AMOUNT))
        .addHbarTransfer(AccountId.fromString(accountId), new Hbar(TOP_UP_AMOUNT))
        .execute(client)

      const receipt = await transferTx.getReceipt(client)
      const txId = transferTx.transactionId.toString()

      console.log(`[topup] Top-up successful: ${txId}`)
      
      // Log successful top-up
      logTxServer({
        action: "TOPUP_HBAR",
        status: "SUCCESS",
        accountId,
        txId,
        meta: { amount: TOP_UP_AMOUNT }
      })

      return NextResponse.json({
        ok: true,
        toppedUp: true,
        amount: TOP_UP_AMOUNT,
        newBalance: hbarBalance + TOP_UP_AMOUNT,
        transactionId: txId
      })
    } else {
      console.log(`[topup] Balance sufficient, no top-up needed`)
      
      return NextResponse.json({
        ok: true,
        toppedUp: false,
        currentBalance: hbarBalance,
        threshold: TOP_UP_THRESHOLD
      })
    }
  } catch (e: any) {
    console.error('[topup] Error:', e)
    
    // Log failed top-up
    const body = await req.json().catch(() => ({}))
    logTxServer({
      action: "TOPUP_HBAR",
      status: "ERROR",
      accountId: body?.accountId,
      meta: { error: e.message }
    })
    
    return NextResponse.json({ 
      error: e.message || 'TOP_UP_FAILED' 
    }, { status: 500 })
  }
}
