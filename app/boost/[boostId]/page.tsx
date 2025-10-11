import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isValidBoostId } from '@/lib/ids/boostId'
import { BoostViewer } from './BoostViewer'
import { signalsStore } from '@/lib/stores/signalsStore'

interface PageProps {
  params: {
    boostId: string
  }
}

// Generate metadata for social sharing
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { boostId } = await params
  
  if (!isValidBoostId(boostId)) {
    return {
      title: 'Invalid Boost Link',
      description: 'This boost link is not valid.'
    }
  }

  // TODO: In production, fetch signal metadata for better social sharing
  return {
    title: `🔥 GenZ Signal Boost - TrustMesh`,
    description: `Check out this signal from TrustMesh - tap ⚡ Boost or 🔁 Suggest to join the conversation!`,
    openGraph: {
      title: `🔥 GenZ Signal Boost`,
      description: `Check out this signal from TrustMesh - tap ⚡ Boost or 🔁 Suggest!`,
      type: 'website',
      siteName: 'TrustMesh',
    },
    twitter: {
      card: 'summary',
      title: `🔥 GenZ Signal Boost`,
      description: `Check out this signal from TrustMesh - tap ⚡ Boost or 🔁 Suggest!`,
    }
  }
}

export default async function BoostPage({ params }: PageProps) {
  const { boostId } = await params

  // Validate boost ID format
  if (!isValidBoostId(boostId)) {
    notFound()
  }

  // TODO: In production, this would fetch from database or HCS query service
  // For now, we'll pass the boostId to the client component to handle loading
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900">
      <BoostViewer boostId={boostId} />
    </div>
  )
}