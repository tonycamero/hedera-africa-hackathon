"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CircleRedirect() {
  const router = useRouter()

  useEffect(() => {
    // 302 redirect to the new inner-circle route
    router.replace('/inner-circle')
  }, [router])

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-float">🔄</div>
        <div className="text-genz-text">Redirecting to Inner Circle...</div>
      </div>
    </div>
  )
}