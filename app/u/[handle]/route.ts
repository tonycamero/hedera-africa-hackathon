import { NextRequest, NextResponse } from 'next/server'

interface PageProps {
  params: {
    handle: string
  }
}

export async function GET(req: NextRequest, { params }: PageProps) {
  try {
    const { handle } = await params
    
    if (!handle) {
      return NextResponse.json({ error: 'Handle required' }, { status: 400 })
    }

    // Mock profile data - in production this would query KNS or profile service
    const publicProfile = {
      handle,
      displayName: handle.charAt(0).toUpperCase() + handle.slice(1),
      avatar: null, // No avatars in demo
      verified: false,
      accountId: `0.0.${Math.floor(Math.random() * 1000000)}`, // Mock account ID
      bio: "Building on Hedera 🚀",
      publicKey: "mock_public_key",
      trustScore: Math.floor(Math.random() * 100) + 1,
      signalsReceived: Math.floor(Math.random() * 50) + 1,
      isActive: true
    }

    return NextResponse.json({
      success: true,
      profile: publicProfile
    })

  } catch (error) {
    console.error('[Public Profile API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to load profile' },
      { status: 500 }
    )
  }
}