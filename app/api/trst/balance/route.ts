import { NextRequest, NextResponse } from "next/server"
import { getTRSTBalance } from "@/lib/services/trstBalanceService"

export async function GET(req: NextRequest) {
  try {
    const accountId = req.nextUrl.searchParams.get("accountId")
    if (!accountId) {
      return NextResponse.json({ error: "Missing accountId" }, { status: 400 })
    }
    
    // Reject legacy demo IDs
    if (accountId.startsWith('tm-')) {
      return NextResponse.json(
        { error: 'Invalid account ID - demo accounts not supported. Please sign in with Magic.' },
        { status: 400 }
      )
    }
    
    // Validate Hedera account ID format (0.0.XXXXX)
    if (!accountId.match(/^0\.0\.\d+$/)) {
      return NextResponse.json(
        { error: 'Invalid Hedera account ID format' },
        { status: 400 }
      )
    }

    const balance = await getTRSTBalance(accountId)
    
    return NextResponse.json({ 
      balance,
      accountId,
      timestamp: Date.now()
    })
  } catch (e: any) {
    console.error('[API /trst/balance] Error:', e)
    return NextResponse.json(
      { error: e?.message ?? "Failed to fetch TRST balance" }, 
      { status: 500 }
    )
  }
}
