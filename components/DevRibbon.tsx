'use client'

export function DevRibbon() {
  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-yellow-400/90 text-black text-xs font-bold px-2 py-1 rounded shadow-lg">
      MOCK DATA
    </div>
  )
}