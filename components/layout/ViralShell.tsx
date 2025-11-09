'use client'

import { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

/**
 * ViralShell - Minimal chrome for public viral landing pages
 * Optimized for sharing and conversion
 */
export function ViralShell({ 
  children,
  showBackButton = true 
}: { 
  children: ReactNode
  showBackButton?: boolean
}) {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900">
      {/* Minimal header for viral pages */}
      {showBackButton && (
        <div className="p-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      )}
      
      {/* Content */}
      {children}
    </div>
  )
}
