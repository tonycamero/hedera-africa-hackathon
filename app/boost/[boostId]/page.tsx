import { Metadata } from 'next'
import { BoostViewer } from './BoostViewer'

interface PageProps {
  params: {
    boostId: string
  }
}

// Generate metadata for social sharing
export async function generateMetadata(): Promise<Metadata> {
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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900">
      <BoostViewer boostId={boostId} />
    </div>
  )
}
