import type { NextApiRequest, NextApiResponse } from "next"
import { Client, PrivateKey, AccountBalanceQuery, AccountId } from "@hashgraph/sdk"

interface TestResponse {
  success: boolean
  operatorId?: string
  publicKey?: string
  balance?: string
  network?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TestResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" })
  }

  try {
    // Get server-side credentials
    const operatorId = process.env.HEDERA_OPERATOR_ID
    const operatorKey = process.env.HEDERA_OPERATOR_KEY
    const network = process.env.HEDERA_NETWORK || "testnet"

    if (!operatorId || !operatorKey) {
      return res.status(500).json({ 
        success: false, 
        error: "Missing operator credentials" 
      })
    }

    console.log(`[HCS Test] Testing operator ${operatorId} on ${network}`)

    // Initialize Hedera client
    const client = (network === "mainnet" ? Client.forMainnet() : Client.forTestnet())
    
    // Parse private key
    let privateKey: PrivateKey
    try {
      if (operatorKey.startsWith('0x')) {
        const keyWithoutPrefix = operatorKey.slice(2)
        privateKey = PrivateKey.fromStringECDSA(keyWithoutPrefix)
      } else if (operatorKey.length === 64) {
        privateKey = PrivateKey.fromStringECDSA(operatorKey)
      } else {
        privateKey = PrivateKey.fromString(operatorKey)
      }
      
      console.log(`[HCS Test] Private key parsed, public key: ${privateKey.publicKey.toString()}`)
    } catch (keyError) {
      console.error(`[HCS Test] Failed to parse private key:`, keyError)
      return res.status(500).json({ 
        success: false, 
        error: `Invalid private key format: ${keyError.message}` 
      })
    }
    
    client.setOperator(operatorId, privateKey)

    // Test account balance query
    const accountBalance = await new AccountBalanceQuery()
      .setAccountId(AccountId.fromString(operatorId))
      .execute(client)

    console.log(`[HCS Test] Account balance: ${accountBalance.hbars.toString()}`)

    return res.status(200).json({
      success: true,
      operatorId,
      publicKey: privateKey.publicKey.toString(),
      balance: accountBalance.hbars.toString(),
      network,
    })

  } catch (error: any) {
    console.error("[HCS Test] Test failed:", error)
    
    return res.status(500).json({ 
      success: false, 
      error: error?.message || "Unknown error" 
    })
  }
}