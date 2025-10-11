import { NextRequest, NextResponse } from 'next/server'

interface PageProps {
  params: {
    userId: string
  }
}

export async function GET(req: NextRequest, { params }: PageProps) {
  try {
    const { userId } = await params
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Extract handle from userId (remove tm- prefix if present)
    const handle = userId.replace('tm-', '')
    
    // Mock profile data - in production this would query KNS or profile service
    const publicProfile = {
      userId,
      handle,
      displayName: handle.charAt(0).toUpperCase() + handle.slice(1).replace('-', ' '),
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