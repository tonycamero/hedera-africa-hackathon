import { NextRequest, NextResponse } from "next/server"
import { parseHrl } from "@/lib/utils/hrl"
import { HRL_DEMO_PROFILES } from "@/lib/services/profileService"

const MIRROR_BASE = process.env.HEDERA_MIRROR_BASE || "https://testnet.mirrornode.hedera.com"

export async function GET(req: NextRequest) {
  try {
    const hrl = req.nextUrl.searchParams.get("hrl")
    if (!hrl) {
      return NextResponse.json({ 
        ok: false, 
        error: "missing hrl parameter" 
      }, { status: 400 })
    }

    const { topic, seq } = parseHrl(hrl)

    // Fetch from Hedera Mirror Node
    const url = `${MIRROR_BASE}/api/v1/topics/${topic}/messages/${seq}`
    console.log(`[HCS Profile] Fetching: ${url}`)
    
    const response = await fetch(url, { 
      cache: "no-store",
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Mirror Node responded with ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    const base64Message = data?.message
    
    if (!base64Message) {
      throw new Error("No message content found")
    }

    // Decode base64 message
    const messageJson = JSON.parse(Buffer.from(base64Message, "base64").toString("utf8"))
    
    // Extract profile from the PROFILE_UPDATE payload
    const profile = messageJson?.payload || messageJson

    console.log(`[HCS Profile] Successfully fetched profile for HRL: ${hrl}`)

    return NextResponse.json({ 
      ok: true, 
      profile,
      hrl,
      source: "mirror_node"
    })

  } catch (error: any) {
    console.warn(`[HCS Profile] Error fetching profile:`, error.message)
    
    // Check demo profiles first before generic fallback
    const hrl = req.nextUrl.searchParams.get("hrl")
    let fallbackProfile = HRL_DEMO_PROFILES[hrl || ''] || {
      handle: "Unknown User",
      bio: "Profile unavailable",
      visibility: "public",
      verified: false
    }

    return NextResponse.json({ 
      ok: false, 
      profile: fallbackProfile,
      error: error.message || "Failed to fetch profile",
      hrl,
      source: "fallback"
    }, { status: 200 }) // Return 200 so UI can still render
  }
}