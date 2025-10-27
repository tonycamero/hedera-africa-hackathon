import { NextRequest, NextResponse } from "next/server"
import { getTRSTBalance } from "@/lib/services/trstBalanceService"

export async function GET(req: NextRequest) {
  try {
    const accountId = req.nextUrl.searchParams.get("accountId")
    if (!accountId) {
      return NextResponse.json({ error: "Missing accountId" }, { status: 400 })
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
