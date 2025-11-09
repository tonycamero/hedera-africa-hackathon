"use client"

// HeaderModeChips component simplified - demo functionality removed
// This component now serves as a clean development indicator only

export function HeaderModeChips() {
  // In production, this component is completely hidden
  // In development, it shows minimal status information
  
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-500 text-xs">
        Dev Mode
      </span>
    </div>
  )
}

